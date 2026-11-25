"use client";

import { useEffect, useRef } from "react";

// Lincoln's particle scenes, drawn on a 2D canvas. Each scene is a set of points in 3D (a courthouse with fluted
// columns on a rolling field, or a stack of filing pages), turned slowly, seen in perspective, and drawn as fine
// white points that twinkle. The points stream in from a scattered cloud when the scene first comes into view, follow
// their places with a little lag, and each keeps drifting on its own small path, so the shape is always alive. Only a
// cursor or finger on the shape itself moves them (it parts them, a tap there sends a ripple); they drift apart into dust as the scene is scrolled away (coming back together on the way up). Points sit
// mostly on edges, so the shape reads clean. Anyone who asks for less motion gets the finished scene, still.

export type Scene = "court" | "packet";

type P3 = { x: number; y: number; z: number; k: number }; // k: 0 shape, 1 ground, 2 dust

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Points on a box: mostly along its twelve edges (spread by length, so long edges are as clear as short ones), the
 *  rest on its faces. */
function box(out: P3[], x0: number, y0: number, z0: number, w: number, h: number, d: number, n: number, edge = 0.75) {
  const total = 4 * (w + h + d);
  for (let i = 0; i < n; i++) {
    const a = Math.random() < 0.5 ? 0 : 1, b = Math.random() < 0.5 ? 0 : 1;
    if (Math.random() < edge) {
      const pick = Math.random() * total, t = Math.random();
      if (pick < 4 * w) out.push({ x: x0 + t * w, y: y0 + a * h, z: z0 + b * d, k: 0 });
      else if (pick < 4 * (w + h)) out.push({ x: x0 + a * w, y: y0 + t * h, z: z0 + b * d, k: 0 });
      else out.push({ x: x0 + a * w, y: y0 + b * h, z: z0 + t * d, k: 0 });
    } else {
      // Faces by area: mostly the top and the front, where the eye looks.
      const u = Math.random(), v = Math.random(), f = Math.random();
      if (f < 0.55) out.push({ x: x0 + u * w, y: y0 + h, z: z0 + v * d, k: 0 });
      else out.push({ x: x0 + u * w, y: y0 + v * h, z: z0 + d, k: 0 });
    }
  }
}

/** A fluted column: points on the surface of a cylinder, thicker along the flutes. */
function column(out: P3[], cx: number, cz: number, y0: number, h: number, r: number, n: number) {
  for (let i = 0; i < n; i++) {
    const flute = ((Math.random() * 12) | 0) / 12 * Math.PI * 2;
    const a = Math.random() < 0.82 ? flute + rand(-0.025, 0.025) : rand(0, Math.PI * 2);
    const y = y0 + Math.random() * h, rr = r * (1 - 0.06 * (y - y0) / h);
    out.push({ x: cx + Math.cos(a) * rr, y, z: cz + Math.sin(a) * rr, k: 0 });
  }
  box(out, cx - r * 1.35, y0 + h, cz - r * 1.35, r * 2.7, r * 0.5, r * 2.7, n * 0.08, 0.9); // capital
  box(out, cx - r * 1.3, y0 - r * 0.4, cz - r * 1.3, r * 2.6, r * 0.4, r * 2.6, n * 0.06, 0.9); // base
}

/** A triangle's outline (the pediment's face), with a few points inside. */
function triangle(out: P3[], w: number, y0: number, h: number, z: number, n: number) {
  for (let i = 0; i < n; i++) {
    const t = Math.random(), side = (Math.random() * 3) | 0;
    if (Math.random() < 0.85) {
      if (side === 0) out.push({ x: -w / 2 + t * w, y: y0, z, k: 0 });
      else if (side === 1) out.push({ x: -w / 2 + t * (w / 2), y: y0 + t * h, z, k: 0 });
      else out.push({ x: t * (w / 2), y: y0 + h - t * h, z, k: 0 });
    } else {
      const u = Math.random(), v = Math.random() * (1 - Math.abs(u * 2 - 1));
      out.push({ x: -w / 2 + u * w, y: y0 + v * h, z, k: 0 });
    }
  }
}

