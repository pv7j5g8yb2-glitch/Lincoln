"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { notify } from "../Toaster";
import { btn, field } from "../ui";

// The task pane inside Word: connect once with a code, pick a case, then insert its drafts, check the open document
// against the case file and the law, or search the law library.

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global { interface Window { Office?: any; Word?: any } }

const KEY = "lincoln_word_token";
type Case = { id: string; client: string; type: string };
type Draft = { id: string; title: string; status: string; version: number };
type Finding = { text: string; problem: string };
type Check = { law: Finding[]; exhibits: Finding[]; pages: { checked: number; problems: Finding[] } | null };
type Hit = { cite: string; alias: string; heading: string; snippet: string; text: string; url: string };
const STATUS: Record<string, string> = { for_review: "For review", approved: "Approved", draft: "Draft", sent: "Sent" };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Waits for Office.js and Word. Outside Word, resolves false. */
function useWord() {
  const [ready, setReady] = useState<boolean | null>(null);
  useEffect(() => {
    let done = false;
    const start = Date.now();
    const wait = () => {
      if (done) return;
      if (window.Office?.onReady) {
        window.Office.onReady((info: { host?: string }) => { if (!done) { done = true; setReady(info?.host === "Word" || info?.host === window.Office?.HostType?.Word); } });
      } else if (Date.now() - start > 8000) { done = true; setReady(false); } else setTimeout(wait, 100);
    };
    wait();
    return () => { done = true; };
  }, []);
  return ready;
}

async function inWord<T>(fn: (ctx: any) => Promise<T>): Promise<T> {
  return window.Word.run(fn);
}

export default function WordPane() {
  const word = useWord();
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<{ name: string; firm: string } | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { try { setToken(localStorage.getItem(KEY)); } catch { /* none */ } setLoaded(true); }, []);

  const api = useCallback(async (path: string, body?: unknown) => {
    const res = await fetch(`/api/word${path}`, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (res.status === 401) { try { localStorage.removeItem(KEY); } catch { /* fine */ } setToken(null); throw new Error("Not connected"); }
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.error ?? "Failed");
    return out;
  }, [token]);

  useEffect(() => { if (token) api("?op=me").then(setMe).catch(() => undefined); }, [token, api]);

  if (word === null || !loaded) return <Shell><p className="py-10 text-center text-[13px] text-faint">Loading</p></Shell>;
  if (!word) return <Shell><p className="py-10 text-center text-[13.5px] text-muted">Open from Word</p></Shell>;
  if (!token) return <Shell><Pair onToken={(t) => { try { localStorage.setItem(KEY, t); } catch { /* kept for this session */ } setToken(t); }} /></Shell>;
  return (
    <Shell right={me && <button onClick={() => { void api("", { op: "disconnect" }).catch(() => undefined); try { localStorage.removeItem(KEY); } catch { /* fine */ } setToken(null); setMe(null); }} className="text-[12px] text-faint transition hover:text-ink" title={`${me.name}, ${me.firm}`}>Disconnect</button>}>
      <Main api={api} />
    </Shell>
  );
}

function Shell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas px-4 pb-10 pt-4 text-ink antialiased">
      <div className="mb-5 flex items-center justify-between"><span className="wordmark text-[17px] leading-none">Lincoln</span>{right}</div>
      {children}
    </div>
  );
}

function Pair({ onToken }: { onToken: (t: string) => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const go = async () => {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/word", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "pair", code }) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.token) { setError(out.error ?? "Code not valid"); return; }
      onToken(out.token);
    } finally { setBusy(false); }
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); void go(); }} className="pt-6">
      <label className="mb-1.5 block text-[12.5px] font-medium text-muted" htmlFor="code">Connection code</label>
      <input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoComplete="off" spellCheck={false} placeholder="XXXX-XXXX" className={`${field} font-mono tracking-[0.12em]`} />
      {error && <p className="mt-2 text-[12.5px] text-risk">{error}</p>}
      <button disabled={busy || code.replace(/[^A-Z0-9]/gi, "").length < 8} className={`${btn.primary} mt-3 w-full`}>{busy ? "Connecting" : "Connect"}</button>
    </form>
  );
}

