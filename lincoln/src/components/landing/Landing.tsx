"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import LightField from "./LightField";

// Lincoln's public front page. Dark ground, serif type and one band of warm, grainy light (the hero and the close).
// Motion stays quiet: the light drifts, one sentence turns to ink word by word, the work opens one piece at a time,
// the case types drift past and the tools are wired into Lincoln. No stock photographs.
// American English. Every name and number on the page is made up.

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
        <span key={i} className="transition-colors duration-500" style={{ color: i < lit ? "#f4f3ef" : "rgba(244,243,239,0.16)" }}>{w}{" "}</span>
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
const card = "relative w-[86%] rounded-2xl bg-[#171716] ring-1 ring-[#262523] font-sans shadow-[0_1px_2px_rgba(0,0,0,0.04),0_40px_80px_-24px_rgba(0,0,0,0.5)] md:w-[80%]";
const eyebrow = "font-sans text-[12.5px] font-medium uppercase tracking-[0.16em] text-[#8d8982] md:text-[13px]";
const label = "text-[12px] font-medium uppercase tracking-[0.12em] text-[#74716b]";
const rise = (on: boolean, d: number) => ({ className: `transition-all duration-700 ease-out motion-reduce:transition-none ${on ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`, style: { transitionDelay: `${d}ms` } });

function MailCard({ on }: { on: boolean }) {
  return (
    <div className={`${card} p-5 md:p-6`}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1d1d1b] text-[13px] font-semibold">DR</div>
        <div className="min-w-0"><p className="text-[14.5px] font-semibold">Daniel Reyes</p><p className="truncate text-[13px] text-[#a6a39c]">Green card for my wife</p></div>
        <span className="ml-auto text-[12.5px] text-[#74716b]">8:02 AM</span>
      </div>
      <p className="mt-4 text-[14.5px] leading-relaxed text-[#a6a39c]">Hi, my wife Sofia and I want to apply for her green card. Her documents are attached.</p>
      <div {...rise(on, 900)}>
        <div className="mt-5 flex items-center justify-between rounded-xl bg-[#1d1d1b] px-4 py-3 text-[13.5px]"><span className="font-medium">Case opened</span><span className="text-[#a6a39c]">Sofia Reyes · I-485</span></div>
      </div>
    </div>
  );
}

