# Where things stand (read this at the start of every session)

**Lincoln is being built again (2026-11-13).** The prompt only version stopped on 2026-11-11 after its
blind test. Ismael restarted it on 2026-11-12 as a case platform (`docs/LINCOLN-V1.md`). The first
draft of the app is in `lincoln/` (Next.js, SQLite): Harvey style interface, a demo firm of 12 made up
cases, the full Halász O-1A case, approvals by decision, the support letter with facts linked to their
pages, Word export, a scripted "demo world". See `lincoln/README.md` for what works and what is scripted.

Second pass (2026-11-13, after Ismael's feedback): interface stripped back and rewritten with no
second person; real sign up, sign in, sign out and password reset (scrypt hashes, hashed session and
reset tokens, attempt limits); Privacy Policy and Terms of Service pages; upgraded to Next.js 16 (npm
audit clean). A new firm gets its own empty workspace and cannot reach another firm's cases or pages
(tested).

Third pass (2026-11-13, after "too overloaded, too many colours, too talkative"): whole interface
redone in one ink on white, no coloured chips, terse labels. Sidebar like Claude and ChatGPT (New case,
Home, Cases, Review, Inbox, Library, recent cases, account menu with Settings, Help, Sign out and, in
the sample firm only, Run next event and Reset). Home is the wordmark, one prompt box and the review
list. Settings has Profile (photo, name, role), Security (change password, data protection status),
Firm, Automation, Integrations and Usage (time saved). The Assistant can be scoped to one case and
cites document numbers and pages. Live intake works (tested on a 16 page file): upload a PDF, Lincoln
reads every page and writes documents, issues, dates, requirements and a client email for approval.
Long files are read 12 pages at a time and merged; requests are queued one at a time. New drafts of
any kind can be requested on a case. A personal login is created from the Render variables
SEED_USER_EMAIL, SEED_USER_PASSWORD and SEED_USER_NAME (never in git). The relay account had about
160 credits left on 2026-11-13; a full 52 page read needs more than that, so it needs a top up.

Fourth pass (2026-11-13, "it is just a copy of Harvey"): the autonomous core is built. Gmail connects
through Google's own sign in (tokens encrypted at rest); every two minutes new mail is read, matched to a
case or opened as a new one, PDF attachments are read into the record, and a reply is drafted for approval.
Approved mail is sent from the attorney's own mailbox; without a mailbox it says "Approved, not sent". Clients
who do not reply in 3 days get a reminder; dates within 14 days become issues. Firms on other mail systems can
use a secret forwarding address (Postmark inbound format). The Assistant is now an agent with tools (find and
read cases, open cases, draft documents, prepare emails for approval, add dates, resolve issues) and describes
Lincoln truthfully. The personal account from SEED_USER_* is now its own blank firm. Tested locally: an email
with a PDF opened the right O-1A case and drafted a reply with no one touching the app; the PDF read itself
was refused because the relay account is out of credit. Gmail needs a Google Cloud OAuth client
(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL); untested against Google until that exists. On Render's free
plan the server sleeps after 15 minutes, which stops the mailbox checks.

Fifth pass (2026-11-13): one sign in per company. Google connects Gmail, Drive, Docs, Sheets, Slides and
Calendar; Microsoft connects Outlook, Word, Excel, PowerPoint, OneDrive, SharePoint and Teams. Lincoln reads
mail from either, adds case dates to the attorney's calendar on its own, imports client PDFs from Drive,
OneDrive or SharePoint, opens drafts in Word or Google Docs, exports the case list and exhibit index to Excel
or Sheets and a case summary deck to PowerPoint or Slides, and posts new review items to a chosen Teams
channel. Tested end to end against a local stand-in for both companies' APIs (sign in, mail in and out,
calendar, file import, every export, Teams); not yet against the real services, which need a Google Cloud
OAuth client and a Microsoft Entra app registration on the parent's account. Not built: a Word add-in that
runs inside Word. Known: npm audit flags image-size (inside pptxgenjs, only used for images, which Lincoln
never passes) and uuid (inside exceljs, the affected functions are not called).

