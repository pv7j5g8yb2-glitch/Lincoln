"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Points from "./Points";
import { CONNECTORS, HEADLINE, STATEMENT, TRUST, WORK } from "./content";
import { LOGOS } from "./logos";

// Lincoln's public front page. Black, light serif type, and points of light: LINCOLN in heavy serif that assembles,
// sways and breathes in the hero, and a stack of filing pages at the close. Between them the page stays
// quiet and spacious: a sentence that lights up word by word, the work in a hairline grid, case types drifting past.
// American English.

const clamp = (x: number) => Math.min(1, Math.max(0, x));

/** Fades its children up into place the first time they come into view. */
function In({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(ref.current!); return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-[1200ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${on ? "translate-y-0 opacity-100 blur-0" : "translate-y-6 opacity-0 blur-[6px]"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/** A sentence in faint grey that lights up word by word as it is scrolled through. */
function Reveal({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => { raf = 0; const el = ref.current; if (!el) return; const r = el.getBoundingClientRect(); setP(clamp((innerHeight * 0.85 - r.top) / (innerHeight * 0.55))); };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick(); addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  const words = text.split(" ");
  const lit = p * words.length;
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => <span key={i} className="transition-colors duration-500" style={{ color: `rgba(255,255,255,${0.14 + 0.86 * clamp(lit - i)})` }}>{w} </span>)}
    </p>
  );
}

const light = "font-serif font-light tracking-[-0.02em]";
const small = "font-sans text-[11px] uppercase tracking-[0.18em] text-white/45";

export default function Landing() {
  // The header stays out of sight while the hero is on screen (it already shows LINCOLN, the line and Get In Touch)
  // and slides down once the hero has been scrolled past.
  const hero = useRef<HTMLElement>(null);
  const [past, setPast] = useState(false);
  useEffect(() => {
    const on = () => { const el = hero.current; if (el) setPast(el.getBoundingClientRect().bottom < 72); };
    on(); addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); };
  }, []);

  return (
    <div className="landing-root min-h-dvh overflow-x-clip bg-black font-sans text-white antialiased selection:bg-white/20">
      <header inert={!past} className={`fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-md transition-[transform,opacity] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${past ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"}`}>
        <nav className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-5 md:h-20 md:px-10">
          <Link href="/" className="font-serif text-[22px] font-medium tracking-[-0.005em]">Lincoln</Link>
          <Link href="/start" className="bg-white px-4 py-2 text-[12.5px] font-medium text-black transition hover:bg-white/85">Get In Touch</Link>
        </nav>
      </header>

      {/* Hero: LINCOLN forms in points. */}
      <section ref={hero} className="relative isolate h-[100svh] min-h-[640px] overflow-hidden">
        <div role="img" aria-label="Lincoln" className="absolute inset-0 -z-10"><Points scene="word" /></div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-56 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[1320px] flex-col items-center gap-8 px-5 pb-10 text-center md:gap-10 md:px-10 md:pb-14">
          {/* Two lines at every width: the size follows the screen so "before you even ask" never wraps. */}
          <h1 className={`${light} hero-in whitespace-nowrap text-[clamp(28px,8.6vw,40px)] leading-[1.08] [animation-delay:1400ms] md:text-[64px]`}>
            <span className="block">{HEADLINE[0]}</span>
            <span className="block text-white/50">{HEADLINE[1]}</span>
          </h1>
          <div className="hero-in flex shrink-0 items-center gap-6 whitespace-nowrap [animation-delay:1700ms]">
            <a href="#work" className="text-[13px] text-white/60 transition hover:text-white">How it works</a>
            <Link href="/start" className="bg-white px-5 py-3 text-[13px] font-medium text-black transition hover:bg-white/85">Get In Touch</Link>
          </div>
        </div>
      </section>

      {/* The statement. */}
      <section className="mx-auto max-w-[1320px] px-5 py-36 md:px-10 md:py-56">
        <Reveal className={`${light} max-w-[24ch] text-[34px] leading-[1.18] md:text-[64px]`} text={STATEMENT} />
      </section>

      {/* The work. */}
      <section id="work" className="mx-auto max-w-[1320px] scroll-mt-24 px-5 md:px-10">
        <In><p className={small}>What Lincoln does</p></In>
        <div className="mt-10 grid border-l border-t border-white/12 md:grid-cols-3">
          {WORK.map((w, i) => (
            <In key={w.title} delay={(i % 3) * 120} className="border-b border-r border-white/12">
              <div className="group relative h-full overflow-hidden p-7 md:min-h-[260px] md:p-8">
                <div className="absolute inset-0 origin-bottom scale-y-0 bg-white transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-y-100" />
                <div className="relative">
                  <span className="text-[12px] tabular-nums text-white/35 transition-colors duration-500 group-hover:text-black/40">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className={`${light} mt-14 text-[26px] leading-[1.1] transition-colors duration-500 group-hover:text-black`}>{w.title}</h3>
                  <p className="mt-3 max-w-[34ch] text-[14.5px] leading-[1.6] text-white/50 transition-colors duration-500 group-hover:text-black/60">{w.line}</p>
                </div>
              </div>
            </In>
          ))}
        </div>
      </section>

      {/* The services Lincoln connects to, drifting: Google on one line, Microsoft on the other. */}
      <section className="overflow-hidden py-36 md:py-52">
        <div className="mx-auto max-w-[1320px] px-5 md:px-10"><In><p className={small}>Connected to the tools you already use</p></In></div>
        <div className="mt-12 flex flex-col gap-4 md:mt-16 md:gap-6" aria-label={CONNECTORS.flatMap(([, list]) => list).join(", ")}>
          {CONNECTORS.map(([, row], r) => (
            <div key={r} className="marquee flex w-max" style={{ animationDirection: r ? "reverse" : "normal", animationDuration: "70s" }} aria-hidden>
              {[...row, ...row].map((t, i) => (
                // The logo is exactly as tall as the capitals (0.71em in Literata) and stands on the baseline, so it lines up
                // with the name, not with the letters that drop below it.
                <span key={i} className={`${light} flex items-baseline whitespace-nowrap text-[40px] text-white/75 md:text-[80px]`}>
                  <svg viewBox="0 0 24 24" aria-hidden className="mr-[0.28em] h-[0.71em] w-[0.71em] shrink-0 self-baseline fill-white"><path d={LOGOS[t]} /></svg>
                  {t}<span className="mx-8 inline-block h-1.5 w-1.5 self-center rounded-full bg-white/20 md:mx-14" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Security. */}
      <section id="security" className="mx-auto max-w-[1320px] scroll-mt-24 px-5 py-36 md:px-10 md:py-48">
        <In><h2 className={`${light} text-[40px] leading-[1.05] md:text-[60px]`}>Built for privacy.</h2></In>
        <div className="mt-14 grid gap-10 md:grid-cols-4">
          {TRUST.map(([a, b], i) => <In key={a} delay={i * 110}><div className="border-t border-white/12 pt-6"><p className={`${light} text-[23px]`}>{a}</p><p className="mt-2 text-[14.5px] leading-[1.55] text-white/50">{b}</p></div></In>)}
        </div>
      </section>

      {/* Close: the filing pages form. */}
      <section className="relative isolate h-[100svh] min-h-[640px] overflow-hidden">
        <div className="absolute inset-0 -z-10"><Points scene="packet" /></div>
        <div className="absolute inset-x-0 bottom-14 flex flex-col items-center px-5 text-center md:bottom-20">
          <In><h2 className={`${light} text-[44px] leading-[1.05] md:text-[76px]`}>Start your first case.</h2></In>
          <In delay={150}><Link href="/start" className="mt-8 inline-block bg-white px-6 py-3.5 text-[13.5px] font-medium text-black transition hover:bg-white/85">Get In Touch</Link></In>
        </div>
      </section>

      <footer className="mx-auto max-w-[1320px] px-5 md:px-10">
        {/* Phones: Lincoln, the links, then the copyright, one under another. Wider screens: Lincoln with the copyright
            under it on the left, the links on the right. */}
        <div className="flex flex-col gap-5 border-t border-white/12 py-8 text-[13px] text-white/55 md:grid md:grid-cols-[1fr_auto] md:items-center md:gap-x-10 md:gap-y-2">
          <p className="font-serif text-[20px] font-medium tracking-[-0.005em] text-white md:col-start-1 md:row-start-1">Lincoln</p>
          <div className="flex flex-wrap gap-x-7 gap-y-2 md:col-start-2 md:row-span-2 md:row-start-1 md:justify-end">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 md:col-start-1 md:row-start-2">© 2026 Lincoln. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
