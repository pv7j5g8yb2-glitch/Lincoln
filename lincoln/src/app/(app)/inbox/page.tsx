import { Empty, PageHead } from "@/components/ui";
import MessageList from "@/components/MessageList";
import { requireUser } from "@/lib/session";
import { cases, messages } from "@/lib/queries";

export default async function InboxPage() {
  const { firm, viewer } = await requireUser();
  const all = messages(firm.id, viewer);
  return (
    <div className="rise">
      <PageHead title="Inbox" />
      {all.length === 0 ? <Empty>No case mail</Empty> : <MessageList items={all} showCase cases={all.some((m) => m.state === "unsure") ? cases(firm.id, viewer).map((c) => ({ id: c.id, client: c.client, type_code: c.type_code })) : []} />}
    </div>
  );
}
