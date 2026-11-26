"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowDown, Check, ChevronDown, ChevronLeft, Copy, MoreHorizontal, Pause, Pencil, Play, SquarePen } from "lucide-react";
import Composer from "./Composer";
import Markdown from "./Markdown";
import { deleteChat, renameChat, startCase } from "@/lib/actions";
import { confirmBox } from "./Confirm";
import { btn } from "./ui";

type M = { id?: string; role: string; content: string };
type T = { id: string; title: string };

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch {
      const a = document.createElement("textarea"); a.value = text; document.body.appendChild(a); a.select(); document.execCommand("copy"); a.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  };
  return (
    <button onClick={copy} aria-label="Copy" title="Copy" className="flex h-8 w-8 items-center justify-center text-muted transition hover:bg-panel hover:text-ink">
      {done ? <Check size={15} /> : <Copy size={15} />}
    </button>
  );
}

// Read aloud uses the device's own voices (free, no model credits). One reply plays at a time. Pausing stops
// the voice and keeps the place; playing again starts from the sentence it stopped in. Short pieces are spoken
// one after another because some browsers cut off long utterances.
type Say = { key: string | null; state: "idle" | "playing" | "paused"; chunks: string[]; at: number };
const say: Say = { key: null, state: "idle", chunks: [], at: 0 };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());
let run = 0;

