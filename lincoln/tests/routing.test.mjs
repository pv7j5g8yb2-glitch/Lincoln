// Which case each email, notice, instruction and intake belongs to (src/lib/routing.ts), on a firm with more cases than
// any list a model is shown. Every scenario here is one that happens at a real firm.
import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { register } from "node:module";
register("./eval/loader.mjs", import.meta.url);
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "lincoln-routing-"));
process.env.LINCOLN_SECRET ||= "routing-test-secret-0123456789abcdef";
const R = await import("../src/lib/routing.ts");
const { db } = await import("../src/lib/db.ts");
const { processCase } = await import("../src/lib/intake.ts");
const { createHash } = await import("node:crypto");

let fails = 0;
const ok = (cond, what) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}`); if (!cond) fails++; };

// Pieces.
ok(R.normEmail("L.U.C.I.A+docs@GMAIL.com") === "lucia@gmail.com", "Gmail dots and +tags are the same mailbox");
ok(R.normEmail("omar+uscis@haddad.org") === "omar@haddad.org", "a +tag is ignored on any domain");
ok(R.normEmail("not an email") === "", "a non address is ignored");
ok(R.normPhone("+1 (555) 010-0199") === R.normPhone("5550100199"), "a phone matches with or without +1 and punctuation");
ok(JSON.stringify(R.receiptsIn("Receipt Number IOE 0912345678 and eac2612345678")) === JSON.stringify(["IOE0912345678", "EAC2612345678"]), "receipt numbers found with a space or in lower case");
ok(R.receiptsIn("Invoice ABC1234567890").length === 0, "a code that is not a USCIS office is not a receipt number");
ok(R.aNumbersIn("A# 123-456-789").includes("123456789") && R.aNumbersIn("A-Number: 12345678").includes("012345678") && R.aNumbersIn("Alien number 123 456 789").includes("123456789"), "A-Numbers in every common form, as nine digits");
ok(R.sameName("Dr. Réka Halász", "reka halasz"), "accents, titles and case do not change a name");
ok(R.sameName("Maria Garcia", "María Elena García López"), "a second surname or middle name added is the same person");
ok(!R.sameName("Ana Ortiz", "Daniel Ana Ortiz"), "a different first name is not the same person");
ok(!R.sameName("Maria", "Maria Garcia"), "a single name never matches");
ok(!R.personalAddress("no-reply@uscis.dhs.gov") && !R.personalAddress("notices@uscis.gov") && R.personalAddress("lucia@gmail.com"), "agency and automated senders never identify a client");

// A firm with 260 cases: the client this is about is the oldest, so outside any "most recent 200".
const d = db();
const F = "f_route", at = (days) => new Date(Date.now() - days * 86400000).toISOString();
d.prepare("INSERT INTO firms (id, name) VALUES (?, 'Rivera Immigration Law')").run(F);
d.prepare("INSERT INTO users (id, firm_id, name, email, role, initials, admin) VALUES ('u_r', ?, 'Alex Rivera', 'alex@riveralaw.com', 'Managing attorney', 'AR', 1)").run(F);
const addCase = (id, client, type, email, days, receipt = null) => d.prepare("INSERT INTO cases (id, firm_id, ref, client, type_code, type_name, family, stage, state, summary, attorney_id, paralegal_id, opened_at, client_email, receipt) VALUES (?, ?, ?, ?, ?, 'x', 'Family', 'Evidence', 'moving', '', 'u_r', 'u_r', ?, ?, ?)").run(id, F, `R-${id}`, client, type, at(days), email, receipt);
addCase("c_lucia", "Lucia Reyes", "I-130", "lucia@gmail.com", 900);
addCase("c_omar", "Omar Haddad", "N-400", "omar@haddad.org", 800, "IOE0912345678");
addCase("c_acme1", "Priya Nair", "H-1B", null, 700);
addCase("c_acme2", "Kenji Watanabe", "H-1B", null, 650);
for (let i = 0; i < 260; i++) addCase(`c_f${i}`, `Filler Client${i} Person`, "I-90", `filler${i}@example.org`, 300 - i);
R.learn(F, "c_acme1", "email", "hr@acmecorp.com");
R.learn(F, "c_acme2", "email", "hr@acmecorp.com");
R.learn(F, "c_lucia", "anumber", "123456789");
d.prepare("INSERT INTO messages (id, firm_id, case_id, direction, party, subject, body, at, state, email, thread_id) VALUES ('m_t', ?, 'c_lucia', 'out', 'Lucia Reyes', 'Documents we need', 'Dear Lucia', ?, 'sent', 'lucia@gmail.com', 'thread-lucia')").run(F, at(10));

let r = R.route(F, { from: "l.u.c.i.a+passport@gmail.com", fromName: "L R", subject: "my passport" });
ok(r.likely?.caseId === "c_lucia", "a client writing from the same Gmail with dots or a +tag is recognised");
r = R.route(F, { from: "lucia.reyes@work-email.com", fromName: "Lucia Reyes", threadId: "thread-lucia", subject: "Re: Documents we need" });
ok(r.sure?.caseId === "c_lucia", "a reply in the case's own thread from a new address belongs to the case");
r = R.route(F, { from: "no-reply@uscis.dhs.gov", fromName: "USCIS", subject: "Case Status Update", text: "Receipt Number: IOE0912345678. Your case was received." });
ok(r.sure?.caseId === "c_omar", "an agency notice finds its case by receipt number");
r = R.route(F, { from: "someone@lawoffice.com", subject: "Records", text: "Re: client A# 123-456-789, attached." });
ok(r.sure?.caseId === "c_lucia", "an A-Number finds the case");
r = R.route(F, { from: "hr@acmecorp.com", fromName: "Acme HR", subject: "Offer letters" });
ok(!r.sure && !r.likely && r.related.includes("c_acme1") && r.related.includes("c_acme2"), "an employer writing about several employees is never filed to one of them on its own");
r = R.route(F, { from: "alex@riveralaw.com", fromName: "Alex Rivera", subject: "x" });
ok(!r.likely, "the firm's own address is never taken for a client");
r = R.route(F, { from: "unknown@gmail.com", fromName: "Lucia Reyes", subject: "Hello" });
ok(!r.sure && !r.likely && r.related.includes("c_lucia"), "the same name from an unknown address is offered, never assumed");
r = R.route(F, { from: "brother@gmail.com", fromName: "Ali Haddad", subject: "Documents for Omar Haddad" });
ok(r.related.includes("c_omar"), "a relative writing about a client by name in the subject finds the case");
const cand = R.candidates(F, R.route(F, { from: "lucia@gmail.com" }));
ok(cand[0]?.id === "c_lucia" && cand.length > 100, "the matched case comes first even when it is older than 250 others");

// Before a new case is opened.
let ex = R.existingClient(F, { name: "Lucia Reyes", email: "LUCIA@gmail.com", typeCode: "I-130" });
ok(ex.addTo === "c_lucia", "intake link after an email: the same person and matter go to the existing case");
ex = R.existingClient(F, { name: "Lucia Reyes", email: "lucia@gmail.com", typeCode: "I-485" });
ok(ex.addTo === null && ex.sameClient.includes("c_lucia"), "a new matter for an existing client is a new case, linked to the same person");
ex = R.existingClient(F, { name: "Lucia Reyes", email: "another.lucia@yahoo.com", typeCode: "I-130" });
ok(ex.addTo === null && ex.sameNameOnly.includes("c_lucia"), "a name alone with different details is never merged, only flagged");
R.learn(F, "c_lucia", "person", R.personKey("Lucia Reyes", "1990-04-02"));
ex = R.existingClient(F, { name: "lucía reyes", email: "new-address@outlook.com", dob: "1990-04-02", typeCode: "I-130" });
ok(ex.addTo === "c_lucia", "the same name and date of birth from a new address is the same person");
R.learn(F, "c_omar", "phone", "+1 555 010 0199");
ex = R.existingClient(F, { name: "O. Haddad", phone: "(555) 010-0199", typeCode: "N-400" });
ok(ex.addTo === "c_omar", "the same phone number is the same person");
ex = R.existingClient(F, { name: "Unnamed", email: "omar@haddad.org", typeCode: "Consultation" });
ok(ex.addTo === "c_omar", "a consultation request from an existing client goes to their open case");
addCase("c_unsorted", "Sofia Petrova", "Other", "sofia@petrova.net", 5);
ex = R.existingClient(F, { name: "Sofia Petrova", email: "sofia@petrova.net", typeCode: "I-751" });
ok(ex.addTo === "c_unsorted", "a case opened before its type was known becomes the matter once it is");
d.prepare("UPDATE cases SET stage = 'Approved' WHERE id = 'c_omar'").run();
ex = R.existingClient(F, { name: "Omar Haddad", email: "omar@haddad.org", typeCode: "N-400" });
ok(ex.addTo === null && ex.sameClient.includes("c_omar"), "a closed case is not reopened: a new case for the same person");
R.flagSameName(F, "c_f0", ["c_lucia"]);
ok(d.prepare("SELECT kind FROM case_links WHERE case_id = 'c_f0' AND other_id = 'c_lucia'").get()?.kind === "maybe" && !d.prepare("SELECT 1 FROM approvals WHERE case_id = 'c_f0'").get(), "a possible duplicate is noted, not asked about straight away");

// Learning from a filed message.
R.learnFrom(F, "c_acme1", { from: "priya.nair@gmail.com", text: "My receipt is WAC2612345678." });
ok(R.route(F, { from: "x@y.com", text: "About WAC2612345678" }).sure?.caseId === "c_acme1", "a receipt number in a client's email is remembered for the next notice");
R.learnFrom(F, "c_acme1", { from: "alex@riveralaw.com" });
ok(!d.prepare("SELECT 1 FROM case_keys WHERE value = 'alex@riveralaw.com'").get(), "the firm's own address is never learned as a client's");

// The same file twice is read once, without calling any model.
const file = new TextEncoder().encode("%PDF-1.4 same passport scan");
R.learn(F, "c_lucia", "file", createHash("sha256").update(file).digest("hex"));
await processCase(F, "c_lucia", [file, file]);
ok(d.prepare("SELECT COUNT(*) AS n FROM activity WHERE case_id = 'c_lucia' AND text LIKE '%already in the case arrived again%'").get().n === 1, "a file already in the case, sent again, is not read twice");

// A read cut off by a restart: what it had added is taken back, and the file is read again by itself.
const { resumeReads } = await import("../src/lib/intake.ts");
const { encrypt } = await import("../src/lib/storage.ts");
const { dataDir } = await import("../src/lib/db.ts");
const scan = new TextEncoder().encode("%PDF-1.4 a scan that arrived by email during a deploy");
R.learn(F, "c_omar", "file", createHash("sha256").update(scan).digest("hex"));
d.prepare("UPDATE cases SET pages = 5 WHERE id = 'c_omar'").run();
d.prepare("INSERT INTO documents (id, firm_id, case_id, n, title, kind, page_from, page_to, status) VALUES ('doc_half', ?, 'c_omar', 9, 'Half read', 'other', 4, 5, 'ok')").run(F);
fs.mkdirSync(path.join(dataDir(), "jobs", "job_cut"), { recursive: true });
fs.writeFileSync(path.join(dataDir(), "jobs", "job_cut", "0"), encrypt(F, Buffer.from(scan)));
d.prepare("INSERT INTO read_jobs (id, firm_id, case_id, files, opts, pages_before, tries, created_at) VALUES ('job_cut', ?, 'c_omar', 1, '{}', 3, 0, ?)").run(F, new Date().toISOString());
resumeReads();
await new Promise((r) => setTimeout(r, 400));
ok(d.prepare("SELECT pages FROM cases WHERE id = 'c_omar'").get().pages === 3 && !d.prepare("SELECT 1 FROM documents WHERE id = 'doc_half'").get(), "after a restart, a half finished read is taken back before it runs again");
ok(d.prepare("SELECT COUNT(*) AS n FROM activity WHERE case_id = 'c_omar' AND text LIKE '%already in the case%'").get().n === 1 && !d.prepare("SELECT 1 FROM read_jobs WHERE id = 'job_cut'").get() && !fs.existsSync(path.join(dataDir(), "jobs", "job_cut")), "the saved file is read again by itself, then removed");
d.prepare("INSERT INTO read_jobs (id, firm_id, case_id, files, opts, pages_before, tries, created_at) VALUES ('job_dead', ?, 'c_acme1', 1, '{}', 0, 2, ?)").run(F, new Date().toISOString());
resumeReads();
ok(/two attempts/.test(d.prepare("SELECT note FROM cases WHERE id = 'c_acme1'").get().note ?? "") && !d.prepare("SELECT 1 FROM read_jobs WHERE id = 'job_dead'").get(), "a read that keeps failing stops after two tries and says so on the case");

// Families: an address or phone shared under another name is a relative, never the same person.
const M = await import("../src/lib/merge.ts");
const { savePage, loadPage, pagesDir } = await import("../src/lib/storage.ts");
addCase("c_karim", "Karim Haddad", "N-400", "haddadfamily@gmail.com", 50);
ex = R.existingClient(F, { name: "Layla Haddad", email: "haddadfamily@gmail.com", typeCode: "N-400" });
ok(ex.addTo === null && ex.household.includes("c_karim"), "a wife writing from the family's Gmail about her own N-400 gets her own case, linked as family, not added to her husband's");
addCase("c_wei", "Wei Chen", "H-1B", "hr@acme-robotics.com", 40);
ex = R.existingClient(F, { name: "Priya Patel", email: "hr@acme-robotics.com", typeCode: "H-1B" });
ok(ex.addTo === null && !ex.household.length, "an employer's HR address shared by two employees ties nobody together");
ex = R.existingClient(F, { name: "Karim Haddad", email: "haddadfamily@gmail.com", typeCode: "N-400" });
ok(ex.addTo === "c_karim", "the same person from the family address is still the same person");

// A number written in a family's email belongs to the relative it is already on.
R.learn(F, "c_karim", "receipt", "IOE0900000001");
addCase("c_layla", "Layla Haddad", "N-400", null, 20);
R.learnFrom(F, "c_layla", { text: "My husband's receipt is IOE0900000001." });
ok(!d.prepare("SELECT 1 FROM case_keys WHERE case_id = 'c_layla' AND value = 'IOE0900000001'").get(), "a relative's receipt number in an email is not learned on the wrong person's case");

// Merging: proof arrives later that two cases are one person and one matter.
const jpeg = (t) => Buffer.from(`page ${t}`);
addCase("c_ana1", "Ana Lima", "I-485", "ana@gmail.com", 30);
addCase("c_ana2", "Ana Lima", "I-485", "ana.lima@work.com", 2);
for (let i = 1; i <= 3; i++) savePage(F, "c_ana1", i, jpeg(`a${i}`));
for (let i = 1; i <= 2; i++) savePage(F, "c_ana2", i, jpeg(`b${i}`));
d.prepare("UPDATE cases SET pages = 3 WHERE id = 'c_ana1'").run();
d.prepare("UPDATE cases SET pages = 2 WHERE id = 'c_ana2'").run();
d.prepare("INSERT INTO documents (id, firm_id, case_id, n, title, kind, page_from, page_to, status) VALUES ('d_a1', ?, 'c_ana1', 1, 'Passport', 'Identity', 1, 3, 'ok'), ('d_b1', ?, 'c_ana2', 1, 'Birth certificate', 'Civil', 1, 2, 'ok')").run(F, F);
d.prepare("INSERT INTO criteria (id, firm_id, case_id, n, code, name, citation, recommendation, strength, summary, weakness, evidence) VALUES ('k_a', ?, 'c_ana1', 1, 'A', 'Admissibility', 'INA 212', 'more', 'Moderate', 's', 'w', ?), ('k_b', ?, 'c_ana2', 1, 'A', 'Admissibility', 'INA 212', 'claim', 'Strong', 's2', 'w2', ?)").run(F, JSON.stringify([{ page: 2, grade: 3 }]), F, JSON.stringify([{ page: 1, grade: 5 }]));
d.prepare("INSERT INTO issues (id, firm_id, case_id, kind, severity, title, detail, sources, status, created_at) VALUES ('i_b', ?, 'c_ana2', 'risk', 'low', 'Name spelled two ways', 'p. 2 spells it Anna.', ?, 'open', ?)").run(F, JSON.stringify([1, 2]), at(1));
d.prepare("INSERT INTO drafts (id, firm_id, case_id, title, kind, status, version, content, updated_at) VALUES ('dr_b', ?, 'c_ana2', 'Cover letter', 'letter', 'for_review', 1, ?, ?)").run(F, JSON.stringify({ sections: [{ paras: ["She was born in Lisbon (p. 1) and entered in 2019 (pp. 1-2)."] }] }), at(1));
d.prepare("INSERT INTO messages (id, firm_id, case_id, direction, party, subject, body, at, state, email) VALUES ('m_b', ?, 'c_ana2', 'in', 'Ana Lima', 'Docs', 'x', ?, 'filed', 'ana.lima@work.com')").run(F, at(1));
R.learn(F, "c_ana1", "anumber", "201234567");
R.learn(F, "c_ana2", "anumber", "201234567");
const kept = M.reconcile(F, "c_ana2");
const ana = d.prepare("SELECT pages FROM cases WHERE id = 'c_ana1'").get();
ok(kept === "c_ana1" && !d.prepare("SELECT 1 FROM cases WHERE id = 'c_ana2'").get() && ana.pages === 5, "the same A-Number on two cases of the same name and matter merges them into the older case");
ok(d.prepare("SELECT n, page_from, page_to FROM documents WHERE id = 'd_b1'").get().page_from === 4 && d.prepare("SELECT n FROM documents WHERE id = 'd_b1'").get().n === 2 && String(loadPage(F, "c_ana1", 4)) === "page b1", "the merged case's pages follow the kept case's, with the documents renumbered");
ok(JSON.parse(d.prepare("SELECT content FROM drafts WHERE id = 'dr_b'").get().content).sections[0].paras[0] === "She was born in Lisbon (p. 4) and entered in 2019 (pp. 4-5).", "every citation in a draft is renumbered to the pages it now cites");
ok(JSON.stringify(JSON.parse(d.prepare("SELECT sources FROM issues WHERE id = 'i_b'").get().sources)) === "[4,5]" && d.prepare("SELECT detail FROM issues WHERE id = 'i_b'").get().detail === "p. 5 spells it Anna.", "issues point at the right pages after the merge");
const crit = d.prepare("SELECT recommendation, evidence FROM criteria WHERE case_id = 'c_ana1'").all();
ok(crit.length === 1 && crit[0].recommendation === "claim" && JSON.stringify(JSON.parse(crit[0].evidence).map((e) => e.page)) === "[2,4]", "evidence for the same requirement becomes one row, graded by the stronger");
ok(d.prepare("SELECT case_id FROM messages WHERE id = 'm_b'").get().case_id === "c_ana1" && R.route(F, { from: "ana.lima@work.com" }).likely?.caseId === "c_ana1" && d.prepare("SELECT 1 FROM case_keys WHERE case_id = 'c_ana1' AND kind = 'anumber'").get() && !fs.existsSync(pagesDir("c_ana2")), "mail and identifiers move with it, and the old case's files are gone");
ok(d.prepare("SELECT COUNT(*) AS n FROM activity WHERE case_id = 'c_ana1' AND text LIKE 'Merged with%the same A-Number%'").get().n === 1, "the merge is recorded on the case, with the proof");

// Not while a case is reading: the merge waits, then happens.
addCase("c_ben1", "Ben Okoro", "I-130", null, 25);
addCase("c_ben2", "Ben Okoro", "I-130", null, 1);
d.prepare("UPDATE cases SET processing = 1 WHERE id = 'c_ben2'").run();
R.learn(F, "c_ben1", "person", R.personKey("Ben Okoro", "1990-04-02"));
R.learn(F, "c_ben2", "person", R.personKey("Ben Okoro", "1990-04-02"));
ok(M.reconcile(F, "c_ben2") === "c_ben2" && d.prepare("SELECT 1 FROM cases WHERE id = 'c_ben2'").get(), "a case still reading files is never merged mid read");
d.prepare("UPDATE cases SET processing = 0 WHERE id = 'c_ben2'").run();
M.finishMerges();
ok(!d.prepare("SELECT 1 FROM cases WHERE id = 'c_ben2'").get() && d.prepare("SELECT 1 FROM cases WHERE id = 'c_ben1'").get(), "and the merge goes ahead once the reading is done");

// The same person, another matter: linked, never merged. Another name: asked, never merged.
addCase("c_tom1", "Tom Silva", "H-1B", null, 60);
addCase("c_tom2", "Tom Silva", "I-140", null, 3);
R.learn(F, "c_tom1", "anumber", "209999999"); R.learn(F, "c_tom2", "anumber", "209999999");
M.reconcile(F, "c_tom2");
ok(d.prepare("SELECT 1 FROM cases WHERE id = 'c_tom2'").get() && M.linksOf(F, "c_tom2").some((l) => l.id === "c_tom1" && l.kind === "same_person"), "the same person with another matter keeps two cases, linked as the same client");
addCase("c_mary1", "Mary Jones", "I-485", null, 70);
addCase("c_mary2", "Mary Smith", "I-485", null, 4);
R.learn(F, "c_mary1", "anumber", "208888888"); R.learn(F, "c_mary2", "anumber", "208888888");
M.reconcile(F, "c_mary2");
M.settleDuplicates();
ok(d.prepare("SELECT 1 FROM cases WHERE id = 'c_mary1'").get() && d.prepare("SELECT 1 FROM cases WHERE id = 'c_mary2'").get() && d.prepare("SELECT 1 FROM approvals WHERE case_id = 'c_mary2' AND kind = 'same_person' AND brief LIKE 'Same A-Number%'").get(), "the same A-Number under another name (a married name) is asked about, never merged by itself");
M.link(F, "c_mary2", "c_mary1", "different");
d.prepare("DELETE FROM approvals WHERE case_id = 'c_mary2'").run();
R.flagSameName(F, "c_mary2", ["c_mary1"]);
ok(!d.prepare("SELECT 1 FROM approvals WHERE case_id = 'c_mary2'").get() && !M.reconcile(F, "c_mary2").startsWith("x") && !d.prepare("SELECT 1 FROM approvals WHERE case_id = 'c_mary2'").get(), "once a person says they are different people, Lincoln never asks again");

// Same name: what only one person has decides it, and Lincoln asks only when nothing does.
const pair = (a, b, name, daysA, daysB) => { addCase(a, name, "I-130", null, daysA); addCase(b, name, "I-130", null, daysB); R.flagSameName(F, b, [a]); };
const asked = (id) => Boolean(d.prepare("SELECT 1 FROM approvals WHERE case_id = ? AND kind = 'same_person' AND status = 'pending'").get(id));
const kindOf = (a, b) => d.prepare("SELECT kind FROM case_links WHERE case_id = ? AND other_id = ?").get(a, b)?.kind;
pair("c_jg1", "c_jg2", "Jose Gonzalez", 400, 1);
R.learn(F, "c_jg1", "dob", "1979-02-11"); R.learn(F, "c_jg2", "dob", "1991-08-30");
M.settleDuplicates();
ok(kindOf("c_jg2", "c_jg1") === "different" && !asked("c_jg2") && !asked("c_jg1"), "the same name with a different date of birth: different people, nobody is asked");
pair("c_ap1", "c_ap2", "Ahmed Patel", 400, 1);
R.learn(F, "c_ap1", "anumber", "211111111"); R.learn(F, "c_ap2", "anumber", "222222222");
M.settleDuplicates();
ok(kindOf("c_ap2", "c_ap1") === "different" && !asked("c_ap2"), "a different A-Number: different people, nobody is asked");
pair("c_kn1", "c_kn2", "Kim Nguyen", 400, 1);
R.learn(F, "c_kn1", "country", "Vietnam"); R.learn(F, "c_kn2", "country", "South Korea");
M.settleDuplicates();
ok(kindOf("c_kn2", "c_kn1") === "different" && !asked("c_kn2"), "a different country of birth: different people, nobody is asked");
pair("c_lc1", "c_lc2", "Li Chen", 400, 1);
R.learn(F, "c_lc1", "person", R.personKey("Li Chen", "1988-03-03")); R.learn(F, "c_lc2", "person", R.personKey("Li Chen", "1988-03-03"));
M.settleDuplicates();
ok(!d.prepare("SELECT 1 FROM cases WHERE id = 'c_lc2'").get() && !asked("c_lc1"), "the same name and date of birth: one person, merged without asking");
pair("c_sm1", "c_sm2", "Sara Malik", 400, 1);
M.settleDuplicates();
ok(kindOf("c_sm2", "c_sm1") === "maybe" && !asked("c_sm2"), "a new case Lincoln knows nothing about yet: it waits for the client's documents instead of asking");
R.learn(F, "c_sm1", "passport", "P1234567"); R.learn(F, "c_sm2", "passport", "X7654321");
d.prepare("UPDATE cases SET pages = 3 WHERE id = 'c_sm2'").run();
M.settleDuplicates();
ok(asked("c_sm2") && kindOf("c_sm2", "c_sm1") === "asked", "documents read, only different passport numbers (renewed passports differ): genuinely unsure, so asked once");
M.settleDuplicates();
ok(d.prepare("SELECT COUNT(*) AS n FROM approvals WHERE case_id = 'c_sm2' AND kind = 'same_person'").get().n === 1, "and never asked twice");
R.learn(F, "c_sm1", "dob", "1970-01-01"); R.learn(F, "c_sm2", "dob", "1999-12-12");
M.settleDuplicates();
ok(!asked("c_sm2") && kindOf("c_sm2", "c_sm1") === "different", "a date of birth that arrives later settles it: the question is withdrawn");
pair("c_old1", "c_old2", "Omar Farouk", 400, 4);
M.settleDuplicates();
ok(asked("c_old2"), "after three days with nothing to go on, the attorney is asked, so no duplicate sits unnoticed");

// A family: each document reaches the case of everyone whose application needs it, once.
addCase("c_rosa", "Rosa Lima", "I-485", null, 10);
addCase("c_leo", "Leo Lima", "I-485", null, 10);
M.link(F, "c_rosa", "c_leo", "family");
for (let i = 1; i <= 2; i++) savePage(F, "c_rosa", i, jpeg(`r${i}`));
d.prepare("UPDATE cases SET pages = 2 WHERE id = 'c_rosa'").run();
d.prepare("INSERT INTO documents (id, firm_id, case_id, n, title, kind, page_from, page_to, doc_date, status) VALUES ('d_r1', ?, 'c_rosa', 1, 'Birth certificate of Leo Lima', 'Civil', 1, 2, '2012-05-01', 'ok')").run(F);
M.copyDocuments(F, "c_rosa", "c_leo", [1]);
M.copyDocuments(F, "c_rosa", "c_leo", [1]);
const leo = d.prepare("SELECT n, page_from, page_to FROM documents WHERE case_id = 'c_leo'").all();
ok(leo.length === 1 && leo[0].page_from === 1 && leo[0].page_to === 2 && String(loadPage(F, "c_leo", 2)) === "page r2" && d.prepare("SELECT pages FROM cases WHERE id = 'c_leo'").get().pages === 2, "a child's document placed in the child's case, with its pages, once");
ok(JSON.stringify(M.familyOf(F, "c_leo").sort()) === JSON.stringify(["c_leo", "c_rosa"]), "the family is found from any member's case");

fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
assert.equal(fails, 0, `${fails} routing checks failed`);
console.log("all routing tests passed");
