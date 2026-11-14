import Link from "next/link";
import { Lock, Plus, Search } from "lucide-react";
import { Empty, PageHead, btn } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { cases } from "@/lib/queries";
import { shortDate } from "@/lib/format";
import ExportMenu from "@/components/ExportMenu";
import { exportItems } from "@/lib/exports";

export default async function Cases({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { user, firm, viewer } = await requireUser();
  const { q = "" } = await searchParams;
  const term = q.trim().toLowerCase();
  const all = cases(firm.id, viewer);
  const rows = term ? all.filter((c) => [c.client, c.counterpart, c.type_code, c.type_name, c.ref, c.stage].some((v) => (v ?? "").toLowerCase().includes(term))) : all;

  return (
    <div className="rise">
      <PageHead title="Cases" right={<div className="flex items-center gap-2"><ExportMenu items={exportItems(firm.id, user.id, "cases")} /><Link href="/cases/new" className={btn.primary}><Plus size={14} /> New case</Link></div>} />
      <form className="relative mb-5 max-w-[340px]">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input name="q" defaultValue={q} placeholder="Search" className="h-9 w-full rounded-lg border border-line bg-card pl-8 pr-3 text-[13px] outline-none transition placeholder:text-faint focus:border-ink" />
      </form>
      {rows.length === 0 ? (
        <Empty>{term ? "No matching cases" : "No cases"}</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[12px] text-faint">
                <th className="py-2 pr-3 font-normal">Client</th>
                <th className="px-3 font-normal">Type</th>
                <th className="px-3 font-normal">Stage</th>
                <th className="px-3 font-normal">Status</th>
                <th className="py-2 pl-3 font-normal">Next date</th>
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
                  </td>
                  <td className="whitespace-nowrap px-3 text-muted">{c.type_code}</td>
                  <td className="whitespace-nowrap px-3 text-muted">{c.stage}</td>
                  <td className="max-w-[240px] truncate px-3">
                    {c.processing ? <span className="text-muted">Reading file</span> : c.state === "needs_you" ? <span className="font-medium">For review</span> : c.waiting_on ? <span className="text-muted">Awaiting {c.waiting_on.toLowerCase() === "uscis" ? "USCIS" : c.waiting_on.charAt(0).toLowerCase() + c.waiting_on.slice(1)}</span> : <span className="text-muted">In progress</span>}
                  </td>
                  <td className="whitespace-nowrap py-3 pl-3 text-muted">
                    {c.next_date ? <>{shortDate(c.next_date)} <span className="text-faint">{c.next_date_label}</span></> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
