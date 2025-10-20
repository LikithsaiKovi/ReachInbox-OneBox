# ReachInbox Onebox - Complete Setup Guide

An AI-powered email management application with Gmail integration, smart categorization, analytics, and real-time features. Perfect for recruiters and sales teams.

## 🚀 Complete Setup Instructions

### Prerequisites
- **Node.js** (v14 or higher)
- **Git** (for cloning)
- **Gmail account** with App Password (for email integration)

### Step 1: Clone Repository
```bash
git clone https://github.com/LikithsaiKovi/ReachInbox-OneBox.git
cd ReachInbox-OneBox
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start the Server
```bash
node server-advanced.js
```

**Expected Output:**
```
🚀 ReachInbox Onebox Advanced Edition running on port 4000
📧 Frontend available at: http://localhost:4000
🔍 API endpoints available at: http://localhost:4000/api/*
🌐 WebSocket server running on port 8080
```

### Step 4: Access the Application

#### **From Same Computer:**
```
http://localhost:4000
```

#### **From Other Computers (Same Network):**
1. **Find your computer's IP address:**
```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```
   Look for "IPv4 Address" (e.g., `192.168.1.100`)

2. **Access from other devices:**
   ```
   http://YOUR_IP_ADDRESS:4000
   # Example: http://192.168.1.100:4000
   ```

#### **From Internet (Cloud Deployment):**
For access from anywhere, deploy to:
- **Heroku** (free tier)
- **Railway** (free tier)
- **DigitalOcean** (paid)

## 🔐 Login Process

### For New Users:
1. **Visit:** `http://localhost:4000`
2. **Auto-redirect:** You'll be taken to the login page
3. **Click "Sign Up"** to create a new account
4. **Enter details:**
   - Full Name
   - Gmail address (e.g., `yourname@gmail.com`)
   - Password (minimum 8 characters)
   - Confirm Password
5. **Click "Sign Up"** → Account created
6. **Auto-redirect:** Back to login page
7. **Sign in** with your credentials

### For Existing Users:
1. **Visit:** `http://localhost:4000`
2. **Auto-redirect:** Login page appears
3. **Enter credentials:**
   - Gmail address
   - Password
4. **Click "Sign In"** → Access main application

### Password Reset:
1. **On login page:** Click "Forgot Password?"
2. **Enter Gmail address**
3. **Check email** for reset link
4. **Click link** → Set new password
5. **Sign in** with new password

## 🎯 Main Application Features

### After Login, You'll See:
- **Header:** Shows your email, "Sign out" button, and live connection status
- **Add Gmail:** Button to connect your Gmail account
- **Search & Filters:** Search emails, filter by category/priority/sentiment
- **Email List:** Categorized emails with AI insights
- **Analytics Dashboard:** Visual charts and statistics
- **Export Options:** Download emails as CSV

### Key URLs:
- **Main App:** `http://localhost:4000/` or `http://localhost:4000/dashboard`
- **Login:** `http://localhost:4000/login`
- **Sign Up:** `http://localhost:4000/signup`
- **Forgot Password:** `http://localhost:4000/forgot-password.html`

## 📧 Gmail Integration Setup

### 1. Enable 2-Factor Authentication
- Go to Google Account settings
- Security → 2-Step Verification → Turn on

### 2. Generate App Password
- Google Account → Security → App passwords
- Select "Mail" → "Other (custom name)"
- Enter "ReachInbox" → Generate
- **Copy the 16-character password** (no spaces)

### 3. Add Gmail Account in App
- Click "Add Gmail" button in header
- Enter:
  - **Name:** Your display name
  - **Email:** Your Gmail address
  - **App Password:** The 16-character password from step 2
- Click "Add Account" → Emails will start loading

## 🔧 Troubleshooting

### Server Won't Start:
```bash
# Kill existing processes
taskkill /f /im node.exe

# Navigate to project directory
cd ReachInbox-OneBox

# Start server
node server-advanced.js
```

### Port Already in Use:
```bash
# Windows
taskkill /f /im node.exe

# Mac/Linux
pkill node

# Then restart
node server-advanced.js
```

### Can't See Sign Out Button:
1. **Hard refresh:** Ctrl+F5
2. **Clear cache:** Ctrl+Shift+Delete
3. **Try Incognito mode**

### Login Issues:
- **Use valid Gmail format:** `username@gmail.com`
- **Password minimum:** 8 characters
- **Check credentials:** Ensure you're using the correct email/password

### Gmail Integration Fails:
- **Verify 2FA is enabled**
- **Use App Password, not regular password**
- **Check 16-character App Password** (no spaces)
- **Ensure Gmail account is active**

## 📱 Application Flow

```
1. Start Server → node server-advanced.js
2. Open Browser → http://localhost:4000
3. Auto-redirect → Login page
4. Sign Up/Sign In → Create account or login
5. Add Gmail → Connect your Gmail account
6. View Emails → AI-categorized email list
7. Use Features → Search, filter, export, analytics
8. Sign Out → Click "Sign out" button in header
```

## 🛠️ Development Commands

```bash
# Start server
node server-advanced.js

# Check server health
curl http://localhost:4000/health

# View logs
# Server logs appear in terminal where you ran node server-advanced.js

# Stop server
Ctrl+C (in terminal where server is running)
```

## 📊 API Endpoints

- `GET /health` - Server health check
- `GET /api/accounts` - List Gmail accounts
- `GET /api/emails/search` - Search emails
- `GET /api/stats` - Analytics data
- `GET /api/emails/export` - Export emails as CSV
- `POST /api/gmail-accounts` - Add Gmail account
- `DELETE /api/gmail-accounts/:id` - Remove Gmail account

## 🔒 Security Features

- **Gmail validation:** Only accepts valid Gmail addresses
- **Password requirements:** Minimum 8 characters
- **Session management:** Secure token-based authentication
- **Email validation:** Prevents fake/random email addresses
- **App Password only:** Gmail integration uses secure App Passwords

---

**That's it!** The application is now ready for demonstration and use.

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
- **Port busy:** `taskkill /f /im node.exe` (Windows) or `pkill node` (Mac/Linux), then restart
- **Server won't start:** Ensure you're in the project directory: `cd ReachInbox-OneBox`
- **Login issues:** Use valid Gmail address format (e.g., `user@gmail.com`)
- **App Password errors:** Ensure 2FA enabled and 16‑char App Password (no spaces)
- **Links not opening:** Open email detail → links are clickable; PDFs/images preview inline

## Tech (one‑liner)
Node.js + Express + vanilla React (single HTML), IMAP for Gmail, Groq‑style AI categorization, WebSocket live updates, optional Slack/Webhook.

— That’s it. Open the app and demo.