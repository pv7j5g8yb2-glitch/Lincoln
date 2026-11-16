"use client";

import Link from "next/link";
import { useState } from "react";
import { QUESTIONS } from "@/lib/enquiry";

// The Get started page: a few questions about the firm. A person replies by email with a quote and next steps.
// Same look as the landing page; American English.

const field = "w-full rounded-xl bg-white px-4 py-3.5 text-[16px] ring-1 ring-[#e2dfd8] outline-none transition placeholder:text-[#b1ada5] focus:ring-2 focus:ring-[#161614]";
const labelCls = "text-[14.5px] font-medium";

export default function StartForm() {
  const [v, setV] = useState<Record<string, string | string[]>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  const set = (id: string, val: string | string[]) => setV((o) => ({ ...o, [id]: val }));
  const toggle = (id: string, opt: string) => {
    const cur = Array.isArray(v[id]) ? (v[id] as string[]) : [];
    set(id, cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]);
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const missing = QUESTIONS.some((q) => (q.multi ? !(v[q.id] as string[] | undefined)?.length : !v[q.id]));
    if (missing) { setError("Answer every question."); return; }
    setState("sending");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, name: form.get("name"), email: form.get("email"), firm: form.get("firm"), notes: form.get("notes"), website: form.get("website") }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) { setError(out.error ?? "Not sent. Try again."); setState("idle"); return; }
      setState("sent");
      window.scrollTo({ top: 0 });
    } catch {
      setError("Not sent. Try again.");
      setState("idle");
    }
  }

  return (
    <div className="min-h-dvh bg-[#faf9f6] font-sans text-[#161614] antialiased selection:bg-[#efe6d6]">
      <header className="mx-auto flex h-16 max-w-[1200px] items-center px-4 md:px-8">
        <Link href="/" aria-label="Back" className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[#f0eee9]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
        </Link>
      </header>

      <main className="mx-auto max-w-[620px] px-4 pb-24 pt-6 md:px-8 md:pt-12">
        {state === "sent" ? (
          <div className="hero-in pt-10">
            <h1 className="font-serif text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] md:text-[64px]">Thank you.</h1>
            <p className="mt-5 max-w-[34ch] text-[17.5px] leading-[1.6] text-[#6b6862]">We&apos;ll reply by email with a quote and next steps.</p>
            <Link href="/" className="mt-9 inline-block rounded-full bg-[#161614] px-6 py-3.5 text-[15.5px] font-medium text-white transition hover:opacity-85">Back to Lincoln</Link>
          </div>
        ) : (
          <>
            <h1 className="hero-in font-serif text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] md:text-[64px]">Get started</h1>
            <p className="hero-in mt-4 max-w-[38ch] text-[17px] leading-[1.6] text-[#6b6862] [animation-delay:100ms] md:text-[18px]">A few questions about your firm. We reply by email with a quote.</p>

            <form onSubmit={submit} className="hero-in mt-10 flex flex-col gap-8 [animation-delay:200ms]" noValidate>
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-2"><span className={labelCls}>Full name</span><input name="name" required autoComplete="name" className={field} /></label>
                <label className="flex flex-col gap-2"><span className={labelCls}>Work email</span><input name="email" type="email" required autoComplete="email" className={field} /></label>
                <label className="flex flex-col gap-2"><span className={labelCls}>Firm</span><input name="firm" required autoComplete="organization" className={field} /></label>
                {/* Hidden from people; bots fill it in. */}
                <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
              </div>

              {QUESTIONS.map((q) => (
                <fieldset key={q.id} className="flex flex-col gap-3">
                  <legend className={`${labelCls} mb-3`}>{q.label}{q.multi && <span className="font-normal text-[#a09d96]"> · all that apply</span>}</legend>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((o) => {
                      const on = q.multi ? ((v[q.id] as string[] | undefined) ?? []).includes(o) : v[q.id] === o;
                      return (
                        <button key={o} type="button" aria-pressed={on} onClick={() => (q.multi ? toggle(q.id, o) : set(q.id, o))}
                          className={`rounded-full px-4 py-2.5 text-[15px] transition ${on ? "bg-[#161614] text-white" : "bg-white ring-1 ring-[#e2dfd8] hover:ring-[#b9b5ad]"}`}>
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}

              <label className="flex flex-col gap-2">
                <span className={labelCls}>Anything else <span className="font-normal text-[#a09d96]">· optional</span></span>
                <textarea name="notes" rows={4} className={`${field} resize-none`} />
              </label>

              {error && <p className="text-[14.5px] text-[#9b2c24]">{error}</p>}
              <div>
                <button type="submit" disabled={state === "sending"} className="rounded-full bg-[#161614] px-7 py-3.5 text-[15.5px] font-medium text-white transition hover:opacity-85 disabled:opacity-50">
                  {state === "sending" ? "Sending" : "Send"}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
