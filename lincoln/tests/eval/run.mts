// Lincoln's accuracy record. Each test case arrives as a client email with its file, exactly as real work does;
// Lincoln opens the case, reads it, checks it, drafts and fills forms on its own. When it has finished, what it
// wrote is graded against the answer key (checks.json) and a dated scorecard is written to results/.
//
// Run from lincoln/:  node --import ./tests/eval/register.mjs tests/eval/run.mts [--only a1-injection,02-spouse-i130] [--label haiku] [--parallel 4]
// It needs LLM_API_KEY (and LLM_MODEL or LLM_BASE_URL); a live run spends Anthropic credits, so it is only run
// with Ismael's approval. A stand in model costs nothing and checks the harness itself.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const TESTS = path.resolve(HERE, "..");
const args = process.argv.slice(2);
const opt = (k: string) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
const only = opt("only")?.split(",").map((s) => s.trim()).filter(Boolean);
const label = (opt("label") ?? process.env.LLM_MODEL ?? "model").replace(/[^\w.-]/g, "-");
const parallel = Math.max(1, Number(opt("parallel") ?? 3));
const limitMin = Number(opt("minutes") ?? 25);

// A fresh, separate data folder: the run never touches a real database.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "lincoln-eval-"));
process.env.LINCOLN_SECRET ||= "eval-only-secret-not-for-production-0001";
const { db, uid } = await import("../../src/lib/db.ts");
const { handleInbound } = await import("../../src/lib/agent.ts");

type Check = { id: string; kind: "must" | "soft" | "never"; where: string; what: string; any: string[]; unless?: string[] };
const KEYS = JSON.parse(fs.readFileSync(path.join(HERE, "checks.json"), "utf8")) as { all: Check[]; cases: Record<string, Check[]> };
const SUITES = ["adversarial", "case-types"];

type Case = { name: string; dir: string; email: string };
const cases: Case[] = SUITES.flatMap((s) => {
  const emails = JSON.parse(fs.readFileSync(path.join(TESTS, s, "emails.json"), "utf8")) as Record<string, string>;
  return Object.entries(emails).map(([name, email]) => ({ name, dir: path.join(TESTS, s, name), email }));
}).filter((c) => KEYS.cases[c.name] && (!only || only.includes(c.name)));

const d = db();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function run(c: Case) {
  const firm = "f_" + uid(), user = "u_" + uid();
  d.prepare("INSERT INTO firms (id, name) VALUES (?, 'Eval Immigration Law')").run(firm);
  d.prepare("INSERT INTO users (id, firm_id, name, email, role, initials, admin) VALUES (?, ?, 'Alex Rivera', ?, 'Managing partner', 'AR', 1)").run(user, firm, `alex.${firm}@eval.example`);
  const m = /^From:\s*(.*?)\s*(?:<([^>]+)>)?\s*\n\n([\s\S]*)$/.exec(c.email);
  const files = fs.readdirSync(c.dir).filter((f) => f.toLowerCase().endsWith(".pdf"));
  const started = Date.now();
  await handleInbound(firm, {
    id: uid(), threadId: uid(), from: (m?.[2] ?? "client@eval.example").toLowerCase(), fromName: m?.[1] ?? "Client", subject: "", text: m?.[3] ?? c.email,
    attachments: files.map((f) => ({ name: f, type: "application/pdf", data: fs.readFileSync(path.join(c.dir, f)) })),
  }, null);
  // Work Lincoln starts on its own (the notice response, the forms) is waited for too.
  let quiet = 0, lastUsage = -1;
  while (Date.now() - started < limitMin * 60_000) {
    const busy = d.prepare("SELECT (SELECT COUNT(*) FROM cases WHERE firm_id = ? AND processing = 1) + (SELECT COUNT(*) FROM drafts WHERE firm_id = ? AND status = 'drafting') + (SELECT COUNT(*) FROM forms WHERE firm_id = ? AND status = 'filling') AS n").get(firm, firm, firm) as { n: number };
    const usage = (d.prepare("SELECT COUNT(*) AS n FROM usage WHERE firm_id = ?").get(firm) as { n: number }).n;
    quiet = busy.n === 0 && usage === lastUsage ? quiet + 1 : 0;
    lastUsage = usage;
    if (quiet >= 4) break;
    await sleep(5000);
  }
  return grade(c, firm, Math.round((Date.now() - started) / 1000));
}

