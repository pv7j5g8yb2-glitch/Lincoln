import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { checkMailbox } from "@/lib/agent";
import type { Connection } from "@/lib/integrations";

// Google Pub/Sub calls this the moment Gmail receives new inbox mail. The token in the address is
// shared only with the Pub/Sub subscription. The message names the mailbox; Lincoln then fetches the
// mail itself, so nothing in the notification is trusted beyond "look now".
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const expected = process.env.GOOGLE_PUSH_TOKEN ?? "";
  if (!expected || token.length !== expected.length || !timingSafeEqual(Buffer.from(token), Buffer.from(expected))) return new Response("Forbidden", { status: 403 });
  const body = (await req.json().catch(() => null)) as { message?: { data?: string } } | null;
  let email = "";
  try { email = String(JSON.parse(Buffer.from(body?.message?.data ?? "", "base64").toString("utf8")).emailAddress ?? "").toLowerCase(); } catch { /* ignore */ }
  const conns = db().prepare("SELECT * FROM mailboxes WHERE provider = 'google' AND email = ?").all(email) as Connection[];
  for (const c of conns) void checkMailbox(c);
  return new NextResponse(null, { status: 204 });
}
