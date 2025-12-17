# ReachInbox Onebox

A production-ready email management system that combines real-time IMAP monitoring, AI-powered categorization, and RAG-based reply suggestions.

## 🎯 **QUICK START GUIDE**

### **Step 1: Prerequisites**
Ensure you have the following installed:
- **Node.js** (v18+) - [Download here](https://nodejs.org/)
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)

### **Step 2: Setup via Command Prompt**

**Open Command Prompt (Windows: Win+R, type `cmd`, press Enter) or Terminal and run:**

```bash
# 1. Clone the repository
git clone https://github.com/LikithsaiKovi/ReachInbox-OneBox.git
cd ReachInbox-OneBox

# 2. Start Docker services (ensure Docker Desktop is running)
docker-compose up -d

# 3. Install dependencies
npm install

# 4. Start the application
node server-advanced.js
```

### **Step 3: Access the Application**
- **Open your browser and go to:** http://localhost:4000
- **API Health Check:** http://localhost:4000/health
- **WebSocket connection:** ws://localhost:8080

### **Step 4: Using the Application**
1. **Add Gmail Account (Optional):**
   - Click "Add Gmail Account" in the interface
   - Enter your Gmail email (e.g., `yourname@gmail.com`)
   - Enter your Gmail App Password (see setup below if you don't have one)
   - Click "Add Account" - emails will start loading automatically

2. **Key Features:**
- ✅ **Search emails** using the search bar
- ✅ **Filter by categories** (Spam, Interested, Meeting Booked, etc.)
- ✅ **Filter by date range** using the date picker
- ✅ **Export filtered emails** to CSV
- ✅ **Generate AI reply suggestions** by clicking "Suggest Reply"
- ✅ **Send real replies** using the reply functionality
- ✅ **View analytics dashboard** with email statistics

### **Step 5: Stopping the Application**
```bash
# In the command prompt where the server is running:
# Press Ctrl+C to stop the Node.js server

# To stop Docker services:
docker-compose down
```

---

## 🔐 **Gmail App Password Setup (Optional)**

**Only needed if you want to connect your real Gmail account:**

1. **Enable 2-Factor Authentication:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable **2-Step Verification**

2. **Generate App Password:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click **App passwords** → **Mail** → **Other (custom name)**
   - Enter name: "ReachInbox Onebox"
   - **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

3. **Use this password** when adding your Gmail account in the application

---

## 🎯 **What You'll See**
- **Real-time email fetching** from Gmail
- **AI-powered categorization** of emails (Spam, Interested, Meeting Booked, etc.)
- **Advanced filtering** by category, priority, sentiment, and date
- **Export functionality** that respects all your filters
- **AI reply suggestions** for professional responses
- **Analytics dashboard** with email statistics
- **Modern, responsive UI** that works on desktop and mobile

---

## 🚀 **Demo Features**
1. **Add Gmail Account** → Watch emails load in real-time
2. **Search & Filter** → Use category dropdowns and date filters
3. **Export Data** → Click "Export CSV" to download filtered results
4. **AI Features** → Click "Suggest Reply" to see AI-generated responses
5. **Analytics** → View the dashboard with email statistics
6. **Real-time Updates** → Watch the WebSocket connection indicator

---

## 🔧 **Troubleshooting**

**❌ "Docker daemon is not running" error:**
- Make sure **Docker Desktop** is installed and running
- Look for the Docker icon in your system tray
- Wait a few seconds after starting Docker Desktop before running commands

**❌ "Qdrant connection failed" error:**
```bash
# Make sure Docker services are running:
docker ps

# You should see containers for qdrant and elasticsearch
# If not, start them:
docker-compose up -d
```

**❌ "Cannot find module" error:**
```bash
# Install dependencies:
npm install
```

**❌ "Port 4000 already in use" error:**
```bash
# Windows - Find and kill the process:
netstat -ano | findstr :4000
taskkill /PID <PID_NUMBER> /F

# Or change the port:
# Edit server-advanced.js and change PORT to 4001
```

**❌ Application won't start:**
```bash
# Check Node.js installation:
node --version  # Should be v18 or higher
npm --version

# If not installed, download from: https://nodejs.org/
```

**✅ Success Indicators:**
- Docker Desktop shows 2 running containers (qdrant and elasticsearch)
- Terminal shows: "🚀 ReachInbox Onebox Advanced Edition running on port 4000"
- Browser opens successfully at `http://localhost:4000`
- No error messages about Qdrant or database connections

---

## 📋 **Technical Details**

**🎯 Technical Skills:**
- **Full-Stack Development:** React frontend + Node.js backend
- **Real-time Communication:** WebSocket integration for live updates
- **AI Integration:** Groq API for email categorization and reply generation
- **Email Processing:** IMAP protocol for Gmail integration
- **Data Management:** In-memory storage with filtering and export
- **Modern UI/UX:** Responsive design with Tailwind CSS

**🚀 Key Features:**
- **Real-time email fetching** from Gmail accounts
- **AI-powered email categorization** (Spam, Interested, Meeting Booked, etc.)
- **Advanced filtering system** (category, priority, sentiment, date range)
- **Export functionality** that respects all applied filters
- **AI reply suggestions** using Groq API
- **Analytics dashboard** with email statistics
- **Account management** (add/delete Gmail accounts)

**💼 Business Value:**
- **Email management** for sales and recruitment teams
- **Lead prioritization** through AI categorization
- **Data export** for CRM integration
- **Automated reply suggestions** for faster response times
- **Analytics insights** for email performance tracking

---

## ⚡ **Alternative Server Modes**

After completing the setup steps, you can run different server modes based on your needs:

```bash
# 1. Advanced Mode (Recommended - All Features)
node server-advanced.js
# Includes: RAG, Vector DB, WebSocket, Analytics, Export

# 2. Gmail Integration Mode
node server-real-gmail.js
# Includes: Real Gmail IMAP integration

# 3. Demo Mode (No Docker required)
node server-demo.js
# Includes: Mock data for testing without external dependencies
```

---

## 📋 **Complete Setup Guide (Detailed)**

### **Prerequisites Installation**

1. **Install Node.js (v18+)**
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Install Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop/
   - Start Docker Desktop after installation
   - Verify: `docker --version`

### **Application Setup**

**Step 1: Clone and Install**
```bash
git clone https://github.com/LikithsaiKovi/ReachInbox-OneBox.git
cd ReachInbox-OneBox
npm install
```

**Step 2: Start Required Services**
```bash
# Ensure Docker Desktop is running first!
docker-compose up -d

# Verify services are running:
docker ps
# You should see: reachinbox-qdrant and reachinbox-elasticsearch
```

**Step 3: Configure Environment (Optional for Gmail)**
```bash
# Copy example environment file:
cp env.example .env

# Edit .env file with your settings (see Gmail setup below)
```

**Step 4: Start the Server**
```bash
# Advanced server with all features:
node server-advanced.js

# OR simple Gmail demo:
node server-real-gmail.js

# OR demo with mock data:
node server-demo.js
```

**Step 5: Access the Application**
- Open http://localhost:4000 in your browser
- Check health: http://localhost:4000/health

### **Gmail App Password Setup (Optional)**

**🔐 Only needed if you want to connect real Gmail accounts**

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

### **Step 2: Environment Configuration (Optional)**

**Only needed if connecting real Gmail or customizing settings**

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

# Gmail IMAP Configuration
IMAP_ACCOUNT_1_USER=sailikith57@gmail.com
IMAP_ACCOUNT_1_PASS=your-16-character-app-password-here
IMAP_ACCOUNT_1_HOST=imap.gmail.com
IMAP_ACCOUNT_1_PORT=993
IMAP_ACCOUNT_1_TLS=true
```

**⚠️ IMPORTANT:**
- Replace `your-16-character-app-password-here` with your actual Gmail app password
- The `.env` file is in `.gitignore` for security - it won't be pushed to GitHub

### **Step 3: Running the Application**

**Choose one server mode:**

```bash
# 1. Advanced Mode (Recommended - All Features)
node server-advanced.js
# Includes: RAG, Vector DB, WebSocket, Analytics, Export

# 2. Gmail Integration Mode
node server-real-gmail.js
# Includes: Real Gmail IMAP integration

# 3. Demo Mode
node server-demo.js
# Includes: Mock data for testing
```

**Access Points:**
- **Main Application**: http://localhost:4000
- **API Endpoints**: http://localhost:4000/api/*
- **Health Check**: http://localhost:4000/health
- **WebSocket**: ws://localhost:8080

### **Step 4: Verify Everything Works**

1. **Check Docker Services:**
   ```bash
   docker ps
   # Should show: reachinbox-qdrant and reachinbox-elasticsearch
   ```

2. **Check Server Logs:**
   - Look for: "🚀 ReachInbox Onebox Advanced Edition running on port 4000"
   - No errors about Qdrant or database connections

3. **Test in Browser:**
   - Open http://localhost:4000
   - Application loads without errors
   - Can see email interface

## 🚀 Overview

ReachInbox Onebox provides:
- **Real-time IMAP IDLE** monitoring for multiple email accounts
- **AI-powered categorization** of incoming emails (Interested, Meeting Booked, Not Interested, Spam, Out of Office)
- **Elasticsearch indexing** for fast email search and filtering
- **Vector-based RAG** using Qdrant for intelligent reply suggestions
- **Optional Slack integrations** for instant notifications on interested leads
- **Modern React frontend** for email management and search

## 🏗️ Architecture

```
IMAP Accounts → IMAP IDLE Listeners → Email Parser → Elasticsearch Index
                                                      ↓
AI Categorizer ← LLM API ← Email Content
     ↓
Slack/Webhook Triggers (for "Interested" emails)
     ↓
Qdrant Vector Store ← Email Embeddings ← LLM Embeddings API
     ↓
RAG Reply Generator → Express API → React Frontend
```

## 🛠️ Tech Stack

- **Backend**: Node.js + TypeScript + Express
- **Database**: Elasticsearch (search) + Qdrant (vectors)
- **AI**: OpenAI-compatible LLM APIs
- **Frontend**: React + Tailwind CSS
- **Infrastructure**: Docker Compose
- **Integrations**: Slack Webhooks + Generic Webhooks

## 📋 Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- IMAP email accounts with app passwords
- OpenAI API key (or compatible LLM service)
- Optional: Slack webhook URL (for notifications)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <your-private-repo-url>
cd reachinbox-onebox
cp env.example .env
```

### 2. Configure Environment

Edit `.env` with your actual values:

```env
# Server Configuration
PORT=4000
ES_URL=http://localhost:9200
QDRANT_URL=http://localhost:6333

# LLM API Configuration
LLM_API_KEY=sk-your-openai-api-key-here
LLM_API_URL=https://api.openai.com/v1/completions
LLM_EMBEDDINGS_URL=https://api.openai.com/v1/embeddings

# IMAP Account 1
IMAP_ACCOUNT_1_USER=your-email1@example.com
IMAP_ACCOUNT_1_PASS=your-app-password-1
IMAP_ACCOUNT_1_HOST=imap.gmail.com

# IMAP Account 2
IMAP_ACCOUNT_2_USER=your-email2@example.com
IMAP_ACCOUNT_2_PASS=your-app-password-2
IMAP_ACCOUNT_2_HOST=imap.gmail.com

# Integrations (Optional)
# Optional: Slack notifications (uncomment to enable)
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

### 3. Start Services

#### Option A: Full Production Setup (with Docker)
```bash
# Start Elasticsearch and Qdrant
docker-compose up -d

# Install dependencies
npm install

# Build and start the application
npm run build
npm start
```

#### Option B: Demo Mode (No Docker Required)
```bash
# Install dependencies
npm install

# Start the advanced demo server
npm run advanced
# OR
node server-advanced.js
```

### 4. Access the Application

- **Frontend**: http://localhost:4000
- **API Health**: http://localhost:4000/health
- **WebSocket**: ws://localhost:8080 (for real-time updates)
- **Elasticsearch**: http://localhost:9200 (if using Docker)
- **Qdrant**: http://localhost:6333 (if using Docker)

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
   
   # Start the advanced demo server
   node server-advanced.js
   ```

3. **Access the Application**
   - Open your browser and go to: **http://localhost:4000**
   - The application will run with mock data for demonstration

4. **Test Key Features**
   - Search emails using the search bar
   - Filter by categories (Interested, Meeting Booked, etc.)
   - Click "Suggest Reply" on any email
   - Click "Analytics" to see the dashboard
   - Click "Export CSV" to test export functionality
   - Click "Test Integrations" to see real-time notifications

### For Full Production Setup:

1. **Set up Docker Services**
   ```bash
   docker-compose up -d
   ```

2. **Configure Environment Variables**
   ```bash
   cp env.example .env
   # Edit .env with your actual IMAP credentials and API keys
   ```

3. **Start Production Server**
   ```bash
   npm run build
   npm start
   ```

## 📱 Application Features Demo

### **Real-time Features**
- WebSocket connection status indicator (top-right)
- Live notifications for actions
- Real-time email updates

### **AI-Powered Analytics**
- Lead scoring (0-100 scale)
- Sentiment analysis (positive/negative/neutral)
- Priority classification (urgent/high/medium/low)
- Response time tracking

### **Advanced Search & Filtering**
- Natural language search
- Multi-criteria filtering (category, priority, sentiment)
- Priority-based sorting
- Date range filtering

### **Email Management**
- AI-generated reply suggestions
- Email composer with AI assistance
- Export functionality (CSV/JSON)
- Bulk operations

### **Modern UI/UX**
- Responsive design (mobile-friendly)
- Gradient header design
- Hover animations
- Toast notifications
- Floating action buttons

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
| `GET` | `/api/accounts` | Get configured IMAP accounts |
| `GET` | `/api/emails/search` | Search emails with filters |
| `GET` | `/api/emails/:id` | Get specific email by ID |
| `POST` | `/api/emails/:id/suggest-reply` | Generate AI reply suggestion |
| `GET` | `/api/stats` | Get email statistics |
| `POST` | `/api/test-integrations` | Test Slack/webhook integrations |

### Search Parameters

```
GET /api/emails/search?q=query&account=account_1&category=Interested&page=0&size=20
```

- `q`: Search query (searches subject, body, from)
- `account`: Filter by account ID
- `category`: Filter by AI category
- `page`: Page number (0-based)
- `size`: Results per page

## 🎯 Features Implemented

### ✅ Phase 0-1: Core Infrastructure
- [x] Docker Compose setup (Elasticsearch + Qdrant)
- [x] TypeScript project structure
- [x] Environment configuration
- [x] Health check endpoints

### ✅ Phase 2-3: Email Processing
- [x] IMAP IDLE persistent connections
- [x] Multi-account support
- [x] Email parsing and indexing
- [x] Elasticsearch search and filtering

### ✅ Phase 4: AI Categorization
- [x] LLM-based email categorization
- [x] 5-category classification system
- [x] Background processing
- [x] Category-based filtering

### ✅ Phase 5: Integrations
- [x] Optional Slack webhook notifications
- [x] "Interested" lead triggers
- [x] Rich message formatting

### ✅ Phase 6: RAG & Frontend
- [x] Qdrant vector storage
- [x] Email embedding generation
- [x] Similar email retrieval
- [x] AI reply suggestions
- [x] React frontend with search
- [x] Real-time email management

## 🧪 Testing & Demo

### Manual Testing Checklist

1. **Start Services**
   ```bash
   docker-compose up -d
   npm run dev
   ```

2. **Test IMAP Connection**
   - Send test email to configured account
   - Verify email appears in frontend within seconds
   - Check Elasticsearch index: `GET http://localhost:9200/emails/_search`

3. **Test AI Categorization**
   - Send email with "interested" keywords
   - Verify category is set to "Interested"
   - Check optional Slack notifications

4. **Test Search & Filtering**
   - Use frontend search functionality
   - Test category filters
   - Test account-specific searches

5. **Test Reply Suggestions**
   - Click "Suggest Reply" on any email
   - Verify AI-generated response
   - Test copy-to-clipboard functionality

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
    }
  ]
}
```

## 🔧 Development

### Project Structure

```
reachinbox-onebox/
├── src/
│   ├── server.ts          # Express server & API routes
│   ├── imapClient.ts      # IMAP IDLE listeners
│   ├── indexer.ts         # Elasticsearch operations
│   ├── categorizer.ts     # AI categorization & LLM calls
│   ├── integrations.ts   # Optional Slack triggers
│   └── rag.ts            # Qdrant & RAG implementation
├── public/
│   └── index.html        # React frontend
├── docker-compose.yml    # Elasticsearch + Qdrant
├── package.json          # Dependencies & scripts
├── tsconfig.json         # TypeScript configuration
└── env.example           # Environment template
```

### Available Scripts

```bash
npm run dev      # Start development server with ts-node
npm run build    # Compile TypeScript to JavaScript
npm start        # Start production server
npm test         # Run tests (when implemented)
npm run lint     # Run ESLint
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 4000) |
| `ES_URL` | Elasticsearch URL | No (default: localhost:9200) |
| `QDRANT_URL` | Qdrant URL | No (default: localhost:6333) |
| `LLM_API_KEY` | OpenAI API key | Yes |
| `LLM_API_URL` | LLM completions endpoint | Yes |
| `LLM_EMBEDDINGS_URL` | Embeddings endpoint | Yes |
| `IMAP_ACCOUNT_*_USER` | IMAP username | Yes |
| `IMAP_ACCOUNT_*_PASS` | IMAP password | Yes |
| `IMAP_ACCOUNT_*_HOST` | IMAP host | Yes |
| `SLACK_WEBHOOK_URL` | Slack webhook (optional) | No |

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
   
   # Install missing WebSocket dependency
   npm install ws
   ```

3. **IMAP Connection Failed** (Production Mode)
   - Verify app passwords are enabled
   - Check IMAP settings in email provider
   - Ensure firewall allows IMAP connections

4. **Elasticsearch Not Starting** (Production Mode)
   - Check Docker is running
   - Verify port 9200 is available
   - Check Docker logs: `docker-compose logs elasticsearch`

5. **LLM API Errors** (Production Mode)
   - Verify API key is valid
   - Check API endpoint URLs
   - Monitor rate limits and quotas

6. **Frontend Not Loading**
   - Ensure server is running on port 4000
   - Check browser console for errors
   - Verify CORS settings

### Logs and Monitoring

```bash
# View application logs
npm run dev

# View Docker service logs
docker-compose logs -f

# Check Elasticsearch health
curl http://localhost:9200/_cluster/health

# Check Qdrant status
curl http://localhost:6333/collections
```

## 🔒 Security Considerations

- Store sensitive credentials in environment variables
- Use app passwords instead of main email passwords
- Implement rate limiting for API endpoints
- Add authentication for production deployments
- Encrypt sensitive data in transit and at rest

## 🚀 Production Deployment

### Docker Production Setup

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 4000
CMD ["npm", "start"]
```

### Environment Security

- Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- Enable SSL/TLS for all connections
- Implement proper logging and monitoring
- Set up health checks and alerting

## 📈 Performance Optimization

- Implement email deduplication by message-id
- Add caching for frequent searches
- Optimize Elasticsearch queries with proper indexing
- Use connection pooling for database connections
- Implement background job queues for heavy processing

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
