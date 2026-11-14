"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type ExportItem = { label: string; href: string; hint?: string };

/** A small menu of file exports and integrations. Links only; the server does the work. */
export default function ExportMenu({ items, label = "Export" }: { items: ExportItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex h-8 items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-[12.5px] font-medium transition hover:bg-panel">{label} <ChevronDown size={13} /></button>
      {open && (
        <div className="rise absolute right-0 top-full z-30 mt-1 w-[260px] rounded-xl border border-line bg-card p-1 shadow-[0_10px_36px_-12px_rgba(22,22,20,0.28)]">
          {items.map((i) => (
            <a key={i.href} href={i.href} target={i.href.includes("to=download") ? undefined : "_blank"} rel="noreferrer" onClick={() => setOpen(false)} className="block rounded-md px-2.5 py-1.5 transition hover:bg-panel">
              <span className="block text-[13px]">{i.label}</span>
              {i.hint && <span className="block text-[11.5px] text-faint">{i.hint}</span>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
