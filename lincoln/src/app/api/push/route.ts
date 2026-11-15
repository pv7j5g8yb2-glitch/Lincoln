import { apiUser } from "@/lib/session";
import { dropSubscription, saveSubscription, vapidPublicKey } from "@/lib/push";

// The device's notification subscription: the public key to subscribe with, saving and removing it.
const same = (req: Request) => !req.headers.get("sec-fetch-site") || req.headers.get("sec-fetch-site") === "same-origin";

export async function GET() {
  return Response.json({ key: vapidPublicKey() });
}

export async function POST(req: Request) {
  const s = await apiUser();
  if (!s) return new Response("Sign in first", { status: 401 });
  if (!same(req)) return new Response("Refused", { status: 403 });
  if (s.firm.demo) return new Response("Not in the sample workspace", { status: 403 });
  const body = await req.json().catch(() => ({}));
  return saveSubscription(s.firm.id, s.user.id, s.sessionId, body) ? Response.json({ ok: true }) : new Response("Not a subscription", { status: 400 });
}

export async function DELETE(req: Request) {
  const s = await apiUser();
  if (!s) return new Response("Sign in first", { status: 401 });
  if (!same(req)) return new Response("Refused", { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { endpoint?: string };
  dropSubscription(s.user.id, String(body.endpoint ?? ""));
  return Response.json({ ok: true });
}
