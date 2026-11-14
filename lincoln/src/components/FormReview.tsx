"use client";

import { useMemo, useState, useTransition } from "react";
import { saveFormAnswers } from "@/lib/actions";

type Field = { name: string; kind: "text" | "check" | "choice"; label: string; options?: string[] };
type Answer = { name: string; label: string; value: string; source: string };

/** The answers Lincoln gave, each with its source, editable; blank fields folded below. */
export default function FormReview({ formId, caseId, layout, answers }: { formId: string; caseId: string; layout: Field[]; answers: Answer[] }) {
  const [pending, start] = useTransition();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const given = useMemo(() => new Map(answers.map((a) => [a.name, a])), [answers]);
  const blanks = layout.filter((f) => !given.has(f.name));
  const changed = Object.keys(edits).length > 0;
  const valueOf = (name: string) => edits[name] ?? given.get(name)?.value ?? "";
  const set = (name: string, v: string) => setEdits((e) => ({ ...e, [name]: v }));

  const input = (f: Field) =>
    f.kind === "check" ? (
      <input type="checkbox" checked={/^yes$/i.test(valueOf(f.name))} onChange={(e) => set(f.name, e.target.checked ? "yes" : "")} className="h-4 w-4 accent-[var(--color-ink)]" />
    ) : f.kind === "choice" ? (
      <select value={valueOf(f.name)} onChange={(e) => set(f.name, e.target.value)} className="h-8 w-full rounded-md border border-line bg-card px-2 text-[13px] outline-none focus:border-edge">
        <option value="" />
        {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input value={valueOf(f.name)} onChange={(e) => set(f.name, e.target.value)} className="h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-[13px] outline-none transition hover:border-line focus:border-edge focus:bg-card" />
    );

  const source = (s: string) => {
    const page = /^p\.\s?(\d+)/.exec(s)?.[1];
    return page ? <a href={`/api/pages/${caseId}/${page}`} target="_blank" className="text-muted underline decoration-dotted underline-offset-4 hover:text-ink">{s}</a> : <span className="text-faint">{s === "edited" ? "Edited" : s === "attorney" ? "Attorney" : s === "firm" ? "Firm" : s === "case" ? "Case" : s}</span>;
  };

  return (
    <div className="pb-2">
      <ul className="divide-y divide-line border-y border-line">
        {layout.filter((f) => given.has(f.name)).map((f) => (
          <li key={f.name} className="grid grid-cols-1 gap-1 py-2 md:grid-cols-[1fr_minmax(0,1.1fr)_64px] md:items-center md:gap-3">
            <span className="text-[12.5px] leading-snug text-muted">{f.label}</span>
            {input(f)}
            <span className="text-[12px] md:text-right">{source(given.get(f.name)!.source)}</span>
          </li>
        ))}
      </ul>
      {blanks.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[13px] text-muted transition hover:text-ink">{blanks.length} blank</summary>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {blanks.map((f) => (
              <li key={f.name} className="grid grid-cols-1 gap-1 py-2 md:grid-cols-[1fr_minmax(0,1.1fr)_64px] md:items-center md:gap-3">
                <span className="text-[12.5px] leading-snug text-muted">{f.label}</span>
                {input(f)}
                <span />
              </li>
            ))}
          </ul>
        </details>
      )}
      {changed && (
        <div className="sticky bottom-24 mt-4 flex gap-2 md:bottom-4">
          <button disabled={pending} onClick={() => start(async () => { await saveFormAnswers(formId, Object.entries(edits).map(([name, value]) => ({ name, value }))); setEdits({}); })} className="h-9 rounded-lg bg-ink px-4 text-[13px] font-medium text-canvas transition hover:opacity-90 disabled:opacity-40">Save</button>
          <button disabled={pending} onClick={() => setEdits({})} className="h-9 rounded-lg border border-line bg-card px-3.5 text-[13px] font-medium transition hover:bg-panel">Cancel</button>
        </div>
      )}
    </div>
  );
}
