// Runs Lincoln on the real USCIS appeal cases in tests/aao/cases: each case.md arrives as a PDF attached to a client
// email, Lincoln opens and reads the case on its own, then is asked for an eligibility assessment. Everything Lincoln
// produced is written to tests/aao/results/<label>/<case>.md for grading against key.md. Spends credits: run only with
// Ismael's approval. From lincoln/:
//   LLM_API_KEY=... LLM_MODEL=claude-sonnet-5-5 LLM_MODEL_LIGHT=claude-haiku-5-5 LLM_BASE_URL=https://api.anthropic.com \
//   LLM_DAILY_BUDGET_USD=2.5 LINCOLN_AUTO_FORMS=off npx tsx tests/aao/run.mts [--only 02-o1a-export-director] [--label sonnet]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const arg = (k: string) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : undefined; };
const only = arg("only")?.split(",");
const label = (arg("label") ?? process.env.LLM_MODEL ?? "model").replace(/[^\w.-]/g, "-");
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "lincoln-aao-"));
process.env.LINCOLN_SECRET ||= "eval-only-secret-not-for-production-0001";
process.env.LLM_BATCH = "off";
const { db, uid } = await import("../../src/lib/db.ts");
const { handleInbound } = await import("../../src/lib/agent.ts");
const { draftForCase } = await import("../../src/lib/intake.ts");
const d = db();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const out = path.join(HERE, "results", label);
fs.mkdirSync(out, { recursive: true });

// A plain, readable PDF of the case file, as a firm's own summary would arrive.
async function pdfOf(text: string) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const map: Record<string, string> = { "’": "'", "‘": "'", "“": '"', "”": '"', "–": ",", "—": "," };
  const clean = text.replace(/[^\x20-\x7E\n]/g, (c) => map[c] ?? " ");
  let page = pdf.addPage([612, 792]);
  let y = 740;
  for (const raw of clean.replace(/^#+ /gm, "").split("\n")) {
    let line = "";
    const flush = () => {
      if (y < 60) { page = pdf.addPage([612, 792]); y = 740; }
      page.drawText(line, { x: 60, y, size: 11, font });
      y -= 15;
      line = "";
    };
    for (const w of raw.split(" ")) {
      if (line && font.widthOfTextAtSize(`${line} ${w}`, 11) > 490) flush();
      line = line ? `${line} ${w}` : w;
    }
    flush();
  }
  return pdf.save();
}

const ASK = "Eligibility assessment for the attorney: take each legal requirement for this case type in turn, say whether the evidence in the file meets it and exactly why, cite the governing rule, list anything missing, weak or inconsistent, and end with an overall view of the case's prospects and what the firm should do next.";

async function waitQuiet(firm: string, maxMin: number) {
  const started = Date.now();
  let quiet = 0, last = -1;
  while (Date.now() - started < maxMin * 60_000) {
    const busy = d.prepare("SELECT (SELECT COUNT(*) FROM cases WHERE firm_id = ? AND processing = 1) + (SELECT COUNT(*) FROM drafts WHERE firm_id = ? AND status = 'drafting') AS n").get(firm, firm) as { n: number };
    const used = (d.prepare("SELECT COUNT(*) AS n FROM usage WHERE firm_id = ?").get(firm) as { n: number }).n;
    quiet = busy.n === 0 && used === last ? quiet + 1 : 0;
    last = used;
    if (quiet >= 3) return;
    await sleep(4000);
  }
}

const draftText = (content: string) => {
  try {
    const j = JSON.parse(content) as { sections?: { heading?: string; paras?: { t: string }[][] }[] };
    return (j.sections ?? []).map((s) => `### ${s.heading ?? ""}\n${(s.paras ?? []).map((p) => p.map((g) => g.t).join("")).join("\n\n")}`).join("\n\n");
  } catch {
    return content;
  }
};

