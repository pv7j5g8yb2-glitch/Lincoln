"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import "@fontsource-variable/space-grotesk";
import { STATEMENT, TOOLS, TRUST, TYPES, WORK } from "../content";
import { GRAIN, In, useClock } from "./shared";

// Option 2, Thermal: black, one fluid wave of thermal light (orange heart, electric blue edge) with grain, a grotesk
// headline in staggered lines, a header of live US clocks and a glass lens that follows the cursor.

const grot = { fontFamily: "'Space Grotesk Variable', sans-serif" } as const;

const FRAG = `
precision highp float;
uniform vec2 r; uniform float t; uniform float k;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 uv = gl_FragCoord.xy / r;
  float x = uv.x;
  float c = 0.48 + 0.30 * sin(x * 3.2 + t * 0.18 + k) * (0.6 + 0.4 * sin(t * 0.07)) + 0.06 * sin(x * 7.0 - t * 0.23);
  float d = (uv.y - c) / (0.10 + 0.05 * sin(x * 2.0 + t * 0.1));
  float heart = exp(-d * d * 2.0);
  float edge = exp(-(d - 1.6) * (d - 1.6) * 1.4) + exp(-(d + 1.8) * (d + 1.8) * 1.2);
  vec3 col = vec3(0.012);
  col += vec3(0.10, 0.32, 0.95) * edge * 0.85;
  col = mix(col, vec3(0.98, 0.36, 0.06), clamp(heart * 1.1, 0.0, 1.0));
  col = mix(col, vec3(1.0, 0.82, 0.62), clamp(exp(-d * d * 9.0) * 0.7, 0.0, 1.0));
  col += (hash(gl_FragCoord.xy + fract(t) * 50.0) - 0.5) * 0.09;
  gl_FragColor = vec4(col, 1.0);
}`;

function Wave({ k = 0 }: { k?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!, gl = c.getContext("webgl");
    if (!gl) { c.style.background = "linear-gradient(170deg,#000 30%,#f25a12 52%,#1a4ff2 62%,#000 80%)"; return; }
    const sh = (ty: number, s: string) => { const x = gl.createShader(ty)!; gl.shaderSource(x, s); gl.compileShader(x); return x; };
    const p = gl.createProgram()!;
    gl.attachShader(p, sh(gl.VERTEX_SHADER, "attribute vec2 a; void main(){ gl_Position = vec4(a,0.,1.); }"));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(p); gl.useProgram(p);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(p, "r"), uT = gl.getUniformLocation(p, "t"); gl.uniform1f(gl.getUniformLocation(p, "k"), k);
    let raf = 0, vis = true; const t0 = performance.now() - 30000;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = (now: number) => {
      raf = 0; const dpr = Math.min(devicePixelRatio, 1.5), w = c.clientWidth * dpr | 0, h = c.clientHeight * dpr | 0;
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; gl.viewport(0, 0, w, h); }
      gl.uniform2f(uR, w, h); gl.uniform1f(uT, (now - t0) / 1000); gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!still && vis) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !raf) raf = requestAnimationFrame(draw); }); io.observe(c);
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [k]);
  return <canvas ref={ref} aria-hidden className="block h-full w-full" />;
}

function Lens() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let x = innerWidth * 0.62, y = innerHeight * 0.42, tx = x, ty = y, raf = 0;
    const move = (e: PointerEvent) => { tx = e.clientX; ty = e.clientY; };
    const loop = () => { x += (tx - x) * 0.08; y += (ty - y) * 0.08; if (ref.current) ref.current.style.transform = `translate(${x - 110}px, ${y - 110}px)`; raf = requestAnimationFrame(loop); };
    addEventListener("pointermove", move); raf = requestAnimationFrame(loop);
    return () => { removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute left-0 top-0 z-10 hidden h-[220px] w-[220px] rounded-full md:block"
      style={{ backdropFilter: "blur(1.5px) saturate(1.8) brightness(1.25) hue-rotate(-12deg)", WebkitBackdropFilter: "blur(1.5px) saturate(1.8) brightness(1.25)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35), inset 0 18px 40px rgba(255,255,255,0.12), inset 0 -24px 40px rgba(0,0,0,0.35), 0 30px 60px rgba(0,0,0,0.4)" }} />
  );
}

function Clock({ city, zone, on }: { city: string; zone: string; on?: boolean }) {
  const t = useClock(zone);
  return <p className={on ? "text-white" : "text-white/45"}>{on ? "▸ " : ""}{city} <span className="tabular-nums">{t}</span></p>;
}

