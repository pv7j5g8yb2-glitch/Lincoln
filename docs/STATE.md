# Where things stand (read this at the start of every session)

Last updated 2026-10-19. CLAUDE.md holds the rules; this file holds the current state, what is
in flight, and the small details that are easy to lose. Update it whenever something here changes.
The repo is public: never put passwords, keys, the admin password, the ntfy topic or anything
personal in here.

## Repo

* Default branch (set by Ismael, 2026-10-19): `claude/exciting-wright-8ml9uc`. Everything Hopkins
  lives here, and Render deploys the waitlist from it. Work and push on this branch.
* Other branches are from before Hopkins. `claude/focused-hawking-caz4gv` holds the DEIZ booking
  platform (the only copy); ask Ismael before deleting it.

## Working with Ismael

* He posts 2 reels a day on @gethopkins, Irish morning and Irish afternoon (suggested 1pm and 6pm
  Irish time). He asks for new reels about a day before the queue runs out. Quality at volume.
* He wants things done, not asked about. Push without asking (see CLAUDE.md). Don't make him repeat
  himself: when he states a preference, write it into CLAUDE.md, the playbook or this file.
* He gets frustrated by wasted rounds. Before sending anything, check it yourself (stills, timing
  checks, the real page). Never ship a guess and ask him to test it.
* He is on Claude Pro with a weekly limit. Keep sessions short and focused: one job per session,
  batch reel requests, medium effort for routine reel making, high effort for building and debugging.
* Never store, repeat or use his Instagram password. No outreach on his behalf.
* Business accounts that need an adult or a registered business (Meta business verification,
  Stripe, Apple developer programme) go in a parent's or the registered business's name.

## @gethopkins on Instagram

* Bio leads with the chat ("like ChatGPT, for real estate marketing"), never agency wording.
* Posted so far: Reel 1 (5 settings) and Reel 4 (views but no enquiries). Reel 4: 84 views, 98.8%
  non-followers, 83% from the Reels tab, average watch 2s, skip rate 92.7%. Reel 1: about 11 views.
  Lesson logged in the playbook: the first second was the problem.
* Queue, in this order: Reel 3 (describe the home), Reel 2 (Wanamaker's half), Reel 5 (meet
  Hopkins, the launch reel). Latest versions have the slam-in hooks, the talking voice and the
  fixed voice timing. After those, pin Reel 5, with Reels 1 and 3 beside it.
* Captions for posting are in `reports/hopkins-brand/reels/Captions and posting order.md`.
* Turn on Instagram's AI label when posting (the voice is AI made).
* The bio had a "Backed by @ycombinator" line. It was flagged: only keep it if Hopkins is actually
  in YC, and then add the batch (for example "YC F26").

## Reels

