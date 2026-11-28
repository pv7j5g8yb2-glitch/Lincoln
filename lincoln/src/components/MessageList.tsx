import Link from "next/link";
import type { Message } from "@/lib/queries";
import { ago } from "@/lib/format";
import CasePicker from "./CasePicker";

/** Case mail, newest first. A row opens to the full message. */
export default function MessageList({ items, showCase = false, suggest = {} }: { items: (Message & { client?: string | null })[]; showCase?: boolean; suggest?: Record<string, { id: string; client: string; type_code: string; ref: string }[]> }) {
  return (
    <ul className="border-t border-line">
      {items.map((m) => {
        const state = m.state === "needs_approval" ? "Awaiting approval" : m.direction === "in" ? (m.state === "reading" ? "Reading" : m.state === "unsure" ? "Not sorted" : "Received") : m.state === "approved" ? "Approved, not sent" : m.state === "returned" ? "Discarded" : "Sent";
        const strong = m.state === "needs_approval" || m.state === "unsure";
        return (
          <li key={m.id} className="border-b border-line">
            <details className="group">
              <summary className="cursor-pointer list-none py-4 [&::-webkit-details-marker]:hidden">
                <div className="flex flex-wrap items-baseline gap-x-2 text-[12.5px]">
                  <span className="font-medium">{m.direction === "in" ? m.party : `To ${m.party}`}</span>
                  {showCase && m.case_id && m.client ? (m.client === m.party ? null : <Link href={`/cases/${m.case_id}?tab=messages`} className="text-muted hover:text-ink hover:underline">{m.client}</Link>) : <span className="text-faint">{m.party_role}</span>}
                  <span className="ml-auto text-faint">
                    {strong ? (m.state === "needs_approval" ? <Link href="/approvals" className="font-medium text-ink">{state}</Link> : <span className="font-medium text-ink">{state}</span>) : state} · {ago(m.at)}
                  </span>
                </div>
                <div className="mt-1 text-[13.5px]">{m.subject}</div>
                <p className="mt-0.5 line-clamp-1 max-w-[760px] text-[13px] leading-relaxed text-muted group-open:hidden">{m.body.replace(/\s+/g, " ")}</p>
              </summary>
              {m.lincoln_note && <p className="mb-3 max-w-[720px] text-[12.5px] text-muted">{m.lincoln_note}</p>}
              <p className="mb-4 max-w-[720px] whitespace-pre-line text-[13.5px] leading-relaxed">{m.body}</p>
              {m.state === "unsure" && <CasePicker messageId={m.id} suggested={suggest[m.id] ?? []} />}
            </details>
          </li>
        );
      })}
    </ul>
  );
}
