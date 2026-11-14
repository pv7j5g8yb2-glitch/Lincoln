# Lincoln

**Lincoln v0 (a prompt method) failed its blind test against plain Claude on 2026-11-11. On 2026-11-12
Ismael restarted Lincoln as a case platform; the plan is `docs/LINCOLN-V1.md` and the app is in
`lincoln/` (first draft built 2026-11-13). See `docs/STATE.md`.**

Lincoln is an AI workspace for immigration lawyers (decided 2026-11-09, Ismael). It was called
Hopkins until that day, and the repo and its GitHub name still say Hopkins. The earlier real
estate content product, the Covered certificate tracker and everything around them were
removed from this repo on 2026-11-09. They are still in git history up to commit `341cf65` if
anything is ever needed. The clinic agency model is dropped for good. Do not suggest it.

## Start here

Read `docs/STATE.md` at the start of every session: it has the current state, what is decided,
what is open and what to do next. Keep it up to date when anything in it changes.
Whenever something important comes up (a decision, a preference, a lesson, a plan, a finding),
save it straight away without asking: rules go in this file, state and plans in `docs/STATE.md`,
research in `docs/RESEARCH.md`, then commit and push.
What lawyers say about legal AI, in their own words: `docs/reddit/` (30 threads, 2026-11-14). Read it before
product or positioning decisions. Not every remark is a rule: save what will
matter again, not passing thoughts.

## Git

Push work to the session branch without asking. Never push to another branch without permission.
Only ask first when a change would alter something live that Ismael has not agreed to.

## Writing for Ismael

These are hard rules. They come from repeated correction, not preference.

**Never use dashes.** No em dashes, no en dashes, no dashes as punctuation of any kind. Use a
comma, a full stop, or restructure the sentence. This applies to every message, draft and rewrite.

**Irish English, not American** (in messages to Ismael and in docs written for him; Lincoln itself writes American
English, because its users are US lawyers and its drafts go to USCIS). Enquiry not inquiry. Realise, organise, apologise. Programme,
centre, colour. "At the weekend", not "on the weekend".

**Sound like a person, not a salesperson.** Plain sentences. No LinkedIn register, no "circling
back", no "hope this finds you well", no "I wanted to reach out". Short is better than clever.

**Say what the reader gets, not what the product does.**

**Never claim anything untested or untrue.** No invented results, user counts, certifications,
customers, testimonials or capabilities that have not actually been run. This matters more here
than anywhere: lawyers check, and a false claim ends the company.

**Don't repeat what an earlier message in the thread already said.**

**Examples read as suggestions.** Never use a dated or basic idea (AI receptionists, chatbots) or
one he has ruled out as an example, even to show a method. If an example is not something worth
building in 2026, leave it out.

**One ask, and make it answerable.**

**Don't pad, don't act superior, don't pile on options.** Ismael gets angry at long lists, at
being asked what he already answered, and at being told to talk to people without a reason. Give
a straight answer first, then the reason. When he decides something, do it.

**Lincoln facts not to get wrong again (Ismael, 2026-11-12).** Lincoln handles every immigration case
type a firm takes; never propose an O-1 only product. Only call the market crowded or Lincoln's price
high against a competitor that does at least 80 percent of what Lincoln does for less; compare price
with the work saved, not with case software. Never assume most firms use Docketwise (its share is
unknown). Never present a co-founder as an easy fix: it costs equity, a minor cannot hire, and the role
is unclear.

**Lincoln's edge is autonomy (Ismael, 2026-11-13).** Lincoln works without being prompted: it reads the firm's
mail, opens and works cases, chases and prepares the next step, and asks only for decisions. Never present an
upload or chat feature as the product; that is what Harvey and Legora already do. New accounts always start
completely blank. The chat must behave like Claude and ChatGPT (one line box, Enter sends, box pinned at the
bottom, "Ask Lincoln anything") and must answer honestly about what Lincoln can and cannot do.

