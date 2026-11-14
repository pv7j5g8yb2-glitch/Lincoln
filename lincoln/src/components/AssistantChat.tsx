"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import { SquarePen, ChevronLeft } from "lucide-react";
import Composer from "./Composer";
import { clearChat, startCase } from "@/lib/actions";

type M = { role: string; content: string };

/** Minimal rendering for model replies: paragraphs, bullet and numbered lines, bold. */
function Rich({ text }: { text: string }) {
  const links = (s: string, k: number) => s.split(/(\/cases\/[\w?=&-]+)/g).map((p, i) => (i % 2 ? <Link key={`${k}-${i}`} href={p} className="underline underline-offset-4">Open</Link> : <Fragment key={`${k}-${i}`}>{p}</Fragment>));
  const bold = (s: string) => s.split(/\*\*(.+?)\*\*/g).map((p, i) => (i % 2 ? <strong key={i} className="font-semibold">{p}</strong> : <Fragment key={i}>{links(p.replace(/^#+\s*/, ""), i)}</Fragment>));
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l))) {
          return <ul key={i} className="flex flex-col gap-1 pl-4">{lines.map((l, k) => <li key={k} className="list-disc marker:text-faint">{bold(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ""))}</li>)}</ul>;
        }
        return <p key={i}>{lines.map((l, k) => <Fragment key={k}>{k > 0 && <br />}{bold(l)}</Fragment>)}</p>;
      })}
    </div>
  );
}

export default function AssistantChat({ initial, q, connected, scope }: { initial: M[]; q: string; connected: boolean; scope: { id: string; name: string } | null }) {
  const router = useRouter();
  const [msgs, setMsgs] = useState<M[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [msgs, busy]);

  async function send(t: string) {
    const message = t.trim();
    if (!message || busy) return;
    setError(null);
    setBusy(true);
    setMsgs((m) => [...m, { role: "user", content: message }]);
    setText("");
    try {
      const res = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, caseId: scope?.id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsgs((m) => [...m, { role: "assistant", content: data.reply }]);
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
      router.replace(scope ? `/assistant?case=${scope.id}` : "/assistant", { scroll: false });
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
  const box = <Composer value={text} onChange={setText} onSend={(files) => (files.length ? handOver(files) : send(text))} busy={busy} placeholder={scope ? `Ask about ${scope.name}` : "Ask Lincoln anything"} autoFocus />;

  const head = (
    <div className="mb-6 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-1 text-[13px] text-muted">
        <Link href={scope ? `/cases/${scope.id}` : "/"} aria-label="Back" className="-ml-1.5 rounded-lg p-1.5 transition hover:bg-panel hover:text-ink md:hidden"><ChevronLeft size={18} /></Link>
      </div>
      {msgs.length > 0 && (
        <button onClick={() => start(async () => { await clearChat(scope?.id ?? null); setMsgs([]); setError(null); })} aria-label="New chat" title="New chat" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-panel hover:text-ink"><SquarePen size={16} /></button>
      )}
    </div>
  );

  if (msgs.length === 0) {
    return (
      <div className="mx-auto max-w-[680px]">
        {scope ? head : <Link href="/" aria-label="Back" className="-ml-1.5 inline-flex rounded-lg p-1.5 text-muted md:hidden"><ChevronLeft size={18} /></Link>}
        <div className="flex min-h-[62dvh] flex-col justify-center">
          <h1 className="wordmark mb-8 text-center text-[40px] leading-none md:text-[46px]">Lincoln</h1>
          {box}
          {error && <p className="mt-3 text-[13px] text-risk">{error}</p>}
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-[720px]">
      {head}
      <div className="flex flex-col gap-7 pb-36">
        {msgs.map((m, i) => m.role === "user"
          ? <div key={i} className="msg-in ml-auto max-w-[85%] whitespace-pre-line rounded-2xl bg-panel px-4 py-2.5 text-[14.5px] leading-relaxed">{m.content}</div>
          : <div key={i} className="msg-in text-[14.5px] leading-[1.7]"><Rich text={m.content} /></div>)}
        {busy && <div className="flex items-center gap-1"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink [animation-delay:150ms]" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink [animation-delay:300ms]" /></div>}
        {error && <p className="text-[13px] text-risk">{error}</p>}
        <div ref={end} />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-canvas from-70% to-transparent px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8 md:left-[248px] md:px-12">
        <div className="mx-auto max-w-[720px]">{box}</div>
      </div>
    </div>
  );
}
