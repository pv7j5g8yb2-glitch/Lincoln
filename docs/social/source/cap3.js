// Drives the real Lincoln app frame by frame: the mouse really moves, hovers, presses and navigates, and every frame
// is a screenshot of what the app itself shows. Animations run at a tenth of their speed so each step is one frame
// of a 60 fps film. Writes frames/ and seq.json (per frame: file, mouse x and y, and named moments).
const { chromium } = require("playwright");
const fs = require("fs");
const B = "http://localhost:3105";
(async () => {
  fs.rmSync("frames", { recursive: true, force: true }); fs.mkdirSync("frames");
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: "light" });
  await ctx.addCookies([{ name: "__Host-lincoln_session", value: "filmtoken0123456789abcdefghijklmnopqrstuv", domain: "localhost", path: "/", secure: true, httpOnly: true }]);
  const p = await ctx.newPage();
  await p.clock.install({ time: new Date("2026-11-18T09:41:00") });
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Animation.enable");
  let idx = 0, last = null, mouse = [1150, 720];
  const seq = [], marks = {};
  const snap = async () => { const f = `${String(idx++).padStart(5, "0")}.jpg`; await p.screenshot({ path: `frames/${f}`, type: "jpeg", quality: 88 }); last = f; seq.push([f, Math.round(mouse[0] * 10) / 10, Math.round(mouse[1] * 10) / 10]); };
  const hold = (n) => { for (let i = 0; i < n; i++) seq.push([last, mouse[0], mouse[1]]); };
  const ease = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
  const move = async (to, n) => {
    const from = [...mouse], dist = Math.hypot(to[0] - from[0], to[1] - from[1]);
    for (let i = 1; i <= n; i++) { const k = ease(i / n), arc = Math.sin(k * Math.PI) * Math.min(18, dist * 0.04); mouse = [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k - arc]; await p.mouse.move(mouse[0], mouse[1]); await snap(); }
  };
  const click = async (after) => { await p.mouse.down(); for (let i = 0; i < 6; i++) await snap(); await p.mouse.up(); for (let i = 0; i < after; i++) await snap(); };
  const mark = (k) => { marks[k] = seq.length; };
  const slow = () => cdp.send("Animation.setPlaybackRate", { playbackRate: 0.1 });

  await p.goto(B + "/", { waitUntil: "networkidle" }); await p.waitForTimeout(1500);
  await p.mouse.move(mouse[0], mouse[1]); await slow();
  mark("home"); await snap(); hold(96);
  mark("home_move"); await move([622, 342], 62); await snap(); hold(16);
  mark("home_click"); await click(44);
  mark("review"); hold(190);
  mark("review_move"); await move([712, 832], 64); hold(14);
  mark("review_click"); await click(56);
  mark("sent"); hold(64);
  mark("side_move"); await move([92, 351], 70); hold(12);
  mark("side_click"); await click(44);
  mark("overview"); hold(170);
  mark("docs_move"); await move([487, 331], 56); hold(10);
  mark("docs_click"); await click(34);
  mark("docs"); hold(130);
  mark("ev_move"); await move([577, 331], 46); hold(10);
  mark("ev_click"); await click(34);
  mark("ev"); hold(130);
  mark("drafts_move"); await move([646, 331], 46); hold(10);
  mark("drafts_click"); await click(34);
  mark("drafts"); hold(48);
  mark("scroll");
  for (let i = 1; i <= 72; i++) { await p.evaluate((y) => window.scrollTo(0, y), Math.round(560 * ease(i / 72))); await snap(); }
  mark("letter"); hold(18);
  mark("fact_move"); await move([676, 401], 56);
  for (let i = 0; i < 64; i++) await snap();
  mark("hover"); hold(110);
  mark("end");
  fs.writeFileSync("seq.json", JSON.stringify({ seq, marks }));
  console.log("frames", seq.length, "files", idx, JSON.stringify(marks));

  // The Outlook pane, beside an open email, with the mouse coming to rest on Approve.
  const o = await b.newContext({ viewport: { width: 380, height: 760 }, deviceScaleFactor: 2 });
  await o.route("https://appsforoffice.microsoft.com/**", (r) => r.fulfill({ contentType: "application/javascript", body: `window.Office={HostType:{Outlook:"Outlook"},CoercionType:{Text:"text"},EventType:{ItemChanged:"ic"},onReady:(cb)=>setTimeout(()=>cb({host:"Outlook"}),50),context:{mailbox:{addHandlerAsync:()=>{},item:{from:{emailAddress:"mariam.haddad@example.com",displayName:"Mariam Haddad"},subject:"Documents for my N-400",conversationId:"c",body:{getAsync:(t,cb)=>cb({value:""})}}}}};` }));
  const q = await o.newPage(); await q.goto(B + "/outlook"); await q.waitForTimeout(1200);
  await q.fill("#code", process.argv[2]); await q.getByRole("button", { name: "Connect" }).click(); await q.waitForTimeout(2500);
  const ocdp = await o.newCDPSession(q); await ocdp.send("Animation.enable"); await ocdp.send("Animation.setPlaybackRate", { playbackRate: 0.1 });
  fs.rmSync("oframes", { recursive: true, force: true }); fs.mkdirSync("oframes");
  let oi = 0, ol = null, om = [330, 700]; const oseq = [];
  const osnap = async () => { const f = `${String(oi++).padStart(5, "0")}.jpg`; await q.screenshot({ path: `oframes/${f}`, type: "jpeg", quality: 90 }); ol = f; oseq.push([f, om[0], om[1]]); };
  await q.mouse.move(om[0], om[1]); await osnap(); for (let i = 0; i < 70; i++) oseq.push([ol, om[0], om[1]]);
  const ob = await q.getByRole("button", { name: "Approve" }).boundingBox();
  const to = [ob.x + ob.width * 0.45, ob.y + ob.height / 2], from = [...om];
  for (let i = 1; i <= 60; i++) { const k = ease(i / 60); om = [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k - Math.sin(k * Math.PI) * 12]; await q.mouse.move(om[0], om[1]); await osnap(); }
  for (let i = 0; i < 24; i++) await osnap(); for (let i = 0; i < 120; i++) oseq.push([ol, om[0], om[1]]);
  fs.writeFileSync("oseq.json", JSON.stringify(oseq));
  console.log("outlook frames", oseq.length, oi);
  await b.close();
})();
