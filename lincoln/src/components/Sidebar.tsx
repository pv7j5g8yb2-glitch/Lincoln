"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import { Blocks, ChevronsUpDown, CircleCheck, CircleHelp, FolderClosed, House, Inbox, LogOut, PanelLeft, Play, RotateCcw, Settings, SquarePen } from "lucide-react";
import { advanceDemo, resetDemoAction, signOut } from "@/lib/actions";
import { Avatar } from "./ui";

type Props = {
  firm: string;
  user: { name: string; initials: string; avatar: string | null };
  review: number;
  recent: { id: string; client: string }[];
  demo: { next: string | null } | null;
};

export default function Sidebar({ firm, user, review, recent, demo }: Props) {
  const path = usePathname();
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    try { setClosed(localStorage.getItem("lincoln.sidebar") === "closed"); } catch { /* storage unavailable */ }
  }, []);
  const toggle = (next: boolean) => {
    setClosed(next);
    document.documentElement.dataset.sidebar = next ? "closed" : "open";
    try { localStorage.setItem("lincoln.sidebar", next ? "closed" : "open"); } catch { /* storage unavailable */ }
  };
  const [menu, setMenu] = useState(false);
  const [pending, start] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setMenu(false);
  }, [path]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const item = (href: string, text: string, Icon: typeof Inbox, count?: number) => {
    const active = href === "/" ? path === "/" || path.startsWith("/assistant") : href === "/cases" ? path === "/cases" : path.startsWith(href);
    return (
      <Link href={href} className={clsx("flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition", active ? "bg-ink/[0.06] font-medium text-ink" : "text-ink/80 hover:bg-ink/[0.04]")}>
        <Icon size={15} strokeWidth={1.7} className="shrink-0" />
        <span className="flex-1 truncate">{text}</span>
        {count ? <span className="text-[12px] tabular-nums text-muted">{count}</span> : null}
      </Link>
    );
  };
  const menuItem = "flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-left text-[13px] text-ink transition hover:bg-panel disabled:opacity-50";

  const body = (
    <div className="flex h-full flex-col px-2.5 pb-2.5 pt-4">
      <div className="mb-4 flex items-center justify-between px-2.5">
        <Link href="/" className="wordmark text-[19px] leading-none">Lincoln</Link>
        <button onClick={() => toggle(true)} className="rounded-md p-1 text-muted transition hover:bg-ink/[0.05] hover:text-ink" aria-label="Close sidebar"><PanelLeft size={17} strokeWidth={1.7} /></button>
      </div>
      <nav className="flex flex-col gap-px">
        {item("/cases/new", "New case", SquarePen)}
        <div className="h-2" />
        {item("/", "Home", House)}
        {item("/cases", "Cases", FolderClosed)}
        {item("/approvals", "Review", CircleCheck, review)}
        {item("/inbox", "Inbox", Inbox)}
        {item("/integrations", "Integrations", Blocks)}
      </nav>
      {recent.length > 0 && (
        <div className="scroll-thin mt-6 min-h-0 flex-1 overflow-y-auto">
          <div className="mb-1 px-2.5 text-[11.5px] text-faint">Recent</div>
          {recent.map((c) => (
            <Link key={c.id} href={`/cases/${c.id}`} className={clsx("block truncate rounded-lg px-2.5 py-[6px] text-[13px] transition", path === `/cases/${c.id}` ? "bg-ink/[0.06] text-ink" : "text-ink/80 hover:bg-ink/[0.04]")}>
              {c.client}
            </Link>
          ))}
        </div>
      )}
      <div ref={menuRef} className="relative mt-auto pt-2">
        {menu && (
          <div className="rise absolute inset-x-0 bottom-full z-10 mb-1 rounded-xl border border-line bg-card p-1 shadow-[0_10px_36px_-12px_rgba(22,22,20,0.28)]">
            <Link href="/settings" className={menuItem}><Settings size={14} strokeWidth={1.7} />Settings</Link>
            <Link href="/help" className={menuItem}><CircleHelp size={14} strokeWidth={1.7} />Help</Link>
            {demo && (
              <>
                <div className="mx-1 my-1 border-t border-line" />
                <div className="px-2 pb-0.5 pt-1 text-[11px] text-faint">Sample workspace</div>
                {demo.next && (
                  <button disabled={pending} onClick={() => start(async () => { await advanceDemo(); setMenu(false); })} className={clsx(menuItem, "h-auto items-start py-1.5")}>
                    <Play size={14} strokeWidth={1.7} className="mt-[2px] shrink-0" />
                    <span><span className="block">{pending ? "Running" : "Run next event"}</span><span className="block text-[11.5px] leading-snug text-faint">{demo.next}</span></span>
                  </button>
                )}
                <button disabled={pending} onClick={() => start(() => resetDemoAction())} className={menuItem}><RotateCcw size={14} strokeWidth={1.7} />Reset sample data</button>
              </>
            )}
            <div className="mx-1 my-1 border-t border-line" />
            <button onClick={() => start(() => signOut())} className={menuItem}><LogOut size={14} strokeWidth={1.7} />Sign out</button>
          </div>
        )}
        <button onClick={() => setMenu((v) => !v)} aria-expanded={menu} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-ink/[0.04]">
          <Avatar initials={user.initials} src={user.avatar} size={28} />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13px] font-medium">{user.name}</span>
            <span className="block truncate text-[11.5px] text-faint">{firm}</span>
          </span>
          <ChevronsUpDown size={14} className="shrink-0 text-faint" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="sidebar-panel fixed inset-y-0 left-0 z-20 hidden w-[248px] border-r border-line bg-side md:block">{body}</aside>
      {closed && <button onClick={() => toggle(false)} aria-label="Open sidebar" className="fade-in fixed left-3 top-3 z-20 hidden rounded-lg p-2 text-muted transition hover:bg-ink/[0.05] hover:text-ink md:block"><PanelLeft size={17} strokeWidth={1.7} /></button>}
    </>
  );
}
