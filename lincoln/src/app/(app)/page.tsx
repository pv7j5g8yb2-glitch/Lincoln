import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AskBox from "@/components/AskBox";
import { requireUser } from "@/lib/session";
import { activitySince, pendingApprovals } from "@/lib/queries";
import { firmMailbox } from "@/lib/integrations";
import { ago, inDays } from "@/lib/format";

export default async function Home() {
  const { firm, viewer } = await requireUser();
  const review = pendingApprovals(firm.id, viewer);
  const done = activitySince(firm.id, new Date(Date.now() - 48 * 3600_000).toISOString(), viewer).reverse().slice(0, 5);
  const mailbox = firmMailbox(firm.id);

  return (
    <div className="rise mx-auto max-w-[680px] pt-[6vh] md:pt-[11vh]">
      <h1 className="wordmark mb-8 text-center text-[40px] leading-none md:text-[46px]">Lincoln</h1>
      <AskBox />
      {!firm.demo && !mailbox && (
        <p className="mt-3 text-center text-[12.5px]">
          <Link href="/integrations" className="text-faint underline decoration-edge underline-offset-4 transition hover:text-ink">Connect mail</Link>
        </p>
      )}

      {review.length > 0 && (
      <section className="mt-14">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-[13px] font-medium">For review</h2>
          <Link href="/approvals" className="text-[12.5px] text-muted hover:text-ink">View all</Link>
        </div>
          <ul className="border-t border-line">
            {review.slice(0, 6).map((a) => (
              <li key={a.id} className="border-b border-line">
                <Link href={`/approvals?id=${a.id}`} className="group flex items-center gap-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px]">{a.title}</span>
                    <span className="block truncate text-[12.5px] text-muted">{a.client} · {a.type_code}</span>
                  </span>
                  {a.due && <span className="hidden shrink-0 text-[12.5px] text-faint sm:block">Due {inDays(a.due)}</span>}
                  <ChevronRight size={15} className="shrink-0 text-faint transition group-hover:text-ink" />
                </Link>
              </li>
            ))}
          </ul>
      </section>
      )}

      {done.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 text-[13px] font-medium">Done by Lincoln</h2>
          <ul className="border-t border-line">
            {done.map((a) => (
              <li key={a.id} className="flex items-baseline gap-4 border-b border-line py-2.5">
                <span className="min-w-0 flex-1 text-[13px] leading-relaxed">{a.case_id ? <Link href={`/cases/${a.case_id}?tab=activity`} className="hover:underline">{a.text}</Link> : a.text}{a.client ? <span className="text-faint"> · {a.client}</span> : null}</span>
                <span className="shrink-0 text-[12px] text-faint">{ago(a.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
