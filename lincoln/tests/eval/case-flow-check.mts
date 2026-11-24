// Case flow check with the request aware stand-in (free): a Word file of consultation notes, a client email that claims an
// award with no proof in the file, then a late file. Run from lincoln/: node tests/eval/model-standin-case.cjs /tmp/flow.log &
// then npx tsx tests/eval/case-flow-check.mts /tmp/flow.log
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import JSZip from "jszip";

const log = process.argv[2];
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "flow-"));
Object.assign(process.env, { LINCOLN_SECRET: "eval-only-secret-not-for-production-0001", LLM_BATCH: "off", LLM_API_KEY: "standin", LLM_BASE_URL: "http://127.0.0.1:4549", LLM_MODEL: "standin", LLM_MODEL_LIGHT: "standin", LINCOLN_AUTO_FORMS: "off" });
const { db, uid } = await import("../src/lib/db.ts");
const { processCase } = await import("../src/lib/intake.ts");
const d = db();
const firm = "f_" + uid(), user = "u_" + uid(), cs = "c_" + uid();
d.prepare("INSERT INTO firms (id, name) VALUES (?, 'Test Firm')").run(firm);
d.prepare("INSERT INTO users (id, firm_id, name, email, role, initials, admin) VALUES (?, ?, 'A B', 'a@eval.example', 'Partner', 'AB', 1)").run(user, firm);
d.prepare("INSERT INTO cases (id, firm_id, ref, client, type_code, type_name, family, stage, state, attorney_id, opened_at, pages) VALUES (?, ?, 'R1', 'Maria Hernandez', 'EB-1A', 'Extraordinary ability', 'Employment based immigrant', 'Intake', 'open', ?, ?, 0)").run(cs, firm, user, new Date().toISOString());
d.prepare("INSERT INTO messages (id, firm_id, case_id, direction, party, party_role, subject, body, at, state) VALUES (?, ?, ?, 'in', 'Maria Hernandez', 'Client', 'My background', ?, ?, 'read')")
  .run(uid(), firm, cs, "Hi, as I mentioned I won the 2024 HealthBridge Innovation Challenge.\n\nOn 12 Nov 2026 the firm wrote:\n> Please send your CV", "2026-11-20T10:00:00Z");

const p = (t: string) => `<w:p><w:r><w:t>${t}</w:t></w:r></w:p>`;
const zip = new JSZip();
zip.file("[Content_Types].xml", "<Types/>");
zip.file("word/document.xml", `<w:document xmlns:w="x"><w:body>${p("Consultation notes, 12 November 2026")}${Array.from({ length: 140 }, (_, i) => p(`Note ${i + 1}: publications, citations, judging and the proposed endeavour.`)).join("")}</w:body></w:document>`);
const docx = new Uint8Array(await zip.generateAsync({ type: "uint8array" }));

await processCase(firm, cs, [docx]);
const c1 = d.prepare("SELECT pages, note FROM cases WHERE id = ?").get(cs) as { pages: number; note: string | null };
console.log("after Word file: pages", c1.pages, "note", c1.note);
const issues = d.prepare("SELECT title FROM issues WHERE case_id = ?").all(cs) as { title: string }[];
console.log("issues:", issues.map((x) => x.title));

const txt = new TextEncoder().encode("HealthBridge Innovation Challenge 2024\nCertificate of award presented to Maria Hernandez.\n");
await processCase(firm, cs, [txt], { append: true });
const acts = d.prepare("SELECT text FROM activity WHERE case_id = ? AND kind = 'evidence'").all(cs) as { text: string }[];
console.log("evidence activity:", acts.map((x) => x.text));
const all = fs.readFileSync(log, "utf8");
console.log("second check saw the client email:", all.includes("EMAILS RECEIVED") && all.includes("HealthBridge Innovation Challenge") && !all.includes("Please send your CV"));
console.log("second check asked for claims without proof:", all.includes("7. Claims without proof"));
process.exit(0);
