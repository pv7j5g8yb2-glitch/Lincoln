"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

// Lincoln's public front page. Warm white, serif type and Ismael's own photographs, with the work laid on top of
// them. Motion stays quiet: photographs drift against the scroll, one sentence turns to ink word by word, each
// piece of work settles into place, and the case papers spread across a desk fold into a filing packet in 3D.
// American English. Every name and number on the page is made up.

/** Progress of an element through the viewport: 0 when its top meets the bottom of the screen, 1 when its
 *  bottom leaves the top. */
function useProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = 0;
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect(), h = window.innerHeight;
      setP(Math.min(1, Math.max(0, (h - r.top) / (r.height + h))));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return [ref, p] as const;
}

/** Progress through a tall section whose content is pinned: 0 when it reaches the top, 1 when it lets go. */
function usePinned<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = 0;
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect();
      setP(Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight))));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return [ref, p] as const;
}

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);

/** A sentence in grey that turns to ink word by word as it is scrolled past. */
function Reveal({ text, className = "" }: { text: string; className?: string }) {
  // Always grey when the page opens, whatever the screen height: the words light up only with scrolling, from
  // where the sentence first sits (or 88 percent of the way down the screen, if that is higher).
  const ref = useRef<HTMLParagraphElement>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0, start = 0;
    const base = () => { const el = ref.current; if (!el) return; const h = window.innerHeight; start = window.scrollY > 0 ? h * 0.88 : Math.min(h * 0.88, el.getBoundingClientRect().top); };
    const tick = () => {
      raf = 0;
      const el = ref.current; if (!el) return;
      setP(clamp((start - el.getBoundingClientRect().top) / (window.innerHeight * 0.45)));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const resize = () => { base(); on(); };
    base(); tick();
    window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", resize);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", resize); cancelAnimationFrame(raf); };
  }, []);
  const words = text.split(" ");
  const lit = Math.round(ease(p) * words.length);
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <span key={i} className="transition-colors duration-500" style={{ color: i < lit ? "#161614" : "rgba(22,22,20,0.16)" }}>{w}{" "}</span>
      ))}
    </p>
  );
}

