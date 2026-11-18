const { chromium } = require("playwright");
(async () => {
  const [file, W, H, ...ts] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +W, height: +H } });
  const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto("file://" + __dirname + "/" + file); await p.waitForTimeout(800); await p.evaluate(() => document.fonts.ready);
  console.log("END", await p.evaluate(() => window.END));
  for (const t of ts) { await p.evaluate((t) => render(t), +t); await p.screenshot({ path: `st-${file.replace(".html","")}-${t}.png` }); }
  console.log(errs.join("\n") || "no errors"); await b.close();
})();
