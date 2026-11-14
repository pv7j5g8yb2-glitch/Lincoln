# Research log: legal AI (collected 2026-11-08 and 2026-11-09)

Everything here came from web searches, vendor sites and pasted AI summaries. Most sources are
vendor blogs, review sites and Google AI summaries, and they disagree on names, dates and money.
Treat every figure as unverified until checked against a primary source. Never repeat a figure
from here in public copy.

## The market

* Harvey (about $15.5B reported), Legora (about $8.8B reported, bought Qura in April 2026 and
  Walter AI earlier), CoCounsel (Thomson Reuters), Lexis+ AI, Clio (Clio Work, Manage, Grow),
  Spellbook, Legalfly. Harvey and Legora both have mid size firm pages and sell with sales teams.
* Small firm tools and prices (reported): Spellbook about $199 to $350 a seat, CoCounsel
  Essentials about $225 to $400, Clio Work about $199, Paxton $499, GC AI $500.
* Immigration tools (reported): Visalaw AI $220 to $480 a month, LegistAI $50 to $80 a seat,
  Docketwise $69 to $119 a seat (AI on Pro and up), Imagility from $75, Parley (O-1A writer in
  Word), CaseBlink (drafting, reported $2M pre-seed), LegalOS (service, seed). The search on
  2026-11-09 did not confirm any immigration AI funding round, so the earlier "Alma $17M" line
  from a pasted summary is unverified.
* Lawyers already use AI: surveys say 69 to 94 percent use it somehow, but formal firm wide
  adoption is much lower (about 18 to 34 percent). The real opponent is Claude and ChatGPT.
* Anthropic launched Claude for Legal (May 2026, 20 integrations, 12 practice area plugins) and a
  legal plugin for Cowork (January 2026).

## What lawyers say (Reddit r/legaltech thread, about 138 days old on 2026-11-08)

* Praised: Word integration (most mentioned), vaults to ground prompts, exports, ready made
  workflows, drafting in the firm's own voice and templates, first drafts.
* Criticised: "a wrapper", "easily replicated", you still have to check everything, a claim that
  coverage on large document sets is poor because it samples with semantic search.
* Attorneys said they build their own with frontier models. Others said they pay so they do not
  have to build and maintain it. Treat the pro Harvey comments with caution: several readers
  accused them of being marketing.
* Lawyers react badly to anything that smells like marketing. Show real output.

## Trust and risk

* The top worry of small firms is distrust of AI output (reported 83 percent). More than two
  thirds of legal professionals say checking AI costs more than it saves (Morae, reported).
* 2026 sanctions for fake citations ran from about $30,000 to over $100,000 in appeals courts.
* Law Society of Ireland has issued GenAI guidance (verify outputs, the solicitor stays
  responsible). Not directly relevant to a US product, useful for tone.

## Immigration specifics

* Immigration lawyers market themselves in public: LinkedIn is the main network for lawyers
  (ABA 2023 report as cited, 83 percent active), and many post video on LinkedIn, Instagram,
  TikTok and YouTube. One immigration lawyer reportedly has over a million followers.
* No data found on cold message reply rates for immigration lawyers. Our own guess: 5 to 10
  percent reply to a specific message with a free offer, 1 to 2 percent would try something.
* An O-1 beneficiary cannot self petition, a US agent or employer must file. The $100,000 H-1B
  fee was blocked by a court as of October 2026 (reported, appeal pending). Check before relying.
* Immigration files hold passports and personal data. Handle with care and say so plainly.

## Names

* Chosen on 2026-11-09: Lincoln (see `docs/LAUNCH.md`). One search found no legal AI product with
  that name. Not a trademark clearance.
* Taken or poor: Suits.ai exists (Miami, Gartner listing). Walter AI was bought by Legora in
  March 2026 (Vancouver, agents in Word and Outlook). Atticus AI (askatticus.ai) and The Atticus
  Project exist. Gideon Legal and a Gideon app in Clio's directory exist. Hopkins collides with
  Johns Hopkins in search.
* Domain check on 2026-11-09 (basic DNS only): askhopkins.com and .ai, tryhopkins.com,
  usehopkins.com, hopkinslegal.com, hopkinsai.com and hopkins.ai were registered. uselincoln.com
  was found free by Ismael. lincoln.ai is for sale.

## Ideas that were checked and dropped

* Harvey for all small firms: crowded, no gap found.
* Ireland first: Harvey and Legora are already in the big Irish firms, Clio and LEAP in small
  ones, and local startups exist (Newcode, Ovviously, HAQQ, all unverified).
* Quantity surveyors, accountants, architects: crowded with funded tools. Planning consultants
  and independent loss adjusters looked open but small, and were not pursued.
* Verification only (a citation checker): too thin on its own.
* Realtor content, subcontractor certificates, roofing supplements, tariff refunds: see git
  history and earlier notes.

## Pricing thread (Google AI summaries, 2026-11-09, unverified)

* Claimed: immigration firms are flat fee and paralegal heavy, so per seat price multiplies, and
  $299 a seat is too high for self serve. Suggested $49 to $150 a seat, or a low base plus a fee
  per generated packet, or an attorney seat at a premium with cheap paralegal seats.
* Matches reported competitor prices (Docketwise $69 to $119, LegistAI $50 to $80). Visalaw AI
  ($220 to $480) goes the other way. No immigration firm has been asked yet.
* Seat maths for $100k a month profit at about 75 percent margin (about $133k revenue): $79 a
  seat needs about 1,690 seats, $149 about 895, $300 about 445. Margin is a guess.
* Useful product ideas from it: an RFE analyst (read the USCIS letter, say what is claimed, list
  the evidence to collect), form to letter consistency checks, a Visa Bulletin alert, every fact
  linked to its source page, integrate with Docketwise or similar instead of replacing them.
* Not to rely on: itemising an AI fee on a client's bill (check bar rules), "Lenora AI",
  mention of GPT-4o and Claude 3.5 Sonnet (out of date), "the market is wide open".
* Decision: ask lawyers in the test what they would pay per person per month. Do not set the price
  from an AI summary.

## Immigration AI platforms found (2026-11-09, from searches, not a complete or verified list)

Built for immigration lawyers: Parley (support letters, RFE analyser, forms, Word add-in),
CaseBlink (Studio drafting, $2M pre-seed Mar 2025), Visalaw.ai (research and drafting, $1.6M seed
Feb 2025, co-founded by Greg Siskind), Drafty AI, Immigration Copilot, US Immigration AI, HAQQ
(general legal AI with an immigration page).
Case management with AI: Docketwise (IQ add-on, about $69 to $129 a seat), LegistAI ($50 to $60),
Imagility (RFE Response Builder, no public price), INSZoom by Mitratech (AI integrations with
Visalaw AI, Lawfully and Candle AI shown at AILA June 2026), Cerenade eimmigration ($55, no AI
found), CaseONE immiONE (RFE Copilot), Prolexis, BCOS, MigraTrack, Filevine ImmigrationAI (2023),
LollyLaw (AI unconfirmed), Lawyaw (forms, one blog), Instafill (forms).
AI first firms and services: Alma (law firm, $17M Series A), Casium (licensed firm model, $5M seed
Oct 2025), Gale (YC W25, about $2.7M seed, H-1B).
Self filer tools: VisaWorker.ai (free to start, $249 to unlock), QuickFiling, USVisaStack.ai.
General legal AI with immigration customers possible: Harvey, Legora, CoCounsel, Clio, Spellbook,
Claude and ChatGPT (no immigration features confirmed).
Not found: any Series A for a pure software vendor in this space. Check next: the AILA conference
exhibitor list.

## Competitor homepages, batch 1 of 2 (read 2026-11-10 from saved pages Ismael sent)

Homepage text only, so every number is the company's own claim.

* Parley (parley.so): no longer immigration only. "The Legal Agent that works": self building
  database from email and calendar, turns templates and past samples into skills, works in
  Outlook and Word, Drive, Box, Dropbox. 100+ legal teams, SOC 2 Type II, free trial.
* CaseBlink: a full immigration system of record with agents: intake that asks only what is
  missing, letters and RFE responses from the firm's prior filings with every claim cited, forms
  with provenance per field, tabbed packets, deadlines, time, billing, translations. 100+ firms
  on the logo wall (Dorsey and Whitney, Dickinson Wright and others). SOC 2 Type II, zero model
  retention. Founder came through F-1, H-1B, O-1A and a green card. This is the Lincoln pitch.
* Visalaw AI: research and drafting with exclusive AILA and AILALink content, endorsed by a past
  AILA president. SOC 2 Type II. Claims 10+ hours and $60k a year saved.
* LegistAI: all in one immigration case management with agents, forms from intake, RFE workflow,
  client portal in four languages, research, WhatsApp. From $60 a user a month.
* Docketwise (owned by 8am, with MyCase and LawPay): forms, case management, CRM, billing, 8am IQ
  AI. From $69 a user a month. Homepage showed a "Notice of Security Incident" banner.
* eImmigration (Cerenade): 17,000+ legal professionals, "AI Workmates", from $55 a user.
* Alma: AI native immigration law firm for businesses and individuals. Claims 98% approvals,
  about 2 week preparation, 86 NPS, named in an a16z top 50 AI spend report.
