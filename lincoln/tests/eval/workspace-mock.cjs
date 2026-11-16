// Stateful stand-in for Outlook drafts, Sent Items, OneDrive and a Teams channel, plus a stand-in model.
const http = require("http");
const st = { drafts: {}, sent: [], files: [], teamsMsgs: [], replies: [], sendMail: 0, posts: 0, deleted: [], n: 0 };
const jwt = (c) => ["e30", Buffer.from(JSON.stringify(c)).toString("base64url"), "sig"].join(".");
http.createServer((req, res) => {
  const ch = []; req.on("data", (c) => ch.push(c)); req.on("end", () => {
    const body = Buffer.concat(ch).toString("utf8"); const u = new URL(req.url, "http://x"); const p = u.pathname;
    const send = (code, o) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(o ?? {})); };
    const j = () => { try { return JSON.parse(body); } catch { return {}; } };
    const G = "/graph.microsoft.com/v1.0";
    if (p === "/__state") return send(200, st);
    if (p === "/__edit") { const d = st.drafts[u.searchParams.get("id")]; d.body.content = d.body.content.replace("Kind regards", "Warm regards") + "\n\nPlease bring your passport."; return send(200, {}); }
    if (p === "/__sendmailbox") { const id = u.searchParams.get("id"); const d = st.drafts[id]; delete st.drafts[id]; st.sent.push({ subject: d.subject, toRecipients: d.toRecipients }); return send(200, {}); }
    if (p === "/__teams") { st.teamsMsgs.push({ id: `tm${++st.n}`, createdDateTime: new Date().toISOString(), messageType: "message", from: { user: { id: "oid-maya", displayName: "Maya Okafor" } }, body: { content: `<p>${u.searchParams.get("text")}</p>` }, attachments: [] }); return send(200, {}); }
    if (p === "/login.microsoftonline.com/common/oauth2/v2.0/token") return send(200, { access_token: jwt({ scp: "x" }), expires_in: 3600 });
    if (p === `${G}/me/messages/orig1/createReply`) { const id = `d${++st.n}`; st.drafts[id] = { isDraft: true, subject: "RE: x", body: { content: "" }, replyTo: "orig1" }; return send(201, { id }); }
    if (p === `${G}/me/messages` && req.method === "POST") { const id = `d${++st.n}`; st.drafts[id] = { isDraft: true, ...j() }; return send(201, { id }); }
    let m = p.match(/^\/graph\.microsoft\.com\/v1\.0\/me\/messages\/([^/]+)(\/send)?$/);
    if (m) {
      const d = st.drafts[m[1]];
      if (m[2]) { if (!d) return send(404, { error: { message: "gone" } }); st.sent.push({ subject: d.subject, toRecipients: d.toRecipients, viaDraft: true }); delete st.drafts[m[1]]; return send(202, {}); }
      if (req.method === "PATCH") { if (!d) return send(404, {}); Object.assign(d, j()); return send(200, {}); }
      if (req.method === "DELETE") { st.deleted.push(m[1]); delete st.drafts[m[1]]; return send(204, {}); }
      if (req.method === "GET") return d ? send(200, d) : send(404, { error: { message: "not found" } });
    }
    if (p === `${G}/me/mailFolders/sentitems/messages`) return send(200, { value: st.sent });
    if (p === `${G}/me/sendMail`) { st.sendMail++; return send(202, {}); }
    if (p.startsWith(`${G}/me/drive/root:/Lincoln/`)) { st.files.push(decodeURIComponent(p.split("/Lincoln/")[1].split(":")[0])); return send(201, { webUrl: "https://firm-my.sharepoint.com/Lincoln/file", parentReference: { id: "fold1" } }); }
    if (p === `${G}/me/drive/items/fold1`) return send(200, { webUrl: "https://firm-my.sharepoint.com/Lincoln/Clients/folder" });
    if (p === `${G}/teams/team1/channels/chan1/messages` && req.method === "GET") return send(200, { value: st.teamsMsgs });
    if (p === `${G}/teams/team1/channels/chan1/messages` && req.method === "POST") { st.posts++; return send(201, { id: `post${st.posts}` }); }
    m = p.match(/channels\/chan1\/messages\/([^/]+)\/replies$/);
    if (m) { st.replies.push({ to: m[1], html: j().body?.content }); return send(201, { id: `r${st.replies.length}` }); }
    if (p === `${G}/me/mailFolders/inbox/messages`) return send(200, { value: [] });
    if (p === `${G}/subscriptions`) return send(201, { id: "sub1", expirationDateTime: new Date(Date.now() + 2 * 86400000).toISOString() });
    if (p === `${G}/me/events`) return send(201, { id: "ev" });
    // Stand-in model (Anthropic messages shape)
    if (p.endsWith("/v1/messages")) {
      let text = JSON.stringify({ summary: "Read.", rules: [] });
      if (body.includes("You take instructions from the firm")) text = JSON.stringify({ case_id: CASE, new_case: null, summary: "Check the Okafor-Reyes passport dates before Friday.", draft: null, due: null, dates: [] });
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ model: "stand-in", usage: { input_tokens: 10, output_tokens: 10 }, content: [{ type: "text", text }], stop_reason: "end_turn" }));
    }
    send(404, { error: { message: `no route ${req.method} ${p}` } });
  });
}).listen(4546, () => console.log("mock2 on 4546"));
let CASE = "c_case1";
