const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const [file, W, H, out] = process.argv.slice(2);
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +W, height: +H } });
  await p.goto("file://" + __dirname + "/" + file); await p.waitForTimeout(1000); await p.evaluate(() => document.fonts.ready);
  const END = await p.evaluate(() => window.END), N = Math.ceil(END * 60);
  for (let i = 0; i < N; i++) { await p.evaluate((t) => render(t), i / 60); await p.screenshot({ path: `${out}/${String(i).padStart(5, "0")}.jpg`, type: "jpeg", quality: 92 }); }
  await b.close(); console.log("done", file, N);
})();
