import clsx from "clsx";

// The evidence grid: what has to be proved down the side, the client's documents across the top, and in each
// cell how well that document proves it, linked to the page. A document is a column only if it proves something.

export type GridRow = { id: string; title: string; cite?: string; status: string; note?: string | null; gap?: string | null; ev: { doc: number; page: number; grade: number; note?: string }[] };
const GRADES = ["Excluded", "In the file", "Relevant", "Supports the fact", "Meets the standard", "Approved by attorney"];
const STATUS: Record<string, string> = { claim: "Claim", more: "More evidence required", no: "Do not claim", met: "Met", partial: "Partial", missing: "Missing" };
const TONE: Record<string, string> = { met: "text-ink", claim: "text-ink", partial: "text-muted", more: "text-muted", missing: "text-risk", no: "text-faint" };

export default function EvidenceGrid({ caseId, rows, docs }: { caseId: string; rows: GridRow[]; docs: { n: number; title: string }[] }) {
  const used = docs.filter((d) => rows.some((r) => r.ev.some((e) => e.doc === d.n)));
  return (
    <div className="edge-fade -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <table className="w-max min-w-full border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-[200px] min-w-[200px] border-b border-line bg-canvas pb-2 pr-4 align-bottom text-[12px] font-medium text-faint md:w-[340px]" />
            {used.map((d) => (
              <th key={d.n} className="w-[104px] min-w-[104px] border-b border-line px-2 pb-2 align-bottom">
                <span className="line-clamp-3 text-[11.5px] font-medium leading-snug text-muted" title={d.title}>{d.title}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="group">
              <td className="sticky left-0 z-10 border-b border-line bg-canvas py-3 pr-4 align-top">
                <p className="text-[13.5px] font-medium leading-snug">{r.title}{r.cite && <span className="ml-1.5 text-[11.5px] font-normal text-faint">{r.cite}</span>}</p>
                <p className={clsx("mt-0.5 text-[12px] font-medium", TONE[r.status] ?? "text-muted")}>{STATUS[r.status] ?? r.status}</p>
                {r.gap && <p className="mt-1 text-[12px] leading-relaxed text-muted">{r.gap}</p>}
              </td>
              {used.map((d) => {
                const here = r.ev.filter((e) => e.doc === d.n).sort((a, b) => b.grade - a.grade);
                const top = here[0];
                return (
                  <td key={d.n} className="border-b border-line px-2 py-3 align-top">
                    {top && (
                      <a href={`/api/pages/${caseId}/${top.page}`} target="_blank" title={here.map((e) => `p. ${e.page}: ${e.note ?? GRADES[e.grade]}`).join("\n")} className="block px-1.5 py-1 transition hover:bg-panel">
                        <span className="flex items-center gap-[3px]">
                          {[1, 2, 3, 4].map((g) => <span key={g} className={clsx("h-[5px] flex-1", top.grade === 0 ? "bg-line" : g <= top.grade ? "bg-ink" : "bg-line")} />)}
                        </span>
                        <span className={clsx("mt-1 block text-[11.5px] text-muted", top.grade === 0 && "line-through")}>p. {here.map((e) => e.page).join(", ")}</span>
                      </a>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
