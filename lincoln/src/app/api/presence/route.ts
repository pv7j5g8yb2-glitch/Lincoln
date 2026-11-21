import { apiUser } from "@/lib/session";
import { markPresence } from "@/lib/push";

// The open app reports that someone is looking at it, and when they leave. Notifications go only to
// people who are not in the app.
export async function POST(req: Request) {
  const s = await apiUser();
  if (!s) return new Response(null, { status: 204 });
  const body = await req.text().catch(() => "");
  markPresence(s.user.id, !/away/.test(body));
  return new Response(null, { status: 204 });
}
