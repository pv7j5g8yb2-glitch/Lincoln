const { chromium } = require("playwright");
const fs = require("fs");
const B = "http://localhost:3105";
const R = {}; // every click target and focus area, in page pixels (1440 x 900)
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: "light" });
  await ctx.addCookies([{ name: "__Host-lincoln_session", value: "filmtoken0123456789abcdefghijklmnopqrstuv", domain: "localhost", path: "/", secure: true, httpOnly: true }]);
  const p = await ctx.newPage();
  await p.clock.install({ time: new Date("2026-11-18T09:41:00") });
  const rect = async (loc) => { const r = await loc.boundingBox(); return r && [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  const shot = async (name) => { await p.waitForTimeout(900); await p.mouse.move(-10, -10); await p.screenshot({ path: `s-${name}.png` }); console.log("shot", name, p.url()); };

  await p.goto(B + "/", { waitUntil: "networkidle" }); await p.waitForTimeout(800);
  await shot("home");
  const row = p.locator("main a", { hasText: "Dr. Réka Halász" }).first();
  R.home_row = await rect(row);
  R.home_list = await rect(p.locator("main section").first());
  await row.click(); await p.waitForLoadState("networkidle");
  await shot("review");
  const approve = p.getByRole("button", { name: /Approve and send/ });
  R.review_btn = await rect(approve);
  R.review_mail = await rect(p.locator("text=Dear Réka").locator("xpath=ancestor::div[2]"));
  await approve.click(); await p.waitForTimeout(500); await p.screenshot({ path: "s-review-sent.png" }); console.log("shot review-sent");
  await p.waitForTimeout(5500);

  const side = p.locator("aside a, nav a", { hasText: "Dr. Réka Halász" }).first();
  R.side_case = await rect(side);
  await shot("review-after");
  await side.click(); await p.waitForLoadState("networkidle");
  await shot("overview");
  R.ov_issue = await rect(p.locator("text=The advisory opinion is not from a peer group").locator("xpath=ancestor::li[1] | ancestor::div[1]").first());
  R.ov_issues = await rect(p.locator("text=Open issues").locator("xpath=.."));
  R.tab_docs = await rect(p.getByRole("link", { name: /^Documents/ }));
  await p.getByRole("link", { name: /^Documents/ }).click(); await p.waitForLoadState("networkidle");
  await shot("documents");
  R.tab_ev = await rect(p.getByRole("link", { name: /^Evidence/ }));
  await p.getByRole("link", { name: /^Evidence/ }).click(); await p.waitForLoadState("networkidle");
  await shot("evidence");
  R.tab_drafts = await rect(p.getByRole("link", { name: /^Drafts/ }));
  await p.getByRole("link", { name: /^Drafts/ }).click(); await p.waitForLoadState("networkidle");
  await shot("drafts");
  const letterLink = p.locator("text=Petition support letter").first();
  if (await letterLink.count()) { R.letter_open = await rect(letterLink); await letterLink.click(); await p.waitForLoadState("networkidle"); }
  await shot("letter");
  // A sourced fact in view: hover it, and its page appears.
  const facts = p.locator("span.cursor-help");
  let k = 0; for (; k < Math.min(await facts.count(), 40); k++) { const r = await facts.nth(k).boundingBox(); if (r && r.y > 260 && r.y < 640 && r.width > 120) break; }
  R.fact = await rect(facts.nth(k));
  await facts.nth(k).hover(); await p.waitForTimeout(1500); await p.screenshot({ path: "s-letter-hover.png" }); console.log("shot letter-hover");
  fs.writeFileSync("rects.json", JSON.stringify(R, null, 1));
  await b.close();
})();
