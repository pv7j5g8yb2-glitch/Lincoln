"use client";

import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import ExportMenu, { type ExportItem } from "./ExportMenu";
import { saveDraftEdit } from "@/lib/actions";
import { notify } from "./Toaster";
import type { Section, Seg } from "@/lib/halasz";

type Hover = { doc?: string; page: number; x: number; y: number } | null;

type Props = { caseId: string; draftId: string; title: string; subtitle: string; sections: Section[]; facts: number; calls: number; notes: number; status: string; generic?: boolean; by?: string; exports: ExportItem[] };

const PAGE_REF = /\((?:pp?\.|page)\s?(\d+)[^)]*\)|\[Attorney:[^\]]*\]/g;

// A paragraph as the text an attorney edits: page references stay as (p. 12), attorney notes as [Attorney: ...].
const asText = (p: Seg[]) => p.map((g) => (g.k === "note" ? ` [Attorney: ${g.t.trim()}]` : g.k === "fact" && g.page ? `${g.t} (p. ${g.page})` : g.t)).join("").trim();

/** A textarea that grows with its text, set in the draft's own type. */
function Grow({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const el = ref.current; if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; } }, [value]);
  return <textarea ref={ref} value={value} rows={1} onChange={(e) => onChange(e.target.value)} className={clsx("w-full resize-none overflow-hidden rounded-md bg-transparent outline-none ring-line transition focus:bg-panel/60 focus:ring-1", className)} />;
}