function ReadCard({ on }: { on: boolean }) {
  const rows = [["Marriage date", "March 9 or March 19, 2024?", "pp. 1, 2"], ["Sponsor income", "Below the 2026 minimum", "p. 3"], ["Last entry", "B-2, June 14, 2022", "p. 1"]];
  return (
    <div className={`${card} p-5 md:p-6`}>
      <p className={label}>Sofia Reyes · For review</p>
      <div className="mt-3 flex flex-col divide-y divide-[#262523]">
        {rows.map(([a, b, c], i) => (
          <div key={a} {...rise(on, 600 + i * 220)}>
            <div className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0"><p className="text-[12.5px] text-[#74716b]">{a}</p><p className="truncate text-[14.5px] font-medium">{b}</p></div>
              <span className="shrink-0 text-[12.5px] text-[#74716b]">{c}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LetterCard({ on }: { on: boolean }) {
  const cite = (t: string, d: number) => <span className={`rounded px-0.5 transition-colors duration-700 ${on ? "bg-[#3a3122] text-[#dcbd82]" : "text-[#74716b]"}`} style={{ transitionDelay: `${d}ms` }}>{t}</span>;
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
      <p className="mt-1 text-[14px] text-[#a6a39c]">Cover letter, 5 forms, 14 exhibits</p>
      <div {...rise(on, 800)}>
        <div className="mt-5 flex gap-2.5">
          <span className="rounded-[10px] bg-[#f4f3ef] px-5 py-2.5 text-[14px] font-medium text-[#0e0e0d]">Approve</span>
          <span className="rounded-[10px] px-5 py-2.5 text-[14px] font-medium ring-1 ring-[#3b3a36]">Review</span>
        </div>
      </div>
    </div>
  );
}

function FormCard({ on }: { on: boolean }) {
  const rows = [["Part 1, 1.a", "Family name", "REYES"], ["Part 1, 1.b", "Given name", "SOFIA"], ["Part 1, 3", "A-Number", "None"], ["Part 1, 19", "Date of last arrival", "06/14/2022"]];
  return (
    <div className={`${card} p-5 md:p-6`}>
      <div className="flex items-baseline justify-between"><p className={label}>Form I-485 · Sofia Reyes</p><span className="text-[12px] text-[#74716b]">Edition 01/20/25</span></div>
      <div className="mt-3 flex flex-col divide-y divide-[#262523]">
        {rows.map(([n, f, v], i) => (
          <div key={n} className="flex items-center gap-3 py-2.5">
            <span className="w-[86px] shrink-0 text-[12px] text-[#74716b]">{n}</span>
            <span className="min-w-0 flex-1 truncate text-[13.5px] text-[#a6a39c]">{f}</span>
            <span {...rise(on, 500 + i * 200)}><span className="rounded-md bg-[#1d1d1b] px-2 py-1 font-mono text-[13px] tracking-[0.02em]">{v}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RfeCard({ on }: { on: boolean }) {
  const rows = [["Substantial merit and national importance", "Exhibits 4, 7, 9"], ["Well positioned to advance the endeavor", "Exhibits 2, 11"], ["On balance, beneficial to waive", "Brief, section III"]];
  return (
    <div className={`${card} p-5 md:p-6`}>
      <p className={label}>Request for Evidence · Dr. Okoro</p>
      <div className="mt-3 flex flex-col gap-2">
        {rows.map(([a, b], i) => (
          <div key={a} {...rise(on, 500 + i * 220)}>
            <div className="flex items-start gap-3 rounded-xl bg-[#1d1d1b] px-4 py-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3a3122] text-[11px] font-semibold text-[#dcbd82]">{i + 1}</span>
              <div className="min-w-0"><p className="text-[14px] font-medium leading-snug">{a}</p><p className="mt-0.5 text-[12.5px] text-[#8d8982]">{b}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChaseCard({ on }: { on: boolean }) {
  const rows: [string, boolean][] = [["Passport", true], ["Birth certificate", true], ["Marriage certificate", true], ["Tax returns, 2023 to 2025", false]];
  return (
    <div className={`${card} p-5 md:p-6`}>
      <div className="flex items-baseline justify-between"><p className={label}>Documents · Sofia Reyes</p><span className="text-[12.5px] text-[#a6a39c]">3 of 4</span></div>
      <div className="mt-3 flex flex-col divide-y divide-[#262523]">
        {rows.map(([a, done], i) => (
          <div key={a} {...rise(on, 400 + i * 180)}>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[14px]">{a}</span>
              {done
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dcbd82" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                : <span className="text-[12.5px] text-[#8d8982]">Reminder sent Tuesday</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeadlineCard({ on }: { on: boolean }) {
  const rows = [["Dec 14", "RFE response due", "Dr. Okoro · I-140"], ["Jan 6", "Biometrics appointment", "Sofia Reyes · I-485"], ["Feb 2", "I-94 expires", "Amir Haddad · H-1B"]];
  return (
    <div className={`${card} p-5 md:p-6`}>
      <p className={label}>Upcoming</p>
      <div className="mt-3 flex flex-col divide-y divide-[#262523]">
        {rows.map(([d, a, b], i) => (
          <div key={a} {...rise(on, 400 + i * 200)}>
            <div className="flex items-center gap-4 py-3">
              <span className="w-[54px] shrink-0 font-serif text-[18px] font-semibold tracking-[-0.01em]">{d}</span>
              <div className="min-w-0"><p className="truncate text-[14.5px] font-medium">{a}</p><p className="truncate text-[12.5px] text-[#8d8982]">{b}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WordCard({ on }: { on: boolean }) {
  return (
    <div className={`${card} p-6 md:p-7`}>
      <div className="flex items-center justify-between"><p className={label}>Expert letter.docx · Suggesting</p><span className="rounded bg-[#1d4ed8]/15 px-1.5 py-0.5 text-[11px] font-semibold text-[#8fb0ff]">W</span></div>
      <p className="mt-4 font-serif text-[15.5px] leading-[1.75] md:text-[16px]">
        In 2024 Dr. Okoro <span className={`transition-all duration-700 ${on ? "text-[#e0796f] line-through" : ""}`} style={{ transitionDelay: "700ms" }}>received an award at</span>{" "}
        <span className={`transition-all duration-700 ${on ? "text-[#8fb0ff] underline decoration-[#8fb0ff]/60 underline-offset-2" : "opacity-0"}`} style={{ transitionDelay: "1100ms" }}>won first place in</span> the HealthBridge Innovation Challenge.
      </p>
      <div {...rise(on, 1500)}><p className="mt-4 border-l-2 border-[#3b3a36] pl-3 text-[13px] leading-relaxed text-[#a6a39c]">Exhibit 12 shows first place, not an award of participation.</p></div>
    </div>
  );
}

const WORK: { title: string; line: string; Card: (p: { on: boolean }) => ReactNode }[] = [
  { title: "Opens cases from email", line: "A client writes in. The case is open before anyone sees the email.", Card: MailCard },
  { title: "Reads every page", line: "Conflicts, gaps and bars, each with the page it came from.", Card: ReadCard },
  { title: "Fills every form", line: "Current editions, every answer traced to the file.", Card: FormCard },
  { title: "Drafts the petition", line: "Support letters and briefs, cited to the evidence and the law.", Card: LetterCard },
  { title: "Answers RFEs", line: "Each point of the notice mapped to the evidence that meets it.", Card: RfeCard },
  { title: "Collects documents", line: "Clients upload through a secure link. Lincoln follows up.", Card: ChaseCard },
  { title: "Keeps every deadline", line: "On the firm's calendar the moment a notice arrives.", Card: DeadlineCard },
  { title: "Works in Word and Google Docs", line: "Tracked changes on the firm's own documents, with the reason.", Card: WordCard },
  { title: "Waits for approval", line: "Nothing is filed or sent without an attorney's approval.", Card: ApproveCard },
];

/** The warm, grainy ground the work sits on. */
const ground = "grain absolute inset-0 bg-[radial-gradient(120%_90%_at_85%_10%,#6b2a17_0%,#2a1410_38%,#121110_70%),radial-gradient(80%_60%_at_10%_100%,#1f2a3d_0%,transparent_60%)] bg-blend-screen";

function WorkPanel({ i, seen, className = "" }: { i: number; seen: boolean; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[20px] bg-[#121110] ${className}`}>
      <div className={ground} />
      {WORK.map((w, k) => (
        <div key={w.title} className="absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out" style={{ opacity: k === i ? 1 : 0, transform: `translateY(${k === i ? 0 : k < i ? -24 : 24}px) scale(${k === i ? 1 : 0.97})`, pointerEvents: k === i ? "auto" : "none" }}>
          <w.Card on={k === i && seen} />
        </div>
      ))}
    </div>
  );
}

/** Everything Lincoln does, one item open at a time: the list on the left, that piece of the work on the right. It
 *  moves on by itself while in view, and stops once someone chooses. */
function Work() {
  const [at, setAt] = useState(0);
  const [auto, setAuto] = useState(true);
  const [seen, setSeen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 });
    io.observe(box.current!); return () => io.disconnect();
  }, []);
  useEffect(() => {
    // Only on wider screens: on a phone the open item sits in the page, so moving on by itself would shift it.
    if (!auto || !seen || window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 767px)").matches) return;
    const id = window.setTimeout(() => setAt((i) => (i + 1) % WORK.length), 5200);
    return () => window.clearTimeout(id);
  }, [at, auto, seen]);
  const pick = (i: number) => { setAuto(false); setAt(i); };
  return (
    <div ref={box} className="mt-12 grid gap-10 md:mt-16 md:grid-cols-[minmax(0,1fr)_minmax(0,600px)] md:gap-16">
      <div className="flex flex-col">
        {WORK.map((w, i) => (
          <div key={w.title} className="border-t border-[#262523] last:border-b">
            <button type="button" onClick={() => pick(i)} aria-expanded={i === at} className="group flex w-full items-baseline gap-4 py-4 text-left md:py-5">
              <span className="w-6 shrink-0 font-sans text-[12.5px] tabular-nums text-[#74716b]">{String(i + 1).padStart(2, "0")}</span>
              <span className={`font-serif text-[22px] font-semibold leading-tight tracking-[-0.02em] transition-colors duration-300 md:text-[26px] ${i === at ? "text-[#f4f3ef]" : "text-[#f4f3ef]/35 group-hover:text-[#f4f3ef]/70"}`}>{w.title}</span>
            </button>
            <div className="grid transition-[grid-template-rows] duration-500 ease-out" style={{ gridTemplateRows: i === at ? "1fr" : "0fr" }}>
              <div className="overflow-hidden">
                <p className="max-w-[40ch] pb-4 pl-10 font-sans text-[16.5px] leading-[1.55] text-[#a6a39c] md:pb-6">{w.line}</p>
                {i === at && auto && seen && <div className="mb-5 ml-10 hidden h-px bg-[#262523] md:block"><div key={at} className="work-progress h-px bg-[#f4f3ef]/70" /></div>}
                <WorkPanel i={i} seen={seen} className="mb-6 h-[400px] md:hidden" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block">
        <div className="sticky top-24"><WorkPanel i={at} seen={seen} className="h-[min(72vh,600px)]" /></div>
      </div>
    </div>
  );
}

const TYPES = [
  ["H-1B", "O-1A", "O-1B", "EB-1A", "EB-1B", "EB-1C", "EB-2 NIW", "PERM", "L-1A", "L-1B", "TN", "E-2", "E-3", "R-1", "H-2B"],
  ["I-130", "I-485", "K-1", "I-751", "N-400", "DACA", "TPS", "Asylum", "U visa", "T visa", "VAWA", "Waivers", "Removal defense", "Consular processing", "SIJ"],
];

/** Every case type, drifting past in two rows. */
function Types() {
  return (
    <div className="flex flex-col gap-3 md:gap-5" aria-label={TYPES.flat().join(", ")}>
      {TYPES.map((row, r) => (
        <div key={r} className="marquee flex w-max" style={{ animationDirection: r ? "reverse" : "normal" }} aria-hidden>
          {[...row, ...row].map((t, i) => (
            <span key={i} className="flex items-center whitespace-nowrap font-serif text-[40px] font-semibold tracking-[-0.03em] text-[#f4f3ef]/90 md:text-[72px]">
              {t}<span className="mx-6 text-[#f4f3ef]/20 md:mx-10">·</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

const TOOLS: [string[], string[]] = [["Gmail", "Outlook", "Google Drive", "OneDrive", "SharePoint"], ["Microsoft Word", "Google Docs", "Google Calendar", "Microsoft Teams", "Google Chat"]];

/** Lincoln in the middle, wired to the tools a firm already works in. */
function Tools() {
  const chip = "rounded-[8px] bg-[#151514] px-3.5 py-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[#d6d3cc] ring-1 ring-[#2b2a27]";
  return (
    <div className="relative mt-14 md:mt-20">
      {/* Laptops: two columns of tools with lines running into Lincoln. */}
      <div className="relative mx-auto hidden h-[420px] max-w-[980px] md:block">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 980 420" preserveAspectRatio="none" aria-hidden>
          {TOOLS.map((col, side) => col.map((_, i) => {
            const y = 42 + i * 84, x0 = side ? 770 : 210, x1 = side ? 570 : 410;
            return <path key={`${side}${i}`} d={`M${x0} ${y} C ${(x0 + x1) / 2} ${y}, ${(x0 + x1) / 2} 210, ${x1} 210`} fill="none" stroke="#57534b" strokeWidth="1" className="wire" style={{ animationDelay: `${(side * 5 + i) * -0.6}s` }} />;
          }))}
        </svg>
        {TOOLS.map((col, side) => (
          <div key={side} className={`absolute top-0 flex h-full flex-col justify-between py-[22px] ${side ? "right-0 items-start" : "left-0 items-end"}`} style={{ width: 210 }}>
            {col.map((t) => <span key={t} className={chip}>{t}</span>)}
          </div>
        ))}
        <div className="absolute left-1/2 top-1/2 flex h-[160px] w-[160px] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-[28px] ring-1 ring-[#3a3833]">
          <div className={ground} />
          <span className="relative font-serif text-[34px] font-semibold tracking-[-0.03em]">Lincoln</span>
        </div>
      </div>
      {/* Phones: Lincoln, then the tools beneath it. */}
      <div className="md:hidden">
        <div className="relative mx-auto flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-[24px] ring-1 ring-[#3a3833]">
          <div className={ground} />
          <span className="relative font-serif text-[26px] font-semibold tracking-[-0.03em]">Lincoln</span>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">{TOOLS.flat().map((t) => <span key={t} className={chip}>{t}</span>)}</div>
      </div>
    </div>
  );
}

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

const TRUST = [
  ["Encrypted", "The database and every file, at rest."],
  ["Never used for training", "Client files are not used to train AI models."],
  ["Two-step sign in", "Can be required for the whole firm."],
  ["Yours to take", "Export or delete everything, at any time."],
];

function Close() {
  return (
    <div className="relative isolate h-[560px] overflow-hidden rounded-[24px] bg-[#0e0e0d] md:h-[720px]">
      <div className="absolute inset-0 -z-10"><LightField shape={1} /></div>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
        <In><h2 className="font-serif text-[48px] font-semibold leading-[1] tracking-[-0.035em] md:text-[88px]">Start your<br />first case.</h2></In>
        <In delay={150}><Link href="/start" className="mt-7 inline-block rounded-[10px] bg-white px-6 py-3.5 font-sans text-[15.5px] font-medium text-[#161614] transition hover:bg-white/85 md:mt-8">Get In Touch</Link></In>
      </div>
    </div>
  );
}

function Footer() {
  const icon = "flex h-10 w-10 items-center justify-center rounded-[10px] ring-1 ring-[#302f2c] text-[#f4f3ef] transition hover:bg-[#1f1f1d]";
  return (
    <footer className="mt-20 border-t border-[#262523] md:mt-28">
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
        <div className="mt-12 flex flex-col gap-3 border-t border-[#262523] pt-6 text-[13px] text-[#8d8982] md:mt-16 md:flex-row md:items-center md:justify-between">
          <span>© 2026 Lincoln. All rights reserved.</span>
          <div className="flex gap-5 text-[12.5px]">
            <Link href="/terms" className="transition hover:text-[#f4f3ef]">Terms</Link>
            <Link href="/privacy" className="transition hover:text-[#f4f3ef]">Privacy</Link>
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
    <div className="min-h-dvh overflow-x-clip bg-[#0e0e0d] font-serif text-[#f4f3ef] antialiased selection:bg-[#3a3122]">
      <header className={`sticky top-0 z-50 transition-[background-color,border-color] duration-300 ${scrolled ? "border-b border-[#262523] bg-[#0e0e0d]/80 backdrop-blur-md" : "border-b border-transparent bg-transparent"}`}>
        <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-8">
          <Link href="/" className="font-serif text-[26px] font-semibold tracking-[-0.02em] md:text-[28px]">Lincoln</Link>
          <div className="flex items-center gap-1">
            <Link href="/start" className="rounded-[9px] bg-[#f4f3ef] px-4 py-2 font-sans text-[14.5px] font-medium text-[#0e0e0d] transition hover:opacity-85">Get In Touch</Link>
          </div>
        </nav>
      </header>

      {/* Hero: the line, set low on a band of warm light. */}
      <section className="relative isolate -mt-16 overflow-hidden">
        <div className="absolute inset-0 -z-10"><LightField /></div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-[#0e0e0d]" />
        <div className="mx-auto flex min-h-[100svh] max-w-[1200px] flex-col justify-end px-4 pb-16 pt-32 md:px-8 md:pb-24">
          <p className={`hero-in ${eyebrow} text-[#d6d3cc]`}>For immigration law firms</p>
          <h1 className="hero-in mt-5 max-w-[12ch] font-serif text-[52px] font-semibold leading-[0.98] tracking-[-0.04em] [animation-delay:120ms] sm:text-[72px] md:text-[104px] lg:text-[120px]">Your work done before you even ask.</h1>
          <div className="hero-in mt-10 flex items-center gap-2 [animation-delay:240ms] md:mt-12">
            <Link href="/start" className="rounded-[10px] bg-[#f4f3ef] px-6 py-3.5 font-sans text-[15.5px] font-medium text-[#0e0e0d] transition hover:opacity-85">Get In Touch</Link>
            <a href="#work" className="rounded-[10px] px-5 py-3.5 font-sans text-[15.5px] font-medium transition hover:bg-white/10">How it works</a>
          </div>
        </div>
      </section>

      {/* The film. */}
      <section className="mx-auto max-w-[1200px] px-4 pb-20 pt-4 md:px-8 md:pb-28">
        <Film />
      </section>

      {/* The statement, lit word by word. */}
      <section className="border-t border-[#262523]">
        <div className="mx-auto max-w-[1200px] px-4 py-24 md:px-8 md:py-44">
          <Reveal className="max-w-[20ch] font-serif text-[36px] font-semibold leading-[1.12] tracking-[-0.025em] md:text-[68px]" text="Most of an immigration practice is paperwork. Lincoln does the paperwork. You practice law." />
        </div>
      </section>

      {/* Everything Lincoln does. */}
      <section id="work" className="scroll-mt-16 border-t border-[#262523]">
        <div className="mx-auto max-w-[1200px] px-4 py-24 md:px-8 md:py-36">
          <In><p className={eyebrow}>What Lincoln does</p><h2 className="mt-4 font-serif text-[40px] font-semibold leading-[1.02] tracking-[-0.035em] md:text-[72px]">Every part of the case.</h2></In>
          <Work />
        </div>
      </section>

      {/* Every case type. */}
      <section className="overflow-hidden border-t border-[#262523] py-24 md:py-36">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8"><In><p className={eyebrow}>Every case type a firm takes</p></In></div>
        <div className="mt-10 md:mt-14"><Types /></div>
      </section>

      {/* The tools. */}
      <section className="border-t border-[#262523]">
        <div className="mx-auto max-w-[1200px] px-4 py-24 md:px-8 md:py-36">
          <In><p className={`${eyebrow} md:text-center`}>Connected</p><h2 className="mt-4 max-w-[18ch] font-serif text-[40px] font-semibold leading-[1.02] tracking-[-0.035em] md:mx-auto md:text-center md:text-[64px]">Inside the tools the firm already uses.</h2></In>
          <In delay={150}><Tools /></In>
        </div>
      </section>

      {/* Client files. */}
      <section className="border-t border-[#262523]">
        <div className="mx-auto grid max-w-[1200px] gap-7 px-4 py-24 md:grid-cols-2 md:items-center md:gap-20 md:px-8 md:py-36">
          <In><h2 className="font-serif text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[56px]">Built for privacy.</h2></In>
          <div className="flex flex-col">
            {TRUST.map(([a, b], i) => (
              <In key={a} delay={i * 90}>
                <div className={`py-5 ${i ? "border-t border-[#262523]" : "pt-1"}`}><p className="text-[19px] font-semibold tracking-[-0.01em]">{a}</p><p className="mt-1 text-[16.5px] text-[#a6a39c]">{b}</p></div>
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