function Main({ api }: { api: (path: string, body?: unknown) => Promise<any> }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [caseId, setCaseId] = useState("");
  const [tab, setTab] = useState<"drafts" | "check" | "library">("drafts");
  useEffect(() => {
    api("?op=cases").then((c: Case[]) => { setCases(c); try { const last = localStorage.getItem("lincoln_word_case"); setCaseId(c.find((x) => x.id === last)?.id ?? c[0]?.id ?? ""); } catch { setCaseId(c[0]?.id ?? ""); } }).catch(() => undefined);
  }, [api]);
  const pick = (id: string) => { setCaseId(id); try { localStorage.setItem("lincoln_word_case", id); } catch { /* fine */ } };
  return (
    <div>
      <select value={caseId} onChange={(e) => pick(e.target.value)} className={field} aria-label="Case">
        {cases.length === 0 && <option value="">No cases</option>}
        {cases.map((c) => <option key={c.id} value={c.id}>{c.client} · {c.type}</option>)}
      </select>
      <div className="mt-4 grid grid-cols-3 bg-panel p-0.5 text-[12.5px] font-medium">
        {(["drafts", "check", "library"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={clsx(" py-1.5 transition", tab === t ? "bg-card text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-muted hover:text-ink")}>{{ drafts: "Drafts", check: "Check", library: "Library" }[t]}</button>
        ))}
      </div>
      <div className="mt-4">
        {tab === "drafts" && caseId && <Drafts api={api} caseId={caseId} />}
        {tab === "check" && caseId && <CheckDoc api={api} caseId={caseId} />}
        {tab === "library" && <Library api={api} />}
      </div>
    </div>
  );
}

