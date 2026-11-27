// Whole emails through Lincoln's mail handling with a scripted model that answers the sorting question as each scenario
// says, including wrongly, to prove the routing rules keep every email in the right case. Free: no real model.
// Run from lincoln/: npx tsx tests/eval/mail-routing-check.mts
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

let answer: Record<string, unknown> = {};
const server = http.createServer((req, res) => {
  const ch: Buffer[] = []; req.on("data", (c) => ch.push(c)); req.on("end", () => {
    const om = (req.url ?? "").match(/^\/graph\.microsoft\.com\/v1\.0\/me\/messages\/([^/?]+)\?/);
    if (om) { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ id: om[1], conversationId: `conv-${om[1]}`, subject: `Passport scan ${om[1]}`, from: { emailAddress: { address: "lucia@gmail.com", name: "Lucia Reyes" } }, body: { content: "Here it is." }, hasAttachments: false, internetMessageHeaders: [{ name: "Message-ID", value: `<${om[1]}@mail.gmail.com>` }, { name: "Authentication-Results", value: "dmarc=pass" }] })); }
    let b: { messages?: unknown; stream?: boolean; model?: string } = {}; try { b = JSON.parse(Buffer.concat(ch).toString("utf8") || "{}"); } catch { /* empty */ }
    const text = JSON.stringify(b.messages ?? "").includes("Decide what this email is") ? JSON.stringify(answer) : "{}";
    const usage = { input_tokens: 10, output_tokens: 10 };
    if (!b.stream) { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ id: "m", type: "message", role: "assistant", model: b.model, content: [{ type: "text", text }], stop_reason: "end_turn", usage })); }
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    const ev = (type: string, data: object) => res.write(`event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`);
    ev("message_start", { message: { id: "m", type: "message", role: "assistant", model: b.model, content: [], stop_reason: null, usage } });
    ev("content_block_start", { index: 0, content_block: { type: "text", text: "" } });
    ev("content_block_delta", { index: 0, delta: { type: "text_delta", text } });
    ev("content_block_stop", { index: 0 });
    ev("message_delta", { delta: { stop_reason: "end_turn" }, usage });
    ev("message_stop", {});
    res.end();
  });
});
await new Promise<void>((r) => server.listen(4551, r));
Object.assign(process.env, { DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), "lincoln-mail-")), LINCOLN_SECRET: "mail-routing-check-secret-0123456789", LLM_BATCH: "off", LLM_API_KEY: "standin", LLM_BASE_URL: "http://127.0.0.1:4551", LLM_MODEL: "standin", LLM_MODEL_LIGHT: "standin", INTEGRATIONS_MOCK_URL: "http://127.0.0.1:4551" });
const { db, uid } = await import("../../src/lib/db.ts");
const { handleInbound, resumeMail } = await import("../../src/lib/agent.ts");
const { seal } = await import("../../src/lib/secret.ts");
const { familyOf } = await import("../../src/lib/merge.ts");
const d = db();
let fails = 0;
const ok = (c: unknown, what: string) => { console.log(`${c ? "ok  " : "FAIL"} ${what}`); if (!c) fails++; };
const F = "f_m", at = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
d.prepare("INSERT INTO firms (id, name) VALUES (?, 'Okafor Immigration Law')").run(F);
d.prepare("INSERT INTO users (id, firm_id, name, email, role, initials, admin) VALUES ('u_m', ?, 'Maya Okafor', 'maya@okaforlaw.com', 'Attorney', 'MO', 1)").run(F);
const addCase = (id: string, client: string, type: string, email: string | null, days: number, receipt: string | null = null) => d.prepare("INSERT INTO cases (id, firm_id, ref, client, type_code, type_name, family, stage, state, summary, attorney_id, paralegal_id, opened_at, client_email, receipt) VALUES (?, ?, ?, ?, ?, 'x', 'Family', 'Evidence', 'moving', '', 'u_m', 'u_m', ?, ?, ?)").run(id, F, `R-${id}`, client, type, at(days), email, receipt);
addCase("c_lucia", "Lucia Reyes", "I-130", "lucia@gmail.com", 1000);
addCase("c_omar", "Omar Haddad", "N-400", "omar@haddad.org", 900, "IOE0912345678");
for (let i = 0; i < 230; i++) addCase(`c_f${i}`, `Filler Client${i} Person`, "I-90", `f${i}@example.org`, 300 - i);
d.prepare("INSERT INTO messages (id, firm_id, case_id, direction, party, subject, body, at, state, email, thread_id) VALUES ('m_t', ?, 'c_lucia', 'out', 'Lucia Reyes', 'Documents we need', 'Dear Lucia', ?, 'sent', 'lucia@gmail.com', 'thr-1')").run(F, at(3));
const cases = () => (d.prepare("SELECT COUNT(*) AS n FROM cases WHERE firm_id = ?").get(F) as { n: number }).n;
const mail = (o: Partial<{ from: string; fromName: string; subject: string; text: string; threadId: string; messageId: string; auto: "reply" | "bounce" | null }>) => ({ id: uid(), threadId: o.threadId ?? uid(), from: o.from ?? "x@y.com", fromName: o.fromName ?? "X", subject: o.subject ?? "Hello", text: o.text ?? "Hello", attachments: [], verified: true, messageId: o.messageId, auto: o.auto ?? null });
const last = () => d.prepare("SELECT case_id, state FROM messages WHERE firm_id = ? AND direction = 'in' ORDER BY rowid DESC LIMIT 1").get(F) as { case_id: string | null; state: string };
const base = { certain: true, dates: [], reply_needed: false, reply_point: null, summary: "test" };
const n0 = cases();

