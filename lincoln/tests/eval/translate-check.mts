// Free check of translations on the stand-in model: a case with a Spanish document gets a translation for review,
// and the filing packet carries it behind the original.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "lincoln-tr-"));
process.env.LINCOLN_SECRET ||= "eval-only-secret-not-for-production-0001";
const { db, uid } = await import("../../src/lib/db.ts");
const { handleInbound } = await import("../../src/lib/agent.ts");
const { buildPacket } = await import("../../src/lib/packet.ts");
const d = db();
const firm = "f_" + uid();
d.prepare("INSERT INTO firms (id, name) VALUES (?, 'Eval Law')").run(firm);
d.prepare("INSERT INTO users (id, firm_id, name, email, role, initials, admin) VALUES (?, ?, 'Alex Rivera', ?, 'Managing partner', 'AR', 1)").run("u_" + uid(), firm, `a.${firm}@eval.example`);
const dir = new URL("../adversarial/a2-same-name-spanish-scan/", import.meta.url).pathname;
await handleInbound(firm, { id: uid(), threadId: uid(), from: "c@eval.example", fromName: "Carlos Mendez", subject: "", text: "Please help my son.", attachments: [{ name: "file.pdf", type: "application/pdf", data: fs.readFileSync(dir + "file.pdf") }] }, null);
for (let i = 0; i < 30 && !d.prepare("SELECT 1 FROM drafts WHERE firm_id = ? AND kind = 'translation'").get(firm); i++) await new Promise((r) => setTimeout(r, 1000));
const tr = d.prepare("SELECT id, case_id, title, status, content FROM drafts WHERE firm_id = ? AND kind = 'translation'").all(firm) as { id: string; case_id: string; title: string; status: string; content: string }[];
console.log("translations:", tr.map((t) => `${t.title} (${t.status})`));
console.log("approval:", d.prepare("SELECT kind, title, brief FROM approvals WHERE firm_id = ? AND kind = 'translation'").all(firm));
if (tr[0]) {
  const c = JSON.parse(tr[0].content); console.log("certificate:", c.sections[1].paras[0][0].t);
  const pdf = await buildPacket(firm, tr[0].case_id);
  fs.writeFileSync(path.join(os.tmpdir(), "tr-packet.pdf"), pdf);
  console.log("packet bytes:", pdf.length);
}
process.exit(0);
