import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { limited } from "@/lib/auth";
import { clientIp } from "@/lib/audit";
import { approveAndSend, takeInstruction } from "@/lib/agent";
import { caseById } from "@/lib/queries";
import { viewer } from "@/lib/session";
import { endWord, redeemWordCode, wordUser } from "@/lib/word";

// What the Outlook add-in reads and does, beside the email open in Outlook: the case it belongs to, what Lincoln
// has done, and the reply waiting for approval. The add-in holds its own token, like the Word add-in.

const no = (error: string, status: number) => NextResponse.json({ error }, { status });
const now = () => new Date().toISOString();
type Draft = { id: string; party: string; email: string | null; subject: string; body: string; approval: string };

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return no("Invalid request", 400); }
  if (body.op === "pair") {
    let ip = "";
    try { ip = await clientIp(); } catch { ip = ""; }
    if (limited(`word-pair:${ip}`, 10, 15 * 60_000)) return no("Too many tries. Wait a few minutes.", 429);
    const token = redeemWordCode(String(body.code ?? ""), "outlook");
    return token ? NextResponse.json({ token }) : no("Code not valid", 400);
  }
  const s = wordUser(req);
  if (!s) return no("Not connected", 401);
  const F = s.firm.id, V = viewer(s.user), d = db();
  if (body.op === "me") return NextResponse.json({ name: s.user.name, firm: s.firm.name });
  if (body.op === "disconnect") { endWord(s.user.id, "outlook"); return NextResponse.json({ ok: true }); }

  if (body.op === "lookup") {
    // The email's case: by its conversation, else by the sender's address on a case or on earlier mail.
    const from = String(body.from ?? "").trim().toLowerCase().slice(0, 254);
    const conv = String(body.conversationId ?? "").slice(0, 400);
    const byThread = conv ? (d.prepare("SELECT case_id FROM messages WHERE firm_id = ? AND thread_id = ? AND case_id IS NOT NULL ORDER BY at DESC LIMIT 1").get(F, conv) as { case_id: string } | undefined) : undefined;
    const byClient = from ? (d.prepare("SELECT id AS case_id FROM cases WHERE firm_id = ? AND lower(client_email) = ? ORDER BY opened_at DESC LIMIT 1").get(F, from) as { case_id: string } | undefined) : undefined;
    const byMail = from ? (d.prepare("SELECT case_id FROM messages WHERE firm_id = ? AND lower(email) = ? AND case_id IS NOT NULL ORDER BY at DESC LIMIT 1").get(F, from) as { case_id: string } | undefined) : undefined;
    const c = caseById(F, (byThread ?? byClient ?? byMail)?.case_id ?? "", V);
    if (!c) return NextResponse.json({ case: null });
    const done = (d.prepare("SELECT text, at FROM activity WHERE firm_id = ? AND case_id = ? AND actor = 'Lincoln' ORDER BY at DESC LIMIT 4").all(F, c.id) as { text: string; at: string }[]);
    const drafts = (d.prepare(`SELECT m.id, m.party, m.email, m.subject, m.body, a.id AS approval FROM messages m JOIN approvals a ON a.firm_id = m.firm_id AND a.kind = 'message' AND a.status = 'pending' AND a.payload LIKE '%"messageId":"' || m.id || '"%'
      WHERE m.firm_id = ? AND m.case_id = ? AND m.direction = 'out' AND m.state = 'needs_approval' ORDER BY (m.thread_id = ?) DESC, (lower(COALESCE(m.email, '')) = ?) DESC, (m.party_role = 'Client') DESC, m.at DESC LIMIT 3`).all(F, c.id, conv, from) as Draft[]);
    return NextResponse.json({ case: { id: c.id, client: c.client, type: c.type_code, stage: c.stage, summary: c.summary }, done, drafts });
  }

  // The reply, as edited in the pane: Lincoln's copy and the mailbox draft both follow, and the edit teaches the firm's style.
  if (body.op === "save" || body.op === "approve") {
    const m = d.prepare("SELECT id, case_id, subject, body FROM messages WHERE firm_id = ? AND id = ? AND state = 'needs_approval'").get(F, String(body.messageId ?? "")) as { id: string; case_id: string; subject: string; body: string } | undefined;
    if (!m || !caseById(F, m.case_id, V)) return no("Not found", 404);
    const a = d.prepare("SELECT id, title FROM approvals WHERE firm_id = ? AND kind = 'message' AND status = 'pending' AND payload LIKE ?").get(F, `%"messageId":"${m.id}"%`) as { id: string; title: string } | undefined;
    if (!a) return no("Not found", 404);
    if (typeof body.body === "string" && body.body.trim() && body.body.trim() !== m.body.trim()) {
      const { recordEdit } = await import("@/lib/memory");
      const split = (t: string) => t.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
      if (!s.firm.demo) recordEdit(F, "email", split(m.body), split(body.body));
      d.prepare("UPDATE messages SET subject = ?, body = ? WHERE id = ?").run(String(body.subject ?? m.subject).trim().slice(0, 200) || m.subject, body.body.trim().slice(0, 20000), m.id);
      void import("@/lib/maildrafts").then((x) => x.pushEdit(F, m.id)).catch(() => undefined);
    }
    if (body.op === "save") return NextResponse.json({ ok: true });
    if (s.firm.demo) return no("Not available in the sample workspace", 400);
    const r = await approveAndSend(F, a.id, { id: s.user.id, name: s.user.name }, "Outlook");
    return r.sent ? NextResponse.json({ sent: true }) : NextResponse.json({ sent: false, error: `Not sent. ${r.reason}.` });
  }

  // An email that belongs to no case yet: Lincoln takes it like any instruction and opens or finds the case.
  if (body.op === "open") {
    if (s.firm.demo) return no("Not available in the sample workspace", 400);
    if (limited(`outlook-open:${s.user.id}`, 20, 60 * 60_000)) return no("Too many requests. Try again later.", 429);
    // Opened from Outlook by someone at the firm: the same as forwarding the email to Lincoln.
    const r = await takeInstruction(F, { id: s.user.id, name: s.user.name, role: s.user.role }, { text: String(body.text ?? "").slice(0, 8000), subject: String(body.subject ?? "").slice(0, 200), from: String(body.from ?? "").slice(0, 254), fromName: String(body.fromName ?? "").slice(0, 120), files: [], via: "email" });
    return r.caseId ? NextResponse.json({ caseId: r.caseId }) : no("No case", 400);
  }
  return no("Unknown request", 400);
}
