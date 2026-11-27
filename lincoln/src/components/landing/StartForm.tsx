"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FORM_ORDER, QUESTIONS, type Question } from "@/lib/enquiry";

// The Get In Touch page, one question at a time. Built for finishing: it opens on the easiest question, a tap selects
// and Next moves on (Enter too), a thin line at the top shows how far along it is, and the name,
// email and firm come last ("Where should we send your quote?"), once the firm is invested. Answers survive a refresh.
// A person replies by email with a quote. Same look as the landing page; American English.

const STEPS: Question[] = FORM_ORDER.map((id) => QUESTIONS.find((q) => q.id === id)!);
const LAST = STEPS.length; // the contact step
const KEY = "lincoln.start";

type Answers = Record<string, string | string[]>;
type Contact = { name: string; email: string; firm: string; notes: string; website: string };

const field = "w-full appearance-none rounded-none bg-black px-4 py-3.5 text-[16px] text-white outline-none ring-1 ring-white/15 transition placeholder:text-white/30 focus:ring-white/70";
const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export default function StartForm() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [v, setV] = useState<Answers>({});
  const [c, setC] = useState<Contact>({ name: "", email: "", firm: "", notes: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const first = useRef<HTMLInputElement>(null);

  // Restore what was answered before a refresh (this browser only).
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as { step: number; v: Answers; c: Contact } | null;
      if (saved) { setV(saved.v ?? {}); setC((x) => ({ ...x, ...(saved.c ?? {}), website: "" })); setStep(Math.min(Math.max(0, saved.step ?? 0), LAST)); }
    } catch { /* no storage: start fresh */ }
  }, []);
  useEffect(() => {
    if (state === "done") return;
    try { sessionStorage.setItem(KEY, JSON.stringify({ step, v, c: { ...c, website: "" } })); } catch { /* fine without it */ }
  }, [step, v, c, state]);
  useEffect(() => { if (step === LAST) window.setTimeout(() => first.current?.focus({ preventScroll: true }), 350); }, [step]);

  const go = (n: number) => { setError(""); setPicked(null); setDir(n > step ? 1 : -1); setStep(n); window.scrollTo({ top: 0 }); };
  const q = STEPS[step];
  const chosen = q ? (q.multi ? ((v[q.id] as string[] | undefined) ?? []) : v[q.id] ? [v[q.id] as string] : []) : [];
  const answered = (s: number) => { const x = STEPS[s]; return x.multi ? Boolean((v[x.id] as string[] | undefined)?.length) : Boolean(v[x.id]); };

  const pick = (o: string) => {
    if (!q) return;
    if (q.multi) { setV((x) => { const list = (x[q.id] as string[] | undefined) ?? []; return { ...x, [q.id]: list.includes(o) ? list.filter((y) => y !== o) : [...list, o] }; }); return; }
    // A choice only selects; Next moves on, the same on every question (Ismael, 2026-11-27).
    setV((x) => ({ ...x, [q.id]: o }));
    setPicked(o);
  };

  async function send() {
    setError("");
    const missing = STEPS.findIndex((_, i) => !answered(i));
    if (missing >= 0) { go(missing); return; }
    if (!c.name.trim() || !c.firm.trim() || !validEmail(c.email)) { setError(!validEmail(c.email) && c.email ? "Check the email address." : "Name, work email and firm name."); return; }
    setState("sending");
    try {
      const res = await fetch("/api/enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...v, ...c }) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) { setError(out.error ?? "Not sent. Try again."); setState("idle"); return; }
      try { sessionStorage.removeItem(KEY); } catch { /* nothing kept */ }
      setState("done");
      window.scrollTo({ top: 0 });
    } catch {
      setError("Not sent. Try again.");
      setState("idle");
    }
  }

  // Enter moves on (or sends on the last step); Escape goes back.
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (state !== "idle") return;
      const t = e.target as HTMLElement;
      if (e.key === "Enter" && t.tagName !== "TEXTAREA" && t.tagName !== "BUTTON") {
        if (step === LAST) { e.preventDefault(); void send(); }
        else if (answered(step)) { e.preventDefault(); go(step + 1); }
      }
    };
    addEventListener("keydown", on); return () => removeEventListener("keydown", on);
  });

  if (state === "done") {
    return (
      <div className="landing-root flex min-h-dvh flex-col items-center justify-center bg-black px-6 text-center font-sans text-white antialiased">
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden className="tick">
          <circle cx="36" cy="36" r="33" stroke="#ffffff" strokeWidth="2" className="tick-ring" />
          <path d="M23 37.5 32 46.5 50 27" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="tick-mark" />
        </svg>
        <h1 className="hero-in mt-8 font-serif text-[44px] font-light leading-[1.05] tracking-[-0.02em] [animation-delay:500ms] md:text-[64px]">Thank you.</h1>
        <Link href="/" className="hero-in mt-9 inline-block bg-white px-6 py-3.5 text-[13.5px] font-medium text-black transition [animation-delay:650ms] hover:bg-white/85">Back to Lincoln</Link>
      </div>
    );
  }

  const progress = (step + (step === LAST ? 0.5 : 0)) / (LAST + 0.5);
  const busy = state === "sending";
  const title = "font-serif text-[32px] font-light leading-[1.12] tracking-[-0.02em] md:text-[48px]";

  return (
    <div className="landing-root min-h-dvh bg-black font-sans text-white antialiased selection:bg-white/20">
      {/* How far along: a thin line across the top that fills step by step. */}
      <div className="fixed inset-x-0 top-0 z-20 h-[2px] bg-white/10" role="progressbar" aria-valuemin={1} aria-valuemax={LAST + 1} aria-valuenow={step + 1} aria-label="Progress">
        <div className="h-full bg-white transition-[width] duration-500 ease-[cubic-bezier(.2,.8,.2,1)]" style={{ width: `${Math.max(4, progress * 100)}%` }} />
      </div>

      <header className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-5 md:h-20 md:px-10">
        {step === 0
          ? <Link href="/" aria-label="Back to Lincoln" className="-ml-2 flex h-10 w-10 items-center justify-center text-white/70 transition hover:text-white"><Arrow /></Link>
          : <button type="button" onClick={() => go(step - 1)} aria-label="Previous question" className="-ml-2 flex h-10 w-10 items-center justify-center text-white/70 transition hover:text-white"><Arrow /></button>}
        <span className="text-[12px] tabular-nums tracking-[0.14em] text-white/35">{step + 1} / {LAST + 1}</span>
      </header>

      <main className="mx-auto max-w-[640px] px-5 pb-28 pt-6 md:px-8 md:pt-14">
        <div key={step} className={dir > 0 ? "step-in" : "step-back"}>
          {q ? (
            <>
              {step === 0 && <p className="mb-5 text-[12px] font-medium uppercase tracking-[0.18em] text-white/45">Get In Touch · About a minute</p>}
              <h1 className={title}>{q.ask}</h1>
              {q.multi && <p className="mt-3 text-[14.5px] text-white/45">All that apply</p>}
              <div role={q.multi ? "group" : "radiogroup"} aria-label={q.ask} className={`mt-8 grid gap-2 md:mt-10 ${q.options.length > 8 ? "md:grid-cols-2" : ""}`}>
                {q.options.map((o, i) => {
                  const on = chosen.includes(o);
                  return (
                    <button key={o} type="button" role={q.multi ? "checkbox" : "radio"} aria-checked={on} onClick={() => pick(o)}
                      className={`option-in flex items-center justify-between gap-4 px-4 py-4 text-left text-[16px] ring-1 transition duration-200 md:py-[18px] ${on ? "bg-white text-black ring-white" : "text-white/85 ring-white/15 [@media(hover:hover)]:hover:ring-white/50"} ${picked === o ? "scale-[0.99]" : ""}`}
                      style={{ animationDelay: `${60 + i * 30}ms` }}>
                      <span>{o}</span>
                      {on && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>}
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={() => go(step + 1)} disabled={!answered(step)}
                className="mt-8 flex h-14 w-full items-center justify-center bg-white text-[14.5px] font-medium text-black transition disabled:opacity-30 md:w-auto md:px-10 [@media(hover:hover)]:enabled:hover:bg-white/85">
                Next
              </button>
            </>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); void send(); }} noValidate>
              <h1 className={title}>Where should we send your quote?</h1>
              <p className="mt-3 text-[15px] text-white/50">By email within 48hrs.</p>
              <div className="mt-8 flex flex-col gap-4 md:mt-10">
                <label className="flex flex-col gap-2"><span className="text-[14px] font-medium text-white/85">Full name</span><input ref={first} value={c.name} onChange={(e) => { setC({ ...c, name: e.target.value }); setError(""); }} autoComplete="name" className={field} /></label>
                <label className="flex flex-col gap-2"><span className="text-[14px] font-medium text-white/85">Work email</span><input type="email" inputMode="email" value={c.email} onChange={(e) => { setC({ ...c, email: e.target.value }); setError(""); }} autoComplete="email" className={field} /></label>
                <label className="flex flex-col gap-2"><span className="text-[14px] font-medium text-white/85">Firm name</span><input value={c.firm} onChange={(e) => { setC({ ...c, firm: e.target.value }); setError(""); }} autoComplete="organization" className={field} /></label>
                <label className="flex flex-col gap-2"><span className="text-[14px] font-medium text-white/85">Anything else <span className="font-normal text-white/35">· Optional</span></span><textarea rows={3} value={c.notes} onChange={(e) => setC({ ...c, notes: e.target.value })} className={`${field} resize-none`} /></label>
                {/* Hidden from people; bots fill it in. */}
                <input name="website" tabIndex={-1} autoComplete="off" aria-hidden value={c.website} onChange={(e) => setC({ ...c, website: e.target.value })} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
              </div>
              {error && <p className="mt-5 text-[14.5px] text-[#e0796f]">{error}</p>}
              <button type="submit" disabled={busy} className="relative mt-8 flex h-14 w-full items-center justify-center bg-white text-[14.5px] font-medium text-black transition active:scale-[0.99] [@media(hover:hover)]:hover:bg-white/85">
                <span className={busy ? "invisible" : ""}>Get my quote</span>
                {busy && <span className="absolute inset-0 flex items-center justify-center"><span aria-label="Sending" className="h-5 w-5 animate-spin rounded-full border-2 border-black/25 border-t-black" /></span>}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

function Arrow() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>;
}
