"use client";

import { useEffect, useRef } from "react";

// Lincoln's particle scenes, drawn on a 2D canvas. Each scene is a set of points in 3D ("LINCOLN" in heavy serif, or a
// stack of filing pages), turned a little, seen in perspective, and drawn as fine white points that twinkle. The points
// stream in from a scattered cloud when the scene first comes into view, follow their places with a little lag, and
// each keeps drifting on its own small path, so the shape is always alive. Nothing else moves them except a cursor or
// finger on the shape itself (it parts them; a tap there sends a ripple): not scrolling, not a touch elsewhere on the
// page. Anyone who asks for less motion gets the finished scene, still.

export type Scene = "word" | "packet";

type P3 = { x: number; y: number; z: number; k: number }; // k: 0 shape, 1 ground, 2 dust

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** "LINCOLN" in heavy serif, as points: a third on the letters' outlines so they read crisp, the rest filling them, each
 *  given a little depth so the word has body when it turns. Width 1, centred on the origin. Fonts must be loaded. */
function word(dense: number): P3[] {
  const c = document.createElement("canvas"), W = 1400, H = 360;
  c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  const family = getComputedStyle(document.body).getPropertyValue("--font-serif") || "Georgia, serif";
  g.font = `800 240px ${family}`;
  g.textAlign = "left"; g.textBaseline = "middle"; g.fillStyle = "#fff";
  // Letter by letter, a little apart, so the letters stay distinct even small on a phone.
  const text = "LINCOLN", gap = 14, widths = [...text].map((ch) => g.measureText(ch).width), width = widths.reduce((a, b) => a + b, 0) + gap * (text.length - 1);
  let x0 = (W - width) / 2;
  [...text].forEach((ch, i) => { g.fillText(ch, x0, H / 2 + 8); x0 += widths[i] + gap; });
  const px = g.getImageData(0, 0, W, H).data, on = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && px[(y * W + x) * 4 + 3] > 128;
  const edge: [number, number][] = [], fill: [number, number][] = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    if (!on(x, y)) continue;
    (on(x - 3, y) && on(x + 3, y) && on(x, y - 3) && on(x, y + 3) ? fill : edge).push([x, y]);
  }
  const o: P3[] = [], n = Math.round(4200 * dense), pick = (list: [number, number][]) => list[(Math.random() * list.length) | 0];
  for (let i = 0; i < n && edge.length && fill.length; i++) {
    const [x, y] = Math.random() < 0.5 ? pick(edge) : pick(fill);
    o.push({ x: (x + rand(-1, 1) - W / 2) / width, y: -(y + rand(-1, 1) - H / 2) / width, z: rand(-0.015, 0.015), k: 0 });
  }
  for (let i = 0; i < Math.round(160 * dense); i++) o.push({ x: rand(-1.2, 1.2), y: rand(-0.7, 0.7), z: rand(-0.6, 0.6), k: 2 });
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

    // The layout height: set once, and again only when the width changes. A phone's address bar showing or hiding while
    // scrolling changes the height alone; that must not move a single point.
    let lh = 0;
    /** Fits the canvas to its box. The points are made once; a resize only redraws them in the new space. */
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2), nw = c.clientWidth, nh = c.clientHeight;
      if (nw !== w || !lh) lh = nh;
      w = nw; h = nh;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const build = () => {
      size();
      const dense = Math.min(1, (w * lh) / (1440 * 900)) * (touch ? 0.75 : 1) + 0.25;
      pts = (scene === "word" ? word(dense) : packet(dense)).map((p) => {
        const ang = Math.random() * Math.PI * 2;
        return { ...p, sx: rand(-0.2, 1.2) * w, sy: rand(-0.3, 1.3) * lh, vx: 0, vy: 0, tw: Math.random() * Math.PI * 2, delay: p.k === 2 ? 0 : Math.random() * 1.6 + (p.k === 1 ? 0.4 : 0), dir: [Math.cos(ang), Math.sin(ang)], a: p.k === 0 ? rand(0.45, 1) : p.k === 1 ? rand(0.18, 0.45) : rand(0.12, 0.35), f1: rand(1.1, 2.6), f2: rand(1.1, 2.6), p1: rand(0, 6.28), p2: rand(0, 6.28) };
      });
    };

    const frame = (now: number) => {
      raf = 0;
      if (!started) started = now;
      const t = now / 1000, life = (now - started) / 1000;
      // The word spans most of a phone's width and about two thirds of a laptop's, never wider than 1100 pixels.
      const sc = scene === "word" ? Math.min(w * (w < 768 ? 0.88 : 0.72), 1100) : Math.min(w * (touch ? 0.86 : 0.5), lh * 0.8);
      const cx = w * 0.5, cy = lh * 0.4;
      const on = pointer.x > -9000 && inside(pointer.x, pointer.y);
      // Always turning a little on its own (gently for the word, so it stays easy to read).
      const sway = scene === "word" ? (w < 768 ? 0.42 : 0.6) : 1;
      // A band of light sweeps across the shape every few seconds, like a hologram prototype in a film.
      const scan = cx + (((t * 0.22) % 1.5) - 0.75) * sc * 1.4, band = sc * 0.06;
      const turn = (scene === "word" ? 0 : 0.35) + sway * (0.26 * Math.sin(t * 0.32) + 0.1 * Math.sin(t * 0.12 + 1.3));
      let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
      const cos = Math.cos(turn), sin = Math.sin(turn), tilt = (scene === "word" ? 0.06 : 0.12) + 0.04 * Math.sin(t * 0.17), ct = Math.cos(tilt), st = Math.sin(tilt);
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
        // A slow wave runs through the shape, so it visibly breathes.
        if (p.k === 0) ty += Math.sin(p.x * 9 - t * 1.7) * sc * 0.006 + Math.sin(p.x * 3.1 + t * 1.1) * sc * 0.004;
        if (p.k === 0) { if (tx < bx0) bx0 = tx; if (tx > bx1) bx1 = tx; if (ty < by0) by0 = ty; if (ty > by1) by1 = ty; }
        // Every point drifts on its own small path all the time, so the whole shape is alive even when nothing touches it.
        // The drift scales with the shape, so small letters on a phone stay sharp.
        const amp = (p.k === 2 ? 7 : p.k === 1 ? 2.2 : scene === "word" ? Math.max(0.9, sc * 0.0032) : 3.2) * f;
        tx += Math.sin(t * p.f1 + p.p1) * amp; ty += Math.cos(t * p.f2 + p.p2) * amp;
        const live = life > p.delay || still;
        if (still) { p.sx = tx; p.sy = ty; }
        let ax = live ? (tx - p.sx) * 0.07 : 0, ay = live ? (ty - p.sy) * 0.07 : 0;
        const dx = p.sx - pointer.x, dy = p.sy - pointer.y, d2 = dx * dx + dy * dy, R = touch ? 9000 : 12000;
        // Under a cursor or finger the points swell and move apart, like a lens; nowhere else does anything touch them.
        const lens = on && d2 < R ? 1 - d2 / R : 0;
        if (lens) { const d = Math.sqrt(d2) || 1, push = lens * 3.2; ax += (dx / d) * push; ay += (dy / d) * push; }
        for (const rp of ripples) {
          const age = t - rp.t, rad = age * 520, ddx = p.sx - rp.x, ddy = p.sy - rp.y, d = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
          const band = Math.exp(-((d - rad) ** 2) / 1800) * (1 - age / 1.6) * 5;
          ax += (ddx / d) * band; ay += (ddy / d) * band;
        }
        p.vx = (p.vx + ax) * 0.8; p.vy = (p.vy + ay) * 0.8; p.sx += p.vx; p.sy += p.vy;
        const twinkle = 0.62 + 0.38 * Math.sin(t * (2.2 + (p.tw % 1.8)) + p.tw);
        const lit = p.k === 0 ? Math.exp(-(((p.sx - scan) / band) ** 2)) : 0;
        const alpha = Math.min(1, p.a * twinkle * Math.min(1, f * 0.95) * (live ? 1 : 0.35) * (1 + lens * 0.8 + lit * 0.9));
        if (alpha < 0.02) continue;
        const s = (p.k === 0 ? (scene === "word" && w < 768 ? 1.05 : 1.25) : 1) * f * (p.tw > 5.9 ? 1.8 : 1) * (1 + lens * 1.8 + lit * 0.5);
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
    const onResize = () => { size(); wake(); };

    // The word is drawn from the page's own serif, so it waits for the font.
    const ready = scene === "word" ? document.fonts.load(`800 100px ${getComputedStyle(document.body).getPropertyValue("--font-serif") || "serif"}`).catch(() => undefined) : Promise.resolve();
    let alive = true;
    void ready.then(() => { if (!alive) return; build(); io.observe(c); });
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("touchmove", onTouch, { passive: true });
    addEventListener("touchend", onLeave, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    addEventListener("pointerdown", onDown, { passive: true });
    addEventListener("resize", onResize);
    addEventListener("scroll", wake, { passive: true });
    return () => {
      alive = false; cancelAnimationFrame(raf); io.disconnect();
      removeEventListener("pointermove", onMove); removeEventListener("touchmove", onTouch); removeEventListener("touchend", onLeave);
      document.documentElement.removeEventListener("pointerleave", onLeave); removeEventListener("pointerdown", onDown);
      removeEventListener("resize", onResize); removeEventListener("scroll", wake);
    };
  }, [scene]);
  return <canvas ref={ref} aria-hidden className={`block h-full w-full ${className}`} />;
}
