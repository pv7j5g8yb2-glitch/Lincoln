"use server";

import { cookies } from "next/headers";
import { hashPassword, initialsOf, limited, newToken, sha, validEmail, validPassword, verifyPassword } from "./auth";
import { mailConfigured as systemMailConfigured, sendSystemMail } from "./mailer";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, resetDemo, uid } from "./db";
import { COOKIE, MFA_COOKIE, isAdmin, requireUser } from "./session";
import { clientIp, securityEvent } from "./audit";
import { beginChallenge, createSession } from "./login";
import { verify as verifyTotp } from "./totp";
import { open as openSecret } from "./secret";
import { DEMO_USER } from "./seed";
import { approvalById, caseById, kv, messageById, setKv } from "./queries";
import { buildHalaszLetter } from "./letter";
import { EVENTS } from "./demo-events";
import type { Question } from "./halasz";
import { LIBRARY } from "./library";
import { draftForCase, processCase } from "./intake";
import { fileKind } from "./pdf";
import { breached } from "./pwned";
import { llmConfigured } from "./llm";
import { deliver, takeInstruction } from "./agent";
import { randomBytes } from "node:crypto";
import { newSecret as newTotpSecret } from "./totp";
import { seal as sealSecret } from "./secret";
import { deleteCaseFiles, forgetFirmKey } from "./storage";

const now = () => new Date().toISOString();
const day = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const startSession = createSession;
const clientKey = clientIp;

export async function signInDemo() {
  if (limited(`demo:${await clientKey()}`, 20)) redirect("/signin?error=limited");
  await startSession(DEMO_USER);
  redirect("/");
}

export async function signIn(form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(form.get("password") ?? "").slice(0, 200);
  if (limited(`in:${email}`) || limited(`in:${await clientKey()}`, 30)) redirect("/signin?error=limited");
  const u = db().prepare("SELECT id, firm_id, password_hash, totp_enc FROM users WHERE email = ?").get(email) as { id: string; firm_id: string; password_hash: string | null; totp_enc: string | null } | undefined;
  if (!verifyPassword(password, u?.password_hash ?? null) || !u) {
    if (u) await securityEvent(u.firm_id, u.id, "sign_in_failed");
    redirect("/signin?error=invalid");
  }
  if (u.totp_enc) {
    // Password correct; the second step decides. The challenge lasts five minutes and five tries.
    redirect(await beginChallenge(u.id));
  }
  await securityEvent(u.firm_id, u.id, "sign_in");
  await startSession(u.id);
  redirect("/");
}

export async function verifySignInCode(form: FormData) {
  const jar = await cookies();
  const token = jar.get(MFA_COOKIE)?.value ?? "";
  const d = db();
  const ch = d.prepare("SELECT user_id, expires_at, attempts FROM login_challenges WHERE token_hash = ?").get(sha(token)) as { user_id: string; expires_at: string; attempts: number } | undefined;
  if (!ch || ch.expires_at < now() || ch.attempts >= 5) {
    if (ch) d.prepare("DELETE FROM login_challenges WHERE token_hash = ?").run(sha(token));
    jar.delete(MFA_COOKIE);
    redirect("/signin?error=expired");
  }
  d.prepare("UPDATE login_challenges SET attempts = attempts + 1 WHERE token_hash = ?").run(sha(token));
  const u = d.prepare("SELECT id, firm_id, totp_enc, totp_last_step, recovery FROM users WHERE id = ?").get(ch.user_id) as { id: string; firm_id: string; totp_enc: string; totp_last_step: number | null; recovery: string | null };
  const code = String(form.get("code") ?? "").trim().slice(0, 40);
  const step = verifyTotp(openSecret(u.totp_enc), code, u.totp_last_step);
  let ok = step !== null;
  if (ok) d.prepare("UPDATE users SET totp_last_step = ? WHERE id = ?").run(step, u.id);
  else {
    // A recovery code works once.
    const codes = JSON.parse(u.recovery ?? "[]") as string[];
    const h = sha(code.toUpperCase().replace(/[^A-Z0-9]/g, ""));
    if (codes.includes(h)) {
      ok = true;
      d.prepare("UPDATE users SET recovery = ? WHERE id = ?").run(JSON.stringify(codes.filter((c) => c !== h)), u.id);
      await securityEvent(u.firm_id, u.id, "recovery_code_used", `${codes.length - 1} left`);
    }
  }
  if (!ok) {
    await securityEvent(u.firm_id, u.id, "sign_in_code_failed");
    redirect("/signin/code?error=code");
  }
  d.prepare("DELETE FROM login_challenges WHERE token_hash = ?").run(sha(token));
  jar.delete(MFA_COOKIE);
  await securityEvent(u.firm_id, u.id, "sign_in", "with two step code");
  await startSession(u.id);
  redirect("/");
}

