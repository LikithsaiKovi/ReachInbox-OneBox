# ReachInbox Onebox - Advanced Email Management System

A production-ready email management system that combines real-time IMAP monitoring, AI-powered categorization, advanced analytics, and modern UI/UX for recruiters and sales teams.

## 🎯 **FOR RECRUITERS - QUICK START GUIDE**

### **Step 1: Download and Setup (2 minutes)**

**Option A: One-Click Start (Windows)**
```bash
# 1. Clone the repository
git clone https://github.com/LikithsaiKovi/ReachInbox-OneBox.git
cd ReachInbox-OneBox

# 2. Double-click start-recruiter-demo.bat
# OR run: start-recruiter-demo.bat
```

**Option B: Manual Setup**
```bash
# 1. Clone the repository
git clone https://github.com/LikithsaiKovi/ReachInbox-OneBox.git
cd ReachInbox-OneBox

# 2. Install dependencies
npm install

# 3. Start the application
node server-advanced.js
```

### **Step 2: Access the Application**
- **Open your browser and go to:** `http://localhost:4000`
- **The application will start automatically with real Gmail integration**

### **Step 3: Add Your Gmail Account (Optional but Recommended)**
1. **Click "Add Gmail Account"** in the interface
2. **Enter your Gmail email** (e.g., `yourname@gmail.com`)
3. **Enter your Gmail App Password** (see setup below if you don't have one)
4. **Click "Add Account"** - emails will start loading automatically

### **Step 4: Test Key Features**
- ✅ **Search emails** using the search bar
- ✅ **Filter by 20+ categories** (Interested, Social, Job, Newsletter, etc.)
- ✅ **Filter by priority** (Urgent, High, Medium, Low)
- ✅ **Filter by sentiment** (Positive, Negative, Neutral)
- ✅ **Filter by date range** using the date picker
- ✅ **Export filtered emails** to CSV with confirmation dialog
- ✅ **Generate AI reply suggestions** by clicking "Suggest Reply"
- ✅ **Send real replies** using the reply functionality
- ✅ **View advanced analytics dashboard** with visual charts
- ✅ **Real-time notifications** for Slack and Webhooks
- ✅ **Account switching** with automatic email filtering
- ✅ **Modern responsive UI** with dark/light theme toggle

### **🔐 Gmail App Password Setup (If Needed)**
If you want to connect your real Gmail account:

1. **Enable 2-Factor Authentication:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable **2-Step Verification**

2. **Generate App Password:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click **App passwords** → **Mail** → **Other (custom name)**
   - Enter name: "ReachInbox Onebox"
   - **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

3. **Use this password** when adding your Gmail account in the application

### **🎯 What You'll See**
- **Real-time email fetching** from Gmail (200+ emails per account)
- **AI-powered categorization** with 20+ categories including:
  - **Interested** - High-priority business inquiries
  - **Social** - LinkedIn, Facebook, Twitter notifications
  - **Job** - Career and recruitment emails
  - **Newsletter** - Marketing and promotional emails
  - **Billing** - Payment and invoice related
  - **Security** - Login alerts and security notifications
  - **Support** - Customer support requests
  - **Meeting** - Meeting requests and scheduling
  - **Urgent** - Time-sensitive emails
  - **And 12+ more categories...**
- **Advanced filtering** by category, priority, sentiment, and date
- **Export functionality** that respects all your filters with confirmation dialog
- **AI reply suggestions** for professional responses
- **Visual analytics dashboard** with donut charts and progress bars
- **Modern, responsive UI** with gradient themes and glassmorphism effects
- **Real-time notifications** via Slack and Webhooks for "Interested" emails

### **🚀 Demo Features to Show**
1. **Add Gmail Account** → Watch emails load in real-time (200+ emails)
2. **Search & Filter** → Use the enhanced category dropdown with 20+ options
3. **Export Data** → Click "Export CSV" and choose "Current View Only" or "All Emails"
4. **AI Features** → Click "Suggest Reply" to see AI-generated responses
5. **Analytics Dashboard** → View visual charts with category distribution
6. **Real-time Updates** → Watch the WebSocket connection indicator
7. **Theme Toggle** → Switch between light and dark themes
8. **Account Switching** → Switch between multiple Gmail accounts seamlessly

### **🔧 Quick Troubleshooting for Recruiters**

**❌ "Cannot find module" error:**
```bash
# Make sure you're in the correct directory
cd ReachInbox-OneBox
node server-advanced.js
```

**❌ "Port 4000 already in use" error:**
```bash
# Kill any process using port 4000 (Windows)
netstat -ano | findstr :4000
taskkill /PID <PID_NUMBER> /F

# Or use a different port
PORT=4001 node server-advanced.js
```

**❌ "Gmail connection failed" error:**
- Make sure you have a Gmail App Password (not your regular password)
- Check that 2-Factor Authentication is enabled on your Gmail account
- Try the demo without Gmail first - the app works with mock data too

**❌ "npm install" fails:**
```bash
# Clear npm cache and try again
npm cache clean --force
npm install
```

**❌ Application won't start:**
```bash
# Check if Node.js is installed
node --version
npm --version

# If not installed, download from: https://nodejs.org/
```

**✅ Windows Users - Use the Batch File:**
```bash
# Simply double-click start-recruiter-demo.bat
# It will automatically check dependencies and start the app
```

**✅ Success Indicators:**
- You see "🚀 ReachInbox Onebox Advanced Edition running on port 4000"
- Browser shows the application at `http://localhost:4000`
- You can see the search interface and email management features
- WebSocket connection shows "Live" status

### **📋 What This Application Demonstrates**

**🎯 Technical Skills:**
- **Full-Stack Development:** React frontend + Node.js backend
- **Real-time Communication:** WebSocket integration for live updates
- **AI Integration:** Groq API for email categorization and reply generation
- **Email Processing:** IMAP protocol for Gmail integration
- **Data Management:** In-memory storage with advanced filtering and export
- **Modern UI/UX:** Responsive design with Tailwind CSS, gradients, and animations
- **API Integration:** Slack Bot API and Webhook integrations
- **Data Visualization:** Charts and analytics dashboard

**🚀 Key Features:**
- **Real-time email fetching** from Gmail accounts (200+ emails per account)
- **AI-powered email categorization** with 20+ categories
- **Advanced filtering system** (category, priority, sentiment, date range)
- **Smart export functionality** with confirmation dialogs
- **AI reply suggestions** using Groq API
- **Visual analytics dashboard** with donut charts and progress bars
- **Account management** (add/delete Gmail accounts with validation)
- **Real-time notifications** via Slack and Webhooks
- **Modern responsive UI** with theme toggle and glassmorphism effects

**💼 Business Value:**
- **Email management** for sales and recruitment teams
- **Lead prioritization** through AI categorization
- **Data export** for CRM integration
- **Automated reply suggestions** for faster response times
- **Analytics insights** for email performance tracking
- **Real-time notifications** for important leads
- **Multi-account support** for team collaboration

---

## ⚡ Quick Demo (2 minutes)

### Option 1: Real Gmail Integration (Recommended)
```bash
git clone <your-repo-url>
cd reachinbox-onebox
npm install
cp env.example .env
# Edit .env with your Gmail app password
node server-advanced.js
```

### Option 2: Mock Data Demo
```bash
git clone <your-repo-url>
cd reachinbox-onebox
npm install
node server-advanced.js
```

### Option 3: One-Command Start (Windows)
```bash
git clone <your-repo-url>
cd reachinbox-onebox
start.bat
```

**Then open http://localhost:4000 in your browser**

**That's it!** The application runs with real Gmail integration or mock data for instant demonstration.

## 📋 **COMPLETE SETUP GUIDE**

### **Step 1: Gmail App Password Setup**

**🔐 IMPORTANT: You need a Gmail App Password for real email access**

1. **Enable 2-Factor Authentication:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Sign in with your Gmail account
   - Under "Signing in to Google", click **2-Step Verification**
   - Follow the setup process

2. **Generate App Password:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Under "Signing in to Google", click **App passwords**
   - Select **Mail** as the app
   - Select **Other (custom name)** as the device
   - Enter name: "ReachInbox Onebox"
   - Click **Generate**
   - **COPY THE 16-CHARACTER PASSWORD** (looks like: `abcd efgh ijkl mnop`)

### **Step 2: Environment Configuration**

```bash
# Copy the example environment file
cp env.example .env
```

**Edit the `.env` file with your credentials:**

```env
# Server Configuration
PORT=4000

# Grok AI API Configuration (Already configured)
LLM_API_KEY=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
LLM_API_URL=https://api.groq.com/openai/v1/completions
LLM_EMBEDDINGS_URL=https://api.groq.com/openai/v1/embeddings

# Slack Integration (Optional)
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token-here
SLACK_CHANNEL_ID=C01234567

# Webhook Integration (Optional)
WEBHOOK_URL=https://webhook.site/your-custom-url

# Gmail IMAP Configuration (Optional - can add via UI)
IMAP_ACCOUNT_1_USER=your-email@gmail.com
IMAP_ACCOUNT_1_PASS=your-16-character-app-password-here
IMAP_ACCOUNT_1_HOST=imap.gmail.com
IMAP_ACCOUNT_1_PORT=993
IMAP_ACCOUNT_1_TLS=true
```

**⚠️ IMPORTANT:**
- Replace `your-16-character-app-password-here` with your actual Gmail app password
- The `.env` file is in `.gitignore` for security - it won't be pushed to GitHub
- Slack and Webhook integrations are optional but provide real-time notifications

### **Step 3: Start the Application**

```bash
# Start with real Gmail integration
node server-advanced.js

# OR start with mock data (for testing)
node server-advanced.js
```

### **Step 4: Access the Application**

- **Frontend**: http://localhost:4000
- **API Health**: http://localhost:4000/health
- **WebSocket**: ws://localhost:8080

## 🚀 Overview

ReachInbox Onebox provides:
- **Real-time IMAP monitoring** for multiple email accounts
- **AI-powered categorization** with 20+ categories
- **Advanced analytics dashboard** with visual charts
- **Smart filtering system** by category, priority, sentiment, and date
- **Export functionality** with confirmation dialogs
- **AI reply suggestions** using Groq API
- **Real-time notifications** via Slack and Webhooks
- **Modern responsive UI** with theme toggle and glassmorphism effects
- **Account management** with credential validation

## 🏗️ Architecture

```
IMAP Accounts → Email Parser → AI Categorizer → Email Storage
                                                      ↓
Slack/Webhook Triggers (for "Interested" emails) ← Category Analysis
                                                      ↓
Express API → React Frontend → Real-time WebSocket Updates
                                                      ↓
Analytics Dashboard ← Email Statistics ← Advanced Filtering
```

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React + Tailwind CSS
- **AI**: Groq API (OpenAI-compatible)
- **Email**: IMAP protocol for Gmail integration
- **Real-time**: WebSocket for live updates
- **Integrations**: Slack Bot API + Generic Webhooks
- **UI/UX**: Modern responsive design with animations

## 📋 Prerequisites

- Node.js 18+ and npm
- Gmail account with App Password (optional)
- Optional: Slack Bot Token and Channel ID
- Optional: Webhook URL for notifications

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd reachinbox-onebox
cp env.example .env
```

### 2. Configure Environment

Edit `.env` with your actual values (see Step 2 above).

### 3. Start Services

```bash
# Install dependencies
npm install

# Start the advanced server
node server-advanced.js
```

### 4. Access the Application

- **Frontend**: http://localhost:4000
- **API Health**: http://localhost:4000/health
- **WebSocket**: ws://localhost:8080

## 🌐 GitHub Deployment Instructions

### For Evaluators/Reviewers:

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd reachinbox-onebox
   ```

2. **Quick Demo Setup (Recommended)**
   ```bash
   # Install dependencies
   npm install
   
   # Start the advanced server
   node server-advanced.js
   ```

3. **Access the Application**
   - Open your browser and go to: **http://localhost:4000**
   - The application will run with mock data for demonstration

4. **Test Key Features**
   - Search emails using the search bar
   - Filter by categories (20+ options available)
   - Click "Suggest Reply" on any email
   - Click "Analytics" to see the visual dashboard
   - Click "Export CSV" to test export functionality
   - Test the theme toggle (bottom-left corner)
   - Try adding a Gmail account via the UI

## 📱 Application Features Demo

### **Real-time Features**
- WebSocket connection status indicator (top-right)
- Live notifications for actions
- Real-time email updates
- Account switching with automatic filtering

### **AI-Powered Analytics**
- Lead scoring (0-100 scale)
- Sentiment analysis (positive/negative/neutral)
- Priority classification (urgent/high/medium/low)
- Visual charts with donut graphs and progress bars
- Category distribution analysis

### **Advanced Search & Filtering**
- Natural language search
- 20+ category filters (Interested, Social, Job, Newsletter, etc.)
- Priority-based filtering (Urgent, High, Medium, Low)
- Sentiment-based filtering (Positive, Negative, Neutral)
- Date range filtering
- Account-specific filtering

### **Email Management**
- AI-generated reply suggestions using Groq API
- Email composer with AI assistance
- Smart export functionality with confirmation dialogs
- Bulk operations
- Real-time reply sending via SMTP

### **Modern UI/UX**
- Responsive design (mobile-friendly)
- Gradient header design with glassmorphism effects
- Dark/Light theme toggle
- Hover animations and smooth transitions
- Toast notifications with positioning
- Floating action buttons
- Sticky header with scroll effects

### **Integrations**
- Slack Bot API for real-time notifications
- Generic Webhook support for custom integrations
- Automatic triggers for "Interested" emails
- Rich message formatting

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start TypeScript development server
npm run demo         # Start TypeScript demo server
npm run demo-js      # Start JavaScript demo server
npm run advanced     # Start advanced demo server (RECOMMENDED)

# Production
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server

# Utilities
npm test            # Run tests
npm run lint        # Run ESLint
```

## 📚 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/accounts` | Get configured Gmail accounts |
| `GET` | `/api/emails/search` | Search emails with advanced filters |
| `GET` | `/api/emails/:id` | Get specific email by ID |
| `POST` | `/api/emails/:id/suggest-reply` | Generate AI reply suggestion |
| `POST` | `/api/emails/compose` | Send email reply |
| `GET` | `/api/emails/export` | Export emails to CSV |
| `GET` | `/api/stats` | Get email statistics and analytics |
| `POST` | `/api/gmail-accounts` | Add new Gmail account |
| `DELETE` | `/api/gmail-accounts/:id` | Delete Gmail account |
| `POST` | `/api/test-integrations` | Test Slack/webhook integrations |
| `POST` | `/api/emails/recategorize` | Recategorize all emails with improved AI |

### Search Parameters

```
GET /api/emails/search?q=query&account=account_1&category=Interested&priority=high&sentiment=positive&page=0&size=20
```

- `q`: Search query (searches subject, body, from)
- `account`: Filter by account ID
- `category`: Filter by AI category (20+ options)
- `priority`: Filter by priority (urgent/high/medium/low)
- `sentiment`: Filter by sentiment (positive/negative/neutral)
- `page`: Page number (0-based)
- `size`: Results per page

## 🎯 Features Implemented

### ✅ Phase 0-1: Core Infrastructure
- [x] Node.js + Express server setup
- [x] Environment configuration
- [x] Health check endpoints
- [x] WebSocket integration

### ✅ Phase 2-3: Email Processing
- [x] IMAP connections for Gmail
- [x] Multi-account support with UI management
- [x] Email parsing and storage
- [x] Real-time email fetching (200+ emails per account)

### ✅ Phase 4: AI Categorization
- [x] LLM-based email categorization with 20+ categories
- [x] Enhanced categorization patterns
- [x] Background processing
- [x] Category-based filtering

### ✅ Phase 5: Integrations
- [x] Slack Bot API notifications
- [x] Generic Webhook support
- [x] "Interested" lead triggers
- [x] Rich message formatting

### ✅ Phase 6: Advanced Frontend
- [x] Modern responsive UI with Tailwind CSS
- [x] Advanced search and filtering
- [x] Visual analytics dashboard
- [x] Export functionality with confirmation dialogs
- [x] Theme toggle (dark/light mode)
- [x] Real-time email management
- [x] Account management with validation

### ✅ Phase 7: Enhanced Features
- [x] AI reply suggestions using Groq API
- [x] Real-time reply sending via SMTP
- [x] Advanced analytics with visual charts
- [x] Smart export with filtering
- [x] Account switching with automatic filtering
- [x] Modern UI/UX with glassmorphism effects
- [x] Toast notifications with positioning
- [x] Sticky header with scroll effects

## 🧪 Testing & Demo

### Manual Testing Checklist

1. **Start Services**
   ```bash
   node server-advanced.js
   ```

2. **Test Gmail Integration**
   - Add Gmail account via UI
   - Verify credential validation
   - Check email fetching (200+ emails)
   - Test account switching

3. **Test AI Categorization**
   - Verify 20+ categories are working
   - Check category filtering
   - Test analytics dashboard

4. **Test Search & Filtering**
   - Use frontend search functionality
   - Test all filter types (category, priority, sentiment, date)
   - Test export functionality

5. **Test AI Features**
   - Click "Suggest Reply" on any email
   - Verify AI-generated response
   - Test reply sending functionality

6. **Test Integrations**
   - Test Slack notifications (if configured)
   - Test Webhook triggers (if configured)
   - Verify "Interested" email triggers

### Postman Collection

Import the following endpoints for API testing:

```json
{
  "info": {
    "name": "ReachInbox Onebox API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": "http://localhost:4000/health"
      }
    },
    {
      "name": "Get Accounts",
      "request": {
        "method": "GET",
        "header": [],
        "url": "http://localhost:4000/api/accounts"
      }
    },
    {
      "name": "Search Emails",
      "request": {
        "method": "GET",
        "header": [],
        "url": "http://localhost:4000/api/emails/search?q=test&page=0&size=10"
      }
    },
    {
      "name": "Suggest Reply",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "url": "http://localhost:4000/api/emails/EMAIL_ID/suggest-reply"
      }
    },
    {
      "name": "Export Emails",
      "request": {
        "method": "GET",
        "header": [],
        "url": "http://localhost:4000/api/emails/export?format=csv&category=Interested"
      }
    },
    {
      "name": "Get Analytics",
      "request": {
        "method": "GET",
        "header": [],
        "url": "http://localhost:4000/api/stats"
      }
    }
  ]
}
```

## 🔧 Development

### Project Structure

```
reachinbox-onebox/
├── src/
│   ├── integrations.ts     # Slack & Webhook integrations
│   ├── accounts.json       # Gmail accounts storage
│   └── categorizer.ts      # AI categorization logic
├── public/
│   ├── index.html         # Main React frontend
│   ├── login.html         # Login page
│   └── signup.html        # Signup page
├── server-advanced.js     # Main server (RECOMMENDED)
├── server-real-gmail.js   # Alternative server
├── package.json           # Dependencies & scripts
├── env.example            # Environment template
└── README.md              # This file
```

### Available Scripts

```bash
node server-advanced.js    # Start advanced server (RECOMMENDED)
node server-real-gmail.js  # Start alternative server
npm install                # Install dependencies
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 4000) |
| `LLM_API_KEY` | Groq API key | Yes (pre-configured) |
| `LLM_API_URL` | LLM completions endpoint | Yes (pre-configured) |
| `LLM_EMBEDDINGS_URL` | Embeddings endpoint | Yes (pre-configured) |
| `SLACK_BOT_TOKEN` | Slack Bot Token | No (optional) |
| `SLACK_CHANNEL_ID` | Slack Channel ID | No (optional) |
| `WEBHOOK_URL` | Webhook URL | No (optional) |
| `IMAP_ACCOUNT_*_USER` | Gmail username | No (can add via UI) |
| `IMAP_ACCOUNT_*_PASS` | Gmail app password | No (can add via UI) |

## 🚨 Troubleshooting

### Common Issues

1. **Server Won't Start**
   ```bash
   # Check if port 4000 is in use
   netstat -ano | findstr :4000
   
   # Kill process using port 4000 (Windows)
   taskkill /PID <PID_NUMBER> /F
   
   # Try alternative port
   PORT=4001 node server-advanced.js
   ```

2. **Missing Dependencies**
   ```bash
   # Install all dependencies
   npm install
   ```

3. **Gmail Connection Failed**
   - Verify app passwords are enabled
   - Check 2-Factor Authentication is enabled
   - Use the UI to add accounts instead of .env

4. **AI Features Not Working**
   - Check Groq API key is valid
   - Verify API endpoint URLs
   - Monitor rate limits and quotas

5. **Frontend Not Loading**
   - Ensure server is running on port 4000
   - Check browser console for errors
   - Verify CORS settings

6. **Slack/Webhook Not Working**
   - Verify tokens and URLs are correct
   - Check Slack channel permissions
   - Test with the "Test Integrations" button

### Logs and Monitoring

```bash
# View application logs
node server-advanced.js

# Check server health
curl http://localhost:4000/health

# Test API endpoints
curl http://localhost:4000/api/stats
```

## 🔒 Security Considerations

- Store sensitive credentials in environment variables
- Use app passwords instead of main email passwords
- Implement rate limiting for API endpoints
- Add authentication for production deployments
- Encrypt sensitive data in transit and at rest
- Validate all user inputs
- Use HTTPS in production

## 🚀 Production Deployment

### Environment Security

- Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- Enable SSL/TLS for all connections
- Implement proper logging and monitoring
- Set up health checks and alerting
- Use environment-specific configurations

## 📈 Performance Optimization

- Implement email deduplication by message-id
- Add caching for frequent searches
- Use connection pooling for database connections
- Implement background job queues for heavy processing
- Optimize frontend bundle size
- Use CDN for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Open an issue in the repository
- Contact the development team

---

**Built with ❤️ by the ReachInbox Team**

## 🎉 Recent Updates

### Version 2.0 - Advanced Features
- ✅ **20+ AI Categories** - Enhanced categorization with comprehensive patterns
- ✅ **Visual Analytics Dashboard** - Donut charts and progress bars
- ✅ **Smart Export System** - Confirmation dialogs and filtering
- ✅ **Real-time Notifications** - Slack Bot API and Webhook integrations
- ✅ **Modern UI/UX** - Glassmorphism effects and theme toggle
- ✅ **Account Management** - UI-based Gmail account addition with validation
- ✅ **Advanced Filtering** - Priority, sentiment, and date-based filtering
- ✅ **AI Reply Suggestions** - Groq API integration for intelligent responses
- ✅ **Responsive Design** - Mobile-friendly interface with animations
- ✅ **Real-time Updates** - WebSocket integration for live data

### Version 1.0 - Core Features
- ✅ **Basic Email Management** - IMAP integration and email fetching
- ✅ **AI Categorization** - 5-category classification system
- ✅ **Search & Filter** - Basic search and filtering capabilities
- ✅ **Export Functionality** - CSV export with basic filtering
- ✅ **React Frontend** - Modern UI with Tailwind CSS