* Casium: licensed law firm plus platform, 90 countries, claims 99% approvals, 14.5% RFE rate,
  18 days to file. SOC 2.
* Gale (YC): not a law firm, software plus independent attorneys. H-1B petitions for $999,
  1,500+ cases filed, 98% first attempt approvals.
* VisaWorker.ai: open source drafting agent for O-1A, EB-1A and NIW. Free with your own
  Anthropic key, $249 a case hosted, per case pricing for firms. Pitched against $8k to $15k
  attorney fees.
* Smokeball: practice management, 34,000+ users, Archie AI in every matter. ISO 27001.
* LEAP Ireland: 550+ Irish firms, 3,000 firms in Ireland and the UK, 78,000+ users worldwide,
  over 15 million euro a year on R&D, Matter AI and Prompts built in.
* Andri (Amsterdam, has an Irish page): agentic legal AI for Europe, house style drafting, case
  timelines, court simulation, ISO 27001, EU data centres, free trial.
* AI.Law: litigation operating system, one case free, SOC 2 Type II, a patent, founded by a
  litigator.
* CoCounsel (Thomson Reuters): spans legal, tax, audit, accounting and trade, grounded in Westlaw
  and Practical Law. Has small firm plans.
* Mitratech: owns INSZoom (immigration case management) inside a large legal, GRC and HR suite.

Patterns: every product now sells the same thing (system of record, agents, the firm's own
templates, Word and Outlook, finished files, attorney review, cited sources). The trust stack is
identical (SOC 2 or ISO 27001, no training, zero retention). Three models: software for lawyers,
AI native firms that sell the outcome to the end client and take the fee, and cheap self filer
tools. Moats seen: exclusive content (AILA, Westlaw), installed base (Docketwise, eImmigration,
LEAP, Smokeball), and owning the client relationship (Alma, Casium, Gale).

## Competitor homepages, batch 2 of 2 (read 2026-11-10)

* Harvey: "AI software for legal and professional services". Banner: raised $550M at $15.5B.
  3,500+ legal organisations. Agents, Vault, research including tax, shared workspaces with
  ethical walls, memory, legal work orchestration, contract review, regulatory tracking, intake,
  facts and chronologies, MCP connectors, Word. Industry pages now include healthcare and life
  sciences, and media. Customers named: Reed Smith, CMS, Burges Salmon, Repsol, Dentsu, Adecco.
* Legora: "the agentic operating system for legal work" (aOS). Agent plans, executes, reviews and
  delivers. Monitors, Lists, Portal, tax analysis. SOC 2 Type II, ISO 27001, ISO 42001, GDPR, HIPAA.
* LOIS by Filevine: "Legal Operating Intelligence System", agents across every matter, built on
  40M+ matters in Filevine's legal graph. Free trial, no card. Ad film stars Sarah Rafferty (Donna
  in Suits).
* LEGALFLY: legal operating system for corporates, intake, playbook review, drafting in Word,
  agents triggered from email, Slack and Teams, regulatory radar, 130+ jurisdictions, Gartner
  named key vendor. Says it is built for enterprise teams, not law firm productivity.
* LawVu: LegalOS for in-house teams: intake front door, matters, contracts, spend, knowledge,
  agents. Customers include Dentsu (also a Harvey customer).

## Overall read of all 21 (2026-11-10)

* Everyone now sells "the operating system" with agents: Legora aOS, Filevine LOIS, LawVu LegalOS,
  LEGALFLY, CaseBlink, Parley, AI.Law. Lincoln's pitch is the standard pitch.
* The biggest are already moving into other professions: Harvey into professional services,
  healthcare and media, Legora and Harvey into tax, CoCounsel into tax, audit, accounting and
  trade, Parley from immigration to all legal. "Harvey for another profession" is what Harvey
  and Thomson Reuters are doing themselves.
* What keeps the winners winning: data (Filevine 40M matters, Westlaw, AILA content), an installed
  base (LEAP, Smokeball, Docketwise, eImmigration), certifications (SOC 2, ISO 27001, ISO 42001,
  HIPAA), licensed lawyers, and hundreds of millions in funding.
* Verdict given to Ismael: do not build Lincoln as planned. The deciding reason (corrected by
  Ismael, 2026-11-11): funded incumbents were never the problem, he knew about them. The problem
  is that even narrowed to immigration, getting small and mid sized immigration firms to sign up
  to a self serve legal AI platform would be very hard, close to impossible. No reason was found
  for a firm to choose it over CaseBlink, LegistAI or the AI in software it already pays for.

## YC LegalTech directory (pasted 2026-11-11, 53 companies, all YC batches since the start)

The second list Ismael meant to send (236 companies from all industries, F2026 to S2027) did not
arrive: the second paste was the same 53 company LegalTech page again.


* Newest batches (2025 to F2026) are tiny teams (1 to 3 people) doing one money blocking job end
  to end: Elithia (medical record review for injury claims, sold to expert witnesses), Andco and
  Codes Health (record retrieval, Codes Health has 45 staff), Praxis (law firm admin agents),
  OpenIntake (intake calls), Mimos (lead gen and intake for injury firms), Tarifflo (customs
  filing API with MCP), Patent Watch (infringement finding), Mayflower (immigration screening
  inside HR tools). Plus AI native law firms: Wingman Law, Erinys, Blueshoe.
* Each pitch ties to a dollar figure: claims payouts, lost clients ($10k each), overpaid duties,
  patents turned into revenue.
* Older consumer legal tools were acquired: Willing (by MetLife), SimpleCitizen, Clerky.
* Legora's YC entry: $200M+ ARR, 900 staff, $5.6B Series D (other sources say $8.8B later).
* YC offers free Startup School and Co-Founder Matching.

## YC companies F2026 to S2027, all industries (pasted 2026-11-11, 236 companies)

* Batches: 225 Fall 2026, 10 Winter 2027, 1 Summer 2027 (Memorable). Sectors as YC tags them:
  119 B2B, 53 industrials, 21 consumer, 19 fintech, 15 healthcare, 4 real estate and
  construction, 4 government, 1 education. 64 of the 236 taglines mention agents.
* Most of the B2B is tooling for AI agents sold to developers (sandboxes, VMs, inference, testing,
  memory). Most industrials are hardware (robots, drones, defence, energy) that needs capital.
* "Legora for X" is being funded right now: Gradon ("Legora for AEC firms"), Covera (AI native OS
  for insurance brokers), Constor (construction), Ordo Labs (regulated labs), Plek (PE firms).
  This weakens the earlier point that only Harvey and Thomson Reuters can do it.
* One role in a small business, done by AI: Kairos Health (front desk for dental practices),
  Fleety (dispatcher for plumbing and HVAC), Rezora IO (voice agents for home services and real
  estate), Rote (insurance department for auto body shops), Asakana (admin for food
  distributors), Lark (workflows for distributors). Priced against a wage, not against software.
  Their prices and sales model are not known from the list.
* AI native service firms, selling the result: ClaimKit (tax), Wingman Law (injury), Obia
  (commercial real estate brokerage), Ignition Benefits, Veltha (TPA), TrueMile (trucking),
  LinkLane (freight brokerage), Adside.ai (ads agency), Cardinal Square (schools).
* Legal tagged: Elithia, Praxis, Neomatter (in house legal), Wingman Law, Tire Swing. Immigration
  adjacent: Veeza AI (consumer tourist visa agent for weak passports). Adalat AI (courts, India).

## "Legora for X" question and public adjusters (2026-11-11)

* Advice given: not a "Legora for X" platform. Harvey, Legora and the YC "Legora for X" teams
  (Gradon, Covera) sell to firms through sales teams, and the reason Lincoln closed (small firms
  will not adopt a whole new AI platform self serve) applies to every profession.
* Suggested instead: one money blocking document job for a solo or small owner who decides alone.
  Example given: public adjusters (paid a share of each settlement, commonly 10 to 20 percent).
* Existing AI tools for public adjusters found (all small, unverified vendor pages): Clayem
  (policy analysis, demand letters), Restoria (Florida, estimate discrepancy reports, Xactimate
  formats), Claim Navigator AI, Claim Mosaic.
* No reliable national count of public adjusters found. Licensed in 45 states plus DC (2020 trade
  article). Florida had 2,914 in 2009 (state audit). Market size is the open question.
* Business valuation analysts also checked: already served by Equitest, ValuBot, AIVI and others.
* Ruled out by Ismael (2026-11-11): public adjusters. Do not suggest again.

## Legora interview, Max Junestrand with Gustaf Alstromer at YC (pasted 2026-11-11, from 2025)

* Recorded about 13 months after W24, around the $80M Series B. 10 people after YC, 100 at
  recording. The intro says $675M valuation then (the YC directory now says $5.6B Series D).
* Selling: the line is "it's impossible to do a bottom-up motion in our industry because you don't
  procure software individually. You take it through procurement and you take it through IT", plus
  security and data privacy checks. It is about law firms, not AI software in general, it never
  says "self serve", and the transcript labels it Host (labels are jumbled, context suggests Max). Big firms buy through innovation teams. At mid size firms
  the partners decide and it is hard to get the whole partnership in, so start with one partner
  and their team, make them "rock stars", then expand. This matches why Lincoln closed.