export async function signUp(form: FormData) {
  const name = String(form.get("name") ?? "").trim().slice(0, 100);
  const firmName = String(form.get("firm") ?? "").trim().slice(0, 120);
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (limited(`up:${await clientKey()}`, 10)) redirect("/signup?error=limited");
  if (!name || !firmName || !validEmail(email)) redirect("/signup?error=fields");
  if (!validPassword(password)) redirect("/signup?error=password");
  const d = db();
  if (d.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) redirect("/signup?error=exists");
  if (await breached(password)) redirect("/signup?error=breached");
  const firmId = "f_" + uid();
  const userId = "u_" + uid();
  d.transaction(() => {
    d.prepare("INSERT INTO firms (id, name, demo) VALUES (?, ?, 0)").run(firmId, firmName);
    d.prepare("INSERT INTO users (id, firm_id, name, email, role, initials, password_hash, created_at) VALUES (?, ?, ?, ?, 'Administrator', ?, ?, ?)").run(userId, firmId, name, email, initialsOf(name), hashPassword(password), now());
  })();
  await securityEvent(firmId, userId, "account_created");
  await startSession(userId);
  redirect("/");
}

export async function requestReset(form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (limited(`fp:${email}`, 5) || limited(`fp:${await clientKey()}`, 15)) redirect("/forgot?error=limited");
  const u = db().prepare("SELECT id FROM users WHERE email = ? AND password_hash IS NOT NULL").get(email) as { id: string } | undefined;
  let preview = "";
  if (u) {
    const token = newToken();
    db().prepare("INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(sha(token), u.id, new Date(Date.now() + 3600_000).toISOString());
    const link = `${(process.env.APP_URL ?? "").replace(/\/$/, "")}/reset/${token}`;
    const firm = (db().prepare("SELECT firm_id FROM users WHERE id = ?").get(u.id) as { firm_id: string }).firm_id;
    await securityEvent(firm, u.id, "password_reset_requested");
    if (systemMailConfigured()) {
      try { await sendSystemMail(email, "Reset your Lincoln password", `A password reset was requested for your Lincoln account.\n\nThis link works once, for one hour:\n${link}\n\nIf you did not ask for this, ignore this email; nothing changes.`); } catch { /* the page says the same either way */ }
    } else if (process.env.NODE_ENV !== "production") {
      // Development only: with no mail provider the link is shown so the flow can be tested.
      // In production it is never shown, or anyone could reset anyone's password.
      preview = `&preview=${token}`;
    }
  }
  redirect(`/forgot?sent=1${preview}`);
}

export async function resetPassword(form: FormData) {
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  if (!validPassword(password)) redirect(`/reset/${encodeURIComponent(token)}?error=password`);
  if (await breached(password)) redirect(`/reset/${encodeURIComponent(token)}?error=breached`);
  const d = db();
  if (limited(`rs:${await clientKey()}`, 20)) redirect("/forgot?error=limited");
  const r = d.prepare("SELECT user_id FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?").get(sha(token), now()) as { user_id: string } | undefined;
  if (!r) redirect("/forgot?error=expired");
  const fid = (d.prepare("SELECT firm_id FROM users WHERE id = ?").get(r.user_id) as { firm_id: string }).firm_id;
  await securityEvent(fid, r.user_id, "password_reset");
  d.transaction(() => {
    d.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(password), r.user_id);
    d.prepare("UPDATE password_resets SET used_at = ? WHERE user_id = ? AND used_at IS NULL").run(now(), r.user_id);
    d.prepare("DELETE FROM sessions WHERE user_id = ?").run(r.user_id);
  })();
  redirect("/signin?reset=1");
}

export async function signOut() {
  const jar = await cookies();
  const sid = jar.get(COOKIE)?.value;
  if (sid) db().prepare("DELETE FROM sessions WHERE id = ?").run(sha(sid));
  jar.delete(COOKIE);
  jar.delete(MFA_COOKIE);
  redirect("/signin");
}

