"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { HEADLINE, STATEMENT, TOOLS, TRUST, TYPES, WORK } from "../content";
import { In } from "./shared";

// Option 5, Particles: black, and thousands of fine points that form a classical courthouse over flowing ground
// lines. They drift in, settle, breathe, and part around the cursor. The close forms a page of a document the same
// way. Light serif type, a directory of case types, hairline grids.

type Shape = "court" | "page";

function targets(shape: Shape, w: number, h: number, n: number): [number, number, number][] {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d")!; g.fillStyle = "#fff";
  if (shape === "court") {
    const cx = w * 0.5, base = h * 0.6, W = Math.min(w * 0.52, h * 0.9), colH = W * 0.36, top = base - colH;
    // Steps, columns, entablature, pediment.
    for (let s = 0; s < 3; s++) g.fillRect(cx - W / 2 - 18 - s * 16, base + s * 12, W + 36 + s * 32, 9);
    const cols = 8, cw = W / (cols * 1.9);
    for (let i = 0; i < cols; i++) {
      const x = cx - W / 2 + (i + 0.5) * (W / cols) - cw / 2;
      g.fillRect(x, top, cw, colH);
      g.fillRect(x - cw * 0.2, top - 6, cw * 1.4, 6); g.fillRect(x - cw * 0.2, base - 6, cw * 1.4, 6);
    }
    g.fillRect(cx - W / 2 - 10, top - 34, W + 20, 26);
    g.beginPath(); g.moveTo(cx - W / 2 - 18, top - 38); g.lineTo(cx, top - 38 - W * 0.17); g.lineTo(cx + W / 2 + 18, top - 38); g.closePath(); g.fill();
    g.globalCompositeOperation = "destination-out";
    g.beginPath(); g.moveTo(cx - W / 2 + 26, top - 46); g.lineTo(cx, top - 38 - W * 0.17 + 20); g.lineTo(cx + W / 2 - 26, top - 46); g.closePath(); g.fill();
  } else {
    const pw = Math.min(w * 0.3, h * 0.5), ph = pw * 1.29, x = w * 0.5 - pw / 2, y = h * 0.5 - ph / 2;
    g.fillRect(x, y, pw, 3); g.fillRect(x, y + ph - 3, pw, 3); g.fillRect(x, y, 3, ph); g.fillRect(x + pw - 3, y, 3, ph);
    for (let i = 0; i < 16; i++) g.fillRect(x + pw * 0.1, y + ph * 0.1 + i * ph * 0.05, pw * (i % 5 === 4 ? 0.5 : 0.8), 4);
  }
  const data = g.getImageData(0, 0, w, h).data, pts: [number, number, number][] = [];
  for (let tries = 0; pts.length < n && tries < n * 40; tries++) {
    const x = Math.random() * w, y = Math.random() * h;
    if (data[((y | 0) * w + (x | 0)) * 4 + 3] > 0) pts.push([x, y, 1]);
  }
  // Ground: long flowing lines of points beneath, like terrain.
  if (shape === "court") for (let i = 0; i < n * 0.45; i++) { const x = Math.random() * w, k = Math.floor(Math.random() * 7); pts.push([x, h * 0.74 + k * 14 + Math.sin(x / w * 6 + k) * (18 + k * 6), 0]); }
  return pts;
}

