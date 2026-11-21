import IntegrationsPanel from "@/components/IntegrationsPanel";
import { PageHead } from "@/components/ui";
import { requireUser } from "@/lib/session";

export default async function Integrations({ searchParams }: { searchParams: Promise<{ connected?: string; error?: string; inbound?: string; recheck?: string }> }) {
  const { user, firm } = await requireUser();
  const { connected, error, inbound, recheck } = await searchParams;
  return (
    <div className="rise max-w-[860px]">
      <PageHead title="Integrations" />
      <IntegrationsPanel user={user} firm={firm} connected={connected} error={error} inbound={inbound} recheck={Boolean(recheck)} />
    </div>
  );
}