function log(firm: string, caseId: string | null, actor: string, kind: string, text: string, minutes = 0) {
  db().prepare("INSERT INTO activity (id, firm_id, case_id, at, actor, kind, text, minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(uid(), firm, caseId, now(), actor, kind, text, minutes);
}

export async function answerQuestion(approvalId: string, qid: string, answer: "yes" | "no" | "change", note?: string) {
  const { firm, viewer } = await requireUser();
  const a = approvalById(firm.id, approvalId, viewer);
  if (!a || a.status !== "pending" || a.kind !== "decisions") return;
  const payload = JSON.parse(a.payload) as { questions: Question[] };
  const q = payload.questions.find((x) => x.id === qid);
  if (!q) return;
  q.answer = answer;
  q.note = (note ?? "").slice(0, 500);
  db().prepare("UPDATE approvals SET payload = ? WHERE firm_id = ? AND id = ?").run(JSON.stringify(payload), firm.id, approvalId);
  revalidatePath("/", "layout");
}

export async function acceptAllRecommended(approvalId: string) {
  const { firm, viewer } = await requireUser();
  const a = approvalById(firm.id, approvalId, viewer);
  if (!a || a.status !== "pending" || a.kind !== "decisions") return;
  const payload = JSON.parse(a.payload) as { questions: Question[] };
  for (const q of payload.questions) if (!q.answer) q.answer = q.recommend;
  db().prepare("UPDATE approvals SET payload = ? WHERE firm_id = ? AND id = ?").run(JSON.stringify(payload), firm.id, approvalId);
  revalidatePath("/", "layout");
}

export async function decideApproval(approvalId: string, decision: "approved" | "rejected", edit?: { subject: string; body: string }) {
  const { user, firm, viewer } = await requireUser();
  const d = db();
  const a = approvalById(firm.id, approvalId, viewer);
  if (!a || a.status !== "pending") return;
  const F = firm.id;
  const payload = JSON.parse(a.payload);

  const tx = d.transaction(() => {
    // An email is sent as the attorney left it; a returned one is never sent.
    if (a.kind === "message" && payload.messageId) {
      if (decision === "approved" && edit && edit.body.trim()) d.prepare("UPDATE messages SET subject = ?, body = ? WHERE firm_id = ? AND id = ? AND state = 'needs_approval'").run(edit.subject.trim().slice(0, 200) || "(no subject)", edit.body.trim().slice(0, 20000), F, payload.messageId);
      if (decision === "rejected") d.prepare("UPDATE messages SET state = 'returned' WHERE firm_id = ? AND id = ? AND state = 'needs_approval'").run(F, payload.messageId);
    }
    if (a.kind === "decisions" && decision === "approved") {
      const qs = payload.questions as Question[];
      if (qs.some((q) => !q.answer)) throw new Error("Every decision must be answered first.");
      const answers = Object.fromEntries(qs.map((q) => [q.id, q.answer as string]));
      log(F, a.case_id, user.name, "decide", `Answered ${qs.length} strategy decisions.`);
      // criteria follow the attorney's answers
      for (const q of qs.filter((x) => /^B\d$/.test(x.id))) {
        const row = d.prepare("SELECT id, evidence FROM criteria WHERE firm_id = ? AND case_id = ? AND code = ?").get(F, a.case_id, q.id) as { id: string; evidence: string } | undefined;
        if (!row) continue;
        const ev = (JSON.parse(row.evidence) as { grade: number }[]).map((e) => (q.answer === "yes" && e.grade === 4 ? { ...e, grade: 5 } : e));
        d.prepare("UPDATE criteria SET recommendation = ?, evidence = ? WHERE id = ?").run(q.answer === "yes" ? "claim" : q.answer === "no" ? "no" : "more", JSON.stringify(ev), row.id);
      }
      if (answers.FIG === "yes") d.prepare("UPDATE issues SET status = 'resolved', resolution = ?, resolved_at = ? WHERE firm_id = ? AND case_id = ? AND id IN ('i_title','i_citations','i_stars','i_headcount')").run(`Decided by ${user.name}: use the dated or signed source.`, now(), F, a.case_id);
      if (answers.OUT === "yes") d.prepare("UPDATE issues SET status = 'resolved', resolution = ?, resolved_at = ? WHERE firm_id = ? AND case_id = ? AND id = 'i_ferrante'").run(`Decided by ${user.name}: the unsigned draft is left out.`, now(), F, a.case_id);
      d.prepare("UPDATE issues SET status = 'resolved', resolution = 'Handled in the letter: stated exactly as the source says.', resolved_at = ? WHERE firm_id = ? AND case_id = ? AND id IN ('i_kinome','i_w2','i_delaney')").run(now(), F, a.case_id);

      if (a.case_id === "c_halasz") {
        const letter = buildHalaszLetter(answers);
        const draftId = uid();
        d.prepare("INSERT INTO drafts (id, firm_id, case_id, title, kind, status, version, content, updated_at) VALUES (?, ?, ?, 'Petition support letter', 'letter', 'for_review', 1, ?, ?)").run(draftId, F, a.case_id, JSON.stringify(letter), now());
        log(F, a.case_id, "Lincoln", "draft", `Wrote the support letter from ${user.name.split(" ")[0]}'s decisions: ${letter.claimed.length} criteria argued, ${letter.facts} facts each linked to its page, ${letter.calls} judgment calls marked.`, 240);
        d.prepare("INSERT INTO approvals (id, firm_id, case_id, kind, title, brief, least_sure, if_wrong, payload, status, assignee_id, created_at, due) VALUES (?, ?, ?, 'draft_review', ?, ?, ?, ?, ?, 'pending', ?, ?, ?)").run(
          uid(), F, a.case_id, "Support letter for review",
          `Drafted from ${qs.length} recorded decisions: ${letter.facts} sourced facts, ${letter.calls} judgment calls, ${letter.notes} attorney notes.`,
          "The final merits paragraph: the one place where the argument is Lincoln's wording, not a fact from the file.",
          null,
          JSON.stringify({ draftId }), user.id, now(), day(3));
        d.prepare("UPDATE cases SET stage = 'Review', summary = ?, waiting_on = ? WHERE firm_id = ? AND id = ?").run(`Support letter written from ${user.name.split(" ")[0]}'s decisions and waiting for review. The consultation and the passport renewal are still open.`, `${user.name}: review the letter`, F, a.case_id);
      }
    } else if (a.kind === "message" && decision === "approved" && !firm.demo) {
      log(F, a.case_id, user.name, "decide", `Approved: ${a.title}.`);
    } else if (a.kind === "message" && decision === "approved") {
      const m = messageById(F, payload.messageId);
      if (m) {
        d.prepare("UPDATE messages SET state = 'sent', at = ?, lincoln_note = ? WHERE firm_id = ? AND id = ?").run(now(), `Approved by ${user.name} and sent.`, F, m.id);
        log(F, a.case_id, "Lincoln", "send", `Sent "${m.subject}" to ${m.party} after ${user.name.split(" ")[0]} approved it.`, 5);
      }
    } else if (a.kind === "draft_review" && decision === "approved") {
      d.prepare("UPDATE drafts SET status = 'approved', updated_at = ? WHERE firm_id = ? AND id = ?").run(now(), F, payload.draftId);
      log(F, a.case_id, user.name, "decide", `Approved: ${a.title}.`);
      if (firm.demo) d.prepare("UPDATE cases SET summary = 'Support letter approved. The consultation and the passport renewal are still open.', waiting_on = 'Peer group: advisory opinion' WHERE firm_id = ? AND id = ?").run(F, a.case_id);
    } else if (decision === "rejected") {
      log(F, a.case_id, user.name, "decide", `Sent back: ${a.title}.`);
    }
    d.prepare("UPDATE approvals SET status = ?, decided_at = ?, decided_by = ? WHERE firm_id = ? AND id = ?").run(decision, now(), user.id, F, approvalId);
    const left = d.prepare("SELECT COUNT(*) AS n FROM approvals WHERE firm_id = ? AND case_id = ? AND status = 'pending'").get(F, a.case_id) as { n: number };
    d.prepare("UPDATE cases SET state = ? WHERE firm_id = ? AND id = ?").run(left.n > 0 ? "needs_you" : "moving", F, a.case_id);
  });
  tx();
  if (a.kind === "message" && decision === "approved" && !firm.demo && payload.messageId) await deliver(F, payload.messageId, { id: user.id, name: user.name });
  revalidatePath("/", "layout");
}

export async function advanceDemo() {
  const { firm } = await requireUser();
  if (firm.demo !== 1) return;
  const step = Number(kv(firm.id, "demo_step") ?? "0");
  const ev = EVENTS[step];
  if (!ev) return;
  const d = db();
  d.transaction(() => {
    ev.run({ d, firm: firm.id, now: now(), day });
    setKv(firm.id, "demo_step", String(step + 1));
  })();
  revalidatePath("/", "layout");
}

export async function resetDemoAction() {
  const { firm } = await requireUser();
  if (firm.demo !== 1) return;
  resetDemo(firm.id);
  (await cookies()).delete(COOKIE);
  redirect("/signin");
}

/** New case from one prompt: Lincoln reads what was typed and any files, then opens and works the case. */
export async function startCase(form: FormData) {
  const { user, firm, viewer } = await requireUser();
  const text = String(form.get("text") ?? "").trim().slice(0, 8000);
  const names = form.getAll("file").filter((f): f is File => f instanceof File && f.size > 0).map((f) => f.name.slice(0, 120));
  if (firm.demo) redirect("/cases/new?error=sample");
  if (limited(`case:${user.id}`, 20)) redirect("/cases/new?error=limited");
  const got = await uploads(form);
  if (got === "size") redirect("/cases/new?error=size");
  if (got === "type") redirect("/cases/new?error=type");
  if (!text && !got.length) redirect("/cases/new");
  if (!llmConfigured()) redirect("/cases/new?error=model");
  let caseId: string | null = null;
  try {
    // From a case's own chat, the files and words belong to that case.
    const scoped = String(form.get("case") ?? "");
    const only = scoped ? caseById(firm.id, scoped, viewer) : undefined;
    const open = only ? [{ id: only.id, ref: only.ref, client: only.client, client_email: only.client_email ?? null, counterpart: only.counterpart, type_code: only.type_code }] : undefined;
    const r = await takeInstruction(firm.id, { id: user.id, name: user.name, role: user.role }, { text: only ? `About ${only.client} (case ${only.id}): ${text}` : text, files: got.map((data, i) => ({ name: names[i] ?? `file ${i + 1}`, data })), via: "app" }, open);
    caseId = r.caseId;
    void r.work;
  } catch (e) {
    redirect(`/cases/new?error=${e instanceof Error && /budget/i.test(e.message) ? "budget" : "failed"}`);
  }
  revalidatePath("/", "layout");
  if (!caseId) redirect(`/assistant?q=${encodeURIComponent(text)}`);
  redirect(`/cases/${caseId}`);
}

export async function requestDraft(caseId: string, form: FormData) {
  const { firm, viewer } = await requireUser();
  if (!caseById(firm.id, caseId, viewer)) redirect("/cases");
  const request = String(form.get("request") ?? "").trim().slice(0, 600);
  const c = db().prepare("SELECT pages FROM cases WHERE firm_id = ? AND id = ?").get(firm.id, caseId) as { pages: number } | undefined;
  if (!c || !request || c.pages < 1) return;
  const draftId = uid();
  db().prepare("INSERT INTO drafts (id, firm_id, case_id, title, kind, status, version, content, updated_at) VALUES (?, ?, ?, ?, 'generic', 'drafting', 1, ?, ?)").run(draftId, firm.id, caseId, request.slice(0, 160), JSON.stringify({ sections: [], facts: 0, calls: 0, notes: 0, claimed: [], generic: true }), now());
  void draftForCase(firm.id, caseId, draftId, request);
  revalidatePath("/", "layout");
  redirect(`/cases/${caseId}?tab=drafts&draft=${draftId}`);
}

/** The sample workspace is shared by every visitor: no uploads, connections or profile changes. */
function notInSample(firm: { demo: number }, back: string) {
  if (firm.demo) redirect(`${back}${back.includes("?") ? "&" : "?"}error=sample`);
}

export async function updateProfile(form: FormData) {
  const { user, firm } = await requireUser();
  notInSample(firm, "/settings?tab=profile");
  const name = String(form.get("name") ?? "").trim().slice(0, 100);
  const role = String(form.get("role") ?? "").trim().slice(0, 60);
  const avatar = String(form.get("avatar") ?? "");
  if (!name) redirect("/settings?tab=profile&error=name");
  const d = db();
  d.prepare("UPDATE users SET name = ?, initials = ?, role = ? WHERE id = ?").run(name, initialsOf(name), role || user.role, user.id);
  if (avatar === "remove") d.prepare("UPDATE users SET avatar = NULL WHERE id = ?").run(user.id);
  else if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(avatar) && avatar.length < 400_000) d.prepare("UPDATE users SET avatar = ? WHERE id = ?").run(avatar, user.id);
  revalidatePath("/", "layout");
  redirect("/settings?tab=profile&saved=1");
}