/** Fades children into place once they come into view, and tells them when they have. */
function In({ children, delay = 0, className = "" }: { children: ReactNode | ((on: boolean) => ReactNode); delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(ref.current!); return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-[1100ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${on ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {typeof children === "function" ? children(on) : children}
    </div>
  );
}

/* The work, laid on the photographs. */
const card = "relative w-[86%] rounded-2xl bg-white font-sans shadow-[0_1px_2px_rgba(0,0,0,0.04),0_40px_80px_-24px_rgba(0,0,0,0.5)] md:w-[80%]";
const eyebrow = "font-sans text-[12.5px] font-medium uppercase tracking-[0.16em] text-[#8a867f] md:text-[13px]";
const label = "text-[12px] font-medium uppercase tracking-[0.12em] text-[#a09d96]";
const rise = (on: boolean, d: number) => ({ className: `transition-all duration-700 ease-out motion-reduce:transition-none ${on ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`, style: { transitionDelay: `${d}ms` } });

function MailCard({ on }: { on: boolean }) {
  return (
    <div className={`${card} p-5 md:p-6`}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f3f0] text-[13px] font-semibold">DR</div>
        <div className="min-w-0"><p className="text-[14.5px] font-semibold">Daniel Reyes</p><p className="truncate text-[13px] text-[#6b6862]">Green card for my wife</p></div>
        <span className="ml-auto text-[12.5px] text-[#a09d96]">8:02 AM</span>
      </div>
      <p className="mt-4 text-[14.5px] leading-relaxed text-[#6b6862]">Hi, my wife Sofia and I want to apply for her green card. Her documents are attached.</p>
      <div {...rise(on, 900)}>
        <div className="mt-5 flex items-center justify-between rounded-xl bg-[#f4f3f0] px-4 py-3 text-[13.5px]"><span className="font-medium">Case opened</span><span className="text-[#6b6862]">Sofia Reyes · I-485</span></div>
      </div>
    </div>
  );
}

function ReadCard({ on }: { on: boolean }) {
  const rows = [["Marriage date", "March 9 or March 19, 2024?", "pp. 1, 2"], ["Sponsor income", "Below the 2026 minimum", "p. 3"], ["Last entry", "B-2, June 14, 2022", "p. 1"]];
  return (
    <div className={`${card} p-5 md:p-6`}>
      <p className={label}>Sofia Reyes · For review</p>
      <div className="mt-3 flex flex-col divide-y divide-[#ebe9e4]">
        {rows.map(([a, b, c], i) => (
          <div key={a} {...rise(on, 600 + i * 220)}>
            <div className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0"><p className="text-[12.5px] text-[#a09d96]">{a}</p><p className="truncate text-[14.5px] font-medium">{b}</p></div>
              <span className="shrink-0 text-[12.5px] text-[#a09d96]">{c}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LetterCard({ on }: { on: boolean }) {
  const cite = (t: string, d: number) => <span className={`rounded px-0.5 transition-colors duration-700 ${on ? "bg-[#efe6d6] text-[#7a5f35]" : "text-[#a09d96]"}`} style={{ transitionDelay: `${d}ms` }}>{t}</span>;
  return (
    <div className={`${card} p-6 md:p-7`}>
      <p className={label}>Support letter · Draft</p>
      <p className="mt-4 font-serif text-[15.5px] leading-[1.75] md:text-[16px]">
        Dr. Okoro&apos;s sensors detect lead in municipal water at a fraction of the current cost {cite("(Exhibit 4)", 900)}. Two Massachusetts towns are now piloting the system {cite("(Exhibit 7)", 1200)}.
      </p>
    </div>
  );
}

function ApproveCard({ on }: { on: boolean }) {
  return (
    <div className={`${card} p-5 md:p-6`}>
      <p className={label}>Awaiting approval</p>
      <p className="mt-3 text-[19px] font-semibold tracking-[-0.01em]">Filing packet · Sofia Reyes</p>
      <p className="mt-1 text-[14px] text-[#6b6862]">Cover letter, 5 forms, 14 exhibits</p>
      <div {...rise(on, 800)}>
        <div className="mt-5 flex gap-2.5">
          <span className="rounded-[10px] bg-[#161614] px-5 py-2.5 text-[14px] font-medium text-white">Approve</span>
          <span className="rounded-[10px] px-5 py-2.5 text-[14px] font-medium ring-1 ring-[#d3cfc8]">Review</span>
        </div>
      </div>
    </div>
  );
}

const STEPS: { title: string; line: string; photo?: string; pos?: string; dim?: number; Card: (p: { on: boolean }) => ReactNode }[] = [
  { title: "Reads your mail.", line: "A client writes in. The case is open before anyone sees the email.", photo: "/landing/concrete.jpg", Card: MailCard },
  { title: "Reads your files.", line: "Conflicts, gaps and bars, each with the page it came from.", photo: "/landing/marble.jpg", Card: ReadCard },
  { title: "Drafts your letters.", line: "Support letters and RFE responses, cited to the evidence.", photo: "/landing/letters.jpg", dim: 0.55, Card: LetterCard },
  { title: "Asks for approval.", line: "Nothing is filed or sent without an attorney's approval.", photo: "/landing/court.jpg", pos: "30% 50%", Card: ApproveCard },
];

/** The film plays when it comes into view and pauses when it leaves. No sound, no controls. */
/** The film plays from the moment the page opens, silent and looping, and keeps playing. Only a click or tap on it
 *  pauses it, and the next one plays it again. The tag is written straight into the page so phones see muted,
 *  autoplay and playsinline before any script runs (iPhones only autoplay a video marked muted in the page itself);
 *  if a phone still holds it back (Low Power Mode, some in app browsers), the first touch anywhere starts it. */
const FILM = `<video autoplay muted loop playsinline webkit-playsinline preload="auto" poster="/landing/lincoln-film.jpg?v=4" disablepictureinpicture disableremoteplayback aria-label="Lincoln, from a client's email to the approved reply" class="block aspect-video w-full cursor-pointer bg-[#151513] object-cover"><source src="/landing/lincoln-film.mp4?v=4" type="video/mp4"><source src="/landing/lincoln-film.webm?v=4" type="video/webm"></video>`;
function Film() {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const v = box.current?.querySelector("video");
    if (!v) return;
    let held = false;
    const go = () => { if (!held && v.paused) { v.muted = true; void v.play().catch(() => undefined); } };
    const toggle = () => { if (v.paused) { held = false; v.muted = true; void v.play().catch(() => undefined); } else { held = true; v.pause(); } };
    const touch = (e: Event) => { if (e.target !== v) go(); };
    const gestures = ["touchend", "click", "keydown", "scroll"] as const;
    v.addEventListener("click", toggle);
    v.addEventListener("canplay", go);
    document.addEventListener("visibilitychange", go);
    window.addEventListener("pageshow", go);
    gestures.forEach((g) => window.addEventListener(g, touch, { passive: true, capture: true }));
    const watch = window.setInterval(go, 1500);
    go();
    return () => {
      v.removeEventListener("click", toggle); v.removeEventListener("canplay", go);
      document.removeEventListener("visibilitychange", go); window.removeEventListener("pageshow", go);
      gestures.forEach((g) => window.removeEventListener(g, touch, { capture: true }));
      window.clearInterval(watch);
    };
  }, []);
  return <div ref={box} className="hero-photo overflow-hidden rounded-[20px] bg-[#151513] shadow-[0_40px_100px_-40px_rgba(22,22,20,0.55)]" dangerouslySetInnerHTML={{ __html: FILM }} />;
}

/** The four steps as one scene: the page holds still while the scroll moves through them. On the left the steps
 *  light up one by one; on the right one frame crossfades between the photographs and the work changes on it. */
function Steps() {
  const [ref, p] = usePinned<HTMLDivElement>();
  const marks = useRef<(HTMLDivElement | null)[]>([]);
  const [at, setAt] = useState(0);
  const atRef = useRef(0);
  useEffect(() => {
    // The step comes from where the page is against fixed marks in the section, never from the window's height, so
    // a phone's address bar showing or hiding cannot change it. Inside the section, and only there, one swipe or one
    // scroll moves exactly one step: the page glides to it and the rest of that gesture (a phone's glide included)
    // is ignored. Swiping past the first or last step lets the page go, and before and after the section the page
    // scrolls freely.
    const root = document.documentElement;
    const smooth: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    let raf = 0, inside = false, lockedUntil = 0, wheel = 0, touchY: number | null = null;
    const geometry = () => {
      const wrap = ref.current, m = marks.current;
      if (!wrap || m.some((x) => !x)) return null;
      const top = wrap.getBoundingClientRect().top + window.scrollY;
      const tops = m.map((x) => x!.offsetTop);
      return { top, tops, step: tops[1] - tops[0], off: window.scrollY - top };
    };
    const glide = (y: number) => {
      lockedUntil = Date.now() + 850;
      // Stops a phone's glide in its tracks before moving, so it cannot carry on past the step.
      root.style.overflow = "hidden";
      requestAnimationFrame(() => { root.style.overflow = ""; window.scrollTo({ top: y, behavior: smooth }); });
    };
    const move = (dir: number) => {
      const g = geometry(); if (!g) return;
      const last = g.tops.length - 1, next = atRef.current + dir;
      if (next < 0) glide(g.top + g.tops[0] - g.step * 0.7);
      else if (next > last) glide(g.top + g.tops[last] + g.step * 0.7);
      else glide(g.top + g.tops[next]);
    };
    const tick = () => {
      raf = 0;
      const g = geometry(); if (!g) return;
      const last = g.tops.length - 1;
      const now = g.off > g.tops[0] - g.step * 0.5 && g.off < g.tops[last] + g.step * 0.5;
      let i = 0;
      while (i < last && g.off >= g.tops[i] + g.step * 0.5) i++;
      atRef.current = i; setAt(i);
      // Coming into the section, from above or below, the page settles on the first or last step.
      if (now && !inside && Date.now() > lockedUntil) glide(g.top + g.tops[g.off < (g.tops[0] + g.tops[last]) / 2 ? 0 : last]);
      inside = now;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const onWheel = (e: WheelEvent) => {
      if (!inside) return;
      e.preventDefault();
      if (Date.now() < lockedUntil) { wheel = 0; return; }
      wheel += e.deltaY;
      if (Math.abs(wheel) >= 30) { const dir = Math.sign(wheel); wheel = 0; move(dir); }
    };
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0]?.clientY ?? null; };
    const onTouchMove = (e: TouchEvent) => { if (inside) e.preventDefault(); };
    const onTouchEnd = (e: TouchEvent) => {
      if (!inside || touchY === null) return;
      const dy = touchY - (e.changedTouches[0]?.clientY ?? touchY);
      touchY = null;
      if (Math.abs(dy) < 24 || Date.now() < lockedUntil) return;
      move(Math.sign(dy));
    };
    const onKey = (e: KeyboardEvent) => {
      if (!inside || e.altKey || e.ctrlKey || e.metaKey) return;
      const dir = ["ArrowDown", "PageDown", " "].includes(e.key) ? 1 : ["ArrowUp", "PageUp"].includes(e.key) ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      if (Date.now() >= lockedUntil) move(e.shiftKey && e.key === " " ? -1 : dir);
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf); root.style.overflow = "";
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll);
      window.removeEventListener("wheel", onWheel); window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove); window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [ref]);
  return (
    // The marks are where each step sits fully in view; each swipe moves from one to the next.
    <div ref={ref} className="relative [--step:36vh] md:[--step:32vh]" style={{ height: `calc(100vh + ${STEPS.length} * var(--step))` }}>
      {STEPS.map((s, i) => <div key={s.title} ref={(el) => { marks.current[i] = el; }} aria-hidden className="step-mark pointer-events-none absolute left-0 h-px w-px" style={{ top: `calc(${i + 0.5} * var(--step))` }} />)}
      <div className="sticky top-16 flex h-[calc(100dvh-4rem)] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1200px] gap-5 px-4 md:grid-cols-[minmax(0,1fr)_minmax(0,560px)] md:items-center md:gap-20 md:px-8">
          {/* Phones: only the step in view, above the frame. */}
          <div className="md:hidden">
            <div className="flex items-center gap-3">
              <p className={eyebrow}>0{at + 1} / 0{STEPS.length}</p>
              <div className="h-px flex-1 bg-[#ebe9e4]"><div className="h-px bg-[#161614] transition-[width] duration-500" style={{ width: `${((at + 1) / STEPS.length) * 100}%` }} /></div>
            </div>
            <div className="relative mt-3 h-[112px]">
              {STEPS.map((s, i) => (
                <div key={s.title} className="absolute inset-0 transition-all duration-500 ease-out" style={{ opacity: i === at ? 1 : 0, transform: `translateY(${i === at ? 0 : i < at ? -14 : 14}px)` }}>
                  <h3 className="font-serif text-[30px] font-semibold leading-[1.1] tracking-[-0.025em]">{s.title}</h3>
                  <p className="mt-2 text-[16.5px] leading-[1.55] text-[#6b6862]">{s.line}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Laptops: every step listed, the one in view in ink, a thin line filling beside them. */}
          <div className="relative hidden pl-7 md:block">
            <div className="absolute bottom-2 left-0 top-2 w-px bg-[#ebe9e4]"><div className="w-px bg-[#161614] transition-[height] duration-500" style={{ height: `${((at + 1) / STEPS.length) * 100}%` }} /></div>
            {STEPS.map((s, i) => (
              <div key={s.title} className={`transition-all duration-500 ${i ? "mt-9" : ""}`} style={{ opacity: i === at ? 1 : 0.28 }}>
                <p className={eyebrow}>0{i + 1}</p>
                <h3 className="mt-2 font-serif text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] lg:text-[46px]">{s.title}</h3>
                <div className="grid transition-all duration-500" style={{ gridTemplateRows: i === at ? "1fr" : "0fr" }}>
                  <p className="overflow-hidden text-[18px] leading-[1.6] text-[#6b6862]"><span className="block max-w-[32ch] pt-3">{s.line}</span></p>
                </div>
              </div>
            ))}
          </div>
          {/* The frame: photographs crossfade, the work on them changes with the step. */}
          <div className="relative h-[min(56vh,520px)] overflow-hidden rounded-[20px] bg-[#e4e1db] md:h-[min(74vh,640px)]">
            {STEPS.map((s, i) => s.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={s.photo} src={s.photo} alt="" className="absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[900ms] ease-out" style={{ objectPosition: s.pos ?? "50% 50%", filter: s.dim ? `brightness(${s.dim})` : undefined, opacity: i === at ? 1 : 0, transform: `scale(${i === at ? 1.02 + p * 0.04 : 1.1})` }} />
            ))}
            {STEPS.map((s, i) => (
              <div key={s.title} className="absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out" style={{ opacity: i === at ? 1 : 0, transform: `translateY(${i === at ? 0 : i < at ? -28 : 28}px) scale(${i === at ? 1 : 0.97})`, pointerEvents: i === at ? "auto" : "none" }}>
                <s.Card on={i === at} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const TRUST = [
  ["Encrypted", "The database and every file, at rest."],
  ["Never used for training", "Client files are not used to train AI models."],
  ["Two-step sign in", "Can be required for the whole firm."],
  ["Yours to take", "Export or delete everything, at any time."],
];

function Close() {
  const [ref, p] = useProgress<HTMLDivElement>();
  return (
    <div ref={ref} className="relative h-[560px] overflow-hidden rounded-[24px] bg-[#222] md:h-[760px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/landing/board.jpg" alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover motion-reduce:!transform-none" style={{ objectPosition: "50% 45%", filter: "brightness(0.6)", transform: `scale(${1.14 - 0.14 * ease(p * 1.7)})` }} />
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
        <In><h2 className="font-serif text-[48px] font-semibold leading-[1] tracking-[-0.035em] md:text-[88px]">Start your<br />first case.</h2></In>
        <In delay={150}><Link href="/start" className="mt-7 inline-block rounded-[10px] bg-white px-6 py-3.5 font-sans text-[15.5px] font-medium text-[#161614] transition hover:bg-white/85 md:mt-8">Get In Touch</Link></In>
      </div>
    </div>
  );
}

function Footer() {
  const icon = "flex h-10 w-10 items-center justify-center rounded-[10px] ring-1 ring-[#e2dfd8] text-[#161614] transition hover:bg-[#f0eee9]";
  return (
    <footer className="mt-20 border-t border-[#ebe9e4] md:mt-28">
      <div className="mx-auto max-w-[1200px] px-4 pb-10 pt-14 md:px-8 md:pb-12 md:pt-20">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-serif text-[44px] font-semibold leading-none tracking-[-0.035em] md:text-[72px]">Lincoln</p>
            <p className={`mt-4 ${eyebrow}`}>For immigration law firms</p>
          </div>
          <div className="flex gap-3">
            <a href="https://instagram.com/lincoln.app" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={icon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
            </a>
            <a href="mailto:hello@uselincoln.com" aria-label="Email" className={icon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></svg>
            </a>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-[#ebe9e4] pt-6 text-[13px] text-[#8a867f] md:mt-16 md:flex-row md:items-center md:justify-between">
          <span>© 2026 Lincoln. All rights reserved.</span>
          <div className="flex gap-5 text-[12.5px]">
            <Link href="/terms" className="transition hover:text-[#161614]">Terms</Link>
            <Link href="/privacy" className="transition hover:text-[#161614]">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener("scroll", on, { passive: true }); return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className="min-h-dvh overflow-x-clip bg-[#faf9f6] font-serif text-[#161614] antialiased selection:bg-[#efe6d6]">
      <header className={`sticky top-0 z-50 bg-[#faf9f6]/85 backdrop-blur-md transition-[border-color] duration-300 ${scrolled ? "border-b border-[#ebe9e4]" : "border-b border-transparent"}`}>
        <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-8">
          <Link href="/" className="font-serif text-[26px] font-semibold tracking-[-0.02em] md:text-[28px]">Lincoln</Link>
          <div className="flex items-center gap-1">
            <Link href="/start" className="rounded-[9px] bg-[#161614] px-4 py-2 font-sans text-[14.5px] font-medium text-white transition hover:opacity-85">Get In Touch</Link>
          </div>
        </nav>
      </header>

      {/* Hero: the words, and the film rising into its frame beneath them. */}
      <section className="mx-auto max-w-[1200px] px-4 pb-20 pt-11 md:px-8 md:pb-28 md:pt-16">
        <div className="mx-auto max-w-[880px] text-center">
          <p className={`hero-in ${eyebrow}`}>For immigration law firms</p>
          <h1 className="hero-in hero-title mx-auto mt-4 font-serif font-semibold leading-[1.04] tracking-[-0.035em] [animation-delay:120ms]">Your work done before you even ask.</h1>
          <p className="hero-in hero-line mx-auto mt-6 max-w-[34em] leading-[1.6] text-[#6b6862] [animation-delay:240ms]">
            Lincoln works autonomously for you, no need for prompts. Once it&apos;s done you review and approve.
          </p>
          <div className="hero-in mt-9 flex items-center justify-center gap-2 [animation-delay:360ms]">
            <Link href="/start" className="rounded-[10px] bg-[#161614] px-6 py-3.5 font-sans text-[15.5px] font-medium text-white transition hover:opacity-85">Get In Touch</Link>
            <a href="#work" className="rounded-[10px] px-5 py-3.5 font-sans text-[15.5px] font-medium transition hover:bg-[#f0eee9]">How it works</a>
          </div>
        </div>
        <div className="mt-12 md:mt-16"><Film /></div>
      </section>

      {/* The statement, lit word by word. */}
      <section className="border-t border-[#ebe9e4]">
        <div className="mx-auto max-w-[1200px] px-4 py-24 md:px-8 md:py-44">
          <Reveal className="max-w-[20ch] font-serif text-[36px] font-semibold leading-[1.12] tracking-[-0.025em] md:text-[68px]" text="Most of an immigration practice is paperwork. Lincoln does the paperwork. You practice law." />
        </div>
      </section>

      {/* The work: one pinned scene that moves through the four steps as the page scrolls. */}
      <section id="work" className="border-t border-[#ebe9e4]"><Steps /></section>

      {/* Client files. */}
      <section className="border-t border-[#ebe9e4]">
        <div className="mx-auto grid max-w-[1200px] gap-7 px-4 py-24 md:grid-cols-2 md:items-center md:gap-20 md:px-8 md:py-36">
          <In><h2 className="font-serif text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[56px]">Built for privacy.</h2></In>
          <div className="flex flex-col">
            {TRUST.map(([a, b], i) => (
              <In key={a} delay={i * 90}>
                <div className={`py-5 ${i ? "border-t border-[#ebe9e4]" : "pt-1"}`}><p className="text-[19px] font-semibold tracking-[-0.01em]">{a}</p><p className="mt-1 text-[16.5px] text-[#6b6862]">{b}</p></div>
              </In>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 md:px-8">
        <Close />
      </section>
      <Footer />
    </div>
  );
}
