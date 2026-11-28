# Search and AI search: getting "Lincoln AI" to show Lincoln

Goal (Ismael, 2026-11-25): win "Lincoln AI" and "Lincoln legal AI" first, then be one of the meanings an AI answer offers
for plain "Lincoln" (next to Lincoln Motor and Abraham Lincoln). Funding news and a handful of firms make "Lincoln AI"
winnable; until then these steps give Google and AI tools a clear, consistent picture of the company.

## Done on the site (2026-11-25)

* uselincoln.com and uselincoln.com/start are open to search engines (they were set to "don't index" while the page was
  a draft). The app (app.uselincoln.com and Render's own address) stays closed to them.
* Terms and Privacy stay closed until the company's legal name and address replace the placeholders in
  `lincoln/src/lib/company.ts`; then add them to `PUBLIC_PAGES` in `lincoln/src/lib/seo/site.ts` and robots.txt.
* `robots.txt` names and welcomes the AI search crawlers (OpenAI, Google, Perplexity, Anthropic, Apple, Bing and others).
* `sitemap.xml` lists the public pages. `llms.txt` is a plain summary of Lincoln for AI tools.
* The landing page carries structured data (schema.org WebSite, Organization, SoftwareApplication): name Lincoln,
  also known as Lincoln AI and Lincoln Legal AI, legal AI for US immigration law firms. Its `sameAs` list holds the
  official profiles; add each new profile's address to `PROFILES` in `lincoln/src/lib/seo/site.ts`.
* Everything said to search engines lives in `lincoln/src/lib/seo/site.ts`, so it stays the same everywhere.

## Needs a person (an account in your name or a parent's)

### 1. Google Search Console (first, 10 minutes)
1. search.google.com/search-console, Add property, choose "Domain", enter uselincoln.com.
2. Google shows a TXT record; add it at the domain registrar's DNS settings. Verify.
3. Sitemaps, enter `https://uselincoln.com/sitemap.xml`, Submit.
4. URL Inspection, enter `https://uselincoln.com/`, Request indexing.
Bing Webmaster Tools (bing.com/webmasters) can import the same site from Search Console in one click; ChatGPT search and
Copilot use Bing's index.

### 2. Profiles: the same name and words everywhere
Use these exactly, so Google and AI tools see one company:

* Name: **Lincoln**
* Website: **https://uselincoln.com**
* One line (under 100 characters): **Legal AI for US immigration law firms.**
* Short description: **Lincoln reads the firm's email and client files, opens and works each case, fills the forms,
  drafts petitions and RFE responses cited to the evidence and the law, and keeps every deadline. Nothing is filed or
  sent without an attorney's approval.**
* Category: Legal software, Legal AI, Immigration law
* Email: hello@uselincoln.com

Where, in this order:
1. **LinkedIn company page** (needs a personal LinkedIn account to create it; LinkedIn's minimum age is believed to be
   16, so a parent or guardian may need to create it and add Ismael as admin later).
2. **Crunchbase** (free organisation profile; where funding news is recorded later).
3. **G2** and **Capterra** (free vendor listings in Legal software; reviews only from real customers, never asked for
   in exchange for anything).
4. **Product Hunt** (a launch day, once the site is ready to be judged).
5. **Legaltech Hub** directory (legaltechnologyhub.com, vendor listing).
After each one exists, send the address and it goes into the site's structured data.

## Next on the site
* Guides that answer what immigration lawyers search and ask AI tools ("how to respond to an EB-1A RFE", "I-485
  evidence checklist", "Lincoln compared with Docketwise"), written from Lincoln's rulebooks and law library and
  checked against the regulation before publishing. AI search quotes pages that answer the question directly.

## Never
* No fake reviews, no planted Reddit or forum posts, no Wikipedia page written by us (it gets removed and breaks the
  rules in CLAUDE.md). A Wikipedia article comes when independent press exists.
