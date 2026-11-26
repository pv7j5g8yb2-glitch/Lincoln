"use client";

import { useCallback, useEffect, useState } from "react";
import { notify } from "../Toaster";
import { btn, field } from "../ui";

// The pane beside an email in Outlook: the case it belongs to, what Lincoln has done, and the reply waiting for
// approval (Approve, or Edit then Save). An email that belongs to no case can be handed to Lincoln.

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global { interface Window { Office?: any } }

const KEY = "lincoln_outlook_token";
type Mail = { from: string; fromName: string; subject: string; conversationId: string };
type Draft = { id: string; party: string; email: string | null; subject: string; body: string };
type Found = { case: { id: string; client: string; type: string; stage: string; summary: string } | null; done?: { text: string; at: string }[]; drafts?: Draft[] };

function useOutlook() {
  const [ready, setReady] = useState<boolean | null>(null);
  useEffect(() => {
    let done = false;
    const start = Date.now();
    const wait = () => {
      if (done) return;
      if (window.Office?.onReady) window.Office.onReady((info: { host?: string }) => { if (!done) { done = true; setReady(info?.host === "Outlook" || info?.host === window.Office?.HostType?.Outlook); } });
      else if (Date.now() - start > 8000) { done = true; setReady(false); } else setTimeout(wait, 100);
    };
    wait();
    return () => { done = true; };
  }, []);
  return ready;
}

/** The open email, and again whenever another one is selected while the pane is pinned. */
function useMail(on: boolean) {
  const [mail, setMail] = useState<Mail | null>(null);
  useEffect(() => {
    if (!on) return;
    const read = () => {
      const it = window.Office?.context?.mailbox?.item;
      setMail(it ? { from: it.from?.emailAddress ?? "", fromName: it.from?.displayName ?? "", subject: it.subject ?? "", conversationId: it.conversationId ?? "" } : null);
    };
    read();
    try { window.Office.context.mailbox.addHandlerAsync(window.Office.EventType.ItemChanged, read); } catch { /* older Outlook: one email per pane */ }
  }, [on]);
  return mail;
}

const bodyText = () => new Promise<string>((ok) => {
  try { window.Office.context.mailbox.item.body.getAsync(window.Office.CoercionType.Text, (r: { value?: string }) => ok(r?.value ?? "")); } catch { ok(""); }
});

export default function OutlookPane() {
  const outlook = useOutlook();
  const [token, setToken] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { try { setToken(localStorage.getItem(KEY)); } catch { /* none */ } setLoaded(true); }, []);
  const api = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch("/api/outlook", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
    if (res.status === 401) { try { localStorage.removeItem(KEY); } catch { /* fine */ } setToken(null); throw new Error("Not connected"); }
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.error ?? "Failed");
    return out;
  }, [token]);
  const mail = useMail(Boolean(outlook && token));

  if (outlook === null || !loaded) return <Shell><p className="py-10 text-center text-[13px] text-faint">Loading</p></Shell>;
  if (!outlook) return <Shell><p className="py-10 text-center text-[13.5px] text-muted">Open from Outlook</p></Shell>;
  if (!token) return <Shell><Pair onToken={(t) => { try { localStorage.setItem(KEY, t); } catch { /* this session only */ } setToken(t); }} /></Shell>;
  return (
    <Shell right={<button onClick={() => { void api({ op: "disconnect" }).catch(() => undefined); try { localStorage.removeItem(KEY); } catch { /* fine */ } setToken(null); }} className="text-[12px] text-faint transition hover:text-ink">Disconnect</button>}>
      {mail ? <Case api={api} mail={mail} key={`${mail.conversationId}|${mail.from}|${mail.subject}`} /> : <p className="py-10 text-center text-[13px] text-faint">No email open</p>}
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
      const res = await fetch("/api/outlook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "pair", code }) });
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

function Case({ api, mail }: { api: (b: Record<string, unknown>) => Promise<any>; mail: Mail }) {
  const [found, setFound] = useState<Found | null>(null);
  const [busy, setBusy] = useState(false);
  const app = typeof window === "undefined" ? "" : window.location.origin;
  const load = useCallback(() => { api({ op: "lookup", ...mail }).then(setFound).catch(() => setFound({ case: null })); }, [api, mail]);
  useEffect(() => { load(); }, [load]);
  if (!found) return <p className="py-10 text-center text-[13px] text-faint">Loading</p>;
  if (!found.case) {
    const open = async () => {
      setBusy(true);
      try { const r = await api({ op: "open", ...mail, text: await bodyText() }); notify("Case opened"); window.open(`${app}/cases/${r.caseId}`, "_blank"); load(); }
      catch (e) { notify(e instanceof Error ? e.message : "Not opened"); } finally { setBusy(false); }
    };
    return (
      <div className="pt-6 text-center">
        <p className="text-[13.5px] text-muted">No case</p>
        <button disabled={busy} onClick={() => void open()} className={`${btn.primary} mt-4 w-full`}>{busy ? "Opening" : "Open a case"}</button>
      </div>
    );
  }
  const c = found.case;
  return (
    <div>
      <a href={`${app}/cases/${c.id}`} target="_blank" rel="noreferrer" className="block border border-line bg-card p-3.5 transition hover:border-edge">
        <span className="block text-[15px] font-medium leading-snug">{c.client}</span>
        <span className="mt-0.5 block text-[12.5px] text-muted">{c.type} · {c.stage}</span>
      </a>
      {(found.drafts ?? []).map((d) => <Reply key={d.id} api={api} draft={d} onDone={load} />)}
      {(found.done ?? []).length > 0 && (
        <section className="mt-6">
          <h2 className="mb-1 text-[11.5px] font-medium uppercase tracking-[0.08em] text-faint">Done by Lincoln</h2>
          <ul className="border-t border-line">
            {found.done!.map((x, i) => <li key={i} className="border-b border-line py-2.5 text-[12.5px] leading-relaxed text-muted">{x.text}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

function Reply({ api, draft, onDone }: { api: (b: Record<string, unknown>) => Promise<any>; draft: Draft; onDone: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(draft.body);
  const [busy, setBusy] = useState(false);
  const act = async (op: "save" | "approve") => {
    setBusy(true);
    try {
      const r = await api({ op, messageId: draft.id, subject: draft.subject, body: text });
      if (op === "save") { setEditing(false); notify("Saved"); } else if (r.sent === false) notify(r.error ?? "Not sent"); else { notify("Sent"); onDone(); }
    } catch (e) { notify(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  };
  return (
    <section className="mt-5 border border-line bg-card">
      <div className="border-b border-line px-3.5 py-2.5 text-[12.5px]">
        <span className="text-faint">To </span>{draft.party}
        <span className="mt-0.5 block truncate font-medium">{draft.subject}</span>
      </div>
      {editing
        ? <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} className="block w-full resize-y bg-transparent px-3.5 py-3 text-[13px] leading-relaxed outline-none" />
        : <p className="whitespace-pre-wrap px-3.5 py-3 text-[13px] leading-relaxed">{text}</p>}
      <div className="flex gap-2 border-t border-line p-2.5">
        {editing
          ? <button disabled={busy} onClick={() => void act("save")} className={btn.primary}>Save</button>
          : <>
              <button disabled={busy} onClick={() => void act("approve")} className={btn.primary}>Approve</button>
              <button disabled={busy} onClick={() => setEditing(true)} className={btn.ghost}>Edit</button>
            </>}
      </div>
    </section>
  );
}
