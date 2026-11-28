// Free check of firm memory on the stand-in model.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "lincoln-mem-"));
process.env.LINCOLN_SECRET ||= "eval-only-secret-not-for-production-0001";
const { db, uid } = await import("../../src/lib/db.ts");
const m = await import("../../src/lib/memory.ts");
const d = db();
const firm = "f_" + uid(), user = "u_" + uid();
d.prepare("INSERT INTO firms (id, name) VALUES (?, 'Eval Law')").run(firm);
d.prepare("INSERT INTO users (id, firm_id, name, email, role, initials, admin) VALUES (?, ?, 'Alex Rivera', ?, 'Managing partner', 'AR', 1)").run(user, firm, `a.${firm}@eval.example`);
const mk = (client: string) => { const id = "c_" + uid(); d.prepare("INSERT INTO cases (id, firm_id, ref, client, counterpart, type_code, type_name, family, stage, state, summary, attorney_id, paralegal_id, opened_at, sensitive, pages, processing) VALUES (?, ?, 'R', ?, 'Daniel Reyes', 'I-130', 'Relative petition', 'Family based', 'Response', 'moving', '', ?, ?, ?, 0, 1, 0)").run(id, firm, client, user, user, new Date().toISOString()); return id; };
const a = mk("Sofia Isabel Reyes"), b = mk("Lena Haddad");
const content = (paras: string[]) => JSON.stringify({ sections: [{ id: "s0", heading: "Bona fide marriage", paras: paras.map((t) => [{ t, k: "plain" }]) }], facts: 0, calls: 0, notes: 0, claimed: [], generic: true });
const dA = uid();
d.prepare("INSERT INTO drafts (id, firm_id, case_id, title, kind, status, version, content, updated_at) VALUES (?, ?, ?, 'Response to the Request for Evidence', 'generic', 'for_review', 1, ?, ?)").run(dA, firm, a, content(["Sofia and Daniel married on 9 March 2024 (p. 4).", "Sofia lives with Daniel in Chicago (p. 6).", "Sofia has a joint bank account with Daniel (p. 8).", "This paragraph stays the same."]), new Date().toISOString());
// The attorney edits three paragraphs.
m.applyDraftEdit(firm, dA, [{ heading: "Bona fide marriage", paras: ["Ms. Reyes and Mr. Reyes married on 9 March 2024 (p. 4).", "Ms. Reyes resides with Mr. Reyes in Chicago, Illinois (p. 6).", "The couple hold a joint bank account (p. 8).", "This paragraph stays the same."] }]);
console.log("edits kept:", (d.prepare("SELECT COUNT(*) AS n FROM memory_edits WHERE firm_id = ?").get(firm) as { n: number }).n, "| version:", (d.prepare("SELECT version FROM drafts WHERE id = ?").get(dA) as { version: number }).version);
for (let i = 0; i < 20 && !m.rules(firm, "draft").length; i++) await new Promise((r) => setTimeout(r, 300));
console.log("learned:", m.rules(firm, "draft"));
m.removeRule(firm, "draft", 2);
console.log("after removing one:", m.rules(firm, "draft").length);
console.log("style for prompts:", m.firmStyle(firm, "draft").split("\n").length - 2, "lines");
// Approved in case A, used as precedent in case B with A's names removed.
d.prepare("UPDATE drafts SET status = 'approved' WHERE id = ?").run(dA);
const p = m.precedentFor(firm, b, "Draft the response to the Request for Evidence");
console.log("precedent found:", Boolean(p), "| names removed:", !/Sofia|Reyes|Daniel/.test(p), "|", p.split("\n")[3]);
console.log("unrelated request finds none:", m.precedentFor(firm, b, "Cover letter") === "");
process.exit(0);
