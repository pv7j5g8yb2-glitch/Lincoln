import { NextResponse } from "next/server";
import { limited } from "@/lib/auth";
import { clientIp } from "@/lib/audit";
import { fileKind } from "@/lib/pdf";
import { MAX_BYTES, addSessionFile, lookup, newSession, removeSessionFile, submit, submitMore } from "@/lib/client-intake";

// The client's side of the intake link: one document at a time, then Send. No account: the link is the key.
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const link = lookup((await ctx.params).token);
  if (!link) return NextResponse.json({ error: "This link is no longer active." }, { status: 404 });
  let ip = "";
  try { ip = await clientIp(); } catch { ip = ""; }

  if ((req.headers.get("content-type") ?? "").startsWith("multipart/form-data")) {
    if (limited(`intake-file:${ip}`, 150, 60 * 60_000)) return NextResponse.json({ error: "Too many files. Try again later." }, { status: 429 });
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "No file." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "This file is over 20 MB." }, { status: 400 });
    const data = Buffer.from(await file.arrayBuffer());
    if (!fileKind(data)) return NextResponse.json({ error: "Send a photo or a PDF." }, { status: 400 });
    const session = String(form.get("session") ?? "") || newSession(link);
    const id = addSessionFile(link, session, String(form.get("item") ?? ""), file.name, data);
    if (!id) return NextResponse.json({ error: "This file could not be added." }, { status: 400 });
    return NextResponse.json({ session, id });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (body.action === "remove") {
    removeSessionFile(link, String(body.session ?? ""), String(body.id ?? ""));
    return NextResponse.json({ ok: true });
  }
  if (body.action === "more") {
    if (limited(`intake-send:${ip}`, 10, 60 * 60_000)) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    try {
      await submitMore(link, String(body.session ?? ""));
      return NextResponse.json({ ok: true });
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      return NextResponse.json({ error: m === "empty" ? "Add a document first." : m === "closed" ? "This was already sent." : "Not sent. Try again." }, { status: 400 });
    }
  }
  if (body.action === "send") {
    if (limited(`intake-send:${ip}`, 10, 60 * 60_000)) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    const session = String(body.session ?? "") || newSession(link);
    try {
      await submit(link, session, String(body.matter ?? ""), (body.answers ?? {}) as Record<string, unknown>);
      return NextResponse.json({ ok: true });
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      return NextResponse.json({ error: m === "answers" ? "Some answers are missing." : m === "closed" ? "This was already sent." : "Not sent. Try again." }, { status: 400 });
    }
  }
  return NextResponse.json({ error: "Invalid request." }, { status: 400 });
}
