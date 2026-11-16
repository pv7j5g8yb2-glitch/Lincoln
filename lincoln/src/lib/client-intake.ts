import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "@cantoo/pdf-lib";
import { dataDir, db, uid } from "./db";
import { decrypt, encrypt } from "./storage";
import { UNNAMED, processCase } from "./intake";
import { typeOf } from "./library";
import { ABOUT, matterById, matterForCode, type Matter } from "./intake-matters";
import { isLawyerRole } from "./roles";
import { isAdmin } from "./session";
import { notify } from "./push";

// The client intake link. A firm has one link for its website, every member has their own (cases from it are
// theirs), and a case can have its own link, tied to that client and case type. The client answers the questions and sends documents; on Send the answers
// become a questionnaire page and, with the documents, go into the case, where Lincoln reads them like any file.

export type Link = { token: string; firm_id: string; case_id: string | null; user_id: string | null; firm: string; matter: Matter | null; client: string | null };

const now = () => new Date().toISOString();
const newToken = () => crypto.randomBytes(18).toString("base64url");
export const appUrl = () => (process.env.APP_URL ?? "").replace(/\/$/, "");
export const linkUrl = (token: string) => `${appUrl()}/intake/${token}`;

/** The firm's own link, made the first time it is asked for. */
export function firmLink(firmId: string) {
  const d = db();
  const row = d.prepare("SELECT token FROM intake_links WHERE firm_id = ? AND case_id IS NULL AND user_id IS NULL").get(firmId) as { token: string } | undefined;
  if (row) return row.token;
  const token = newToken();
  d.prepare("INSERT INTO intake_links (token, firm_id, case_id, created_at) VALUES (?, ?, NULL, ?)").run(token, firmId, now());
  return token;
}

/** A member's own link: cases that come through it are assigned to that person. */
export function memberLink(firmId: string, userId: string) {
  const d = db();
  const row = d.prepare("SELECT token FROM intake_links WHERE firm_id = ? AND user_id = ? AND case_id IS NULL").get(firmId, userId) as { token: string } | undefined;
  if (row) return row.token;
  const token = newToken();
  d.prepare("INSERT INTO intake_links (token, firm_id, case_id, user_id, created_at) VALUES (?, ?, NULL, ?, ?)").run(token, firmId, userId, now());
  return token;
}

/** A link for one case, made the first time it is asked for. */
export function caseLink(firmId: string, caseId: string) {
  const d = db();
  const row = d.prepare("SELECT token FROM intake_links WHERE firm_id = ? AND case_id = ?").get(firmId, caseId) as { token: string } | undefined;
  if (row) return row.token;
  const token = newToken();
  d.prepare("INSERT INTO intake_links (token, firm_id, case_id, created_at) VALUES (?, ?, ?, ?)").run(token, firmId, caseId, now());
  return token;
}

export function lookup(token: string): Link | null {
  if (!/^[\w-]{16,40}$/.test(token)) return null;
  const r = db().prepare("SELECT l.token, l.firm_id, l.case_id, l.user_id, f.name AS firm, f.demo, c.type_code, c.client FROM intake_links l JOIN firms f ON f.id = l.firm_id LEFT JOIN cases c ON c.id = l.case_id AND c.firm_id = l.firm_id WHERE l.token = ?").get(token) as { token: string; firm_id: string; case_id: string | null; user_id: string | null; firm: string; demo: number; type_code: string | null; client: string | null } | undefined;
  if (!r || r.demo) return null;
  if (r.case_id && r.type_code === null) return null; // the case was deleted
  return { token: r.token, firm_id: r.firm_id, case_id: r.case_id, user_id: r.user_id, firm: r.firm, matter: r.case_id ? matterForCode(r.type_code) : null, client: r.client && r.client !== UNNAMED ? r.client : null };
}

// Files sent before Send wait here, encrypted with the firm's key, under a session the client's browser keeps.
const sessionDir = (id: string) => path.join(dataDir(), "intake", id.replace(/[^\w-]/g, ""));
type FileMeta = { id: string; item: string; name: string };

export function newSession(link: Link) {
  const id = "s_" + crypto.randomBytes(12).toString("base64url");
  db().prepare("INSERT INTO intake_sessions (id, token, firm_id, case_id, files, status, created_at, updated_at) VALUES (?, ?, ?, ?, '[]', 'open', ?, ?)").run(id, link.token, link.firm_id, link.case_id, now(), now());
  return id;
}

