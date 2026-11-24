"use client";

import { useEffect, useRef } from "react";

// One slow band of warm light across the dark, with film grain: amber at its heart, burnt orange, oxblood, then a
// thin edge of ink blue where it meets the black. Drawn on the graphics card, so it costs almost nothing; it rests when
// it is off screen or the tab is hidden, and holds still for anyone who asks for less motion. Without WebGL the same
// colours are laid as a still gradient.

const VERT = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 r;
uniform float t;
uniform float shape;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 uv = gl_FragCoord.xy / r;
  float aspect = r.x / r.y;
  vec2 q = vec2(uv.x * aspect, uv.y);

  // The band: a long curve that breathes. shape 0 sweeps up from the lower left, shape 1 lies low across the page.
  float x = q.x / aspect;
  float base = mix(0.08 + x * 0.95, 0.22 + x * 0.18, shape);
  float curve = base + 0.10 * sin(x * 2.6 + t * 0.21) + 0.05 * sin(x * 5.3 - t * 0.17) + 0.03 * sin(x * 9.1 + t * 0.29);
  float d = (uv.y - curve);
  float w = mix(0.11, 0.09, shape) + 0.025 * sin(x * 3.1 - t * 0.13);
  float s = d / w;

  float heart = exp(-s * s * 3.2);
  float body = exp(-s * s * 0.9);
  float halo = exp(-s * s * 0.22);
  float fringe = exp(-(s + 1.7) * (s + 1.7) * 0.9) + exp(-(s - 1.9) * (s - 1.9) * 1.1);

  vec3 ink = vec3(0.055, 0.055, 0.051);
  vec3 col = ink;
  col = mix(col, vec3(0.16, 0.21, 0.31), clamp(fringe * 0.55, 0.0, 1.0));
  col = mix(col, vec3(0.36, 0.11, 0.08), clamp(halo * 0.75, 0.0, 1.0));
  col = mix(col, vec3(0.80, 0.36, 0.14), clamp(body * 0.85, 0.0, 1.0));
  col = mix(col, vec3(0.96, 0.76, 0.50), clamp(heart * 0.80, 0.0, 1.0));

  // Quieter toward the edges, so type always sits on calm ground.
  float v = smoothstep(1.25, 0.25, length((uv - vec2(0.62, 0.55)) * vec2(1.0, 1.25)));
  col = mix(ink, col, 0.35 + 0.65 * v);

  // Film grain.
  float g = hash(gl_FragCoord.xy + fract(t * 0.5) * 91.7) - 0.5;
  col += g * 0.075;
  gl_FragColor = vec4(col, 1.0);
}`;

export default function LightField({ shape = 0, className = "" }: { shape?: 0 | 1; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const gl = c.getContext("webgl", { antialias: false, premultipliedAlpha: false, powerPreference: "low-power" });
    if (!gl) { c.dataset.fallback = "1"; return; }
    const compile = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { c.dataset.fallback = "1"; return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, "r"), uT = gl.getUniformLocation(prog, "t"), uS = gl.getUniformLocation(prog, "shape");
    gl.uniform1f(uS, shape);

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, visible = true, start = performance.now() - 40_000;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(c.clientWidth * dpr)), h = Math.max(1, Math.round(c.clientHeight * dpr));
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; gl.viewport(0, 0, w, h); }
      gl.uniform2f(uR, w, h);
    };
    const draw = (now: number) => {
      raf = 0;
      size();
      gl.uniform1f(uT, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!still && visible && !document.hidden) raf = requestAnimationFrame(draw);
    };
    const wake = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(draw); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake(); });
    io.observe(c);
    const onResize = () => { if (still) requestAnimationFrame(draw); else wake(); };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", wake);
    raf = requestAnimationFrame(draw);
    if (still) start = performance.now() - 40_000;
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", onResize); document.removeEventListener("visibilitychange", wake); };
  }, [shape]);

  return (
    <canvas
      ref={canvas}
      aria-hidden
      className={`light-field block h-full w-full ${className}`}
      data-shape={shape}
    />
  );
}
