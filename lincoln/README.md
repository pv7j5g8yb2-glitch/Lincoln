# Lincoln app (first draft, 2026-11-13)

The first working version of Lincoln: an immigration case platform for US law firms. The plan it
follows is `../docs/LINCOLN-V1.md`.

## Run it

```
npm install
node scripts/render-pages.mjs   # page images for the made up demo case
npm run dev                     # http://localhost:3210
```

"View the sample workspace" on the sign in page opens a made up firm. "Reset" in the sidebar puts it
back. "Create one" makes a real account with its own empty workspace.

## What works today

* Today: what needs you, what Lincoln did, dates coming up, who each case is waiting on.
* Cases: 12 made up cases across the kinds of immigration work. One is complete (Dr. Réka Halász,
  O-1A, from `../demo/o1-halasz`): 37 documents read from a 52 page file, 13 issues, evidence graded
  against the eight criteria.
* Approvals: decide, don't proofread. Ten strategy decisions with the evidence attached; the support
  letter is then built from the answers (a criterion is argued only if the attorney said yes).
* The letter: facts linked to the page they came from (hover to see the page), judgement calls
  highlighted, notes for the attorney in red, "show only what needs you", export to Word.
* Demo world: four events from outside (client email, referee letter, USCIS Request for Evidence,
  receipt notice) and what Lincoln does about each.
* Inbox, Lincoln report (time saved, estimate), Library, Integrations (roadmap), Settings.
* Accounts: sign up, sign in, sign out and password reset. Passwords are scrypt hashes; session and
  reset tokens are stored only as SHA-256; repeated attempts are limited.
* Privacy Policy and Terms of Service at `/privacy` and `/terms`. Company details come from
  `src/lib/company.ts` and are placeholders until the company exists.

## What is scripted, and what is not built yet

* The demo case was read ahead of time and its data is stored in `src/lib/halasz.ts`. Lincoln does not
  yet read a new file live inside the app. That needs a model connected (`src/lib/llm.ts`).
* The Assistant chat is wired to the model client but has not been tested against a live model.
* Outside events are played by a button, not by a real inbox or USCIS.
* Sign in with Microsoft or Google, real email, e-signing and imports are not built. With no mail
  provider connected, the password reset link is shown on screen instead of being emailed.
* The standard task times behind the Lincoln report are placeholders.

## Security: where it stands

In place: every row carries its firm and every query filters on it (`src/lib/queries.ts`); pages of
client documents are served only to a signed in member of the firm; sessions sit in an httpOnly
cookie; the model key stays in `.env.local` on the server and out of git.

Not in place yet (all required before any real client file): database level separation with a key
per firm, two step sign in, encryption at rest, an outside security review, a signed data agreement.
**Made up cases only until then.**

## Model key

`.env.local` (never committed):

```
LLM_API_KEY=...
LLM_BASE_URL=...   # the provider's OpenAI style address
LLM_MODEL=...
```

## Deploy on Render

`../render.yaml` describes the service (name `lincoln`, so the address is `lincoln.onrender.com` if the
name is free). Steps for the account holder (a parent or guardian):

1. Create a Render account, then New, Blueprint, and connect the GitHub repository (branch
   `claude/amazing-noether-92ry61`, or merge it to main first).
2. When asked for `LLM_API_KEY`, paste the model key there. It is never stored in git.
   For a personal login in the sample firm, also set `SEED_USER_EMAIL`, `SEED_USER_PASSWORD` (10
   characters or more) and `SEED_USER_NAME` in the Environment tab. They are read when the database
   is first created.
3. Deploy. The Starter plan and its 1 GB disk keep accounts and decisions between restarts.
4. Sample pages ship in `seed/pages` (made up documents), so no extra build step is needed.

Do not put real client files on this service until the security minimum in `../docs/LINCOLN-V1.md` is met.
