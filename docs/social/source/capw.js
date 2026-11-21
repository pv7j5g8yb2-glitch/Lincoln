const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const b = await chromium.launch();
  const o = await b.newContext({ viewport: { width: 380, height: 760 }, deviceScaleFactor: 2 });
  await o.route("https://appsforoffice.microsoft.com/**", (r) => r.fulfill({ contentType: "application/javascript", body: `window.Office={HostType:{Word:"Word"},onReady:(cb)=>setTimeout(()=>cb({host:"Word"}),50)};window.Word={run:async(f)=>f({document:{getSelection:()=>({insertHtml:()=>{}}),body:{paragraphs:{load:()=>{},items:[]}}},sync:async()=>{}})};` }));
  const q = await o.newPage(); await q.goto("http://localhost:3105/word"); await q.waitForTimeout(1200);
  await q.fill("#code", process.argv[2]); await q.getByRole("button", { name: "Connect" }).click(); await q.waitForTimeout(2500);
  const sel = q.locator("select"); const opts = await sel.locator("option").allTextContents(); const pick = opts.findIndex((x) => x.includes("Halász"));
  if (pick >= 0) { await sel.selectOption({ index: pick }); await q.waitForTimeout(1500); }
  const cdp = await o.newCDPSession(q); await cdp.send("Animation.enable"); await cdp.send("Animation.setPlaybackRate", { playbackRate: 0.1 });
  fs.rmSync("wframes", { recursive: true, force: true }); fs.mkdirSync("wframes");
  let i = 0, last = null, m = [300, 650]; const seq = [];
  const snap = async () => { const f = `${String(i++).padStart(5, "0")}.jpg`; await q.screenshot({ path: `wframes/${f}`, type: "jpeg", quality: 96 }); last = f; seq.push([f, m[0], m[1]]); };
  const ease = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
  await q.mouse.move(m[0], m[1]); await snap(); for (let k = 0; k < 60; k++) seq.push([last, m[0], m[1]]);
  const btn = q.getByRole("button", { name: /Insert/ }).first(); const bb = await btn.boundingBox();
  const to = [bb.x + bb.width * 0.5, bb.y + bb.height / 2], from = [...m];
  for (let k = 1; k <= 60; k++) { const e = ease(k / 60); m = [from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e - Math.sin(e * Math.PI) * 12]; await q.mouse.move(m[0], m[1]); await snap(); }
  for (let k = 0; k < 20; k++) await snap(); for (let k = 0; k < 120; k++) seq.push([last, m[0], m[1]]);
  fs.writeFileSync("wseq.json", JSON.stringify(seq)); console.log("word frames", seq.length, i, JSON.stringify(to));
  await b.close();
})();
