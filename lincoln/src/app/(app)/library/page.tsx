import { ArrowUpRight, Search } from "lucide-react";
import { Empty, PageHead, search } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { citationsIn, lawStatus, searchLaw } from "@/lib/law";

// The law library: the INA and the immigration regulations as officially published, searched by citation or words.

const marked = (s: string) => s.split(/(\u0002[^\u0003]*\u0003)/).map((p, i) => p.startsWith("\u0002") ? <mark key={i} className="bg-panel px-0.5 font-medium text-ink">{p.slice(1, -1)}</mark> : p);
const NAMES: Record<string, string> = { INA: "Immigration and Nationality Act", "8 CFR": "8 CFR, Aliens and Nationality", "20 CFR": "20 CFR 655 and 656, Labor", "22 CFR": "22 CFR 40 to 42, Visas" };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser();
  const q = ((await searchParams).q ?? "").trim().slice(0, 300);
  const hits = q ? searchLaw(q, 20) : [];
  const status = lawStatus();
  const cited = citationsIn(q).length > 0; // a citation opens its passage at once
  return (
    <div className="rise mx-auto max-w-[760px]">
      <PageHead title="Library" />
      <form action="/library" className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input name="q" defaultValue={q} autoComplete="off" placeholder="Search" className={search} />
      </form>

      {!q ? (
        status.counts.length === 0 ? <div className="mt-8"><Empty>Not loaded yet</Empty></div> : (
          <ul className="mt-8 border-t border-line">
            {status.counts.map((c) => (
              <li key={c.source} className="flex items-baseline justify-between gap-4 border-b border-line py-3 text-[13.5px]">
                <span>{NAMES[c.source] ?? c.source}</span>
                <span className="shrink-0 text-[12.5px] text-faint">{c.version.replace("eCFR, current as of ", "eCFR, ")}</span>
              </li>
            ))}
          </ul>
        )
      ) : hits.length === 0 ? (
        <div className="mt-8"><Empty>No results</Empty></div>
      ) : (
        <ul className="mt-6 border-t border-line">
          {hits.map((h, i) => (
            <li key={`${h.cite}-${i}`} className="border-b border-line py-4">
              <details className="group" open={cited && i === 0}>
                <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="min-w-0 text-[14.5px] font-medium">{h.cite}{h.alias && <span className="ml-2 font-normal text-muted">{h.alias}</span>}</p>
                    <a href={h.url} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-0.5 text-[12.5px] text-faint transition hover:text-ink">Official text <ArrowUpRight size={13} /></a>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-faint">{h.heading}</p>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted group-open:hidden">{marked(h.snippet)}</p>
                </summary>
                <div className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed">{h.text}</div>
                <p className="mt-3 text-[12px] text-faint">{h.version}</p>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