const names = fs.readdirSync(path.join(HERE, "cases")).filter((n) => !only || only.includes(n)).sort();
let total = 0;
// Which firm holds which case, so redraft.mts can redo only the drafting step on this run's database.
const firms: Record<string, string> = {};
console.log(`data ${process.env.DATA_DIR}`);
for (const name of names) {
  const t0 = Date.now();
  const firm = "f_" + uid(), user = "u_" + uid();
  firms[name] = firm;
  fs.writeFileSync(path.join(process.env.DATA_DIR!, "cases.json"), JSON.stringify(firms));
  d.prepare("INSERT INTO firms (id, name) VALUES (?, 'Rivera Immigration Law')").run(firm);
  d.prepare("INSERT INTO users (id, firm_id, name, email, role, initials, admin) VALUES (?, ?, 'Alex Rivera', ?, 'Managing partner', 'AR', 1)").run(user, firm, `alex.${firm}@eval.example`);
  const caseText = fs.readFileSync(path.join(HERE, "cases", name, "case.md"), "utf8");
  try {
    await handleInbound(firm, { id: uid(), threadId: uid(), from: "client@eval.example", fromName: "Prospective client", subject: "Case review", text: "Hello, please find a summary of my situation and the evidence attached. I would like the firm to take my case.", attachments: [{ name: "case-summary.pdf", type: "application/pdf", data: Buffer.from(await pdfOf(caseText)) }] }, null);
    await waitQuiet(firm, 12);
    const c = d.prepare("SELECT id FROM cases WHERE firm_id = ? LIMIT 1").get(firm) as { id: string } | undefined;
    if (c) {
      const draftId = uid();
      d.prepare("INSERT INTO drafts (id, firm_id, case_id, title, kind, status, version, content, updated_at) VALUES (?, ?, ?, 'Eligibility assessment', 'generic', 'drafting', 1, ?, ?)").run(draftId, firm, c.id, JSON.stringify({ sections: [], facts: 0, calls: 0, notes: 0, claimed: [], generic: true }), new Date().toISOString());
      await draftForCase(firm, c.id, draftId, ASK);
      await waitQuiet(firm, 8);
    }
  } catch (e) {
    console.error(name, e instanceof Error ? e.message : e);
  }
  const q = <T,>(sql: string) => d.prepare(sql).all(firm) as T[];
  const cs = q<{ type_code: string; type_name: string; summary: string; waiting_on: string | null }>("SELECT type_code, type_name, summary, waiting_on FROM cases WHERE firm_id = ?");
  const issues = q<{ title: string; detail: string | null; severity: string }>("SELECT title, detail, severity FROM issues WHERE firm_id = ?");
  const crit = q<{ name: string; recommendation: string; summary: string | null; weakness: string | null }>("SELECT name, recommendation, summary, weakness FROM criteria WHERE firm_id = ?");
  const drafts = q<{ title: string; status: string; content: string }>("SELECT title, status, content FROM drafts WHERE firm_id = ?");
  const msgs = q<{ subject: string; body: string; state: string }>("SELECT subject, body, state FROM messages WHERE firm_id = ? AND direction = 'out'");
  const cost = (d.prepare("SELECT COALESCE(SUM(cost), 0) AS c FROM usage WHERE firm_id = ?").get(firm) as { c: number }).c;
  total += cost;
  const md = [
    `# ${name} (${label})`, `Cost $${cost.toFixed(3)}, ${Math.round((Date.now() - t0) / 1000)} s`, "",
    "## Case as Lincoln opened it", ...cs.map((x) => `${x.type_code} ${x.type_name}. ${x.summary} ${x.waiting_on ? `Waiting on: ${x.waiting_on}` : ""}`), "",
    "## Issues Lincoln raised", ...issues.map((i) => `* [${i.severity}] ${i.title}. ${i.detail ?? ""}`), "",
    ...(crit.length ? ["## Criteria", ...crit.map((k) => `* ${k.name}: ${k.recommendation}. ${k.summary ?? ""} ${k.weakness ? `Weakness: ${k.weakness}` : ""}`), ""] : []),
    "## Drafts", ...drafts.map((x) => `### ${x.title} (${x.status})\n${draftText(x.content)}`), "",
    "## Emails prepared", ...msgs.map((m) => `* ${m.subject} (${m.state})\n${m.body}`),
  ].join("\n");
  fs.writeFileSync(path.join(out, `${name}.md`), md);
  console.log(`${name}: $${cost.toFixed(3)}, ${issues.length} issues, ${drafts.length} drafts`);
}
console.log(`total $${total.toFixed(3)}`);
process.exit(0);