export async function changePassword(form: FormData) {
  const { user } = await requireUser({ setup: true });
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (limited(`pw:${user.id}`, 6)) redirect("/settings?tab=security&error=limited");
  const row = db().prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string | null };
  if (!row.password_hash) {
    // An account created with Google or Microsoft sets its first password here; sample accounts cannot.
    const f = db().prepare("SELECT demo FROM firms WHERE id = ?").get(user.firm_id) as { demo: number };
    if (f.demo) redirect("/settings?tab=security&error=sample");
    if (!validPassword(next)) redirect("/settings?tab=security&error=password");
    if (await breached(next)) redirect("/settings?tab=security&error=breached");
    db().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(next), user.id);
    await securityEvent(user.firm_id, user.id, "password_changed", "first password set");
    redirect("/settings?tab=security&saved=1");
  }
  if (!verifyPassword(current, row.password_hash)) redirect("/settings?tab=security&error=current");
  if (!validPassword(next)) redirect("/settings?tab=security&error=password");
  if (await breached(next)) redirect("/settings?tab=security&error=breached");
  const sid = (await cookies()).get(COOKIE)?.value ?? "";
  const d = db();
  d.transaction(() => {
    d.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(next), user.id);
    // every other device is signed out
    d.prepare("DELETE FROM sessions WHERE user_id = ? AND id != ?").run(user.id, sha(sid));
  })();
  await securityEvent(user.firm_id, user.id, "password_changed", "other devices signed out");
  redirect("/settings?tab=security&saved=1");
}

