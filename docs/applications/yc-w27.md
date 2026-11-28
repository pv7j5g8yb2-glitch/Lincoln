# YC Winter 2027 application (late, drafted 2026-11-28)

Drafted by Claude from Ismael's Z Fellows answers (`z-fellows.md`) and the facts in `docs/STATE.md`. Ismael edits
before submitting. Lines marked CHECK need his confirmation.

## Founders
**Who writes code, or does other technical work on your product? Was any of it done by a non-founder?**
I write all of it, with AI coding tools (Claude Code). No one else has worked on the product.

**Are you looking for a cofounder?**
Open to it, but not actively looking. The first hires I'm planning are a Head of Sales from legal tech and an immigration attorney.

## Company
**Company name:** Lincoln

**Describe what your company does in 50 characters or less:** Autonomous AI for immigration law firms

**Company URL:** https://uselincoln.com

**Demo:** https://youtu.be/YlyrsqE3Z9Q

**What is your company going to make?**
Lincoln is an AI platform that works US immigration cases for law firms without being prompted. It connects to the firm's email, Google Workspace or Microsoft 365. When a client writes in or fills in the firm's intake link, Lincoln opens the case, reads every document attached, finds issues and deadlines, drafts the client emails, support letters and evidence maps, and fills in the USCIS forms. The attorney only reviews and approves. It covers 237 immigration case types, and every fact it writes is cited to the page it came from.

**Where do you live now, and where would the company be based after YC?** Dublin, Ireland / San Francisco, USA

**Explain your decision regarding location.**
Every customer is a US immigration firm, the investors and the people I want to hire are in the US, and the law Lincoln works with is US federal law. I can travel and stay on my own.

## Progress
**How far along are you?**
The product is built and works end to end on public documents and made up cases: mail from Gmail and Outlook is sorted into the right case, files of any length are read, drafts come out with page citations, and USCIS forms are filled. I tested it against ten real USCIS appeal decisions across ten case types, and it reached 90% of the findings USCIS itself made, with no serious error. No firm uses it on real cases yet. Next is the security minimum for client files and the first firms.

**How long have each of you been working on this? How much of that has been full-time?**
Since 9 November 2026. CHECK: I'm in Transition Year at school, so I work on Lincoln most afternoons, evenings and weekends, about [X] hours a week.

**What tech stack are you using?**
Next.js and React in TypeScript, an encrypted SQLite database, hosted on Render. Anthropic's Claude (Sonnet for legal work, Haiku for sorting mail) through the API, compared against other providers on graded cases. Google Workspace and Microsoft Graph APIs, Word and Outlook add-ins, pdf-lib for USCIS forms, docx, ExcelJS and pptxgenjs for exports. I build with Claude Code.

**Are people using your product?** No

**When will you have a version people can use?**
It's usable now. Firms start on real cases once the security minimum is in place, in early 2027.

**Do you have revenue?** No

**If you are applying with the same idea as a previous batch...** (leave blank, first application)

**Incubator or accelerator?** None.

## Idea
**Why did you pick this idea? Do you have domain expertise? How do you know people need what you're making?**
An immigration case is weeks of paperwork: reading dozens of documents, chasing clients for the missing ones, filling USCIS forms, mapping evidence to the criteria, drafting letters and RFE responses. I'm not a lawyer, so before building anything I read what hundreds of lawyers say about today's legal AI in their own words, across 30+ public forums. The same complaint comes up again and again: the tools still need someone to notice the work, upload the files and ask the right question. Lincoln does exactly what they say they wish the others did. I also test it against real USCIS decisions, because lawyers check everything.

**Who are your competitors? What do you understand that they don't?**
Harvey and Legora are general legal AI. In the 30+ public forums I've read, lawyers repeatedly call them wrappers that still require users to prompt and explain tasks. Clio and Docketwise store cases but do none of the work. Eve offers autonomous AI but for plaintiff firms. No one I've found does it for immigration firms, and these competitors prove the demand is there. What I understood is that firms don't want another hot new AI tool to learn. That's why Lincoln does the boring work for them.

**How do or will you make money? How much could you make?**
One monthly price per firm, set by caseload, with unlimited users: $1,500 a month under 10 new cases, $3,500 for 10 to 50, $7,500 for 51 to 100, $13,000 for 101 to 200, about $65 a case above that. The AI cost of a full case in testing was $1.37. There are 16,000+ immigration attorneys in AILA; at about three attorneys a firm that's roughly 5,000 firms, and at an average of $3,500 a month that's about $210M a year in US immigration alone (an estimate). After immigration, the same engine works for every practice area that runs on documents, clients and deadlines.

**Other ideas you considered:** (leave blank)

## Equity
**Have you formed ANY legal entity yet?** No

**Planned equity ownership:**
100% to me as founder and CEO, with an option pool for the first hires. Because I'm 15, a parent will be the legal owner of the company and sign for it until I can.

**Have you taken any investment yet?** No

**Are you currently fundraising?** Yes

## Curious
**What convinced you to apply to Y Combinator?**
CHECK, in his own words. Suggestion: YC backs founders before they have proof, and Legora, the company closest to what I'm building, went through YC.

**How did you hear about Y Combinator?** CHECK. Suggestion: Online, it's where most of the companies I study started.

## Batch preference
Winter 2027

## Founder video (one minute, phone, one take, no slides)
1. "I'm Ismael, I'm 15, I'm in school in Dublin, and I build software." (5 seconds)
2. "I built Lincoln, an AI platform that works US immigration cases by itself. It connects to the firm's email, opens the case when a client writes in, and drafts the forms, letters and replies. The attorney just approves." (20 seconds)
3. "Immigration firms drown in paperwork, and every AI tool they have still waits to be prompted. I wanted one that does the work." (15 seconds)
4. "My first version lost a blind test against plain Claude. I scrapped it and rebuilt it. Tested on ten real USCIS decisions, it now reaches 90% of what USCIS found." (20 seconds)
