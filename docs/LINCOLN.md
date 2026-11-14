# What Lincoln is (draft, 2026-11-12)

**The plan being built now is `docs/LINCOLN-V1.md`; it wins where the two differ.** This file is the
background and the longer term version.

Nothing here is built. "Decided" means Ismael said it in conversation; "proposed" means Claude
suggested it and he has not agreed yet. Update this file when either changes.

## In one line

Lincoln runs every immigration case for a US law firm, from the day a client signs to the day
USCIS decides, so the lawyer only reviews and signs. (Decided in substance, wording proposed.)

## Who it is for (decided)

* US immigration law firms and their lawyers and paralegals. Sold to the firm.
* Never finding clients ourselves. An AI law firm was considered and rejected (clients trust
  established firms).
* Immigration first, every case type the firm takes, not a short list of visas. Other practice
  areas only later, if immigration works.

## What the firm gets (decided in substance)

* Cases that move without anyone at the firm chasing, drafting from scratch or watching dates.
* Work that matches a top immigration lawyer's work product. Lincoln never presents itself as a
  lawyer; a licensed lawyer reviews and signs everything.
* Every deliverable back automatically as editable Word files, any other format on request.
* Not a wrapper: it acts over months, keeps the state of each case, works with other people and
  government systems, and learns from outcomes. Plain Claude cannot do that.

## End to end: how a case really runs in a firm, and what Lincoln does (2026-11-12)

Decided (Ismael): Lincoln is its own platform, not a layer on Clio or anyone else. It connects to each
user's email and calendar. A one time import from the firm's old software is only for switching.

| Step | In a firm today | Who | Lincoln |
|---|---|---|---|
| 1 Enquiry | Web form, referral, email or call | Intake staff | Logs it, drafts the reply and consultation booking for approval |
| 2 Consultation | Eligibility talk, notes | Attorney | Prepares a one page brief beforehand, turns notes into a case plan |
| 3 Engagement | Fee agreement signed, first payment | Attorney, admin | Drafts the agreement from the firm's template, sends it to sign |
| 4 Case opened | Case created, attorney and paralegal assigned | Managing attorney | The moment it is opened or assigned, Lincoln starts. Each assignee is notified |
| 5 Questionnaire and documents | Questionnaire and checklist sent; documents chased for weeks | Paralegal | Sends them in the client's language, reads each upload, sends back bad scans, chases on a schedule |
| 6 Third parties | Referee and employer letters drafted, sent, chased; translations ordered | Paralegal | Drafts each letter, sends to edit and sign, chases, orders translations |
| 7 Strategy | Which criteria to claim, what to leave out | Attorney | Proposes it with reasons and cited pages; attorney decides |
| 8 Drafting | Forms, support letter, exhibit index | Paralegal, attorney | Drafts everything as Word files |
| 9 Review and signatures | Attorney reviews; petitioner and client sign forms | Attorney, client | Review in summary form (below); collects signatures |
| 10 Filing | Packet assembled, fees, mailed or filed online | Paralegal | Assembles the packet and the filing checklist |
| 11 After filing | Receipt notice, case status, biometrics, RFE or NOID, approval | Paralegal, attorney | Reads notices as they arrive (scanned or online), tracks status, drafts the RFE response the same day |
| 12 Next steps | Visa stamping abroad, extensions, green card steps | Attorney | Starts the next case and sets every future date |

Email: Lincoln reads each user's inbox only for case related mail (client replies, documents, referee
replies, USCIS emails), files it to the right case, and drafts replies. Users choose what it can see.

Making review fast (lawyers on Reddit said reviewing AI can take as long as doing the work):
* One approval card per decision: what Lincoln wants to do, why, and the source, with approve, edit
  or reject in one tap.
* Three levels: routine actions run on rules the firm sets once (reminders, chasing); outgoing
  messages to referees and clients are approved in a batch; legal judgement and anything filed gets
  the attorney's full review.
* Facts are checked automatically against the documents (a second, separate check), and each one
  links to the highlighted page. Drafts mark which sentences are judgement calls, so the attorney
  reads those closely and spot checks the rest.
* Changes between versions are shown side by side.
* Notifications in the app, by email and on the phone, plus a daily summary.
* Trust is measured, not claimed: Lincoln records how often lawyers change its drafts and shows the
  firm that rate over time.

## What Lincoln does on a case (proposed)

1. **New case.** Starts on its own when the firm opens a case in its case software, forwards a
   signed engagement letter, or adds it in Lincoln.
2. **Intake.** Sends the client a questionnaire and a checklist built for their case type, in their
   language, in the firm's name. Reads every upload as it arrives (scans, spreadsheets, other
   languages), sends back what is unusable, flags conflicts, name variants and dates that matter.
