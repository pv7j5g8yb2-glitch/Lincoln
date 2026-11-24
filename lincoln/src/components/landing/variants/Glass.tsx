"use client";

import Link from "next/link";
import "@fontsource/instrument-serif";
import "@fontsource/instrument-serif/400-italic.css";
import { STATEMENT, TOOLS, TRUST, TYPES, WORK } from "../content";
import { In } from "./shared";

// Option 4, Glass: light and airy in seal blue, navy and crimson pink. An elegant serif with one italic word, and a
// sphere seen through fluted glass: each strip shows the sphere shifted a little, so the glass seems to bend it.

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" } as const;
const NAVY = "#072d59", PINK = "#fd6e88", SEAL = "#dbf2fc";

function Sphere({ size }: { size: number }) {
  return (
    <div className="rounded-full" style={{ width: size, height: size, background: `radial-gradient(circle at 30% 30%, #ffd6de 0%, ${PINK} 18%, #5a3f8a 42%, ${NAVY} 68%, #04193a 100%)`, boxShadow: `0 60px 120px -40px ${NAVY}` }} />
  );
}

/** The sphere behind fluted glass. */
function Fluted({ size = 520, strips = 7 }: { size?: number; strips?: number }) {
  const w = size / strips;
  return (
    <div className="relative" style={{ width: size, height: size }} aria-hidden>
      <div className="absolute left-[22%] top-0"><Sphere size={size} /></div>
      {Array.from({ length: strips }, (_, i) => (
        <div key={i} className="glass-strip absolute top-[-8%] overflow-hidden" style={{ left: i * w * 0.62, width: w * 0.62, height: "116%", animationDelay: `${i * -0.7}s` }}>
          <div className="absolute" style={{ left: size * 0.22 - i * w * 0.62 + (i - strips / 2) * 9, top: "6.9%" }}><Sphere size={size} /></div>
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.55), rgba(255,255,255,0.05) 30%, rgba(255,255,255,0) 70%, rgba(7,45,89,0.25))", backdropFilter: "blur(2px)" }} />
        </div>
      ))}
    </div>
  );
}

