// Stateful stand-in for Outlook drafts, Sent Items, OneDrive and a Teams channel, plus a stand-in model.
const http = require("http");
const st = { events: 0, drafts: {}, sent: [], files: [], teamsMsgs: [], replies: [], sendMail: 0, posts: 0, deleted: [], n: 0, gdrafts: {}, gsent: [], gdeleted: [], gfiles: [], gchat: [], gposts: [], mfolders: [], made: [] };
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
    if (p === "/__failsend") { st.failSend = u.searchParams.get("on") === "1"; return send(200, {}); }
    if (p === `${G}/me/sendMail`) { if (st.failSend) return send(503, { error: { code: "ServiceUnavailable", message: "busy" } }); st.sendMail++; st.mails = (st.mails || []).concat([j()]); return send(202, {}); }
    if (p.startsWith(`${G}/me/drive/root:/Lincoln/`)) { st.files.push(decodeURIComponent(p.split("/Lincoln/")[1].split(":")[0])); return send(201, { webUrl: "https://firm-my.sharepoint.com/Lincoln/file", parentReference: { id: "fold1" } }); }
    if (p === `${G}/me/drive/items/fold1`) return send(200, { webUrl: "https://firm-my.sharepoint.com/Lincoln/Clients/folder" });
    if (p === "/__folders") { st.mfolders = JSON.parse(u.searchParams.get("set") || "[]"); return send(200, {}); }
    if (p.startsWith(`${G}/me/drive/root/search(`)) { const w = decodeURIComponent(p).match(/q='([^']*)'/)[1].toLowerCase(); return send(200, { value: st.mfolders.filter((f) => f.name.toLowerCase().includes(w)) }); }
    m = p.match(/^\/graph\.microsoft\.com\/v1\.0\/me\/drive\/items\/([^/:]+):\/(.+):\/content$/);
    if (m && req.method === "PUT") { st.files.push(`items/${m[1]}/${decodeURIComponent(m[2])}`); return send(201, { webUrl: `https://firm-my.sharepoint.com/folder/${m[1]}/file` }); }
    m = p.match(/^\/graph\.microsoft\.com\/v1\.0\/me\/drive\/items\/([^/:]+)\/children$/);
    if (m && req.method === "POST") { const id = `new${++st.n}`; const name = j().name; st.made.push({ id, name, parent: m[1] }); st.mfolders.push({ id, name, folder: {}, webUrl: `https://firm-my.sharepoint.com/folder/${id}`, parentReference: { id: m[1], path: "/drive/root:/Clients" } }); return send(201, { id, webUrl: `https://firm-my.sharepoint.com/folder/${id}` }); }
    m = p.match(/^\/graph\.microsoft\.com\/v1\.0\/me\/drive\/items\/([^/:]+)$/);
    if (m && m[1] !== "fold1") return send(200, { id: m[1], webUrl: `https://firm-my.sharepoint.com/folder/${m[1]}` });
    if (p === `${G}/teams/team1/channels/chan1/messages` && req.method === "GET") return send(200, { value: st.teamsMsgs });
    if (p === `${G}/teams/team1/channels/chan1/messages` && req.method === "POST") { st.posts++; return send(201, { id: `post${st.posts}` }); }
    m = p.match(/channels\/chan1\/messages\/([^/]+)\/replies$/);
    if (m) { st.replies.push({ to: m[1], html: j().body?.content }); return send(201, { id: `r${st.replies.length}` }); }
    if (p === `${G}/me/mailFolders/inbox/messages`) return send(200, { value: [] });
    if (p === `${G}/subscriptions`) return send(201, { id: "sub1", expirationDateTime: new Date(Date.now() + 2 * 86400000).toISOString() });
    if (p === `${G}/me/events`) { st.events++; return send(201, { id: "ev" }); }
    // Google: Gmail drafts, Drive, Google Chat
    const GM = "/gmail.googleapis.com/gmail/v1/users/me";
    const b64 = (t) => Buffer.from(t).toString("base64url");
    const parseRaw = (raw) => { const t = Buffer.from(raw, "base64url").toString("utf8"); const [h, ...rest] = t.split("\r\n\r\n"); const hs = h.split("\r\n").map((l) => { const i = l.indexOf(":"); return { name: l.slice(0, i), value: l.slice(i + 2) }; }); return { headers: hs, text: Buffer.from(rest.join("\r\n\r\n"), "base64").toString("utf8") }; };
    if (p === "/__gedit") { const g = st.gdrafts[u.searchParams.get("id")]; g.text = g.text.replace("Kind regards", "Warm regards") + "\n\nPlease bring your passport."; return send(200, {}); }
    if (p === "/__gsend") { const id = u.searchParams.get("id"); st.gsent.push({ id: `s${id}`, threadId: st.gdrafts[id].threadId }); delete st.gdrafts[id]; return send(200, {}); }
    if (p === `${GM}/drafts` && req.method === "POST") { const id = `g${++st.n}`; const x = j().message; st.gdrafts[id] = { ...parseRaw(x.raw), threadId: x.threadId }; return send(200, { id }); }
    if (p === `${GM}/drafts/send`) { const id = j().id; const g = st.gdrafts[id]; if (!g) return send(404, {}); st.gsent.push({ id: `s${id}`, threadId: g.threadId, viaDraft: true }); delete st.gdrafts[id]; return send(200, { id: `s${id}` }); }
    m = p.match(/^\/gmail\.googleapis\.com\/gmail\/v1\/users\/me\/drafts\/([^/]+)$/);
    if (m) {
      const g = st.gdrafts[m[1]];
      if (req.method === "DELETE") { st.gdeleted.push(m[1]); delete st.gdrafts[m[1]]; return send(204, {}); }
      if (!g) return send(404, { error: { message: "not found" } });
      if (req.method === "PUT") { const x = j().message; st.gdrafts[m[1]] = { ...parseRaw(x.raw), threadId: x.threadId }; return send(200, { id: m[1] }); }
      return send(200, { id: m[1], message: { threadId: g.threadId, payload: { mimeType: "text/plain", headers: g.headers.map((h) => h.name === "Subject" ? h : h), body: { data: b64(g.text) } } } });
    }
    if (p === `${GM}/messages` && req.method === "GET") return send(200, { messages: (u.searchParams.get("q") || "").includes("in:sent") ? st.gsent : [] });
    if (p === "/www.googleapis.com/drive/v3/files/gdoc1") return u.searchParams.get("alt") ? send(404, {}) : send(200, { name: "Declaration draft", mimeType: "application/vnd.google-apps.document" });
    if (p === "/www.googleapis.com/drive/v3/files/gdoc1/export") { res.writeHead(200, { "Content-Type": "application/octet-stream" }); return res.end(require("fs").readFileSync(__dirname + "/fixtures-declaration.docx")); }
    if (p === "/__gfolders") { st.gfolders = JSON.parse(u.searchParams.get("set") || "[]"); return send(200, {}); }
    if (p === "/www.googleapis.com/drive/v3/files" && req.method === "GET") { const q = u.searchParams.get("q") || ""; const w = q.match(/folder' and name contains '([^']*)'/); return send(200, { files: w ? (st.gfolders || []).filter((f) => f.name.toLowerCase().includes(w[1].toLowerCase())) : [] }); }
    if (p === "/www.googleapis.com/drive/v3/files" && req.method === "POST") return send(200, { id: `folder${++st.n}` });
    if (p === "/www.googleapis.com/upload/drive/v3/files" && req.method === "POST") { const meta = JSON.parse(body.split("\r\n\r\n")[1].split("\r\n")[0]); st.gfiles.push(meta); return send(200, { id: `f${st.n}`, webViewLink: meta.mimeType === "application/vnd.google-apps.document" ? `https://docs.google.com/document/d/f${st.n}/edit` : `https://drive.google.com/file/d/f${st.n}/view` }); }
    if (p === "/__gchat") { st.gchat.push({ name: `spaces/S1/messages/gm${++st.n}`, createTime: new Date().toISOString(), text: u.searchParams.get("text"), sender: { name: "users/sub-ana", type: "HUMAN" }, thread: { name: `spaces/S1/threads/t${st.n}` }, attachment: u.searchParams.get("doc") ? [{ contentName: "Declaration draft", driveDataRef: { driveFileId: "gdoc1" } }] : [] }); return send(200, {}); }
    if (p === "/chat.googleapis.com/v1/spaces/S1/messages" && req.method === "GET") return send(200, { messages: st.gchat });
    if (p === "/chat.googleapis.com/v1/spaces/S1/messages" && req.method === "POST") { const x = j(); const name = `spaces/S1/messages/bot${++st.n}`; st.gposts.push({ name, text: x.text, thread: x.thread?.name, reply: u.searchParams.get("messageReplyOption") }); return send(200, { name }); }
    // Stand-in model (Anthropic messages shape)
    if (p.endsWith("/v1/messages")) {
      let text = JSON.stringify({ summary: "Read.", rules: [] });
      if (body.includes("Mark up this document")) text = JSON.stringify({ summary: "One date corrected.", edits: [{ p: 1, find: "4 March 1990", replace: "14 March 1990", why: "The birth certificate gives 14 March 1990 (p. 2)." }] });
      else if (body.includes("You take instructions from the firm")) text = JSON.stringify({ case_id: CASE, new_case: null, summary: "Check the Okafor-Reyes passport dates before Friday.", draft: null, due: null, dates: [] });
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ model: "stand-in", usage: { input_tokens: 10, output_tokens: 10 }, content: [{ type: "text", text }], stop_reason: "end_turn" }));
    }
    send(404, { error: { message: `no route ${req.method} ${p}` } });
  });
}).listen(4546, () => console.log("mock2 on 4546"));
let CASE = "c_case1";