answer = { ...base, kind: "new_case", case_id: null, new_case: { client: "Lucia Reyes", counterpart: null, type_code: "I-130", type_name: "Relative petition" } };
await handleInbound(F, mail({ from: "lucia@gmail.com", fromName: "Lucia Reyes", subject: "More documents", text: "Here is my birth certificate." }), null);
ok(cases() === n0 && last().case_id === "c_lucia", "an existing client's second email is filed to her case even if the model says new case");

answer = { ...base, kind: "new_case", case_id: null, new_case: { client: "Lucia Reyes", counterpart: null, type_code: "I-130", type_name: "Relative petition" } };
await handleInbound(F, mail({ from: "lucia.reyes@herjob.com", fromName: "Lucia Reyes", threadId: "thr-1", subject: "Re: Documents we need", text: "Sending from work." }), null);
ok(cases() === n0 && last().case_id === "c_lucia", "a reply in her thread from a work address is filed to her case");

answer = { ...base, kind: "other", certain: true, case_id: null, new_case: null };
await handleInbound(F, mail({ from: "lucia@gmail.com", fromName: "Lucia Reyes", threadId: "thr-1", subject: "Re: Documents we need", text: "Thank you!" }), null);
ok(last()?.case_id === "c_lucia", "a short thank you in her thread is kept in her case, not deleted as noise");

answer = { ...base, kind: "government", case_id: null, new_case: null };
await handleInbound(F, mail({ from: "no-reply@uscis.dhs.gov", fromName: "USCIS", subject: "Case Status Update", text: "Receipt Number: IOE0912345678. We received your case." }), null);
ok(last().case_id === "c_omar", "a USCIS notice is filed by receipt number, even when the model finds no case");

answer = { ...base, kind: "case_update", case_id: "c_omar", new_case: null };
await handleInbound(F, mail({ from: "omar@haddad.org", fromName: "Omar Haddad", subject: "Question", text: "When is my interview?" }), null);
ok(last().case_id === "c_omar", "a client whose case is older than 200 others is still found");

answer = { ...base, kind: "new_case", case_id: null, new_case: { client: "Lucia Reyes", counterpart: null, type_code: "I-130", type_name: "Relative petition" } };
await handleInbound(F, mail({ from: "lreyes1985@yahoo.com", fromName: "Lucia Reyes", subject: "New case", text: "I want to petition for my husband." }), null);
const fresh = last().case_id;
ok(cases() === n0 + 1 && fresh !== "c_lucia", "a different person with the same name gets her own case");
ok((d.prepare("SELECT COUNT(*) AS n FROM case_links WHERE case_id = ? AND kind = 'maybe'").get(fresh) as { n: number }).n === 1, "and the possible duplicate is flagged for a person to check");

answer = { ...base, kind: "new_case", case_id: null, new_case: { client: "Omar Haddad", counterpart: null, type_code: "I-131", type_name: "Travel document" } };
await handleInbound(F, mail({ from: "omar@haddad.org", fromName: "Omar Haddad", subject: "Travel", text: "I also need a travel document." }), null);
ok(cases() === n0 + 2 && last().case_id !== "c_omar", "a new matter for an existing client is its own case");

answer = { ...base, kind: "case_update", case_id: "c_does_not_exist", new_case: null };
await handleInbound(F, mail({ from: "stranger@gmail.com", fromName: "Someone", subject: "Hi", text: "About my case" }), null);
ok(last().state === "unsure" && !last().case_id, "a case id the model made up is never used: the email waits in the Inbox");

