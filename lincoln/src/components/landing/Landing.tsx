"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

// Lincoln's public front page. Warm white, serif type and Ismael's own photographs, with the work laid on top of
// them. Motion stays quiet: photographs drift against the scroll, one sentence turns to ink word by word, each
// piece of work settles into place, and the case papers spread across a desk fold into a filing packet in 3D.
// American English. Every name and number on the page is made up.

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

/** Progress through a tall section whose content is pinned: 0 when it reaches the top, 1 when it lets go. */
function usePinned<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = 0;
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect();
      setP(Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight))));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return [ref, p] as const;
}

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const easeInOut = (x: number) => { const t = clamp(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

/** A sentence in grey that turns to ink word by word as it is scrolled past. */
function Reveal({ text, className = "" }: { text: string; className?: string }) {
  const [ref, p] = useProgress<HTMLParagraphElement>();
  const words = text.split(" ");
  const lit = Math.round(ease((p - 0.15) / 0.42) * words.length);
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <span key={i} className="transition-colors duration-500" style={{ color: i < lit ? "#161614" : "rgba(22,22,20,0.16)" }}>{w}{" "}</span>
      ))}
    </p>
  );
}

/** Fades children into place once they come into view, and tells them when they have. */
function In({ children, delay = 0, className = "" }: { children: ReactNode | ((on: boolean) => ReactNode); delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(ref.current!); return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-[1100ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${on ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {typeof children === "function" ? children(on) : children}
    </div>
  );
}

/** A photograph in a rounded frame that drifts slowly against the scroll. */
function Photo({ src, pos = "50% 50%", dim = 1, className = "", children }: { src: string; pos?: string; dim?: number; className?: string; children?: ReactNode }) {
  const [ref, p] = useProgress<HTMLDivElement>();
  return (
    <div ref={ref} className={`relative overflow-hidden rounded-[20px] bg-[#e4e1db] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" className="absolute inset-x-0 -top-[7%] h-[114%] w-full object-cover will-change-transform motion-reduce:!transform-none" style={{ objectPosition: pos, transform: `translate3d(0,${(0.5 - p) * 10}%,0)`, filter: dim < 1 ? `brightness(${dim})` : undefined }} />
      {children}
    </div>
  );
}

/* The work, laid on the photographs. */
const card = "relative w-[86%] rounded-2xl bg-white font-sans shadow-[0_1px_2px_rgba(0,0,0,0.04),0_40px_80px_-24px_rgba(0,0,0,0.5)] md:w-[80%]";
const eyebrow = "font-sans text-[12.5px] font-medium uppercase tracking-[0.16em] text-[#8a867f] md:text-[13px]";
const label = "text-[12px] font-medium uppercase tracking-[0.12em] text-[#a09d96]";
const rise = (on: boolean, d: number) => ({ className: `transition-all duration-700 ease-out motion-reduce:transition-none ${on ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`, style: { transitionDelay: `${d}ms` } });

function MailCard({ on }: { on: boolean }) {
  return (
    <div className={`${card} p-5 md:p-6`}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f3f0] text-[13px] font-semibold">DR</div>
        <div className="min-w-0"><p className="text-[14.5px] font-semibold">Daniel Reyes</p><p className="truncate text-[13px] text-[#6b6862]">Green card for my wife</p></div>
        <span className="ml-auto text-[12.5px] text-[#a09d96]">8:02 AM</span>
      </div>
      <p className="mt-4 text-[14.5px] leading-relaxed text-[#6b6862]">Hi, my wife Sofia and I want to apply for her green card. Her documents are attached.</p>
      <div {...rise(on, 900)}>
        <div className="mt-5 flex items-center justify-between rounded-xl bg-[#f4f3f0] px-4 py-3 text-[13.5px]"><span className="font-medium">Case opened</span><span className="text-[#6b6862]">Sofia Reyes · I-485</span></div>
      </div>
    </div>
  );
}

function ReadCard({ on }: { on: boolean }) {
  const rows = [["Marriage date", "March 9 or March 19, 2024?", "pp. 1, 2"], ["Sponsor income", "Below the 2026 minimum", "p. 3"], ["Last entry", "B-2, June 14, 2022", "p. 1"]];
  return (
    <div className={`${card} p-5 md:p-6`}>
      <p className={label}>Sofia Reyes · For review</p>
      <div className="mt-3 flex flex-col divide-y divide-[#ebe9e4]">
        {rows.map(([a, b, c], i) => (
          <div key={a} {...rise(on, 600 + i * 220)}>
            <div className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0"><p className="text-[12.5px] text-[#a09d96]">{a}</p><p className="truncate text-[14.5px] font-medium">{b}</p></div>
              <span className="shrink-0 text-[12.5px] text-[#a09d96]">{c}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LetterCard({ on }: { on: boolean }) {
  const cite = (t: string, d: number) => <span className={`rounded px-0.5 transition-colors duration-700 ${on ? "bg-[#efe6d6] text-[#7a5f35]" : "text-[#a09d96]"}`} style={{ transitionDelay: `${d}ms` }}>{t}</span>;
  return (
    <div className={`${card} p-6 md:p-7`}>
      <p className={label}>Support letter · Draft</p>
      <p className="mt-4 font-serif text-[15.5px] leading-[1.75] md:text-[16px]">
        Dr. Okoro&apos;s sensors detect lead in municipal water at a fraction of the current cost {cite("(Exhibit 4)", 900)}. Two Massachusetts towns are now piloting the system {cite("(Exhibit 7)", 1200)}.
      </p>
    </div>
  );
}

function ApproveCard({ on }: { on: boolean }) {
  return (
    <div className={`${card} p-5 md:p-6`}>
      <p className={label}>Awaiting approval</p>
      <p className="mt-3 text-[19px] font-semibold tracking-[-0.01em]">Filing packet · Sofia Reyes</p>
      <p className="mt-1 text-[14px] text-[#6b6862]">Cover letter, 5 forms, 14 exhibits</p>
      <div {...rise(on, 800)}>
        <div className="mt-5 flex gap-2.5">
          <span className="rounded-[10px] bg-[#161614] px-5 py-2.5 text-[14px] font-medium text-white">Approve</span>
          <span className="rounded-[10px] px-5 py-2.5 text-[14px] font-medium ring-1 ring-[#d3cfc8]">Review</span>
        </div>
      </div>
    </div>
  );
}

const STEPS: { title: string; line: string; photo: string; pos?: string; dim?: number; Card: (p: { on: boolean }) => ReactNode }[] = [
  { title: "Reads your mail.", line: "A client writes in. The case is open before anyone sees the email.", photo: "/landing/concrete.jpg", Card: MailCard },
  { title: "Reads your files.", line: "Conflicts, gaps and bars, each with the page it came from.", photo: "/landing/marble.jpg", Card: ReadCard },
  { title: "Drafts your letters.", line: "Support letters and RFE responses, cited to the evidence.", photo: "/landing/letters.jpg", dim: 0.55, Card: LetterCard },
  { title: "Asks for approval.", line: "Nothing is filed or sent without an attorney's approval.", photo: "/landing/columns.jpg", pos: "50% 50%", Card: ApproveCard },
];

/* The 3D piece: the case papers lie spread across a desk, then fold into one filing packet as the page scrolls. */
const SHEETS = ["Cover letter", "Form G-1145", "Form I-130", "Form I-130A", "Form I-864", "Form I-485", "Form I-765", "14 exhibits"];

function Sheet({ title, i }: { title: string; i: number }) {
  return (
    <div className="relative h-full w-full rounded-[6px] bg-white p-4 font-sans shadow-[0_1px_0_rgba(0,0,0,0.04),0_18px_30px_-18px_rgba(0,0,0,0.45)] ring-1 ring-black/[0.06]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#161614]">{title}</p>
      <div className="mt-3 flex flex-col gap-[7px]">
        {Array.from({ length: 11 }, (_, k) => <div key={k} className="h-[5px] rounded-full bg-[#ece9e3]" style={{ width: `${55 + ((k * 37 + i * 19) % 40)}%` }} />)}
      </div>
      {i === 0 && <p className="absolute bottom-4 left-4 font-serif text-[11px] italic text-[#6b6862]">Sofia Reyes</p>}
    </div>
  );
}

function Packet() {
  const [ref, p] = usePinned<HTMLDivElement>();
  const [narrow, setNarrow] = useState(false);
  useEffect(() => { const on = () => setNarrow(window.innerWidth < 768); on(); window.addEventListener("resize", on); return () => window.removeEventListener("resize", on); }, []);
  const W = 200, H = 260, gx = narrow ? 150 : 250, gy = narrow ? 200 : 300;
  return (
    <div ref={ref} className="relative h-[300vh]">
      <div className="sticky top-0 flex h-dvh flex-col justify-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-4 px-4 md:grid-cols-[minmax(0,420px)_1fr] md:gap-10 md:px-8">
          <div className="relative z-10 pt-6 md:pt-0">
            <h2 className="font-serif text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[56px]">All your cases in one place.</h2>
            <p className="mt-4 max-w-[30ch] text-[17.5px] leading-[1.6] text-[#6b6862] md:text-[19px]">Forms, letters and exhibits in filing order, ready for review.</p>
          </div>
          <div className="relative flex h-[56vh] items-center justify-center [perspective:2000px] md:h-[78vh]">
            <div className="relative [transform-style:preserve-3d]" style={{ width: W, height: H, transform: `scale(${narrow ? 0.8 : 1.15}) rotateX(${54 - 6 * easeInOut(p)}deg) rotateZ(${-34 + 6 * easeInOut(p)}deg)` }}>
              {SHEETS.map((t, i) => {
                // Spread on the desk in a loose grid, each sheet gathered in turn into one neat stack.
                const k = easeInOut((p - 0.05 - i * 0.06) / 0.34);
                const col = i % 4, row = Math.floor(i / 4);
                const x = (col - 1.5) * gx * (1 - k), y = (row - 0.5) * gy * (1 - k);
                const z = k * (SHEETS.length - i) * 7 + Math.sin(k * Math.PI) * 120;
                const rot = (1 - k) * (((i * 53) % 13) - 6);
                return (
                  <div key={t} className="absolute inset-0 [transform-style:preserve-3d] motion-reduce:!transform-none" style={{ transform: `translate3d(${x}px,${y}px,${z}px) rotateZ(${rot}deg)` }}>
                    <Sheet title={t} i={i} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TRUST = [
  ["Encrypted", "The database and every file, at rest."],
  ["Never used for training", "Client files are not used to train AI models."],
  ["Two-step sign in", "Can be required for the whole firm."],
  ["Yours to take", "Export or delete everything, at any time."],
];

function Close() {
  const [ref, p] = useProgress<HTMLDivElement>();
  return (
    <div ref={ref} className="relative h-[560px] overflow-hidden rounded-[24px] bg-[#222] md:h-[760px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/landing/board.jpg" alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover motion-reduce:!transform-none" style={{ objectPosition: "50% 45%", filter: "brightness(0.6)", transform: `scale(${1.14 - 0.14 * ease(p * 1.7)})` }} />
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
        <In><h2 className="font-serif text-[48px] font-semibold leading-[1] tracking-[-0.035em] md:text-[88px]">Start your<br />first case.</h2></In>
        <In delay={150}><Link href="/start" className="mt-7 inline-block rounded-[10px] bg-white px-6 py-3.5 font-sans text-[15.5px] font-medium text-[#161614] transition hover:bg-white/85 md:mt-8">Get started</Link></In>
      </div>
    </div>
  );
}

function Footer() {
  const icon = "flex h-10 w-10 items-center justify-center rounded-[10px] ring-1 ring-[#e2dfd8] text-[#161614] transition hover:bg-[#f0eee9]";
  return (
    <footer className="mt-20 border-t border-[#ebe9e4] md:mt-28">
      <div className="mx-auto max-w-[1200px] px-4 pb-10 pt-14 md:px-8 md:pb-12 md:pt-20">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-serif text-[44px] font-semibold leading-none tracking-[-0.035em] md:text-[72px]">Lincoln</p>
            <p className={`mt-4 ${eyebrow}`}>For immigration law firms</p>
          </div>
          <div className="flex gap-3">
            <a href="https://instagram.com/lincoln.app" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={icon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
            </a>
            <a href="mailto:hello@uselincoln.com" aria-label="Email" className={icon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></svg>
            </a>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-[#ebe9e4] pt-6 text-[13px] text-[#8a867f] md:mt-16 md:flex-row md:items-center md:justify-between">
          <span>© 2026 Lincoln. All rights reserved.</span>
          <div className="flex gap-5 text-[12.5px]">
            <Link href="/terms" className="transition hover:text-[#161614]">Terms</Link>
            <Link href="/privacy" className="transition hover:text-[#161614]">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [hero, hp] = useProgress<HTMLDivElement>();
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener("scroll", on, { passive: true }); return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className="min-h-dvh overflow-x-clip bg-[#faf9f6] font-serif text-[#161614] antialiased selection:bg-[#efe6d6]">
      <header className={`sticky top-0 z-50 bg-[#faf9f6]/85 backdrop-blur-md transition-[border-color] duration-300 ${scrolled ? "border-b border-[#ebe9e4]" : "border-b border-transparent"}`}>
        <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-8">
          <Link href="/" className="font-serif text-[26px] font-semibold tracking-[-0.02em] md:text-[28px]">Lincoln</Link>
          <div className="flex items-center gap-1">
            <Link href="/signin" className="rounded-[9px] px-3 py-2 font-sans text-[14.5px] text-[#6b6862] transition hover:text-[#161614] md:px-4">Sign in</Link>
            <Link href="/start" className="rounded-[9px] bg-[#161614] px-4 py-2 font-sans text-[14.5px] font-medium text-white transition hover:opacity-85">Get started</Link>
          </div>
        </nav>
      </header>

      {/* Hero: the words, and the courthouse rising into its frame. */}
      <section className="mx-auto grid max-w-[1200px] items-end gap-9 px-4 pb-20 pt-11 md:px-8 md:pb-28 md:pt-14 lg:grid-cols-[1fr_460px] lg:gap-16">
        <div>
          <p className={`hero-in ${eyebrow}`}>For immigration law firms</p>
          <h1 className="hero-in hero-title mt-4 font-serif font-semibold leading-[1.04] tracking-[-0.035em] [animation-delay:120ms]">Your work done before you even ask.</h1>
          <p className="hero-in hero-line mt-6 leading-[1.6] text-[#6b6862] [animation-delay:240ms]">
            Lincoln works autonomously for you, no need for prompts. Once it&apos;s done you review and approve.
          </p>
          <div className="hero-in mt-9 flex items-center gap-2 [animation-delay:360ms] lg:mb-3">
            <Link href="/start" className="rounded-[10px] bg-[#161614] px-6 py-3.5 font-sans text-[15.5px] font-medium text-white transition hover:opacity-85">Get started</Link>
            <a href="#work" className="rounded-[10px] px-5 py-3.5 font-sans text-[15.5px] font-medium transition hover:bg-[#f0eee9]">How it works</a>
          </div>
        </div>
        <div ref={hero} className="hero-photo relative h-[440px] overflow-hidden rounded-[20px] bg-[#e4e1db] md:h-[560px] lg:h-[620px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/landing/court.jpg" alt="" fetchPriority="high" className="hero-photo-img absolute inset-x-0 -top-[6%] h-[112%] w-full object-cover" style={{ objectPosition: "30% 50%", translate: `0 ${(0.5 - hp) * 8}%` }} />
        </div>
      </section>

      {/* The statement, lit word by word. */}
      <section className="border-t border-[#ebe9e4]">
        <div className="mx-auto max-w-[1200px] px-4 py-24 md:px-8 md:py-44">
          <Reveal className="max-w-[20ch] font-serif text-[36px] font-semibold leading-[1.12] tracking-[-0.025em] md:text-[68px]" text="Most of an immigration practice is paperwork. Lincoln does the paperwork. You practice law." />
        </div>
      </section>

      {/* The work, on the photographs. */}
      <section id="work" className="scroll-mt-16 border-t border-[#ebe9e4]">
        <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-8 md:py-24">
          {STEPS.map((s, i) => (
            <div key={s.title} className="grid items-center gap-7 py-10 md:grid-cols-2 md:gap-20 md:py-[70px]">
              <In className={i % 2 ? "md:order-2" : ""}>
                <p className={eyebrow}>0{i + 1}</p>
                <h3 className="mt-3 font-serif text-[34px] font-semibold leading-[1.05] tracking-[-0.025em] md:text-[52px]">{s.title}</h3>
                <p className="mt-3 max-w-[30ch] text-[17.5px] leading-[1.6] text-[#6b6862] md:mt-4 md:text-[19px]">{s.line}</p>
              </In>
              <Photo src={s.photo} pos={s.pos} dim={s.dim} className="flex h-[480px] items-center justify-center md:h-[620px]">
                <In delay={200} className="flex w-full justify-center">{(on) => <s.Card on={on} />}</In>
              </Photo>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[#ebe9e4]"><Packet /></section>

      {/* Client files. */}
      <section className="border-t border-[#ebe9e4]">
        <div className="mx-auto grid max-w-[1200px] gap-7 px-4 py-24 md:grid-cols-2 md:gap-20 md:px-8 md:py-36">
          <In><h2 className="font-serif text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[56px]">Built for privacy.</h2></In>
          <div className="flex flex-col">
            {TRUST.map(([a, b], i) => (
              <In key={a} delay={i * 90}>
                <div className={`py-5 ${i ? "border-t border-[#ebe9e4]" : "pt-1"}`}><p className="text-[19px] font-semibold tracking-[-0.01em]">{a}</p><p className="mt-1 text-[16.5px] text-[#6b6862]">{b}</p></div>
              </In>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 md:px-8">
        <Close />
      </section>
      <Footer />
    </div>
  );
}
