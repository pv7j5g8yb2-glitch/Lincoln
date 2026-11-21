"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { setCaseTeam } from "@/lib/actions";
import { notify } from "./Toaster";
import { btn } from "./ui";

type P = { id: string; name: string; initials: string; lawyer: boolean };

/** Who the case is with: the responsible attorney and the paralegal. Admins and the case's attorney can change it. */
export default function AssignMenu({ caseId, attorney, paralegal, people, canEdit }: { caseId: string; attorney: string | null; paralegal: string | null; people: P[]; canEdit: boolean }) {
  const [open, setOpen] = useState(false);
  const [a, setA] = useState(attorney ?? "");
  const [p, setP] = useState(paralegal ?? "");
  const [pending, start] = useTransition();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const who = (id: string) => people.find((x) => x.id === id);
  const save = (na: string, np: string) => start(async () => {
    const [ba, bp] = [a, p];
    setA(na); setP(np);
    const r = await setCaseTeam(caseId, na, np);
    if (r.error) { setA(ba); setP(bp); notify(r.error); } else notify("Saved");
  });
  const select = "h-9 w-full rounded-lg border border-line bg-card px-2.5 text-[13px] outline-none focus:border-ink";
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className={btn.secondary} aria-label="Team">
        <span className="flex -space-x-1.5">
          {[a, p].filter((x, i, all) => x && all.indexOf(x) === i).map((x) => <span key={x} className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-canvas ring-2 ring-card">{who(x)?.initials ?? "?"}</span>)}
        </span>
        Team
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-30 w-[260px] rounded-xl border border-line bg-card p-3 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.3)]">
          <label className="block"><span className="mb-1 block text-[12px] text-muted">Attorney</span>
            <select value={a} disabled={!canEdit || pending} onChange={(e) => save(e.target.value, p)} className={select}>
              {people.filter((x) => x.lawyer || x.id === a).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
          <label className="mt-3 block"><span className="mb-1 block text-[12px] text-muted">Paralegal</span>
            <select value={p} disabled={!canEdit || pending} onChange={(e) => save(a, e.target.value)} className={select}>
              {people.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
