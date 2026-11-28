# Lincoln v1: the version we build now (2026-11-12)

The single plan for the demo, the free pilot and the first raise. It combines `docs/LINCOLN.md`
(Claude's peak version) with the outside review Ismael pasted on 2026-11-12, keeping only what
matters for the next step. Where this file and `docs/LINCOLN.md` disagree, this file wins.

## What Lincoln is

Lincoln runs immigration cases for US law firms, from signed client to USCIS decision. The lawyer
makes every legal call and signs. Lincoln does the rest, and proves how well it does it.

## The edge (why a firm pays $199 to $299 a user and why a VC funds it)

Doing the work on its own is no longer enough: ICM Desk sells it for $6 to $16 a seat and Filevine
says 2027 is the year of autonomous software. Lincoln wins on these together:

1. **It runs the case.** It notices what each case needs and acts within rules the firm sets.
2. **It goes deep on every case type a firm takes** (Ismael, 2026-11-12: never only O-1, which is far
   too small a market): family, employment, humanitarian, naturalisation, waivers and court work
   preparation. It checks whether each piece of evidence supports each claim and catches
   contradictions.
3. **It shows the time it saves, quietly.** Every action Lincoln completes is multiplied by a
   standard time for that task, set by us, never asked of the firm. The standard times come from
   published research where it exists, then the immigration lawyer adviser's estimates, then Lincoln's
   own measurements once firms use it. Always labelled an estimate. Shown only in a "Lincoln report"
   in the menu, like Apple's Screen Time, plus an optional weekly summary; never in replies.
4. **It connects to the tools the firm already uses** (integrations directory below).

Accuracy (Ismael, 2026-11-12): not a selling badge and never a "this case is inaccurate" label in the
product. Inside the product, Lincoln only shows the lawyer what needs checking. Measured accuracy (how
often facts, citations and flags were right on made up test cases with answer keys) is a release gate
and proof for VCs and for firms that ask. Lawyers do care: courts have sanctioned lawyers for filing
AI invented citations (Mata v. Avianca, S.D.N.Y. 2023, $5,000).

## Onboarding and how Lincoln is proactive (Ismael, 2026-11-12): no questions to answer

1. Sign in with the work Microsoft or Google account and approve one permission screen (mail,
   calendar, files). That single consent is what lets Lincoln watch instead of wait.
2. Lincoln reads recent case related mail and files, or a Docketwise import, and shows the cases it
   found ("14 active cases"). One tap to confirm.
3. From then on it acts on events, not prompts:
   * a new enquiry email: drafts the reply and booking;
   * a signed engagement letter: opens the case, drafts the questionnaire and checklist;
   * documents arriving: reads, files, sends back bad scans, flags conflicts;
   * a referee silent for days: drafts the reminder;
   * a USCIS notice scanned or emailed: sets every date;
   * a Request for Evidence: draft response and client checklist ready the same day;
   * every morning: the report of what moved, what is stuck and what needs a person.
4. Safe defaults: nothing legal and nothing to a client or referee goes out without approval. After
   a user approves the same kind of message a few times, Lincoln offers once to send those
   automatically. Every rule can be changed later in settings; nobody has to set anything to start.

The chat box exists for questions, but Lincoln's core work never needs a prompt.
Note: reading Gmail at scale needs Google's security assessment and Outlook needs Microsoft
verification; a small pilot can run before that.

## Who works on what (proposed 2026-11-12)

Lincoln builds each person's "My work" on its own, from signals it already has:
* who the case is assigned to in Lincoln, and who is attorney of record on the G-28;
* whose inbox the client, referees and USCIS write to, and who is copied;
* whose calendar has the consultation or interview;
* who opened, edited or approved the case's work most recently.
When the signals disagree, it asks once ("Is this Maria's case?") with one tap. Each person sees only
their cases and their next actions; the managing attorney sees everyone's.

## Approvals: few, and fast to review (proposed 2026-11-12)

Only these ever need a person: anything signed, filed or sent to USCIS, a court or a consulate; legal
strategy and eligibility conclusions; anything that is legal advice to a client; fee agreements;
responses to RFEs and notices; conflicts Lincoln could not resolve. Everything else runs on its own:
reminders, document requests, filing mail, scheduling, status updates from approved wording, forms
filled from approved facts.

Notifications: approvals collect in one queue with a daily summary; a phone notification only when a
deadline is close.

Review in minutes, not a re-read:
* **Decide, don't proofread.** Before writing a long letter, Lincoln turns every judgement into a short
  question with the evidence attached ("Claim the Protein Innovators Prize under awards? 612
  nominations from 41 countries, panel of 12. Yes, no or change"). The lawyer answers the questions;
  Lincoln writes from the answers, so the finished letter holds no unseen judgement calls.
* **Colour by risk.** Facts checked against their source page are green, arguments and judgement are
  amber, conflicts and missing evidence are red. The lawyer reads amber and red; green is checked by a
  second, separate pass.
* **Source in place.** Hovering a fact shows the cropped piece of the page it came from. No opening
  PDFs.
* **Only what changed.** For repeat documents, Lincoln shows only the differences from the last
  approved version or the firm's template.
* **One screen first.** Every approval opens on a brief: the decision in one sentence, what Lincoln is
  least sure of, and what happens if it is wrong.
The attorney still owns the result (ABA Formal Opinion 512); the aim is less reading, not less care.

## Integrations directory (Ismael, 2026-11-12)

A directory page inside Lincoln, like Harvey's connector library (Harvey lists Word and Outlook
add ins, iManage, NetDocuments, SharePoint, Google Drive, Gmail, Box and others). Each integration is
marked by effort:
* **Now (standard connection, no outside review):** Google Drive, OneDrive and SharePoint, Dropbox,
  Box, Slack, Microsoft Teams, Google and Outlook calendars, DocuSign or Dropbox Sign, Zoom.
* **Needs an outside review first:** Gmail and Outlook mail (Google's security assessment, Microsoft
  publisher verification), a Word add in listed in Microsoft's store (a firm admin can install it
  directly before that).
