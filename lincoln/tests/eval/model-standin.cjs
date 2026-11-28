// Free stand-in for the Messages API (port 4547), for walking the app without spending credits.
// Chat turns (requests with tools) get a short Markdown answer, streamed; anything asking for JSON gets "{}".
const http = require("http");
const REPLY = "**Stand-in reply.** This answer comes from the free test model, not a real one.\n\n1. First step\n2. Second step\n\n| Item | Status |\n|---|---|\n| Passport | Received |\n| I-94 | Missing |";
http.createServer((req, res) => {
  const ch = []; req.on("data", (c) => ch.push(c)); req.on("end", () => {
    let b = {}; try { b = JSON.parse(Buffer.concat(ch).toString("utf8") || "{}"); } catch {}
    const all = JSON.stringify(b.messages ?? "") + JSON.stringify(b.system ?? "");
    const text = b.tools ? REPLY : /json/i.test(all) ? "{}" : "Stand-in text.";
    const usage = { input_tokens: 10, output_tokens: 10 };
    if (!b.stream) { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ id: "msg_s", type: "message", role: "assistant", model: b.model, content: [{ type: "text", text }], stop_reason: "end_turn", usage })); }
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    const ev = (type, data) => res.write(`event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`);
    ev("message_start", { message: { id: "msg_s", type: "message", role: "assistant", model: b.model, content: [], stop_reason: null, usage } });
    ev("content_block_start", { index: 0, content_block: { type: "text", text: "" } });
    const parts = text.match(/[\s\S]{1,24}/g) ?? [];
    let i = 0;
    const tick = () => {
      if (i < parts.length) { ev("content_block_delta", { index: 0, delta: { type: "text_delta", text: parts[i++] } }); return setTimeout(tick, 15); }
      ev("content_block_stop", { index: 0 });
      ev("message_delta", { delta: { stop_reason: "end_turn" }, usage: { output_tokens: 10 } });
      ev("message_stop", {});
      res.end();
    };
    tick();
  });
}).listen(4547, () => console.log("model stand-in on 4547"));