function Drafts({ api, caseId }: { api: (path: string, body?: unknown) => Promise<any>; caseId: string }) {
  const [list, setList] = useState<Draft[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [inserted, setInserted] = useState<string | null>(null);
  useEffect(() => { setList(null); api(`?op=drafts&case=${encodeURIComponent(caseId)}`).then(setList).catch(() => setList([])); }, [api, caseId]);
  const insert = async (d: Draft) => {
    setBusy(d.id);
    try {
      const { blocks } = await api(`?op=draft&id=${encodeURIComponent(d.id)}`) as { blocks: { kind: string; text: string }[] };
      const html = blocks.map((b) => b.kind === "title" ? `<h1>${esc(b.text)}</h1>` : b.kind === "heading" ? `<h2>${esc(b.text)}</h2>` : `<p>${esc(b.text)}</p>`).join("");
      await inWord(async (ctx) => { ctx.document.getSelection().insertHtml(html, "Replace"); await ctx.sync(); });
      setInserted(d.id);
      notify("Inserted");
    } catch { notify("Not inserted"); } finally { setBusy(null); }
  };
  // The document as edited in Word goes back to Lincoln as the draft's next version.
  const saveBack = async (d: Draft) => {
    setBusy(d.id);
    try {
      const blocks = await inWord(async (ctx) => {
        const p = ctx.document.body.paragraphs; p.load("items/text,items/styleBuiltIn,items/style"); await ctx.sync();
        return p.items.map((x: { text: string; styleBuiltIn?: string; style?: string }) => {
          const st = String(x.styleBuiltIn ?? x.style ?? "");
          return { text: x.text, title: /^title$/i.test(st), heading: /^heading/i.test(st) };
        });
      });
      await api("", { op: "saveDraft", draft: d.id, blocks });
      notify("Saved");
    } catch { notify("Not saved"); } finally { setBusy(null); }
  };
  if (!list) return <p className="py-6 text-center text-[12.5px] text-faint">Loading</p>;
  if (!list.length) return <p className="py-6 text-center text-[12.5px] text-faint">No drafts</p>;
  return (
    <ul className="border-t border-line">
      {list.map((d) => (
        <li key={d.id} className="flex items-center gap-3 border-b border-line py-3">
          <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{d.title}</p><p className="text-[11.5px] text-faint">v{d.version} · {STATUS[d.status] ?? d.status}</p></div>
          {inserted === d.id
            ? <button disabled={busy !== null} onClick={() => void saveBack(d)} className={btn.primary}>{busy === d.id ? "Saving" : "Save to Lincoln"}</button>
            : <button disabled={busy !== null} onClick={() => void insert(d)} className={btn.secondary}>{busy === d.id ? "Inserting" : "Insert"}</button>}
        </li>
      ))}
    </ul>
  );
}

function CheckDoc({ api, caseId }: { api: (path: string, body?: unknown) => Promise<any>; caseId: string }) {
  const [result, setResult] = useState<Check | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setResult(null); }, [caseId]);
  const run = async () => {
    setBusy(true); setError("");
    try {
      const paras: string[] = await inWord(async (ctx) => { const p = ctx.document.body.paragraphs; p.load("items/text"); await ctx.sync(); return p.items.map((x: { text: string }) => x.text); });
      setResult(await api("", { op: "check", case: caseId, paras }));
    } catch (e) { setError(e instanceof Error ? e.message : "Not checked"); } finally { setBusy(false); }
  };
  const find = async (text: string) => {
    try {
      await inWord(async (ctx) => { const r = ctx.document.body.search(text.slice(0, 240), { matchCase: false }); r.load("items"); await ctx.sync(); if (r.items.length) { r.items[0].select(); await ctx.sync(); } else notify("Not found"); });
    } catch { notify("Not found"); }
  };
  const [marked, setMarked] = useState<number | null>(null);
  // Lincoln's edits go into the open document as tracked changes, each with its reason as a comment.
  const markup = async () => {
    setBusy(true); setError(""); setMarked(null);
    try {
      const paras: string[] = await inWord(async (ctx) => { const p = ctx.document.body.paragraphs; p.load("items/text"); await ctx.sync(); return p.items.map((x: { text: string }) => x.text); });
      const r = await api("", { op: "markup", case: caseId, paras }) as { edits: { p: number; find: string; replace: string; why: string }[] };
      const made = await inWord(async (ctx) => {
        ctx.document.changeTrackingMode = "TrackAll";
        const p = ctx.document.body.paragraphs; p.load("items"); await ctx.sync();
        let n = 0;
        for (const e of r.edits) {
          const para = p.items[e.p];
          if (!para) continue;
          const hits = para.search(e.find.slice(0, 240), { matchCase: true }); hits.load("items"); await ctx.sync();
          const at = hits.items[0];
          if (!at) continue;
          const range = e.replace !== e.find ? at.insertText(e.replace, "Replace") : at;
          if (e.why) range.insertComment(e.why);
          n++;
        }
        await ctx.sync();
        return n;
      });
      setMarked(made);
      notify(made ? "Marked up" : "No changes");
    } catch (e) { setError(e instanceof Error ? e.message : "Not marked up"); } finally { setBusy(false); }
  };
  const groups: [string, Finding[]][] = result ? [["Facts", result.pages?.problems ?? []], ["Exhibits", result.exhibits], ["Law", result.law]] : [];
  const total = groups.reduce((n, [, g]) => n + g.length, 0);
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <button disabled={busy} onClick={() => void run()} className={btn.primary}>Check</button>
        <button disabled={busy} onClick={() => void markup()} className={btn.secondary}>Mark up</button>
      </div>
      {busy && <p className="mt-3 text-center text-[12.5px] text-faint">Working</p>}
      {marked !== null && !busy && <p className="mt-3 text-center text-[12.5px] text-muted">{marked ? `${marked} ${marked === 1 ? "change" : "changes"} tracked` : "No changes"}</p>}
      {error && <p className="mt-3 text-[12.5px] text-risk">{error}</p>}
      {result && total === 0 && <p className="mt-6 text-center text-[13px] text-muted">Nothing to correct{result.pages ? <span className="block text-[11.5px] text-faint">{result.pages.checked} cited {result.pages.checked === 1 ? "fact" : "facts"} checked</span> : null}</p>}
      {groups.filter(([, g]) => g.length).map(([name, g]) => (
        <section key={name} className="mt-5">
          <h3 className="mb-1.5 text-[11.5px] font-medium uppercase tracking-[0.08em] text-faint">{name}</h3>
          <ul className="border-t border-line">
            {g.map((f, i) => (
              <li key={i}>
                <button onClick={() => void find(f.text)} className="block w-full border-b border-line py-2.5 text-left transition hover:bg-panel">
                  <span className="line-clamp-2 text-[12.5px] text-muted">“{f.text}”</span>
                  <span className="mt-0.5 block text-[12.5px] font-medium">{f.problem}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Library({ api }: { api: (path: string, body?: unknown) => Promise<any> }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const search = async () => { if (!q.trim()) return; setHits(await api(`?op=law&q=${encodeURIComponent(q)}`).catch(() => [])); };
  const put = async (text: string) => {
    try { await inWord(async (ctx) => { ctx.document.getSelection().insertText(text, "Replace"); await ctx.sync(); }); notify("Inserted"); } catch { notify("Not inserted"); }
  };
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); void search(); }}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Citation or words" className={field} /></form>
      {hits && hits.length === 0 && <p className="py-6 text-center text-[12.5px] text-faint">No results</p>}
      {hits && hits.length > 0 && (
        <ul className="mt-3 border-t border-line">
          {hits.map((h, i) => (
            <li key={i} className="border-b border-line py-3">
              <p className="text-[13px] font-medium">{h.cite}{h.alias && <span className="ml-1.5 font-normal text-muted">{h.alias}</span>}</p>
              <p className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-muted">{h.snippet.replace(/[\u0002\u0003]/g, "")}</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => void put(h.alias ? `${h.alias}, ${h.cite}` : h.cite)} className={btn.secondary}>Cite</button>
                <button onClick={() => void put(`“${h.text.replace(/\n/g, " ")}” ${h.cite}.`)} className={btn.ghost}>Quote</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
