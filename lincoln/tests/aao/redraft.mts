// Redoes only the eligibility assessment (draft and citation check) on a database left by run.mts, so a prompt change
// can be rechecked for about $0.06 a case instead of the whole pipeline. Spends credits: run only with approval. From lincoln/:
//   DATA_DIR=/tmp/lincoln-aao-XXXX LLM_API_KEY=... LLM_MODEL=claude-sonnet-5-5 LLM_MODEL_LIGHT=claude-haiku-5-5 \
//   LLM_BASE_URL=https://api.anthropic.com LLM_DAILY_BUDGET_USD=2.5 npx tsx tests/aao/redraft.mts --only 07-waiver-criminal-ghana --label sonnet-redraft
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const arg = (k: string) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : undefined; };
if (!process.env.DATA_DIR) throw new Error("Set DATA_DIR to the folder run.mts printed.");
const firms = JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR, "cases.json"), "utf8")) as Record<string, string>;
const only = arg("only")?.split(",") ?? Object.keys(firms);
const label = (arg("label") ?? "redraft").replace(/[^\w.-]/g, "-");
process.env.LINCOLN_SECRET ||= "eval-only-secret-not-for-production-0001";
process.env.LLM_BATCH = "off";
process.env.LAW_SYNC = "off";
const { db, uid } = await import("../../src/lib/db.ts");
const { draftForCase } = await import("../../src/lib/intake.ts");
const d = db();
const out = path.join(HERE, "results", label);
fs.mkdirSync(out, { recursive: true });
// The same request run.mts makes.
const ASK = fs.readFileSync(path.join(HERE, "run.mts"), "utf8").match(/const ASK = "([^"]+)"/)![1];
const spent = (firm: string) => (d.prepare("SELECT COALESCE(SUM(cost), 0) AS c FROM usage WHERE firm_id = ?").get(firm) as { c: number }).c;

let total = 0;
for (const name of only) {
  const firm = firms[name];
  const c = firm ? (d.prepare("SELECT id FROM cases WHERE firm_id = ? LIMIT 1").get(firm) as { id: string } | undefined) : undefined;
  if (!c) { console.error(`${name}: no case in this run`); continue; }
  const before = spent(firm);
  const draftId = uid();
  d.prepare("INSERT INTO drafts (id, firm_id, case_id, title, kind, status, version, content, updated_at) VALUES (?, ?, ?, 'Eligibility assessment', 'generic', 'drafting', 1, ?, ?)").run(draftId, firm, c.id, JSON.stringify({ sections: [], facts: 0, calls: 0, notes: 0, claimed: [], generic: true }), new Date().toISOString());
  await draftForCase(firm, c.id, draftId, ASK);
  const r = d.prepare("SELECT title, status, content FROM drafts WHERE id = ?").get(draftId) as { title: string; status: string; content: string };
  const j = JSON.parse(r.content) as { sections?: { heading?: string; paras?: { t: string }[][] }[]; error?: string };
  const text = (j.sections ?? []).map((s) => `### ${s.heading ?? ""}\n${(s.paras ?? []).map((p) => p.map((g) => g.t).join("")).join("\n\n")}`).join("\n\n") || (j.error ?? "");
  const cost = spent(firm) - before;
  total += cost;
  fs.writeFileSync(path.join(out, `${name}.md`), `# ${name} (${label}, draft only)\nCost $${cost.toFixed(3)}\n\n## Drafts\n### ${r.title} (${r.status})\n${text}\n`);
  console.log(`${name}: $${cost.toFixed(3)}`);
}
console.log(`total $${total.toFixed(3)}`);
process.exit(0);