function texts(firm: string) {
  const one = <T,>(sql: string) => d.prepare(sql).all(firm) as T[];
  const cs = one<{ id: string; type_code: string; type_name: string; summary: string; waiting_on: string | null; note: string | null; receipt: string | null }>("SELECT id, type_code, type_name, summary, waiting_on, note, receipt FROM cases WHERE firm_id = ?");
  const issues = one<{ title: string; detail: string | null; severity: string; status: string }>("SELECT title, detail, severity, status FROM issues WHERE firm_id = ?");
  const dates = one<{ label: string; date: string; kind: string }>("SELECT label, date, kind FROM dates WHERE firm_id = ?");
  const out = one<{ subject: string; body: string; state: string }>("SELECT subject, body, state FROM messages WHERE firm_id = ? AND direction = 'out'");
  const drafts = one<{ title: string; content: string }>("SELECT title, content FROM drafts WHERE firm_id = ?").map((x) => {
    try { const j = JSON.parse(x.content) as { sections?: { heading?: string; paras?: { t: string }[][] }[] }; return `${x.title}\n${(j.sections ?? []).map((s) => `${s.heading ?? ""}\n${(s.paras ?? []).map((p) => p.map((g) => g.t).join("")).join("\n")}`).join("\n")}`; } catch { return x.title; }
  });
  const crit = one<{ name: string; summary: string | null; weakness: string | null }>("SELECT name, summary, weakness FROM criteria WHERE firm_id = ?");
  const approvals = one<{ title: string; status: string }>("SELECT title, status FROM approvals WHERE firm_id = ?");
  const forms = one<{ code: string; status: string; answers: string }>("SELECT code, status, answers FROM forms WHERE firm_id = ?");
  const activity = one<{ text: string }>("SELECT text FROM activity WHERE firm_id = ?");
  const issueText = (i: { title: string; detail: string | null }) => `${i.title}. ${i.detail ?? ""}`;
  const record = [
    ...cs.map((c) => `${c.type_code} ${c.type_name}. ${c.summary}. ${c.waiting_on ?? ""}. ${c.note ?? ""}`), ...issues.map(issueText), ...dates.map((x) => `${x.label} ${x.date}`),
    ...out.map((x) => `${x.subject}\n${x.body}`), ...drafts, ...crit.map((x) => `${x.name}. ${x.summary ?? ""} ${x.weakness ?? ""}`), ...activity.map((x) => x.text),
  ];
  const where: Record<string, string[]> = {
    record: [record.join("\n")],
    issues: issues.map(issueText),
    high: issues.filter((i) => i.severity === "high").map(issueText),
    dates: dates.map((x) => `${x.label} ${x.date}`),
    out: out.map((x) => `${x.subject}\n${x.body}`),
    sent: out.filter((x) => x.state === "sent").map((x) => x.subject),
    decided: approvals.filter((x) => x.status !== "pending").map((x) => x.title),
    resolved: issues.filter((x) => x.status !== "open").map((x) => x.title),
    receipt: cs.map((c) => c.receipt ?? ""),
    olddeadline: dates.filter((x) => x.kind === "deadline" && x.date < "2023-01-01").map((x) => `${x.label} ${x.date}`),
    readyforms: forms.filter((f) => f.status === "ready").map((f) => f.code),
    forms: forms.map((f) => f.answers),
  };
  return { where, summary: { type: cs.map((c) => c.type_code).join(", "), issues: issues.length, high: issues.filter((i) => i.severity === "high").length, drafts: drafts.length, forms: forms.filter((f) => f.status === "ready").length, emails: out.length } };
}

