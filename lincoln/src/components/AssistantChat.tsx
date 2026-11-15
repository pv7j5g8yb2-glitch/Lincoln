"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowDown, Check, ChevronDown, ChevronLeft, Copy, MoreHorizontal, Pencil, SquarePen } from "lucide-react";
import Composer from "./Composer";
import Markdown from "./Markdown";
import { deleteChat, renameChat, startCase } from "@/lib/actions";

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
    <button onClick={copy} aria-label="Copy" title="Copy" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-panel hover:text-ink">
      {done ? <Check size={15} /> : <Copy size={15} />}
    </button>
  );
}

export default function AssistantChat({ thread, threads: initialThreads, initial, q, connected, scope }: { thread: T | null; threads: T[]; initial: M[]; q: string; connected: boolean; scope: { id: string; name: string } | null }) {
  const router = useRouter();
  const [msgs, setMsgs] = useState<M[]>(initial);
  const [threads, setThreads] = useState<T[]>(initialThreads);
  const [threadId, setThreadId] = useState<string | null>(thread?.id ?? null);
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
  const end = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);
  const base = scope ? `/assistant?case=${scope.id}` : "/assistant";
  const link = (id: string) => `${base}${scope ? "&" : "?"}t=${id}`;

  const toBottom = (smooth = true) => end.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
  useEffect(() => { toBottom(msgs.length > initial.length); }, [msgs.length, busy]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const check = () => setAtBottom(window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160);
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [msgs.length]);
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
    setMsgs((m) => [...(editFrom ? m.slice(0, editFrom.index) : m), { role: "user", content: message }]);
    if (!editFrom) setText("");
    try {
      const res = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, caseId: scope?.id, threadId, editFrom: editFrom?.id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsgs((m) => [...m.slice(0, -1), { id: data.ids?.user, role: "user", content: message }, { id: data.ids?.reply, role: "assistant", content: data.reply }]);
      if (!threadId && data.threadId) {
        setThreadId(data.threadId);
        setTitle(data.title ?? null);
        setThreads((t) => [{ id: data.threadId, title: data.title ?? "Chat" }, ...t]);
        window.history.replaceState(null, "", link(data.threadId));
      }
      if (data.changed) router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The request failed.");
    } finally {
      setBusy(false);
    }
  }

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
  const box = <Composer value={text} onChange={setText} onSend={(files) => (files.length ? handOver(files) : send(text))} busy={busy} placeholder={scope ? `Ask about ${scope.name}` : "Ask Lincoln anything"} autoFocus={!msgs.length} />;

  const saveTitle = () => {
    const t = (renaming ?? "").trim();
    setRenaming(null);
    if (!t || !threadId || t === title) return;
    setTitle(t);
    setThreads((x) => x.map((y) => (y.id === threadId ? { ...y, title: t } : y)));
    start(() => renameChat(threadId, t));
  };

  const head = (
    <div className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between gap-2 bg-canvas px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md md:-mx-2 md:px-2">
      <div className="relative flex min-w-0 items-center gap-1">
        <Link href={scope ? `/cases/${scope.id}` : "/"} aria-label="Back" className="-ml-1.5 shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-panel hover:text-ink md:hidden"><ChevronLeft size={19} /></Link>
        {renaming !== null ? (
          <input autoFocus value={renaming} maxLength={80} onChange={(e) => setRenaming(e.target.value)} onBlur={saveTitle} onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setRenaming(null); }} className="h-9 w-[min(60vw,360px)] rounded-lg border border-edge bg-card px-2.5 text-[14.5px] font-medium outline-none" />
        ) : (
          <button onClick={(e) => { e.stopPropagation(); setMenu(menu === "chats" ? null : "chats"); }} className="flex min-w-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[14.5px] font-medium transition hover:bg-panel">
            <span className="truncate">{title ?? (scope ? scope.name : "New chat")}</span>
            {threads.length > 0 && <ChevronDown size={15} className="shrink-0 text-muted" />}
          </button>
        )}
        {menu === "chats" && threads.length > 0 && (
          <div onClick={(e) => e.stopPropagation()} className="absolute left-0 top-11 z-30 max-h-[60vh] w-[min(80vw,320px)] overflow-y-auto rounded-2xl border border-line bg-card p-1.5 shadow-lg">
            <Link href={base} className="flex items-center gap-2 rounded-xl px-3 py-2 text-[14px] font-medium transition hover:bg-panel"><SquarePen size={15} /> New chat</Link>
            <div className="my-1 border-t border-line" />
            {threads.map((t) => <Link key={t.id} href={link(t.id)} className={`block truncate rounded-xl px-3 py-2 text-[14px] transition hover:bg-panel ${t.id === threadId ? "bg-panel font-medium" : ""}`}>{t.title}</Link>)}
          </div>
        )}
      </div>
      <div className="relative flex shrink-0 items-center gap-0.5">
        {msgs.length > 0 && <Link href={base} aria-label="New chat" title="New chat" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-panel hover:text-ink"><SquarePen size={17} /></Link>}
        {threadId && <button onClick={(e) => { e.stopPropagation(); setMenu(menu === "more" ? null : "more"); setConfirmDelete(false); }} aria-label="More" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-panel hover:text-ink"><MoreHorizontal size={18} /></button>}
        {menu === "more" && threadId && (
          <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-11 z-30 w-48 rounded-2xl border border-line bg-card p-1.5 shadow-lg">
            <button onClick={() => { setMenu(null); setRenaming(title ?? ""); }} className="w-full rounded-xl px-3 py-2 text-left text-[14px] transition hover:bg-panel">Rename</button>
            {confirmDelete
              ? <button onClick={() => start(() => deleteChat(threadId))} className="w-full rounded-xl px-3 py-2 text-left text-[14px] font-medium text-risk transition hover:bg-risk-bg">Delete this chat</button>
              : <button onClick={() => setConfirmDelete(true)} className="w-full rounded-xl px-3 py-2 text-left text-[14px] text-risk transition hover:bg-risk-bg">Delete</button>}
          </div>
        )}
      </div>
    </div>
  );

  if (msgs.length === 0) {
    return (
      <div className="mx-auto max-w-[720px]">
        {(scope || threads.length > 0) ? head : <Link href="/" aria-label="Back" className="-ml-1.5 inline-flex rounded-lg p-1.5 text-muted md:hidden"><ChevronLeft size={18} /></Link>}
        <div className="flex min-h-[62dvh] flex-col justify-center">
          <h1 className="wordmark mb-8 text-center text-[40px] leading-none md:text-[46px]">Lincoln</h1>
          {box}
          {!connected && <p className="mt-3 text-center text-[13px] text-muted">No model connected.</p>}
          {error && <p className="mt-3 text-[13px] text-risk">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px]">
      {head}
      <div className="flex flex-col gap-8 pb-40">
        {msgs.map((m, i) => m.role === "user" ? (
          <div key={i} className="msg-in group flex flex-col items-end gap-1">
            {editing?.index === i ? (
              <div className="w-full max-w-[90%] rounded-2xl border border-edge bg-card p-3">
                <textarea autoFocus value={editing.text} onChange={(e) => setEditing({ index: i, text: e.target.value })} rows={Math.min(8, editing.text.split("\n").length + 1)} className="w-full resize-none bg-transparent text-[16px] leading-[1.6] outline-none md:text-[16.5px]" />
                <div className="mt-2 flex justify-end gap-2">
                  <button onClick={() => setEditing(null)} className="h-9 rounded-lg border border-line bg-card px-3.5 text-[13.5px] font-medium transition hover:bg-panel">Cancel</button>
                  <button disabled={!editing.text.trim() || busy} onClick={() => send(editing.text, { index: i, id: m.id })} className="h-9 rounded-lg bg-ink px-4 text-[13.5px] font-medium text-canvas transition hover:opacity-90 disabled:opacity-40">Send</button>
                </div>
              </div>
            ) : (
              <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-[20px] bg-panel px-4 py-2.5 text-[16px] leading-[1.6] md:text-[16.5px]">{m.content}</div>
            )}
            {editing?.index !== i && (
              <div className="flex gap-0.5 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                <CopyButton text={m.content} />
                {!busy && <button onClick={() => setEditing({ index: i, text: m.content })} aria-label="Edit" title="Edit" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-panel hover:text-ink"><Pencil size={15} /></button>}
              </div>
            )}
          </div>
        ) : (
          <div key={i} className="msg-in">
            <div className="text-[16px] leading-[1.7] md:text-[16.5px]"><Markdown text={m.content} caseId={scope?.id} /></div>
            <div className="-ml-1.5 mt-2 flex gap-0.5"><CopyButton text={m.content} /></div>
          </div>
        ))}
        {busy && <div className="flex items-center gap-1"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink [animation-delay:150ms]" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink [animation-delay:300ms]" /></div>}
        {error && <p className="text-[14px] text-risk">{error}</p>}
        <div ref={end} />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-canvas from-70% to-transparent px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8 md:left-[248px] md:px-12">
        <div className="relative mx-auto max-w-[720px]">
          {!atBottom && (
            <button onClick={() => toBottom()} aria-label="Scroll to the latest" className="absolute -top-14 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-line bg-card text-ink shadow-md transition hover:bg-panel">
              <ArrowDown size={18} />
            </button>
          )}
          {box}
        </div>
      </div>
    </div>
  );
}