Sixth pass (2026-11-13): photos and scans. Lincoln now takes JPEG, PNG, WebP and iPhone HEIC as well as
PDF, several at once, from upload, email attachments (small inline images such as signature logos are
skipped), Drive, OneDrive and SharePoint; the camera's rotation is applied. The reading rule: anything that
cannot be read with certainty is not guessed and not used; it becomes a high issue ("Page 3 could not be
read reliably"), and if the client sent it the client email asks for a clearer photo with how to take one.
Verified colleagues can forward an email with an instruction ("draft the support letter by 4 December"):
Lincoln matches the case, records the deadline, reads attachments and drafts into Review; senders are
verified by DMARC, or by being inside the same Microsoft organisation; unverified mail from a member's
address is not acted on. Tested: the page pipeline (a sideways phone photo came out upright), the verified
and the spoofed instruction against the stand-in. Not tested: the model's reading of real photos (relay out
of credit, 10 credits left) and a real iPhone HEIC file.

Seventh pass (2026-11-13): mail arrives instantly. Gmail notifies through Google Pub/Sub
(GOOGLE_PUBSUB_TOPIC, GOOGLE_PUSH_TOKEN) and Outlook through a Microsoft Graph subscription, both renewed
automatically; a sweep every five minutes catches anything missed. Each email is claimed before it is read,
so it is never worked twice, and a failed one is retried up to three times. Newsletters and other bulk mail
(List-Unsubscribe or Precedence headers, Gmail promotions, social and forums) never reach the model and are
never stored, except mail from .gov addresses; mail the model judges not to be case work is deleted at once.
GET /api/health is for an uptime ping (cron-job.org) so the free Render server does not sleep. Tested
against the stand-in: Gmail work began 3.5 seconds after the notification and Outlook 0.5 seconds; forged
notifications were refused.

Security pass (2026-11-13): see docs/SECURITY.md. Fixed a real hole (the reset link was shown to anyone
who typed an email). Added per firm file encryption, restricted case enforcement everywhere, two step sign
in with recovery codes, device list and sign out, a security record, strict headers, upload and header
injection limits, sample workspace lock down and firm deletion. A scripted attack test (33 checks) and 7
unit checks all pass. Password reset email needs RESEND_API_KEY and MAIL_FROM.

Front door pass (2026-11-13): sign in and sign up redesigned (two tone card, building photo on the right).
"Continue with Microsoft" and "Continue with Google" sign in, or create the account and its firm and connect
every service in the same consent; returning users are found by the provider's account id, never by email,
and an email that already has a password account is never taken over (it connects from Settings first).
Microsoft accounts are identified by tenant and object id and the verified user principal name, not the
mail attribute (the "nOAuth" problem). L squircle icon for browsers, iPhone home screen and Android.
Integrations has its own page in the sidebar with real logos. Sidebar slides closed and open (remembered),
phone drawer slides in, chat messages slide up, the send button animates.

Still open: (1) company details in `lincoln/src/lib/company.ts` are placeholders in [brackets] (legal
name, address, contact email, governing law) and the two legal pages need a lawyer's check; (2) no mail
provider, so reset links are shown on screen for now; (3) the model: the key starts "sk-cs4-" and is in
`lincoln/.env.local` (not in git), but the provider's address and model name are unknown, and its terms
must forbid training on customer content, as the Privacy Policy now promises; (4) library entries per case type; (5) the free Render plan wipes data on restart.

Last updated 2026-11-13. `CLAUDE.md` holds the rules, this file holds the state. Update it when
anything here changes. The repo is public: never put passwords, keys or personal details in it.

## Being explored: Lincoln autopilot (2026-11-12, not decided, nothing built)

Full draft definition: `docs/LINCOLN.md`. The version to build now (demo, free pilot, first raise):
`docs/LINCOLN-V1.md`.

