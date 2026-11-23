"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { QUESTIONS, type Question } from "@/lib/enquiry";

// The Get In Touch page: a few questions about the firm. A person replies by email with a quote and next steps.
// Same look as the landing page; American English.

const field = "w-full rounded-xl bg-[#171716] text-[#f4f3ef] px-4 py-3.5 text-[16px] ring-1 ring-[#302f2c] outline-none transition placeholder:text-[#5c5953] focus:ring-2 focus:ring-[#f4f3ef]";
const labelCls = "text-[14.5px] font-medium";

/** A dropdown in the form's own style: "Select" until chosen; several choices for a question that takes all that apply. */
function Dropdown({ q, value, onChange }: { q: Question; value: string | string[] | undefined; onChange: (v: string | string[]) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const chosen = q.multi ? ((value as string[] | undefined) ?? []) : value ? [value as string] : [];

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  const pick = (o: string) => {
    if (!q.multi) { onChange(o); setOpen(false); return; }
    onChange(chosen.includes(o) ? chosen.filter((x) => x !== o) : [...chosen, o]);
  };

  return (
    <div ref={box} className="relative">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${q.id}-label`} onClick={() => setOpen((x) => !x)}
        className={`${field} flex items-center justify-between gap-3 text-left`}>
        <span className={`truncate ${chosen.length ? "" : "text-[#5c5953]"}`}>{!chosen.length ? "Select" : chosen.length <= 2 ? chosen.join(", ") : `${chosen[0]} and ${chosen.length - 1} more`}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-[#8d8982] transition-transform ${open ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <ul role="listbox" aria-multiselectable={q.multi || undefined}
          className="dropdown-in absolute left-0 right-0 z-30 mt-2 max-h-[320px] overflow-y-auto rounded-xl bg-[#171716] p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] ring-1 ring-[#302f2c]">
          {q.options.map((o) => {
            const on = chosen.includes(o);
            return (
              <li key={o} role="option" aria-selected={on}>
                <button type="button" onClick={() => pick(o)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[15.5px] transition hover:bg-[#232321] ${on ? "text-[#f4f3ef]" : "text-[#d6d3cc]"}`}>
                  {o}
                  {on && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function StartForm() {
  const [v, setV] = useState<Record<string, string | string[]>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "done">("idle");
  const [error, setError] = useState("");

  const set = (id: string, val: string | string[]) => { setV((o) => ({ ...o, [id]: val })); setError(""); };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const missing = QUESTIONS.some((q) => (q.multi ? !(v[q.id] as string[] | undefined)?.length : !v[q.id]));
    if (missing || !String(form.get("name") ?? "").trim() || !String(form.get("email") ?? "").trim() || !String(form.get("firm") ?? "").trim()) { setError("Answer every question."); return; }
    setState("sending");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, name: form.get("name"), email: form.get("email"), firm: form.get("firm"), notes: form.get("notes"), website: form.get("website") }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) { setError(out.error ?? "Not sent. Try again."); setState("idle"); return; }
      // As with Approve and send in the app: the button turns, reads "Sent!", then the thank you comes up.
      setState("sent");
      await new Promise((ok) => setTimeout(ok, 1100));
      setState("done");
      window.scrollTo({ top: 0 });
    } catch {
      setError("Not sent. Try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#0e0e0d] px-6 text-center font-sans text-[#f4f3ef] antialiased">
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden className="tick">
          <circle cx="36" cy="36" r="33" stroke="#f4f3ef" strokeWidth="2.5" className="tick-ring" />
          <path d="M23 37.5 32 46.5 50 27" stroke="#f4f3ef" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="tick-mark" />
        </svg>
        <h1 className="hero-in mt-8 font-serif text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] [animation-delay:500ms] md:text-[64px]">Thank you.</h1>
        <Link href="/" className="hero-in mt-9 inline-block rounded-[10px] bg-[#f4f3ef] px-6 py-3.5 text-[15.5px] font-medium text-[#0e0e0d] transition [animation-delay:650ms] hover:opacity-85">Back to Lincoln</Link>
      </div>
    );
  }

  const busy = state === "sending" || state === "sent";

  return (
    <div className="min-h-dvh bg-[#0e0e0d] font-sans text-[#f4f3ef] antialiased selection:bg-[#3a3122]">
      <header className="mx-auto flex h-16 max-w-[1200px] items-center px-4 md:px-8">
        <Link href="/" aria-label="Back" className="-ml-2 flex h-10 w-10 items-center justify-center rounded-[10px] transition hover:bg-[#1f1f1d]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
        </Link>
      </header>

      <main className="mx-auto max-w-[620px] px-4 pb-24 pt-6 md:px-8 md:pt-12">
        <h1 className="hero-in font-serif text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] md:text-[64px]">Get In Touch</h1>
        <p className="hero-in mt-4 max-w-[38ch] font-serif text-[17.5px] leading-[1.6] text-[#a6a39c] [animation-delay:100ms] md:text-[19px]">We reply by email with a quote within 48hrs.</p>

        <form onSubmit={submit} onInput={() => setError("")} className="hero-in mt-10 flex flex-col gap-7 [animation-delay:200ms]" noValidate>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-2"><span className={labelCls}>Full name</span><input name="name" required autoComplete="name" className={field} /></label>
            <label className="flex flex-col gap-2"><span className={labelCls}>Work email</span><input name="email" type="email" required autoComplete="email" className={field} /></label>
            <label className="flex flex-col gap-2"><span className={labelCls}>Firm name</span><input name="firm" required autoComplete="organization" className={field} /></label>
            {/* Hidden from people; bots fill it in. */}
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
          </div>

          {QUESTIONS.map((q) => (
            <div key={q.id} className="flex flex-col gap-2">
              <span id={`${q.id}-label`} className={labelCls}>{q.label}{q.multi && <span className="font-normal text-[#74716b]"> · All that apply</span>}</span>
              <Dropdown q={q} value={v[q.id]} onChange={(val) => set(q.id, val)} />
            </div>
          ))}

          <label className="flex flex-col gap-2">
            <span className={labelCls}>Anything else <span className="font-normal text-[#74716b]">· Optional</span></span>
            <textarea name="notes" rows={4} className={`${field} resize-none`} />
          </label>

          {error && <p className="text-[14.5px] text-[#e0796f]">{error}</p>}
          <button type="submit" disabled={busy} className="relative flex h-14 w-full items-center justify-center rounded-xl bg-[#f4f3ef] text-[16px] font-medium text-[#0e0e0d] transition active:scale-[0.99] [@media(hover:hover)]:hover:opacity-90">
            <span className={busy ? "invisible" : ""}>Send</span>
            {busy && <span className="absolute inset-0 flex items-center justify-center">{state === "sending" ? <span aria-label="Sending" className="h-5 w-5 animate-spin rounded-full border-2 border-[#0e0e0d]/25 border-t-[#0e0e0d]" /> : "Sent!"}</span>}
          </button>
        </form>
      </main>
    </div>
  );
}