export async function updateFirm(form: FormData) {
  const { user, firm } = await requireUser();
  notInSample(firm, "/settings?tab=firm");
  const name = String(form.get("firm") ?? "").trim().slice(0, 120);
  if (!name || !/admin|managing/i.test(user.role)) redirect("/settings?tab=firm&error=1");
  db().prepare("UPDATE firms SET name = ? WHERE id = ?").run(name, firm.id);
  revalidatePath("/", "layout");
  redirect("/settings?tab=firm&saved=1");
}

export async function clearChat(caseId: string | null) {
  const { user, firm } = await requireUser();
  db().prepare("DELETE FROM chat WHERE firm_id = ? AND user_id = ? AND case_id IS ?").run(firm.id, user.id, caseId);
}

export async function disconnectMailbox() {
  const { user, firm } = await requireUser();
  db().prepare("DELETE FROM mailboxes WHERE firm_id = ? AND user_id = ?").run(firm.id, user.id);
  revalidatePath("/settings");
}

/** Issues a new secret forwarding address for the firm. The old one stops working. */
export async function newInboundAddress() {
  const { user, firm } = await requireUser();
  if (!isAdmin(user.role) || firm.demo) return;
  const token = newToken();
  setKv(firm.id, "inbound_hash", sha(token));
  redirect(`/integrations?inbound=${token}`);
}