// One email reaching two connected mailboxes (the attorney's and the shared inbox) is handled once.
let calls = 0;
server.on("request", () => calls++);
const inbound = () => (d.prepare("SELECT COUNT(*) AS n FROM messages WHERE firm_id = ? AND direction = 'in'").get(F) as { n: number }).n;
answer = { ...base, kind: "case_update", case_id: "c_lucia", new_case: null };
const before = inbound();
await handleInbound(F, mail({ from: "lucia@gmail.com", fromName: "Lucia Reyes", subject: "Passport", text: "Attached.", messageId: "abc@mail.gmail.com" }), null);
await handleInbound(F, mail({ from: "lucia@gmail.com", fromName: "Lucia Reyes", subject: "Passport", text: "Attached.", messageId: "abc@mail.gmail.com" }), null);
ok(inbound() === before + 1, "the same email arriving in two of the firm's mailboxes is filed once");

// Automatic replies and bounces never reach the model and never open a case.
calls = 0;
const n1 = cases();
await handleInbound(F, mail({ from: "lucia@gmail.com", fromName: "Lucia Reyes", threadId: "thr-1", subject: "Automatic reply: Documents we need", text: "I am away until Monday.", auto: "reply" }), null);
ok(calls === 0 && cases() === n1 && last().case_id === "c_lucia", "an out of office reply is noted on the case without calling the model or opening a case");
d.prepare("INSERT INTO messages (id, firm_id, case_id, direction, party, subject, body, at, state, email) VALUES ('m_out', ?, 'c_omar', 'out', 'Omar Haddad', 'Your interview', 'Dear Omar', ?, 'sent', 'omar@haddad.org')").run(F, at(0));
await handleInbound(F, mail({ from: "mailer-daemon@googlemail.com", fromName: "Mail Delivery Subsystem", subject: "Delivery Status Notification (Failure)", text: "Your message to omar@haddad.org could not be delivered.", auto: "bounce" }), null);
ok(calls === 0 && cases() === n1 && (d.prepare("SELECT COUNT(*) AS n FROM issues WHERE case_id = 'c_omar' AND title = 'Email not delivered'").get() as { n: number }).n === 1, "a bounce is matched to the client's case by the address in it and flagged");

// Two firms with the same client: neither ever sees the other's case.
const G = "f_other";
d.prepare("INSERT INTO firms (id, name) VALUES (?, 'Another Firm')").run(G);
d.prepare("INSERT INTO users (id, firm_id, name, email, role, initials, admin) VALUES ('u_g', ?, 'Sam Lee', 'sam@leelaw.com', 'Attorney', 'SL', 1)").run(G);
d.prepare("INSERT INTO cases (id, firm_id, ref, client, type_code, type_name, family, stage, state, summary, opened_at, client_email) VALUES ('c_g_lucia', ?, 'G-1', 'Lucia Reyes', 'I-130', 'x', 'Family', 'Evidence', 'moving', '', ?, 'lucia@gmail.com')").run(G, at(5));
answer = { ...base, kind: "case_update", case_id: "c_lucia", new_case: null };
await handleInbound(G, mail({ from: "lucia@gmail.com", fromName: "Lucia Reyes", subject: "Hello", text: "A question." }), null);
const g = d.prepare("SELECT case_id FROM messages WHERE firm_id = ? ORDER BY rowid DESC LIMIT 1").get(G) as { case_id: string | null };
ok(g.case_id !== "c_lucia" && !d.prepare("SELECT 1 FROM messages WHERE firm_id = ? AND case_id = 'c_lucia'").get(G), "another firm's case, even one the model names, is never used: each firm only reaches its own cases");
answer = { ...base, kind: "new_case", case_id: null, new_case: { client: "Lucia Reyes", counterpart: null, type_code: "I-130", type_name: "Relative petition" } };
await handleInbound(G, mail({ from: "lucia@gmail.com", fromName: "Lucia Reyes", subject: "More", text: "Another document." }), null);
const g2 = d.prepare("SELECT case_id FROM messages WHERE firm_id = ? ORDER BY rowid DESC LIMIT 1").get(G) as { case_id: string | null };
ok(g2.case_id === "c_g_lucia" && !(d.prepare("SELECT COUNT(*) AS n FROM case_links WHERE firm_id = ? AND kind = 'maybe'").get(G) as { n: number }).n, "and the same client at another firm is matched only to that firm's own case, never flagged against the first firm's");

