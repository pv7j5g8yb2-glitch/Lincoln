// Free check of USCIS case status against a stand in server shaped like the USCIS sandbox (developer.uscis.gov).
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "lincoln-uscis-"));
process.env.LINCOLN_SECRET ||= "eval-only-secret-not-for-production-0001";
process.env.USCIS_CLIENT_ID = "sandbox-id"; process.env.USCIS_CLIENT_SECRET = "sandbox-secret"; process.env.USCIS_API_BASE = "http://127.0.0.1:4661";
let status = "Case Was Received", tokens = 0, calls = 0;
const server = http.createServer((req, res) => {
  let body = ""; req.on("data", (c) => (body += c)); req.on("end", () => {
    res.setHeader("content-type", "application/json");
    if (req.url === "/oauth/accesstoken") {
      const p = new URLSearchParams(body);
      if (p.get("grant_type") !== "client_credentials" || p.get("client_secret") !== "sandbox-secret") { res.statusCode = 401; return res.end("{}"); }
      tokens++; return res.end(JSON.stringify({ token_type: "BearerToken", access_token: "tok123", expires_in: "1799", status: "approved" }));
    }
    const m = /^\/case-status\/([A-Z]{3}\d{10})$/.exec(req.url ?? "");
    if (!m || req.headers.authorization !== "Bearer tok123") { res.statusCode = 401; return res.end(JSON.stringify({ errors: [{ code: "401", message: "Unauthorized" }] })); }
    calls++;
    res.end(JSON.stringify({ case_status: { receiptNumber: m[1], formType: "I-130", submittedDate: "09-05-2026 14:28:46", modifiedDate: "11-16-2026 09:00:00", current_case_status_text_en: status, current_case_status_desc_en: `On November 16, 2026, we ${status.toLowerCase()} for your Form I-130. <a href="https://egov.uscis.gov/">Visit</a>`, current_case_status_text_es: "", current_case_status_desc_es: "", hist_case_status: null }, message: "Query was successful" }));
  });
}).listen(4661);
const { db, uid } = await import("../../src/lib/db.ts");
const u = await import("../../src/lib/uscis.ts");
const d = db();
const firm = "f_" + uid(), user = "u_" + uid(), id = "c_" + uid();
d.prepare("INSERT INTO firms (id, name) VALUES (?, 'Eval Law')").run(firm);
d.prepare("INSERT INTO users (id, firm_id, name, email, role, initials, admin) VALUES (?, ?, 'Alex Rivera', ?, 'Managing partner', 'AR', 1)").run(user, firm, `a.${firm}@eval.example`);
d.prepare("INSERT INTO cases (id, firm_id, ref, client, type_code, type_name, family, stage, state, summary, attorney_id, paralegal_id, opened_at, sensitive, pages, processing, receipt) VALUES (?, ?, 'R', 'Sofia Reyes', 'I-130', 'Relative petition', 'Family based', 'Filed', 'moving', '', ?, ?, ?, 0, 0, 0, 'IOE0912345678')").run(id, firm, user, user, new Date().toISOString());
console.log("first check, changed:", await u.watchStatuses(), "| status:", u.statusOf(firm, id)?.text);
console.log("same day again, calls made:", (await u.watchStatuses(), calls));
d.prepare("UPDATE case_status SET checked_at = '2026-01-01T00:00:00Z'").run();
status = "Request for Additional Evidence Was Sent";
console.log("RFE, changed:", await u.watchStatuses());
const c = d.prepare("SELECT stage, state FROM cases WHERE id = ?").get(id) as { stage: string; state: string };
console.log("stage:", c.stage, c.state, "| issue:", (d.prepare("SELECT title FROM issues WHERE case_id = ?").get(id) as { title: string } | undefined)?.title);
d.prepare("UPDATE case_status SET checked_at = '2026-01-01T00:00:00Z'").run();
status = "Case Was Approved";
await u.watchStatuses();
console.log("approved stage:", (d.prepare("SELECT stage FROM cases WHERE id = ?").get(id) as { stage: string }).stage, "| tokens fetched:", tokens, "| activity:", (d.prepare("SELECT text FROM activity WHERE case_id = ? ORDER BY at").all(id) as { text: string }[]).map((x) => x.text));
console.log("detail without html:", !/<a /.test(u.statusOf(firm, id)?.detail ?? "<a "));
server.close(); process.exit(0);