* Engine and sources: `content/reels/` (README there). Rules: `.claude/skills/hopkins-creative/SKILL.md`
  ("The first second", "How reels talk", "Every reel ships with a hook cover", "Every reel ends the
  same way").
* Make a reel: write `rN.html` (script + scenes + `hook` + `sfx`), add its cover to `hooks.js`,
  `python3 vo.py rN`, check stills with `node stills.mjs`, render with `node rec.mjs rN.html out.mp4`,
  covers with `node covers.mjs out_dir`.
* Voice: Kokoro af_heart at speed 1.1, captions placed by wav2vec2 forced alignment, pronunciation
  fixes in `FIXES` in `vo.py`. Checked with faster-whisper (small.en): 9 in 10 caption words within
  about 0.15s of the voice. Ismael found the old voice's pronunciation and timing bad; this is the fix.
* Open question to Ismael: voice future reels with ElevenLabs (connected to his account, about
  1,000 characters a reel, free plan about 10,000 a month) instead of Kokoro. No answer yet.
* Setup in a fresh container: `pip install kokoro soundfile transformers faster-whisper`, plus
  `espeak-ng`. ffmpeg is at
  `/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2`.
  Playwright's Chromium can't decode H.264, so check videos by extracting frames with ffmpeg.
* Rendered mp4s and covers live in `reports/hopkins-brand/reels/`, which is not in git. A new
  container won't have them; Ismael has the sent copies, and they can be re-rendered from source.

## Finding content to rebuild

* Ismael sends links to posts that are working; each becomes an animated reel in the Hopkins format
  (the idea, never the wording). See "Finding posts to rebuild" in the playbook.
* Instagram links can be read without a login through the embed page:
  `https://www.instagram.com/p/CODE/embed/captioned/` in Playwright Chromium with
  `ignoreHTTPSErrors: true` (the environment's proxy certificate). That gives the account, follower
  count, caption, likes, the first slide and any image slides (click "Next"). It can't play reels or
  video slides, and doesn't show saves or shares. TikTok links are untested.
* Idea agreed in principle, not built: a trend library (patterns, not posts: format, hook type,
  layout, why it works, numbers, date) that Ismael refreshes weekly. It later seeds the product's
  creative engine. Start it after the usage reset. First entry: the "Places I'd take someone
  visiting [City]" local guide carousel (1,259 likes, 1,680 shares), a format for customers' ads.

## Waitlist site (waitlist.kirmistudio.com)

* Server: `survey/` (Fastify), deployed on Render from branch `claude/exciting-wright-8ml9uc` on
  every push. Page: `survey/web/waitlist.html`.
* The scripted demo was replaced by the product film inside the Mac browser frame: autoplay,
  muted until the visitor's first click (browsers block sound before that), sound button, gold
  progress bar, no note under it, cut per screen size (phone 9:16, laptop 16:10, desktop 16:9).
* Film files load from jsDelivr pinned to commit `1106b7a75ceb8afae14a45da1455ccadcf9d12bc`, then
  fall back to this server, then to feeding the player in pieces (`.f.mp4`, Media Source
  Extensions), then a whole-file download, then a play button. When the films change, commit them
  first and update the pinned commit in the page.
* Every visit reports how the film loaded to `GET /api/waitlist/film` (last 100, in memory, no IPs).
  `?filmdebug` on the page shows a live diagnostic box. It played fine on Ismael's iMac (Safari
  18.6) and iPhone after the fix.
* Search Console: sitemap fixed and accepted (`/sitemap.xml`, also in robots.txt).
* "Built in Silicon Valley" in the footer is true; leave it alone.

## Launch film

* Source: `content/launch/film.html` (46.5s), rendered by `content/launch/rec.mjs` with motion blur
  (90fps blended to 30). Env: `W`, `H`, `DSF`, and `QS` for page params (`cta=Join%20the%20waitlist`
  for the web cut; Instagram cut says "link in bio"). Sound: `sfx2.py`.
* The listing photos it uses are in `content/launch/img/`, not in git (owner approved them for the
  film only). The Kenney sound pack for `sfx2.py` was in a scratch folder. A new container has
  neither: ask Ismael for the photos again before re-rendering the film.

## The product (Hopkins) and what's next

* Next session after the weekly reset (Wednesday afternoon): start the first build, on high effort,
  in a fresh session. Plan: a private version first, everything that needs no Meta access. Listing
  photos and details in, three ad versions out, feed and story previews, changes made in the chat.
  The film's interface (sidebar, chat, three versions, preview panel, leads table, Monday report)
  is the design reference.
* Design decisions for the build (2026-10-19, after an outside critique Ismael shared):
  * **Hopkins messages first.** Agents forget to open apps, and that's the main churn risk. When
    there's something to do (a new listing, an open house, a price change, a losing ad), Hopkins
    sends the agent a message with the ads ready: "Your new listing on Oak Street is live. Here are
    3 ads, $200 over 10 days. Run them?" One tap to approve. The chat stays for anything custom.
    The first trigger can be the agent forwarding a listing link; MLS feeds come later (access
    usually needs a broker or vendor agreement).
  * **Leads first, not ad stats.** The Monday report leads with leads and cost per lead ("7 leads,
    $21 each, 2 asked for a showing"), and new leads reach the agent's phone within seconds.
  * **The moat is the testing record.** Store every test from day one: the listing type, city,
    creative pattern, audience setting, spend, leads, cost per lead and the winner. Over time
    Hopkins knows what wins for which listing where, and a copy of the chat screen can't match that.
  * **Housing rules built in**: the Housing special ad category, no age, gender or ZIP targeting,
    fair housing wording checks.
  * **Later, carefully:** automatic texting of leads runs into US texting law (TCPA, heavy fines),
    so it's not an early feature.
  * Competitors doing parts of this: Ylopo, Lofty (formerly Chime) and Rechat, big all-in-one
    platforms (CRM, website, lead generation, ads), mostly on long contracts. Hopkins' difference:
    one chat, the agent's own ad account, a flat price with no cut of spend, testing first.
* `platform/` is an older booking system from before Hopkins. It is not the Hopkins product.
* Meta: running ads on other people's accounts needs App Review for advanced access
  (ads_management, ads_read, leads_retrieval, pages_show_list, pages_read_engagement,
  pages_manage_ads, business_management), business verification, a privacy policy and data
  deletion page, and a screen recording per permission. The Marketing API access tier needs 500
  successful calls in 15 days with under 15% errors. A working app is needed before any of that.
  Before review, people with a role on the app (testers) can use it, so the first waitlist teams can
  be added as testers (untested with ads, try on Ismael's own ad account first).
* Phone app: not first. Web app first (works in a phone browser), then push notifications for
  approvals and new leads once teams have live ads, a native app only when teams ask or approvals
  are being lost.

## Lincoln: Microsoft sign in (checked 2026-11-15)

* app.uselincoln.com runs on Render (service `lincoln-qm5g`), not Vercel. It has Google and Microsoft buttons (`/api/auth/microsoft`), using the `/common`
  endpoint. The app registration accepts both personal and work Microsoft accounts (tested).
* It asks for a lot: Mail.ReadWrite, Mail.Send, Calendars.ReadWrite, Files.ReadWrite.All,
  Sites.Read.All, Team.ReadBasic.All, Channel.ReadBasic.All, ChannelMessage.Send.
* uselincoln.com is added to the Entra "Default Directory" but not verified yet. The TXT record
  `MS=...` is live on GoDaddy and on Google and Cloudflare DNS; Microsoft's check was still failing,
  most likely cached. Try again later, or from admin.microsoft.com, Settings, Domains.
* Until publisher verification (verified domain plus a Microsoft AI Cloud Partner Program ID), work
  accounts at other companies will mostly get "Need admin approval". Personal accounts and his own
  tenant are fine. The Teams and SharePoint scopes only work for work accounts.
* `invalid_client` on Continue with Microsoft (2026-11-15): Render's `MICROSOFT_CLIENT_SECRET` held
  the Azure Secret ID, not the secret Value. Fix: new client secret in Azure, paste its Value, save,
  rebuild and deploy. Secrets last at most 24 months; make a new one before the expiry date.