// A family writes once for three people: a case each, linked, all with the same attorney.
const fresh3 = () => (d.prepare("SELECT id, client, attorney_id FROM cases WHERE firm_id = ? ORDER BY rowid DESC LIMIT 3").all(F) as { id: string; client: string; attorney_id: string }[]);
const before3 = cases();
answer = { ...base, kind: "new_case", case_id: null, new_case: { client: "Rosa Mendes", counterpart: "Paulo Mendes", type_code: "I-485", type_name: "Adjustment of status", family: [{ client: "Ines Mendes", type_code: "I-485", relation: "child" }, { client: "Tiago Mendes", type_code: "I-485", relation: "child" }] } };
await handleInbound(F, mail({ from: "mendesfamily@gmail.com", fromName: "Rosa Mendes", threadId: "thr-fam", subject: "Green cards for me and my children", text: "My husband is a US citizen. We need green cards for me, Ines and Tiago." }), null);
const three = fresh3();
const rosa = three.find((c) => c.client === "Rosa Mendes")!, ines = three.find((c) => c.client === "Ines Mendes")!;
ok(cases() === before3 + 3 && three.every((c) => c.attorney_id === "u_m"), "one email for a family opens a case for each person, with the same attorney");
ok(JSON.stringify(familyOf(F, rosa.id).sort()) === JSON.stringify(three.map((c) => c.id).sort()), "and the three cases are linked as one family");
ok(last().case_id === rosa.id, "the email itself is in the main applicant's case");

// A reply in the family's thread about one child goes to that child's case; one about everyone stays with the main case.
answer = { ...base, kind: "case_update", case_id: ines.id, new_case: null };
await handleInbound(F, mail({ from: "mendesfamily@gmail.com", fromName: "Rosa Mendes", threadId: "thr-fam", subject: "Re: Green cards", text: "Here is Ines's school record." }), null);
ok(last().case_id === ines.id, "a reply in the family's thread about one child is filed to that child's case");
answer = { ...base, kind: "case_update", case_id: "c_lucia", new_case: null };
await handleInbound(F, mail({ from: "mendesfamily@gmail.com", fromName: "Rosa Mendes", threadId: "thr-fam", subject: "Re: Green cards", text: "Thanks." }), null);
ok(last().case_id === rosa.id, "a case outside the family is never used for the family's thread: it stays with the main case");

// A wife writes from the shared Gmail about her own N-400 while her husband has one: two cases, linked, never one.
addCase("c_karim", "Karim Haddad", "N-400", "haddads@gmail.com", 40);
answer = { ...base, kind: "new_case", case_id: null, new_case: { client: "Layla Haddad", counterpart: null, type_code: "N-400", type_name: "Naturalization" } };
const b4 = cases();
await handleInbound(F, mail({ from: "haddads@gmail.com", fromName: "Haddad Family", subject: "Citizenship for me too", text: "I am Layla, Karim's wife. I would also like to apply for citizenship." }), null);
const layla = last().case_id!;
ok(cases() === b4 + 1 && layla !== "c_karim" && familyOf(F, layla).includes("c_karim"), "a wife on the family's address gets her own case, linked to her husband's");

// A deploy restarts the server while two emails are in flight: one half read, one claimed but not yet read. After the
// restart both are fetched again and each is filed exactly once.
d.prepare("INSERT INTO mailboxes (id, firm_id, user_id, provider, email, refresh_enc, access_enc, expires_at, created_at) VALUES ('mb1', ?, 'u_m', 'microsoft', 'maya@okaforlaw.com', ?, ?, ?, ?)").run(F, seal("r"), seal("a"), Date.now() + 3600e3, at(0));
d.prepare("INSERT INTO messages (id, firm_id, case_id, direction, party, subject, body, at, state, email, mailbox_id, ext_id, rfc_id) VALUES ('m_half', ?, NULL, 'in', 'Lucia Reyes', 'Passport scan ext1', 'Here it is.', ?, 'reading', 'lucia@gmail.com', 'mb1', 'ext1', 'ext1@mail.gmail.com')").run(F, at(0));
d.prepare("INSERT INTO inbound_firm_seen (firm_id, message_id, at) VALUES (?, 'ext1@mail.gmail.com', ?)").run(F, at(0));
d.prepare("INSERT INTO inbound_seen (mailbox_id, msg_id, done) VALUES ('mb1', 'ext1', 0), ('mb1', 'ext2', 0)").run();
answer = { ...base, kind: "case_update", case_id: "c_lucia", new_case: null };
await resumeMail();
const got = (x: string) => d.prepare("SELECT case_id, state FROM messages WHERE firm_id = ? AND subject = ?").all(F, `Passport scan ${x}`) as { case_id: string; state: string }[];
ok(got("ext1").length === 1 && got("ext1")[0].case_id === "c_lucia", "an email half read when the server restarted is read again and filed once");
ok(got("ext2").length === 1 && got("ext2")[0].case_id === "c_lucia", "an email claimed but not yet read when the server restarted is not lost");
ok(!(d.prepare("SELECT COUNT(*) AS n FROM inbound_seen WHERE done = 0").get() as { n: number }).n, "and nothing is left half done");
await resumeMail();
ok(got("ext1").length === 1 && got("ext2").length === 1, "running the recovery again changes nothing");

server.close();
fs.rmSync(process.env.DATA_DIR!, { recursive: true, force: true });
console.log(fails ? `\n${fails} failed` : "\nAll passed");
process.exit(fails ? 1 : 0);
