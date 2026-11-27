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
ok(d.prepare("SELECT COUNT(*) AS n FROM issues WHERE case_id = 'c_f0' AND title = 'Same name as another client'").get().n === 1, "a possible duplicate is raised as a quiet issue");

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

fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
assert.equal(fails, 0, `${fails} routing checks failed`);
console.log("all routing tests passed");