export default function DraftView({ caseId, draftId, title, subtitle, sections, facts, calls, notes, status, generic, by, exports }: Props) {
  const [focus, setFocus] = useState(false);
  const [editing, setEditing] = useState<{ heading: string; paras: string[] }[] | null>(null);
  const [pending, start] = useTransition();
  const save = () => start(async () => {
    if (!editing) return;
    const r = await saveDraftEdit(draftId, editing.map((s) => ({ heading: s.heading, paras: s.paras.flatMap((p) => p.split(/\n\s*\n/)) })));
    if (r && "error" in r && r.error) { notify(r.error); return; }
    setEditing(null); notify("Saved");
  });
  const [hover, setHover] = useState<Hover>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const close = () => setHover(null);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, []);

  const show = (page: number, doc: string | undefined, el: HTMLElement) => {
    if (timer.current) clearTimeout(timer.current);
    const r = el.getClientRects()[0] ?? el.getBoundingClientRect();
    const w = Math.min(340, window.innerWidth - 24);
    const x = Math.max(12, Math.min(r.left, window.innerWidth - w - 12));
    const below = r.bottom + 8;
    const y = below + 300 > window.innerHeight ? Math.max(12, r.top - 308) : below;
    setHover({ doc, page, x, y });
  };
  const hide = () => {
    timer.current = setTimeout(() => setHover(null), 120);
  };

  // Plain drafts carry their sources as (p. 12) and their open points as [Attorney: ...].
  const plain = (text: string, key: number) => {
    const out: React.ReactNode[] = [];
    let last = 0;
    for (const m of text.matchAll(PAGE_REF)) {
      if (m.index! > last) out.push(<span key={`${key}-${last}`} className={focus ? "text-faint" : undefined}>{text.slice(last, m.index)}</span>);
      if (m[1]) {
        const page = Number(m[1]);
        out.push(<a key={`${key}-p${m.index}`} href={`/api/pages/${caseId}/${page}`} target="_blank" onMouseEnter={(e) => show(page, undefined, e.currentTarget)} onMouseLeave={hide} className="whitespace-nowrap font-sans text-[12px] text-muted underline decoration-dotted underline-offset-4 hover:text-ink">{m[0]}</a>);
      } else {
        out.push(<span key={`${key}-n${m.index}`} className="font-sans text-[12.5px] italic text-ink"> {m[0]}</span>);
      }
      last = m.index! + m[0].length;
    }
    if (last < text.length) out.push(<span key={`${key}-end`} className={focus ? "text-faint" : undefined}>{text.slice(last)}</span>);
    return out;
  };

  const seg = (g: Seg, k: number) =>
    g.k === "fact" ? (
      <span key={k} tabIndex={0} onMouseEnter={(e) => g.page && show(g.page, g.doc, e.currentTarget)} onMouseLeave={hide} onClick={(e) => g.page && show(g.page, g.doc, e.currentTarget)} className={clsx("cursor-help decoration-ink/35 decoration-dotted underline-offset-[5px]", focus ? "text-faint" : "underline")}>{g.t}</span>
    ) : g.k === "call" ? (
      <mark key={k} className="rounded-[2px] bg-panel px-0.5 text-ink">{g.t}</mark>
    ) : g.k === "note" ? (
      <span key={k} className="font-sans text-[12.5px] italic text-ink"> [Attorney: {g.t.trim()}]</span>
    ) : generic ? (
      <Fragment key={k}>{plain(g.t, k)}</Fragment>
    ) : (
      <span key={k} className={focus ? "text-faint" : undefined}>{g.t}</span>
    );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="mr-auto min-w-0">
          <div className="truncate text-[14px] font-medium">{title}</div>
          <div className="text-[12.5px] text-faint">{status === "approved" ? "Approved" : "Draft for review"} · {facts} sourced facts{calls ? ` · ${calls} judgment calls` : ""}{notes ? ` · ${notes} attorney notes` : ""}{by ? ` · ${by}` : ""}</div>
        </div>
        {editing ? (
          <>
            <button disabled={pending} onClick={() => setEditing(null)} className="h-8 rounded-lg px-3 text-[12.5px] font-medium text-muted transition hover:bg-panel hover:text-ink">Cancel</button>
            <button disabled={pending} onClick={save} className="h-8 rounded-lg bg-ink px-3.5 text-[12.5px] font-medium text-canvas transition hover:opacity-90 disabled:opacity-50">{pending ? "Saving" : "Save"}</button>
          </>
        ) : (
          <>
            <button onClick={() => setFocus((v) => !v)} className={clsx("h-8 rounded-lg border px-3 text-[12.5px] font-medium transition", focus ? "border-ink bg-ink text-canvas" : "border-line bg-card hover:bg-panel")}>Review mode</button>
            <button onClick={() => { setFocus(false); setEditing(sections.map((s) => ({ heading: s.heading, paras: s.paras.map(asText) }))); }} className="h-8 rounded-lg border border-line bg-card px-3 text-[12.5px] font-medium transition hover:bg-panel">Edit</button>
            <ExportMenu items={exports} label="Open" />
          </>
        )}
      </div>

      <article className="mx-auto max-w-[740px] rounded-xl border border-line bg-card px-5 py-9 shadow-[0_1px_3px_rgba(22,22,20,0.04)] md:px-14 md:py-14">
        <h2 className="serif mb-1 text-[22px] font-medium">{title}</h2>
        <p className="mb-10 text-[12.5px] text-faint">{subtitle}</p>
        {editing ? editing.map((s, si) => (
          <section key={si} className="mb-8">
            {(s.heading || si > 0) && <Grow value={s.heading} onChange={(v) => setEditing((e) => e!.map((x, i) => (i === si ? { ...x, heading: v } : x)))} className="serif mb-1 px-1 text-[16.5px] font-medium" />}
            {s.paras.map((p, pi) => (
              <Grow key={pi} value={p} onChange={(v) => setEditing((e) => e!.map((x, i) => (i === si ? { ...x, paras: x.paras.map((q, j) => (j === pi ? v : q)) } : x)))} className="serif mb-2.5 px-1 text-[15px] leading-[1.75]" />
            ))}
          </section>
        )) : sections.map((s) => (
          <section key={s.id} className="mb-8">
            {s.heading && <h3 className="serif mb-1 text-[16.5px] font-medium">{s.heading}</h3>}
            {s.cite && <p className="mb-2 text-[12px] text-faint">{s.cite}</p>}
            {s.paras.map((p, i) => (
              <p key={i} className={clsx("serif mb-3.5 text-[15px] leading-[1.75]", generic && "whitespace-pre-line")} style={{ fontVariationSettings: '"opsz" 12', letterSpacing: 0 }}>
                {p.map(seg)}
              </p>
            ))}
          </section>
        ))}
        <p className="mt-12 border-t border-line pt-4 text-[12px] text-faint">Prepared for attorney review. Not legal advice.</p>
      </article>

      {hover && (
        <div className="rise fixed z-50 w-[340px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-line bg-card shadow-[0_16px_44px_-14px_rgba(22,22,20,0.35)]" style={{ left: hover.x, top: hover.y }} onMouseEnter={() => timer.current && clearTimeout(timer.current)} onMouseLeave={hide}>
          <div className="border-b border-line px-3.5 py-2">
            {hover.doc && <div className="truncate text-[12.5px] font-medium">{hover.doc}</div>}
            <div className="text-[11.5px] text-faint">Client file, page {hover.page}</div>
          </div>
          <a href={`/api/pages/${caseId}/${hover.page}`} target="_blank" className="block h-[220px] overflow-hidden bg-panel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/pages/${caseId}/${hover.page}`} alt={`Page ${hover.page}`} className="w-full" />
          </a>
        </div>
      )}
    </div>
  );
}
