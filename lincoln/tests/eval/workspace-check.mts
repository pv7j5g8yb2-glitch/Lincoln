// Checks the work Lincoln does in the firm's own Microsoft 365 against a stand-in (tests/eval/workspace-mock.cjs on 4546):
// emails for approval become Outlook drafts and stay in step both ways, an approved email is sent from its draft,
// approved work is saved into the client's OneDrive folder, and a request posted in the Teams channel is taken
// and answered in its thread. Run from lincoln/ with INTEGRATIONS_MOCK_URL and LLM_BASE_URL pointing at the stand-in.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "lincoln-ws-"));
process.env.LINCOLN_SECRET ||= "workspace-check-secret-0123456789ab";
const MOCK = process.env.INTEGRATIONS_MOCK_URL!;
const { db } = await import("../../src/lib/db.ts");
const { seal } = await import("../../src/lib/secret.ts");
const { syncDrafts, dropDraft } = await import("../../src/lib/maildrafts.ts");
const { deliver, tick, approveAndSend } = await import("../../src/lib/agent.ts");
const { saveToFolder, folderOf, isClientFolder, setClientFolder } = await import("../../src/lib/workspace.ts");

const d = db();
const now = () => new Date().toISOString();
const state = async () => (await fetch(`${MOCK}/__state`)).json() as Promise<any>;
const hit = (p: string) => fetch(`${MOCK}${p}`);
let fails = 0;
const ok = (cond: unknown, what: string) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}`); if (!cond) fails++; };

const F = "f1", U = "u1", C = "c_case1", MB = "mb1";
d.prepare("INSERT INTO firms (id, name) VALUES (?, 'Okafor Immigration Law')").run(F);
d.prepare("INSERT INTO users (id, firm_id, name, email, role, initials, admin) VALUES (?, ?, 'Maya Okafor', 'maya@okafor-law.example', 'Attorney', 'MO', 1)").run(U, F);
d.prepare("INSERT INTO identities (provider, subject, user_id, created_at) VALUES ('microsoft', 'tid1:oid-maya', ?, ?)").run(U, now());
d.prepare("INSERT INTO cases (id, firm_id, ref, client, type_code, type_name, family, stage, state, summary, attorney_id, paralegal_id, opened_at) VALUES (?, ?, '2026-1001', 'Lucia Okafor-Reyes', 'I-130', 'Relative petition', 'Family', 'Evidence', 'moving', 'Spouse petition.', ?, ?, ?)").run(C, F, U, U, now());
d.prepare("INSERT INTO mailboxes (id, firm_id, user_id, provider, email, refresh_enc, access_enc, expires_at, created_at, settings) VALUES (?, ?, ?, 'microsoft', 'maya@okafor-law.example', ?, ?, ?, ?, ?)")
  .run(MB, F, U, seal("refresh"), seal("access"), Date.now() + 3600_000, now(), JSON.stringify({ granted: "Mail.ReadWrite Mail.Send Files.ReadWrite.All ChannelMessage.Send ChannelMessage.Read.All", teams: { teamId: "team1", channelId: "chan1", name: "Lincoln" } }));
const msg = (id: string, body: string) => {
  d.prepare("INSERT INTO messages (id, firm_id, case_id, direction, party, party_role, subject, body, at, state, email, thread_id, mailbox_id) VALUES (?, ?, ?, 'out', 'Lucia Okafor-Reyes', 'Client', 'Re: Documents for the petition', ?, ?, 'needs_approval', 'lucia@example.com', 'conv1', ?)").run(id, F, C, body, now(), MB);
  d.prepare("INSERT INTO approvals (id, firm_id, case_id, kind, title, brief, payload, status, assignee_id, created_at) VALUES (?, ?, ?, 'message', 'Email to Lucia', 'x', ?, 'pending', ?, ?)").run(`a_${id}`, F, C, JSON.stringify({ messageId: id }), U, now());
};
d.prepare("INSERT INTO messages (id, firm_id, case_id, direction, party, subject, body, at, state, email, thread_id, mailbox_id, ext_id) VALUES ('in1', ?, ?, 'in', 'Lucia', 'Documents for the petition', 'Hello', ?, 'filed', 'lucia@example.com', 'conv1', ?, 'orig1')").run(F, C, new Date(Date.now() - 60_000).toISOString(), MB);

// 1. Drafts in the mailbox.
msg("m1", "Dear Lucia,\n\nThank you for the marriage certificate.\n\nKind regards,\nMaya");
msg("m2", "Dear Lucia,\n\nOne more item is needed: the joint lease.\n\nKind regards,\nMaya");
msg("m3", "Dear Lucia,\n\nA third note.\n\nKind regards,\nMaya");
await syncDrafts(F);
const row = (id: string) => d.prepare("SELECT state, body, draft_ref FROM messages WHERE id = ?").get(id) as { state: string; body: string; draft_ref: string | null };
let s = await state();
ok(row("m1").draft_ref && s.drafts[row("m1").draft_ref!]?.replyTo === "orig1", "an email for approval becomes a reply draft in Outlook, in the client's thread");
ok(Object.keys(s.drafts).length === 3, "each email for approval has one draft");
await syncDrafts(F);
ok(Object.keys((await state()).drafts).length === 3, "a second sync makes no duplicate drafts");

// 2. Edited in Outlook: Lincoln follows and learns.
await hit(`/__edit?id=${row("m1").draft_ref}`);
await syncDrafts(F);
ok(row("m1").body.includes("Please bring your passport") && row("m1").body.includes("Warm regards"), "an edit made in Outlook comes back into Lincoln");
ok((d.prepare("SELECT COUNT(*) AS n FROM memory_edits WHERE firm_id = ? AND kind = 'email'").get(F) as { n: number }).n > 0, "the edit is kept to learn the firm's style");

// 3. Sent from Outlook: recorded, approval closed, never sent twice.
await hit(`/__sendmailbox?id=${row("m1").draft_ref}`);
await syncDrafts(F);
ok(row("m1").state === "sent", "a draft sent from Outlook is recorded as sent");
ok((d.prepare("SELECT status FROM approvals WHERE id = 'a_m1'").get() as { status: string }).status === "approved", "its approval in Review is closed");

// 4. Approved in Lincoln: sent from the same draft.
const ref2 = row("m2").draft_ref!;
ok(await deliver(F, "m2", { id: U, name: "Maya Okafor" }), "an email approved in Lincoln is sent");
s = await state();
ok(s.sent.some((x: any) => x.viaDraft) && !s.drafts[ref2] && s.sendMail === 0, "it is sent from the Outlook draft, not as a second copy");

// 5. Returned in Lincoln: the draft leaves the mailbox.
const ref3 = row("m3").draft_ref!;
await dropDraft(F, "m3");
ok((await state()).deleted.includes(ref3), "a returned email's draft is deleted from Outlook");

// 6. Approved work goes into the client's folder.
await saveToFolder(F, C, "Cover letter", "docx", Buffer.from("PK test"));
s = await state();
ok(s.files.some((f: string) => f.includes("Clients/Lucia Okafor-Reyes (I-130)/Cover letter.docx")), "approved work is saved in Lincoln/Clients/<client> in OneDrive");
ok(folderOf(F, C)?.url.includes("Clients/folder"), "the case knows its folder link");

// 6b. The firm's own client folders: found, followed, asked about when unclear.
const addCase = (id: string, client: string, type: string) => d.prepare("INSERT INTO cases (id, firm_id, ref, client, type_code, type_name, family, stage, state, summary, attorney_id, paralegal_id, opened_at) VALUES (?, ?, ?, ?, ?, 'x', 'Business', 'Evidence', 'moving', 'x', ?, ?, ?)").run(id, F, id, client, type, U, U, now());
const fold = (id: string, name: string, path = "/drive/root:/Clients", parent = "root1") => ({ id, name, folder: {}, webUrl: `https://firm-my.sharepoint.com/folder/${id}`, parentReference: { id: parent, path } });
ok(isClientFolder("Okafor-Reyes, Lucia (I-130)", "Lucia Okafor-Reyes") && isClientFolder("SOFIA MARQUEZ", "Sofía Márquez") && !isClientFolder("Martinez, Lucia", "Lucia Okafor-Reyes"), "a client's folder is recognised in any order, case or accents, and not confused with another client");
await hit(`/__folders?set=${encodeURIComponent(JSON.stringify([fold("fm1", "Marquez, Sofia (H-1B)"), fold("fx1", "Marquez Holdings LLC")]))}`);
addCase("c_m", "Sofia Marquez", "H-1B");
await saveToFolder(F, "c_m", "Support letter", "docx", Buffer.from("PK"));
ok((await state()).files.includes("items/fm1/Support letter.docx") && folderOf(F, "c_m")?.url.includes("fm1"), "work goes into the firm's own folder for that client, not a new one");
await saveToFolder(F, "c_m", "Support letter", "docx", Buffer.from("PK2"));
ok((await state()).files.filter((f: string) => f === "items/fm1/Support letter.docx").length === 2 && (await state()).made.length === 0, "saving again replaces the same file (a new version), with no new folder");
addCase("c_o", "Daniel Ortiz", "O-1A");
await saveToFolder(F, "c_o", "Cover letter", "docx", Buffer.from("PK"));
s = await state();
ok(s.made.some((x: any) => x.name === "Ortiz, Daniel (O-1A)" && x.parent === "root1") && s.files.some((f: string) => /^items\/new\d+\/Cover letter\.docx$/.test(f)), "a client with no folder gets one next to the firm's others, named the firm's way");
await hit(`/__folders?set=${encodeURIComponent(JSON.stringify([fold("fl1", "Lima, Ana"), fold("fl2", "Ana Lima (2019 case)"), fold("own", "Ana Lima (I-130)", "/drive/root:/Lincoln/Clients", "lc")]))}`);
addCase("c_l", "Ana Lima", "I-130");
await saveToFolder(F, "c_l", "Cover letter", "docx", Buffer.from("PK"));
const q = d.prepare("SELECT payload FROM approvals WHERE firm_id = ? AND case_id = 'c_l' AND kind = 'folder' AND status = 'pending'").all(F) as { payload: string }[];
ok(q.length === 1 && JSON.parse(q[0].payload).options.length === 2 && (await state()).files.some((f: string) => f.includes("Clients/Ana Lima (I-130)/Cover letter.docx")), "two possible folders: one question in Review (Lincoln's own folder left out), and the file waits safely in Lincoln's folder");
await saveToFolder(F, "c_l", "Second letter", "docx", Buffer.from("PK"));
ok((d.prepare("SELECT COUNT(*) AS n FROM approvals WHERE firm_id = ? AND case_id = 'c_l' AND kind = 'folder'").get(F) as { n: number }).n === 1, "the question is asked once, not on every save");
setClientFolder(F, "c_l", MB, { id: "fl1", url: "https://firm-my.sharepoint.com/folder/fl1" });
await saveToFolder(F, "c_l", "Third letter", "docx", Buffer.from("PK"));
ok((await state()).files.includes("items/fl1/Third letter.docx"), "after the answer, work goes into the chosen folder");
await hit("/__folders?set=[]");

