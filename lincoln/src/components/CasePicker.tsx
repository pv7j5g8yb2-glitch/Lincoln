"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { pickCases, sortMessage } from "@/lib/actions";
import { btn, search } from "./ui";

type Pick = { id: string; client: string; type_code: string; ref: string };

/** Files an email Lincoln could not sort: its likeliest cases first, any other case by name, reference or address. */
export default function CasePicker({ messageId, suggested }: { messageId: string; suggested: Pick[] }) {
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Pick[]>([]);
  const [pending, start] = useTransition();
  const seq = useRef(0);
  useEffect(() => {
    const term = q.trim();
    if (!term) { setFound([]); return; }
    const n = ++seq.current;
    const t = setTimeout(() => void pickCases(term).then((r) => { if (n === seq.current) setFound(r); }).catch(() => undefined), 150);
    return () => clearTimeout(t);
  }, [q]);
  const file = (caseId: string) => start(async () => {
    const f = new FormData();
    f.set("message", messageId);
    f.set("case", caseId);
    await sortMessage(f);
  });
  const list = q.trim() ? found : suggested;
  return (
    <div className="mb-4 max-w-[480px]">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a case" aria-label="Find a case" className={search} />
      </div>
      {list.length > 0 && (
        <ul className="mt-2 border-t border-line">
          {list.map((c) => (
            <li key={c.id} className="flex items-center gap-3 border-b border-line py-2">
              <span className="min-w-0 flex-1 truncate text-[13px]"><span className="font-medium">{c.client}</span> <span className="text-faint">{c.type_code} · {c.ref}</span></span>
              <button type="button" disabled={pending} onClick={() => file(c.id)} className={btn.secondary}>File</button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" disabled={pending} onClick={() => file("none")} className={`${btn.ghost} mt-2`}>Not case mail</button>
    </div>
  );
}
