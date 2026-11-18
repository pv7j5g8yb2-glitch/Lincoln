const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const o = await b.newContext({ viewport: { width: 380, height: 760 }, deviceScaleFactor: 2 });
  await o.route("https://appsforoffice.microsoft.com/**", (r) => r.fulfill({ contentType: "application/javascript", body: `window.Office={HostType:{Outlook:"Outlook"},CoercionType:{Text:"text"},EventType:{ItemChanged:"ic"},onReady:(cb)=>setTimeout(()=>cb({host:"Outlook"}),50),context:{mailbox:{addHandlerAsync:()=>{},item:{from:{emailAddress:"mariam.haddad@example.com",displayName:"Mariam Haddad"},subject:"Re: Two tax transcripts",conversationId:"c",body:{getAsync:(t,cb)=>cb({value:""})}}}}};` }));
  const q = await o.newPage(); await q.goto("http://localhost:3105/outlook"); await q.waitForTimeout(1200);
  await q.fill("#code", process.argv[2]); await q.getByRole("button", { name: "Connect" }).click(); await q.waitForTimeout(2200);
  await q.screenshot({ path: "s-outlook.png" });
  await b.close();
})();