/** PDFs and photos from a form, checked by content. "size" over 25 MB in total, "type" for anything else. */
async function uploads(form: FormData): Promise<Uint8Array[] | "size" | "type"> {
  const files = form.getAll("file").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 40);
  if (files.reduce((s, f) => s + f.size, 0) > 25 * 1024 * 1024) return "size";
  const out: Uint8Array[] = [];
  for (const f of files) {
    const bytes = new Uint8Array(await f.arrayBuffer());
    if (!fileKind(bytes)) return "type";
    out.push(bytes);
  }
  return out;
}

export async function addFile(caseId: string, form: FormData) {
  const { user, firm, viewer } = await requireUser();
  if (!caseById(firm.id, caseId, viewer)) redirect("/cases");
  const c = db().prepare("SELECT processing FROM cases WHERE firm_id = ? AND id = ?").get(firm.id, caseId) as { processing: number } | undefined;
  notInSample(firm, `/cases/${caseId}?tab=documents`);
  const got = await uploads(form);
  if (!c || c.processing || typeof got === "string" || !got.length) redirect(`/cases/${caseId}?tab=documents${typeof got === "string" ? `&error=${got}` : ""}`);
  db().prepare("UPDATE cases SET processing = 1, note = NULL WHERE firm_id = ? AND id = ?").run(firm.id, caseId);
  log(firm.id, caseId, user.name, "file", `Added ${got.length === 1 ? "a file" : `${got.length} files`}.`);
  void processCase(firm.id, caseId, got, { append: true });
  revalidatePath("/", "layout");
  redirect(`/cases/${caseId}`);
}

export async function disconnect(form: FormData) {
  const { user, firm } = await requireUser();
  const provider = String(form.get("provider") ?? "");
  const c = db().prepare("SELECT refresh_enc FROM mailboxes WHERE firm_id = ? AND user_id = ? AND provider = ?").get(firm.id, user.id, provider) as { refresh_enc: string } | undefined;
  if (c) await revokeAccess(provider, c.refresh_enc);
  db().prepare("DELETE FROM mailboxes WHERE firm_id = ? AND user_id = ? AND provider = ?").run(firm.id, user.id, provider);
  await securityEvent(firm.id, user.id, "disconnected", provider);
  revalidatePath("/", "layout");
}

export async function setTeamsChannel(form: FormData) {
  const { user, firm } = await requireUser();
  if (firm.demo) return;
  const [teamId, channelId, ...name] = String(form.get("channel") ?? "").split("|");
  const c = db().prepare("SELECT id, settings FROM mailboxes WHERE firm_id = ? AND user_id = ? AND provider = 'microsoft'").get(firm.id, user.id) as { id: string; settings: string | null } | undefined;
  if (!c) return;
  const s = JSON.parse(c.settings ?? "{}");
  if (teamId && channelId) {
    s.teams = { teamId, channelId, name: name.join("|") };
    // Items for review from this moment on are posted.
    setKv(firm.id, `teams:${c.id}`, new Date().toISOString());
  }
  else delete s.teams;
  db().prepare("UPDATE mailboxes SET settings = ? WHERE id = ?").run(JSON.stringify(s), c.id);
  revalidatePath("/settings");
}