function Field({ shape, className = "" }: { shape: Shape; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!, g = c.getContext("2d")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, vis = true, w = 0, h = 0, dpr = 1;
    let P: { x: number; y: number; tx: number; ty: number; vx: number; vy: number; a: number; s: number; solid: number }[] = [];
    const mouse = { x: -9999, y: -9999 };
    const build = () => {
      dpr = Math.min(devicePixelRatio, 2); w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(9000, (w * h) / 110));
      const T = targets(shape, Math.round(w), Math.round(h), n);
      // On a resize the points keep where they are and glide to their new places, rather than scattering again.
      const old = P;
      P = T.map(([tx, ty, solid], i) => ({ x: old[i]?.x ?? Math.random() * w, y: old[i]?.y ?? Math.random() * h, tx, ty, vx: 0, vy: 0, a: (solid === 0 ? 0.15 : 0.25) + Math.random() * (solid === 0 ? 0.45 : 0.75), s: Math.random() < 0.08 ? 1.6 : 0.9, solid }));
      for (let i = 0; i < n * 0.08; i++) P.push({ x: Math.random() * w, y: Math.random() * h, tx: Math.random() * w, ty: Math.random() * h, vx: 0, vy: 0, a: 0.15 + Math.random() * 0.3, s: 0.8, solid: -1 });
      if (still) P.forEach((p) => { p.x = p.tx; p.y = p.ty; });
    };
    const frame = (now: number) => {
      raf = 0; const t = now / 1000;
      g.clearRect(0, 0, w, h);
      for (const p of P) {
        const breathe = p.solid === 0 ? Math.sin(p.tx / w * 6 + t * 0.6) * 6 : p.solid === -1 ? Math.sin(t * 0.3 + p.tx) * 12 : Math.sin(t * 1.2 + p.tx * 0.05) * 0.8;
        let ax = (p.tx - p.x) * 0.012, ay = (p.ty + breathe - p.y) * 0.012;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 14000) { const f = (14000 - d2) / 14000 * 2.2; const d = Math.sqrt(d2) || 1; ax += dx / d * f; ay += dy / d * f; }
        p.vx = (p.vx + ax) * 0.86; p.vy = (p.vy + ay) * 0.86; p.x += p.vx; p.y += p.vy;
        g.fillStyle = `rgba(255,255,255,${p.a})`; g.fillRect(p.x, p.y, p.s, p.s);
      }
      if (!still && vis) raf = requestAnimationFrame(frame);
    };
    const move = (e: PointerEvent) => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const leave = () => { mouse.x = mouse.y = -9999; };
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !raf) raf = requestAnimationFrame(frame); });
    build(); io.observe(c); raf = requestAnimationFrame(frame);
    c.addEventListener("pointermove", move); c.addEventListener("pointerleave", leave);
    const onResize = () => { build(); if (!raf) raf = requestAnimationFrame(frame); };
    addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); io.disconnect(); removeEventListener("resize", onResize); c.removeEventListener("pointermove", move); c.removeEventListener("pointerleave", leave); };
  }, [shape]);
  return <canvas ref={ref} aria-hidden className={`block h-full w-full ${className}`} />;
}