function session(link: Link, id: string) {
  return db().prepare("SELECT id, files, status FROM intake_sessions WHERE id = ? AND token = ?").get(id, link.token) as { id: string; files: string; status: string } | undefined;
}

export const MAX_FILES = 40;
export const MAX_BYTES = 20 * 1024 * 1024;

export function addSessionFile(link: Link, sessionId: string, item: string, name: string, data: Buffer) {
  const s = session(link, sessionId);
  if (!s || s.status !== "open") return null;
  const files = JSON.parse(s.files) as FileMeta[];
  if (files.length >= MAX_FILES) return null;
  const id = uid();
  fs.mkdirSync(sessionDir(sessionId), { recursive: true });
  fs.writeFileSync(path.join(sessionDir(sessionId), id), encrypt(link.firm_id, data));
  files.push({ id, item: item.slice(0, 60), name: name.slice(0, 120) });
  db().prepare("UPDATE intake_sessions SET files = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(files), now(), sessionId);
  return id;
}

export function removeSessionFile(link: Link, sessionId: string, fileId: string) {
  const s = session(link, sessionId);
  if (!s || s.status !== "open") return;
  const files = (JSON.parse(s.files) as FileMeta[]).filter((f) => f.id !== fileId);
  fs.rmSync(path.join(sessionDir(sessionId), fileId.replace(/[^\w]/g, "")), { force: true });
  db().prepare("UPDATE intake_sessions SET files = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(files), now(), sessionId);
}

/** The answers as a plain questionnaire page, the first thing Lincoln reads in the case. */
async function questionnaire(firm: string, matter: Matter, answers: Record<string, string>, files: FileMeta[]) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const safe = (f: PDFFont, s: string) => { let o = ""; for (const ch of s) { try { f.encodeText(ch); o += ch; } catch { o += ch.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7e]/g, "?"); } } return o; };
  let page = pdf.addPage([612, 792]);
  let y = 740;
  const line = (text: string, f = font, size = 10.5, gap = 15) => {
    const words = safe(f, text).split(/\s+/);
    let cur = "";
    const flush = () => { if (y < 60) { page = pdf.addPage([612, 792]); y = 740; } page.drawText(cur, { x: 56, y, size, font: f, color: rgb(0.1, 0.1, 0.1) }); y -= gap; cur = ""; };
    for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (f.widthOfTextAtSize(t, size) > 500) flush(); cur = cur ? `${cur} ${w}` : w; }
    if (cur) flush();
  };
  line(`Client intake questionnaire: ${matter.label}`, bold, 13, 20);
  line(`Sent by the client through ${firm}'s intake link on ${now().slice(0, 10)}.`, font, 9.5, 22);
  for (const q of [...ABOUT, ...matter.questions]) {
    const v = (answers[q.id] ?? "").trim();
    if (!v && q.optional) continue;
    line(`${q.label}: ${v || "(not answered)"}`);
  }
  y -= 8;
  line("Documents sent with this questionnaire:", bold, 10.5, 16);
  for (const d of matter.documents) {
    const got = files.filter((f) => f.item === d.id).length;
    line(`${d.label}: ${got ? `${got} file${got > 1 ? "s" : ""}` : "not sent"}`);
  }
  return new Uint8Array(await pdf.save());
}

const clean = (v: unknown, max = 2000) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, max) : "");

/**
 * Send: the answers and files go into the linked case, or a new case is opened for a firm link. Lincoln then
 * reads everything as one file. Returns the case id.
 */
