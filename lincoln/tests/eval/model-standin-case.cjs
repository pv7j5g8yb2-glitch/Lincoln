// Stand-in model for tests/eval/case-flow-check.mts: answers each request the way a real model would, logs every request.
const http = require("http"); const fs = require("fs");
const log = process.argv[2];
const reply = (all) => {
  if (all.includes('\\"fit\\"')) return JSON.stringify({ summary: "Award evidence added.", waiting_on: null, documents: [{ title: "HealthBridge award certificate", kind: "Award", page_from: 5, page_to: 5, date: "2024-06-01", source: "HealthBridge", language: "English", is_scan: false, status: "ok", note: null }], issues: [], dates: [], requirements: [{ name: "Awards", citation: "8 CFR 204.5(h)(3)(i)", status: "met", summary: "Award certificate", gap: "", evidence: [{ page: 5, grade: 4 }] }], client_email: null, fit: [{ title: "HealthBridge award certificate", effect: "strengthens", requirement: "Awards (8 CFR 204.5(h)(3)(i))", note: "proves the 2024 award the client mentioned." }, { title: "Holiday photo", effect: "not relevant", requirement: null, note: "a personal photo" }] });
  if (all.includes("seven things")) return JSON.stringify({ issues: [{ kind: "missing", severity: "medium", title: "No proof in the file: 2024 HealthBridge Innovation Challenge award", detail: "The client says in her email of 20 November that she won it; no certificate or announcement is in the file.", pages: [] }] });
  if (/json/i.test(all)) return JSON.stringify({ summary: "EB-1A consultation notes read.", waiting_on: "Client", documents: [{ title: "Consultation notes", kind: "Notes", page_from: 1, page_to: 4, date: "2026-11-12", source: "Firm", language: "English", is_scan: false, status: "ok", note: null }], issues: [], dates: [], requirements: [{ name: "Awards", citation: "8 CFR 204.5(h)(3)(i)", status: "missing", summary: "", gap: "No award evidence", evidence: [] }], client_email: null });
  return "Stand-in text.";
};
http.createServer((req, res) => { const ch = []; req.on("data", (c) => ch.push(c)); req.on("end", () => {
  const body = Buffer.concat(ch).toString("utf8"); fs.appendFileSync(log, body + "\n=====\n");
  let b = {}; try { b = JSON.parse(body); } catch {}
  const all = JSON.stringify(b.messages ?? "") + JSON.stringify(b.system ?? "");
  const text = reply(all), usage = { input_tokens: 10, output_tokens: 10 };
  if (!b.stream) { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ id: "m", type: "message", role: "assistant", model: "x", content: [{ type: "text", text }], stop_reason: "end_turn", usage })); }
  res.writeHead(200, { "Content-Type": "text/event-stream" });
  const ev = (type, data) => res.write(`event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`);
  ev("message_start", { message: { id: "m", type: "message", role: "assistant", model: "x", content: [], stop_reason: null, usage } });
  ev("content_block_start", { index: 0, content_block: { type: "text", text: "" } });
  ev("content_block_delta", { index: 0, delta: { type: "text_delta", text } });
  ev("content_block_stop", { index: 0 });
  ev("message_delta", { delta: { stop_reason: "end_turn" }, usage: { output_tokens: 10 } });
  ev("message_stop", {});
  res.end();
}); }).listen(4549);
