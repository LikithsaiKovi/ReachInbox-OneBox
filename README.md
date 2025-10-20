# ReachInbox Onebox (Recruiter Quick Start)

A lightweight, recruiter-friendly demo of an AI-powered email management app: fetches Gmail, categorizes emails, filters/searches, exports CSV, sends replies, and shows analytics. Setup takes ~2 minutes.

## Start (2 commands)
```bash
git clone https://github.com/LikithsaiKovi/ReachInbox-OneBox.git
cd ReachInbox-OneBox && npm install && node server-advanced.js
```
Open `http://localhost:4000`.

## What to Demo (60–90 seconds)
- Add Gmail account (uses App Password) and watch emails load (up to 200).
- Filter by Category/Priority/Sentiment; search in subject/body.
- Click an email to see a Gmail-like detail view with clickable links, images/PDF previews.
- Suggest Reply → send reply.
- Export CSV (Current View or All).
- Open Analytics for category/priority/sentiment visuals.

## Optional: Gmail App Password (for real inbox)
1) Enable 2‑Step Verification → App Passwords. 2) Create “Mail / Other”, copy 16‑char password. 3) In the app, Add Gmail → paste App Password.

## Optional Integrations
- Slack: set `SLACK_BOT_TOKEN` and `SLACK_CHANNEL_ID` in `.env`.
- Webhook: set `WEBHOOK_URL` in `.env`.
Notifications trigger automatically for “Interested” emails.

## Minimal .env (optional)
```env
PORT=4000
# Slack/Webhook (optional)
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL_ID=C0123...
WEBHOOK_URL=https://webhook.site/...
# Gmail via UI (preferred). You can also preload one like this:
IMAP_ACCOUNT_1_USER=your@gmail.com
IMAP_ACCOUNT_1_PASS=your-16-char-app-password
IMAP_ACCOUNT_1_HOST=imap.gmail.com
IMAP_ACCOUNT_1_PORT=993
IMAP_ACCOUNT_1_TLS=true
```

## Key Endpoints (for quick checks)
- GET `/health` – server health
- GET `/api/accounts` – Gmail accounts
- GET `/api/emails/search?q=...&account=...` – filtered search
- GET `/api/stats` – analytics snapshot
- GET `/api/emails/export?format=csv` – export

## Troubleshooting (fast)
- Port busy: kill prior node or use `PORT=4001 node server-advanced.js`.
- App Password errors: ensure 2FA enabled and 16‑char App Password (no spaces).
- Links not opening: open email detail → links are clickable; PDFs/images preview inline.

## Tech (one‑liner)
Node.js + Express + vanilla React (single HTML), IMAP for Gmail, Groq‑style AI categorization, WebSocket live updates, optional Slack/Webhook.

— That’s it. Open the app and demo.