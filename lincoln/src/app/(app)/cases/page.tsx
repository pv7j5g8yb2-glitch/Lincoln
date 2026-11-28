import Link from "next/link";
import { Lock, Plus, Search } from "lucide-react";
import { Empty, PageHead, btn, search } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { casesPage } from "@/lib/queries";
import { shortDate } from "@/lib/format";
import ExportMenu from "@/components/ExportMenu";
import { exportItems } from "@/lib/exports";

export const metadata = { title: "Cases" };

const PAGE = 100;

export default async function Cases({ searchParams }: { searchParams: Promise<{ q?: string; n?: string }> }) {
  const { user, firm, viewer } = await requireUser();
  const { q = "", n } = await searchParams;
  const term = q.trim().slice(0, 100);
  const limit = Math.min(Math.max(Number(n) || PAGE, PAGE), 5000);
  const { rows, more } = casesPage(firm.id, viewer, { q: term, limit });
  // An empty firm shows neither search nor export: there is nothing to find or send yet.
  const any = rows.length > 0 || Boolean(term);

  return (
    <div className="rise">
      <PageHead title="Cases" right={<div className="flex items-center gap-2">{any && <ExportMenu items={exportItems(firm.id, user.id, "cases")} />}<Link href="/cases/new" className={btn.primary}><Plus size={14} /> New case</Link></div>} />
      {any && (
        <form className="relative mb-5 max-w-[340px]">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input name="q" defaultValue={q} placeholder="Search" aria-label="Search cases" className={search} />
        </form>
      )}
      {rows.length === 0 ? (
        <Empty page>{term ? "No matching cases" : "No cases yet"}</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[12px] text-faint">
                <th className="py-2 pr-3 font-normal">Client</th>
                <th className="hidden px-3 font-normal sm:table-cell">Type</th>
                <th className="hidden px-3 font-normal sm:table-cell">Stage</th>
                <th className="hidden px-3 font-normal sm:table-cell">Status</th>
                <th className="hidden py-2 pl-3 font-normal md:table-cell">Next date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-line transition hover:bg-side">
                  <td className="max-w-[280px] py-3 pr-3">
                    <Link href={`/cases/${c.id}`} className="flex items-center gap-1.5 font-medium">
                      {c.sensitive ? <Lock size={12} className="shrink-0 text-faint" /> : null}
                      <span className="truncate">{c.client}</span>
                    </Link>
                    {c.counterpart && <div className="truncate text-[12px] text-faint">{c.counterpart}</div>}
                    <div className="mt-0.5 truncate text-[12px] text-muted sm:hidden">{c.type_code} · {c.processing ? "Reading file" : c.state === "needs_you" ? <span className="font-medium text-ink">For review</span> : c.stage}</div>
                  </td>
                  <td className="hidden whitespace-nowrap px-3 text-muted sm:table-cell">{c.type_code}</td>
                  <td className="hidden whitespace-nowrap px-3 text-muted sm:table-cell">{c.stage}</td>
                  <td className="hidden max-w-[240px] truncate px-3 sm:table-cell">
                    {c.processing ? <span className="text-muted">Reading file</span> : c.state === "needs_you" ? <span className="font-medium">For review</span> : c.waiting_on ? <span className="text-muted">Awaiting {c.waiting_on.toLowerCase() === "uscis" ? "USCIS" : c.waiting_on.charAt(0).toLowerCase() + c.waiting_on.slice(1)}</span> : <span className="text-muted">In progress</span>}
                  </td>
                  <td className="hidden whitespace-nowrap py-3 pl-3 text-muted md:table-cell">
                    {c.next_date ? <>{shortDate(c.next_date)} <span className="text-faint">{c.next_date_label}</span></> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {more && (
            <div className="mt-6 flex justify-center">
              <Link href={`/cases?${new URLSearchParams({ ...(term ? { q: term } : {}), n: String(limit + PAGE) })}`} scroll={false} className={btn.secondary}>Show more</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