export default function Thermal() {
  const label = "text-[12px] uppercase tracking-[0.14em]";
  return (
    <div className="min-h-dvh bg-black text-white antialiased" style={grot}>
      {/* Hero */}
      <section className="relative isolate h-[100svh] min-h-[640px] overflow-hidden">
        <div className="absolute inset-0 -z-10"><Wave /></div>
        <Lens />
        <header className={`relative z-20 mx-auto grid max-w-[1320px] grid-cols-2 gap-6 px-6 pt-7 md:grid-cols-4 md:px-10 ${label}`}>
          <Link href="/" className="flex items-center gap-3 normal-case tracking-normal"><span className="text-[19px] font-semibold">lincoln</span><span className="h-4 w-px bg-white/40" /><span className="text-[14px] text-white/70">immigration</span></Link>
          <div className="hidden flex-col gap-1.5 md:flex"><a className="text-white">▸ Home</a><a href="#work" className="text-white/45">Work</a><a href="#security" className="text-white/45">Security</a></div>
          <div className="hidden flex-col gap-1.5 md:flex"><Clock city="New York" zone="America/New_York" on /><Clock city="Chicago" zone="America/Chicago" /><Clock city="Los Angeles" zone="America/Los_Angeles" /></div>
          <div className="flex justify-end"><Link href="/start" className="h-fit rounded-full px-4 py-2 normal-case tracking-normal ring-1 ring-white/60 transition hover:bg-white hover:text-black">Get In Touch</Link></div>
        </header>
        <div className="relative z-20 mx-auto flex h-[calc(100%-80px)] max-w-[1320px] flex-col justify-center px-6 md:px-10">
          <h1 className="text-[52px] font-normal leading-[1.02] tracking-[-0.04em] md:text-[112px]">
            <span className="block">Your work</span>
            <span className="block pl-[12%]">done before</span>
            <span className="block pl-[5%]">you even ask.</span>
          </h1>
        </div>
        <div className={`absolute inset-x-0 bottom-0 z-20 mx-auto grid max-w-[1320px] grid-cols-3 gap-6 px-6 pb-7 md:px-10 ${label} normal-case tracking-normal text-[13px]`}>
          <p><span className="block font-medium">Built for US immigration law</span><span className="text-white/50">Every case type</span></p>
          <p><span className="block font-medium">Autonomous</span><span className="text-white/50">Asks only for decisions</span></p>
          <p className="text-right"><span className="block font-medium">Attorney approved</span><span className="text-white/50">Nothing sent without it</span></p>
        </div>
      </section>

      {/* Statement */}
      <section className="mx-auto max-w-[1320px] px-6 py-32 md:px-10 md:py-48">
        <In><p className="max-w-[24ch] text-[34px] leading-[1.12] tracking-[-0.03em] md:text-[60px]">{STATEMENT.split("Lincoln").map((part, i, a) => <span key={i}>{part}{i < a.length - 1 && <span className="bg-gradient-to-r from-[#ff6a1a] to-[#3b6bff] bg-clip-text text-transparent">Lincoln</span>}</span>)}</p></In>
      </section>

      {/* Work */}
      <section id="work" className="border-t border-white/15">
        {WORK.map((w, i) => (
          <div key={w.title} className="group relative overflow-hidden border-b border-white/15">
            <div className="absolute inset-0 -z-0 translate-y-full bg-gradient-to-r from-[#ff5a0f] via-[#ff7a2e] to-[#2a5cff] transition-transform duration-500 ease-out group-hover:translate-y-0" />
            <div className="relative mx-auto grid max-w-[1320px] items-baseline gap-2 px-6 py-7 md:grid-cols-[80px_1fr_380px] md:px-10 md:py-9">
              <span className="text-[13px] tabular-nums text-white/45 group-hover:text-black/60">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-[30px] leading-none tracking-[-0.035em] group-hover:text-black md:text-[56px]">{w.title}</h3>
              <p className="text-[15.5px] leading-[1.5] text-white/60 group-hover:text-black/75">{w.line}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Case types on the wave */}
      <section className="relative isolate overflow-hidden py-32 md:py-44">
        <div className="absolute inset-0 -z-10 opacity-90"><Wave k={2.2} /></div>
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <In><p className={`${label} text-white/70`}>Every case type</p></In>
          <In delay={100}><p className="mt-6 text-[28px] leading-[1.25] tracking-[-0.02em] md:text-[46px]">{TYPES.join("  ·  ")}</p></In>
        </div>
      </section>

      {/* Tools */}
      <section className="mx-auto max-w-[1320px] px-6 py-28 md:px-10 md:py-40">
        <In><h2 className="max-w-[16ch] text-[40px] leading-[1.02] tracking-[-0.04em] md:text-[76px]">Inside the tools the firm already uses.</h2></In>
        <div className="mt-14 grid grid-cols-2 border-l border-t border-white/15 md:grid-cols-5">
          {TOOLS.map((t) => <div key={t} className="border-b border-r border-white/15 px-5 py-8 text-[15px] text-white/80">{t}</div>)}
        </div>
      </section>

      {/* Security */}
      <section id="security" className="mx-auto grid max-w-[1320px] gap-10 px-6 pb-32 md:grid-cols-4 md:px-10">
        {TRUST.map(([a, b], i) => <In key={a} delay={i * 80}><p className="text-[22px] tracking-[-0.02em]">{a}</p><p className="mt-2 text-[15px] text-white/55">{b}</p></In>)}
      </section>

      {/* Close */}
      <section className="relative isolate h-[80svh] min-h-[520px] overflow-hidden">
        <div className="absolute inset-0 -z-10"><Wave k={4.1} /></div>
        <div className="mx-auto flex h-full max-w-[1320px] flex-col justify-center px-6 md:px-10">
          <h2 className="text-[56px] leading-[1] tracking-[-0.045em] md:text-[128px]"><span className="block">Start your</span><span className="block pl-[10%]">first case.</span></h2>
          <Link href="/start" className="mt-10 w-fit rounded-full bg-white px-7 py-4 text-[15px] font-medium text-black">Get In Touch</Link>
        </div>
      </section>
      <footer className="mx-auto flex max-w-[1320px] justify-between px-6 py-8 text-[13px] text-white/45 md:px-10"><span>© 2026 Lincoln</span><span className="flex gap-5"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></span></footer>
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}