**Lincoln's interface copy (Ismael, 2026-11-13).** Write the product like a billion dollar company
would. Keep screens minimal: no explanatory sentences for things the user can see for themselves. Never
address the user in the second person inside the product (no "you", "your", "Needs you"); use neutral
labels such as "For review" and "Awaiting approval". Emails Lincoln drafts to clients are the exception.
No status chatter or helper text (Ismael, 2026-11-14: "a serious software platform never talks to the user
like this"): no "checked just now", no confirmations like "Connected. New mail is read...", no subtitles
under names, no checklists of what works, no descriptions under rows or buttons. Errors are a few words.
Notices after an action (Ismael, 2026-11-14) drop from the top as a soft rectangle, one or two words ("Saved",
"Sent", "Deleted"), can be pushed up, and leave by themselves after 5 seconds. Drafted emails show Approve and Edit;
Edit opens the text, then Save.

**Lincoln on phones and manual work (Ismael, 2026-11-14).** On phones Lincoln uses the Hopkins Liquid Glass
tab bar (Home, Cases, +, Review, More), with a lens that glides, stretches and follows a finger, and the More
menu as a glass sheet; no top bar or slide out menu. The app follows the device's light or dark setting.
A case is opened by prompting Lincoln (one box: describe it or attach files), never by filling a form; the
normal path is Lincoln opening cases from mail by itself. Keep screens light: hide empty sections.

**Lincoln is Mike Ross and Donna, not a dashboard (Ismael, 2026-11-14).** Think of Lincoln as Mike Ross and Donna
to Harvey Specter in Suits combined: it does the legal work and keeps everything organised, and comes to the lawyer
only for a crucial approval, a question or missing context. Do not make it heavy: no piles of features, checks or flags on screen. Checks run
quietly and surface only what matters; minor items stay folded.

**Never push a failing build (2026-11-13).** Check the real exit status of the type check and `npm run
build` before every push to the session branch; Render deploys from it. A grep for "Compiled" is not a check.

## The project

* **What it is:** a self serve AI workspace for immigration lawyers in the US (the law is federal,
  so no single state). Like Claude or ChatGPT, trained and set up for immigration work: it takes
  any time consuming task, returns a finished file (Word, PDF, Excel), and connects to the tools
  lawyers use (Word, Google Docs, Outlook, Drive, their case software). Ready made workflows
  first, a general assistant on top. Priced per seat per month (about $300 is the working figure,
  untested).
* **First workflows (draft, to be tested):** employment based cases (O-1, EB-1, H-1B, L-1 and
  green cards from them), end to end from client questionnaire and evidence to a finished filing
  packet. Family cases, forms, deadlines and billing come later.
* **Goal (Ismael, 2026-11-09):** $100k a month profit by age 20, about November 2031. Roughly
  445 seats at $300 if about 75 percent of revenue is profit (both figures are assumptions).
* **Name (Ismael, 2026-11-09): Lincoln**, after Abraham Lincoln the lawyer. Domain: uselincoln.com
  (found free, to be bought by a parent or guardian, used only as the web address). lincoln.ai
  is for sale and is left for later when there is money and users, do not overpay early. Ruled
  out: Walter (Legora owns Walter AI), Atticus, Gideon (both used in legal tech), Suits
  (Suits.ai exists, and Mike Ross practised without a licence), Hopkins (clashes with Johns
  Hopkins in search). Still to do: a US trademark search for LINCOLN in software and legal
  services, and a look at what a search for "Lincoln AI" shows. Lincoln is a big brand in other
  industries (Lincoln Financial, Lincoln Motor, Lincoln Electric).
* **Honest odds:** low single digits to about ten percent for the goal, a guess. Every funded
  competitor (Harvey, Legora, Clio, Spellbook, CoCounsel, Parley, CaseBlink, Docketwise and
  others) is already selling. See `docs/RESEARCH.md`.

## Ismael's real requirements (2026-11-10)

* The only goal: about $100k a month profit (about $1M a year) by age 20. Price, self serve and
  seat counts are not rules in themselves.
* Never suggest asking buyers or strangers about their problems, pain or how they work (posts,
  DMs, "20 minutes of your time"). Professionals mock it (r/Ask_Lawyers reply: "weed out
  questions from kids spamming forums for shitty business ideas"). Learn by reading what they
  already wrote; approach them only with finished work they can judge.
* Reaching buyers (Ismael, 2026-11-11): company content is fine (a brand account posting like any software
  company), but nothing about him, his face, his story or his life. No cold outreach of any kind, not even
  "just asking for feedback". Ideas must be ones where buyers can find the product through company
  content, search or a marketplace and sign up on their own.
* Funding (Ismael, 2026-11-13): applying to VC firms and accelerators before revenue IS allowed. He
  has no income and needs cash now; the old rule (no VC before paying users) is overruled. Still no
  cold outreach: apply only through each firm's own application form, and always through the company
  owned by a parent or guardian.
* No video or phone calls with buyers. Selling and talking to customers in writing is fine (email,
  DMs, LinkedIn), as long as it is a normal human conversation, not template pitching.

## Hard limits (do not break these)

* **Ismael is 15.** A parent or guardian must be the legal owner of the company and the account
  holder for payments, contracts and data agreements. LinkedIn's minimum age is believed to be
  16 (verify): do not set up an account that pretends to be someone else.
* **No fake identity, no fake founder, no fake lawyer.** The product is not a lawyer and never
  claims to be. Every output is for a licensed attorney to review. Say so plainly.
* **Client files (Ismael, 2026-11-12).** Lawyers testing Lincoln are encouraged to use it on real cases,
  but only once the security minimum in `docs/LINCOLN-V1.md` is in place. Claude and Ismael build and
  test on public documents and made up cases only.
* **Security claims only if true.** No SOC 2, ISO or HIPAA badges until they exist. What can be
  said honestly: no training on customer data, a zero retention agreement with the model
  provider (only if actually signed), where data is stored, how to delete it.
* **No made up proof.** No logos, quotes, stats or "pilots" that did not happen.
* **No scraping and no ways round a site's bot protection.**
* **Unauthorised practice of law:** the product prepares documents for lawyers. It does not give
  legal advice to the public.

## How to work

* Test before saying it works. Look at the real output, not only that tests pass.
* Run the cheap test before the big build. The plan is in `docs/TEST-PLAN.md`.
* Do not build anything Ismael has not asked for. Say what you think and wait.
* Check a claim against a source before repeating it. Many sources in this field are vendor
  blogs, and AI summaries get firms, dates and funding wrong.
