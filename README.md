# ReachInbox Onebox

A production-ready email management system that combines real-time IMAP monitoring, AI-powered categorization, and RAG-based reply suggestions.

## ⚡ Quick Demo (2 minutes)

### Option 1: Real Gmail Integration (Recommended)
```bash
git clone <your-repo-url>
cd reachinbox-onebox
npm install
cp env.example .env
# Edit .env with your Gmail app password
npm run real-gmail
```

### Option 2: Mock Data Demo
```bash
git clone <your-repo-url>
cd reachinbox-onebox
npm install
npm run grok
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

### **Step 3: Start the Application**

```bash
# Start with real Gmail integration
npm run real-gmail

# OR start with mock data (for testing)
npm run grok
```

### **Step 4: Access the Application**

- **Frontend**: http://localhost:4000
- **API Health**: http://localhost:4000/health
- **WebSocket**: ws://localhost:8080

## 🚀 Overview

ReachInbox Onebox provides:
- **Real-time IMAP IDLE** monitoring for multiple email accounts
- **AI-powered categorization** of incoming emails (Interested, Meeting Booked, Not Interested, Spam, Out of Office)
- **Elasticsearch indexing** for fast email search and filtering
- **Vector-based RAG** using Qdrant for intelligent reply suggestions
- **Slack & webhook integrations** for instant notifications on interested leads
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
- Slack webhook URL (optional)
- Webhook.site URL for testing (optional)

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
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
WEBHOOK_SITE_URL=https://webhook.site/YOUR-UNIQUE-ID
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
- [x] Slack webhook notifications
- [x] Generic webhook support
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
   - Check Slack/webhook notifications

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
│   ├── integrations.ts   # Slack & webhook triggers
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
| `SLACK_WEBHOOK_URL` | Slack webhook | No |
| `WEBHOOK_SITE_URL` | Test webhook | No |

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