export default function Glass() {
  return (
    <div className="min-h-dvh font-sans antialiased" style={{ color: NAVY, background: "#f7fbfe" }}>
      <style>{`
        @keyframes glass-sway { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        .glass-strip { animation: glass-sway 9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .glass-strip { animation: none; } }
      `}</style>

      {/* Hero */}
      <section className="relative isolate overflow-hidden" style={{ background: `linear-gradient(180deg, ${SEAL} 0%, #eaf6fc 45%, #b9d4ea 75%, #2a5687 100%)` }}>
        <header className="relative z-10 mx-auto flex h-20 max-w-[1320px] items-center justify-between px-6 md:px-10">
          <Link href="/" className="text-[28px]" style={serif}>Lincoln</Link>
          <nav className="hidden gap-10 text-[13.5px] md:flex"><a href="#work">Product</a><a href="#types">Case types</a><a href="#tools">Integrations</a><a href="#security">Security</a></nav>
          <Link href="/start" className="rounded-[8px] px-4 py-2 text-[14px] font-medium text-white" style={{ background: PINK, boxShadow: `0 8px 24px -8px ${PINK}` }}>Get In Touch</Link>
        </header>
        <div className="relative mx-auto grid min-h-[calc(100svh-80px)] max-w-[1320px] items-center gap-10 px-6 pb-16 md:grid-cols-[1fr_auto] md:px-10">
          <div>
            <h1 className="text-[64px] leading-[0.95] tracking-[-0.02em] md:text-[120px]" style={serif}>Immigration work, <em className="italic">finished.</em></h1>
            <p className="mt-6 max-w-[40ch] text-[16.5px] leading-[1.6] opacity-80">Lincoln reads the firm&apos;s mail, opens and works each case, and brings the attorney only what needs a decision.</p>
            <Link href="/start" className="mt-8 inline-block rounded-[8px] px-6 py-3.5 text-[15px] font-medium text-white" style={{ background: PINK, boxShadow: `0 10px 30px -10px ${PINK}` }}>Get In Touch</Link>
            <div className="mt-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">Works with</p>
              <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[18px] font-semibold tracking-[-0.01em] text-white"><span>Microsoft 365</span><span>Google Workspace</span></div>
            </div>
          </div>
          <div className="hidden md:block"><Fluted /></div>
        </div>
      </section>

      {/* Statement */}
      <section className="mx-auto max-w-[1100px] px-6 py-28 text-center md:py-40">
        <In><p className="text-[38px] leading-[1.15] md:text-[64px]" style={serif}>Most of an immigration practice is paperwork. <em className="italic" style={{ color: PINK }}>Lincoln does the paperwork.</em> You practice law.</p></In>
        <span className="sr-only">{STATEMENT}</span>
      </section>

      {/* Work */}
      <section id="work" className="mx-auto max-w-[1320px] px-6 pb-28 md:px-10 md:pb-40">
        <div className="grid gap-5 md:grid-cols-3">
          {WORK.map((w, i) => (
            <In key={w.title} delay={(i % 3) * 90}>
              <div className="relative h-full overflow-hidden rounded-[22px] p-7" style={{ background: i % 4 === 0 ? `linear-gradient(160deg, ${SEAL}, #ffffff)` : "#ffffff", boxShadow: "0 1px 0 rgba(7,45,89,0.06), 0 20px 50px -30px rgba(7,45,89,0.35)" }}>
                <span className="text-[13px] font-semibold" style={{ color: PINK }}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-8 text-[32px] leading-[1.05]" style={serif}>{w.title}</h3>
                <p className="mt-3 text-[15px] leading-[1.55] opacity-75">{w.line}</p>
              </div>
            </In>
          ))}
        </div>
      </section>

      {/* Case types */}
      <section id="types" className="relative isolate overflow-hidden py-28 text-white md:py-36" style={{ background: `radial-gradient(70% 90% at 85% 50%, #3a3f7f 0%, ${NAVY} 55%, #041a36 100%)` }}>
        <div className="mx-auto grid max-w-[1320px] gap-12 px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:px-10">
          <In><h2 className="text-[48px] leading-[1] md:text-[80px]" style={serif}>Every case type, <em className="italic" style={{ color: PINK }}>one platform.</em></h2></In>
          <div className="flex flex-wrap content-start gap-2">
            {TYPES.map((t) => <span key={t} className="rounded-full px-4 py-2 text-[14.5px] ring-1 ring-white/20" style={{ background: "rgba(219,242,252,0.06)" }}>{t}</span>)}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="mx-auto max-w-[1320px] px-6 py-28 md:px-10 md:py-40">
        <In><h2 className="max-w-[18ch] text-[44px] leading-[1.02] md:text-[76px]" style={serif}>Inside the tools the firm <em className="italic">already uses.</em></h2></In>
        <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-5">
          {TOOLS.map((t, i) => <In key={t} delay={i * 40}><div className="rounded-[14px] bg-white px-5 py-6 text-[15px] font-medium" style={{ boxShadow: "0 16px 40px -28px rgba(7,45,89,0.5)" }}>{t}</div></In>)}
        </div>
      </section>

      {/* Security */}
      <section id="security" className="mx-auto max-w-[1320px] px-6 pb-28 md:px-10 md:pb-40">
        <div className="grid gap-px overflow-hidden rounded-[22px] md:grid-cols-4" style={{ background: "rgba(7,45,89,0.12)" }}>
          {TRUST.map(([a, b]) => <div key={a} className="bg-[#f7fbfe] p-7"><p className="text-[26px]" style={serif}>{a}</p><p className="mt-2 text-[14.5px] opacity-70">{b}</p></div>)}
        </div>
      </section>

      {/* Close */}
      <section className="px-4 pb-4 md:px-6 md:pb-6">
        <div className="relative isolate overflow-hidden rounded-[32px] px-6 py-28 md:px-16 md:py-36" style={{ background: `linear-gradient(135deg, ${SEAL} 0%, #b9d4ea 40%, ${NAVY} 100%)` }}>
          <div className="pointer-events-none absolute -right-24 top-1/2 hidden -translate-y-1/2 md:block"><Fluted size={460} strips={6} /></div>
          <In><h2 className="relative max-w-[10ch] text-[60px] leading-[0.95] md:text-[112px]" style={serif}>Start your <em className="italic">first case.</em></h2></In>
          <In delay={150}><Link href="/start" className="relative mt-10 inline-block rounded-[8px] px-7 py-4 text-[15px] font-medium text-white" style={{ background: PINK }}>Get In Touch</Link></In>
        </div>
        <footer className="flex justify-between px-2 pt-6 text-[13px] opacity-60"><span>© 2026 Lincoln</span><span className="flex gap-5"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></span></footer>
      </section>
    </div>
  );
}