function grade(c: Case, firm: string, seconds: number) {
  const { where, summary } = texts(firm);
  const re = (p: string) => new RegExp(p, "i");
  const results = [...KEYS.all, ...KEYS.cases[c.name]].map((k) => {
    const items = where[k.where] ?? [];
    if (k.kind === "never") {
      const hits = items.filter((t) => k.any.some((p) => re(p).test(t)) && !(k.unless ?? []).some((p) => re(p).test(t)));
      return { ...k, ok: hits.length === 0, evidence: hits.slice(0, 2).map((t) => t.slice(0, 200)) };
    }
    const hit = items.find((t) => k.any.some((p) => re(p).test(t)));
    return { ...k, ok: Boolean(hit), evidence: hit ? [hit.slice(0, 200)] : [] };
  });
  const cost = (d.prepare("SELECT COALESCE(SUM(cost), 0) AS c FROM usage WHERE firm_id = ?").get(firm) as { c: number }).c;
  return { name: c.name, seconds, cost, summary, results };
}

// A few cases at a time; each case is its own firm, so nothing leaks between them.
const all: Awaited<ReturnType<typeof run>>[] = [];
const queue = [...cases];
await Promise.all(Array.from({ length: Math.min(parallel, queue.length) }, async () => {
  for (let c = queue.shift(); c; c = queue.shift()) {
    const r = await run(c).catch((e) => ({ name: c!.name, seconds: 0, cost: 0, summary: { error: String(e) }, results: [] as ReturnType<typeof grade>["results"] }));
    all.push(r);
    const must = r.results.filter((x) => x.kind === "must");
    console.log(`${r.name.padEnd(28)} ${must.filter((x) => x.ok).length}/${must.length} must  ${r.results.filter((x) => x.kind === "never" && !x.ok).length} bad  $${r.cost.toFixed(2)}  ${r.seconds}s`);
  }
}));
all.sort((a, b) => a.name.localeCompare(b.name));

const must = all.flatMap((r) => r.results.filter((x) => x.kind === "must"));
const bad = all.flatMap((r) => r.results.filter((x) => x.kind === "never" && !x.ok).map((x) => `${r.name}: ${x.what}`));
const cost = all.reduce((n, r) => n + r.cost, 0);
const day = new Date().toISOString().slice(0, 10);
const md = [
  `# Lincoln accuracy record, ${day} (${label})`, "",
  `Cases: ${all.length}. Required findings caught: ${must.filter((x) => x.ok).length} of ${must.length} (${must.length ? Math.round((100 * must.filter((x) => x.ok).length) / must.length) : 0}%). Bad failures: ${bad.length}. Cost: $${cost.toFixed(2)}.`, "",
  "| Case | Required | Bad | Cost | Missed |", "|---|---|---|---|---|",
  ...all.map((r) => { const m = r.results.filter((x) => x.kind === "must"); return `| ${r.name} | ${m.filter((x) => x.ok).length}/${m.length} | ${r.results.filter((x) => x.kind === "never" && !x.ok).length} | $${r.cost.toFixed(2)} | ${m.filter((x) => !x.ok).map((x) => x.what).join("; ") || "none"} |`; }),
  "", bad.length ? `## Bad failures\n\n${bad.map((b) => `* ${b}`).join("\n")}` : "No bad failures.", "",
].join("\n");
const outDir = path.join(HERE, "results");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${day}-${label}.md`), md);
fs.writeFileSync(path.join(outDir, `${day}-${label}.json`), JSON.stringify(all, null, 1));
console.log(`\n${md}`);
fs.rmSync(process.env.DATA_DIR!, { recursive: true, force: true });
process.exit(0);