3. **Evidence.** Chases the client for what is missing. Drafts letters for referees, employers and
   experts, sends them to edit and sign, chases until signed. Arranges certified translations.
4. **Assessment.** Checks the case against the rules for its type, with citations: what to claim,
   what to leave out, what is missing, what is risky.
5. **Drafting.** Forms, the support letter or brief, exhibit index, cover letter, and a gaps and
   risks list for the lawyer.
6. **Lawyer review.** One place to read, edit and approve. Nothing legal goes out without approval.
7. **Filing.** Assembles the packet ready to file.
8. **After filing.** Tracks receipts and case status, drafts the Request for Evidence or NOID
   response the day it arrives, prepares interview prep, and starts the next step when a case is
   approved (for example an I-140 leading to an I-485).
9. **Every date, every case.** Expiry dates, filing windows and deadlines across the whole firm,
   with warnings before anything runs out.
10. **Anything else.** A general immigration assistant for the firm's other tasks.

## What Lincoln never does (decided, from the hard limits)

* Give legal advice to the public, appear in court, sign, or file without a lawyer's approval.
* Send anything to a client or third party that the firm has not approved or set rules for.
* Claim a case type is supported before it has passed a blind test with an answer key.
* Claim security credentials (SOC 2 and so on) or a zero retention agreement before they exist.

## How it is built (proposed)

* **One engine for every case:** intake, chasing documents and people, translations, forms, dates,
  USCIS status, RFEs, client updates.
* **A library entry per case type:** law with citations, forms and fees (with edition dates),
  evidence needed, deadlines, common RFE issues, written from USCIS form instructions, the
  regulations and the Policy Manual.
* **A test case with an answer key per case type,** scored blind. Untested types are clearly marked
  as unchecked to the lawyer.
* **Security from the first line (decided: extremely secure and private per firm):** each firm's data
  separated and encrypted with its own key, encryption everywhere, short lived file links, roles,
  two step login, a log of who opened what, no training on client data, real deletion, no client
  data in logs, data stored in the US. Made up cases only until security is reviewed.

## The funded version (proposed 2026-11-12)

What VC money buys, in order: the engine and case library for every immigration case type, each
passing its blind test; connections Lincoln itself needs (Outlook, Gmail, calendars, e-signing, a translation provider,
the USCIS case status API) and a one time import from the firm's old case software; an outside security audit and SOC 2;
the outcomes loop (which evidence wins, which draws RFEs, with each firm's permission); one adult
salesperson and a stand at the AILA conference.

## Why a firm picks Lincoln (proposed 2026-11-12, competitor facts from third party sources)

* **Harvey and Legora:** built for big firms and in house teams; Harvey reportedly needs about 20
  seats at about $1,200 a seat a month (unofficial). Their "Intake" products handle in house requests,
  not immigration cases. Most immigration lawyers are solos or in firms of 2 to 5 (about 35 percent and
  26 percent of AILA members, 2026 media kit).
* **CoCounsel:** research and drafting tied to Westlaw, about $637 to $784 per user a month for firms
  up to 10 attorneys (aggregators). Works when asked.
* **Clio Work:** the closest on acting without a prompt, but general across all practice areas and
  needs Clio Manage. Not built around USCIS, petitions and evidence.
* **LegalFly:** in house corporate legal (contracts, due diligence); not immigration firms.
* **Visalaw.ai and Parley:** immigration drafting on request (Visalaw about $220 a licence, $480
  with 10 drafts a month; Parley a team licence reported from $500 a month). The lawyer still runs the
  case: collects evidence, chases people, watches USCIS.
* **Lincoln:** the only one found that runs the whole case (people, documents, USCIS, dates) and is
  priced for a small firm. Risk: any of them can add this. The defence is focus, a tested library for
  every case type, connections to immigration software and outcome data that grows with use.

## Pricing (Ismael decided 2026-11-12: one fixed monthly fee, unlimited use, no per case fee)

* Buyer: the firm, never an individual inside it. Lincoln uses the firm's email, case software and
  client data, so only the firm can authorise it and sign the data agreement. A solo lawyer is the
  firm. (Ismael, from the Legora interview: selling to lawyers one by one does not work in legal.)
* One fixed monthly fee, unlimited cases and unlimited use. No per case fee: charging for each case
  feels like paying extra for Lincoln doing its job.
* The fee is per user (Ismael, 2026-11-12): everyone at the firm who uses Lincoln pays, lawyer or
  not. Working figure $299 per user a month (untested).
* Margin target (Ismael): at least 70 percent. Estimate, not measured: one O-1 case like Halasz
  (52 pages) through four passes on Claude Opus 5.5 ($4 input, $20 output per million tokens, cache
  reads $0.20) is roughly $5 of model cost; a whole case life (uploads, chasing, RFE, status checks on
  Claude Haiku 5.5) roughly $10 to $25. At $299 per user, 70 percent margin holds while the cases
  each user works on cost under about $90 a month, so about 4 to 9 cases a month per user at those
  estimates, more if the real cost is lower. Cases per user per month is unknown. Measure real token use on the Halasz
  demo; if heavy users break the margin, raise the price or add a fair use limit, not a per case fee.
* Gross margin is not profit: salaries, security audits and sales come out after it.

### Adding users (proposed 2026-11-12)
* The person who signs the firm up does it with their work Microsoft or Google account (most firms
  run on one of the two). Lincoln then offers to invite colleagues on the same firm email domain; they
  join in one click with their own work account, and the admin approves each one.
* Invite by email as the fallback for anyone without a work Microsoft or Google account.
* Larger firms: single sign on (Okta, Microsoft Entra) and automatic adding and removing of users,
  so a leaver loses access the day they leave.
* Billing follows users: adding someone adds a seat for the rest of the month, removing them stops it.
* Every person has their own login, role (admin, lawyer, paralegal, assistant) and two step login.
  No shared logins: the record of who opened what only works per person, and firms need that record.

## Peak version if funded now (proposed 2026-11-12, Ismael asked to assume the money exists today)

Purpose sharpened: Lincoln becomes the immigration firm's case software itself (where every case,
client, document, form, date and invoice lives) with the autopilot built in, instead of a layer on
top of Docketwise, LollyLaw or Clio. Owning the system of record is what stops it being a wrapper and
stops the case software companies from cutting it off. Firms switch by importing from their current
software automatically. Drafting quality is not the point; everything around it is.