Idea: Lincoln runs each immigration case for the firm from signed engagement to decision (intake,
chasing client documents, referee letters and translations, forms, petition, USCIS status, RFE
responses, dates), sold to firms, everything sent in the firm's name, a lawyer reviews and signs.
Ismael's requirements so far:
* Sold to firms and lawyers, never finding clients ourselves (an AI law firm was rejected: trust).
* Positioned as part of the firm, so it must work on every immigration case type the firm takes,
  not a short list of visas (a narrow list reads as "not for us").
* Extremely secure and private to each firm.
Unsolved: how firms find it without cold outreach, calls or personal content. Proposed first step,
waiting for his yes: a demo on the made up Halasz case with fake email and a fake USCIS feed.

Honest assessment (2026-11-12, Claude): as things stand, Lincoln autopilot is unlikely to reach
$100k a month profit by about November 2031; about 5 percent, a guess. The deciding factor is reaching
firms, not the product. Main reasons against: no way to reach small firms under the current rules,
funded incumbents moving the same way (Clio Work agents, Harvey and Legora, Parley, Visalaw, AI native
immigration firms such as Manifest and LegalOS), better general AI with connectors eating the gap, and
trust in a hidden teenage founder with no lawyer behind it. For it: a real market of small firms that
Harvey and Legora price out, the per case AI model already proven in personal injury (EvenUp, Eve),
low AI cost per case, and little cost of failing at 15. What would change the odds most: an adult
immigration lawyer as co-founder or partner, and a demo that clearly beats plain Claude plus Clio.
If funded now (about $1.5M, sales team and ads): about 15 to 20 percent, a guess; reaching firms
becomes solvable, while competition, small contracts, switching cost and AI labs remain. Peak funded
version and timeline in `docs/LINCOLN.md`.

Outside review (2026-11-12, pasted from another AI, checked): rated the autopilot 3/10 for a VC and
6/10 for a firm; Claude agrees. ICM Desk is confirmed to sell per visa playbooks, autonomy levels,
cited claims and attorney approval at $6 to $16 a seat plus $80 a case, so "AI that runs the
immigration case" is not new. What is left as a possible edge: measured, published reliability (blind
tests with answer keys) and execution quality. Details in `docs/RESEARCH.md`.

Ismael's plan (2026-11-12): build the MVP with Claude Code; give it free to lawyers and paralegals;
after 2 to 4 weeks ask how they would feel if it stopped; then apply to legal tech VCs and
accelerators; grants if lucky. Claude's notes: never switch users off mid case (run the Sean Ellis
question while it keeps running); finding the free users is the unsolved step; free use is not the
revenue his own VC rule requires; YC typically will not take under 18s who cannot contract.

## Ruled out (2026-11-11)

Audience first (posting the story of building and testing ideas): rejected by Ismael. Do not suggest again.

## Closed (2026-11-11)

Lincoln, legal AI for law firms and immigration firms, is closed. The reason (Ismael's
correction): not the funded incumbents, which he already knew about, but that even narrowed to
immigration, getting small and mid sized firms to sign up to a self serve legal AI platform would
be very hard, close to impossible. Based on a review of 21 competitor homepages (Harvey, Legora,
CaseBlink, Parley, Visalaw, LegistAI, Docketwise, eImmigration, LEAP, Smokeball, Filevine LOIS,
CoCounsel and others) plus two r/legaltech threads. Findings are in `docs/RESEARCH.md`.
The name, logo and brand files stay in `brand/` in case they are useful for something else.
Next: pick one new direction and commit to it for 90 days without restarting.

## Reopened for a test (2026-11-10)

Ismael said go on the three week Lincoln test. Week 1 started: a made up O-1A case is in
`demo/o1-varga/` (all invented, with deliberate traps listed in `answer-key.md`). Three runs: plain
Claude and plain ChatGPT with `plain-run-paste.txt`, and Lincoln's four step method in a fresh
Claude chat (`lincoln/message-1..4-paste.txt`). Then blind scoring against `rubric.md`. If Lincoln
is not clearly best, stop. Known weakness: the same author wrote the traps and the method; a second
case written separately should confirm any win. No Anthropic API key yet (an API account needs an
adult, so a parent must open it).

