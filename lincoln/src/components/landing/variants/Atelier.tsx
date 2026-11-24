"use client";

import Link from "next/link";
import "@fontsource-variable/bricolage-grotesque";
import { HEADLINE, RULEBOOKS, STATEMENT, TOOLS, TRUST, TYPES, WORK } from "../content";
import { GRAIN, In } from "./shared";

// Option 1, Atelier: light and warm. Soft colour fields (coral, orange, periwinkle) with grain on a cream page, a
// characterful grotesk set low, one hand drawn line, a vertical figure at the side. Sections stay on cream.

const display = { fontFamily: "'Bricolage Grotesque Variable', sans-serif" } as const;
const ink = "#141312";

function Fields({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="atelier-drift absolute -left-[12%] -top-[22%] h-[70%] w-[55%] rounded-full bg-[#8f95e6] opacity-70 blur-[110px]" />
      <div className="atelier-drift-2 absolute left-[18%] top-[8%] h-[42%] w-[34%] rounded-full bg-[#f0a3a8] opacity-60 blur-[110px]" />
      <div className="atelier-drift absolute -bottom-[25%] right-[-8%] h-[85%] w-[60%] rounded-full bg-[#f2562e] opacity-80 blur-[120px]" />
      <div className="atelier-drift-2 absolute -bottom-[10%] right-[-4%] h-[45%] w-[30%] rounded-full bg-[#ff9b2f] opacity-90 blur-[100px]" />
      <div className="absolute inset-0 opacity-[0.28] mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}

export default function Atelier() {
  return (
    <div className="min-h-dvh bg-[#efede8] font-sans antialiased" style={{ color: ink }}>
      <style>{`
        @keyframes atelier-drift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(4%, 3%) scale(1.06); } }
        .atelier-drift { animation: atelier-drift 18s ease-in-out infinite; }
        .atelier-drift-2 { animation: atelier-drift 22s ease-in-out infinite reverse; }
        @media (prefers-reduced-motion: reduce) { .atelier-drift, .atelier-drift-2 { animation: none; } }
      `}</style>

      {/* Hero */}
      <section className="relative isolate min-h-[100svh] overflow-hidden bg-[#e8e6f0]">
        <Fields />
        <header className="relative mx-auto flex h-20 max-w-[1320px] items-center justify-between px-6 md:px-10">
          <Link href="/" className="flex items-center gap-2 text-[22px] font-semibold tracking-[-0.03em]" style={display}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9 4.9 19.1" /></svg>
            Lincoln
          </Link>
          <nav className="hidden items-center text-[14px] md:flex">
            {["Product", "Case types", "Security"].map((x, i) => <a key={x} href={`#${x.toLowerCase().replace(" ", "-")}`} className={`px-5 ${i ? "border-l border-black/20" : ""}`}>{x}</a>)}
          </nav>
          <Link href="/start" className="rounded-[12px] bg-[#141312] px-5 py-2.5 text-[14px] font-medium text-white">Get In Touch</Link>
        </header>
        <div className="relative mx-auto flex min-h-[calc(100svh-80px)] max-w-[1320px] items-end justify-between px-6 pb-16 md:px-10 md:pb-24">
          <div className="relative">
            <h1 className="max-w-[11ch] text-[56px] font-semibold leading-[0.98] tracking-[-0.045em] md:text-[104px]" style={display}>{HEADLINE}</h1>
            <svg className="pointer-events-none absolute -right-[18%] bottom-[18%] hidden w-[46%] md:block" viewBox="0 0 300 200" fill="none" stroke={ink} strokeWidth="1.4" aria-hidden>
              <path d="M10 150 C 90 140, 200 90, 270 10" /><path d="M20 170 C 120 160, 220 175, 290 196" />
            </svg>
            <Link href="/start" className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-[15px] font-medium shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)]">Get In Touch <span aria-hidden>✦</span></Link>
          </div>
          <div className="hidden items-end gap-5 md:flex">
            <p className="text-[132px] font-semibold leading-none tracking-[-0.06em] [writing-mode:vertical-rl] rotate-180" style={display}>{RULEBOOKS}</p>
            <div className="mb-2 flex flex-col items-center gap-3">
              <span className="h-16 w-px bg-black/60" />
              <p className="max-w-[9rem] text-[13px] leading-snug [writing-mode:vertical-rl] rotate-180">Case types with their own rulebook.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statement */}
      <section className="mx-auto max-w-[1320px] px-6 py-28 md:px-10 md:py-40">
        <In><p className="max-w-[22ch] text-[36px] font-medium leading-[1.08] tracking-[-0.035em] md:text-[64px]" style={display}>{STATEMENT}</p></In>
      </section>

      {/* Product */}
      <section id="product" className="mx-auto max-w-[1320px] px-6 pb-28 md:px-10 md:pb-40">
        <In><p className="text-[13px] font-medium uppercase tracking-[0.14em] text-black/50">What Lincoln does</p></In>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {WORK.map((w, i) => (
            <In key={w.title} delay={(i % 3) * 90}>
              <div className="group relative h-full overflow-hidden rounded-[28px] bg-white/70 p-7 ring-1 ring-black/5 transition hover:bg-white">
                <span className="text-[13px] tabular-nums text-black/40">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-10 text-[28px] font-semibold leading-[1.05] tracking-[-0.03em]" style={display}>{w.title}</h3>
                <p className="mt-3 text-[15.5px] leading-[1.55] text-black/60">{w.line}</p>
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#f2562e] opacity-0 blur-[50px] transition-opacity duration-500 group-hover:opacity-60" />
              </div>
            </In>
          ))}
        </div>
      </section>

      {/* Case types */}
      <section id="case-types" className="relative isolate overflow-hidden bg-[#141312] py-28 text-white md:py-40">
        <div className="pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-[#8f95e6] opacity-40 blur-[120px]" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-[420px] w-[520px] rounded-full bg-[#f2562e] opacity-50 blur-[120px]" />
        <div className="relative mx-auto max-w-[1320px] px-6 md:px-10">
          <In><h2 className="max-w-[14ch] text-[44px] font-semibold leading-[1] tracking-[-0.04em] md:text-[84px]" style={display}>Every case type a firm takes.</h2></In>
          <div className="mt-12 flex flex-wrap gap-2.5">
            {TYPES.map((t, i) => <In key={t} delay={i * 18}><span className="inline-block rounded-full px-4 py-2 text-[15px] ring-1 ring-white/25 backdrop-blur-sm">{t}</span></In>)}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="mx-auto max-w-[1320px] px-6 py-28 md:px-10 md:py-40">
        <div className="grid gap-12 md:grid-cols-2 md:items-end">
          <In><h2 className="text-[40px] font-semibold leading-[1.02] tracking-[-0.04em] md:text-[72px]" style={display}>Inside the tools the firm already uses.</h2></In>
          <div className="flex flex-wrap gap-2 md:justify-end">
            {TOOLS.map((t, i) => <In key={t} delay={i * 40}><span className="inline-block rounded-[14px] bg-white px-4 py-3 text-[15px] font-medium shadow-[0_6px_20px_-12px_rgba(0,0,0,0.25)]">{t}</span></In>)}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="mx-auto max-w-[1320px] px-6 pb-28 md:px-10 md:pb-40">
        <div className="grid gap-4 md:grid-cols-4">
          {TRUST.map(([a, b], i) => (
            <In key={a} delay={i * 80}><div className="h-full rounded-[24px] border border-black/10 p-6"><p className="text-[20px] font-semibold tracking-[-0.02em]" style={display}>{a}</p><p className="mt-2 text-[15px] leading-[1.5] text-black/60">{b}</p></div></In>
          ))}
        </div>
      </section>

      {/* Close */}
      <section className="px-4 pb-4 md:px-6 md:pb-6">
        <div className="relative isolate overflow-hidden rounded-[36px] bg-[#e8e6f0] px-6 py-32 text-center md:py-48">
          <Fields />
          <In><h2 className="relative mx-auto max-w-[12ch] text-[52px] font-semibold leading-[0.98] tracking-[-0.045em] md:text-[112px]" style={display}>Start your first case.</h2></In>
          <In delay={150}><Link href="/start" className="relative mt-10 inline-flex items-center gap-2 rounded-full bg-[#141312] px-7 py-4 text-[15.5px] font-medium text-white">Get In Touch <span aria-hidden>✦</span></Link></In>
        </div>
        <footer className="flex flex-col gap-3 px-2 pt-6 text-[13px] text-black/50 md:flex-row md:justify-between">
          <span>© 2026 Lincoln</span>
          <span className="flex gap-5"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></span>
        </footer>
      </section>
    </div>
  );
}