function spoken(md: string): string[] {
  // Each line becomes a spoken sentence: Markdown marks, list numbers, links and page references are dropped,
  // and a table row is read as its cells in order.
  const said: string[] = [];
  for (let l of md.replace(/```[\s\S]*?```/g, "").split("\n")) {
    l = l.trim();
    if (!l || /^\|?\s*:?-{2,}/.test(l) || /^(\*\s*){3,}$|^(_\s*){3,}$/.test(l)) continue;
    if (l.startsWith("|")) l = l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()).filter(Boolean).join(", ");
    l = l
      .replace(/^#{1,6}\s+/, "").replace(/^>\s?/, "").replace(/^[-*\u2022+]\s+/, "").replace(/^\d+[.)]\s+/, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\/cases\/[\w?=&-]+/g, "").replace(/\s*\(pp?\. ?\d+[^)]*\)/g, "")
      .replace(/\*\*|__|`/g, "").replace(/(^|\s)[*_]([^*_\n]+)[*_](?=[\s.,;:!?]|$)/g, "$1$2")
      .trim();
    if (l) said.push(/[.!?:;]$/.test(l) ? l : l + ".");
  }
  const text = said.join(" ");
  const out: string[] = [];
  for (const s of text.split(/(?<=[.!?])\s+/)) {
    if (out.length && out[out.length - 1].length + s.length < 220) out[out.length - 1] += " " + s;
    else out.push(s);
  }
  return out;
}

function bestVoice() {
  const all = window.speechSynthesis.getVoices();
  const en = all.filter((v) => /^en[-_]US/i.test(v.lang));
  const rank = (v: SpeechSynthesisVoice) => (/premium/i.test(v.name) ? 5 : /enhanced|natural|neural/i.test(v.name) ? 4 : /google us english/i.test(v.name) ? 3 : /samantha|ava|allison|aria|jenny/i.test(v.name) ? 2 : v.localService ? 1 : 0);
  return en.sort((a, b) => rank(b) - rank(a))[0] ?? all.find((v) => /^en/i.test(v.lang)) ?? null;
}

function speakFrom() {
  const synth = window.speechSynthesis;
  const token = ++run;
  synth.cancel();
  const next = () => {
    if (token !== run) return;
    if (say.at >= say.chunks.length) { Object.assign(say, { key: null, state: "idle", chunks: [], at: 0 }); emit(); return; }
    const u = new SpeechSynthesisUtterance(say.chunks[say.at]);
    const v = bestVoice();
    if (v) u.voice = v;
    u.lang = v?.lang ?? "en-US";
    u.onend = () => { if (token === run) { say.at++; next(); } };
    u.onerror = (e) => { if (token === run && e.error !== "interrupted" && e.error !== "canceled") { say.at++; next(); } };
    synth.speak(u);
  };
  next();
}

function silence() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  run++;
  window.speechSynthesis.cancel();
  Object.assign(say, { key: null, state: "idle", chunks: [], at: 0 });
  emit();
}

function SpeakButton({ id, text }: { id: string; text: string }) {
  const [, tick] = useState(0);
  const [ok, setOk] = useState(false);
  useEffect(() => {
    setOk("speechSynthesis" in window);
    const f = () => tick((n) => n + 1);
    listeners.add(f);
    return () => { listeners.delete(f); };
  }, []);
  if (!ok) return null;
  const mine = say.key === id;
  const playing = mine && say.state === "playing";
  const toggle = () => {
    if (playing) { run++; window.speechSynthesis.cancel(); say.state = "paused"; emit(); return; }
    if (!mine) Object.assign(say, { key: id, chunks: spoken(text), at: 0 });
    say.state = "playing";
    emit();
    speakFrom();
  };
  return (
    <button onClick={toggle} aria-label={playing ? "Pause" : "Read aloud"} title={playing ? "Pause" : "Read aloud"} className="flex h-8 w-8 items-center justify-center text-muted transition hover:bg-panel hover:text-ink">
      {playing ? <Pause size={15} /> : <Play size={15} />}
    </button>
  );
}

export default function AssistantChat({ thread, threads: initialThreads, initial, q, connected, scope, writing = null }: { thread: T | null; threads: T[]; initial: M[]; q: string; connected: boolean; scope: { id: string; name: string } | null; writing?: string | null }) {
  const router = useRouter();
  const [msgs, setMsgs] = useState<M[]>(writing === null ? initial : [...initial, { role: "assistant", content: writing }]);
  const [threads, setThreads] = useState<T[]>(initialThreads);
  const [threadId, setThreadId] = useState<string | null>(thread?.id ?? null);
  const current = useRef<string | null>(thread?.id ?? null);
  const [title, setTitle] = useState<string | null>(thread?.title ?? null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ index: number; text: string } | null>(null);
  const [menu, setMenu] = useState<"chats" | "more" | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [, start] = useTransition();
  const sentInitial = useRef(false);
  const stopper = useRef<AbortController | null>(null);
  // Follow the reply down while it is written, unless the reader has scrolled up to read something.
  const follow = useRef(true);
  const base = scope ? `/assistant?case=${scope.id}` : "/assistant";
  const link = (id: string) => `${base}${scope ? "&" : "?"}t=${id}`;

  const toBottom = (smooth = true) => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  // An existing chat opens at its latest message.
  useEffect(() => { if (initial.length) requestAnimationFrame(() => toBottom(false)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const check = () => {
      const bottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;
      setAtBottom(bottom);
      follow.current = bottom;
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, []);
  useEffect(() => { if (follow.current) toBottom(false); }, [msgs]);
  useEffect(() => silence, []);
  // A chat reopened while Lincoln is still writing follows the reply until it is saved, then shows the saved one.
  useEffect(() => {
    if (writing === null || !thread) return;
    setBusy(true);
    let live = true;
    const poll = async () => {
      while (live) {
        await new Promise((r) => setTimeout(r, 900));
        const r = (await fetch(`/api/assistant?t=${thread.id}`).then((x) => x.json()).catch(() => null)) as { writing?: boolean; text?: string } | null;
        if (!live || !r) continue;
        if (r.writing) setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: r.text ?? "" }]);
        else { window.location.reload(); return; }
      }
    };
    void poll();
    return () => { live = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!menu) return;
    const close = () => { setMenu(null); setConfirmDelete(false); };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menu]);

  async function send(t: string, editFrom?: { index: number; id?: string }) {
    const message = t.trim();
    if (!message || busy) return;
    setError(null);
    setBusy(true);
    setEditing(null);
    if (editFrom) silence();
    follow.current = true;
    setMsgs((m) => [...(editFrom ? m.slice(0, editFrom.index) : m), { role: "user", content: message }, { role: "assistant", content: "" }]);
    if (!editFrom) setText("");
    requestAnimationFrame(() => toBottom());
    const ctl = new AbortController();
    stopper.current = ctl;
    let written = "";
    let created: string | null = null;
    const show = (content: string, ids?: { user?: string; reply?: string | null }) => setMsgs((m) => {
      const out = m.slice(0, -2);
      out.push({ ...m[m.length - 2], ...(ids?.user ? { id: ids.user } : {}) });
      out.push({ ...m[m.length - 1], content, ...(ids?.reply ? { id: ids.reply } : {}) });
      return out;
    });
    try {
      const res = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, caseId: scope?.id, threadId, editFrom: editFrom?.id }), signal: ctl.signal });
      if (!res.ok || !res.body) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "The request failed.");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, i);
          buf = buf.slice(i + 1);
          if (!line.trim()) continue;
          const ev = JSON.parse(line) as { t?: string; thread?: string; done?: boolean; error?: string; reply?: string; threadId?: string; title?: string; changed?: boolean; ids?: { user: string; reply: string | null } };
          // The chat exists on the server from the first moment, so it can be left and reopened mid reply.
          if (ev.thread) {
            current.current = ev.thread;
            if (!threadId) {
              created = ev.thread;
              setThreadId(ev.thread);
              setTitle(ev.title ?? null);
              setThreads((x) => [{ id: ev.thread!, title: ev.title ?? "Chat" }, ...x]);
              window.history.replaceState(null, "", link(ev.thread));
            }
            show(written, ev.ids);
          }
          if (ev.t) { written += ev.t; show(written); }
          if (ev.error) throw new Error(ev.error);
          if (ev.done) {
            show(ev.reply ?? written, ev.ids);
            if (ev.threadId && ev.title) {
              setTitle(ev.title);
              setThreads((x) => x.map((y) => (y.id === ev.threadId ? { ...y, title: ev.title! } : y)));
            }
            if (ev.changed) router.refresh();
          }
        }
      }
    } catch (e) {
      if (ctl.signal.aborted) {
        // Stopped by the reader: what was written stays.
        if (!written) setMsgs((m) => m.slice(0, -1));
      } else {
        setMsgs((m) => (m[m.length - 1]?.content ? m : m.slice(0, -1)));
        setError(e instanceof Error ? e.message : "The request failed.");
        // A new chat whose first question failed is not kept on the server.
        if (created && !written) {
          setThreadId(null); setTitle(null); current.current = null;
          setThreads((x) => x.filter((y) => y.id !== created));
          window.history.replaceState(null, "", base);
        }
      }
    } finally {
      stopper.current = null;
      setBusy(false);
    }
  }
  // Stop ends the reply on the server, which then sends back what was written; the connection is only cut
  // if the server does not answer.
  const stop = () => {
    const t = current.current;
    if (t) void fetch("/api/assistant/stop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ threadId: t }) }).catch(() => undefined);
    const ctl = stopper.current;
    setTimeout(() => { if (stopper.current === ctl) ctl?.abort(); }, t ? 4000 : 0);
  };

  useEffect(() => {
    if (q && !sentInitial.current) {
      sentInitial.current = true;
      window.history.replaceState(null, "", base);
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handOver = (files: File[]) => {
    const fd = new FormData();
    fd.set("text", text.trim());
    if (scope) fd.set("case", scope.id);
    files.forEach((f) => fd.append("file", f));
    setBusy(true);
    start(() => startCase(fd));
  };
  const box = <Composer value={text} onChange={setText} onSend={(files) => (files.length ? handOver(files) : send(text))} onStop={stop} busy={busy} placeholder={scope ? `Ask about ${scope.name}` : "Ask Lincoln anything"} autoFocus={!msgs.length} />;

  const saveTitle = () => {
    const t = (renaming ?? "").trim();
    setRenaming(null);
    if (!t || !threadId || t === title) return;
    setTitle(t);
    setThreads((x) => x.map((y) => (y.id === threadId ? { ...y, title: t } : y)));
    start(() => renameChat(threadId, t));
  };

  const head = (
    <div className="sticky top-0 z-20 -mx-4 -mt-[max(1.75rem,env(safe-area-inset-top))] mb-4 flex items-center justify-between gap-2 bg-canvas px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md md:-mx-2 md:-mt-12 md:px-2">
      <div className="relative flex min-w-0 items-center gap-1">
        <Link href={scope ? `/cases/${scope.id}` : "/"} aria-label="Back" className="-ml-1.5 shrink-0 p-1.5 text-muted transition hover:bg-panel hover:text-ink md:hidden"><ChevronLeft size={19} /></Link>
        {renaming !== null ? (
          <input autoFocus value={renaming} maxLength={80} onChange={(e) => setRenaming(e.target.value)} onBlur={saveTitle} onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setRenaming(null); }} className="h-9 w-[min(60vw,360px)] border border-edge bg-card px-2.5 text-[14.5px] font-medium outline-none" />
        ) : (
          <button onClick={(e) => { e.stopPropagation(); setMenu(menu === "chats" ? null : "chats"); }} className="flex min-w-0 items-center gap-1 px-2 py-1.5 text-[14.5px] font-medium transition hover:bg-panel">
            <span className="truncate">{title ?? (scope ? scope.name : "New chat")}</span>
            {threads.length > 0 && <ChevronDown size={15} className="shrink-0 text-muted" />}
          </button>
        )}
        {menu === "chats" && threads.length > 0 && (
          <div onClick={(e) => e.stopPropagation()} className="absolute left-0 top-11 z-30 max-h-[60vh] w-[min(80vw,320px)] overflow-y-auto border border-line bg-card p-1.5 shadow-lg">
            <Link href={base} className="flex items-center gap-2 px-3 py-2 text-[14px] font-medium transition hover:bg-panel"><SquarePen size={15} /> New chat</Link>
            <div className="my-1 border-t border-line" />
            {threads.map((t) => <Link key={t.id} href={link(t.id)} className={`block truncate px-3 py-2 text-[14px] transition hover:bg-panel ${t.id === threadId ? "bg-panel font-medium" : ""}`}>{t.title}</Link>)}
          </div>
        )}
      </div>
      <div className="relative flex shrink-0 items-center gap-0.5">
        {msgs.length > 0 && <Link href={base} aria-label="New chat" title="New chat" className="flex h-9 w-9 items-center justify-center text-muted transition hover:bg-panel hover:text-ink"><SquarePen size={17} /></Link>}
        {threadId && <button onClick={(e) => { e.stopPropagation(); setMenu(menu === "more" ? null : "more"); setConfirmDelete(false); }} aria-label="More" className="flex h-9 w-9 items-center justify-center text-muted transition hover:bg-panel hover:text-ink"><MoreHorizontal size={18} /></button>}
        {menu === "more" && threadId && (
          <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-11 z-30 w-48 border border-line bg-card p-1.5 shadow-lg">
            <button onClick={() => { setMenu(null); setRenaming(title ?? ""); }} className="w-full px-3 py-2 text-left text-[14px] transition hover:bg-panel">Rename</button>
            <button onClick={async () => { setMenu(null); if (await confirmBox()) start(() => deleteChat(threadId)); }} className="w-full px-3 py-2 text-left text-[14px] text-risk transition hover:bg-risk-bg">Delete</button>
          </div>
        )}
      </div>
    </div>
  );

  if (msgs.length === 0) {
    return (
      <div className="mx-auto max-w-[720px]">
        {(scope || threads.length > 0) ? head : <Link href="/" aria-label="Back" className="-ml-1.5 inline-flex p-1.5 text-muted md:hidden"><ChevronLeft size={18} /></Link>}
        {/* Phones keep the box at the bottom, as in the Claude and ChatGPT apps; larger screens centre it under the name. */}
        <div className="flex min-h-[62dvh] flex-col justify-center">
          <h1 className="wordmark mb-8 text-center text-[40px] leading-none md:text-[46px]">Lincoln</h1>
          <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-canvas from-70% to-transparent px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8 md:static md:bg-none md:p-0">
            {box}
            {!connected && <p className="mt-3 text-center text-[13px] text-muted">No model connected.</p>}
            {error && <p className="mt-3 text-[13px] text-risk">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto -mb-36 max-w-[720px] md:-mb-24">
      {head}
      <div className="flex flex-col gap-8 pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
        {msgs.map((m, i) => m.role === "user" ? (
          <div key={i} className="msg-in group flex flex-col items-end gap-1">
            {editing?.index === i ? (
              <div className="w-full max-w-[90%] border border-edge bg-card p-3">
                <textarea autoFocus value={editing.text} onChange={(e) => setEditing({ index: i, text: e.target.value })} rows={Math.min(8, editing.text.split("\n").length + 1)} className="w-full resize-none bg-transparent text-[16px] leading-[1.6] outline-none md:text-[16.5px]" />
                <div className="mt-2 flex justify-end gap-2">
                  <button onClick={() => setEditing(null)} className={btn.secondary}>Cancel</button>
                  <button disabled={!editing.text.trim() || busy} onClick={() => send(editing.text, { index: i, id: m.id })} className={btn.primary}>Send</button>
                </div>
              </div>
            ) : (
              <div className="max-w-[85%] whitespace-pre-wrap break-words bg-panel px-4 py-2.5 text-[16px] leading-[1.6] md:text-[16.5px]">{m.content}</div>
            )}
            {editing?.index !== i && (
              <div className="flex gap-0.5 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                <CopyButton text={m.content} />
                {!busy && <button onClick={() => setEditing({ index: i, text: m.content })} aria-label="Edit" title="Edit" className="flex h-8 w-8 items-center justify-center text-muted transition hover:bg-panel hover:text-ink"><Pencil size={15} /></button>}
              </div>
            )}
          </div>
        ) : (
          <div key={i} className="msg-in">
            {m.content
              ? <div className="text-[16px] leading-[1.7] md:text-[16.5px]"><Markdown text={m.content} caseId={scope?.id} /></div>
              : <div className="flex h-7 items-center gap-1"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink [animation-delay:150ms]" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink [animation-delay:300ms]" /></div>}
            {m.content && !(busy && i === msgs.length - 1) && (
              <div className="-ml-1.5 mt-2 flex gap-0.5">
                <CopyButton text={m.content} />
                <SpeakButton id={m.id ?? `i${i}`} text={m.content} />
              </div>
            )}
          </div>
        ))}
        {error && <p className="text-[14px] text-risk">{error}</p>}
      </div>
      <div className="pin-bar fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-canvas from-70% to-transparent px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8 md:px-12">
        <div className="relative mx-auto max-w-[720px]">
          {!atBottom && (
            <button onClick={() => toBottom()} aria-label="Scroll to the latest" className="absolute -top-14 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center border border-line bg-card text-ink shadow-md transition hover:bg-panel">
              <ArrowDown size={18} />
            </button>
          )}
          {box}
        </div>
      </div>
    </div>
  );
}
