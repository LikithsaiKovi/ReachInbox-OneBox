# ReachInbox Onebox - Version 1.2

An AI-powered email management application with Gmail integration, smart categorization, analytics, and real-time Slack notifications. Perfect for recruiters and sales teams.

## 🚀 Quick Start (Version 1.2)

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

## 🎯 Main Application Features (Version 1.2)

### After Login, You'll See:
- **Header:** Shows your email, "Sign out" button, and live connection status
- **Add Gmail:** Button to connect your Gmail account
- **Search & Filters:** Search emails, filter by category/priority/sentiment
- **Email List:** Categorized emails with AI insights
- **Analytics Dashboard:** Visual charts and statistics
- **Export Options:** Download emails as CSV
- **AI Reply Suggestions:** Contextual AI-powered reply generation

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

## 🔔 Slack Notifications (NEW in Version 1.2)

### Setup Slack Notifications:
1. **Create Slack App:**
   - Go to https://api.slack.com/apps
   - Click "Create New App" → "From scratch"
   - Name your app (e.g., "ReachInbox Notifications")
   - Select your workspace

2. **Get Bot Token:**
   - Go to "OAuth & Permissions"
   - Add scopes: `chat:write`, `chat:write.public`
   - Install app to workspace
   - Copy the "Bot User OAuth Token" (starts with `xoxb-`)

3. **Get Channel ID:**
   - In Slack, right-click on your desired channel
   - Click "View channel details"
   - Copy the Channel ID (starts with `C`)

4. **Update .env File:**
   ```env
   SLACK_BOT_TOKEN=xoxb-your-bot-token-here
   SLACK_CHANNEL_ID=C1234567890
   ```

5. **Restart Server:**
   ```bash
   node server-advanced.js
   ```

### What Happens:
- When emails are categorized as "Interested" by AI
- Beautiful notifications are sent to your Slack channel
- Real-time updates with email details, priority, and lead score
- Console and log notifications also work

## 🧠 AI Features (Version 1.2)

### Smart Email Categorization:
- **Interested:** Shows buying intent, asks questions, requests info
- **Meeting:** Scheduled calls, demos, appointments
- **Not Interested:** Declines, no interest shown
- **Spam:** Promotional emails, newsletters
- **Out of Office:** Automated replies

### AI-Powered Reply Suggestions:
- Contextual replies based on email content
- Category-specific response variations
- Universal email handling (job, personal, business, technical, financial)
- Fresh, unique responses every time

### RAG (Retrieval-Augmented Generation):
- Stores recruiter agenda in vector database
- Generates contextual replies based on stored knowledge
- Fallback to category-based suggestions

## 📊 Analytics Dashboard

### Visual Analytics:
- **Category Distribution:** Donut charts showing email categories
- **Priority Levels:** Progress bars for priority distribution
- **Sentiment Analysis:** Visual sentiment breakdown
- **Lead Scoring:** AI-calculated lead scores
- **Real-time Updates:** Live data refresh

### Export Options:
- **Current View Only:** Export filtered emails
- **All Emails:** Export all emails from selected account
- **CSV Format:** Downloadable spreadsheet format

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

### Slack Notifications Not Working:
- **Check .env file:** Ensure SLACK_BOT_TOKEN and SLACK_CHANNEL_ID are set
- **Verify bot permissions:** Ensure scopes are added
- **Test connection:** Check server console for Slack errors
- **Restart server:** After updating .env file

## 📱 Application Flow

```
1. Start Server → node server-advanced.js
2. Open Browser → http://localhost:4000
3. Auto-redirect → Login page
4. Sign Up/Sign In → Create account or login
5. Add Gmail → Connect your Gmail account
6. View Emails → AI-categorized email list
7. Use Features → Search, filter, export, analytics
8. AI Replies → Generate contextual responses
9. Slack Notifications → Real-time alerts for interested emails
10. Sign Out → Click "Sign out" button in header
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
- `POST /api/emails/:id/suggest-reply` - Generate AI reply
- `POST /api/recruiter/agenda` - Store recruiter agenda
- `GET /api/notifications` - Get notification log

## 🔒 Security Features

- **Gmail validation:** Only accepts valid Gmail addresses
- **Password requirements:** Minimum 8 characters
- **Session management:** Secure token-based authentication
- **Email validation:** Prevents fake/random email addresses
- **App Password only:** Gmail integration uses secure App Passwords
- **Secure notifications:** Slack integration with proper authentication

## 🆕 Version 1.2 Updates

### New Features:
- ✅ **Slack Notifications:** Real-time alerts for "Interested" emails
- ✅ **Enhanced AI Replies:** Universal email handling with category-specific responses
- ✅ **Improved Analytics:** Better visualizations and real-time updates
- ✅ **Code Cleanup:** Removed unused files and optimized performance
- ✅ **Better Error Handling:** Improved user experience and debugging

### Performance Improvements:
- **Faster Startup:** Reduced file scanning time
- **Better Memory Usage:** Optimized resource consumption
- **Cleaner Codebase:** Removed 13 unused files
- **Enhanced Stability:** Better error handling and recovery

## 📋 Project Structure (Version 1.2)

```
ReachInbox-OneBox/
├── server-advanced.js          # Main server (ONLY server file)
├── public/                     # Frontend files
│   ├── index.html             # Main application
│   ├── login.html             # Login page
│   ├── signup.html            # Signup page
│   ├── forgot-password.html   # Password reset
│   └── reset-password.html    # Reset form
├── src/                       # Data storage
│   ├── accounts.json          # Gmail accounts
│   ├── users.json             # User authentication
│   └── resetTokens.json       # Password reset tokens
├── package.json               # Dependencies
├── .env                       # Environment variables
├── notifications.json         # Notification log
├── start.bat                  # Windows startup
├── start.sh                   # Linux startup
└── README.md                  # This file
```

## 🎯 Demo Features (60-90 seconds)

1. **Add Gmail Account:** Use App Password to connect Gmail
2. **View Categorized Emails:** AI-powered categorization with insights
3. **Search & Filter:** Find specific emails by category/priority
4. **Email Detail View:** Click email for full content with clickable links
5. **AI Reply Suggestions:** Generate contextual responses
6. **Analytics Dashboard:** Visual charts and statistics
7. **Export Functionality:** Download emails as CSV
8. **Slack Notifications:** Real-time alerts for interested emails

## 🔧 Environment Variables (.env)

```env
# Server Configuration
PORT=4000

# LLM API Configuration (Grok API)
LLM_API_KEY=gsk_your_grok_api_key_here
LLM_API_URL=https://api.groq.com/openai/v1/completions
LLM_EMBEDDINGS_URL=https://api.groq.com/openai/v1/embeddings

# SMTP Configuration (for password reset emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=ReachInbox Onebox <your_email@gmail.com>

# Public App URL
PUBLIC_APP_URL=http://localhost:4000

# Slack Configuration (for notifications)
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL_ID=C1234567890

# Development Configuration
NODE_ENV=development
LOG_LEVEL=info
```

## 🚀 Deployment Options

### Local Development:
```bash
node server-advanced.js
```

### Production Deployment:
- **Heroku:** Free tier available
- **Railway:** Free tier available
- **DigitalOcean:** Paid but reliable
- **AWS:** Enterprise-grade

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Ensure Gmail App Password is valid
4. Check server console for error messages

---

**Version 1.2 is ready for production use!** 🎉

The application now includes Slack notifications, enhanced AI capabilities, and a cleaner, more efficient codebase.