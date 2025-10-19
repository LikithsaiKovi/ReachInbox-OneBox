# ReachInbox Onebox - Development Setup

## Quick Start Commands

```bash
# Clone repository
git clone <your-private-repo-url>
cd reachinbox-onebox

# Copy environment template
cp env.example .env

# Start services
docker-compose up -d

# Install dependencies
npm install

# Build and start
npm run build
npm start

# Or run in development mode
npm run dev
```

## Environment Setup

### Required Services
1. **Docker Compose** - For Elasticsearch and Qdrant
2. **Node.js 18+** - For the application
3. **IMAP Email Accounts** - With app passwords
4. **LLM API Access** - OpenAI or compatible service

### Environment Variables
Copy `env.example` to `.env` and configure:

```env
# Server
PORT=4000

# Databases
ES_URL=http://localhost:9200
QDRANT_URL=http://localhost:6333

# LLM API
LLM_API_KEY=sk-your-key-here
LLM_API_URL=https://api.openai.com/v1/completions
LLM_EMBEDDINGS_URL=https://api.openai.com/v1/embeddings

# IMAP Accounts
IMAP_ACCOUNT_1_USER=your-email@example.com
IMAP_ACCOUNT_1_PASS=your-app-password
IMAP_ACCOUNT_1_HOST=imap.gmail.com

# Integrations
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
WEBHOOK_SITE_URL=https://webhook.site/your-id
```

## Testing Checklist

### 1. Service Health
- [ ] Docker Compose services running
- [ ] Elasticsearch accessible at http://localhost:9200
- [ ] Qdrant accessible at http://localhost:6333
- [ ] Backend server running on port 4000

### 2. IMAP Connection
- [ ] App passwords enabled for email accounts
- [ ] IMAP listeners connecting successfully
- [ ] Test email sent and processed

### 3. AI Integration
- [ ] LLM API key valid
- [ ] Email categorization working
- [ ] Reply suggestions generating

### 4. Integrations
- [ ] Slack webhook configured
- [ ] Webhook.site receiving payloads
- [ ] "Interested" emails triggering notifications

### 5. Frontend
- [ ] React app loading at http://localhost:4000
- [ ] Search functionality working
- [ ] Email list displaying
- [ ] Reply suggestions working

## Common Issues & Solutions

### IMAP Connection Issues
```bash
# Check IMAP settings
# Gmail: Enable 2FA, generate app password
# Outlook: Enable IMAP in settings
# Verify firewall allows IMAP connections
```

### Elasticsearch Issues
```bash
# Check Docker logs
docker-compose logs elasticsearch

# Restart services
docker-compose restart elasticsearch

# Check disk space
df -h
```

### LLM API Issues
```bash
# Verify API key
curl -H "Authorization: Bearer $LLM_API_KEY" https://api.openai.com/v1/models

# Check rate limits
# Monitor API usage in OpenAI dashboard
```

### Frontend Issues
```bash
# Check server logs
npm run dev

# Verify CORS settings
# Check browser console for errors
```

## Development Workflow

### 1. Local Development
```bash
# Start services
docker-compose up -d

# Run in development mode
npm run dev

# Make changes to TypeScript files
# Server will auto-restart
```

### 2. Testing Changes
```bash
# Run tests (when implemented)
npm test

# Check linting
npm run lint

# Build for production
npm run build
```

### 3. Debugging
```bash
# Check application logs
tail -f logs/app.log

# Check Docker logs
docker-compose logs -f

# Monitor Elasticsearch
curl http://localhost:9200/_cluster/health
```

## Production Deployment

### Docker Production
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
- Use secrets management
- Enable SSL/TLS
- Implement authentication
- Set up monitoring
- Configure backups

## Performance Monitoring

### Key Metrics
- Email processing time
- Search response time
- AI categorization accuracy
- Integration success rate
- System resource usage

### Monitoring Tools
- Application logs
- Docker stats
- Elasticsearch monitoring
- Qdrant metrics
- External monitoring (if deployed)

## Troubleshooting Commands

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Check disk usage
docker system df

# Clean up Docker
docker system prune

# Check port usage
netstat -tulpn | grep :4000
netstat -tulpn | grep :9200
netstat -tulpn | grep :6333
```

## Support Resources

- **Documentation**: README.md
- **API Reference**: Postman collection
- **Demo Guide**: DEMO.md
- **Issues**: GitHub issues
- **Team**: Mitrajit, sarvagya-chaudhary