export default function Particles() {
  const light = "font-serif font-light tracking-[-0.02em]";
  const small = "text-[11px] uppercase tracking-[0.16em] text-white/45";
  return (
    <div className="min-h-dvh bg-black text-white antialiased">
      {/* Hero */}
      <section className="relative isolate h-[100svh] min-h-[680px] overflow-hidden">
        <div className="absolute inset-0 -z-10"><Field shape="court" /></div>
        <header className="mx-auto flex h-20 max-w-[1320px] items-center justify-between px-6 md:px-10">
          <Link href="/" className="font-serif text-[22px] font-light tracking-[0.02em]">Lincoln</Link>
          <nav className="hidden gap-8 text-[12.5px] text-white/70 md:flex"><a href="#work">Product</a><a href="#types">Case types</a><a href="#security">Security</a></nav>
          <Link href="/start" className="bg-white px-4 py-2 text-[12.5px] font-medium text-black">Get In Touch</Link>
        </header>
        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[1320px] items-end justify-between gap-8 px-6 pb-12 md:px-10 md:pb-16">
          <h1 className={`${light} max-w-[14ch] text-[40px] leading-[1.08] md:text-[64px]`}>{HEADLINE.split(" ").map((w, i) => <span key={i} className={i < 2 ? "" : "text-white/55"}>{w} </span>)}</h1>
          <Link href="/start" className="hidden shrink-0 bg-white px-5 py-3 text-[13px] font-medium text-black md:block">Get In Touch</Link>
        </div>
      </section>

      {/* Statement */}
      <section className="mx-auto max-w-[1320px] px-6 py-32 md:px-10 md:py-44">
        <In><p className={`${light} max-w-[26ch] text-[32px] leading-[1.2] md:text-[56px]`}>{STATEMENT}</p></In>
      </section>

      {/* Work: a hairline grid */}
      <section id="work" className="mx-auto max-w-[1320px] px-6 md:px-10">
        <p className={small}>What Lincoln does</p>
        <div className="mt-8 grid border-l border-t border-white/15 md:grid-cols-3">
          {WORK.map((w, i) => (
            <div key={w.title} className="group border-b border-r border-white/15 p-7 transition-colors duration-500 hover:bg-white hover:text-black md:min-h-[240px]">
              <span className="text-[12px] tabular-nums text-white/40 group-hover:text-black/40">{String(i + 1).padStart(2, "0")}</span>
              <h3 className={`${light} mt-12 text-[26px] leading-[1.1]`}>{w.title}</h3>
              <p className="mt-3 text-[14.5px] leading-[1.55] text-white/55 group-hover:text-black/60">{w.line}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Case types: a directory */}
      <section id="types" className="mx-auto max-w-[1320px] px-6 py-32 md:px-10 md:py-44">
        <div className="grid gap-12 md:grid-cols-[1fr_2fr]">
          <In><h2 className={`${light} text-[40px] leading-[1.05] md:text-[60px]`}>Every case type a firm takes.</h2></In>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[15px] text-white/80 md:grid-cols-3">
            {TYPES.map((t, i) => <In key={t} delay={i * 15}><p className="border-b border-white/10 pb-3">{t}</p></In>)}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="border-y border-white/15">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-10 gap-y-4 px-6 py-10 md:px-10">
          <p className={small}>Inside the tools the firm already uses</p>
          {TOOLS.map((t) => <span key={t} className="text-[15px] text-white/80">{t}</span>)}
        </div>
      </section>

      {/* Security */}
      <section id="security" className="mx-auto grid max-w-[1320px] gap-10 px-6 py-32 md:grid-cols-4 md:px-10">
        {TRUST.map(([a, b], i) => <In key={a} delay={i * 80}><p className={`${light} text-[24px]`}>{a}</p><p className="mt-2 text-[14.5px] text-white/50">{b}</p></In>)}
      </section>

      {/* Close: a page forms */}
      <section className="relative isolate h-[90svh] min-h-[600px] overflow-hidden">
        <div className="absolute inset-0 -z-10"><Field shape="page" /></div>
        <div className="absolute inset-x-0 bottom-16 flex flex-col items-center text-center">
          <h2 className={`${light} text-[44px] md:text-[72px]`}>Start your first case.</h2>
          <Link href="/start" className="mt-8 bg-white px-6 py-3.5 text-[13.5px] font-medium text-black">Get In Touch</Link>
        </div>
      </section>

      <footer className="mx-auto max-w-[1320px] px-6 pb-10 pt-16 md:px-10">
        <div className="grid gap-10 border-t border-white/15 pt-12 md:grid-cols-4">
          <p className="font-serif text-[28px] font-light">Lincoln</p>
          {[["Product", ["Overview", "Case types", "Security"]], ["Company", ["Get In Touch", "Instagram"]], ["Legal", ["Terms", "Privacy"]]].map(([hd, items]) => (
            <div key={hd as string}><p className={small}>{hd as string}</p>{(items as string[]).map((x) => <p key={x} className="mt-3 text-[13.5px] text-white/70">{x}</p>)}</div>
          ))}
        </div>
        <p className="mt-16 text-[11px] uppercase tracking-[0.16em] text-white/35">© 2026 Lincoln. All rights reserved.</p>
      </footer>
    </div>
  );
}
