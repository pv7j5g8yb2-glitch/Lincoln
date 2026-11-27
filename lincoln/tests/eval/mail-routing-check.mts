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
Object.assign(process.env, { DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), "lincoln-mail-")), LINCOLN_SECRET: "mail-routing-check-secret-0123456789", LLM_BATCH: "off", LLM_API_KEY: "standin", LLM_BASE_URL: "http://127.0.0.1:4551", LLM_MODEL: "standin", LLM_MODEL_LIGHT: "standin" });
const { db, uid } = await import("../../src/lib/db.ts");
const { handleInbound } = await import("../../src/lib/agent.ts");
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
const mail = (o: Partial<{ from: string; fromName: string; subject: string; text: string; threadId: string }>) => ({ id: uid(), threadId: o.threadId ?? uid(), from: o.from ?? "x@y.com", fromName: o.fromName ?? "X", subject: o.subject ?? "Hello", text: o.text ?? "Hello", attachments: [], verified: true });
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
ok((d.prepare("SELECT COUNT(*) AS n FROM issues WHERE case_id = ? AND title = 'Same name as another client'").get(fresh) as { n: number }).n === 1, "and the possible duplicate is flagged for a person to check");

answer = { ...base, kind: "new_case", case_id: null, new_case: { client: "Omar Haddad", counterpart: null, type_code: "I-131", type_name: "Travel document" } };
await handleInbound(F, mail({ from: "omar@haddad.org", fromName: "Omar Haddad", subject: "Travel", text: "I also need a travel document." }), null);
ok(cases() === n0 + 2 && last().case_id !== "c_omar", "a new matter for an existing client is its own case");

answer = { ...base, kind: "case_update", case_id: "c_does_not_exist", new_case: null };
await handleInbound(F, mail({ from: "stranger@gmail.com", fromName: "Someone", subject: "Hi", text: "About my case" }), null);
ok(last().state === "unsure" && !last().case_id, "a case id the model made up is never used: the email waits in the Inbox");

server.close();
fs.rmSync(process.env.DATA_DIR!, { recursive: true, force: true });
console.log(fails ? `\n${fails} failed` : "\nAll passed");
process.exit(fails ? 1 : 0);