function court(dense: number): P3[] {
  const o: P3[] = [];
  const n = (x: number) => Math.round(x * dense);
  // Steps.
  box(o, -0.56, -0.36, -0.22, 1.12, 0.035, 0.44, n(260));
  box(o, -0.52, -0.325, -0.2, 1.04, 0.035, 0.4, n(230));
  box(o, -0.48, -0.29, -0.18, 0.96, 0.03, 0.36, n(200));
  // Columns: a front row and, deeper and fainter, a back row.
  for (let i = 0; i < 8; i++) {
    const x = -0.4 + i * (0.8 / 7);
    column(o, x, 0.11, -0.26, 0.36, 0.027, n(170));
    column(o, x, -0.11, -0.26, 0.36, 0.027, n(55));
  }
  // Entablature and roof.
  box(o, -0.47, 0.1, -0.16, 0.94, 0.07, 0.32, n(420), 0.85);
  triangle(o, 0.98, 0.17, 0.16, 0.16, n(340));
  triangle(o, 0.98, 0.17, 0.16, -0.16, n(120));
  for (let i = 0; i < n(90); i++) o.push({ x: 0, y: 0.33, z: rand(-0.16, 0.16), k: 0 }); // ridge
  // The rolling field it stands on.
  const cols = Math.round(80 * Math.sqrt(dense)), rows = Math.round(30 * Math.sqrt(dense));
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) o.push({ x: -1.9 + (i / (cols - 1)) * 3.8 + rand(-0.01, 0.01), y: -0.4, z: -1.25 + (j / (rows - 1)) * 2.1, k: 1 });
  // Dust in the air.
  for (let i = 0; i < n(220); i++) o.push({ x: rand(-1.6, 1.6), y: rand(-0.4, 0.9), z: rand(-0.8, 0.8), k: 2 });
  return o;
}

function packet(dense: number): P3[] {
  const o: P3[] = [];
  const n = (x: number) => Math.round(x * dense);
  // Three pages, fanned, each with its lines of text; the front one has a signature line.
  for (let p = 0; p < 3; p++) {
    const dz = -p * 0.09, dx = p * 0.05, dy = p * 0.04, w = 0.5, h = 0.66;
    const edge = (x0: number, y0: number, x1: number, y1: number, m: number) => { for (let i = 0; i < m; i++) { const t = Math.random(); o.push({ x: dx + x0 + (x1 - x0) * t, y: dy + y0 + (y1 - y0) * t, z: dz, k: 0 }); } };
    const m = n(p ? 120 : 220);
    edge(-w / 2, -h / 2, w / 2, -h / 2, m); edge(-w / 2, h / 2, w / 2, h / 2, m); edge(-w / 2, -h / 2, -w / 2, h / 2, m * 1.3); edge(w / 2, -h / 2, w / 2, h / 2, m * 1.3);
    if (p === 0) {
      for (let l = 0; l < 14; l++) { const y = h / 2 - 0.08 - l * 0.034, len = l % 5 === 4 ? 0.22 : 0.38; edge(-w / 2 + 0.06, y, -w / 2 + 0.06 + len, y, n(34)); }
      edge(0.02, -h / 2 + 0.07, 0.2, -h / 2 + 0.07, n(40));
    }
  }
  for (let i = 0; i < n(160); i++) o.push({ x: rand(-1.4, 1.4), y: rand(-0.8, 0.8), z: rand(-0.6, 0.6), k: 2 });
  return o;
}

