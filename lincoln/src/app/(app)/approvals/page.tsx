import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft } from "lucide-react";
import ApprovalPanel from "@/components/ApprovalPanel";
import { Empty, PageHead } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { approvalById, decidedApprovals, messageById, pendingApprovals } from "@/lib/queries";
import { ago, inDays } from "@/lib/format";
import { packetPlan } from "@/lib/packet";

export default async function Review({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { firm, viewer } = await requireUser();
  const { id } = await searchParams;
  const pending = pendingApprovals(firm.id, viewer);
  const decided = decidedApprovals(firm.id, viewer);
  const picked = id ? approvalById(firm.id, id, viewer) : undefined;
  const sel = picked && picked.status === "pending" ? picked : pending[0];
  const payload = sel ? (sel.kind === "packet" ? packetPlan(firm.id, sel.case_id) : JSON.parse(sel.payload)) : null;
  const message = payload?.messageId ? messageById(firm.id, payload.messageId) : null;

  return (
    <div className="rise">
      <PageHead title="Review" />
      {pending.length === 0 ? (
        <Empty>Nothing for review</Empty>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <ul className={clsx("flex-col border-t border-line", id ? "hidden lg:flex" : "flex")}>
            {pending.map((a) => (
              <li key={a.id} className="border-b border-line">
                <Link href={`/approvals?id=${a.id}`} scroll={false} className={clsx("relative block py-3 pl-3 pr-2 transition hover:bg-side", sel?.id === a.id && "bg-side")}>
                  {sel?.id === a.id && <span className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-ink" />}
                  <div className="text-[13.5px] font-medium leading-snug">{a.title}</div>
                  <div className="mt-0.5 truncate text-[12px] text-muted">{a.client}{a.due ? ` · due ${inDays(a.due)}` : ""}</div>
                </Link>
              </li>
            ))}
          </ul>
          {sel && (
            <div className={clsx("min-w-0 max-w-[760px]", !id && "hidden lg:block")}>
              <Link href="/approvals" className="mb-4 inline-flex items-center gap-1 text-[12.5px] text-muted lg:hidden"><ChevronLeft size={14} /> Review</Link>
              <p className="mb-1 text-[12.5px] text-muted"><Link href={`/cases/${sel.case_id}`} className="hover:text-ink hover:underline">{sel.client}</Link> · {sel.type_code} · {ago(sel.created_at)}</p>
              <h2 className="serif mb-2 text-[22px] font-medium leading-snug">{sel.title}</h2>
              <p className="max-w-[640px] text-[13.5px] leading-relaxed">{sel.brief}</p>
              {(sel.least_sure || sel.if_wrong) && (
                <dl className="mt-3 grid max-w-[640px] gap-1.5 text-[13px] leading-relaxed">
                  {sel.least_sure && <div className="flex gap-3"><dt className="w-[110px] shrink-0 text-faint">Lowest confidence</dt><dd>{sel.least_sure}</dd></div>}
                  {sel.if_wrong && <div className="flex gap-3"><dt className="w-[110px] shrink-0 text-faint">Risk if wrong</dt><dd>{sel.if_wrong}</dd></div>}
                </dl>
              )}
              <div className="mt-7">
                <ApprovalPanel key={sel.id} id={sel.id} caseId={sel.case_id} kind={sel.kind} payload={payload} message={message ? { party: message.party, party_role: message.party_role, subject: message.subject, body: message.body } : null} />
              </div>
            </div>
          )}
        </div>
      )}
      {decided.length > 0 && (
        <details className="mt-12">
          <summary className="cursor-pointer text-[13px] text-muted transition hover:text-ink">Decided · {decided.length}</summary>
          <ul className="mt-2 border-t border-line">
            {decided.map((a) => (
              <li key={a.id} className="flex items-center gap-4 border-b border-line py-2.5 text-[13px]">
                <span className="w-[72px] shrink-0 text-muted">{a.status === "approved" ? "Approved" : "Returned"}</span>
                <span className="min-w-0 flex-1 truncate">{a.title}</span>
                <span className="hidden truncate text-muted sm:block">{a.client}</span>
                <span className="shrink-0 text-[12px] text-faint">{a.decided_at ? ago(a.decided_at) : ""}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
