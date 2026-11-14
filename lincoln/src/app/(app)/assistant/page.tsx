import AssistantChat from "@/components/AssistantChat";
import { requireUser } from "@/lib/session";
import { caseById, chatHistory } from "@/lib/queries";
import { llmConfigured } from "@/lib/llm";

export default async function Assistant({ searchParams }: { searchParams: Promise<{ q?: string; case?: string }> }) {
  const { user, firm, viewer } = await requireUser();
  const { q = "", case: caseId } = await searchParams;
  const c = caseId ? caseById(firm.id, caseId, viewer) : undefined;
  const scope = c ? { id: c.id, name: c.client } : null;
  return (
    <AssistantChat
      key={scope?.id ?? "firm"}
      initial={chatHistory(firm.id, user.id, scope?.id ?? null).map((m) => ({ role: m.role, content: m.content }))}
      q={q.slice(0, 2000)}
      connected={llmConfigured()}
      scope={scope}
    />
  );
}