Week 1 result (2026-11-10): Lincoln v0.1 and plain Claude tied (averages 96.25 and 96.5 of 100
across a Claude judge and a ChatGPT judge); plain ChatGPT 93.25. Lincoln did not clearly win.
Details in `demo/o1-varga/results.md`.

Final round started (2026-11-10): case 2 in `demo/o1-halasz/` (52 page messy bundle plus salary
spreadsheet, answer key committed before Lincoln v0.2). Pass bar: Lincoln beats plain Claude by at
least 5 points with BOTH judges, otherwise Lincoln stops.

Final round result (2026-11-11): Lincoln v0.2 averaged 96.55, plain Claude 91.2, plain ChatGPT 94.75,
but the Claude judge gave Lincoln only +1.7 over plain Claude, so the pass bar (+5 with both judges)
was not met. By the rule agreed before the test, Lincoln stops. Details: `demo/o1-halasz/results.md`.

## Ruled out (2026-11-10)

Shopify App Store product: rejected by Ismael. Do not suggest again.

## What Ismael has said he likes (2026-11-10)

* Building something like Claude trained for one specific group (he knows the wrapper and
  crowding problems).
* Browsing property and car listings. As a child he sketched new car designs for BMW and Audi.
* Football, the gym, YouTube. Nothing on the YC batch list stood out to him.

## What Lincoln was

An AI workspace for immigration lawyers in the US. Self serve, per seat, working price about $300
a month (untested). Like Claude or ChatGPT set up for immigration practice: any time consuming
task in, a finished file out (Word, PDF, Excel), connected to Word, Google Docs, Outlook, Drive
and case software. A licensed attorney reviews everything. Nothing is built yet.

How we got here (short): the realtor content product was dropped on 2026-11-05 because AI made
designs were not good enough and it was one funded competitor away from irrelevant. Covered (a
subcontractor insurance certificate tracker) was built on 2026-11-08 and dropped the same day
because the category already has cheap and free tools. After a long review of legal AI
(`docs/RESEARCH.md`), Ismael chose immigration law on 2026-11-09. Everything older was removed
from the repo the same day. History is in git up to commit `341cf65`.

## Decided

* Target buyer: immigration lawyers and small firms in the US, across all states.
* Shape: a general immigration assistant on top of ready made workflows, with file output and tool
  connections. Employment based cases first (O-1, EB-1, H-1B, L-1, green cards), end to end from
  intake to packet.
* Goal: $100k a month profit by age 20 (about November 2031). Profit, not revenue.
* If funded (Ismael, 2026-11-14): aim for at least a $100M valuation. Rough maths: at 20 to 40 times
  revenue (Harvey is about 39x) that needs about $2.5M to $5M a year, about 700 to 1,400 seats at $300.
  Plan: win immigration first (every case type), then the same engine in other rule bound, flat fee,
  form heavy practices. Not multi practice from day one.
* Name: Lincoln (decided 2026-11-09). Domain uselincoln.com, to be bought by a parent or guardian. lincoln.ai is for sale, left for later. Trademark search for LINCOLN still to do. The old Hopkins logo files are in `archive/hopkins-logo/`.
* Look (2026-11-09): wordmark in Literata SemiBold (600), black ink `#161614` on warm paper `#F2F0ED` or white on black, no accent colour. Files and notes in `brand/`.
* Hard limits and writing rules are in `CLAUDE.md`.

* Product requirement (2026-11-11): the four passes run automatically and the lawyer always gets every
  deliverable back as separate Word files in one go (support letter, criteria map, exhibit index,
  gaps and risks). No manual exporting, no tabs to hunt for. Lawyers can ask in the chat for any other
  format: one combined file, a zip, PDF, Word, one at a time. Default to editable Word (lawyers on
  Reddit say they finish everything in Word), with a download all button; check the default with the
  first real lawyers rather than guessing.
* Quality bar (Ismael, 2026-11-10): the work Lincoln does should match a top immigration lawyer's
  work product. It never presents itself as a lawyer; a licensed lawyer reviews and signs.

## Not decided

