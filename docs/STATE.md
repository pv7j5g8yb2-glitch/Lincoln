# Where things stand (read this at the start of every session)

**Lincoln is being built again (2026-11-13).** The prompt only version stopped on 2026-11-11 after its
blind test. Ismael restarted it on 2026-11-12 as a case platform (`docs/LINCOLN-V1.md`). The first
draft of the app is in `lincoln/` (Next.js, SQLite): Harvey style interface, a demo firm of 12 made up
cases, the full Halász O-1A case, approvals by decision, the support letter with facts linked to their
pages, Word export, a scripted "demo world". See `lincoln/README.md` for what works and what is scripted.

**App changes (Ismael, 2026-11-16, evening):**
* First run setup (`/setup`), required and not skippable: name, role and photo, then Microsoft 365 or Google Workspace.
  The app redirects there until the account is connected (users.setup_at). Accounts already connected count as set up.
* Home is "Good morning/afternoon/evening, <first name>" by the device's own clock (morning 5:00 to 11:59, afternoon
  12:00 to 19:59, evening 20:00 to 4:59; checked every minute) and the five cases Lincoln worked on most recently, each
  with its last action and "For review" where something waits. The chat box left Home (New case and + remain).
* Chat boxes are soft cornered rectangles with the controls below the text on larger screens; phones keep the pill.
* Integrations: Google services in two rows of three; Word add-in is Download first, then Code and a short guide;
  "Planned" is now "Others", each with Request (renamed from Connect 2026-11-21), which records the firm's request ("Requested") for the Lincoln team.
* Library search says "Search"; New case sits in the middle of the screen.
* Outlook add-in (`/outlook`, manifest at `/outlook/manifest.xml`): beside the open email, the case it belongs to
  (by conversation, else the sender's address), the reply waiting for approval with Approve and Edit then Save, and
  what Lincoln last did; an email with no case can be opened as one. Same code as the Word add-in, one connection
  each. Tested with a stand-in Outlook in the browser; not yet in real Outlook.
* The Microsoft and Google cards always look the same: no warnings for services a personal account lacks; the Teams
  channel box shows only when the account has Teams.

**Landing film (made 2026-11-18, Ismael asked for it now).** About 72 seconds (opens on "Introducing", then "Lincoln", as two beats), no sound on the site, on the landing page right after the
hero (WebM with an MP4 fallback for Safari), plus a 16:9 and a 4:5 copy with post captions in `docs/social/`.
Real Lincoln screens from the sample firm, captured by clicking the real buttons in a browser, so every click in the
film lands on the button it presses. The app scenes are the real app driven frame by frame (`docs/social/source/cap3.js`), then composed at 60 fps (`film.tpl.html`) and rendered at twice the pixel density into a near lossless master (`render2.js`), then scaled down: 2560x1440 for LinkedIn, 1080x1350 for Instagram, 1920x1080 for the site.
Approve and send (2026-11-18, Ismael): the black button shows a turning white circle, then "Sent!", then the sent item fades out, its row folds away and the next item fades in; no toast, and the Review page has no Decided list. An email is approved only once the firm's mailbox has accepted it (`approveAndSend` in agent.ts, also used by the Outlook add-in): the item is claimed first so it is never sent twice, and if sending fails it stays in Review, unsent, with the reason under the button. Tested against the stand-in in `tests/eval/workspace-check.mts` (sent to the right address, two clicks send once, a refused send stays in Review and goes when approved again, no address says why). Known: one Google Chat check in `workspace-google-check.mts` fails with or without this change.
Earlier note: **Landing video (Ismael, 2026-11-16): on hold until the interface is locked.** It replaces the "All your cases in one
place" section and goes right after the hero, before the grey sentence that lights up. It shows Lincoln's whole value
with real screens, is calm and easy to follow (not long, not rushed), and uses a realistic made up firm with real
looking names, cases and profile photos (never "Test"). Captions follow the marketing words rule in CLAUDE.md.
What the two Harvey references he sent do well: one serif title line per beat across the top; the real product UI
centred on a dark textured canvas; a second panel slides in beside it with an activity log whose steps tick in one by
one; slow zooms into the detail that matters; the wordmark small at the bottom; abstract collage and paper texture
transitions with kinetic type between product shots, ending on the logo. A first draft (scratchpad film.html, cream
canvas, 44 seconds) was stopped before rendering.

**Built 2026-11-16, after Legora's Microsoft 365 launch (all autonomous):**
* Emails waiting for approval are also drafts in the sender's own Gmail or Outlook (replies sit in the client's
  thread). Edits made in the mailbox come back into Lincoln and teach the firm's style; a draft sent from the
  mailbox is recorded as sent and its approval closed; approving in Lincoln sends that same draft; returning an
  email deletes the draft. Needs the new Gmail compose permission, so Google users reconnect once.
* Approved letters, translations, filing packets and marked up documents are saved into the client's folder in the
  attorney's Google Drive or OneDrive (2026-11-20, after Harvey's iManage two way sync): the firm's own folder for
  that client when exactly one matches the name (any order, case or accents); a new folder next to the firm's other
  client folders, named their way ("Ortiz, Daniel (O-1A)"), once Lincoln has seen one; otherwise
  Lincoln/Clients/<client>. Two or more possible folders: one question in Review ("Client folder: <client>", Use or
  Lincoln folder), asked once; the answer resaves the case's approved work there. Saving again makes a new version of
  the same file, so the drive's version history shows every change. Google now asks for full Drive
  (auth/drive, replacing drive.readonly and drive.file) so Lincoln can write into the firm's own folders; it is a
  restricted scope like gmail.readonly, so it rides on the same CASA assessment. In Lincoln's Google Cloud project,
  add the drive scope to the OAuth consent screen and verification request; Google users reconnect once. Tested on
  the OneDrive and Drive stand-ins; not yet against real Google or Microsoft. The case Export menu links to the folder.
