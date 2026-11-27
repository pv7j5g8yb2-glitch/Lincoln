import Link from "next/link";
import { Empty, PageHead, btn } from "@/components/ui";
import MessageList from "@/components/MessageList";
import { requireUser } from "@/lib/session";
import { caseById, inboxPage } from "@/lib/queries";
import { route } from "@/lib/routing";

export const metadata = { title: "Inbox" };

const PAGE = 100;

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  const { firm, viewer } = await requireUser();
  const { n } = await searchParams;
  const limit = Math.min(Math.max(Number(n) || PAGE, PAGE), 5000);
  const { unsorted, rows, more } = inboxPage(firm.id, viewer, limit);
  // For mail Lincoln could not sort: the cases it came closest to, offered first.
  const suggest: Record<string, { id: string; client: string; type_code: string; ref: string }[]> = {};
  for (const m of unsorted.slice(0, 20)) {
    const r = route(firm.id, { from: m.email, fromName: m.party, threadId: m.thread_id, subject: m.subject, text: m.body });
    suggest[m.id] = [...new Set([r.sure?.caseId, r.likely?.caseId, ...r.related].filter(Boolean) as string[])]
      .map((id) => caseById(firm.id, id, viewer)).filter(Boolean).slice(0, 3)
      .map((c) => ({ id: c!.id, client: c!.client, type_code: c!.type_code, ref: c!.ref }));
  }
  const items = [...unsorted, ...rows];
  return (
    <div className="rise">
      <PageHead title="Inbox" />
      {items.length === 0 ? <Empty page>No new mail yet</Empty> : <MessageList items={items} showCase suggest={suggest} />}
      {more && (
        <div className="mt-6 flex justify-center">
          <Link href={`/inbox?n=${limit + PAGE}`} scroll={false} className={btn.secondary}>Show more</Link>
        </div>
      )}
    </div>
  );
}
