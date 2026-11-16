import { NextResponse } from "next/server";
import { db, uid } from "@/lib/db";
import { limited, validEmail } from "@/lib/auth";
import { clientIp } from "@/lib/audit";
import { mailConfigured, sendSystemMail } from "@/lib/mailer";
import { QUESTIONS } from "@/lib/enquiry";

// The Get started form on uselincoln.com. Each enquiry is saved and emailed to hello@uselincoln.com, where the reply
// with a quote and next steps is written by a person.
const INBOX = "hello@uselincoln.com";
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, max) : "");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid form." }, { status: 400 }); }
  // A field people never see: anything filling it in is a bot, and is told it worked.
  if (clean(body.website, 200)) return NextResponse.json({ ok: true });
  let ip = "";
  try { ip = await clientIp(); } catch { ip = ""; }
  if (limited(`enquiry:${ip}`, 5, 60 * 60_000)) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const name = clean(body.name, 120), email = clean(body.email, 200).toLowerCase(), firm = clean(body.firm, 160);
  if (!name || !firm || !validEmail(email)) return NextResponse.json({ error: "Name, work email and firm are required." }, { status: 400 });
  const answers: Record<string, string | string[]> = {};
  for (const q of QUESTIONS) {
    const v = body[q.id];
    if (q.multi) {
      const list = Array.isArray(v) ? v.map((x) => clean(x, 60)).filter((x) => q.options.includes(x)) : [];
      if (!list.length) return NextResponse.json({ error: "Answer every question." }, { status: 400 });
      answers[q.id] = list;
    } else {
      const one = clean(v, 60);
      if (!q.options.includes(one)) return NextResponse.json({ error: "Answer every question." }, { status: 400 });
      answers[q.id] = one;
    }
  }
  const notes = clean(body.notes, 2000);
  if (notes) answers.notes = notes;

  db().prepare("INSERT INTO enquiries (id, at, name, email, firm, answers, ip) VALUES (?, ?, ?, ?, ?, ?, ?)").run(uid(), new Date().toISOString(), name, email, firm, JSON.stringify(answers), ip);

  if (mailConfigured()) {
    const lines = [`Name: ${name}`, `Email: ${email}`, `Firm: ${firm}`, ""];
    for (const q of QUESTIONS) { const v = answers[q.id]; lines.push(`${q.label}: ${Array.isArray(v) ? v.join(", ") : v}`); }
    if (notes) lines.push("", "Anything else:", notes);
    try { await sendSystemMail(INBOX, `New enquiry: ${firm}`, lines.join("\n"), email); }
    catch (e) { console.error("enquiry mail failed:", (e as Error).message); }
  } else console.warn("enquiry saved; no mail provider configured to forward it");
  return NextResponse.json({ ok: true });
}
