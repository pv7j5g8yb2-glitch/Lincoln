"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import { Blocks, CircleCheck, CircleHelp, Ellipsis, FolderClosed, House, Inbox, LogOut, Play, Plus, RotateCcw, Settings } from "lucide-react";
import { advanceDemo, resetDemoAction, signOut } from "@/lib/actions";
import { Avatar } from "./ui";

// The phone tab bar, as on iOS 26: a floating capsule of glass with a lens behind the selected tab.
// The lens moves on a slightly underdamped spring, stretches along its path while it travels and
// squashes as it lands, swells under a finger, and follows a finger dragged across the bar, settling
// on the nearest tab. The selected tab changes the moment it is touched; the page follows.

type Props = {
  firm: string;
  user: { name: string; initials: string; avatar: string | null };
  review: number;
  demo: { next: string | null } | null;
};

const TABS = [
  { href: "/", label: "Home", Icon: House },
  { href: "/cases", label: "Cases", Icon: FolderClosed },
  { href: "/approvals", label: "Review", Icon: CircleCheck },
] as const;
const MORE = 3;
const MORE_PATHS = ["/inbox", "/integrations", "/settings", "/help"];

function tabFor(path: string) {
  if (path === "/cases/new") return -1;
  if (path === "/" || path.startsWith("/assistant")) return 0;
  if (path.startsWith("/cases")) return 1;
  if (path.startsWith("/approvals")) return 2;
  if (MORE_PATHS.some((p) => path.startsWith(p))) return MORE;
  return -1;
}