export async function submit(link: Link, sessionId: string, matterId: string, raw: Record<string, unknown>) {
  const s = session(link, sessionId);
  if (!s || s.status !== "open") throw new Error("closed");
  const matter = link.matter ?? matterById(matterId);
  if (!matter) throw new Error("matter");
  const answers: Record<string, string> = {};
  for (const q of [...ABOUT, ...matter.questions]) {
    const v = clean(raw[q.id], q.kind === "long" ? 4000 : 300);
    if (q.kind === "choice" && v && !q.options?.includes(v)) throw new Error("answers");
    if (!v && !q.optional) throw new Error("answers");
    answers[q.id] = v;
  }
  const files = JSON.parse(s.files) as FileMeta[];
  const blobs = files.map((f) => new Uint8Array(decrypt(link.firm_id, fs.readFileSync(path.join(sessionDir(sessionId), f.id)))));
  const first = await questionnaire(link.firm, matter, answers, files);
  const d = db();
  const email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(answers.email) ? answers.email.toLowerCase() : null;
  let caseId = link.case_id;
  if (caseId) {
    d.prepare("UPDATE cases SET client = CASE WHEN client = ? THEN ? ELSE client END, client_email = COALESCE(client_email, ?) WHERE id = ? AND firm_id = ?").run(UNNAMED, answers.name, email, caseId, link.firm_id);
  } else {
    // The firm's link (the website) goes to the firm's admin. A member's link makes the case theirs; when that
    // member is not a lawyer (a paralegal, a case manager), a lawyer at the firm is responsible, with them on it.
    const people = d.prepare("SELECT id, role FROM users WHERE firm_id = ? ORDER BY created_at").all(link.firm_id) as { id: string; role: string }[];
    const admin = people.find((p) => isAdmin(p.role)) ?? people[0];
    const member = link.user_id ? people.find((p) => p.id === link.user_id) : undefined;
    const lawyer = people.find((p) => isLawyerRole(p.role) && !isAdmin(p.role)) ?? admin;
    const attorney = member ? (isLawyerRole(member.role) ? member.id : lawyer?.id ?? member.id) : admin?.id ?? null;
    const paralegal = member?.id ?? attorney;
    const ty = typeOf(matter.code, matter.code ? null : "Client intake");
    caseId = "c_" + uid();
    d.prepare(`INSERT INTO cases (id, firm_id, ref, client, counterpart, type_code, type_name, family, stage, state, summary, attorney_id, paralegal_id, opened_at, sensitive, pages, processing, client_email)
      VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 'Intake', 'moving', ?, ?, ?, ?, ?, 0, 1, ?)`).run(caseId, link.firm_id, `${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`, answers.name, ty.code, ty.name, ty.family, `Opened from the client's intake: ${matter.label.toLowerCase()}.`, attorney, paralegal, now(), ty.family === "Humanitarian" ? 1 : 0, email);
  }
  const id = caseId;
  // Everyone the case is for hears about it when they are away: every admin for the firm's link, the member for
  // their own link. A case link's case is already someone's and shows in their Review as it is read.
  if (!link.case_id) {
    const to = link.user_id ? [link.user_id] : (d.prepare("SELECT id, role FROM users WHERE firm_id = ?").all(link.firm_id) as { id: string; role: string }[]).filter((u) => isAdmin(u.role)).map((u) => u.id);
    for (const u of to) notify(u, { title: "New client", body: `${answers.name}. ${matter.label}.`, url: `/cases/${id}`, tag: `intake:${id}` });
  }
  d.prepare("INSERT INTO activity (id, firm_id, case_id, at, actor, kind, text, minutes) VALUES (?, ?, ?, ?, 'Lincoln', 'file', ?, 5)").run(uid(), link.firm_id, id, now(), `${answers.name} sent the intake questionnaire${files.length ? ` and ${files.length === 1 ? "one document" : `${files.length} documents`}` : ""}.`);
  d.prepare("UPDATE cases SET processing = 1 WHERE id = ?").run(id);
  d.prepare("UPDATE intake_sessions SET status = 'sent', case_id = ?, updated_at = ? WHERE id = ?").run(id, now(), sessionId);
  fs.rmSync(sessionDir(sessionId), { recursive: true, force: true });
  const pages = (d.prepare("SELECT pages FROM cases WHERE id = ?").get(id) as { pages: number }).pages;
  void processCase(link.firm_id, id, [first, ...blobs], { append: pages > 0, fromClient: true }).catch(() => {
    d.prepare("UPDATE cases SET processing = 0 WHERE id = ?").run(id);
  });
  return id;
}

/** Files of sessions never sent are removed after 30 days. */
export function sweepSessions() {
  const d = db();
  const old = d.prepare("SELECT id FROM intake_sessions WHERE status = 'open' AND updated_at < ?").all(new Date(Date.now() - 30 * 86400_000).toISOString()) as { id: string }[];
  for (const s of old) { fs.rmSync(sessionDir(s.id), { recursive: true, force: true }); d.prepare("DELETE FROM intake_sessions WHERE id = ?").run(s.id); }
}

/** Removes every waiting file of a firm, for firm deletion. */
export function forgetFirmSessions(firmId: string) {
  const ids = db().prepare("SELECT id FROM intake_sessions WHERE firm_id = ?").all(firmId) as { id: string }[];
  for (const s of ids) fs.rmSync(sessionDir(s.id), { recursive: true, force: true });
}