/** Reads a PDF from Google Drive, OneDrive or SharePoint into a case. */
export async function importFromCloud(caseId: string, provider: string, fileId: string, name: string) {
  const { user, firm, viewer } = await requireUser();
  if (!caseById(firm.id, caseId, viewer)) redirect("/cases");
  notInSample(firm, `/cases/${caseId}`);
  const { connection, download, isProvider } = await import("./integrations");
  const c = db().prepare("SELECT processing FROM cases WHERE firm_id = ? AND id = ?").get(firm.id, caseId) as { processing: number } | undefined;
  if (!c || c.processing || !isProvider(provider)) redirect(`/cases/${caseId}`);
  const conn = connection(firm.id, user.id, provider);
  if (!conn) redirect("/integrations");
  const bytes = new Uint8Array(await download(conn, fileId));
  if (!fileKind(bytes) || bytes.length > 25 * 1024 * 1024) redirect(`/cases/${caseId}/import?from=${provider}&error=1`);
  db().prepare("UPDATE cases SET processing = 1, note = NULL WHERE firm_id = ? AND id = ?").run(firm.id, caseId);
  log(firm.id, caseId, user.name, "file", `Imported ${name.slice(0, 120)} from ${provider === "google" ? "Google Drive" : "OneDrive"}.`);
  void processCase(firm.id, caseId, [bytes], { append: true });
  revalidatePath("/", "layout");
  redirect(`/cases/${caseId}`);
}