export default function Points({ scene, className = "" }: { scene: Scene; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!, g = c.getContext("2d")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = matchMedia("(hover: none)").matches;
    let w = 0, h = 0, raf = 0, visible = false, started = 0;
    let pts: (P3 & { sx: number; sy: number; vx: number; vy: number; tw: number; delay: number; dir: [number, number]; a: number; f1: number; f2: number; p1: number; p2: number })[] = [];
    const pointer = { x: -9999, y: -9999, sx: 0 };
    // The area the shape covers on screen, from the last frame. Only a cursor or finger inside it moves the points: a
    // touch on the header, the headline or anywhere else on the page leaves them alone.
    const area = { x0: 0, y0: 0, x1: -1, y1: -1 };
    const inside = (x: number, y: number) => x >= area.x0 - 24 && x <= area.x1 + 24 && y >= area.y0 - 24 && y <= area.y1 + 24;
    const ripples: { x: number; y: number; t: number }[] = [];

    const build = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = c.clientWidth; h = c.clientHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const dense = Math.min(1, (w * h) / (1440 * 900)) * (touch ? 0.75 : 1) + 0.25;
      const old = pts;
      pts = (scene === "court" ? court(dense) : packet(dense)).map((p, i) => {
        const ang = Math.random() * Math.PI * 2;
        return { ...p, sx: old[i]?.sx ?? rand(-0.2, 1.2) * w, sy: old[i]?.sy ?? rand(-0.3, 1.3) * h, vx: 0, vy: 0, tw: Math.random() * Math.PI * 2, delay: p.k === 2 ? 0 : Math.random() * 1.6 + (p.k === 1 ? 0.4 : 0), dir: [Math.cos(ang), Math.sin(ang)], a: p.k === 0 ? rand(0.45, 1) : p.k === 1 ? rand(0.18, 0.45) : rand(0.12, 0.35), f1: rand(0.7, 1.9), f2: rand(0.7, 1.9), p1: rand(0, 6.28), p2: rand(0, 6.28) };
      });
    };

    const frame = (now: number) => {
      raf = 0;
      if (!started) started = now;
      const t = now / 1000, life = (now - started) / 1000;
      // How far the scene has been scrolled out of view: 0 in place, 1 gone.
      const r = c.getBoundingClientRect();
      const gone = scene === "court" ? Math.min(1, Math.max(0, -r.top / (r.height * 0.75))) : Math.min(1, Math.max(0, (r.top - innerHeight * 0.25) / (innerHeight * 0.75)));
      const sc = Math.min(w * (touch ? 0.86 : 0.5), h * (scene === "court" ? 0.95 : 0.8));
      const cx = w * 0.5, cy = h * (scene === "court" ? (touch ? 0.4 : 0.44) : 0.4);
      const on = pointer.x > -9000 && inside(pointer.x, pointer.y);
      pointer.sx += ((on ? (pointer.x - (area.x0 + area.x1) / 2) / Math.max(1, area.x1 - area.x0) : 0) - pointer.sx) * 0.05;
      // Always turning on its own, a little faster than before, in a slow figure that never quite repeats.
      const turn = (scene === "court" ? -0.32 : 0.35) + 0.26 * Math.sin(t * 0.21) + 0.1 * Math.sin(t * 0.083 + 1.3) + pointer.sx * 0.35;
      let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
      const cos = Math.cos(turn), sin = Math.sin(turn), tilt = scene === "court" ? 0.2 : 0.12, ct = Math.cos(tilt), st = Math.sin(tilt);
      g.clearRect(0, 0, w, h);
      for (let i = ripples.length - 1; i >= 0; i--) if (t - ripples[i].t > 1.6) ripples.splice(i, 1);
      for (const p of pts) {
        let y = p.y;
        if (p.k === 1) y += 0.018 * Math.sin(p.x * 4 + t * 0.9) + 0.014 * Math.sin(p.z * 6 - t * 0.7);
        if (p.k === 2) y += 0.03 * Math.sin(t * 0.25 + p.x * 3);
        const x1 = p.x * cos + p.z * sin, z1 = -p.x * sin + p.z * cos;
        const y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
        const f = 2.4 / (2.4 + z2);
        let tx = cx + x1 * f * sc, ty = cy - y2 * f * sc;
        if (p.k === 0) { if (tx < bx0) bx0 = tx; if (tx > bx1) bx1 = tx; if (ty < by0) by0 = ty; if (ty > by1) by1 = ty; }
        // Every point drifts on its own small path all the time, so the whole shape is alive even when nothing touches it.
        const amp = (p.k === 2 ? 7 : p.k === 1 ? 2.2 : 2.6) * f;
        tx += Math.sin(t * p.f1 + p.p1) * amp; ty += Math.cos(t * p.f2 + p.p2) * amp;
        if (gone > 0) { const k = gone * gone * (p.k === 2 ? 0.6 : 1); tx += p.dir[0] * k * w * 0.35; ty += p.dir[1] * k * h * 0.3 - k * h * 0.2; }
        const live = life > p.delay || still;
        if (still) { p.sx = tx; p.sy = ty; }
        let ax = live ? (tx - p.sx) * 0.07 : 0, ay = live ? (ty - p.sy) * 0.07 : 0;
        const dx = p.sx - pointer.x, dy = p.sy - pointer.y, d2 = dx * dx + dy * dy, R = touch ? 9000 : 12000;
        if (on && d2 < R) { const d = Math.sqrt(d2) || 1, push = (1 - d2 / R) * 3.2; ax += (dx / d) * push; ay += (dy / d) * push; }
        for (const rp of ripples) {
          const age = t - rp.t, rad = age * 520, ddx = p.sx - rp.x, ddy = p.sy - rp.y, d = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
          const band = Math.exp(-((d - rad) ** 2) / 1800) * (1 - age / 1.6) * 5;
          ax += (ddx / d) * band; ay += (ddy / d) * band;
        }
        p.vx = (p.vx + ax) * 0.8; p.vy = (p.vy + ay) * 0.8; p.sx += p.vx; p.sy += p.vy;
        const twinkle = 0.65 + 0.35 * Math.sin(t * (1.6 + (p.tw % 1.6)) + p.tw);
        const alpha = p.a * twinkle * Math.min(1, f * 0.95) * (1 - gone * 0.85) * (live ? 1 : 0.35);
        if (alpha < 0.02) continue;
        const s = (p.k === 0 ? 1.25 : 1) * f * (p.tw > 5.9 ? 1.8 : 1);
        g.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        g.fillRect(p.sx, p.sy, s, s);
      }
      if (bx1 > bx0) { area.x0 = bx0; area.y0 = by0; area.x1 = bx1; area.y1 = by1; }
      if (!still && visible) raf = requestAnimationFrame(frame);
    };

    const at = (x: number, y: number) => { const b = c.getBoundingClientRect(); pointer.x = x - b.left; pointer.y = y - b.top; };
    const onMove = (e: PointerEvent) => at(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { const p = e.touches[0]; if (p) at(p.clientX, p.clientY); };
    const onLeave = () => { pointer.x = pointer.y = -9999; };
    const onDown = (e: PointerEvent) => { const b = c.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top; if (!inside(x, y)) return; ripples.push({ x, y, t: performance.now() / 1000 }); };
    const wake = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !started && scene === "packet") started = 0; wake(); }, { threshold: 0 });
    const onResize = () => { build(); wake(); };

    build(); io.observe(c);
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("touchmove", onTouch, { passive: true });
    addEventListener("touchend", onLeave, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    addEventListener("pointerdown", onDown, { passive: true });
    addEventListener("resize", onResize);
    addEventListener("scroll", wake, { passive: true });
    return () => {
      cancelAnimationFrame(raf); io.disconnect();
      removeEventListener("pointermove", onMove); removeEventListener("touchmove", onTouch); removeEventListener("touchend", onLeave);
      document.documentElement.removeEventListener("pointerleave", onLeave); removeEventListener("pointerdown", onDown);
      removeEventListener("resize", onResize); removeEventListener("scroll", wake);
    };
  }, [scene]);
  return <canvas ref={ref} aria-hidden className={`block h-full w-full ${className}`} />;
}