* Word documents that arrive (by email, Teams or upload) are marked up with tracked changes and comments
  against the case record and land in Review; the Word add-in has a Mark up button that does the same in the
  open document.
* Teams: once a channel is chosen, "Take requests from this channel" asks for the read permission (a Microsoft
  365 admin approves it once). Requests posted there are taken like any instruction, answered in the thread
  ("On it."), and answered again with a link when ready. Only people with a Lincoln account in the firm count.
* The chat can search the person's own mail and files (only what they can already open) and read what it finds
  into a case.
* Google Workspace has the same (2026-11-16, Ismael asked): "Add Google Chat" on the Google card asks for the
  Chat permissions, then a space is chosen; items for review are posted there and requests are taken and answered in
  their thread. A Google Doc posted in a request, linked in any request (chat, email, Lincoln's chat) is marked up and
  saved back into the client's folder as a Google Doc, the tracked changes becoming suggestions. There is no button
  inside Google Docs: that needs a Workspace add-on published through Google's Marketplace review.
* Before Google Chat works live: in Lincoln's Google Cloud project, enable the Google Chat API and fill in its
  configuration (app name and icon); the three Chat scopes go into the OAuth verification with the Gmail ones.
* Tested against stand-ins (`lincoln/tests/eval/workspace-check.mts` for Microsoft, 17 checks;
  `workspace-google-check.mts` for Google, 16 checks; both pass). Not yet tested: the chat search tools, and
  anything against the real Google or Microsoft APIs (including whether Google turns the tracked changes into
  suggestions exactly as expected).

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
* Goal (2026-11-16): venture scale, set by Ismael now that he is raising; the old goal of $100k a month profit by age 20 is dropped as too small. No new number yet.
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
* Price figure. Decided 2026-11-24 (Ismael): quote per firm from the Get In Touch answers, unlimited users, a fixed
  monthly fee set by new cases a month (guide in CLAUDE.md, untested), later on demo calls with a sales rep. Replaces
  the per seat structure (2026-11-12) and the $199 to $300 a seat figure.
* Who the parent or guardian owner is, and how payments and contracts are held.
* Which immigration lawyer will advise (nobody yet).
* Which model providers and what data agreements.
* Security (2026-11-14): every free item of the security minimum is built and tested (17 of 17): whole database encryption, firm wide two step, 2 hour idle sign out, new device emails, breached password check, access record, daily model budget ($5 default, LLM_DAILY_BUDGET_USD), full firm export, breach plan (`docs/BREACH-PLAN.md`). Still open and paid or outside the code: off server backups, zero retention agreement with Anthropic, an independent security review, Google's CASA assessment, a lawyer reviewed data agreement. See `docs/SECURITY.md`.
* Domain (Ismael, 2026-11-14): uselincoln.com for the landing page, app.uselincoln.com for the app, as Harvey and Legora split it. lincoln.ai only later, once revenue can comfortably pay for it. Not bought yet (a parent buys it).
* Funding odds and first raise (Claude's advice, 2026-11-14 evening, not decided): with no live test, no lawyer grading, no
  firm using it, a 15 year old solo non lawyer founder, institutional pre-seed in the next 6 months is about 1 to 3 percent
  (a guess). The first money is more likely grants and angels ($10k to $100k) than a VC round. Ask for about $500k on a SAFE,
  not $1M to $1.5M, until firms use it: it pays for 12 to 18 months (model costs, a paid immigration lawyer reviewer, security
  review, company and legal). Biggest levers in order: firms using it weekly, a published blind accuracy test graded by a paid
  immigration lawyer (hired through a marketplace, not cold outreach), a 2 minute product demo video, applications to
  programmes that fund young founders. With firms using it and the graded test, about 10 to 25 percent within 12 months (a guess).
* Unit economics (Claude's estimate from the code, 2026-11-14, not measured): on Opus 5.5 a full employment case
  (60 page file, 3 drafts with citation checks, G-28 + I-129 + I-907) costs about $4 to $6; a family green card case
  about $4 to $5; a simple renewal about $1. Output tokens (including thinking) are most of it. Caseload sources are
  anecdotal: about 30 cases per associate plus 60 to 80 per paralegal, 70 to 150 open clients per attorney. A seat
  opening 10 to 20 new cases a month plus mail and questions costs about $65 to $120 a month; at $300 a seat that is
  roughly $170 to $225 profit before company costs. Levers that keep quality: Haiku for mail sorting and reminders,
  Batch API (half price) for work that can wait, prompt caching, sending only the form sections that apply, measured
  effort levels. Target after levers: about $30 to $60 a seat. The live test's usage table gives the real figure.
* Cost levers built (2026-11-14, tested with the stand in model): mail sorting, instruction reading and form section
  choice run on the light model (LLM_MODEL_LIGHT, Haiku 5.5 by default); client replies and all legal work stay on
  LLM_MODEL. Forms send only the sections that apply (an O-1 sends 292 of the I-129's 942 fields). The automatic fill
  after a file is read goes through the Batch API at half price (LLM_BATCH=off turns it off); a fill a person asks
  for runs at once. Usage is priced per model. Open: batch results are kept by Anthropic for 29 days, so check this
  against the zero retention agreement before real client files. Ismael (2026-11-14): margins should be 70 to 80
  percent; Opus only if Sonnet proves worse in the comparison. ICONIQ (Jan 2026, via secondary sources) puts AI
  company gross margins at about 52 percent on average, against 70 to 90 percent for mature SaaS.
* Fair use limit (Ismael, 2026-11-15): Lincoln is sold as unlimited, but each user is capped at $150 of model cost a
  month (LLM_SEAT_MONTHLY_USD, per user, not pooled; Claude chose $150 rather than $299 so the worst case still keeps
  about half the seat price). Work counts against the person asking in the chat or giving the instruction, otherwise
  the case's responsible attorney. A busy user is estimated at $30 to $70. LLM_DAILY_BUDGET_USD is a separate server
  wide daily cap ($5 default) and must be raised once several testers use Lincoln.
* Speed (Ismael, 2026-11-15): forms are filled at once at the normal price (batch only with LLM_BATCH=on, about 20
  cents a case dearer); reading batches run three at a time (LLM_READ_CONCURRENCY) and a case's forms in parallel.
  Same cost and prompts. Live timing of the long case before this: reading 2.5 min, all work done in about 10 min,
  6 of them waiting on the batch.
* Chat (Ismael, 2026-11-15): replies stream word by word and the page follows them down unless the reader has
  scrolled up; Stop keeps what was written; play and pause under each reply reads it aloud with the device's own voice (free, no
  credits; Retry was removed on 2026-11-15 because it spends credits for little); the arrow and reopening a chat land at the very
  bottom; no empty space under the box. Answers are brief: a broad question ("what can you do") gets two or three
  sentences and one question back, never a pitch. Lincoln never lists what it does not do yet, what is planned or how
  it works inside; asked about something it cannot do, it says so in one sentence.
* Live chat check (2026-11-15, Sonnet, about 3 cents): five questions answered in 3 to 5 seconds, 22 to 124 words,
  no feature list, no roadmap ("what are you working on next" got no leak). Found: one outdated citation (premium
  processing given as 8 CFR 103.7(e), now 106.4) and "Lincoln"/"I" mixed. Prompt tightened for both; not rerun live.
* Notifications (Ismael, 2026-11-15): Lincoln asks with the system's own permission box only (on the first tap a few seconds in,
  as phones require a tap; switch in Settings, Profile). Web Push works on Android, iPhone (from the Home Screen) and
  computers (Chrome, Edge, Firefox, Safari). Web Push with no outside service: key derived from LINCOLN_SECRET,
  messages signed and encrypted for the device. Sent only when the person is not in the app (the open app reports
  presence every 20 seconds). Items landing in Review are batched over 20 seconds into one notification. Chat replies
  now run on the server to the end even if the app is closed, reopen mid reply, Stop works from any page, and a reply
  finished while away is a notification. iPhone only after adding Lincoln to the Home Screen. Signing out a device
  stops its notifications. Not yet seen on a real phone. Lock screen previews show client names.
* Case type test FINAL (2026-11-15): all 12 cases run, $4.27 in total. Every main planted problem was caught. Fixed from
  it: identity facts dropped from forms, forms failing on rate limits, no knowledge of today's date, non-problems
  reported as issues. Weak spots then fixed in the prompts (not yet rerun live): the 2026 I-864P
  minimums (official USCIS table, `lincoln/src/lib/thresholds.ts`, update each March), Arrabally, the 245(c) immediate
  relative exception, and fewer minor issues (missing documents as one item, no G-28 or engagement letter items, at most 8).
  Live recheck (case 13, $0.39): the J-1 212(e) bar was still caught as the top item, issues fell from about 20 to 10,
  missing documents became one item; but the first reading did not have the new rules, so it still listed overstay and
  advance parole as high and the income as 'may' fall short. The rules and I-864P table now go to the first reading
  too (not yet rerun).
* Case type test (2026-11-15, live, $1.48 so far, cases in `lincoln/tests/case-types/` with KEY.md): free stand in run
  of all 70 case types passed except the 10 forms not yet added. Live: marriage green card ($0.95; caught the marriage
  date conflict, treated overstay and work as excused for an immediate relative, raised the I-864 shortfall without
  computing it), spouse I-130 ($0.33; caught the marriage before the divorce was final), I-90 for a conditional
  resident ($0.20; caught the wrong form). Two bugs fixed: identity facts (birth date, family name) dropped from
  forms, and a form failing on a rate limit (calls now retry). Stopped by the $10 daily cap; 9 cases not run.
  Cost finding: the green card package forms cost $0.79 because each form sends its full official instructions
  (up to 60k tokens); trimming or sharing that cache across cases would cut form cost sharply.
* Case type test suite, original plan: Plan: about 12 short made up cases covering the form families (I-129,
  I-140, I-130 with I-485 package, I-129F, I-751, I-589, N-400, I-90, I-821D, I-601A, I-539, I-290B), each with
  planted problems and a key; free stand in run first, then one live case, then the rest (estimated $6 to $9).
* Models decided (Ismael, 2026-11-15): Sonnet 5.5 as LLM_MODEL for all legal work (reading, checks, forms, letters,
  citation checks, emails, chat); Haiku 5.5 as LLM_MODEL_LIGHT for mail sorting, instructions and form section choice.
  Opus not used unless a later test shows it catches what Sonnet misses. Second check widened to six checks (bars and
  their cures, missing items, conflicts that describe the same thing, unsupported claims, requests the facts do not
  allow, history versus this case), up to 12 items; drafts attribute letter claims to their author.
* Model comparison (2026-11-15, live, long O-1A test case, `docs/MODEL-COMPARISON.md`): Sonnet 5.5 did the full
  case for $1.37 with about 20.5 of 22 planted problems caught; Haiku 5.5 for $0.135 with about 18.5, weak drafting and
  one serious misread notice; Opus 5.5 lost three readings to a Lincoln length limit bug (fixed) and has no result yet.
  Six Lincoln bugs fixed from it, including a security hole (profile title granted admin). Render still has the test
  settings (LINCOLN_MODEL_BY_FIRM, LLM_DAILY_BUDGET_USD=10, LLM_BATCH=off) until the Opus run; remove them after.
* Pre-seed size (Claude's earlier advice, 2026-11-14, superseded by the line above): about $1M (range $750k to $1.5M) for 18 months: two engineers, a part time immigration attorney reviewer, SOC 2 Type I and a penetration test, model and hosting costs, growth, legal and insurance, and a buffer. Ismael's model budget for testing now is $5 to $20, so tests are run small.
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

## Funding plan (Ismael, 2026-11-19)
1. Apply to accelerators and fellowships now: Z Fellows (submitted wording in docs/applications/z-fellows.md, reuse it for the others),
   YC W27 (late application), Thiel Fellowship, PearX, and similar. Not Vercel X: it requires applicants to be of
   age (18 in Ireland) and six weeks in person in San Francisco (checked 2026-11-23). Check the age rule of every
   programme before applying; never misstate it.
2. Take their money for equity (usually $10k to $500k). Keep total dilution before the seed low.
3. Spend it on what gets the first paying firms: the security minimum for real client files, the company and
   contracts, model costs, and possibly Jim Melo.
4. Get a handful of paying firms. This is the step everything else depends on.
5. Raise a seed of $2M to $5M+, hire two top people (see docs/PEOPLE.md), then scale.

## Accuracy plan (2026-11-22, after the first real case test)
* Goal: mistakes measured, caught before they reach a client, and falling with every change; "never wrong" is not a
  promise anyone can make (in 3 of the 10 appeals USCIS's own officers were overturned).
* 1. Grow the real case set to 100+ across every case type Lincoln handles (Ismael downloads AAO decisions in batches;
  the site blocks this server). 2. Rerun the set after every prompt or model change and never ship a change that lowers
  the score. 3. Case type rulebooks: the exact legal tests per case type from the regulations and Policy Manual, given to
  Lincoln when it works that type (most misses were a specific test not applied). 4. Compare models on the set (no
  model bias). 5. Every attorney correction becomes a new test case. Attorney approval stays on everything.
* Step 3 done (2026-11-22): `lincoln/src/lib/rulebooks.ts` has a rulebook for every case type in the library, widened
  the same day from 156 to 236 types to cover the whole US immigration system (adjustment routes such as DV, registry,
  Cuban, refugee, asylee, U, T, VAWA and SIJS; dependents; AC21; Schedule A; enforcement such as reinstatement, 238(b),
  port of entry; citizenship suits 1503, 1447(b), 1421(c); BALCA, DOL investigations, corporate changes, layoffs). Each has: the tests in the order an adjudicator applies them, the standard, key precedents and the usual traps. Lincoln
  gets it when it reads a file, on the second check and when drafting, and the draft also gets the official text of
  every provision the rulebook cites. All 679 citations the law library covers were checked against the published text
  (none missing). Drafted by Claude from the regulations, not yet reviewed by an attorney; fast moving areas (fees, DACA,
  TPS, parole, H-1B selection, Gold Card) say "check current". Found while checking: the public charge regulations (8 CFR 212.20 to 212.23) were removed from the CFR on 2026-09-18
  and the NACARA rule 245.13 is gone, so those rulebooks apply the statute and say so; the T visa rules moved from 8 CFR
  214.11 to 214.200 to 214.216 in 2024 (the old AAO case 10 applies the old text), and the law library was mislabelling
  parts of 8 CFR 214.2(h), the SIJS rule 204.11 and 1208.18, and giving passages that opened on the paragraph before
  the one cited. Fixed; the live library rebuilds itself on the next deploy. Not yet measured: needs a paid rerun of
  the ten cases (about $1.25), which waits for funding.

* Official codes (2026-11-22): `lincoln/src/lib/codes.ts` indexes all 289 codes from the government's own lists: the
  State Department's 242 visa symbols (22 CFR 41.12 and 42.11) and the 47 work permit categories (8 CFR 274a.12 plus
  (c)(31)), each pointing to its rulebooks. Every form named in 8 CFR, 20 CFR 655 and 656 and 22 CFR was checked
  against the library; the rest are agency paperwork (warrants, manifests, cards), not cases. DHS class of admission
  codes for adjustment (IR6 and so on) are not in any regulation and are not indexed. Stacked cases: the second check
  and drafts get every rulebook the facts raise (a waiver, a prior removal, an arrest, an RFE, ageing out), with the
  official text, up to a size limit. 679 citations checked, none missing.

* Rulebook engine, same day: every one of the 236 rulebooks now has the same four parts (law, tests in order, evidence
  that proves them, traps that sink cases; evidence and traps in `lincoln/src/lib/rulebook-evidence.ts`), and the
  thinnest 24 with real legal tests were rewritten as numbered tests. `npm test` fails if any case type or official
  code lacks a part (`lincoln/tests/rulebooks.test.mjs`). Rulebooks now reach every place Lincoln does legal work:
  reading (including long files), the second check, drafts, the RFE and NOID evidence grid, redlining, and the chat
  (a case's own rulebooks in a case chat, and a rulebook lookup for any type or code). Not used in client emails on
  purpose (no legal answers to clients) or in form filling. 694 citations checked, none missing.

## Form filling accuracy (2026-11-22)
* Lincoln writes answers into the official PDFs' own fillable boxes, so position comes from the form: rendered I-130,
  I-485, I-765, I-129 and N-400 pages show text left aligned and centred in each box, digit grids one per cell.
  Typed answers are what USCIS asks for ("type or print in black ink"); signatures stay for the person, by hand.
* Found and fixed: 19% of box labels (1,905 of 10,051) were cut at 300 characters before the words naming the box;
  USCIS internal box names are often left over from older editions (G-28 box keyed Line6_EMail is the mobile phone box;
  I-129F Pt1Line11 is in Part 2), so the label decides, never the name; header A-Number boxes printed blank because the
  Adobe copy script is removed when filling.
* Guards now: the model must give back each box's key (an answer aimed at the box next door is dropped); every value
  must have its box's shape (dates real, ZIP, state, A-Number, SSN, receipt, email, phone, area code, names without
  digits); two ticks on a single choice question are both dropped; a value too wide shrinks to no less than 7 point,
  else the box stays blank (never cut); long streets take USPS abbreviations; copy boxes are filled from their source.
  `lincoln/tests/forms-guard.test.mjs` runs these on the real forms in npm test. Swept all 37 forms (10,047 boxes):
  every wrong-shaped answer the test produced was stopped. Not yet measured: a live fill with the real model.

## Focus (Ismael, 2026-11-24)
* Stay focused and small: immigration firms only for now. Ideas noted for later, not to be raised again until he does:
  BigLaw practice areas (after funding and certification), criminal defence and investigations (evidence mapped to the
  elements of each offence, timelines, contradictions; the firm supplies discovery, Lincoln cannot fetch evidence).
  Ceilings estimated the same day are in docs/RESEARCH.md.

## Landing page: particles (2026-11-25, Ismael chose it from five options, then asked for it cleaner and more alive)
* Black, light serif type, points of light (`src/components/landing/Points.tsx`, 2D canvas, no WebGL needed). Hero: a
  3D courthouse (fluted columns, entablature, pediment, steps; points mostly on edges, spread by edge length) over a
  rolling field of points, with dust. It streams in from a scattered cloud, turns slowly, twinkles, leans toward the
  cursor, parts around it, ripples from a tap, and scatters into dust as the hero is scrolled away (reforms on the way
  back). Close: three fanned filing pages form the same way.
* Phones: no cursor, so a finger moving over the page parts the points, a tap sends a ripple, and scrolling turns the
  building. No tilt sensor (iPhone would ask permission first). Fewer points on phones.
* Page: statement lit word by word, 3x3 hairline grid of the nine capabilities (fills white on hover), "Any
  immigration case." with the families of work under it (Ismael, 2026-11-25: say it once rather than list types), the
  connectors drifting in two rows with their logos in white, names in grey (Simple Icons, CC0; Google seven, Microsoft eight; Outlook Calendar mark from Microsoft Fluent icons, MIT; only ones Lincoln
  really connects to), privacy, one row footer. Copy shared in `src/components/landing/content.ts`.
* The other four options (Atelier, Thermal, Field, Glass) and the warm light version are in git history (commit
  d1b2ec9) if ever wanted.

## Readiness pass (2026-11-24, after "Lincoln should be ready now for any attorney")
* Word (.docx), text, RTF, Markdown and saved email files are read everywhere a file comes in (email attachments, uploads,
  Drive, the intake link): before this they were silently skipped. They become pages of their words (tables as rows),
  so consultation notes, CVs and draft letters are read like a scan. Excel (.xlsx) is read as rows per sheet (blank
  columns kept in line), and a zip is opened and every file in it read (not a zip inside a zip, not Mac system files).
* Old Word (.doc), Outlook messages (.msg), saved and forwarded emails (.eml, an email attached to an email) and
  TIFF scans (several pages, faxes) are read too. An email reads as the email (from, to, date, subject, body; HTML
  and Outlook's RTF bodies unwrapped) and its attachments are read as files, so an offer letter forwarded inside
  an email reaches the case. Logos in signatures are skipped. Tested on real Outlook files and a real Word 97 file.
* The Gmail and Outlook connectors used to fetch only PDFs, photos and Word files, so Excel, zips, text, old Word,
  emails and scans sent by email never reached Lincoln. Both now fetch every document (one rule, `keepAttachment`
  in `integrations/types.ts`); Outlook fetches an attached email too. Drive and OneDrive search find Word, Excel,
  text, email and scan files, and a Google Doc or Sheet comes in as Word or Excel. Every upload box (case, new case,
  chat, client intake link) offers the same list (`src/lib/accept.ts`).
* Stand-in mailbox checks: every email, attachment, send and folder check passes. The Teams and Google Chat request
  checks fail with the free stand-in on the old code as well (they depend on what the model replies); not caused here.
* Every common office format is read too: PowerPoint (.pptx and old .ppt, with speaker notes), old Excel (.xls),
  OpenDocument (.odt, .ods, .odp), Apple Pages, Keynote and Numbers (2009 and 2013+ formats), WordPerfect (5.x and
  6+), winmail.dat (the files inside it), web pages, GIF, BMP and AVIF. Google Slides come in from Drive as PowerPoint.
  What is still refused: password protected or damaged files ("Could not open" asks for an unlocked copy). No audio
  or video (Ismael, 2026-11-24: no call recordings for now).
* Writing (Ismael, 2026-11-24): a hybrid. Official text stays exactly as its source writes it ("&" included: the State
  Department code table is as published, "Business & Pleasure"); Lincoln's own sentences write "and". LEGAL_STYLE
  (every draft, note and chat document text) and EMAIL_STYLE set this; `formal()` fixes "&" between ordinary words in
  Lincoln's own sentences in every draft, email and redline edit, never inside quotation marks, names or citations.
  `tests/style.test.mjs`.
* A file Lincoln cannot read is never dropped in silence: the case gets "Could not open: name" asking for a PDF or Word
  copy (Pages, PowerPoint, password protected files, winmail.dat). Calendar invites, contact cards and signature
  files are ignored as not evidence.
* `tests/files.test.mjs` is part of `npm test`, so file reading cannot quietly break again.
* The case record now holds the client's recent emails (quoted replies stripped), and the second reading has a seventh
  check: a claim made in an email, the questionnaire, consultation notes or a letter (award, publication, judging,
  role, salary, prior visa, marriage, trip) that no document proves becomes "No proof in the file: ...".
* Evidence sent later is placed in the case: each new document gets a line in the case activity saying which
  requirement it strengthens, adds to or weakens, or that it is not relevant.
* Count phrases read correctly in the singular ("1 requirement"). The old Google Chat check failure was the test
  missing APP_URL; fixed in the test, all workspace checks pass.
* Free check: tests/eval/case-flow-check.mts with tests/eval/model-standin-case.cjs. Not yet run on the real model.

## Real case test set (2026-11-22)
* `lincoln/tests/aao/`: ten real USCIS AAO appeal decisions (EB-1A, O-1A, NIW, H-1B, EB-1C, 212(i) waiver, 212(h)
  waiver, U, VAWA, T), each turned into a case file and an answer key from USCIS's own findings. Tests legal judgement,
  not document reading. uscis.gov blocks this server (bot shield), so Ismael downloads decisions by hand.
* First run (2026-11-22, approved up to $2.50, spent $1.39): Sonnet 5.5 scored 34.5 of 45 (77%), with none of the keys'
  bad failures in any case. Grades and every mistake: `lincoln/tests/aao/results/GRADES.md`. Pattern: never calls a
  losing case approvable, but would not commit on the strong cases USCIS remanded (06, 09, 10) because it treated a
  summary of the evidence as no evidence; and the citation check stamped correct analysis "not shown" or "says
  otherwise" (six false notes in case 07).
* Fixed in `src/lib/intake.ts`: page references only on facts; the citation check no longer flags analysis or "not in
  the file" sentences; assessment requests get reasoning rules (preponderance under Matter of Chawathe, findings per
  requirement, what is not reached once a requirement fails, other people's approvals never count, hardship beyond the
  usual consequences with both scenarios and discretion as a separate weighing, the specific regulatory test).
  Rechecked on cases 07 and 09 only: 3.5 to 5 of 5 and 1.5 to 3 of 3, false citation notes to zero. Same cases the
  fixes came from, so not independent proof. Next: rerun all ten (about $1.25, needs approval), then add new cases.
* `tests/aao/redraft.mts` redoes only the drafting step on a saved run (about $0.06 a case); `run.mts` now prints its
  data folder and saves which firm holds which case.
* Left as is: every case opened as "Consultation" rather than its case type (the test email comes from a prospective
  client); drafts sometimes put "(p. 1)" after the full stop.

## Health check (2026-11-21)
* Walked as the sample firm and a blank firm: 297 page loads (desktop and phone, light and dark), no console errors, no
  failed requests, no sideways overflow; median load about 0.6 s. Main buttons pressed (search, tabs, Export menus,
  Review edit and save, Approve and send, strategy decisions, chat with copy and rename, Library, Settings, phone tab
  bar and More): all work. Every export downloads a valid file; the filing packet is a 72 page PDF.
* Fixed: Others on Integrations said "Connect" but only record a request, now "Request"; Help was one paragraph, now
  seven short answers on how Lincoln works; logos stay visible in dark mode; on phones the empty chat keeps its box at the
  bottom; the summary deck was plain bullets with raw labels ("claim", "more"), now Lincoln's look with tables,
  readable labels, dates written out and four issues per slide.
* Free stand-in model for walking the app without credits: `lincoln/tests/eval/model-standin.cjs` (port 4547).
* Still open from the check: one old failure in workspace-google-check ("replies again with a link when the work is
  ready"); Library shows "Not loaded yet" when the law sync is off (it is on in production).

## Next
* Sign in screens (2026-11-15): app.uselincoln.com callback addresses must be added in Google and Microsoft (done by
  Ismael or pending). Microsoft: the app is unverified (publisher domain is the onmicrosoft.com default), so people
  on firm work accounts usually cannot approve it without their IT admin. Fix: add uselincoln.com as a verified
  custom domain in Entra (TXT record at GoDaddy), set it as publisher domain, then join the Microsoft AI Cloud
  Partner Program as the company (owned by the parent, primary contact on an @uselincoln.com email) and add its
  MPN ID. No paid email needed: hello@uselincoln.com on Zoho Mail's free plan, and the custom domain is added free
  in the existing Entra directory (do not buy Microsoft 365 for this; Claude wrongly suggested it once). Google shows the logo only after brand verification. Home page in both branding pages stays https://app.uselincoln.com
  (Ismael, 2026-11-15) until the landing page is live; then change it to https://uselincoln.com in Google and Microsoft.
* Backups (2026-11-16): checked, encrypted database copies every six hours, optional off site bucket, restore
  script, status on /ops; see docs/RENDER.md. A second server needs a move to a hosted database (a separate project).
* Team features (2026-11-16): only a lawyer role can approve filing work (packet, drafts for review, strategy
  decisions); others see "For attorney approval" and the server refuses too. Team menu on each case: admins or the
  case's attorney change the attorney (lawyer roles only) and paralegal; pending approvals move to the new attorney.
  A case link the client already used is now their status page: stage in plain words (never the outcome), documents
  received and still needed, and Send more documents (files only, appended to the case). Repeated issues from later
  readings are no longer added twice.
* Evidence grid (2026-11-16): when an RFE, NOID or NOIR arrives, Lincoln maps each point the agency raised to the
  pages that answer it (graded 1 to 4, met, partial or missing, what is still needed and from whom), from the case
  record in one short text call, and writes the response with that map. The Evidence tab is now a grid: points and
  requirements down the side, documents across, each cell linked to its page. "Met" only stands with a real page;
  pages not in the file are dropped. Export menu: Evidence grid .xlsx (one row per piece of evidence, filterable).
  The same notice sent twice is not answered twice.
* Law library (2026-11-16): the INA (8 U.S.C., with INA section numbers), all of 8 CFR, 20 CFR 655 and 656, and
  22 CFR 40 to 42, from the official downloads only (Law Revision Counsel XML release points, eCFR API). About 7,300
  passages, each with its exact citation and a link to the official text; filled a minute after the server starts,
  then checked twice a day and downloaded only when a new release is out (13 seconds for a full load). Search by
  citation ("8 CFR 214.2(o)(3)(iii)", "INA 212(a)(9)(B)(v)") or words, on the Library page (sidebar, and More on
  phones), in the chat (search_law tool), and in drafting: every provision a request or the case's requirements cite
  is given to the draft as official text, and other provisions get an Attorney note to confirm. Status and Update now
  on /ops. Not in the library yet: USCIS Policy Manual, BIA and AAO decisions, Visa Bulletin, fee schedule (their
  sites were not tried; only sources with official downloads go in, never scraped). LAW_SYNC=off turns syncing off.
* Word add-in (2026-11-16): Integrations, Word add-in gives the manifest (lincoln-word.xml) and a one time code
  (8 characters, 10 minutes, one use). Install in Word: Insert, Add-ins, My Add-ins, Upload My Add-in (or a firm's
  Microsoft 365 admin deploys it to everyone). A Lincoln button appears on the Home tab; the pane connects with the
  code and then holds its own token (hash only on the server, 90 days, ended by a new code or Disconnect; the firm's
  two step rule still applies). In the pane: pick a case, Insert any draft at the cursor (headings and citations
  kept), Check the open document (every "(p. N)" or "(Doc, client file p. N)" claim against the page, every Exhibit N
  against the exhibit index, every INA and CFR citation against the current official text), and Library search with
  Cite and Quote. Only /word may be framed, and only by Microsoft's Office domains. Tested in a browser with a stand
  in for Word; NOT yet tried in real Word or checked with Microsoft's manifest validator (that needs Word and
  network access to Microsoft). AppSource listing is a later step.
* Accuracy record (2026-11-16): `lincoln/tests/eval/` sends all 20 test cases (7 adversarial, 13 case types) to
  Lincoln as client emails through the real mail path, waits for everything Lincoln does on its own, grades it against
  machine keys (`checks.json`: required findings and bad failures) and writes a dated scorecard to `results/`. Harness
  checked free on a stand in model. Live run not done yet (needs Ismael's approval for the credits).
* Translations (2026-11-16): every document read that is not in English gets an English translation at once (every
  word, stamps and seals described, [illegible] where unreadable, nothing guessed), with the 8 CFR 103.2(b)(3)
  translator's certificate ready to sign. It is a draft (review, edit, Word export, add-in) with a Review item for the
  case's paralegal; the Documents tab links it; the filing packet puts it behind the original. A competent translator
  must check and sign; Lincoln is never the translator. Checked on the stand in model only.
* Firm memory (2026-11-16): drafts now have Edit, then Save (each save is a new version), and the Word add-in has
  Save to Lincoln after Insert. Every change to a Lincoln document or email (emails through Edit before approval) is
  kept paragraph by paragraph; after three, a light model call distils at most 12 general writing preferences per firm
  (documents and emails separately; never client facts or legal positions) that every later draft, reply, reminder and
  chat email follows. Admins see and remove them in Settings, Firm, Writing style (folded; hidden until there are
  some; a removed one is not learned again). Approved documents are the firm's precedent: a new draft of the same
  kind and case type follows the best earlier one's structure and tone, with the other client's names replaced and
  an instruction never to use its facts; sensitive cases are never used. Checked on the stand in model only.
* Import, switching in a day (2026-11-16): the New case box also takes an old system's case list (CSV or Excel,
  any software; the biggest sheet is used) and zips of client folders (up to 150 MB each). Lincoln maps the columns
  with one light model call (client, email, type, petitioner, receipt, status, attorney, opened, every important
  date, notes), opens a case per row with the stage inferred from the old status, dates and receipt kept, the
  attorney matched by name, date rules applied, and duplicates (same receipt, or same client and type) skipped. Each
  zip folder goes into the case whose client it names ("Marquez, Sofia") or opens one (client and type from a form
  number in the folder name, otherwise from the documents), and files are read two cases at a time in the
  background. Checked with made up Docketwise style exports on the stand in model. Not yet: whole Drive or OneDrive
  folder import. No direct connections to Docketwise and the like: they need partnerships, which Ismael ruled out for now (not yet, not never).
* USCIS case status (2026-11-16): built on USCIS's official Case Status API (developer.uscis.gov, OAuth client
  credentials, GET /case-status/{receipt}; format confirmed from USCIS's own article). Every case with a receipt is
  checked once a day; a change shows on the case header, is logged, notifies the attorney, and approval, denial or a
  request for evidence moves the stage (denial and RFE also raise a high issue). Off until USCIS_CLIENT_ID and
  USCIS_CLIENT_SECRET are set (steps in docs/RENDER.md). Access is for the company: sandbox at once, production after
  Form G-1595 and a demo; demo slots booked through March 2027 (checked 2026-11-16). Tested against a stand in shaped
  like the documented sandbox only. Removed from the Integrations page on 2026-11-16 (needs a USCIS application and
  demo); the code stays off unless the credentials are ever set.
* Security requirements for selling to firms (bare minimum, mid market, BigLaw, and where Lincoln stands): saved in
  docs/RESEARCH.md, 'Security requirements for law firms'. Next: a parent asks Anthropic sales for zero data retention.
* Team (2026-11-16): no public sign up (/signup goes to /start; Google or Microsoft sign in only joins an open
  invite). Lincoln staff set up firms at app.uselincoln.com/ops (needs LINCOLN_OPS_EMAILS on Render) and get an admin
  invite link to send. Admins invite people from Settings, Firm (role, Admin switch; emailed if Resend is set up,
  otherwise a link to copy), change roles and switch admin on or off; a firm always keeps one admin. Role is a job
  title only (lib/roles.ts). Firm link cases go to every admin (all notified); the first admin is the name on it.
* Intake link (built 2026-11-16, tested with a stand-in model): the firm has one link (Settings, Firm), every member
  their own (Settings, Profile; cases from it are assigned to them; firm link cases go to the admin, Ismael 2026-11-16) and every case its own (Client link on the case
  page). The client picks a topic, then the matter in plain words (65 matters in 12 topics covering every case type
  in lib/library.ts, in lib/intake-matters.ts), answers About you and matter questions, adds documents per checklist item (small or blurry
  photos flagged on the phone), then Send. Answers become a questionnaire page; with the documents it goes into the
  case (new case for the firm link) and Lincoln reads it as usual. Progress is kept on the phone. Not built yet:
  reminders to clients who stop halfway, other languages, adding documents later to a firm link case. Unverified:
  how immigration firms actually take in new clients.
* Landing page colours (2026-11-23): mirrored to dark (near black page, off white type and buttons, dark product
  cards) on the landing page and /start, pushed so Ismael can see it live; not yet decided. To go back, revert the commit
  "Landing page in dark".
* Landing page (2026-11-16): lives at uselincoln.com (Ismael: app.uselincoln.com is strictly the app). One Next app
  serves both; src/proxy.ts shows the landing page on uselincoln.com/, keeps /terms and /privacy, sends www to the
  bare domain and every other path to app.uselincoln.com. Needs uselincoln.com added in Render and DNS at GoDaddy
  (A @ 216.24.57.1, CNAME www to the onrender.com host; Zoho MX and TXT untouched). Kept out of search until approved.
  Done 2026-11-16: GoDaddy records set, uselincoln.com verified in Render with a certificate. The duplicate Render
  service (made by a Blueprint from render.yaml) and an old market-research service were deleted; render.yaml was
  moved to docs/RENDER.md so no Blueprint can recreate the copy.
  Get started form (2026-11-16): /start on uselincoln.com; answers saved in the enquiries table and emailed to
  hello@uselincoln.com (reply goes straight to the firm) only if RESEND_API_KEY and MAIL_FROM are set on Render.
  Editorial direction: warm white, Literata, Ismael's own photographs (courthouse, concrete, marble, old letters,
  boardroom; in lincoln/public/landing, 1080px wide, originals would be sharper), the work laid on the photos, the
  word by word statement, and one 3D piece (case papers spread on a desk fold into a filing packet). Plan: home page
  plus a Security page first; Pricing, Customers and Blog only once there is real content for them. Next: polish
  with Ismael, then point uselincoln.com at it.

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
* 2026-11-14 (evening): Ismael added 37 official forms and 31 instruction files to `lincoln/forms` (list in its
  README). Lincoln now reads each form's official instructions before filling it (cached, so a long form costs one
  full read). Finding: every USCIS form is a locked PDF (opens without a password, filling allowed, other changes
  not), and pdf-lib cannot open locked files at all, so no real form can be filled yet. A fork (@cantoo/pdf-lib)
  opened the G-28 and read all 101 fields with proper labels; Ismael approved it and it is now Lincoln's PDF library.
  All 36 forms open, read (8 to 942 labelled fields each), fill and save as clean PDFs (`scripts/check-forms.mts`). Also open: the 2D barcode on each page will not carry the answers once filled
  outside Adobe; check whether that matters before filing. Still missing: I-360, I-821, I-730, I-134, I-212,
  I-192, I-526, N-600K, N-336, N-470, and court (EOIR) forms.

