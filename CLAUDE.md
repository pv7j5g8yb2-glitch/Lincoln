# Lincoln

**Lincoln v0 (a prompt method) failed its blind test against plain Claude on 2026-11-11. On 2026-11-12
Ismael restarted Lincoln as a case platform; the plan is `docs/LINCOLN-V1.md` and the app is in
`lincoln/` (first draft built 2026-11-13). See `docs/STATE.md`.**

Lincoln is an AI workspace for immigration lawyers (decided 2026-11-09, Ismael). It was called
Hopkins until that day, and the repo and its GitHub name still say Hopkins. The earlier real
estate content product, the Covered certificate tracker and everything around them were
removed from this repo on 2026-11-09. They are still in git history up to commit `341cf65` if
anything is ever needed. The clinic agency model is dropped for good. Do not suggest it.

## The rule above all (Ismael, 2026-11-17, word for word)

**Lincoln needs to be fully designed and positioned as a billion dollar startup.**

Every screen, word, video and decision is held to that. Work as a team of elite web designers, elite web developers,
genius marketers and positioners, and elite software engineers would.

## Start here

Read `docs/STATE.md` at the start of every session: it has the current state, what is decided,
what is open and what to do next. Keep it up to date when anything in it changes.
Whenever something important comes up (a decision, a preference, a lesson, a plan, a finding),
save it straight away without asking: rules go in this file, state and plans in `docs/STATE.md`,
research in `docs/RESEARCH.md`, people to hire or remember in `docs/PEOPLE.md`, then commit and push.
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

**Immigration is the start, not the limit (Ismael, 2026-11-20).** Immigration is Lincoln's focus for roughly the next
6 to 12 months; after that Lincoln expands across several practice areas and keeps growing. Never describe Lincoln as an
immigration only company or immigration as its permanent niche; build so new practice areas can be added.

**Lincoln's edge is autonomy (Ismael, 2026-11-13).** Lincoln works without being prompted: it reads the firm's
mail, opens and works cases, chases and prepares the next step, and asks only for decisions. Never present an
upload or chat feature as the product; that is what Harvey and Legora already do. New accounts always start
completely blank. The chat must behave like Claude and ChatGPT (one line box, Enter sends, box pinned at the
bottom, "Ask Lincoln anything") and must answer honestly about what Lincoln can and cannot do. Like Claude (Ismael, 2026-11-15): separate chats with a
title top left (tap for the list of chats and New chat) and ••• top right (Rename, Delete); replies formatted in
Markdown (short paragraphs, bold for what matters, numbered steps, bullet lists, tables when comparing, headings
only for long answers); copy under every message, edit under the user's; an arrow to jump to the latest; large
readable type (16 to 16.5px, line height 1.7).

