import { NextResponse } from "next/server";
import { apiUser } from "@/lib/session";
import { flightFor } from "@/lib/inflight";

// Stop: ends the reply being written in a chat and keeps what was written.
export async function POST(req: Request) {
  const s = await apiUser();
  if (!s) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { threadId } = (await req.json().catch(() => ({}))) as { threadId?: string };
  flightFor(String(threadId ?? ""), s.user.id)?.ctl.abort();
  return NextResponse.json({ ok: true });
}
