import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleInbound } from "@/lib/agent";
import { sha } from "@/lib/passwords";

// Inbound mail for firms on any mail system: a forwarding service (Postmark, Mailgun, CloudMailin or
// similar) posts each email here. The address is secret per firm; only its hash is stored.
type Postmark = { From?: string; FromName?: string; FromFull?: { Email?: string; Name?: string }; Subject?: string; TextBody?: string; MessageID?: string; Attachments?: { Name: string; Content: string; ContentType: string }[] };

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = db().prepare("SELECT firm_id FROM kv WHERE key = 'inbound_hash' AND value = ?").get(sha(token)) as { firm_id: string } | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (Number(req.headers.get("content-length") ?? 0) > 35 * 1024 * 1024) return NextResponse.json({ error: "Too large" }, { status: 413 });
  const body = (await req.json().catch(() => null)) as Postmark | null;
  if (!body) return NextResponse.json({ error: "Expected JSON" }, { status: 400 });
  const from = (body.FromFull?.Email ?? /<([^>]+)>/.exec(body.From ?? "")?.[1] ?? body.From ?? "").trim().toLowerCase();
  const mail = {
    id: body.MessageID ?? crypto.randomUUID(),
    threadId: "",
    from,
    fromName: body.FromFull?.Name || body.FromName || from,
    subject: String(body.Subject ?? ""),
    text: String(body.TextBody ?? "").slice(0, 20000),
    attachments: (body.Attachments ?? []).filter((a) => /pdf|^image\//i.test(a.ContentType) || /\.pdf$/i.test(a.Name)).slice(0, 20).map((a) => ({ name: a.Name, type: a.ContentType, data: Buffer.from(a.Content, "base64") })).filter((a) => a.type.includes("pdf") || a.data.length > 60_000),
  };
  void handleInbound(row.firm_id, mail, null);
  return NextResponse.json({ ok: true });
}
