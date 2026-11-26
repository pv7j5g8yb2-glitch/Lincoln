"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Check, FileText, Folder } from "lucide-react";
import { acceptAllRecommended, answerQuestion, chooseFolder, decideApproval, saveMessage } from "@/lib/actions";
import type { Question } from "@/lib/halasz";
import { btn as B } from "./ui";

type Props = {
  id: string;
  caseId: string;
  kind: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  message?: { party: string; party_role: string | null; subject: string; body: string } | null;
  /** False when this person may not give this approval (filings are signed off by a lawyer). */
  canApprove?: boolean;
};

const box = "border border-line bg-card";

export default function ApprovalPanel({ id, caseId, kind, payload, message, canApprove = true }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState(message?.subject ?? "");
  const [body, setBody] = useState(message?.body ?? "");
  const [editing, setEditing] = useState(false);
  const [sending, setSending] = useState<"" | "busy" | "sent">("");
  const router = useRouter();
  const btn = useRef<HTMLButtonElement>(null);
  const save = () =>
    start(async () => {
      setError(null);
      try {
        await saveMessage(id, subject, body);
        setEditing(false);
      } catch {
        setError("Not saved.");
      }
    });
  const cancel = () => {
    setSubject(message?.subject ?? "");
    setBody(message?.body ?? "");
    setEditing(false);
  };
  const decide = (d: "approved" | "rejected") =>
    start(async () => {
      setError(null);
      try {
        const r = await decideApproval(id, d);
        if (r && "error" in r) setError(r.error ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "The action failed. Nothing was changed.");
      }
    });

  // Approve and send: the button turns, then reads "Sent!", then the next item comes up.
  // Kept outside a transition so each state paints as it happens.
  const send = async () => {
    setError(null);
    setSending("busy");
    try {
      const r = await decideApproval(id, "approved", true);
      if (r && "error" in r) { setError(r.error ?? "Not sent."); setSending(""); return; }
      if (r && "sent" in r && !r.sent) { setError("Approved, not sent."); setSending(""); return; }
      setSending("sent");
      await new Promise((ok) => setTimeout(ok, 1100));
      // The sent item leaves (its row folds away in the list), then the next one comes in.
      const item = btn.current?.closest<HTMLElement>("[data-item]");
      const row = document.querySelector<HTMLElement>(`[data-row="${id}"]`);
      if (row) { row.style.height = `${row.offsetHeight}px`; row.style.overflow = "hidden"; void row.offsetHeight; row.classList.add("row-out"); }
      item?.classList.add("item-out");
      await Promise.all([item, row].flatMap((el) => (el ? el.getAnimations().map((a) => a.finished.catch(() => {})) : [])));
      start(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "The action failed. Nothing was changed.");
      setSending("");
    }
  };

  const footer = (text: string, disabled = false) => (
    <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-2 border-t border-line bg-card/95 py-3 backdrop-blur">
      {canApprove ? (
        <button disabled={pending || disabled} onClick={() => decide("approved")} className={B.primary}>
          <Check size={14} /> {text}
        </button>
      ) : <span className="flex h-9 items-center bg-panel px-3.5 text-[13px] text-muted">For attorney approval</span>}
      <button disabled={pending} onClick={() => decide("rejected")} className={B.secondary}>Return</button>
      {error && <span className="text-[12.5px] text-risk">{error}</span>}
    </div>
  );

  if (kind === "folder") {
    const opts = (payload.options ?? []) as { id: string; name: string; url: string }[];
    const pickOne = (i: number) => start(async () => { setError(null); try { await chooseFolder(id, i); } catch { setError("Not saved."); } });
    return (
      <div>
        <ul className={clsx(box, "divide-y divide-line overflow-hidden")}>
          {opts.map((o, i) => (
            <li key={o.id} className="flex items-center gap-3 px-4 py-3">
              <Folder size={16} className="shrink-0 text-muted" />
              <a href={o.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-[14px] font-medium underline decoration-line underline-offset-4 hover:decoration-ink">{o.name}</a>
              <button disabled={pending} onClick={() => pickOne(i)} className={`${B.primary} shrink-0`}>Use</button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center gap-3">
          <button disabled={pending} onClick={() => pickOne(-1)} className={B.secondary}>Lincoln folder</button>
          {error && <span className="text-[12.5px] text-risk">{error}</span>}
        </div>
      </div>
    );
  }

  if (kind === "decisions") {
    const qs = payload.questions as Question[];
    const done = qs.filter((q) => q.answer).length;
    return (
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-[3px] w-24 overflow-hidden bg-line"><div className="h-full bg-ink transition-all" style={{ width: `${(done / qs.length) * 100}%` }} /></div>
            <span className="text-[12.5px] text-muted">{done} of {qs.length}</span>
          </div>
          {done < qs.length && <button disabled={pending} onClick={() => start(() => acceptAllRecommended(id))} className={B.secondary}>Accept recommendations</button>}
        </div>
        <ol className="border-t border-line">
          {qs.map((q, i) => (
            <li key={q.id} className="border-b border-line py-5">
              <div className="mb-1 text-[12px] text-faint">{i + 1} · {q.topic}</div>
              <p className="mb-2 text-[14.5px] font-medium leading-snug">{q.q}</p>
              <ul className="mb-2.5 flex flex-col gap-0.5">
                {q.evidence.map((e, k) => (
                  <li key={k} className="text-[13px] leading-relaxed text-muted">
                    {e.t}{e.page && <a href={`/api/pages/${caseId}/${e.page}`} target="_blank" className="ml-1.5 whitespace-nowrap text-[12px] underline decoration-line underline-offset-4 hover:text-ink hover:decoration-ink">p. {e.page}</a>}
                  </li>
                ))}
              </ul>
              <p className="mb-3 text-[13px] leading-relaxed"><span className="font-medium">Recommended: {q.recommend === "yes" ? "Yes" : "No"}.</span> <span className="text-muted">{q.why}</span></p>
              <div className="inline-flex border border-line p-0.5">
                {(["yes", "no", "change"] as const).map((a) => (
                  <button key={a} disabled={pending} onClick={() => start(() => answerQuestion(id, q.id, a))} className={clsx("h-7 px-3.5 text-[12.5px] font-medium transition", q.answer === a ? "bg-ink text-canvas" : "text-muted hover:text-ink")}>
                    {a === "yes" ? "Yes" : a === "no" ? "No" : "More evidence"}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ol>
        {footer("Confirm and draft", done < qs.length)}
      </div>
    );
  }

  if (kind === "message" && message) {
    const ghost = "h-9 border border-line bg-card px-3.5 text-[13px] font-medium transition hover:bg-panel disabled:opacity-40";
    return (
      <div>
        <div className={clsx(box, editing && "border-edge")}>
          <div className="border-b border-line px-5 py-3 text-[13px]">
            <div className="flex gap-3"><span className="w-14 shrink-0 text-faint">To</span><span>{message.party} <span className="text-faint">{message.party_role}</span></span></div>
            <div className="flex items-center gap-3"><span className="w-14 shrink-0 text-faint">Subject</span>
              {editing ? <input value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject" className="min-w-0 flex-1 bg-transparent font-medium outline-none" /> : <span className="font-medium">{subject}</span>}
            </div>
          </div>
          {editing ? (
            <textarea autoFocus value={body} onChange={(e) => setBody(e.target.value)} aria-label="Message" rows={Math.min(30, Math.max(8, body.split("\n").length + 2))} className="block w-full resize-y bg-transparent px-5 py-5 text-[13.5px] leading-relaxed outline-none" />
          ) : (
            <p onClick={() => setEditing(true)} className="cursor-text whitespace-pre-line px-5 py-5 text-[13.5px] leading-relaxed">{body}</p>
          )}
        </div>
        <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-2 border-t border-line bg-card/95 py-3 backdrop-blur">
          {editing ? (
            <>
              <button disabled={pending || !body.trim()} onClick={save} className={B.primary}><Check size={14} /> Save</button>
              <button disabled={pending} onClick={cancel} className={ghost}>Cancel</button>
            </>
          ) : (
            <>
              <button ref={btn} disabled={pending || sending !== ""} onClick={send} className={`${B.primary} relative`}>
                <span className={clsx("flex items-center gap-1.5", sending && "invisible")}><Check size={14} /> Approve and send</span>
                {sending && <span className="absolute inset-0 flex items-center justify-center">{sending === "busy" ? <span aria-label="Sending" className="h-4 w-4 animate-spin rounded-full border-2 border-canvas/25 border-t-canvas" /> : "Sent!"}</span>}
              </button>
              <button disabled={pending} onClick={() => setEditing(true)} className={ghost}>Edit</button>
            </>
          )}
          {error && <span className="text-[12.5px] text-risk">{error}</span>}
        </div>
      </div>
    );
  }

  if (kind === "packet") {
    const plan = payload as { forms: { code: string; title: string; answered: number; fields: number; ready: boolean }[]; letters: { title: string; notes: number }[]; exhibits: { n: number; title: string; pages: number }[]; issues: string[] };
    const before = [
      ...plan.issues,
      ...plan.letters.filter((l) => l.notes > 0).map((l) => `${l.title}: ${l.notes} attorney ${l.notes === 1 ? "note" : "notes"} left`),
      ...plan.forms.filter((f) => !f.ready).map((f) => `Form ${f.code} not filled`),
    ];
    const row = "flex items-baseline gap-3 border-b border-line py-2.5 text-[13px]";
    return (
      <div>
        {before.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-1 text-[13px] font-medium">Before filing</h3>
            <ul className="border-t border-line">{before.map((b, i) => <li key={i} className={row}><span className="h-1.5 w-1.5 shrink-0 translate-y-[-2px] rounded-full bg-risk" />{b}</li>)}</ul>
          </div>
        )}
        <h3 className="mb-1 text-[13px] font-medium">Contents</h3>
        <ul className="border-t border-line">
          <li className={row}><span className="flex-1">Cover letter</span></li>
          {plan.forms.filter((f) => f.ready).map((f) => <li key={f.code} className={row}><span className="w-[64px] shrink-0 font-medium">{f.code}</span><span className="min-w-0 flex-1 truncate">{f.title}</span><span className="shrink-0 text-[12px] text-faint">{f.answered} of {f.fields}</span></li>)}
          {plan.letters.map((l, i) => <li key={i} className={row}><span className="min-w-0 flex-1 truncate">{l.title}</span></li>)}
          {plan.exhibits.length > 0 && <li className={row}><span className="flex-1">Exhibits 1 to {plan.exhibits.length}, with an index</span><span className="shrink-0 text-[12px] text-faint">{plan.exhibits.reduce((n, e) => n + e.pages, 0)} pages</span></li>}
        </ul>
        <a href={`/api/packet?case=${caseId}`} target="_blank" className={clsx(box, "mt-5 flex items-center gap-3 px-4 py-4 transition hover:border-ink")}>
          <FileText size={18} className="text-muted" />
          <span className="flex-1 text-[14px] font-medium">Open packet</span>
        </a>
        {footer("Approve for filing")}
      </div>
    );
  }

  if (kind === "redline") {
    return (
      <div>
        <a href={payload?.docUrl ?? `/api/redline/${payload?.fileId ?? ""}`} target={payload?.docUrl ? "_blank" : undefined} rel="noreferrer" className={clsx(box, "flex items-center gap-3 px-4 py-4 transition hover:border-ink")}>
          <FileText size={18} className="text-muted" />
          <span className="flex-1 text-[14px] font-medium">{payload?.docUrl ? "Open in Google Docs" : "Open in Word"}</span>
        </a>
        {footer("Done")}
      </div>
    );
  }

  if (kind === "draft_review" || kind === "translation") {
    return (
      <div>
        <Link href={`/cases/${caseId}?tab=drafts${payload?.draftId ? `&draft=${payload.draftId}` : ""}`} className={clsx(box, "flex items-center gap-3 px-4 py-4 transition hover:border-ink")}>
          <FileText size={18} className="text-muted" />
          <span className="flex-1 text-[14px] font-medium">{kind === "translation" ? "Open translation" : "Open draft"}</span>
        </Link>
        {footer("Approve")}
      </div>
    );
  }

  return null;
}
