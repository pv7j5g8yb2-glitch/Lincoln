"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Points from "./Points";
import { AREAS, CONNECTORS, HEADLINE, STATEMENT, TRUST, WORK } from "./content";

// Lincoln's public front page. Black, light serif type, and points of light: a courthouse that assembles, turns and
// breathes over a rolling field in the hero, and a stack of filing pages at the close. Between them the page stays
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
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(scrollY > 40);
    on(); addEventListener("scroll", on, { passive: true }); return () => removeEventListener("scroll", on);
  }, []);

  return (
    <div className="min-h-dvh overflow-x-clip bg-black font-sans text-white antialiased selection:bg-white/20">
      <header className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-500 ${scrolled ? "border-b border-white/10 bg-black/70 backdrop-blur-md" : "border-b border-transparent"}`}>
        <nav className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-5 md:h-20 md:px-10">
          <Link href="/" className="font-serif text-[22px] font-light tracking-[0.01em]">Lincoln</Link>
          <div className="hidden gap-9 text-[12.5px] text-white/60 md:flex">
            <a href="#work" className="transition hover:text-white">Product</a><a href="#cases" className="transition hover:text-white">Case types</a><a href="#security" className="transition hover:text-white">Security</a>
          </div>
          <Link href="/start" className="bg-white px-4 py-2 text-[12.5px] font-medium text-black transition hover:bg-white/85">Get In Touch</Link>
        </nav>
      </header>

      {/* Hero: the courthouse forms. */}
      <section className="relative isolate h-[100svh] min-h-[640px] overflow-hidden">
        <div className="absolute inset-0 -z-10"><Points scene="court" /></div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-56 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[1320px] flex-col gap-8 px-5 pb-10 md:flex-row md:items-end md:justify-between md:px-10 md:pb-14">
          <h1 className={`${light} hero-in max-w-[15ch] text-[40px] leading-[1.06] [animation-delay:1400ms] md:text-[64px]`}>
            {HEADLINE.split(" ").map((w, i) => <span key={i} className={i < 2 ? "" : "text-white/50"}>{w} </span>)}
          </h1>
          <div className="hero-in flex items-center gap-6 [animation-delay:1700ms]">
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

      {/* Any case. */}
      <section id="cases" className="mx-auto max-w-[1320px] scroll-mt-24 px-5 pt-36 md:px-10 md:pt-52">
        <In><h2 className={`${light} max-w-[16ch] text-[44px] leading-[1.02] md:text-[96px]`}>Any immigration case.</h2></In>
        <In delay={150}><p className="mt-6 max-w-[44ch] text-[16.5px] leading-[1.6] text-white/50 md:text-[18px]">{AREAS}</p></In>
      </section>

      {/* The services Lincoln connects to, drifting: Google on one line, Microsoft on the other. */}
      <section className="overflow-hidden py-36 md:py-52">
        <div className="mx-auto max-w-[1320px] px-5 md:px-10"><In><p className={small}>Connected to the tools the firm already uses</p></In></div>
        <div className="mt-12 flex flex-col gap-4 md:mt-16 md:gap-6" aria-label={CONNECTORS.flatMap(([, list]) => list).join(", ")}>
          {CONNECTORS.map(([, row], r) => (
            <div key={r} className="marquee flex w-max" style={{ animationDirection: r ? "reverse" : "normal", animationDuration: "70s" }} aria-hidden>
              {[...row, ...row].map((t, i) => (
                <span key={i} className={`${light} flex items-center whitespace-nowrap text-[40px] text-white/85 md:text-[80px]`}>{t}<span className="mx-7 inline-block h-1.5 w-1.5 rounded-full bg-white/25 md:mx-12" /></span>
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
        <div className="flex flex-col gap-5 border-t border-white/12 py-8 text-[13px] text-white/55 md:flex-row md:items-center md:justify-between">
          <p className="font-serif text-[20px] font-light text-white">Lincoln</p>
          <div className="flex flex-wrap gap-x-7 gap-y-2">
            <Link href="/start" className="hover:text-white">Get In Touch</Link>
            <a href="https://instagram.com/lincoln.app" target="_blank" rel="noopener noreferrer" className="hover:text-white">Instagram</a>
            <a href="mailto:hello@uselincoln.com" className="hover:text-white">Email</a>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">© 2026 Lincoln</p>
        </div>
      </footer>
    </div>
  );
}