* No legal background, but he interviewed 100 lawyers first (LinkedIn messages offering to pay
  their hourly rate for lunch, none accepted the money), and kept daily feedback with early firms.
* Before Legora: programmer, esports betting models, Norrsken (transcript says "Norhen"), a short
  spell at McKinsey, stints at other startups. Rejected by YC once, accepted the second time.
* Early wedge: EU data rules (EU hosting, no training, no retention) that general tools did not
  meet. Then tabular review (grid of documents by questions) and a Word add in with playbooks.
* Paused new sales for four to five months after raising, because a lawyer's first login is the
  only chance. Fixed reliability until they could onboard 1,000 lawyers a day.
* Advice to vertical AI founders: do not compete with the AI labs, do not lock into one model
  provider, find a narrow category the models will not reach, or use them in a way others have not.

## YC Light Cone episode on finding startup ideas (pasted 2026-11-11, recorded 2025)

* Two routes: look within (your own expertise, jobs, internships) or "get out of the house" into
  real businesses. Weekend or hackathon ideas and ideas copied from X are the default bad ones.
* Access through family: Ess Health's founder spent a day in his mother's dental office and found
  insurance admin to automate. "Access is all you need." Many YC billion dollar companies trace to
  a parent, uncle, cousin or old roommate.
* Going undercover: a founder took a real remote job as a medical biller (two to four weeks of
  training) to learn the work. Tip: search Indeed for remote analyst or clerk jobs. Or shadow a
  friend with a boring job (Sweet Spot: a friend refreshing the government contracts site all day,
  now an AI platform for government contracting).
* Signals: work outsourced to low wage countries (Lilac Labs, drive thru orders), and products
  that need expensive consultants to work (Automat versus UiPath).
* Replacing a person paid $60k to $80k a year makes small niches (one dentist office, car loan
  lenders) big enough now.
* DataCurve: 19 year olds whose "AI for product managers" failed because they had never been
  product managers. Their win came from the founder's internship at Cohere.
* Crowded is not a reason to quit if you can actually deliver (Giggl in customer support).
  Taking about a year to find the right idea is normal.

## Research: new model abilities x new forced work (2026-11-10)

Question from Ismael: what can the newest models do that they could not a few months ago, and
where does that meet work businesses are forced or already paying to do. Sources are mostly
secondary (trackers, law firm alerts, vendor pages). Check primary sources before relying on any
figure.

### What changed in the models
* Claude Fable 5 (reported 9 June 2026, "Mythos class"): runs for days in an agent harness,
  plans in stages, uses sub agents, checks its own work; 1M token context. Fable 5.1 adds
  document, spreadsheet and slide work. Opus 5.5 (22 Sept 2026) is near Fable 5.1 at lower cost.
  OpenAI's current family is GPT-5.6 (July 2026); GPT-6 not confirmed.
* METR time horizon: top model about 16 hours or more at 50 percent success (May to Aug 2026),
  doubling about every 4.3 months; METR says above 16 hours is unreliable to measure.
* Computer use: frontier agents above the human baseline on OSWorld Verified (85 percent plus,
  July 2026 paper), but only 20.6 percent full completion on OSWorld 2.0 (long professional
  workflows, median 1.6 human hours).
* AWS WorkSpaces for AI agents (preview May 2026) lets agents drive old desktop software. Horizontal
  players already there: Cyberdesk, Minicor, Coasty, plus AWS and Microsoft.
* Read: short tasks are solved; the new frontier is whole multi day deliverables. Most AI tools
  sold in each niche were built in 2024 and 2025 as step assistants, not finished deliverables.

### Forced work with dates (as reported)
* ADA Title II web and document accessibility (WCAG 2.1 AA): public entities of 50k+ by
  26 April 2027, smaller ones and special districts by 26 April 2028 (DOJ interim rule, April
  2026, being challenged in court).
* HHS Section 504 web rule for recipients of HHS money: 15+ employees by 11 May 2027, fewer than
  15 by 10 May 2028 (interim rule, 7 May 2026). Same WCAG 2.1 AA standard.
* PDF remediation is priced at roughly $5 to $25 a page by hand; automated checkers catch only
  20 to 30 percent of PDF issues. Vendors: Allyant, AbleDocs, CommonLook, Equidox, Foxit
  partners, overlays (AudioEye, UserWay, accessiBe).
* EU AI Act high risk (Annex III) moved to 2 December 2027, Annex I to 2 August 2028 (Digital
  Omnibus, reported in force July 2026).
* EU CBAM first annual declaration for 2026 imports due 30 September 2027; importers under 50
  tonnes exempt (about 90 percent of importers). Pain point: emissions data from non EU suppliers.
* EU MDR legacy devices: Class III and implantable IIb by 31 December 2027, others by
  31 December 2028; notified body capacity is the bottleneck.
* CMMC Phase 2 (third party Level 2 for defence contractors) was due 10 November 2026; one source
  says it was suspended in July 2026. 1,042 of about 76,598 organisations certified by Feb 2026.
* IEEPA tariff refunds: Supreme Court ruling 20 Feb 2026; CBP's CAPE portal had accepted about
  $136.6B by 2 Oct 2026. Older "finally liquidated" entries mostly limited to importers who sued.
* CFPB 1071 small business lending data: tiers from July 2026 to October 2027 (may change).
* CMS prior authorisation APIs for payers by 1 January 2027 (payers, not small practices).

### Niches checked and who is already there
* Duty drawback: Flexport, Zollback, LightSource and others; drawback ranked "best of" lists.
* Phase I environmental site assessments: Ama Earth Group, Vestige, V7, VEMLogic, EnviroForge.
* FDA 510(k): Cruxi, Complizen, RegDesk; consultant retainers reported around $60k.
* Cost segregation: Segtax, KBKG Cost Seg Pro, CostSegregation.com.
* Back office work most exposed: data entry, claims, document review, invoice matching (BPO).

### Conclusion given to Ismael
* Being first in a niche is mostly gone: every obvious one checked has at least a few startups.
* The opening that looks like Harvey in 2023: a product built on days long agents that delivers
  the whole finished project, where today's tools in that niche are 2024 style assistants.
  Harvey was not the first legal AI either (Casetext had CoCounsel at the same time).
* Strongest fits for that: the 2027 and 2028 accessibility deadlines (huge number of forced
  buyers, priced by the page today), and EU MDR technical files (high value, Ireland has a large
  medtech cluster, but sales led).
* Ruled out by Ismael (2026-11-10): accessibility compliance platform (ADA Title II, HHS 504). Do not suggest again.
* Ruled out by Ismael (2026-11-10): Shopify App Store product. Do not suggest again.

## Property, cars and "Claude for one group" (2026-11-10)

* Property investors and syndicators: AI underwriting already crowded (Titleman, Archer, Apers,
  CashflowPortal parsing, V7, Docsumo lists). Developers and land: TestFit, Zenerate, Dwellci,
  Algoma ($2.3M), ArchiWise, Acres.com.
* Franchised car dealers: heavily funded AI (Impel about $126M to $130M, Numa about $48M and
  1,300+ dealers, Toma about $17.5M with a16z and YC, Actively reported $45M, Swirl).
* Independent used car dealers: NIADA 2025 about 53,000 active (117,000 licensed), 9.8M vehicles
  retailed in 2025. A vendor study (AutoAcquire) says 14 percent of independents used AI
  acquisition tools in 2025 against 24 percent of franchise dealers, and independents turn stock
  in 52 days against 38 overall. Tools there: Carketa, AutoAcquire, Van, ACV Auctions.
* Read given to Ismael: the overlap of all three interests is a Claude for independent car
  dealers that does the buying and selling work end to end. Data access must come through
  proper partnerships or APIs, never scraping. Dealers may prefer phone, which clashes with his
  no calls rule: to be tested.
* Ruled out by Ismael (2026-11-10): AI for independent car dealers ("essentially a CRM", doubts managers would pay). Do not suggest again.

## Lincoln rechecked with the new rules (2026-11-10: selling in writing allowed, no calls)

* Visalaw AI: Core $220 and Pro $480 a month per licence, free trial only after booking a demo.
  Parley: Starter reported $500 a month for up to 10 seats, free trial. CaseBlink: reported $100
  to $300 a seat. LegistAI: reported $60 a user. Several are quote based (demo call).
* AILA: 18,000+ US lawyers. Share in solo or small firms not found.
* Clio: 71 percent of solos and 75 percent of small firms use AI for legal work (2025 or 2026
  report, year unclear). So small firms are already buying AI, which weakens the earlier
  judgement that they will not sign up on their own. That judgement was never tested.
* Read: a no demo, instant trial product for solos is a real difference from Visalaw's demo gate.
  Still crowded and price pressured (LegistAI at $60). The existing three week test plan already
  works without calls and would settle it.

## Review of a pasted Google AI thread on fastest companies and bootstrapping (2026-11-10)

* Higgsfield: company says it crossed a $1B annualised run rate on 24 Sept 2026 (latest four
  weeks x 13), about 18 months after a March 2025 product launch; about 70 percent enterprise.
  Self reported. It is AI video, so the thread's "training data contracts" explanation is wrong.
  A source the thread itself cites says Higgsfield is not the fastest.
