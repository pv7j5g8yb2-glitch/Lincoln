import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Greeting from "@/components/Greeting";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { cases, pendingApprovals } from "@/lib/queries";
import { ago } from "@/lib/format";

export default async function Home() {
  const { user, firm, viewer } = await requireUser();
  // The cases Lincoln has worked on most recently, each with the last thing it did.
  const allowed = new Map(cases(firm.id, viewer).map((c) => [c.id, c]));
  const review = new Map<string, string>();
  for (const a of pendingApprovals(firm.id, viewer)) if (!review.has(a.case_id)) review.set(a.case_id, a.id);
  const rows = db().prepare(`SELECT a.case_id, a.text, a.at FROM activity a JOIN (SELECT case_id, MAX(at) AS at FROM activity WHERE firm_id = ? AND actor = 'Lincoln' AND case_id IS NOT NULL GROUP BY case_id) l ON l.case_id = a.case_id AND l.at = a.at
    WHERE a.firm_id = ? AND a.actor = 'Lincoln' ORDER BY a.at DESC LIMIT 40`).all(firm.id, firm.id) as { case_id: string; text: string; at: string }[];
  const recent = rows.filter((r) => allowed.has(r.case_id)).filter((r, i, all) => all.findIndex((x) => x.case_id === r.case_id) === i).slice(0, 5);
  const first = user.name.split(/\s+/)[0] || user.name;

  return (
    <div className="rise mx-auto flex min-h-[calc(100dvh-12rem)] max-w-[680px] flex-col justify-center md:min-h-[calc(100dvh-9rem)]">
      <Greeting name={first} />
      {recent.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-1 text-[13px] font-medium text-muted">Recent work</h2>
          <ul className="border-t border-line">
            {recent.map((r) => {
              const c = allowed.get(r.case_id)!;
              return (
                <li key={r.case_id} className="border-b border-line">
                  <Link href={review.has(r.case_id) ? `/approvals?id=${review.get(r.case_id)}` : `/cases/${r.case_id}`} className="group flex items-center gap-4 py-3.5">
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2"><span className="truncate text-[14.5px] font-medium">{c.client}</span><span className="shrink-0 text-[12.5px] text-faint">{c.type_code}</span></span>
                      <span className="mt-0.5 block truncate text-[13px] text-muted">{r.text}</span>
                    </span>
                    {review.has(r.case_id) ? <span className="shrink-0 rounded-full bg-panel px-2.5 py-1 text-[11.5px] font-medium">For review</span> : <span className="hidden shrink-0 text-[12px] text-faint sm:block">{ago(r.at)}</span>}
                    <ChevronRight size={15} className="shrink-0 text-faint transition group-hover:text-ink" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
