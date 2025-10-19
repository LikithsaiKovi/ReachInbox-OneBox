# ReachInbox Onebox - Demo Script

## 5-Minute Demo Video Script

### 0:00-0:30 - Architecture Overview
- Show architecture diagram
- Explain: IMAP → Elasticsearch → AI → Slack → RAG
- Highlight real-time processing and AI capabilities

### 0:30-1:30 - Setup & Services
- Start Docker Compose: `docker-compose up -d`
- Start backend: `npm run dev`
- Show health check: `GET /health`
- Display configured accounts: `GET /api/accounts`

### 1:30-2:30 - Email Processing Demo
- Send test email to configured account
- Show email appearing in frontend within seconds
- Demonstrate search functionality
- Show AI categorization in action
- Filter by categories (Interested, Spam, etc.)

### 2:30-3:30 - Integration Triggers
- Send email with "interested" keywords
- Show Slack notification appearing
- Check webhook.site for payload
- Demonstrate real-time lead detection

### 3:30-4:30 - RAG Reply Suggestions
- Click "Suggest Reply" on an email
- Show AI-generated response
- Demonstrate copy-to-clipboard functionality
- Explain RAG process (similar emails → context → LLM)

### 4:30-5:00 - Wrap-up
- Show GitHub repository
- Highlight production-ready features
- Mention scalability and extensibility

## Demo Checklist

### Pre-Demo Setup
- [ ] Docker Compose running (Elasticsearch + Qdrant)
- [ ] Backend server running on port 4000
- [ ] IMAP accounts configured in .env
- [ ] LLM API key configured
- [ ] Slack webhook URL configured
- [ ] Webhook.site URL configured
- [ ] Test emails ready to send

### Demo Steps
1. **Start Services**
   ```bash
   docker-compose up -d
   npm run dev
   ```

2. **Verify Health**
   - Visit: http://localhost:4000/health
   - Should show: `{"status":"healthy","timestamp":"...","version":"1.0.0"}`

3. **Check Accounts**
   - Visit: http://localhost:4000/api/accounts
   - Should show configured IMAP accounts

4. **Send Test Email**
   - Send email to configured account with subject: "Interested in your product"
   - Body: "Hi, I'm interested in learning more about your services. Can we schedule a call?"
   - Wait 10-30 seconds for processing

5. **Verify Email Processing**
   - Visit frontend: http://localhost:4000
   - Search for "interested"
   - Verify email appears with "Interested" category
   - Check Slack notification
   - Check webhook.site payload

6. **Test Reply Suggestions**
   - Click "Suggest Reply" on any email
   - Verify AI-generated response
   - Test copy functionality

7. **Show Statistics**
   - Visit: http://localhost:4000/api/stats
   - Show category breakdown

### Troubleshooting
- If IMAP connection fails: Check app passwords
- If Elasticsearch fails: Check Docker logs
- If LLM fails: Check API key and rate limits
- If frontend doesn't load: Check server logs

## Postman Testing

### Import Collection
1. Open Postman
2. Import `postman-collection.json`
3. Set base_url variable to `http://localhost:4000`

### Test Endpoints
1. **Health Check**: `GET /health`
2. **Get Accounts**: `GET /api/accounts`
3. **Search Emails**: `GET /api/emails/search?q=test`
4. **Get Stats**: `GET /api/stats`
5. **Suggest Reply**: `POST /api/emails/{id}/suggest-reply`

### Sample Responses

#### Health Check
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

#### Get Accounts
```json
[
  {
    "id": "account_1",
    "email": "test@example.com",
    "host": "imap.gmail.com"
  }
]
```

#### Search Emails
```json
{
  "hits": [
    {
      "_id": "email-123",
      "_source": {
        "subject": "Interested in your product",
        "from": "prospect@company.com",
        "aiCategory": "Interested",
        "date": "2024-01-15T10:00:00.000Z"
      }
    }
  ],
  "total": 1
}
```

#### Suggest Reply
```json
{
  "suggestion": "Thank you for your interest in our product! I'd be happy to schedule a call to discuss how we can help your business. Please let me know your availability.",
  "emailId": "email-123",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Performance Benchmarks

### Expected Performance
- **Email Processing**: < 5 seconds from IMAP to Elasticsearch
- **AI Categorization**: < 10 seconds per email
- **Search Response**: < 500ms for typical queries
- **Reply Generation**: < 15 seconds for RAG-based suggestions

### Load Testing
- **Concurrent IMAP Connections**: 2-5 accounts
- **Email Volume**: 100-1000 emails per hour
- **Search Queries**: 10-50 per minute
- **Reply Suggestions**: 5-20 per minute

## Security Considerations

### Demo Environment
- Use test email accounts only
- Use app passwords, not main passwords
- Use webhook.site for testing webhooks
- Don't expose sensitive data in demos

### Production Considerations
- Implement proper authentication
- Use secrets management
- Enable SSL/TLS
- Implement rate limiting
- Add monitoring and alerting