Timeline assuming about $1.5M raised now (guesses):
* Months 0 to 3: two or three engineers (one strong on security), a paid immigration lawyer adviser,
  the engine and library entries for O-1, EB-1A, NIW and H-1B, the security basics, the demo.
* Months 3 to 6: five to ten firms using it on real cases under a signed data agreement, measuring
  time saved per case and errors against the lawyer's corrections. Start SOC 2.
* Months 6 to 12: paid launch. One salesperson from legal software answering inbound demo requests,
  Google search ads on what firms search for, LinkedIn ads by job title, the AILA annual conference.
  One time import from Docketwise and LollyLaw for firms switching. Family cases next.
* Months 12 to 24: most case types, SOC 2 report, outcome data, client portal; aim at the revenue a
  Series A needs (often quoted at $1M a year or more, higher for AI companies).

Hard maths: small firms mean small contracts (three users at $299 is about $10,800 a year), and a
salesperson costs far more than that per year, so sales must come mostly from search, ads,
the conference and referrals, with salespeople handling firms that ask for a demo. Firms of 5 to 25
users are worth targeting first. About 450 users (for example 90 firms of 5) is the revenue level
behind the goal.

## Positioning against Harvey and Legora (draft 2026-11-12; every line must be true before use)

One line: Harvey and Legora help lawyers with legal work across every practice area. Lincoln runs
immigration cases.

The contrast, all checkable:
* Built for: Harvey and Legora for large firms and in house legal teams, across every practice area.
  Lincoln only for US immigration firms, which are mostly solos and firms of 2 to 5 lawyers (about 35
  and 26 percent of AILA members, 2026 media kit).
* How it works: Harvey and Legora mostly work when asked (assistant, document review, workflows;
  their October 2026 "Intake" products route in house requests). Lincoln starts when a case is
  assigned and runs it: clients, referees, translations, forms, USCIS, dates.
* Where the hours go: in an immigration case most hours are chasing documents and people, forms and
  deadlines, mostly paralegal work. General legal AI helps with the writing; Lincoln takes the rest.
* Price and buying: Harvey reportedly needs about 20 seats at about $1,200 a seat a month (unofficial,
  not published); Legora reportedly a 10 seat minimum. Lincoln: one monthly fee per user, no minimum,
  sign up without a sales process.

For firms (what they get): cases that move without anyone chasing; no missed dates; drafts that
cite every page so review takes minutes; a price a three person firm can pay; built only for
immigration.

