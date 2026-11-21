import { db } from "@/lib/db";
import { checkMailbox } from "@/lib/agent";
import { settingsOf, type Connection } from "@/lib/integrations";
import { clientState } from "@/lib/integrations/microsoft";

// Microsoft Graph calls this the moment mail lands in a connected inbox. Each notification carries
// the secret clientState given when the subscription was made; anything else is ignored.
export async function POST(req: Request) {
  const validation = new URL(req.url).searchParams.get("validationToken");
  if (validation) return new Response(validation, { status: 200, headers: { "Content-Type": "text/plain" } });
  const body = (await req.json().catch(() => null)) as { value?: { subscriptionId: string; clientState?: string }[] } | null;
  const conns = db().prepare("SELECT * FROM mailboxes WHERE provider = 'microsoft'").all() as Connection[];
  for (const n of body?.value ?? []) {
    const c = conns.find((x) => settingsOf(x).subId === n.subscriptionId);
    if (c && n.clientState === clientState(c)) void checkMailbox(c);
  }
  return new Response(null, { status: 202 });
}