/** Tells Google to revoke Lincoln's access (Microsoft has no revoke endpoint; the user can remove the app in their account). */
async function revokeAccess(provider: string, refreshEnc: string) {
  if (provider !== "google") return;
  try { await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(openSecret(refreshEnc))}`, { method: "POST" }); } catch { /* best effort */ }
}

// Two step sign in

export async function startTwoStep() {
  const { user, firm } = await requireUser({ setup: true });
  notInSample(firm, "/settings?tab=security");
  db().prepare("UPDATE users SET totp_pending_enc = ? WHERE id = ?").run(sealSecret(newTotpSecret()), user.id);
  redirect("/settings?tab=security&setup=1");
}

export async function confirmTwoStep(form: FormData) {
  const { user, firm } = await requireUser({ setup: true });
  const row = db().prepare("SELECT totp_pending_enc FROM users WHERE id = ?").get(user.id) as { totp_pending_enc: string | null };
  if (!row.totp_pending_enc) redirect("/settings?tab=security");
  if (limited(`2fa:${user.id}`, 10)) redirect("/settings?tab=security&setup=1&error=limited");
  const secret = openSecret(row.totp_pending_enc);
  const step = verifyTotp(secret, String(form.get("code") ?? ""), null);
  if (step === null) redirect("/settings?tab=security&setup=1&error=code");
  const codes = Array.from({ length: 8 }, () => randomBytes(5).toString("hex").toUpperCase());
  db().prepare("UPDATE users SET totp_enc = ?, totp_pending_enc = NULL, totp_last_step = ?, recovery = ? WHERE id = ?").run(sealSecret(secret), step, JSON.stringify(codes.map((c) => sha(c))), user.id);
  await securityEvent(firm.id, user.id, "two_step_on");
  // Shown once, never stored in readable form.
  redirect(`/settings?tab=security&codes=${codes.join("-")}`);
}

export async function disableTwoStep(form: FormData) {
  const { user, firm } = await requireUser();
  if (firm.require_2fa) redirect("/settings?tab=security&error=required");
  const row = db().prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string | null };
  if (limited(`2fa:${user.id}`, 10) || !verifyPassword(String(form.get("password") ?? ""), row.password_hash)) redirect("/settings?tab=security&error=current");
  db().prepare("UPDATE users SET totp_enc = NULL, totp_pending_enc = NULL, recovery = NULL WHERE id = ?").run(user.id);
  await securityEvent(firm.id, user.id, "two_step_off");
  redirect("/settings?tab=security&saved=1");
}

export async function signOutSession(form: FormData) {
  const { user, firm, sessionId } = await requireUser({ setup: true });
  const target = String(form.get("session") ?? "");
  if (target === "others") db().prepare("DELETE FROM sessions WHERE user_id = ? AND id != ?").run(user.id, sessionId);
  else db().prepare("DELETE FROM sessions WHERE user_id = ? AND id = ? AND id != ?").run(user.id, target, sessionId);
  await securityEvent(firm.id, user.id, "sessions_signed_out", target === "others" ? "all other devices" : "one device");
  revalidatePath("/settings");
}

/** Administrators can require two step sign in for everyone in the firm, once their own is on. */
export async function setTwoStepRequired(form: FormData) {
  const { user, firm, twoStep } = await requireUser();
  if (firm.demo || !isAdmin(user.role)) redirect("/settings?tab=security&error=admin");
  const on = form.get("on") === "1";
  if (on && !twoStep) redirect("/settings?tab=security&error=selffirst");
  db().prepare("UPDATE firms SET require_2fa = ? WHERE id = ?").run(on ? 1 : 0, firm.id);
  await securityEvent(firm.id, user.id, on ? "two_step_required" : "two_step_optional");
  redirect("/settings?tab=security&saved=1");
}

/** Permanently deletes the firm: every case, file, message, connection and account. Administrators only. */
export async function deleteFirm(form: FormData) {
  const { user, firm } = await requireUser();
  if (firm.demo || !isAdmin(user.role)) redirect("/settings?tab=firm&error=1");
  const row = db().prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string | null };
  if (limited(`del:${user.id}`, 5) || !verifyPassword(String(form.get("password") ?? ""), row.password_hash) || String(form.get("confirm") ?? "").trim() !== firm.name) redirect("/settings?tab=firm&error=delete");
  const d = db();
  const conns = d.prepare("SELECT provider, refresh_enc FROM mailboxes WHERE firm_id = ?").all(firm.id) as { provider: string; refresh_enc: string }[];
  for (const c of conns) await revokeAccess(c.provider, c.refresh_enc);
  const caseIds = (d.prepare("SELECT id FROM cases WHERE firm_id = ?").all(firm.id) as { id: string }[]).map((c) => c.id);
  d.transaction(() => {
    for (const t of ["security_events", "chat", "drafts", "messages", "approvals", "activity", "dates", "issues", "criteria", "documents", "cases", "kv"]) d.prepare(`DELETE FROM ${t} WHERE firm_id = ?`).run(firm.id);
    d.prepare("DELETE FROM inbound_seen WHERE mailbox_id IN (SELECT id FROM mailboxes WHERE firm_id = ?)").run(firm.id);
    d.prepare("DELETE FROM mailboxes WHERE firm_id = ?").run(firm.id);
    d.prepare("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE firm_id = ?)").run(firm.id);
    d.prepare("DELETE FROM password_resets WHERE user_id IN (SELECT id FROM users WHERE firm_id = ?)").run(firm.id);
    d.prepare("DELETE FROM login_challenges WHERE user_id IN (SELECT id FROM users WHERE firm_id = ?)").run(firm.id);
    d.prepare("DELETE FROM users WHERE firm_id = ?").run(firm.id);
    d.prepare("DELETE FROM firms WHERE id = ?").run(firm.id);
  })();
  for (const id of caseIds) deleteCaseFiles(id);
  forgetFirmKey(firm.id);
  (await cookies()).delete(COOKIE);
  redirect("/signin?deleted=1");
}

/** The attorney closes an open issue. A date rule's issue stays closed after that. */
export async function resolveIssue(issueId: string) {
  const { user, firm, viewer } = await requireUser();
  const d = db();
  const row = d.prepare("SELECT case_id, title FROM issues WHERE firm_id = ? AND id = ? AND status = 'open'").get(firm.id, issueId) as { case_id: string; title: string } | undefined;
  if (!row || !caseById(firm.id, row.case_id, viewer)) return;
  d.prepare("UPDATE issues SET status = 'resolved', resolution = ?, resolved_at = ? WHERE firm_id = ? AND id = ?").run(`Resolved by ${user.name}.`, now(), firm.id, issueId);
  log(firm.id, row.case_id, user.name, "decide", `Resolved: ${row.title}.`);
  revalidatePath("/", "layout");
}

/** Mail Lincoln could not match goes to the case a person chooses, or out of the Inbox. */
export async function sortMessage(form: FormData) {
  const { user, firm, viewer } = await requireUser();
  const d = db();
  const messageId = String(form.get("message") ?? "");
  const caseId = String(form.get("case") ?? "");
  const m = d.prepare("SELECT id, party, subject FROM messages WHERE firm_id = ? AND id = ? AND state = 'unsure'").get(firm.id, messageId) as { id: string; party: string; subject: string } | undefined;
  if (!m) return;
  if (caseId === "none") d.prepare("DELETE FROM messages WHERE firm_id = ? AND id = ?").run(firm.id, m.id);
  else if (caseById(firm.id, caseId, viewer)) {
    d.prepare("UPDATE messages SET case_id = ?, state = 'filed', lincoln_note = ? WHERE firm_id = ? AND id = ?").run(caseId, `Filed by ${user.name}.`, firm.id, m.id);
    log(firm.id, caseId, user.name, "file", `Filed an email from ${m.party}: ${m.subject}.`);
  }
  revalidatePath("/", "layout");
}