**Lincoln's interface copy (Ismael, 2026-11-13).** Write the product like a billion dollar company
would. Keep screens minimal: no explanatory sentences for things the user can see for themselves. Never
address the user in the second person inside the product (no "you", "your", "Needs you"); use neutral
labels such as "For review" and "Awaiting approval". Emails Lincoln drafts to clients are the exception.
No status chatter or helper text (Ismael, 2026-11-14: "a serious software platform never talks to the user
like this"): no "checked just now", no confirmations like "Connected. New mail is read...", no subtitles
under names, no checklists of what works, no descriptions under rows or buttons. Errors are a few words.
Notices after an action (Ismael, 2026-11-14) drop from the top as a soft rectangle, one or two words ("Saved",
"Sent", "Deleted"), can be pushed up, and leave by themselves after 5 seconds. Approve and send is the exception (Ismael, 2026-11-18): the button itself turns (a white circle in the black button), then reads "Sent!", then the next item comes up. Drafted emails show Approve and Edit;
Edit opens the text, then Save.

**Same thing, same look, same place (Ismael, 2026-11-26).** Lincoln never freestyles a detail: anything that is the
same kind of thing looks and sits the same everywhere. A card's Disconnect is always top right of the card; buttons use
`btn.primary`, `btn.secondary` and `btn.ghost`, search boxes use `search`, fields use `field` (all in
`lincoln/src/components/ui.tsx`); never a hand made copy at another size. Every chat or text box for Lincoln is pinned
to the bottom of the screen like Claude and ChatGPT (above the tab bar on phones), never placed after the content.
Every page's column is centred: forms, questionnaires, intake links, chat threads, case pages, settings. Before
adding anything, find the existing pattern and copy it.

**Notifications (Ismael, 2026-11-15).** Lincoln asks with the system's own permission box only, never a box of its own first (it comes up on the first tap, as phones require), works on iPhone, Android and computers, and sends them only when the person has
left the app: work that lands in Review (batched) and chat replies finished in the background, like Claude. Chat replies
always run to the end on the server, even when the app is closed. Every notification has a short title and one line.

**Branding and marketing words (Ismael, 2026-11-16).** Everything public facing (site, video, captions, names of
features, posts) uses the words a billion dollar software company would use. Always treat Lincoln as
already a billion dollar legal tech company, in every decision, not only wording. Before naming or writing anything,
ask how the best companies would do it, Claude, ChatGPT, Harvey and Legora above all since they are closest, and
match that bar. Lincoln is always "Lincoln", never "it".
Extremely clean and visually appealing: no subheadline under every heading, nothing that is not needed.

**Pitch decks (Ismael, 2026-11-28).** Like real seed decks (Harvey, Legora): plain section titles (Founder, Problem,
Product, Traction, Competition, Pricing, the raise), a few words per slide, screenshots and numbers. Never taglines,
dramatic one liners, or "line, comma, line" punchlines; anything that reads AI written is rejected.

**Landing page (Ismael, 2026-11-16).** It must be creative with a real wow factor, more expressive than the minimal app,
and must not look like the typical AI built site (animated product demo hero, gradients, glass cards, bento grids); he
rejected "Lincoln working a case live" as a hero for that reason. On 2026-11-16 he rejected a dark page with a 3D ray marched L as "AI slop" and "horror":
the direction is now clean and minimal (the app's own colours, large serif type, quiet motion). Framer is connected
(his free workspace) and is an option for building and hosting it.

**Particle effects (Ismael, 2026-11-25).** Any particle effect on Lincoln's pages moves only when the cursor or finger is on
the shape itself, never from a touch elsewhere on the page or from scrolling, and is always gently moving on its own
without looking awkward.

**The bar is the game changer (Ismael, 2026-11-16).** Judge Lincoln against being the complete, game changing
platform for immigration firms, never against "a first version" or an MVP. Build only what a firm will find genuinely
valuable and convenient, keep the app simple and minimal, and let details appear only when needed or when the user
asks for them (folded, on tap, on hover).

**Integrations only if self serve, for now (Ismael, 2026-11-16).** Not yet, rather than never: until Lincoln is ready to
pursue partnerships, do not list, plan or build an integration that needs an official partnership, a partner programme,
an application or demo, or contacting the company for API access (removed for this:
Docketwise, LollyLaw, INSZoom, eImmigration, iManage, NetDocuments, USCIS case status). Only services where Lincoln can
register its own app or the firm can connect its own account. Importing a firm's own export is fine.

**Confirm important actions (Ismael, 2026-11-16).** Every important or hard to undo action asks first with one small
box: "Are you sure?", Yes (black in light mode, white in dark) and an always red No, nothing else. Sensitive changes
(giving or removing admin, inviting an admin, the Word add-in code, turning off the firm's two step rule) also ask for
the account password in the same box, always: an account without a password (signed up with Google or Microsoft)
is refused until it sets one. Component: `lincoln/src/components/Confirm.tsx`.

**Lincoln on phones and manual work (Ismael, 2026-11-14).** On phones Lincoln uses the Hopkins Liquid Glass
tab bar (Home, Cases, +, Review, More), with a lens that glides, stretches and follows a finger, and the More
menu as a glass sheet; no top bar or slide out menu. The app follows the device's light or dark setting.
A case is opened by prompting Lincoln (one box: describe it or attach files), never by filling a form; the
normal path is Lincoln opening cases from mail by itself. Keep screens light: hide empty sections.

**Lincoln is Mike Ross and Donna, not a dashboard (Ismael, 2026-11-14).** Think of Lincoln as Mike Ross and Donna
to Harvey Specter in Suits combined: it does the legal work and keeps everything organised, and comes to the lawyer
only for a crucial approval, a question or missing context. Do not make it heavy: no piles of features, checks or flags on screen. Checks run
quietly and surface only what matters; minor items stay folded.

**Emails Lincoln drafts (Ismael, 2026-11-14).** Every email reads as if the attorney or paralegal wrote it: professional,
warm, brief, human, following the thread and the case. Never "reply yes", stock phrases, internal labels, page
numbers, dashes or anything that sounds robotic or confusing. The rules live in `lincoln/src/lib/style.ts`; every
email prompt uses them. Lincoln is AI but acts as a human P.A.

**Lincoln writes like a lawyer (Ismael, 2026-11-24).** Everything Lincoln writes reads as an experienced immigration
attorney or paralegal would write it, and important legal work (filings, letters, declarations, RFE responses, memos,
case notes) meets the formal standard the law and USCIS expect. It is a hybrid, never a ban on symbols: official text
is kept exactly as its source writes it, "&" and every other character included (the INA, the CFR, forms and their
instructions, USCIS and State Department names and visa classes such as "Business & Pleasure", I&N Dec., registered
names such as Johnson & Johnson), and so is anything a form or the law requires a field to say. Lincoln's own
sentences write "and", never "&", with no contractions, shorthand, slang or emoji. Never rewrite official text to
match a style rule. Client emails may be warmer but stay professional. Lincoln is an
autonomous paralegal and lawyer, so these small details are the job. The rules are `LEGAL_STYLE` and `EMAIL_STYLE` in
`lincoln/src/lib/style.ts`; `formal()` there is the last guard on every draft and email.

**Anthropic credits need approval every time (Ismael, 2026-11-14).** The API key has $20 of credits that must also
cover free testers. Before any call that spends them (live tests, model comparisons, anything run with a real key),
say what it is and the estimated cost, end the message asking for approval, and spend nothing until he says yes.
Stand in model tests cost nothing and need no approval.

**Cheap check first, never hours of silence (Ismael, 2026-11-15).** Before any long or costly live test, run the
smallest real model check first (Haiku, a short file, a few cents, a few minutes) to catch what breaks. If a test
breaks or runs past about 30 minutes, stop and tell him, rather than fixing and rerunning in silence.

**Test the public site as uselincoln.com (2026-11-18).** `src/proxy.ts` sends every path on uselincoln.com that is not a page or a listed file type to app.uselincoln.com. A new kind of file on the landing page (video, sound) must be added to its matcher, and checks of the landing page run with the header `x-forwarded-host: uselincoln.com`, or they miss this: the film failed on the live site for this reason while every local test passed.

**No model bias (Ismael, 2026-11-19).** When choosing or comparing AI models for Lincoln, always weigh every provider (OpenAI, Google, Muse, Mistral, xAI, DeepSeek and others), never favour Anthropic because Claude is doing the work. Judge on quality for the task, cost per case, and data terms a law firm can accept (no training, zero retention, where data is processed). Decide by testing on Lincoln's own graded cases, not by public charts alone.

**Never push a failing build (2026-11-13).** Check the real exit status of the type check and `npm run
build` before every push to the session branch; Render deploys from it. A grep for "Compiled" is not a check.

## The project

* **What it is:** a self serve AI workspace for immigration lawyers in the US (the law is federal,
  so no single state). Like Claude or ChatGPT, trained and set up for immigration work: it takes
  any time consuming task, returns a finished file (Word, PDF, Excel), and connects to the tools
  lawyers use (Word, Google Docs, Outlook, Drive, their case software). Ready made workflows
  first, a general assistant on top. Pricing (Ismael, 2026-11-24): no public price; each firm gets a quote by email
  from its Get In Touch answers (new cases a month above all, then users), later on demo calls once there is a sales
  rep (Jim or another). Unlimited users. Internal guide, untested, by the form's "New cases a month" answer: Under 10 $1,500,
  10 to 50 $3,500, 51 to 100 $7,500, 101 to 200 $13,000, 200+ about $65 a case quoted; 25 percent less only when
  every case type ticked is forms work (Naturalization and citizenship, DACA and TPS, Students and exchange visitors,
  Visitors and consular processing); one other type ticked means full price. Users, email provider and case
  software do not change the price. The old $300 a seat figure is dropped (seats charge less as Lincoln does more of
  the work). Ismael sends each new firm's answers; Claude writes the quote email.
* **First workflows (draft, to be tested):** employment based cases (O-1, EB-1, H-1B, L-1 and
  green cards from them), end to end from client questionnaire and evidence to a finished filing
  packet. Family cases, forms, deadlines and billing come later.
* **Goal (Ismael, 2026-11-16): venture scale.** He dropped the $100k a month goal as too small now that he is raising money; VCs will not back a $100k MRR outcome. No new number given yet. Old goal (2026-11-09): $100k a month profit by age 20, about November 2031.
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

* The goal is now venture scale (2026-11-16, see Goal above). Price, self serve and seat counts are not rules in themselves.
* Never suggest asking buyers or strangers about their problems, pain or how they work (posts,
  DMs, "20 minutes of your time"). Professionals mock it (r/Ask_Lawyers reply: "weed out
  questions from kids spamming forums for shitty business ideas"). Learn by reading what they
  already wrote; approach them only with finished work they can judge.
* Reaching buyers (Ismael, 2026-11-11): company content is fine (a brand account posting like any software
  company), but nothing about him, his face, his story or his life. No cold outreach of any kind, not even
  "just asking for feedback". Ideas must be ones where buyers can find the product through company
  content, search or a marketplace and sign up on their own.
* Investor outreach (Ismael, 2026-11-16): messaging investors directly (LinkedIn DMs, email) is allowed; the no cold outreach rule does not cover investors. Do not treat his passing remarks as permanent rules.
* Funding (Ismael, 2026-11-13): applying to VC firms and accelerators before revenue IS allowed. He
  has no income and needs cash now; the old rule (no VC before paying users) is overruled. Apply through each firm's form or message
  investors directly (see Investor outreach), always through the company owned by a parent or guardian.
* How firms buy (Ismael, 2026-11-16): not self serve and not demo calls for now. Every Get In Touch button on (renamed from Get started on 2026-11-19; the landing page has no Sign in button)
  uselincoln.com opens a form (/start) with the questions needed for a quote; a person replies by email with the quote
  and instructions. Demo calls only later, once there are experienced sales reps. Sign in stays for active users.
  No public sign up (Ismael, 2026-11-16): Lincoln sets up each firm from /ops (staff emails in LINCOLN_OPS_EMAILS)
  with an admin invite for the person who contacted us. That admin invites everyone else, sets their roles and
  decides who else is admin. Admin is a permission, not a job title; a firm always keeps one admin.
* Sales rep (Ismael, 2026-11-24): once Lincoln has a sales rep (Jim or another), the rep reaches out to firms and runs
  demo calls; Ismael still does no outreach or calls with buyers himself. Every firm, inbound or from the rep, goes
  through the same Get In Touch answers so it gets a consistent quote.
* No video or phone calls with buyers. Selling and talking to customers in writing is fine (email,
  DMs, LinkedIn), as long as it is a normal human conversation, not template pitching.

## Hard limits (do not break these)

* **Ismael is 15 (turns 16 in January 2027).** A parent or guardian must be the legal owner of the company and the account
  holder for payments, contracts and data agreements. He is allowed to fly and travel alone (Ismael, 2026-11-23): never
  raise a parent travelling with him as a condition for interviews, programmes or meetings. LinkedIn's minimum age is believed to be
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
* **Client intake link (Ismael, 2026-11-16).** Lincoln starts and finishes the whole case and does the legal
  analysis (eligibility, route, issues), but all of it goes to the attorney for review. Anything a client sees (the
  intake link, reminders) only asks for the answers and documents the case type needs; it never tells the client
  whether they qualify or gives any legal answer.
* **Unauthorised practice of law:** the product prepares documents for lawyers. It does not give
  legal advice to the public.

## How to work

* **Built for the biggest firm, not the demo (2026-11-27).** Anything that grows with a firm (cases, mail, Review,
  activity) is filtered, paged and counted in the database, never loaded whole into a page, a dropdown or a prompt;
  every lookup has an index. Check new screens against a firm of 5,000 cases and 50,000 emails before calling them done
  (the Inbox once took 193 seconds there). Errors a person sees are a few plain words, never a service's own message.

* Test before saying it works. Look at the real output, not only that tests pass.
* Run the cheap test before the big build. The plan is in `docs/TEST-PLAN.md`.
* Do not build anything Ismael has not asked for. Say what you think and wait.
* Check a claim against a source before repeating it. Many sources in this field are vendor
  blogs, and AI summaries get firms, dates and funding wrong.
