"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

// Lincoln's public front page. Clean and quiet, in the app's own colours (light or dark with the device): large
// serif type, one sentence that turns to ink word by word, and the work shown as the papers Lincoln hands back.
// American English.

/** Progress of an element through the viewport: 0 when its top meets the bottom of the screen, 1 when its
 *  bottom leaves the top. */
function useProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = 0;
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect(), h = window.innerHeight;
      setP(Math.min(1, Math.max(0, (h - r.top) / (r.height + h))));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return [ref, p] as const;
}

const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

/** A sentence in grey that turns to ink word by word as it is scrolled past. */
function Reveal({ text, className = "" }: { text: string; className?: string }) {
  const [ref, p] = useProgress<HTMLParagraphElement>();
  const words = text.split(" ");
  const lit = Math.round(ease((p - 0.15) / 0.45) * words.length);
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <span key={i} className="transition-colors duration-500" style={{ color: i < lit ? "var(--color-ink)" : "color-mix(in srgb, var(--color-ink) 16%, transparent)" }}>{w}{" "}</span>
      ))}
    </p>
  );
}

/** Fades children into place once they come into view, and tells them when they have. */
function In({ children, delay = 0, className = "" }: { children: ReactNode | ((on: boolean) => ReactNode); delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(ref.current!); return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-[1000ms] ease-[cubic-bezier(.2,.8,.2,1)] ${on ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {typeof children === "function" ? children(on) : children}
    </div>
  );
}

/* The papers Lincoln hands back, drawn in HTML. Every name and number is made up. */
const card = "rounded-2xl bg-card ring-1 ring-line shadow-[0_1px_2px_rgba(0,0,0,0.03),0_24px_48px_-32px_rgba(0,0,0,0.28)]";
const label = "text-[12px] font-medium uppercase tracking-[0.12em] text-faint";

function MailCard({ on }: { on: boolean }) {
  return (
    <div className={`${card} p-6`}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-panel text-[13px] font-semibold">DR</div>
        <div className="min-w-0"><p className="text-[14.5px] font-semibold">Daniel Reyes</p><p className="truncate text-[13px] text-muted">Green card for my wife</p></div>
        <span className="ml-auto text-[12.5px] text-faint">8:02 AM</span>
      </div>
      <p className="mt-4 text-[14.5px] leading-relaxed text-muted">Hi, my wife Sofia and I want to apply for her green card. Her documents are attached.</p>
      <div className={`mt-5 flex items-center justify-between rounded-xl bg-panel px-4 py-3 text-[13.5px] transition-all delay-300 duration-700 ${on ? "opacity-100" : "translate-y-1 opacity-0"}`}>
        <span className="font-medium">Case opened</span><span className="text-muted">Sofia Reyes · I-485</span>
      </div>
    </div>
  );
}

function ReadCard({ on }: { on: boolean }) {
  const rows = [["Marriage date", "March 9 or March 19, 2024?", "pp. 1, 2"], ["Sponsor income", "Below the 2026 minimum", "p. 3"], ["Last entry", "B-2, June 14, 2022", "p. 1"]];
  return (
    <div className={`${card} p-6`}>
      <p className={label}>Sofia Reyes · For review</p>
      <div className="mt-4 flex flex-col divide-y divide-line">
        {rows.map(([a, b, c], i) => (
          <div key={a} className={`flex items-center justify-between gap-3 py-3 transition-opacity duration-700 ${on ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: `${250 + i * 160}ms` }}>
            <div className="min-w-0"><p className="text-[12.5px] text-faint">{a}</p><p className="truncate text-[14.5px] font-medium">{b}</p></div>
            <span className="shrink-0 text-[12.5px] text-faint">{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormCard({ on }: { on: boolean }) {
  const fields = [["Family name", "Marquez Reyes"], ["Given name", "Sofia"], ["Date of birth", "08/21/1994"], ["Country of birth", "Colombia"]];
  return (
    <div className={`${card} overflow-hidden`}>
      <div className="flex items-center justify-between border-b border-line px-6 py-3.5"><p className="text-[13.5px] font-semibold">Form I-485</p><p className="text-[12.5px] text-faint">Part 1</p></div>
      <div className="flex flex-col divide-y divide-line px-6">
        {fields.map(([l, v], i) => (
          <div key={l} className="flex items-center justify-between py-3">
            <span className="text-[13.5px] text-muted">{l}</span>
            <span className="inline-block overflow-hidden whitespace-nowrap font-mono text-[13.5px] transition-[max-width] duration-700 ease-out" style={{ maxWidth: on ? "14ch" : "0ch", transitionDelay: `${300 + i * 220}ms` }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LetterCard() {
  return (
    <div className={`${card} p-7`}>
      <p className={label}>Support letter · Draft</p>
      <p className="mt-4 font-serif text-[16px] leading-[1.75]">
        Dr. Okoro&apos;s sensors detect lead in municipal water at a fraction of the current cost <span className="text-faint">(Exhibit 4)</span>. Two Massachusetts towns are now piloting the system <span className="text-faint">(Exhibit 7)</span>.
      </p>
    </div>
  );
}

function ApproveCard() {
  return (
    <div className={`${card} p-6`}>
      <p className={label}>Awaiting approval</p>
      <p className="mt-3 text-[19px] font-semibold tracking-[-0.01em]">Filing packet · Sofia Reyes</p>
      <p className="mt-1 text-[14px] text-muted">Cover letter, 5 forms, 14 exhibits</p>
      <div className="mt-6 flex gap-2.5">
        <span className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-canvas">Approve</span>
        <span className="rounded-full px-5 py-2.5 text-[14px] font-medium ring-1 ring-edge">Review</span>
      </div>
    </div>
  );
}

const STEPS: { title: string; line: string; Card: (p: { on: boolean }) => ReactNode }[] = [
  { title: "Reads the mail.", line: "A client writes in. The case is open before anyone sees the email.", Card: MailCard },
  { title: "Reads the file.", line: "Conflicts, gaps and bars, each with the page it came from.", Card: ReadCard },
  { title: "Fills the forms.", line: "Official USCIS editions, filled from the documents.", Card: FormCard },
  { title: "Drafts the letters.", line: "Support letters and RFE responses, cited to the evidence.", Card: LetterCard },
  { title: "Asks you.", line: "Nothing is filed or sent without an attorney's approval.", Card: ApproveCard },
];

const TRUST = [
  ["Encrypted", "The database and every file, at rest."],
  ["Never used for training", "Client files are not used to train AI models."],
  ["Two-step sign in", "Can be required for the whole firm."],
  ["Yours to take", "Export or delete everything, at any time."],
];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener("scroll", on, { passive: true }); return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className="min-h-dvh bg-canvas text-ink antialiased">
      <header className={`sticky top-0 z-50 bg-canvas/85 backdrop-blur-md transition-[border-color] duration-300 ${scrolled ? "border-b border-line" : "border-b border-transparent"}`}>
        <nav className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-5 md:px-8">
          <Link href="/welcome" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mark.png" alt="" width={26} height={26} className="rounded-[7px]" />
            <span className="font-serif text-[19px] font-semibold tracking-[-0.01em]">Lincoln</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/signin" className="rounded-full px-4 py-2 text-[14.5px] text-muted transition hover:text-ink">Sign in</Link>
            <Link href="/signup" className="rounded-full bg-ink px-4 py-2 text-[14.5px] font-medium text-canvas transition hover:opacity-85">Get started</Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-[1120px] px-5 pb-24 pt-20 md:px-8 md:pb-36 md:pt-36">
        <p className="hero-in text-[14px] text-muted md:text-[15px]">For immigration law firms</p>
        <h1 className="hero-in mt-5 max-w-[12ch] font-serif text-[50px] font-semibold leading-[1.0] tracking-[-0.035em] [animation-delay:100ms] md:text-[104px]">
          The work, done before you ask.
        </h1>
        <p className="hero-in mt-7 max-w-[34ch] text-[17.5px] leading-[1.6] text-muted [animation-delay:200ms] md:text-[20px]">
          Lincoln reads the firm&apos;s mail, opens each case, fills the forms and drafts the letters. You approve.
        </p>
        <div className="hero-in mt-9 flex items-center gap-3 [animation-delay:300ms]">
          <Link href="/signup" className="rounded-full bg-ink px-6 py-3.5 text-[15.5px] font-medium text-canvas transition hover:opacity-85">Get started</Link>
          <a href="#work" className="rounded-full px-5 py-3.5 text-[15.5px] font-medium text-ink transition hover:bg-panel">How it works</a>
        </div>
      </section>

      {/* The statement, lit word by word. */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[1120px] px-5 py-28 md:px-8 md:py-44">
          <Reveal className="max-w-[20ch] font-serif text-[36px] font-semibold leading-[1.12] tracking-[-0.025em] md:text-[68px]" text="Most of an immigration practice is paperwork. Lincoln does the paperwork. You practice law." />
        </div>
      </section>

      {/* The work, one paper at a time. */}
      <section id="work" className="scroll-mt-16 border-t border-line">
        <div className="mx-auto flex max-w-[1120px] flex-col px-5 py-24 md:px-8 md:py-36">
          {STEPS.map((s, i) => (
            <In key={s.title} className={i ? "mt-24 md:mt-32" : ""}>
              {(on) => (
                <div className="grid items-center gap-8 md:grid-cols-[1fr_440px] md:gap-20">
                  <div>
                    <p className="font-mono text-[13px] text-faint">0{i + 1}</p>
                    <h3 className="mt-2 font-serif text-[32px] font-semibold leading-[1.1] tracking-[-0.025em] md:text-[48px]">{s.title}</h3>
                    <p className="mt-3 max-w-[30ch] text-[16.5px] leading-[1.6] text-muted md:text-[18px]">{s.line}</p>
                  </div>
                  <s.Card on={on} />
                </div>
              )}
            </In>
          ))}
        </div>
      </section>

      {/* Client files. */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-[1120px] gap-12 px-5 py-24 md:grid-cols-2 md:gap-20 md:px-8 md:py-36">
          <In><h2 className="font-serif text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[56px]">Built for client files.</h2></In>
          <div className="flex flex-col">
            {TRUST.map(([a, b], i) => (
              <In key={a} delay={i * 80}>
                <div className={`py-5 ${i ? "border-t border-line" : ""}`}><p className="text-[17px] font-medium">{a}</p><p className="mt-1 text-[15.5px] text-muted">{b}</p></div>
              </In>
            ))}
          </div>
        </div>
      </section>

      {/* Close. */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[1120px] px-5 pb-12 pt-28 md:px-8 md:pt-40">
          <In>
            <h2 className="font-serif text-[48px] font-semibold leading-[1.0] tracking-[-0.035em] md:text-[96px]">Start your first case.</h2>
            <div className="mt-9"><Link href="/signup" className="inline-block rounded-full bg-ink px-6 py-3.5 text-[15.5px] font-medium text-canvas transition hover:opacity-85">Get started</Link></div>
          </In>
          <footer className="mt-32 flex flex-col gap-5 border-t border-line pt-8 text-[13px] text-faint md:flex-row md:items-center md:justify-between">
            <span>© 2026 Lincoln. Not a law firm. Every draft is for attorney review.</span>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-ink">Terms</Link>
              <Link href="/privacy" className="hover:text-ink">Privacy</Link>
              <a href="mailto:hello@uselincoln.com" className="hover:text-ink">hello@uselincoln.com</a>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