export default function TabBar({ firm, user, review, demo }: Props) {
  const path = usePathname();
  const router = useRouter();
  const [active, setActive] = useState(() => tabFor(path));
  const [sheet, setSheetState] = useState(false);
  const sheetOpen = useRef(false);
  const setSheet = useCallback((v: boolean) => { sheetOpen.current = v; setSheetState(v); }, []);
  const [pending, start] = useTransition();
  const cap = useRef<HTMLDivElement>(null);
  const lens = useRef<HTMLSpanElement>(null);
  const tabs = useRef<(HTMLElement | null)[]>([]);

  // The page has arrived: follow it (also covers back and forward).
  useEffect(() => { setActive(tabFor(path)); setSheet(false); }, [path, setSheet]);

  // ---------- the lens on a spring ----------
  const st = useRef({ x: 0, v: 0, target: 0, w: 0, press: 0, pressTarget: 0, pv: 0, running: false, ready: false, last: 0, dragging: false });
  const PAD = 4;
  const reduce = useRef(false);
  const xFor = (i: number) => (tabs.current[i]?.offsetLeft ?? 0) - PAD;

  const draw = useCallback(() => {
    const s = st.current;
    const el = lens.current;
    if (!el) return;
    const speed = Math.min(1, Math.abs(s.v) / 2200);
    const sx = 1 + speed * 0.32 + s.press * 0.14;
    const sy = 1 - speed * 0.14 + s.press * 0.2;
    el.style.transform = `translateX(${s.x}px) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
  }, []);

  const step = useCallback((t: number) => {
    const s = st.current;
    const dt = Math.min(0.032, (t - (s.last || t)) / 1000) || 0.016;
    s.last = t;
    const k = s.dragging ? 900 : 380, c = s.dragging ? 48 : 26;
    s.v += (-k * (s.x - s.target) - c * s.v) * dt;
    s.x += s.v * dt;
    s.pv += (-520 * (s.press - s.pressTarget) - 30 * s.pv) * dt;
    s.press += s.pv * dt;
    draw();
    const settled = Math.abs(s.x - s.target) < 0.2 && Math.abs(s.v) < 4 && Math.abs(s.press - s.pressTarget) < 0.002 && Math.abs(s.pv) < 0.02;
    if (settled && !s.dragging) {
      s.x = s.target; s.v = 0; s.press = s.pressTarget; s.pv = 0; s.running = false; s.last = 0;
      draw();
      return;
    }
    requestAnimationFrame(step);
  }, [draw]);

  const kick = useCallback(() => {
    const s = st.current;
    if (reduce.current) { s.x = s.target; s.press = s.pressTarget; draw(); return; }
    if (!s.running) { s.running = true; requestAnimationFrame(step); }
  }, [draw, step]);

  const measure = useCallback(() => {
    const s = st.current;
    const first = tabs.current[0];
    if (!first || !lens.current) return false;
    const was = s.w;
    s.w = first.offsetWidth;
    if (!was) s.ready = false; // first sight of the bar (or after it was hidden): no glide in from the side
    lens.current.style.width = `${s.w}px`;
    return s.w > 0;
  }, []);

  const select = useCallback((i: number, instant?: boolean) => {
    const s = st.current;
    if (!lens.current) return;
    lens.current.style.opacity = i < 0 ? "0" : "1";
    if (i < 0) return;
    s.target = xFor(i);
    if (instant || !s.ready) { s.x = s.target; s.v = 0; draw(); s.ready = true; return; }
    kick();
  }, [draw, kick]);

  useLayoutEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (measure()) select(active, true);
    const onResize = () => { if (measure()) select(tabFor(window.location.pathname), true); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (!st.current.dragging && measure()) select(active); }, [active, path, select, measure]);

  // ---------- touching, pressing and dragging ----------
  const go = useCallback((i: number) => {
    if (i === MORE) {
      const open = !sheetOpen.current;
      setSheet(open);
      setActive(open ? MORE : tabFor(window.location.pathname));
      return;
    }
    setSheet(false);
    const href = TABS[i].href;
    setActive(i);
    if (window.location.pathname === href) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    router.push(href);
  }, [router, setSheet]);

  useEffect(() => {
    const el = cap.current;
    if (!el) return;
    let pointerId: number | null = null, lastX = 0, moved = 0, startX = 0, watchdog = 0;
    const order = [0, 1, 2, MORE];
    const indexAt = (x: number) => order.reduce((best, i) => (Math.abs(xFor(i) - x) < Math.abs(xFor(best) - x) ? i : best), 0);
    const clampX = (r: DOMRect, clientX: number) => Math.max(0, Math.min(r.width - PAD * 2 - st.current.w, clientX - r.left - PAD - st.current.w / 2));
    const settle = () => {
      window.clearTimeout(watchdog);
      st.current.dragging = false;
      pointerId = null;
      st.current.pressTarget = 0;
      lens.current?.classList.remove("press");
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if ((e.target as HTMLElement).closest("[data-plus]")) return;
      if (!measure()) return;
      const r = el.getBoundingClientRect();
      st.current.dragging = true;
      pointerId = e.pointerId; lastX = startX = e.clientX; moved = 0;
      try { el.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
      lens.current?.classList.add("press");
      if (lens.current) lens.current.style.opacity = "1";
      st.current.pressTarget = 1;
      st.current.target = clampX(r, e.clientX);
      kick();
      window.clearTimeout(watchdog);
      watchdog = window.setTimeout(() => { if (st.current.dragging) { settle(); select(tabFor(window.location.pathname)); } }, 4000);
    };
    const move = (e: PointerEvent) => {
      if (!st.current.dragging || e.pointerId !== pointerId) return;
      if (e.clientX) lastX = e.clientX;
      moved = Math.max(moved, Math.abs(lastX - startX));
      st.current.target = clampX(el.getBoundingClientRect(), lastX);
    };
    const up = (e: PointerEvent) => {
      if (!st.current.dragging || e.pointerId !== pointerId) return;
      if (e.type === "pointerup" && e.clientX) lastX = e.clientX;
      settle();
      const i = indexAt(clampX(el.getBoundingClientRect(), lastX));
      st.current.target = xFor(i);
      kick();
      go(i);
    };
    // Touches are handled above. A click from the keyboard (detail 0) goes through the same path.
    const swallow = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("[data-plus]")) return;
      e.preventDefault();
      if (e.detail === 0) {
        const i = tabs.current.findIndex((n) => n && n.contains(t));
        if (i >= 0) go(i);
      }
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", up, true);
    el.addEventListener("click", swallow);
    const vis = () => { if (st.current.dragging) { settle(); select(tabFor(window.location.pathname)); } };
    document.addEventListener("visibilitychange", vis);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);
      el.removeEventListener("click", swallow);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [go, kick, measure, select]);

  // In a conversation the message box owns the bottom of the screen.
  const hidden = path.startsWith("/assistant");

  const tab = (i: number, label: string, Icon: typeof House, href: string, badge?: number) => (
    <Link key={label} href={href} prefetch ref={(n) => { tabs.current[i] = n; }} aria-current={active === i ? "page" : undefined} className={clsx("lg-tab", active === i && "on")}>
      <span className="relative"><Icon size={23} strokeWidth={active === i ? 2.1 : 1.7} />{badge ? <span className="lg-badge" /> : null}</span>
      <span>{label}</span>
    </Link>
  );
  const sheetItem = "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] text-ink transition active:bg-ink/[0.07]";

  return (
    <div className={clsx("md:hidden", hidden && "hidden")}>
      <div className="lg-fade" aria-hidden="true" />
      <div className={clsx("lg-scrim", sheet && "open")} onClick={() => { setSheet(false); setActive(tabFor(path)); }} aria-hidden="true" />
      <div className={clsx("lg-sheet", sheet && "open")} role="menu" aria-hidden={!sheet}>
        <div className="flex items-center gap-3 px-3 pb-2 pt-1.5">
          <Avatar initials={user.initials} src={user.avatar} size={34} />
          <span className="min-w-0 leading-tight"><span className="block truncate text-[15px] font-medium">{user.name}</span><span className="block truncate text-[12.5px] text-muted">{firm}</span></span>
        </div>
        <div className="lg-rule" />
        <Link href="/inbox" className={sheetItem}><Inbox size={18} strokeWidth={1.7} />Inbox</Link>
        <Link href="/integrations" className={sheetItem}><Blocks size={18} strokeWidth={1.7} />Integrations</Link>
        <Link href="/settings" className={sheetItem}><Settings size={18} strokeWidth={1.7} />Settings</Link>
        <Link href="/help" className={sheetItem}><CircleHelp size={18} strokeWidth={1.7} />Help</Link>
        {demo && (
          <>
            <div className="lg-rule" />
            {demo.next && <button disabled={pending} onClick={() => start(async () => { await advanceDemo(); setSheet(false); })} className={sheetItem}><Play size={18} strokeWidth={1.7} /><span className="min-w-0 truncate">{pending ? "Running" : "Run next event"}</span></button>}
            <button disabled={pending} onClick={() => start(() => resetDemoAction())} className={sheetItem}><RotateCcw size={18} strokeWidth={1.7} />Reset sample data</button>
          </>
        )}
        <div className="lg-rule" />
        <button onClick={() => start(() => signOut())} className={sheetItem}><LogOut size={18} strokeWidth={1.7} />Sign out</button>
      </div>

      <nav className="lg-bar" aria-label="Main">
        <div ref={cap} className="lg-cap">
          <span ref={lens} className="lg-lens" aria-hidden="true" />
          {tab(0, TABS[0].label, TABS[0].Icon, TABS[0].href)}
          {tab(1, TABS[1].label, TABS[1].Icon, TABS[1].href)}
          <Link href="/cases/new" prefetch data-plus aria-label="New case" className={clsx("lg-plus", active === -1 && path === "/cases/new" && "on")} onClick={() => { setSheet(false); setActive(-1); }}><Plus size={22} strokeWidth={2.4} /></Link>
          {tab(2, TABS[2].label, TABS[2].Icon, TABS[2].href, review)}
          <button ref={(n) => { tabs.current[MORE] = n; }} type="button" aria-expanded={sheet} aria-haspopup="menu" className={clsx("lg-tab", active === MORE && "on")}>
            <Ellipsis size={23} strokeWidth={active === MORE ? 2.1 : 1.7} />
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
