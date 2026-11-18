const { chromium } = require("playwright");
(async () => {
  const [file, W, H, out, from, to] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +W, height: +H } });
  await p.goto("file://" + __dirname + "/" + file); await p.waitForTimeout(1000); await p.evaluate(() => document.fonts.ready);
  for (let i = +from; i <= +to; i++) { await p.evaluate((t) => render(t), i / 30); await p.screenshot({ path: `${out}/${String(i).padStart(5, "0")}.jpg`, type: "jpeg", quality: 92 }); }
  await b.close(); console.log("done", file);
})();