* Cursor: SpaceX agreed to buy Anysphere for about $60B in stock (16 June 2026); closing status
  unclear in sources.
* Harvey: Series B Dec 2023 at a publicly reported $715M; unicorn at the July 2024 Series C
  ($1.5B), about two years after founding, not 18 to 20 months.
* Bootstrapped "proof" partly wrong: Veed bootstrapped to about $7M ARR, then took $35M from
  Sequoia (2022); Clay is venture funded (Sequoia, Meritech, $500M valuation in 2024). Midjourney,
  Mailchimp and Pieter Levels are real bootstrapped cases. Slack and Shopify timelines to $1B
  revenue are off.
* Useful part: ways to get customers without cold outreach: free single purpose tools (HubSpot
  Website Grader), search pages for very specific questions (Zapier integration pages),
  marketplaces, building in public (Pieter Levels).

## Review of a second pasted Google AI thread on bootstrapping to $100M (2026-11-10)

* It reverses itself after pushback: first Zapier and Mailchimp prove the path, then they are
  "obsolete". "Mathematically proven" and "statistically realistic" with no statistics given.
* Facts: Midjourney about $200M a year with no VC (widely reported); Mailchimp bootstrapped,
  about $800M revenue, sold to Intuit for $12B; Zapier took a $1.3M seed and in 2021 Sequoia and
  Steadfast bought shares from early holders at a $5B valuation (so "never touched VC" is loose).
* Its main claim, that VCs will not fund small niches, is contradicted by the YC F2026 list he
  sent: Fleety (plumbing and HVAC dispatch), Rote (auto body shops), Kairos Health (dental).
* It never names a niche. Like every source so far, it ends by asking which industry he knows.

## r/AskReddit "Lawyers, how are you using AI" (pasted 2026-11-10, thread about a month old)

* A 1,000+ lawyer firm (commenters guess Kirkland & Ellis) reportedly spent eight figures on its
  own AI on its own documents, self hosted, and cut first and second year hiring. Big firms build
  their own; small firms cannot.
* A corporate benefits lawyer's clients dried up in a year (anecdote).
* A practising lawyer: AI is very good at research, basic drafting, reviewing large volumes and
  paralegal admin, which can be automated end to end "with a little bit of foundation work".
  Courts now require AI disclosure and sanction errors; some say privilege can be at risk when
  client data goes into AI (unverified). Lawyers use local AI for confidential documents.
* For Lincoln: employment based immigration is mostly filings with USCIS, an agency, not court
  work, so it sits on the side lawyers say AI already does well. Confidentiality is a must.

## r/LawFirm "moved from Claude or ChatGPT to legal specific AI?" (pasted 2026-11-10)

* Several lawyers moved the other way, from legal tools (EvenUp, Supio) to plain Claude, because
  Claude's quality is better once skills are set up. "The setup is where people stall" (the
  founder of North, which "engineers Claude for law firms").
* What lawyers say legal tools add: matter memory across months, linked citations they can check
  in the same place (OpenCase, Irys Cite Check, Harvey Vaults), organised documents, and the
  "plumbing" (OCR, de duplication, page cites, a BAA). Medrecords AI co founder: "at 3,000 pages
  from 12 providers, the plumbing is the product".
* Lawyers already connect Claude to Clio through MCP and keep matters in Claude projects.
* Privacy questions lawyers ask vendors: training on data, retention, add on connectors, who can
  read data versus where it sits.
* Read for Lincoln: model quality is not the edge. The edge is per matter memory, checkable
  sources, done for you immigration skills and setup, and true privacy terms. One option is to
  build Lincoln on top of Claude (skills and connectors) rather than as a separate chat app.
* Anthropic released open source Claude Cowork plugins (announced 30 Jan 2026), including a
  legal one for contract review, NDA triage and compliance; Thomson Reuters fell about 18 percent
  and RELX had its worst day since 1988 (early Feb 2026). The lab itself now ships general legal
  skills; immigration specific work is narrower.

## r/legaltech "the 4 things I actually use AI for every week" (pasted 2026-11-10)

* Works: first drafts of letters and emails, timelines from long records with page references,
  cleanup, quick orientation. Stopped: research needing real citations (fake cases), anything
  filed without close reading. Several lawyers trust only Westlaw or Lexis for research.
* Some lawyers build their own tools with Claude Code or Lovable. Big companies have internal GPT
  platforms plus Legora; small firms do not.
* Hourly billers resist ("I bill hourly, give me my hour back"); flat fee lawyers gain most.
* Immigration petitions are mostly flat fee (sources: Manifest Law, Lighthouse, Beyond Border):
  H-1B new petition about $2,500 to $5,500, O-1 about $3,000 to $15,000 by source. On flat fees
  every hour saved is the lawyer's own profit, a strong reason to pay.
* Verification eats into time saved; the fix lawyers suggest is several agents checking each other.

## r/legaltech "what would you need to trust AI contract extraction?" (pasted 2026-11-10)

* Trust design lawyers asked for: several passes (extract, check, correct), a table of sources,
  confidence and a list of what could not be verified, readable not technical. Amendments and
  redefined terms override the base text. "Fewer fields you can stand behind": a "not found" is
  forgiven faster than a confident wrong answer.
* A lawyer: "absolute certainty that inputs are not used for anything and immediately destroyed.
  Unlimited liability... Do that and you will cash checks." Privacy is a buying trigger. Unlimited
  liability is not something a parent owned startup can offer.
* Hostility again to "vibe code me a business I know nothing about", but the thread still got
  three useful answers. Law firms are seen as slow adopters; in house teams adopt faster.
* For Lincoln: every statement in a packet should point to the exact page of evidence, with a
  plain list of what is missing or unverified, and true zero retention terms.

## r/startups "$10M ARR in 13 years, rant on fail fast and YC" (pasted 2026-11-10, post 8 months old)

* Anonymous founder (claim unverified; a commenter doubts it): marketing SaaS, failed first
  company, broke through only after pairing with a cofounder who could sell; survived years on
  consultancy and deals. Hardest lesson as a developer: tech is secondary.
* Argument: VC and YC need a few 100x outcomes, so their advice favours big risky bets; a slow
  profitable company is fine for the founder but useless to them. Counter comments: YC loses its
  $500k, support lowers failure rates, raising $300k+ links to survival (selection bias noted).
* Comment worth keeping: "half the founders i know use [fail fast] as an excuse to bail on stuff
  after 6 weeks. thats not pivoting thats just not committing."
* For Ismael: $1M a year profit is about an eighth of this founder's $10M ARR, and his rules
  (bootstrapped, no investors) put him on this slow path, where selling and staying power matter
  more than the idea.

## Legora LinkedIn post "Legora now connects to Claude for Legal" (screenshots, 2026-11-10, post about a week old)

* Legora says it is part of Anthropic's "Claude for Legal" launch: lawyers put Legora's agent to work
  on jurisdiction specific research and their own matters from inside Claude. 1,475 reactions.
* Top comment (lawyer and investor, 69 likes): "A wrapper saying he is connected to what he is
  wrapped around." Others joke about "recursive legal tech". A Dentons associate defends it as
  convenience. An Eversheds partner asks whether Legora is still model agnostic.
* Serious comments: a compliance adviser says Claude becomes "the place where the lawyer starts and
  receives the answer" and specialist providers may end up competing with the platforms they made
  indispensable; others ask for independent verification of conclusions, a tamper proof record of
  what a source said on the day it was relied on, and security for privileged data.
* Read: mockery on LinkedIn has not stopped Legora selling. The bigger signal is that the work is
  moving inside Claude itself, which supports building Lincoln as immigration skills and a
  connector inside Claude rather than a separate chat app.
* API notes (Claude API skill, prices cached 2026-11-03): one account gives every model, chosen per
  request; pay per token only. Opus 5.5 $4 / $20 per million tokens in / out, Sonnet 5.5 $2 / $10,
  Haiku 5.5 $0.10 / $0.50, Fable 5.2 $8 / $40. Fable 5.2 is not available under zero data retention
  unless Anthropic authorises it, which matters for a privacy promise to lawyers. Opus 5.5 effort
  defaults to medium on the API, so set it explicitly.

## Harvey founders' AMA on r/legaltech (pasted 2026-11-11, about six months old)

* Early days: "Linkedin messaged everyone. tbh [no] one really responded until A&OS press." First
  customer intro came from an investor. Best demo: take something a litigator filed in court and have
  Harvey argue against it live, "People REALLY paid attention if it was their own work." Seed from
  OpenAI with no revenue; not profitable. About $300M ARR at the time (May 2026); 1T tokens in January
  to 12T+ in May after moving to cloud agents.
* Their case against plain Claude ("Claude for Legal", Cowork): law firms cannot use desktop apps with
  client data; they need ethical walls, retention, governance, audit, multi model routing, DMS
  integrations (iManage, NetDocs), client collaboration, 24/7 support and training. In short: enterprise
  infrastructure and service, not better drafting.
* Lawyer pushback: "Why should a 20-lawyer firm pay you guys $100k a year when they can do similar
  things with a $20/month/user Claude account?" (no answer). A firm librarian: results unreliable, every
  answer has to be verified, so work is done twice. A European firm: output too American.
