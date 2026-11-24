"use client";

import Link from "next/link";
import { useState } from "react";
import "@fontsource/jetbrains-mono";
import { HEADLINE, STATEMENT, TOOLS, TRUST, TYPES, WORK } from "../content";
import { In } from "./shared";

// Option 3, Field: editorial and calm. Warm beige page, a photograph streaked with horizontal motion blur, small mono
// labels with square marks, the firm's tools wired into Lincoln over the photograph, bracketed cards, an accordion of
// practice areas and a dark footer with a large wordmark. Ismael's own photographs.

const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" } as const;

function Tag({ children, light = false }: { children: string; light?: boolean }) {
  return <p className={`flex items-center gap-2 text-[11.5px] uppercase tracking-[0.12em] ${light ? "text-white/85" : "text-[#55524b]"}`} style={mono}><span className={`h-2 w-2 ${light ? "bg-white" : "bg-[#1b1a17]"}`} />{children}</p>;
}

function Photo({ src, pos = "50% 50%", dim = 1 }: { src: string; pos?: string; dim?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover" style={{ objectPosition: pos, filter: `url(#streak) brightness(${dim}) saturate(0.8)` }} />;
}

function Bracket({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  const c = "absolute h-2 w-2 bg-[#1b1a17]";
  return (
    <div className={`relative h-full p-6 ring-1 ring-[#d9d4c8] ${active ? "bg-[#e6e1d6]" : ""}`}>
      <span className={`${c} -left-1 -top-1`} /><span className={`${c} -right-1 -top-1`} /><span className={`${c} -bottom-1 -left-1`} /><span className={`${c} -bottom-1 -right-1`} />
      {children}
    </div>
  );
}

const AREAS: [string, string][] = [
  ["Employment", "H-1B, O-1, L-1, EB-1, EB-2 NIW, PERM and the green cards that follow."],
  ["Family", "I-130, I-485, K-1, removal of conditions and consular processing."],
  ["Humanitarian", "Asylum, U and T visas, VAWA, SIJ and TPS."],
  ["Removal defense", "Cancellation, waivers and the record before the immigration court."],
  ["Naturalization", "N-400, certificates of citizenship and the history behind them."],
];

export default function Field() {
  const [open, setOpen] = useState(0);
  const btn = "px-4 py-2 text-[11.5px] uppercase tracking-[0.12em]";
  return (
    <div className="min-h-dvh bg-[#f1eee7] text-[#1b1a17] antialiased">
      <svg width="0" height="0" className="absolute"><filter id="streak"><feGaussianBlur stdDeviation="38 2" /></filter></svg>

      {/* Hero */}
      <section className="p-2 md:p-3">
        <div className="relative isolate overflow-hidden rounded-[6px] bg-[#3d4a3a]">
          <Photo src="/landing/columns.jpg" dim={0.82} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
          <header className="relative flex items-center justify-between px-5 py-5 md:px-8">
            <Link href="/" className="flex items-center gap-2.5 text-white"><span className="flex h-7 w-7 items-center justify-center bg-white font-serif text-[16px] font-bold text-[#1b1a17]">L</span><span className="text-[13px] uppercase tracking-[0.16em]" style={mono}>Lincoln</span></Link>
            <nav className="flex items-center bg-black/25 p-1 backdrop-blur-md" style={mono}>
              <a href="#product" className={`${btn} hidden text-white/80 md:block`}>Product</a>
              <a href="#areas" className={`${btn} hidden text-white/80 md:block`}>Practice areas</a>
              <a href="#security" className={`${btn} hidden text-white/80 md:block`}>Security</a>
              <Link href="/start" className={`${btn} bg-white text-[#1b1a17]`}>Get In Touch</Link>
            </nav>
          </header>
          <div className="relative flex flex-col items-center px-5 pb-10 pt-16 text-center text-white md:pb-16 md:pt-24">
            <Tag light>For immigration law firms</Tag>
            <h1 className="mt-5 max-w-[16ch] text-[40px] font-medium leading-[1.06] tracking-[-0.03em] md:text-[64px]">{HEADLINE}</h1>
            <div className="mt-8 flex gap-2" style={mono}>
              <Link href="/start" className={`${btn} bg-white text-[#1b1a17]`}>Get In Touch</Link>
              <a href="#product" className={`${btn} bg-black/30 text-white backdrop-blur-md`}>▷ How it works</a>
            </div>
            {/* The tools wired into Lincoln. */}
            <div className="relative mt-16 grid w-full max-w-[880px] grid-cols-[1fr_auto_1fr] items-center gap-6 md:mt-24">
              <div className="flex flex-col items-end gap-3">{TOOLS.slice(0, 5).map((t, i) => <span key={t} className="flex items-center gap-3 bg-black/35 px-3 py-2 text-[11px] uppercase tracking-[0.1em] backdrop-blur-md" style={{ ...mono, marginRight: `${[24, 0, 36, 8, 28][i]}px` }}>{t}</span>)}</div>
              <div className="relative flex h-28 w-28 items-center justify-center bg-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] md:h-36 md:w-36"><span className="font-serif text-[44px] font-bold text-[#1b1a17] md:text-[60px]">L</span></div>
              <div className="flex flex-col items-start gap-3">{TOOLS.slice(5).map((t, i) => <span key={t} className="flex items-center gap-3 bg-black/35 px-3 py-2 text-[11px] uppercase tracking-[0.1em] backdrop-blur-md" style={{ ...mono, marginLeft: `${[16, 34, 0, 26, 10][i]}px` }}>{t}</span>)}</div>
              <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden><path d="M30 10 H42 V50 H44 M30 90 H42 V50 M70 10 H58 V50 H56 M70 90 H58 V50" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.25" strokeDasharray="1 1" /></svg>
            </div>
          </div>
        </div>
      </section>

      {/* One workspace */}
      <section id="product" className="mx-auto max-w-[1180px] px-5 py-24 md:py-32">
        <In className="flex flex-col items-center text-center"><Tag>One workspace</Tag><h2 className="mt-4 text-[32px] font-medium tracking-[-0.025em] md:text-[44px]">Every part of the case.</h2><p className="mt-3 max-w-[52ch] text-[15px] text-[#6d695f]">{STATEMENT}</p></In>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {WORK.map((w, i) => (
            <In key={w.title} delay={(i % 3) * 80}>
              <Bracket active={i === 0}>
                <span className="text-[11px] text-[#8b867a]" style={mono}>{String(i + 1).padStart(2, "0")}</span>
                <p className="mt-10 text-[16px] font-semibold">{w.title}</p>
                <p className="mt-1.5 text-[13.5px] leading-[1.55] text-[#6d695f]">{w.line}</p>
              </Bracket>
            </In>
          ))}
        </div>
      </section>

      {/* Practice areas */}
      <section id="areas" className="border-y border-[#ddd8cc]">
        <div className="mx-auto grid max-w-[1180px] md:grid-cols-2">
          <div className="relative min-h-[360px] overflow-hidden border-[#ddd8cc] md:border-r">
            <div className="absolute inset-6 overflow-hidden md:inset-10"><Photo src="/landing/marble.jpg" dim={0.9} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                {TYPES.slice(open * 6, open * 6 + 5).map((t) => <span key={t} className="w-[200px] bg-white px-3 py-2 text-[11.5px] uppercase tracking-[0.1em]" style={mono}>{t}</span>)}
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center px-5 py-10 md:px-10">
            {AREAS.map(([a, b], i) => (
              <button key={a} type="button" onClick={() => setOpen(i)} className="border-b border-[#ddd8cc] py-5 text-left last:border-0">
                <span className="flex items-center justify-between"><span className={`text-[15.5px] ${open === i ? "font-semibold" : "text-[#8b867a]"}`}>{a}</span><span className="text-[18px] text-[#8b867a]">{open === i ? "−" : "+"}</span></span>
                {open === i && <span className="mt-2 block text-[13.5px] text-[#6d695f]">{b}</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Security on the photograph */}
      <section id="security" className="p-2 md:p-3">
        <div className="relative isolate overflow-hidden rounded-[6px] px-5 py-20 md:py-28">
          <Photo src="/landing/concrete.jpg" pos="50% 60%" dim={0.7} />
          <div className="relative flex flex-col items-center text-center text-white"><Tag light>Security</Tag><h2 className="mt-4 text-[32px] font-medium tracking-[-0.025em] md:text-[44px]">Built for privacy.</h2></div>
          <div className="relative mx-auto mt-12 grid max-w-[1080px] gap-4 md:grid-cols-4">
            {TRUST.map(([a, b], i) => (
              <In key={a} delay={i * 80}><div className={`h-full bg-white p-5 ${i === 1 ? "md:-translate-y-4" : ""}`}><p className="text-[11px] uppercase tracking-[0.1em] text-[#8b867a]" style={mono}>0{i + 1}</p><p className="mt-6 text-[20px] font-semibold tracking-[-0.01em]">{a}</p><p className="mt-2 text-[13.5px] leading-[1.5] text-[#6d695f]">{b}</p></div></In>
            ))}
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="mx-auto max-w-[1180px] px-5 py-24 text-center md:py-32">
        <In className="flex flex-col items-center"><Tag>Work, done</Tag><h2 className="mt-4 text-[34px] font-medium leading-[1.1] tracking-[-0.025em] md:text-[52px]">Start your first case.</h2>
          <Link href="/start" className={`${btn} mt-8 bg-[#1b1a17] text-white`} style={mono}>Get In Touch</Link></In>
      </section>

      {/* Footer */}
      <footer className="bg-[#141412] px-5 pb-8 pt-14 text-white md:px-10">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div><Tag light>Lincoln</Tag><p className="mt-3 max-w-[30ch] text-[17px]">{HEADLINE}</p></div>
            {[["Product", ["Overview", "Case types", "Security"]], ["Company", ["Get In Touch", "Instagram"]], ["Legal", ["Terms", "Privacy"]]].map(([h, items]) => (
              <div key={h as string}><p className="text-[11px] uppercase tracking-[0.12em] text-white/45" style={mono}>{h as string}</p>{(items as string[]).map((x) => <p key={x} className="mt-2.5 text-[13.5px] text-white/80">{x}</p>)}</div>
            ))}
          </div>
          <div className="mt-20 flex items-end justify-between gap-6">
            <p className="text-[64px] leading-none tracking-[0.02em] md:text-[150px]" style={mono}>LINCOLN</p>
            <p className="pb-3 text-[11px] text-white/40" style={mono}>© 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