For VCs: Harvey and Legora are moving up market (big firms, in house teams). Thousands of small
immigration firms are left with general tools or drafting add ons. Lincoln owns the case (it is the
firm's case software with the work built in), which general tools do not, and the same model already
worked for small personal injury firms (EvenUp, Eve). Why now: AI can act over weeks and the cost per
case is a few dollars.

For content: show, do not compare. A made up case running from signed client to filed petition. Do
not name competitors in public posts; say "general legal AI" if needed.

Never say until true: better writing than Harvey or Legora; "review in minutes" before it is
measured; any security certificate; any number of firms, cases or approvals.
Where Harvey and Legora are ahead today, and how Lincoln closes it: security certificates (SOC 2
after the first raise; Type II needs months of observed operation), money (they started small too:
Harvey $5M seed in 2022, Legora about $10.5M), brand (built later), and paid legal databases (Harvey
works with LexisNexis; CoCounsel is Thomson Reuters). Immigration law is mostly public (INA, 8 CFR,
USCIS Policy Manual, AAO and BIA decisions), so the database gap is small now and matters when
expanding into litigation heavy areas.

## Importing from other software (Ismael decided 2026-11-12)
Docketwise lives inside Lincoln, never Lincoln inside Docketwise. Importing is a switching tool in
setup and settings, not a connector on the main screens (like the optional CRM step in old Hopkins).
Sources: Docketwise through its API (access granted on request, so it can be refused or withdrawn),
plus LollyLaw, INSZoom, eImmigration and Clio through their exports or a CSV, and plain folders of
documents. Optional: keep the old system in sync for a few weeks so a firm can move case by case.
Proposed switch plan (from how Clio does it): Lincoln does the migration for the firm, documents
included; new cases start in Lincoln while old ones finish where they are; months free to cover the
firm's remaining contract with its old vendor; a person runs onboarding and training.

## Working together on a case (proposed 2026-11-12)

How others do it (their own pages): Harvey "Shared Spaces" (March 2026) share Vaults, workflows and
work product with colleagues, clients and outside counsel, with guest accounts, scoped permissions
and a log of every access. Legora shares projects with teammates (documents and tabular reviews;
chat threads stay private), lets several people work in one tabular review (mark as reviewed, lock
cells), and "Portal" gives clients a branded workspace with no licence and per item permissions.
Docketwise and LollyLaw have tasks, messaging and client questionnaires.

For Lincoln the unit is the case, not a project or a chat:
* Everyone assigned to a case sees the same case: documents, drafts, what is waiting on whom, what
  Lincoln did. Sensitive cases (asylum, VAWA, U and T visas) can be locked to named people.
* Lincoln assigns each review step to the right person (paralegal checks documents, lawyer approves
  the letter) and shows who owns what.
* Comments and mentions on a draft, a page or an exhibit; edits in Word with tracked changes, since
  lawyers finish in Word. No own document editor.
* A case chat with Lincoln that the case team can see, plus private chats for anything else.
* A secure, firm branded upload and signing page for clients and referees, opened from a link with a
  check code, no account and no fee. Safer than passports as email attachments.
* Not now: Harvey style shared spaces with outside counsel or company legal teams (big firm work).

## How to explain Lincoln to a lawyer (draft 2026-11-12; only say it once every line is true)

**What it is.** Lincoln runs your immigration cases from the day the client signs to the day USCIS
decides. You review and sign. Lincoln does the rest.

**What happens on a case.** You open the case. Lincoln emails your client, in their language and in
your firm's name, with a checklist for their case type, reads every document as it comes in and tells
them straight away what is missing or unusable. It drafts the referee letters, sends them out to edit
and sign, and follows up until they are back. It arranges translations. It checks the evidence against
the rules for that case type and tells you what it would claim, what it left out and why. It drafts the
forms, the letter, the exhibit index and a list of risks, as Word files. You review, change what you
want, and approve. After filing it watches USCIS, and the day an RFE arrives you already have a draft
response and the client already has a list of what is needed. It watches every date on every case.

**Why you would care.** Your time goes on the legal judgement, not on chasing people and assembling
paper. Nothing slips because a date was missed. You can take on more cases without hiring.

**Why you can trust it.**
* Nothing goes out in your name without your approval or rules you set.
* Every fact in a draft cites the page it came from, so you can check any line in seconds.
* It shows what it left out and why: a paid award, an unsigned draft letter, a figure that conflicts
  with a dated document.
* Before we say Lincoln handles a case type, it has passed a blind test against an answer key, and
  the results are published.
* Your data is walled off from every other firm, encrypted, never used for training, and deleted
  when you say.
* It is not a lawyer and never says it is. You are the lawyer.

**Price.** One monthly fee per person using Lincoln, unlimited cases.

**Must be true before any of this is said:** the product built and working; each case type that is
named passed its blind test; the security measures actually in place; a written data agreement the
firm can sign.

## Not decided

* Price figures (structure proposed above).
* How firms find Lincoln without cold outreach, calls or personal content. The biggest open problem.
* Which parent or guardian owns the company; which immigration lawyer advises.
* Model provider and data agreements.
* First step: a demo on the made up Halasz case with fake email and a fake USCIS feed (proposed,
  waiting for a yes).
