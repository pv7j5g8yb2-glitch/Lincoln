const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const R = JSON.parse(fs.readFileSync("rects.json", "utf8"));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: "light" });
  await ctx.addCookies([{ name: "__Host-lincoln_session", value: "filmtoken0123456789abcdefghijklmnopqrstuv", domain: "localhost", path: "/", secure: true, httpOnly: true }]);
  const p = await ctx.newPage();
  await p.goto("http://localhost:3105/cases/c_halasz?tab=drafts", { waitUntil: "networkidle" });
  await p.evaluate(() => window.scrollTo(0, 560)); await p.waitForTimeout(800);
  await p.mouse.move(-5, -5); await p.screenshot({ path: "s-letter.png" });
  const pick = await p.evaluate(() => { const els = [...document.querySelectorAll("span.cursor-help")]; for (const e of els) { const r = e.getBoundingClientRect(); if (r.top > 380 && r.top < 620 && r.width > 160 && r.height < 40) return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; } return null; });
  R.fact = pick; console.log("fact", pick);
  await p.mouse.move(pick[0] + pick[2] * 0.4, pick[1] + pick[3] / 2, { steps: 5 }); await p.waitForTimeout(1600);
  await p.screenshot({ path: "s-letter-hover.png" });
  fs.writeFileSync("rects.json", JSON.stringify(R, null, 1));
  await b.close();
})();