* Whether the L monogram becomes the icon, or the wordmark stands alone, and the trademark result.
* The exact first workflow, and whether the first release is one case type end to end or wider.
* Price figure. Structure decided 2026-11-12: one fixed monthly fee per firm, unlimited use, no per case fee (per user, see `docs/LINCOLN.md`). $199 to $300 a seat mentioned earlier.
* Who the parent or guardian owner is, and how payments and contracts are held.
* Which immigration lawyer will advise (nobody yet).
* Which model providers and what data agreements.
* Security (2026-11-14): every free item of the security minimum is built and tested (17 of 17): whole database encryption, firm wide two step, 2 hour idle sign out, new device emails, breached password check, access record, daily model budget ($5 default, LLM_DAILY_BUDGET_USD), full firm export, breach plan (`docs/BREACH-PLAN.md`). Still open and paid or outside the code: off server backups, zero retention agreement with Anthropic, an independent security review, Google's CASA assessment, a lawyer reviewed data agreement. See `docs/SECURITY.md`.
* Domain (Ismael, 2026-11-14): uselincoln.com for the landing page, app.uselincoln.com for the app, as Harvey and Legora split it. lincoln.ai only later, once revenue can comfortably pay for it. Not bought yet (a parent buys it).
* Pre-seed size (Claude's advice, 2026-11-14, not decided): about $1M (range $750k to $1.5M) for 18 months: two engineers, a part time immigration attorney reviewer, SOC 2 Type I and a penetration test, model and hosting costs, growth, legal and insurance, and a buffer. Ismael's model budget for testing now is $5 to $20, so tests are run small.
* Pitch material (2026-11-14): `docs/pitch/Lincoln-seed-deck.pdf` (16 slides, minimal, sourced, no invented proof) and `docs/pitch/Lincoln-product-description.docx`. The $1.5M raise, use of funds split and 18 month targets are Claude's proposal, not decided by Ismael. The team slide gives only his first name, not his age.
* Where firm work arrives (2026-11-14, from what is known, not measured): email is the main channel (client and employer mail, documents, USCIS email notices) but not the only one. Calls and consultations, web intake forms, client portals in case software and paper USCIS notices also bring work. Lincoln needs its own intake (a client upload link and questionnaire) and a way to take scanned notices, besides mail. Not built yet.

## Facts that matter (all from `docs/RESEARCH.md`, many unverified)

* Funded competitors already sell to immigration lawyers: Parley (O-1A writer in Word),
  CaseBlink (reported $2M pre-seed), Visalaw AI (reported $220 to $480 a month), LegistAI,
  Docketwise (with Docketwise IQ). Harvey, Legora, Clio, Spellbook and CoCounsel serve law
  broadly. Claude and ChatGPT are what lawyers already use.
* Lawyers on Reddit say the value is packaging, Word integration, ready made workflows and the
  firm's own templates, and that people who can build their own do. The people who buy are the
  ones who will not build it.
* Seat maths: $100k a month revenue at $300 a seat is about 333 seats, about 110 firms at 3
  seats. For $100k profit at 75 percent margin, about 445 seats. Assumptions, not data.
* Honest odds of the goal: low single digits to about ten percent. A guess.

## Next

1. Read and agree `docs/TEST-PLAN.md` (three weeks, no building before the stop rule).
2. Parent or guardian conversation about ownership.
3. Find one immigration lawyer willing to review outputs.
4. Decide the name after lawyers have reacted to something real.

## Built 2026-11-14: checks from the Reddit threads (kept light, Donna principle)
* Date rules in code (`lincoln/src/lib/rules.ts`, tests in `lincoln/tests`, `npm test`): passport expired or
  expiring before the requested period, authorised stay ended (days counted, 3 and 10 year bar warning) or
  ending within 90 days, H-1B six year limit. The reading only tags each date's kind; nothing is counted by
  the model. Rules rerun daily, and a rule the attorney resolved is not raised again.
* Second reading after every file read: one text only call that looks only for bars, missing items and
  conflicts the first read missed, at most 6, "Bar" issues shown first when high.
* Every cited sentence in a draft is checked against the page it cites; a sentence the page does not support
  gets "[Attorney: not shown on p. N]" or "[Attorney: p. N says otherwise: ...]". Pages not in the file are
  caught without the model.
* Every model call is recorded in a `usage` table: firm, case, purpose, the model that actually answered
  (fallbacks included), tokens, cost. Gives the cost per case for the pricing decision. Drafts show the model.
* Case page folds low severity issues into "N minor". Privacy page names Anthropic, Render and Resend and says
  plainly that no zero retention agreement is signed yet.
* Tested with a stand in model only, not live Opus yet. The real cost per case is unknown until a live run;
  the `usage` table will show it.

## Full review pass (2026-11-14, after "do not stop polishing")
* Sample workspace made honest: removed everything Lincoln does not do yet (USCIS status checks, Visa Bulletin
  reading, N-400 form filling and "filing checks", secure upload links, referee chasing, country conditions
  research, weekly status checks, response plans). Haddad is now a document read with a flagged absence and a
  client email; the RFE and I-751 events end in emails for approval.
* Removed: Settings "Usage" tab (its "estimated time saved" came from minutes typed into the code, a made up
  figure), the static Library page, "Filings and signatures" from Automation, helper legend on Help, empty
  sections (Security activity, Access record, Home "For review", case overview and drafts placeholders), notes
  under each row in the Inbox.
* Added (small, essential): edit an email before approving it ("Discard" instead of "Return" for emails, and a
  discarded email is marked so); resolve an issue from the case (a resolved date rule stays closed); file mail
  Lincoln could not match to a case, from the Inbox; the case ask box is the same box as Home (attach files to
  the case, dictation); page references in a case's chat open the page.
* One message list for the Inbox and each case: a row opens to the full email; Lincoln's note shows only there.
* Fixed: two files arriving for one case could write over each other's pages; reads of a case now queue and a
  new file always goes after existing pages.
* Lincoln writes American English (UI, prompts, demo), since users are US lawyers; messages to Ismael stay Irish.
* The assistant's description of Lincoln now matches what it does (one reminder without approval, the checks).
* Tested: every screen on desktop, phone, light and dark; mail in (unsorted and new case with a PDF), filing,
  resolving, editing and approving, case chat, demo events and the strategy to letter flow; 17 of 17 security
  tests; date rule tests. All with a stand in model, not live Opus.
* Still needs Ismael: the company's legal name, address and contact email for the Privacy and Terms pages
  (`lincoln/src/lib/company.ts` still has placeholders); the Anthropic key in Render for a live test.
* 2026-11-14: notices after actions (Toaster, `lincoln/src/lib/toast.ts`), and drafted emails now read as text with
  Approve and send plus Edit (Edit or a tap opens the text, Save keeps it). There is no button to drop a drafted email.
* 2026-11-14: case types rebuilt from the official USCIS forms list (uscis.gov/forms/all-forms, fetched that day) plus
  State Department, Labor, EOIR, ICE, CBP, federal court, compliance and advice work: 156 types in 14 families
  (`lincoln/src/lib/library.ts`). Any matter outside the list is still opened under the name the model gives it.
* 2026-11-14: `docs/HOW-FIRMS-WORK.md` maps how immigration firms work step by step, where Lincoln stands at each
  step, and what start to finish needs (forms, filing packet, final review page, e-signature, status tracking, RFE
  builder, a live accuracy test graded by an immigration lawyer). A short version is in Lincoln's prompts
  (`lincoln/src/lib/process.ts`).
* 2026-11-14 (later): built forms (`lincoln/src/lib/forms.ts`, `fill.ts`), the filing packet and final review (`packet.ts`,
  Review item "Filing packet"), and RFE/NOID/NOIR handling (deadline as printed, receipt number, full draft response).
  Firm address/phone/email and attorney bar number in Settings feed the forms. Tested on a USCIS shaped test form
  with the stand in model. Blank official forms must be downloaded by a person into `lincoln/forms` (USCIS blocks
  automated downloads; we do not get round it).

