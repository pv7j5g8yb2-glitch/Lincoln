import IntegrationsPanel from "@/components/IntegrationsPanel";
import { PageHead } from "@/components/ui";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Integrations" };

export default async function Integrations({ searchParams }: { searchParams: Promise<{ connected?: string; error?: string; inbound?: string; recheck?: string }> }) {
  const { user, firm } = await requireUser();
  const { connected, error, inbound, recheck } = await searchParams;
  return (
    <div className="rise mx-auto max-w-[860px]">
      <PageHead title="Integrations" />
      <IntegrationsPanel user={user} firm={firm} connected={connected} error={error} inbound={inbound} recheck={Boolean(recheck)} />
    </div>
  );
}