// 7. Teams: a request in the channel is taken and answered in its thread.
await tick();
await hit(`/__teams?text=${encodeURIComponent("Lincoln, check Lucia Okafor-Reyes's passport dates before Friday")}`);
await tick();
await new Promise((r) => setTimeout(r, 500));
s = await state();
ok(s.replies.some((r: any) => /^On it\./.test(r.html)), "Lincoln answers a Teams request in its thread");
ok(s.replies.some((r: any) => /Open in Lincoln/.test(r.html)), "and replies again when the work is ready");
ok((d.prepare("SELECT COUNT(*) AS n FROM activity WHERE case_id = ? AND text LIKE 'Took an instruction from Maya Okafor%'").get(C) as { n: number }).n === 1, "the request is logged on the right case");
await tick();
ok((await state()).replies.filter((r: any) => /^On it\./.test(r.html)).length === 1, "a request is acted on once");
ok(!s.replies.some((r: any) => r.to.startsWith("post")), "Lincoln's own posts are never taken as requests");

// 5. Approve and send: the item closes only once the email has really gone, and never goes twice.
const fresh = (id: string, email: string | null) => {
  d.prepare("INSERT INTO messages (id, firm_id, case_id, direction, party, party_role, subject, body, at, state, email, mailbox_id) VALUES (?, ?, ?, 'out', 'Lucia Okafor-Reyes', 'Client', 'Next steps', 'Dear Lucia,\n\nThe petition is ready.\n\nKind regards,\nMaya', ?, 'needs_approval', ?, ?)").run(id, F, C, now(), email, MB);
  d.prepare("INSERT INTO approvals (id, firm_id, case_id, kind, title, brief, payload, status, assignee_id, created_at) VALUES (?, ?, ?, 'message', 'Email to Lucia', 'x', ?, 'pending', ?, ?)").run(`a_${id}`, F, C, JSON.stringify({ messageId: id }), U, now());
};
const apr = (id: string) => (d.prepare("SELECT status FROM approvals WHERE id = ?").get(`a_${id}`) as { status: string }).status;
const before = (await state()).sendMail;
fresh("m6", "lucia@example.com");
const r6 = await approveAndSend(F, "a_m6", { id: U, name: "Maya Okafor" });
s = await state();
ok(r6.sent && s.sendMail === before + 1 && JSON.stringify(s.mails.at(-1)).includes("lucia@example.com"), "Approve and send sends the email to the client from the firm's mailbox");
ok(apr("m6") === "approved" && row("m6").state === "sent", "and only then is it approved and marked sent");
fresh("m7", "lucia@example.com");
const [x1, x2] = await Promise.all([approveAndSend(F, "a_m7", { id: U, name: "Maya Okafor" }), approveAndSend(F, "a_m7", { id: U, name: "Maya Okafor" })]);
ok([x1, x2].filter((r) => r.sent).length === 1 && (await state()).sendMail === before + 2, "two clicks at once send it once");
await hit("/__failsend?on=1");
fresh("m8", "lucia@example.com");
const r8 = await approveAndSend(F, "a_m8", { id: U, name: "Maya Okafor" });
ok(!r8.sent && apr("m8") === "pending" && row("m8").state === "needs_approval", "if the mailbox refuses it, it stays in Review, unsent");
await hit("/__failsend?on=0");
const r8b = await approveAndSend(F, "a_m8", { id: U, name: "Maya Okafor" });
ok(r8b.sent && apr("m8") === "approved" && (await state()).sendMail === before + 3, "and sends when approved again");
fresh("m9", null);
const r9 = await approveAndSend(F, "a_m9", { id: U, name: "Maya Okafor" });
ok(!r9.sent && r9.reason === "No recipient address" && apr("m9") === "pending", "an email with no address is not marked sent and says why");

fs.rmSync(process.env.DATA_DIR!, { recursive: true, force: true });
console.log(fails ? `\n${fails} failed` : "\nAll passed");
process.exit(fails ? 1 : 0);
