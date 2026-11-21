// The Google Workspace side of workspace-check.mts, against the same stand-in (tests/eval/workspace-mock.cjs on 4546):
// Gmail drafts kept in step, a request in Google Chat taken and answered in its thread, and a Google Doc posted
// there marked up and returned as a Google Doc with suggestions.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import JSZip from "jszip";

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "lincoln-wsg-"));
process.env.LINCOLN_SECRET ||= "workspace-check-secret-0123456789ab";
const MOCK = process.env.INTEGRATIONS_MOCK_URL!;
const { db } = await import("../../src/lib/db.ts");
const { seal } = await import("../../src/lib/secret.ts");
const { syncDrafts, dropDraft } = await import("../../src/lib/maildrafts.ts");
const { deliver, tick } = await import("../../src/lib/agent.ts");
const { googleDocIds } = await import("../../src/lib/integrations/index.ts");
const { redlineFile } = await import("../../src/lib/redline.ts");

const d = db();
const now = () => new Date().toISOString();
const state = async () => (await fetch(`${MOCK}/__state`)).json() as Promise<any>;
const hit = (p: string) => fetch(`${MOCK}${p}`);
const wait = async (cond: () => Promise<boolean>, ms = 8000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await cond()) return true; await new Promise((r) => setTimeout(r, 200)); } return false; };
let fails = 0;
const ok = (cond: unknown, what: string) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}`); if (!cond) fails++; };

const F = "f2", U = "u2", C = "c_case1", MB = "mb2";
d.prepare("INSERT INTO firms (id, name) VALUES (?, 'Reyes Immigration Law')").run(F);
d.prepare("INSERT INTO users (id, firm_id, name, email, role, initials, admin) VALUES (?, ?, 'Ana Reyes', 'ana@reyes-law.example', 'Attorney', 'AR', 1)").run(U, F);
d.prepare("INSERT INTO identities (provider, subject, user_id, created_at) VALUES ('google', 'sub-ana', ?, ?)").run(U, now());
d.prepare("INSERT INTO cases (id, firm_id, ref, client, type_code, type_name, family, stage, state, summary, attorney_id, paralegal_id, opened_at) VALUES (?, ?, '2026-1002', 'Lucia Okafor-Reyes', 'I-130', 'Relative petition', 'Family', 'Evidence', 'moving', 'Spouse petition.', ?, ?, ?)").run(C, F, U, U, now());
d.prepare("INSERT INTO mailboxes (id, firm_id, user_id, provider, email, refresh_enc, access_enc, expires_at, created_at, settings) VALUES (?, ?, ?, 'google', 'ana@reyes-law.example', ?, ?, ?, ?, ?)")
  .run(MB, F, U, seal("refresh"), seal("access"), Date.now() + 3600_000, now(), JSON.stringify({ granted: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/chat.spaces.readonly https://www.googleapis.com/auth/chat.messages.readonly https://www.googleapis.com/auth/chat.messages.create", gchat: { space: "spaces/S1", name: "Lincoln" } }));
const msg = (id: string) => {
  d.prepare("INSERT INTO messages (id, firm_id, case_id, direction, party, party_role, subject, body, at, state, email, thread_id, mailbox_id) VALUES (?, ?, ?, 'out', 'Lucia Okafor-Reyes', 'Client', 'Re: Documents for the petition', ?, ?, 'needs_approval', 'lucia@example.com', 'gthread1', ?)").run(id, F, C, "Dear Lucia,\n\nThank you for the marriage certificate.\n\nKind regards,\nAna", now(), MB);
  d.prepare("INSERT INTO approvals (id, firm_id, case_id, kind, title, brief, payload, status, assignee_id, created_at) VALUES (?, ?, ?, 'message', 'Email to Lucia', 'x', ?, 'pending', ?, ?)").run(`a_${id}`, F, C, JSON.stringify({ messageId: id }), U, new Date(Date.now() - 3 * 3600_000).toISOString());
};
const row = (id: string) => d.prepare("SELECT state, body, draft_ref FROM messages WHERE id = ?").get(id) as { state: string; body: string; draft_ref: string | null };

// Gmail drafts.
msg("g1"); msg("g2"); msg("g3");
await syncDrafts(F);
let s = await state();
ok(row("g1").draft_ref && s.gdrafts[row("g1").draft_ref!]?.threadId === "gthread1", "an email for approval becomes a Gmail draft in the client's thread");
ok(s.gdrafts[row("g1").draft_ref!]?.text.includes("Thank you for the marriage certificate"), "the draft holds Lincoln's text");
await hit(`/__gedit?id=${row("g1").draft_ref}`);
await syncDrafts(F);
ok(row("g1").body.includes("Please bring your passport"), "an edit made in Gmail comes back into Lincoln");
await hit(`/__gsend?id=${row("g1").draft_ref}`);
await syncDrafts(F);
ok(row("g1").state === "sent" && (d.prepare("SELECT status FROM approvals WHERE id = 'a_g1'").get() as { status: string }).status === "approved", "a draft sent from Gmail is recorded as sent and its approval closed");
const ref2 = row("g2").draft_ref!;
ok(await deliver(F, "g2", { id: U, name: "Ana Reyes" }), "an email approved in Lincoln is sent");
s = await state();
ok(s.gsent.some((x: any) => x.viaDraft) && !s.gdrafts[ref2], "it is sent from the Gmail draft");
const ref3 = row("g3").draft_ref!;
await dropDraft(F, "g3");
ok((await state()).gdeleted.includes(ref3), "a returned email's draft is deleted from Gmail");

// Google Chat: items for review are posted, a request with a Google Doc is taken, marked up and answered.
await tick();
await hit(`/__gchat?doc=1&text=${encodeURIComponent("Please mark up Lucia's declaration")}`);
await tick();
ok(await wait(async () => (await state()).gposts.some((p: any) => /^On it\./.test(p.text) && p.thread)), "Lincoln answers a Google Chat request in its thread");
ok(await wait(async () => (await state()).gposts.some((p: any) => /Ready for review: Lucia Okafor-Reyes\. <http.*\|Open in Lincoln>/.test(p.text))), "and replies again with a link when the work is ready");
s = await state();
ok(s.gfiles.some((f: any) => f.mimeType === "application/vnd.google-apps.document" && /marked up/.test(f.name)), "the marked up Doc is saved back as a Google Doc in the client's folder");
const ap = d.prepare("SELECT payload, brief FROM approvals WHERE firm_id = ? AND kind = 'redline'").get(F) as { payload: string; brief: string } | undefined;
const pl = ap ? JSON.parse(ap.payload) as { fileId: string; docUrl?: string } : null;
ok(pl?.docUrl?.startsWith("https://docs.google.com/document/"), "Review opens it in Google Docs");
ok(/as suggestions in Google Docs/.test(ap?.brief ?? ""), "and says the changes are suggestions");
const f = pl ? redlineFile(F, pl.fileId) : null;
const xml = f ? await (await JSZip.loadAsync(f.data)).file("word/document.xml")!.async("string") : "";
ok(/<w:ins [^>]*w:author="Lincoln"/.test(xml) && xml.includes("14 March 1990") && /<w:del /.test(xml), "the file carries the change as a tracked change (it becomes a suggestion in Docs)");
await tick();
ok((await state()).gposts.some((p: any) => /^\*For review:\* Marked up: Declaration draft/.test(p.text)), "items for review are posted in the space");
await tick();
ok((await state()).gposts.filter((p: any) => /^On it\./.test(p.text)).length === 1, "a request is acted on once, and Lincoln's own posts are never taken as requests");
ok(googleDocIds("see https://docs.google.com/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit please").join() === "1AbCdEfGhIjKlMnOpQrStUvWxYz", "a Google Doc link in any request is recognised");

// The firm's own client folder in Drive: found by the client's name and written into, with the full Drive permission.
const { saveToFolder } = await import("../../src/lib/workspace.ts");
d.prepare("INSERT INTO cases (id, firm_id, ref, client, type_code, type_name, family, stage, state, summary, attorney_id, paralegal_id, opened_at) VALUES ('c_gm', ?, 'gm', 'Sofia Marquez', 'H-1B', 'x', 'Business', 'Evidence', 'moving', 'x', ?, ?, ?)").run(F, U, U, now());
await hit(`/__gfolders?set=${encodeURIComponent(JSON.stringify([{ id: "gf1", name: "Marquez, Sofia", parents: ["groot"] }]))}`);
await saveToFolder(F, "c_gm", "Support letter", "docx", Buffer.from("PK"));
ok((await state()).gfiles.some((f: any) => f.name === "Support letter.docx" && f.parents?.includes("gf1")), "in Google Drive too, work goes into the firm's own folder for that client");
await hit("/__gfolders?set=[]");

fs.rmSync(process.env.DATA_DIR!, { recursive: true, force: true });
console.log(fails ? `\n${fails} failed` : "\nAll passed");
process.exit(fails ? 1 : 0);
