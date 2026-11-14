# Lincoln security (as built and tested, updated 2026-11-14)

Only what is actually in the code and was tested is listed. Nothing here is a certification.

## In place

Added 2026-11-14:
* The whole database file is encrypted (SQLite3 Multiple Ciphers, ChaCha20-Poly1305) with a key derived
  from LINCOLN_SECRET: case text, emails, drafts, names and the journal are unreadable without it. A plain
  database from before is converted in place on start (tested: a client's name no longer appears in the
  file; opening it without the key fails).
* Every key is derived from one master key for its own purpose (database, sealing), never reused.
* Administrators can require two step sign in for the whole firm; an account without it can then reach
  only the screen that sets it up, in pages, actions and API routes alike.
* A session ends after 2 hours without use, inside its 12 hour limit.
* A sign in from a device the account has not used before is emailed to the account.
* New passwords are checked against known data breaches (Have I Been Pwned, k-anonymity: only five
  characters of the password's hash leave the server).
* An access record of who opened a case, viewed client pages, exported files or exported the firm,
  with the address used, shown to administrators.
* A daily model spend limit (LLM_DAILY_BUDGET_USD, default $5) stops new model calls once reached, and
  per person limits on chat questions and new cases stop a runaway loop or misuse.
* Administrators can export everything the firm has (every record and every client page) with their
  password; secrets (password hashes, two step secrets, tokens, keys) are never included.
* Error logs carry the error message only, never document or email content.
* A written breach plan: `docs/BREACH-PLAN.md`.

From before:

* Every record carries its firm and every query filters on it. Another firm's case page, page image,
  export and assistant access return 404 (tested).
* Restricted cases (asylum, U visa and similar) are visible only to their attorney and paralegal and to
  administrators, in every list, page, export and the assistant (tested).
* Client files (page images from PDFs and photos) are encrypted at rest with AES-256-GCM using a key that
  belongs to one firm; firm keys are encrypted with the server's master key (LINCOLN_SECRET). One firm's
  key cannot open another's files and a changed file is detected (tested). Pages from a failed read are
  deleted.
* Mailbox logins (Google and Microsoft tokens) are encrypted at rest.
* Passwords are hashed with scrypt; session, reset and sign in challenge tokens are stored only as hashes.
* Sign in with Google or Microsoft finds the account by the provider's own account id; an email that
  already has a password account is never taken over. Microsoft accounts never rely on the mail attribute.
* Two step sign in with any authenticator app, with eight one time recovery codes; a code cannot be used
  twice; five tries per sign in (tested).
* Session cookie: httpOnly, SameSite Lax, Secure and the __Host- prefix in production, 12 hours.
* Signed in devices are listed and can be signed out one by one or all at once; a password change signs
  out every other device.
* A security record of sign ins, failures, two step changes, recovery code use, connections and device
  sign outs, shown to each user with the address used.
* Password reset links are sent by email only (Resend) and never shown on screen or stored readable. The
  old outbox that kept them is emptied at start.
* Attempt limits on sign in, two step codes, reset and deletion.
* Browser headers: a strict Content Security Policy (own scripts only, no framing, forms post only to
  Lincoln), HSTS, nosniff, no referrer leaks, camera off, microphone only for Lincoln's own dictation.
* Exports that write to a connected Drive or OneDrive are refused when started from another site.
* Inbound endpoints: the forwarding address and the Gmail notification address need a secret token;
  Microsoft notifications must carry the subscription's secret; bodies are size limited.
* Uploads are identified by their content, not their name; images claiming huge dimensions are refused
  before decoding; PDF pages are capped in size; at most 90 pages per case.
* Email addresses and subjects cannot carry extra headers or recipients (tested).
* Text from documents, emails and tools is passed to the model as data, never as instructions; only
  verified colleagues (DMARC or same Microsoft organisation) can give instructions by email.
* Mail that is clearly not case work is never kept; bulk mail never reaches the model.
* The shared sample workspace accepts no uploads, connections, forwarding addresses or profile changes.
* An administrator can permanently delete the firm: every case, file, message, connection, key and
  account; Google access is revoked.

## Not yet in place (before any real client file)

* Backups kept somewhere other than the server's own disk (the database and files are encrypted, but
  they live on one Render disk).
* A zero data retention agreement with Anthropic (applied for through Anthropic; the direct API does not
  train on customer data under Anthropic's commercial terms).
* An independent security review (paid), and Google's CASA assessment for Gmail and Drive (paid).
* Narrower Google Drive access (a file picker instead of read access to all of Drive).
* A data processing agreement and updated privacy policy from the parent's company, reviewed by a lawyer.

## Known and accepted

* npm audit reports image-size (inside pptxgenjs; only reached when images are added to slides, which
  Lincoln never does) and uuid (inside exceljs; the affected functions are not called).