* Small firms and solos feel ignored: an in-house team never got a demo reply; a solo asks whether Harvey
  will ever serve solos; Harvey says "hope to support small teams and solos very soon". A three person
  firm did get flexible terms at a premium price.
* Harvey's view of where vertical companies win: making review of AI output easy in their domain, and
  domain benchmarks and evals.
* Read against our test: plain Claude already drafts at about the level of a legal tool; what Harvey
  sells on top is security, compliance, integrations and service, which a parent owned startup run by a
  15 year old cannot credibly offer to firms.

## r/legaltech "How will Eve / Supio / EvenUp / Harvey survive when lawyers build their own?" (pasted 2026-11-11)

* Main answers: lawyers do not want to become workflow engineers; building is fun, upkeep "goes on
  literally forever"; solos and small shops "will always pay"; many lawyers still struggle with email;
  one builder spent tens of thousands of euros of tokens and says the detail and deployment are immense.
* Risks to wrappers: they rely on frontier models and are not profitable, so prices may rise or they may
  close when venture money dries up; the labs may package role specific tools into enterprise plans
  ("very little reason to use a 3rd party"); some may escape by moving to cheaper open weight models.
* Read: what small firms pay for is someone else doing the setup and the upkeep, not better drafting.
  In immigration, case management tools (Docketwise, LawLogix, INSZoom, eImmigration) already hold that
  role and are adding AI.

## Pasted Google AI thread: "Harvey for accounting" and "best vertical for the Harvey model" (2026-11-11)

* Accounting: the thread's own harsh answer holds. Fixed fees and the CPA shortage are real, but the work
  is spreadsheets and ledgers, incumbents (Thomson Reuters, Wolters Kluwer, Intuit) and funded startups
  (Blue J, Fieldguide, Numeric, Trullion, Basis) are there, Harvey works with PwC on tax, and busy
  season blocks selling for months.
* Its pick, commercial insurance underwriting and claims, is already crowded with funded companies:
  Sixfold ($30M Series B, Jan 2026, "AI Underwriter"), Federato ($100M Series D, Nov 2025, submission
  triage for carriers and MGAs), and YC F2026 alone has Covera, Hesper AI, Veltha, Ignition Benefits,
  Risklytics and Rote. Selling needs SOC 2, security reviews and enterprise sales, which clash with
  Ismael's no calls rule and his age.
* Its "sell completed work, not chat" advice is what Lincoln did; plain Claude matched it on a
  document heavy job. Read 300 pages and draft a memo is exactly what general models now do well.
* Unverified claims in the thread: Harvey "80% of Am Law 100", "$1,000+ per seat", "MGAs decide in weeks".

## Remodel an old category: research (2026-11-11)

Method: look for big categories where the incumbent is forcing customers to move anyway (sunsets,
mergers, price hikes), because forced switching is the moment buyers look at alternatives.

