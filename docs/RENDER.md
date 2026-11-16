# Render settings (reference only)

The live service is set up by hand in the Render dashboard. This file used to be `render.yaml` at the repository
root, where a Render Blueprint read it and created a second copy of the service on its own. It was moved here on
2026-11-16 so that can no longer happen. Nothing reads this file; it only records the settings.

## Backups (2026-11-16)
* Lincoln copies the database every six hours into /var/data/backups (encrypted, checked before it is kept; all copies
  of the last 7 days, then one a day for 30 days). Render's daily disk snapshots carry those copies.
* Off site (optional): set BACKUP_S3_ENDPOINT, BACKUP_S3_BUCKET, BACKUP_S3_KEY_ID, BACKUP_S3_SECRET and, if needed,
  BACKUP_S3_REGION (default "auto") for any S3 compatible bucket (Cloudflare R2, Backblaze B2, AWS S3). Each new copy
  and every new client file is sent; everything sent is already encrypted. Status and "Back up now" are on /ops.
* Restore: in the service's Shell run `node --experimental-strip-types scripts/restore.mts` to list copies, then
  `node --experimental-strip-types scripts/restore.mts <file>` and restart the service. The previous database is kept
  beside it, so a restore can be undone. LINCOLN_SECRET must be the same as when the copy was made.

```yaml
services:
  - type: web
    name: lincoln
    runtime: node
    rootDir: lincoln
    plan: starter            # the free plan wipes the disk on every restart; Starter keeps it
    buildCommand: npm install && npm run build
    startCommand: npm run start
    healthCheckPath: /signin
    envVars:
      - key: NODE_VERSION
        value: 22
      - key: DATA_DIR
        value: /var/data
      - key: LLM_BASE_URL
        value: https://api.anthropic.com
      - key: LLM_MODEL
        value: claude-sonnet-5-5
      - key: LLM_MODEL_LIGHT     # sorting mail and similar light work
        value: claude-haiku-5-5
      - key: SEED_USER_EMAIL     # a personal login for the sample workspace, set in the dashboard
        sync: false
      - key: SEED_USER_PASSWORD
        sync: false
      - key: SEED_USER_NAME
        sync: false
      - key: SEED_USER_FIRM
        sync: false
      - key: APP_URL             # the public address, used for the Google sign in return link
        value: https://lincoln-qm5g.onrender.com
      - key: GOOGLE_CLIENT_ID    # from Google Cloud, OAuth client for a web application
        sync: false
      - key: GOOGLE_CLIENT_SECRET
        sync: false
      - key: GOOGLE_PUBSUB_TOPIC  # projects/<project id>/topics/lincoln-gmail, for instant Gmail delivery
        sync: false
      - key: GOOGLE_PUSH_TOKEN    # shared with the Pub/Sub push subscription address
        generateValue: true
      - key: MICROSOFT_CLIENT_ID # from Microsoft Entra, app registration for Outlook, OneDrive, Teams
        sync: false
      - key: MICROSOFT_CLIENT_SECRET
        sync: false
      - key: RESEND_API_KEY      # password reset emails
        sync: false
      - key: MAIL_FROM           # e.g. Lincoln <no-reply@uselincoln.com>
        sync: false
      - key: LINCOLN_SECRET      # encrypts mailbox tokens at rest
        generateValue: true
      - key: LLM_API_KEY
        sync: false          # entered in the Render dashboard, never in git
    disk:
      name: lincoln-data
      mountPath: /var/data
      sizeGB: 1
```

## USCIS case status (optional, not set up yet)

Lincoln checks USCIS case status through USCIS's own Case Status API (developer.uscis.gov). Access belongs to the
company, so a parent or guardian applies: create a USCIS online account with the company email, join the Torch
developer portal, create an app (sandbox credentials are issued at once), then request production access, which
needs an affidavit (Form G-1595) and a 30 minute demo. Demo slots were booked through March 2027 when checked on
2026-11-16. Once credentials exist, set on Render:

* `USCIS_CLIENT_ID` and `USCIS_CLIENT_SECRET`: the app's credentials (secret values, never in the repository).
* `USCIS_API_BASE`: leave unset for the sandbox; set to the production address USCIS gives with production access.

USCIS's terms: only receipt numbers of the firm's own clients, never anyone else's.
