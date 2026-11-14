# What to do if Lincoln is breached

Written 2026-11-14, before any firm uses Lincoln on real cases. Not legal advice: once firms hold
real client data, a lawyer reviews this plan, and the firm's data agreement says how and when the firm
is told.

## Signs that something is wrong

* A "New sign in to Lincoln" email for a sign in nobody made.
* Entries in Settings, Security (security activity or the access record) that nobody recognises.
* The model budget used up early in the day, or Anthropic spend that does not match the work done.
* An alert from Render, Google, Microsoft, Anthropic, GitHub or Resend.
* A firm reporting mail sent, drafts or cases they did not create.

## First hour: contain

1. If the risk is ongoing, suspend the Lincoln service in Render (Settings, Suspend). Nobody can reach
   it and nothing is lost. Never change `LINCOLN_SECRET`: it would make every stored file and token
   unreadable, including for the investigation.
2. For one affected account: sign out all its devices (Settings, Security) and change its password.
3. Rotate the keys that could have leaked, in this order, each in its own console:
   * Anthropic API key (Console, API Keys): create a new one, put it in Render, delete the old one.
   * Google OAuth client secret (Google Cloud, Credentials) and `GOOGLE_PUSH_TOKEN`.
   * Microsoft client secret (Entra, Certificates and secrets).
   * Resend API key.
   * GitHub: check for unknown commits or deploy keys on the repository.
4. Revoke Lincoln's access in any affected mailbox (the firm can do this in its Google or Microsoft
   account security page), then reconnect after the cause is fixed.

## First day: understand

* Write down, with times: what was seen, what was done, who did it.
* Use the security activity, the access record, Render's logs and each provider's audit log to work
  out what was reached: which firms, which cases, which files, which mail.
* Keep everything. Do not delete logs or the database while working out what happened.

## Within 72 hours: tell the people affected

* Each affected firm, in writing: what happened, what data was involved, what has been done, what they
  should do (for example, warn their clients or watch for phishing). Plain words, no minimising.
* Lincoln's company is Irish, so a breach of personal data may have to be reported to the Data
  Protection Commission within 72 hours of becoming aware of it (GDPR Article 33). Firms in the US may
  have their own state notification duties for their clients; they decide those with their own lawyers.
* Never claim a breach is smaller than it is, and never say data was encrypted unless it was.

## After: fix and record

* Fix the cause, test the fix, and have it reviewed.
* Add what was learnt to `docs/SECURITY.md` and to this plan.

## Who does what (until there is a team)

* Ismael: contain, rotate keys, investigate with Claude.
* The parent who owns the company: signs the notices to firms and to the Data Protection Commission.