* Youth sports club and league software (strongest find):
  - Stack Sports merged with PlayMetrics in June 2025; PlayMetrics closed its purchase of SportsEngine
    from Versant on 1 May 2026 (SportsEngine: over 16 million athletes, 1.2 million teams, 45,000
    organisations, per its site; reported valuation $400M to $500M).
  - The combined company is retiring products: Goalline and Pointstreak shut in May 2026; Sports Connect
    (Little League's official provider since 2016) sunsets in 2027; AYSO is moving to PlayMetrics.
  - So one company now controls a large share and is forcing many leagues to migrate within about a
    year. Other players: LeagueApps, TeamSnap, Jersey Watch, TeamLinkt, GotSport, Crossbar, Demosphere.
  - One market report puts US youth sports tech at about $2.1B (2025); estimates vary widely.
  - Not a document job, so plain Claude does not replace it: the value is registration, payments,
    scheduling, communication and records. Revenue in this category usually comes from a cut of the
    registration fees processed. Risks: children's data (COPPA under 13), payments need an adult owner,
    governing bodies (AYSO, Little League) choose centrally for their members, crowded challengers.
* QuickBooks Desktop: versions retired every May (2023 version on 31 May 2026), Desktop price rises from
  Feb 2026, QuickBooks Online rises from Aug 2026; users angry. But alternatives are many and strong
  (Xero, Zoho Books, FreshBooks, Wave, Sage) and accounting was already judged crowded.
* Dental practice software: Eaglesoft moving to subscriptions, standard Dentrix still on local servers;
  cloud challengers (Curve, Dentally, CareStack) already there; HIPAA and sales calls.
* Fitness studio software: Mindbody price creep complaints; many challengers (Momence, WellnessLiving,
  Glofox, Gymdesk, Vibefam).
* Insurance agency management: sticky (migrating files, carrier downloads); Big I cites two hours a day
  of manual data entry for independent agents.
* Ruled out by Ismael (2026-11-11): youth sports club software, QuickBooks Desktop alternatives, dental, fitness studio and insurance agency software. Do not suggest again.

## Cal AI: teen founders, consumer AI app, grown by creator content (checked 2026-11-11)

* Photo calorie tracker launched May 2024, built by teenagers (Zach Yadegari, Henry Langmack and others).
  TechCrunch reported over $2M revenue in one month early on; later accounts say 15M downloads and over
  $30M a year before MyFitnessPal bought it (announced December 2025). Figures are founder reported.
* Growth came from paying about 250 creators a fixed monthly fee to post on TikTok and Instagram; the
  first traction came from one paid story by a creator documenting weight loss. Brand and creator
  content, not the founders' faces, and no cold outreach.

## Mercor (researched 2026-11-12)

* Founders: Brendan Foody (CEO), Adarsh Hiremath (CTO), Surya Midha; school friends and debate team
  partners at Bellarmine College Preparatory, San Jose, California. All three Thiel Fellows who left
  college. Founded 2023 (some say 2022).
* Started as a marketplace placing software engineers in India with US companies; built an AI
  interviewer (about 20 minute structured video interviews) when manual matching could not scale;
  then moved into supplying domain experts (engineers, doctors, lawyers and others) to AI labs for
  training data and evaluations as lab demand surged.
* Funding: seed about $3.6M led by General Catalyst (announced Jan 2024, some say 2023); Series A about
  $30M to $32M led by Benchmark at about $250M (Sept 2024; Thiel, Dorsey, Summers named as angels in
  some sources); Series B $100M led by Felicis at $2B (Feb 2025); Series C $350M led by Felicis at $10B
  (Oct 2025, with Benchmark, General Catalyst, Robinhood Ventures); Series D $750M at $20B (announced
  10 Nov 2026; Benchmark, Apollo funds, General Catalyst, NVIDIA, Salesforce, Zoom). Forbes: about
  22 percent each, youngest self made billionaires at 22 (Oct 2025).
* Revenue (gross, before 60 to 75 percent paid to experts): $100M run rate Mar 2025, $500M Sept 2025,
  $1B early 2026, $2B June 2026 (company figures). About 91 percent from foundation model makers.
* Read for Ismael: Mercor rode a sudden wave (labs needing expert data) with a marketplace; edge was
  speed, timing, the Thiel network and selling to a handful of labs. Expert data and RL environments
  are now crowded (Scale, Surge, Turing, Handshake, micro1, and YC F2026: Perit.AI, The Agentic Data Co.,
  Epsilab, Reific, SE3 Labs, Evident Machines). Buyers are a few labs, sold to by enterprise sales.

## Toby Brown and Beem (researched 2026-11-12, from a pasted Google AI thread)

* UK, from Twickenham, London. Coding from about 7 (Raspberry Pi, YouTube). Youngest member of Hack
  Club's leadership team at 13 (Tech Funding News). Says he was an "average" student; left school
  before his GCSEs and has no diploma (Business Insider essay, Oct 2025, syndicated on AOL).
* Beem: described as an "AI native computer" that "handles all the boring stuff" (email, calendar,
  files, travel). In the BI essay he says he "can't share too much" about it. No public launch, users
  or revenue found in any source as of this research. SPC once listed Marc Porat (General Magic) next
  to him on a Beem page that now returns 404; the relationship is not confirmed.
* The "$1M raise" is South Park Commons' standard Founder Fellowship deal, not a negotiated round:
  $400k upfront for 7 percent on a SAFE, plus $600k only when an outside investor leads his next
  round (SPC blog, every cohort 2023 to 2026). He pitched London VCs in person in summer 2024, then US
  VCs on Zoom; SPC over Zoom in November 2024. VC interest came from posting his progress on X (about
  8,000 followers).
* Moved to San Francisco in June 2025 on an O-1 after waiting months (BI says it verified the visa).
  The thread's "youngest O-1A holder, at 15" is not confirmed by any source found; by the dates he
  was 16 when approved.
* Corrections to the thread: seed funding does not "automatically" meet the critical role criterion
  (the role and the organisation's distinguished reputation must both be shown); "chief of staff AI"
  is the thread's wording, not his.
* Sigil Wen: 2025 Thiel Fellow from Toronto, built Extraordinary, an O-1 filing startup. No source
  found on what he did for Toby beyond his own posts.
* Read for Ismael: Toby's route was a personal audience (posting himself and his building on X) and
  a fellowship application before any product or revenue. Both are outside Ismael's current rules
  (nothing about him; no VC before revenue). SPC's fellowship is an application, so it falls under
  the same open question as YC's.

## Pasted Google AI plan: "move to the US at 16 on an O-1" (2026-11-12), checked
* Sound in outline: stay in school, get paying customers from home first, move only with money in the
  bank and a visa approved, live inside a community (programme or founder house), not alone.
* Wrong or risky for Ismael: it assumes legal AI at $199 to $299 a seat, which Lincoln's blind tests
  stopped; "reach out to solicitors on LinkedIn" is cold outreach (ruled out); "SOC 2 readiness" is a
  claim rule; youth awards, youth hackathon judging and Patch are weak O-1 evidence because USCIS
  compares with the whole field, not with teenagers; O-1 criterion (B)(3) needs press about the
  person, which clashes with the rule of nothing about him; there is no legal O-1 salary floor
  (salary only matters for the high salary criterion and for living costs); Stanford Online High
  School is selective and costly, not "easy".
* Checked: the exhibition is now the Stripe Young Scientist & Technology Exhibition (Stripe took over
  from BT in 2025, five year deal). California: education compulsory to 18, but a 16 or 17 year old
  can be exempt with the CHSPE certificate and parental approval (Education Code 48410(e)). O-1 grace
  period after the job ends: up to 60 days or until the validity ends, whichever is shorter
  (8 CFR 214.1(l)(2)). Ireland: education is compulsory to 16 or three years of second level,
  whichever is later (Education (Welfare) Act 2000).

## "Proactive Lincoln with VC money": who already does it (researched 2026-11-12)
Ismael's idea: an AI that knows when a lawyer gets a new case and does the whole job without being
prompted, so no one can call it a wrapper. Findings:
* Harvey and Legora both launched products called "Intake" in October 2026 (Legal Cheek, 14 Oct
  2026). Both are for in house legal teams: an employee's request (Slack, email, Jira) triggers an
  agent that chases missing information, routes the work and prepares it for a lawyer. Triggered by a
  request, not by a new case at a law firm.
* Clio Work (small and mid firms): synced to live matter data in Clio Manage, "proactively" surfaces
  risks from notes, correspondence and court dates (Jan 2026); agentic "skills" that run multi step
  tasks (Apr 2026); court eFiling from the matter (ClioCon 2026, rolling out Nov 2026). Company claims.
  This is the closest thing to "acts on the case without a prompt".
* Plaintiff side already works case file in, finished work out: EvenUp ($150M recurring revenue under
  contract, company figure, Nov 2026; demand letters now under a quarter of it), Eve ($1B, Sept 2025,
  about 2,000 firms), Supio (agentic platform and intake suite, May 2026).
* Immigration: Parley has an RFE response builder (on request). Docketwise has "Docketwise IQ"
  writing help; LollyLaw's site does not mention AI. No proactive immigration case agent found.
* The bigger move: AI native law firms that sell the finished legal work, not seats. Manifest OS
  ($60M Series A at $750M, April 2026, Menlo, Kleiner, First Round, Quiet; runs "Manifest Law" under
  Arizona's ABS, focused on business immigration; fixed fee and outcome based pricing). LegalOS (YC,
  launched Feb 2026; O-1, EB-1A, NIW, H-1B, L-1, TN; 24 agents, attorney reviews every filing;
  "filing ready in 48 hours"; self reported 100 percent approvals "so far"). Others: Eudia (Arizona
  ABS), Lawhive ($60M Series B, consumer), Justpoint (mass tort, Arizona ABS), Garfield (SRA, UK),
  Superlegal (Utah sandbox), Crosby, Norm Law, Blackletter Legal ($6M seed, Nov 2026, through an MSO).
* Read for Ismael: proactivity alone is not a moat (Clio ships it; Harvey and Legora can add a trigger).
  What escapes "wrapper" is owning the system of record (Clio), outcome data (EvenUp) or the outcome
  itself (AI native firm). The proactive version of Lincoln for business immigration already exists as
  funded AI native firms. Selling the outcome to founders and companies also fits his reach rule
  (buyers search and buy themselves), but needs licensed lawyers and an ABS or MSO structure.

## Immigration AI tools and data sources (checked 2026-11-12, for the "Lincoln autopilot" idea)
* Drafting and case tools already selling to immigration firms: Parley (RFE response builder, receipt
  tracking, a USCIS case status product in beta), Visalaw.ai (petition and recommendation letter drafts),
  Inception, Lexfill, Neutrinet (missing evidence lists), Imagility (OCR to forms), US Immigration AI
  (client portal with upload reminders), Docketwise IQ. Mostly vendor claims.
* USCIS runs an official developer platform (Torch, developer.uscis.gov) with a Case Status API: OAuth
  client credentials, sandbox first, production access requested separately. Eligibility for law
  firm products not published.
* AAO non precedent decisions are public on uscis.gov. MeritDraft already indexes them (says 25,777
  decisions; 4,549 EB-1A, 286 O-1A); a community dataset exists on Hugging Face.
* Not found anywhere: a tool that contacts third parties itself (referees for letter sign off,
  translators) and runs a case over months from signed retainer to decision. Unverified that none does.

## Everything a US immigration firm does (reference map, 2026-11-12, from general knowledge of the field)
Firms usually specialise: business immigration (employers pay, higher fees, deadline heavy) or
family, humanitarian and removal defence (individuals pay, lower fees, higher volume). Many small
firms mix the second group.
* Temporary work visas: H-1B (cap registration, petitions, extensions, transfers, amendments), L-1A
  and L-1B (including blanket L), O-1A and O-1B, TN, E-1, E-2, E-3, H-1B1, H-2A and H-2B, P, R-1,
  J-1 and its waivers, advice on F-1 OPT and STEM OPT.
* Employment green cards: PERM labour certification (prevailing wage, recruitment, ETA-9089), I-140
  (EB-1A, EB-1B, EB-1C, EB-2, EB-2 NIW, EB-3), I-485 or consular processing, work permit and advance
  parole, Visa Bulletin priority date tracking, job portability. EB-5 investor petitions.
* Employer compliance: LCAs and public access files, I-9 and E-Verify audits, site visits, layoffs
  and grace periods, mergers and acquisitions due diligence, tracking every employee's expiry dates.
* Family: I-130, K-1 fiancé visas, adjustment of status with I-864, removal of conditions (I-751),
  consular processing, waivers (I-601, I-601A, I-212), VAWA.
* Citizenship and green card upkeep: N-400, N-600, I-90, re-entry permits.
* Humanitarian: asylum (affirmative and in court), withholding and CAT, I-730, TPS, DACA renewals,
  U visas, T visas, SIJS.
* Court and appeals: removal defence in immigration court (hearings, cancellation of removal, bond),
  motions to reopen, BIA appeals, federal court (petitions for review, habeas, mandamus suits for
  delayed cases), AAO appeals and I-290B motions, RFE and NOID responses, FOIA requests for a
  client's record, advice to criminal defence lawyers on immigration consequences.
* Running the practice: consultations and intake, conflict checks, engagement letters, flat fee
  billing and trust accounting, multilingual client updates, translations, document collection,
  forms, fees and filing, receipts, biometrics and interview prep, case status, policy changes.
Read for Lincoln: the legal content differs by case type, but the engine (intake, chasing documents
and third parties, translations, forms, dates, USCIS status, RFEs) is shared by nearly all of them.
Court appearances need a lawyer in the room; Lincoln could only prepare for them.

## Pre-seed money sizes (checked 2026-11-12)
* US pre-seed (Carta, Q2 2026): $3.19B across over 11,500 SAFEs and notes; common round bands are
  $250k to $1M and $1M to $2.5M; caps around $10M to $15M (2025 figures cited in 2026 guides).
* Enterprise Ireland Competitive Start Fund: up to €50,000 equity per company (2026 rounds of €1m
  each, All Sectors and Women Entrepreneurs); 10 percent equity per a third party listing, unverified.
* YC standard deal: $500k ($125k for 7 percent plus $375k on an uncapped MFN SAFE). W27 deadline was
  2 November 2026.

## Enterprise Ireland New Frontiers (pasted 2026-11-12)
* Equity free programme run by technological universities in 18 locations. Phase 1 part time; Phase 2
  full time for six months with a €15,000 tax free stipend, competitive entry; support valued at over
  €40,000.
* Applicants must be over 18 and based in Ireland. Ismael is not eligible until 18. A parent applying
  in his place would be a fake founder (hard limit). Only one co-founder can take part, so a genuine
  adult co-founder could apply for the company.
* Taking it rules out some other state supports (PSSF cancels the allowance; only one of several
  feasibility style supports at a time); total funding over €100,000 removes the allowance.

## Local Enterprise Office Feasibility Grant (pasted and checked 2026-11-12)
* Up to 50 percent of eligible costs (60 percent in the BMW region), at most €15,000. So €15,000
  needs €30,000 of spending in Dublin. Eligible headings: market research, consultancy, technical
  development or prototype, salary or own labour, miscellaneous.
* Business must be registered and operating in that LEO's area, at most 10 employees, manufacturing
  or internationally traded services (software sold to US firms should fit), and must "demonstrate a
  market". No age rule on the page; directors must be 18, so a parent's company would apply.
* Payment method not stated on the page (check with the LEO). Taking it counts against later state
  supports: New Frontiers allows only one feasibility style support, and earlier feasibility money for
  the same project only keeps the stipend if it moves the project to a new stage.
* Best use if ever taken: paying an immigration lawyer to review outputs, and an outside security review.

## Small, non VC money open to Ismael now (checked 2026-11-12)
* Emergent Ventures (Mercatus, Tyler Cowen): grants, no equity, applicants 13 or older, global, one
  online form, reply in about a week (per a guide), amount not published and project specific. Teen
  grantees aged 16 and 17 in the 58th cohort (Aug 2026).
* 1517 Fund Medici grant: $1,000, no strings, for high school students, college students and
  dropouts on ambitious projects; rolling applications by email.
* Patch (Dublin, ages 16 to 21): summer programme early July to mid August, full time, accommodation,
  meals and a needs based stipend; 2027 applications likely close early March; grants open all year
  (amounts not found).
* Running cost credits: Anthropic's Claude for Startups page says the cohort is full and closed to new
  applications (as of 30 Oct 2026). AWS Activate Founders gives $1,000 to self funded companies with a
  website; whether it covers Claude on Bedrock is not confirmed.
* None of these is VC, so the "no VC before revenue" rule does not block them. Grants to a minor
  would likely be paid through a parent. They cover building and running costs, not real ad budgets.

## Pasted Google AI list of no equity grants, checked 2026-11-12 (each site fetched)
* Fit Lincoln now: Solo Grants ($100 to $1,000 sized to a budget, any age, anywhere, no equity;
  merge.club redirects to it), Bagel Fund (501(c)3, $100 to $500, reply within 48 hours), Inflection
  Grants (Edge City with Long Journey Ventures, $2,000, under 25), 1517 Medici ($1,000), Magnificent
  Grants ($10,000+ over two years, under 25, rolling, about one grantee a month, written application
  then in person interviews, no equity, no product needed), plus Emergent Ventures (above).
* Bigger: Thiel Fellowship is now $250,000 over two years, 22 or under with no degree, no minimum age
  stated, no equity, but fellows must leave school if selected. O'Shaughnessy (OSV) Fellowships up to
  $100,000 equity free, 2026 applications closed 30 April; site says "open to adults" but mentions a
  13 year old applicant.
* Not for Lincoln: 776 Fellowship (climate, 18 plus), Unitary Fund (quantum), Impetus (longevity),
  NLnet (open source internet), ACX and Manifund (public goods, AI safety), Awesome Foundation
  (community ideas).

## Emergent Ventures application rule (official page, pasted 2026-11-12)
* "Emergent Ventures no longer accepts AI-written applications. We will test all submissions and
  reject those using AI for anything other than proofreading." Ismael must write it himself; Claude
  may only proofread. One application per applicant and project. No feedback or status updates.
* Focus: "zero to one" ideas that "meaningfully improve society"; minimum age 13.

## Founder equity and control across rounds (2026-11-12, rules of thumb, not legal advice)
* Typical dilution: YC about 7 percent plus its $375k SAFE converting later; employee option pool
  about 10 percent; seed about 15 to 20 percent; Series A about 20 percent. A solo founder often holds
  about half after Series A.
* Control sits in the board and investor veto rights, not only share count; a board can replace the
  CEO. Standard terms to expect: 1x non participating liquidation preference, four year founder vesting
  with a one year cliff. Terms to refuse or question: more than 1x or participating preferences, full
  ratchet anti dilution, investor board control at seed.
* Protections: standard documents (YC post money SAFE, NVCA models), the company's own startup lawyer,
  references from an investor's other founders, a parent involved, no signing under time pressure.
  A minor's shares are usually held by a custodian until 18; set up so they are legally his.

## Free places lawyers look for software (checked 2026-11-12)
* Legaltech Hub: free Basic listing, vendor account, reviewed by their curation team, live within
  about 5 days; paid enhanced listings add screenshots and video.
* LawNext Legal Technology Directory: basic listings free.
* Stanford CodeX Tech Index lists legal tech companies (Visalaw and Parley are there).

## Harvey and Legora funding rounds (checked 2026-11-12; aggregator figures, some disputed)
* Harvey: seed $5M led by OpenAI Startup Fund (Nov 2022); about $21M to $23M (Apr 2023); $80M at $715M
  (Dec 2023, Elad Gil and Kleiner Perkins); $100M at $1.5B (Jul 2024); $300M at $3B (Feb 2025); $300M
  at $5B (Jun 2025, Kleiner and Coatue); €50M from EQT (Oct 2025); $160M at $8B (Dec 2025, a16z);
  $200M at $11B (Mar 2026, GIC and Sequoia); $550M at $15.5B (Sep 2026, Diffusion and Lightspeed).
* Legora: seed about $10.5M (Benchmark, 2023 to 2024); Series A $25M (Jul 2024); B $80M at $675M
  (May 2025, ICONIQ and General Catalyst); C $150M at $1.8B (Oct 2025, Bessemer); D $550M at $5.55B
  (10 Mar 2026, Accel) plus $50M (Apr 2026); E $550M at $8.8B (21 Oct 2026, Atreides). Legora
  reportedly $100M ARR in April 2026 (Sacra estimate).
* Big Law adoption 2026: Baker McKenzie rolling out Legora; HSF Kramer uses Legora and Harvey; Slaughter
  and May firm wide on Harvey; Hogan Lovells Cadwalader on Harvey. Many firms contract with both.
* Immigration specialists: BAL markets its own immigration AI platform; nothing found on Fragomen using
  Harvey or Legora.

## Direct immigration competitors to the autopilot (checked 2026-11-12, after a pasted outside review)
* ICM Desk (ACFC Global LLC, Boynton Beach, Florida; icmdesk.com): "Case Agents" that work each step
  with autonomy the firm sets (Suggest, With approval, Safe steps only), read and classify each upload,
  draft from "playbooks written per visa type", "Every claim cites the source it came from", judgement
  calls go to attorneys. Price: $6 to $16 a seat a month, one time per case fee from $80, AI at cost.
  Vendor claims only; no independent reviews found. Closest thing to Lincoln found so far.
* Docketwise (owned by MyCase, part of 8am): $80, $100, $120 a user a month yearly ($90, $120, $140
  monthly); Pro and Advanced include "DocketWise IQ" AI writing and document assistance. Open API since
  2020 (OAuth, access by request to dev@docketwise.com).
* LegistAI: about $60 Standard, $70 Premium a user a month (aggregators, Sept to Oct 2026); USCIS form
  automation, RFEs, client portal, billing; daily AI usage caps.
* Prima.Law: core licence $49 yearly, $54 monthly a user; AI add ons priced separately.
* INSZoom (Mitratech): Capterra lists from $250 a user a month (unverified).
* AILA: "18,000+ U.S. lawyers" on its site; its 2026 media kit says 16,000.
* Harvey (25 Mar 2026): over 25,000 custom agents, "most of the Am Law 100"; the "80 percent" figure
  in the pasted review was not found.
* Price gap: Lincoln at $199 to $299 a user is about 2 to 4 times Docketwise and far above ICM Desk.
  At the BLS median legal services paralegal wage ($61,770, about $29.70 an hour), $249 a user equals
  about 8.4 paralegal hours a month: the minimum saving per user Lincoln must prove.

## Filevine and "autonomous software" (LinkedIn post 30 Oct 2026, pasted by Ismael; checked 2026-11-12)
* CEO Ryan Anderson at LEX Summit: "2027 will be the year of autonomous software." "Agents wait for
  you to ask, to prompt, but autonomous agents notice." LOIS reads a motion arriving in Outlook (via a
  Filevine Outlook MCP), LOIS for Word drafts the opposition from the firm's past cases in its own
  pleading format, and a task waits in Filevine for review. "Work that starts before you ask, built on
  the structured case data your firm already runs on."
* Filevine: $400M financing in Sept 2025 including a $260M Series E, valuation about $3B (aggregators,
  disputed). Has an immigration product, "ImmigrationAI"; immigration workflows billed on usage
  (Sacra). Acquired Pincites in Jan 2026 for LOIS for Word.
* Read for Lincoln: "starts before you ask" is becoming standard in 2027, not a differentiator; it also
  confirms that the autonomy is built on owning the firm's case data.

## How legal software got firms to switch (checked 2026-11-12)
* Harvey: Allen & Overy trialled it in beta from Nov 2022; about 3,500 lawyers asked around 40,000
  queries; firm wide rollout across 43 offices announced Feb 2023. Harvey did not replace any system:
  it sat beside Word and the document system. Onboarding is staffed by former lawyers ("legal
  engineers") and forward deployed engineers who run training and adoption; Sacra estimates about 10
  percent of staff are ex lawyers (unverified).
* Legora: pilots then firm wide rollouts (Mishcon de Reya); projects link to iManage matters.
* Clio (a real switch of case software): free data migration for many common systems, including
  spreadsheets and paper; past "Break Free" offer of up to 6 months free to cover a firm's remaining
  contract with its old vendor (ended 30 June 2024). Paralegals warn to check documents are included.
* Read for Lincoln: Harvey and Legora were additions, not switches. Lincoln asks for a switch, so it
  needs Clio style help: done for you migration, documents included, new cases first, old contract
  covered.

## Fundraising facts for the plan (checked 2026-11-12)
* Sean Ellis test: ask active users how they would feel if they could no longer use the product;
  40 percent or more "very disappointed" is the usual product market fit benchmark (secondhand,
  correlation only; pair with retention). Superhuman went from 22 percent to 58 percent.
* YC: Paul Graham (via Fortune, Sept 2025) said YC typically does not consider anyone under 18 who
  cannot legally enter contracts. YC also has Early Decision for students.
* a16z speedrun: up to $1M (reported $500k up front plus $500k follow on), no board seats, solo
  founders can apply but teams preferred; SR007 closed 17 May 2026, SR008 deadline 1 Nov 2026.
* Carta: solo founders were about 36 percent of new startups in 2025 but about 17 to 20 percent of
  VC backed companies or rounds; solo led companies got 14.7 percent of priced round cash (2024).
* Legal tech funding: record $4.6B in 2025 (Crunchbase); about $2.3B in Q1 2026, of which about 63
  percent went to Relativity, Legora and Harvey (Legalcomplex).


## Devices lawyers work on (checked 2026-11-13)

ABA Legal Technology Survey, via secondary write ups: in 2021, 53 percent of lawyers said a laptop was their
primary work device and 44 percent a desktop; in 2022, 56 percent laptop and 41 percent desktop. Smartphones
are secondary: 22 percent use one regularly for legal research and 32 percent occasionally (2022), though 81
percent use one in court. Clio's own research (LawNext) found its mobile app is used in one to three minute
blocks. No source found for immigration lawyers specifically or for AI tools; no 2024 to 2026 ABA figures
found. Conclusion for Lincoln: desktop first for reading files and reviewing drafts; the phone for short
approvals and notices.
Sources: https://www.americanbar.org/groups/law_practice/resources/tech-report/2022/practice-management/ ,
https://www.mycase.com/?p=16749 , https://www.iphonejd.com/?p=303 , https://www.lawnext.com/?p=13460

## Removing "unverified app" warnings (checked 2026-11-14)
* Google: Gmail and Drive read scopes are restricted, so the warning and 100 user cap stay until an annual
  CASA security assessment passes. Tier 2 lab prices (a comparison labelled "as of 2024", switchlabs.dev):
  TAC Security $540 basic, Leviathan $800 to $1,200, NetSentries $900 to $1,500, NCC Group $1,200+,
  Bishop Fox $1,500+; Tier 3 about $4,500 to $8,000+. The lab sends Google a Letter of Validation.
  Renewed every year. Sending only (gmail.send) is a sensitive scope and does not need CASA.
* Microsoft: no paid assessment. Publisher verification is free: a Microsoft AI Cloud Partner Program
  account for the company (verified business details and an email on the domain), linked to the app
  registration, plus the publisher domain file (served by Lincoln at /.well-known/). Optional Microsoft
  365 Certification is a further audit, not needed to remove "unverified".

## 30 Reddit threads on Harvey, Legora, Claude and adoption (pasted 2026-11-14)
Sources: r/legaltech, r/biglaw, r/sales, Sept 2025 to Nov 2026. Comments, not verified facts; many
commenters are vendors, some posts read as AI written, none are immigration lawyers specifically.
* Most repeated verdict: Harvey and Legora are chat plus upload; lawyers say Claude or ChatGPT with
  projects and skills does the same for $25 to $125 a seat (Claude Team or Enterprise). The anchor a
  small firm has in mind is that price, not case software.
* What two commenters say does not exist yet is Lincoln's thesis: "An email comes into my inbox with an
  updated deadline... the entire workflow process is seamlessly kicked off in an autonomous fashion...
  The process automation isn't there now in any meaningful way." A practice software builder: the hard
  part is "making the system underneath smart enough that the AI isn't guessing" (matters, deadlines,
  contacts, documents linked). Several: systems of record survive because labs will not become databases.
* Adoption: lawyers ignore tools they must prompt or build flows for ("Is the problem that you are
  expected to become a prompt engineer?"). Advice from adoption people: start with one task they dislike.
* Harvey complaints: no memory across a matter (reupload every time); routes the real work to cheaper
  models while the chosen model only writes the final output (Harvey help page "multi-model", per a
  commenter); "lazy" ("type continue if you want me to read all the documents"); opaque pricing that
  differs per customer; minimums (one report: $30k start, about $1,200 a seat, 100 seats) and no time
  for small firms. Half of US lawyers are solo or small firm.
* AI faults lawyers name: risk spotting "like a 1L gunner" (every risk, no sense of size), too quick to
  accept fault and easy to lead, verbose prose they can spot ("Claudeslop"), fluent text without sources
  (then they reread the original and decide AI saved nothing), missed facts that change the answer
  (one intake line that disqualified a matter was missed by every tool except Opus at max effort).
* Errors: omissions are the hardest to catch (several independently). Patterns that work: separate passes
  (extract, validate, correct, assure), one pass only for what is missing and one only for
  contradictions, an adversarial reviewer agent with a written protocol, two models checking each other,
  abstention ("I don't know"), and calculations done in code ("computers are good at math, just not LLMs").
* Trust: every line linked to the page it came from makes review a spot check. Keep extracted candidates
  with sources apart from the reconciled value; show conflicts instead of overwriting. Keep a record per
  output: sources, model and prompt version, date, reviewer, sign off. Firms stay liable (clients refuse
  non reliance carve outs), so a documented method is how they defend the standard of care.
* InfoSec and client opt outs come down to three questions: do you train on our data, how long do you
  keep it, who are your subprocessors. Security reviews then ask where every copy of the text lives
  (OCR, search index, logs, crash reports, backups).
* Word: "If the output isn't tracked changes in the document the lawyer already has open, most lawyers
  won't use it." Firm voice: lawyers build style guides from their own past work; biggest quality jump.
* Costs (one litigator's runs of Harvey's open benchmark tasks, 77 to 137 page contract reviews): about
  $2 to $11 a task on Opus 4.7 and 4.8 depending on effort. Estimate (one tweet): Harvey uses 13 trillion
  tokens a month. Per seat vendors are squeezed as usage grows and are suspected of throttling; one
  founder argues for per unit pricing (per patent drafted) instead.
* Harvey's open benchmark (LAB): criticised for all pass grading, noisy LLM judges, synthetic tasks,
  judges not given the source documents. Lawyers trust tests they can read.
* Pilots: run on finished matters where the right answer is known (counts misses, not only fixes),
  measure corrections per document over time, write the stop criteria first. What sells most is that
  comparable firms already use it (cannot be faked).
* Revenue reporting: Harvey and Legora criticised for "contracted ARR" with opt outs; Harvey says the gap
  is about 5 percent. Harvey reported $400M ARR and a $15.5B valuation (Sept to Oct 2026, per the
  subreddit moderator).
* Why Harvey is valued so highly despite the hate (from the same threads): buyers are not users ("The
  people that choose software at biglaw are not the people using it"); risk averse partners pick the safe
  consensus choice; fixed term contracts and slow procurement keep it in place; some partners hold stakes;
  investors bet on a lab buying it; real revenue ($400M ARR, about 40 percent in house per one comment);
  some users do like it (vaults for discovery, transactional drafting). Reddit over represents builders.
* Read for Lincoln (2026-11-14): the clearest gap is work that starts itself on the firm's own case
  record, for small flat fee firms in one practice area, where lawyers will not build their own flows.
  The moats commenters name are being the system of record (switching cost), each firm's own playbook and
  feedback, domain verification machinery and evals, distribution and trust. Lincoln has none yet; they
  only form once firms run real cases in it. Features alone are copyable (ICM Desk, Filevine).
* Full text of the 30 threads, verbatim: `docs/reddit/2026-11-14-legal-ai-threads.md`.

## Gabe Pereyra (Harvey co-founder, u/Gabe_HarveyAI) in those threads (Aug to Sept 2026)
Replies in the Tenet launch thread and the "make Harvey more engaging" thread. His own words, not verified.
* Tenet (post-trained Kimi K3): cost is "part of it but also performance" and "sovereign AI (will help
  us help law firms building their own AI)". Claims it beats "most frontier models at a better price
  point", bigger gap on specialised tasks. Training data: synthetic data reviewed by lawyers plus human
  lawyer data; argues frontier labs train on synthetic data too.
* Grounding: Lexis partnership plus Harvey's own caselaw; "Much of the grounding our users care about
  comes from their internal data not just caselaw."
* Concedes integration and governance "matter much more than slightly better model performance".
* Concedes the benchmark rubric can miss an invented citation it does not list; says they also use
  human evaluation (a commenter found no public documentation of it). Compares to BLEU: "benchmarks
  don't have to be perfect to be useful."
* Building private evals with law firms, "eventually on live work".
* "We are working on expanding the product to smaller firms!" A threat to Lincoln's small firm gap.
* "We have a big UI change coming soon"; Harvey is "consumption based pricing now".
* Asked critics openly for advice ("Curious what you would recommend we do re data?").
* Also in the threads: a Harvey employee (u/sknaruto) offering to build DMS integrations for a firm, and a
  Harvey AMA by Winston Weinberg and Gabe in r/legaltech (about May 2026; $300M ARR then).
