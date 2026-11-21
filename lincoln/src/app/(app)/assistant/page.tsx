import AssistantChat from "@/components/AssistantChat";
import { requireUser } from "@/lib/session";
import { caseById, chatThread, chatThreads, threadMessages } from "@/lib/queries";
import { llmConfigured } from "@/lib/llm";
import { flightFor } from "@/lib/inflight";

export default async function Assistant({ searchParams }: { searchParams: Promise<{ q?: string; case?: string; t?: string }> }) {
  const { user, firm, viewer } = await requireUser();
  const { q = "", case: caseId, t } = await searchParams;
  const c = caseId ? caseById(firm.id, caseId, viewer) : undefined;
  const scope = c ? { id: c.id, name: c.client } : null;
  const thread = t ? chatThread(firm.id, user.id, t) : undefined;
  const open = thread && thread.case_id === (scope?.id ?? null) ? thread : undefined;
  return (
    <AssistantChat
      key={`${scope?.id ?? "firm"}:${open?.id ?? "new"}`}
      thread={open ? { id: open.id, title: open.title } : null}
      threads={chatThreads(firm.id, user.id, scope?.id ?? null).map((x) => ({ id: x.id, title: x.title }))}
      initial={open ? threadMessages(firm.id, user.id, open.id).map((m) => ({ id: m.id, role: m.role, content: m.content })) : []}
      q={q.slice(0, 2000)}
      connected={llmConfigured()}
      scope={scope}
      writing={open ? flightFor(open.id, user.id)?.text ?? null : null}
    />
  );
}