* **Switching tools:** imports from Docketwise (API on request), LollyLaw, INSZoom, eImmigration, Clio.
* **Later:** payments (LawPay, Stripe), QuickBooks, iManage and NetDocuments (bigger firms), USCIS case
  status API (registration and approval), a Zapier app to reach thousands of tools at once.

## Taken from the outside review, and why

* **A map of each case.** Every fact is stored with its source page, date, who confirmed it and any
  conflict. Conflicts become issues for a person to resolve; Lincoln never picks one silently.
  Why: this is what makes drafts checkable and review fast.
* **Evidence graded in five steps:** exists, relevant, supports the fact, enough for the legal
  standard, approved by the attorney. Why: "a document mentions it" is not "it proves it".
* **Hard rules in code, not in the AI:** deadline maths, permissions, approvals, nothing sent or filed
  without the required approval. Why: these can never depend on a model behaving.
* **Emails and documents are untrusted.** Text inside an upload or an email can never change
  Lincoln's rules or permissions. Why: Lincoln reads strangers' documents all day.
* **Never drops a task silently.** If it cannot finish something it says why, shows what it tried and
  hands it to a person.
* **Error rate, not acceptance rate.** A lawyer accepting a draft does not prove it was right.
  Material errors are counted separately from style edits.
* **Filing readiness check** before any packet is marked complete: forms, editions, signatures,
  exhibits, translations, fees, consistent personal details. It never says a case will succeed.
* **The morning report ("no case stalls"):** every case, why it is waiting, what Lincoln already
  did, what needs a person today.
* **The right models for each job:** the strongest model for legal reasoning and drafting, a cheap one
  for sorting and reminders. Keeps the cost per case low.
* **First customers:** immigration firms of about 3 to 30 people, whatever mix of cases they take.

## Kept from Claude's version, and why

* **Lincoln is its own platform** (Ismael's decision), with imports from other software inside
  Lincoln and an optional sync during a switch. Not a layer on Docketwise.
* **Three approval levels** (routine on firm rules, messages in batches, legal judgement and filing
  with full attorney review), shown as one card per decision.
* **Word in, Word out.** Lawyers finish in Word, so no own document editor.
* **One price per user a month, unlimited use** (Ismael's decision), with a fair use limit only if
  real usage breaks the 70 percent margin.

## Left out for now, and why

* **"The AI operating system for law firms":** that is Clio's pitch. Lincoln says what it does.
* **Billing, client money accounts, profitability and capacity forecasting:** regulated or heavy,
  and not what proves the product. Later.
* **Learning across firms:** needs contracts and consent. Later; learning within a firm comes first.
* **Watching every USCIS policy change:** later. Form editions and fees are checked from day one.
* **Approval odds or "chance of success":** never.
* **Three pricing tiers, enterprise options, extra channels, other practice areas:** after the raise.
* **Sitting with firms to observe them:** against Ismael's rules. Lawyers judge finished work instead.

## Build order for the demo (built and tested on made up cases)

The engine (inbox, intake, chasing, documents, dates, USCIS, drafts, approvals) works for every case
type from the start. Each case type also needs its own entry (forms, evidence, rules, deadlines from
USCIS form instructions, the regulations and the Policy Manual), written for all the common types
before any firm uses it. The demo video follows one case from start to finish because a video needs
one story, not because Lincoln only does one kind of case.


1. **Case and evidence core.** Load the Halasz bundle (52 pages, scans, spreadsheet): document list,
   facts with source pages, conflicts as issues, evidence graded against each O-1A criterion, filing
   requirements checked. Scored against the existing answer key.
2. **Drafts.** Support letter, criteria map, exhibit index, risks list as Word files, every fact
   linked to its page, judgement calls marked. Filing readiness report.
3. **The case running on its own.** A fake client inbox, fake referees and a fake USCIS feed: Lincoln
   asks for missing documents, sends back bad scans, drafts referee letters, chases until "signed",
   reacts to a Request for Evidence with a draft response the same day. Approval cards, the morning
   report and a full record of every action.
4. **The numbers.** Run Varga and Halasz plus one new made up case through Lincoln and through plain
   Claude, judged blind as before: error rate by type, time, and AI cost per case.
5. **Ready for one lawyer to try.** Logins, roles, each firm's data separate and encrypted, the
   action record, the integrations marked "Now", and the security minimum below. The lawyer uses
   Lincoln on real cases and gives written feedback.

Real cases (Ismael, 2026-11-12): the trial lawyer is encouraged to use Lincoln on real cases, once
this security minimum is in place:
* Each firm's data separated in the database itself, so one account can never read another's.
* Encryption in transit and at rest, with a separate key per firm; two step login; roles.
* A record of who opened, changed or sent what; no client data in logs or error reports.
* The AI provider on commercial terms with no training on the data; zero retention applied for.
* Real deletion and export; encrypted backups; a written plan for a breach.
* An outside security review of the code before the first real case (a one off freelancer).
* Terms, a privacy policy and a data agreement the firm signs, from the parent's company.

Needs: an Anthropic API key on the parent's account (a few dollars per test case).

## What goes to a VC after that

A short video of a made up case running end to end; the blind test results and error rates; the
cost per case; the lawyer's written feedback (real, with permission); the market facts in
`docs/RESEARCH.md`; the plan for the money. Ismael's rule still applies: no VC before revenue, unless
he changes it.
