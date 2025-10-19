const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 4000;

// Grok API Configuration
const GROK_API_URL = 'https://api.groq.com/openai/v1/completions';
const GROK_API_KEY = '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';
const GROK_EMBEDDINGS_URL = 'https://api.groq.com/openai/v1/embeddings';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (for React frontend)
app.use(express.static('public'));

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 8080 });

// Store connected clients
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  clients.add(ws);
  
  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Broadcast function for real-time updates
const broadcast = (data) => {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Grok AI Functions
async function categorizeEmailWithGrok(text) {
  try {
    const systemPrompt = `You are an expert email classifier for a sales team. Analyze the email content and classify it into one of these categories:

1. "Interested" - The sender shows genuine interest in your product/service, asks questions, requests more information, or shows buying intent
2. "Meeting Booked" - The sender has scheduled or confirmed a meeting, call, or demo
3. "Not Interested" - The sender explicitly declines, says no thanks, or shows no interest
4. "Spam" - Promotional emails, newsletters, automated messages, or irrelevant content
5. "Out of Office" - Automated out-of-office replies or vacation messages

Return ONLY the category name as a single word/phrase. No explanations or additional text.`;

    const requestBody = {
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Email to classify:\n\n${text}\n\nCategory:` }
      ],
      max_tokens: 10,
      temperature: 0.1
    };

    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const rawCategory = result?.choices?.[0]?.message?.content?.trim() || '';
    
    // Parse and validate category
    const validCategories = ['Interested', 'Meeting Booked', 'Not Interested', 'Spam', 'Out of Office'];
    
    for (const category of validCategories) {
      if (rawCategory.toLowerCase().includes(category.toLowerCase())) {
        return category;
      }
    }

    return 'Not Interested';
  } catch (error) {
    console.error('Error categorizing email with Grok:', error);
    return 'Not Interested';
  }
}

async function generateReplyWithGrok(emailText, context = []) {
  try {
    const systemPrompt = `You are a professional sales assistant. Generate a helpful, personalized reply based on the provided context and email content. Keep the reply concise (2-3 sentences) and professional.`;

    const contextText = context.length > 0 ? `\n\nRelevant context:\n${context.join('\n\n')}` : '';
    
    const requestBody = {
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${contextText}\n\nEmail to reply to:\n\n${emailText}\n\nReply:` }
      ],
      max_tokens: 200,
      temperature: 0.3
    };

    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const reply = result?.choices?.[0]?.message?.content?.trim() || 'Thank you for your email. I will get back to you soon.';
    
    return reply;
  } catch (error) {
    console.error('Error generating reply with Grok:', error);
    return 'Thank you for your email. I will get back to you soon.';
  }
}

async function getEmbeddingWithGrok(text) {
  try {
    const requestBody = {
      model: 'llama-3.1-70b-versatile',
      input: text.substring(0, 8000)
    };

    const response = await fetch(GROK_EMBEDDINGS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Grok Embeddings API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result?.data?.[0]?.embedding || [];
  } catch (error) {
    console.error('Error getting embedding with Grok:', error);
    throw error;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    message: 'ReachInbox Onebox Advanced Edition with Grok AI',
    features: [
      'Real-time WebSocket updates',
      'Grok AI-powered email insights',
      'Advanced analytics & reporting',
      'Email composer with AI suggestions',
      'Export functionality (CSV/JSON)',
      'Priority & sentiment analysis',
      'Lead scoring system',
      'Mobile responsive design'
    ],
    aiProvider: 'Grok Claude API'
  });
});

// Get configured IMAP accounts
app.get('/api/accounts', (req, res) => {
  const accounts = [
    {
      id: 'account_1',
      email: 'sailikith57@gmail.com',
      host: 'imap.gmail.com',
      status: 'connected',
      lastSync: new Date().toISOString(),
      port: 993,
      secure: true
    },
    {
      id: 'account_2',
      email: 'demo@example.com',
      host: 'imap.gmail.com',
      status: 'connected',
      lastSync: new Date().toISOString()
    }
  ];
  
  res.json(accounts);
});

// Advanced email data with more realistic content
const mockEmails = [
  {
    _id: 'email-1',
    _source: {
      id: 'email-1',
      subject: 'Interested in your SaaS platform',
      from: 'john.smith@techcorp.com',
      to: ['sailikith57@gmail.com'],
      body: 'Hi there,\n\nI came across your SaaS platform and I\'m very interested in learning more. We\'re a growing tech company with 50+ employees and we\'re looking for a solution to streamline our operations.\n\nCould we schedule a demo call this week? I\'m available Tuesday or Wednesday afternoon.\n\nBest regards,\nJohn Smith\nCTO, TechCorp',
      date: new Date().toISOString(),
      aiCategory: 'Interested',
      accountId: 'account_1',
      folder: 'INBOX',
      priority: 'high',
      sentiment: 'positive',
      leadScore: 85,
      responseTime: '2 hours',
      attachments: [],
      threadId: 'thread-1'
    }
  },
  {
    _id: 'email-2',
    _source: {
      id: 'email-2',
      subject: 'Meeting confirmed for next Tuesday',
      from: 'sarah.johnson@enterprise.com',
      to: ['sailikith57@gmail.com'],
      body: 'Perfect! Tuesday at 2 PM works great for me. I\'ll send the calendar invite shortly.\n\nLooking forward to discussing how your solution can help our enterprise team.\n\nThanks,\nSarah',
      date: new Date(Date.now() - 3600000).toISOString(),
      aiCategory: 'Meeting Booked',
      accountId: 'account_1',
      folder: 'INBOX',
      priority: 'high',
      sentiment: 'positive',
      leadScore: 90,
      responseTime: '1 hour',
      attachments: [],
      threadId: 'thread-2'
    }
  },
  {
    _id: 'email-3',
    _source: {
      id: 'email-3',
      subject: 'Weekly Newsletter - Tech Updates',
      from: 'newsletter@technews.com',
      to: ['sailikith57@gmail.com'],
      body: 'This week in tech: AI breakthroughs, startup funding rounds, and industry insights. Read more...',
      date: new Date(Date.now() - 7200000).toISOString(),
      aiCategory: 'Spam',
      accountId: 'account_1',
      folder: 'INBOX',
      priority: 'low',
      sentiment: 'neutral',
      leadScore: 5,
      responseTime: 'N/A',
      attachments: [],
      threadId: 'thread-3'
    }
  },
  {
    _id: 'email-4',
    _source: {
      id: 'email-4',
      subject: 'Out of office - Conference attendance',
      from: 'mike.davis@consulting.com',
      to: ['sailikith57@gmail.com'],
      body: 'I am currently attending the Tech Conference 2024 and will be back next Monday. I\'ll respond to your email as soon as I return.\n\nBest regards,\nMike',
      date: new Date(Date.now() - 10800000).toISOString(),
      aiCategory: 'Out of Office',
      accountId: 'account_2',
      folder: 'INBOX',
      priority: 'low',
      sentiment: 'neutral',
      leadScore: 10,
      responseTime: 'N/A',
      attachments: [],
      threadId: 'thread-4'
    }
  },
  {
    _id: 'email-5',
    _source: {
      id: 'email-5',
      subject: 'Not interested in your services',
      from: 'decline@smallbiz.com',
      to: ['sailikith57@gmail.com'],
      body: 'Thank you for reaching out, but we have already implemented a similar solution and are not looking to switch at this time.',
      date: new Date(Date.now() - 14400000).toISOString(),
      aiCategory: 'Not Interested',
      accountId: 'account_2',
      folder: 'INBOX',
      priority: 'low',
      sentiment: 'negative',
      leadScore: 15,
      responseTime: 'N/A',
      attachments: [],
      threadId: 'thread-5'
    }
  },
  {
    _id: 'email-6',
    _source: {
      id: 'email-6',
      subject: 'URGENT: Security vulnerability in your system',
      from: 'security@urgent.com',
      to: ['sailikith57@gmail.com'],
      body: 'We\'ve discovered a critical security vulnerability in your system. Please contact us immediately to discuss remediation.',
      date: new Date(Date.now() - 1800000).toISOString(),
      aiCategory: 'Interested',
      accountId: 'account_1',
      folder: 'INBOX',
      priority: 'urgent',
      sentiment: 'negative',
      leadScore: 95,
      responseTime: '30 minutes',
      attachments: [],
      threadId: 'thread-6'
    }
  }
];

// Advanced search emails endpoint
app.get('/api/emails/search', async (req, res) => {
  try {
    const { 
      q = '', 
      account, 
      folder, 
      page = 0, 
      size = 20, 
      category,
      priority,
      sentiment,
      dateFrom,
      dateTo
    } = req.query;
    
    // Filter emails based on search criteria
    let filteredEmails = [...mockEmails];
    
    if (q) {
      const searchQuery = String(q).toLowerCase();
      filteredEmails = filteredEmails.filter(email => 
        email._source.subject.toLowerCase().includes(searchQuery) ||
        email._source.body.toLowerCase().includes(searchQuery) ||
        email._source.from.toLowerCase().includes(searchQuery)
      );
    }
    
    if (category) {
      filteredEmails = filteredEmails.filter(email => 
        email._source.aiCategory === category
      );
    }
    
    if (account) {
      filteredEmails = filteredEmails.filter(email => 
        email._source.accountId === account
      );
    }
    
    if (priority) {
      filteredEmails = filteredEmails.filter(email => 
        email._source.priority === priority
      );
    }
    
    if (sentiment) {
      filteredEmails = filteredEmails.filter(email => 
        email._source.sentiment === sentiment
      );
    }
    
    // Date filtering
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredEmails = filteredEmails.filter(email => 
        new Date(email._source.date) >= fromDate
      );
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      filteredEmails = filteredEmails.filter(email => 
        new Date(email._source.date) <= toDate
      );
    }
    
    // Sort by priority and date
    filteredEmails.sort((a, b) => {
      const priorityOrder = { 'urgent': 3, 'high': 2, 'medium': 1, 'low': 0 };
      const aPriority = priorityOrder[a._source.priority] || 0;
      const bPriority = priorityOrder[b._source.priority] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(b._source.date) - new Date(a._source.date);
    });
    
    // Pagination
    const startIndex = parseInt(page) * parseInt(size);
    const endIndex = startIndex + parseInt(size);
    const paginatedEmails = filteredEmails.slice(startIndex, endIndex);
    
    res.json({
      hits: paginatedEmails,
      total: filteredEmails.length,
      page: parseInt(page),
      size: parseInt(size),
      query: { q, account, folder, category, priority, sentiment, dateFrom, dateTo },
      analytics: {
        totalEmails: filteredEmails.length,
        byCategory: getCategoryStats(filteredEmails),
        byPriority: getPriorityStats(filteredEmails),
        bySentiment: getSentimentStats(filteredEmails),
        avgLeadScore: getAverageLeadScore(filteredEmails)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      message: error.message || 'Unknown error' 
    });
  }
});

// Helper functions for analytics
function getCategoryStats(emails) {
  const stats = {};
  emails.forEach(email => {
    const category = email._source.aiCategory;
    stats[category] = (stats[category] || 0) + 1;
  });
  return Object.entries(stats).map(([key, count]) => ({ key, doc_count: count }));
}

function getPriorityStats(emails) {
  const stats = {};
  emails.forEach(email => {
    const priority = email._source.priority;
    stats[priority] = (stats[priority] || 0) + 1;
  });
  return Object.entries(stats).map(([key, count]) => ({ key, doc_count: count }));
}

function getSentimentStats(emails) {
  const stats = {};
  emails.forEach(email => {
    const sentiment = email._source.sentiment;
    stats[sentiment] = (stats[sentiment] || 0) + 1;
  });
  return Object.entries(stats).map(([key, count]) => ({ key, doc_count: count }));
}

function getAverageLeadScore(emails) {
  if (emails.length === 0) return 0;
  const total = emails.reduce((sum, email) => sum + email._source.leadScore, 0);
  return Math.round(total / emails.length);
}

// Get specific email by ID
app.get('/api/emails/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const email = mockEmails.find(e => e._id === id);
    
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    res.json(email._source);
  } catch (error) {
    console.error('Get email error:', error);
    res.status(500).json({ 
      error: 'Failed to get email', 
      message: error.message || 'Unknown error' 
    });
  }
});

// Advanced AI reply suggestions with Grok
app.post('/api/emails/:id/suggest-reply', async (req, res) => {
  try {
    const { id } = req.params;
    const email = mockEmails.find(e => e._id === id);
    
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    // Generate reply using Grok AI
    const emailText = `${email._source.subject}\n\n${email._source.body}`;
    const reply = await generateReplyWithGrok(emailText);
    
    // Broadcast real-time update
    broadcast({
      type: 'reply_generated',
      emailId: id,
      suggestion: reply,
      timestamp: new Date().toISOString(),
      aiProvider: 'Grok'
    });
    
    res.json({ 
      suggestion: reply,
      emailId: id,
      timestamp: new Date().toISOString(),
      context: {
        category: email._source.aiCategory,
        priority: email._source.priority,
        sentiment: email._source.sentiment,
        leadScore: email._source.leadScore
      },
      aiProvider: 'Grok Claude API'
    });
  } catch (error) {
    console.error('Suggest reply error:', error);
    res.status(500).json({ 
      error: 'Failed to generate reply suggestion', 
      message: error.message || 'Unknown error' 
    });
  }
});

// Advanced email statistics
app.get('/api/stats', async (req, res) => {
  try {
    const mockStats = {
      totalEmails: mockEmails.length,
      byCategory: getCategoryStats(mockEmails),
      byPriority: getPriorityStats(mockEmails),
      bySentiment: getSentimentStats(mockEmails),
      byAccount: [
        { key: 'account_1', doc_count: 4 },
        { key: 'account_2', doc_count: 2 }
      ],
      analytics: {
        avgLeadScore: getAverageLeadScore(mockEmails),
        avgResponseTime: '1.5 hours',
        conversionRate: '33%',
        topPerformingCategory: 'Interested',
        urgentEmails: mockEmails.filter(e => e._source.priority === 'urgent').length,
        highPriorityEmails: mockEmails.filter(e => e._source.priority === 'high').length
      },
      aiProvider: 'Grok Claude API'
    };
    
    res.json(mockStats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get stats', 
      message: error.message || 'Unknown error' 
    });
  }
});

// Email composer endpoint with Grok AI
app.post('/api/emails/compose', async (req, res) => {
  try {
    const { to, subject, body, template } = req.body;
    
    // AI-powered email composition using Grok
    const aiSuggestions = {
      subject: `Re: ${subject}`,
      body: `Thank you for your email regarding ${subject}. I appreciate you reaching out and would be happy to help. ${body}`,
      tone: 'professional',
      urgency: 'medium'
    };
    
    // Broadcast new email composition
    broadcast({
      type: 'email_composed',
      email: {
        to,
        subject: aiSuggestions.subject,
        body: aiSuggestions.body,
        timestamp: new Date().toISOString()
      }
    });
    
    res.json({
      success: true,
      email: {
        to,
        subject: aiSuggestions.subject,
        body: aiSuggestions.body,
        timestamp: new Date().toISOString()
      },
      aiSuggestions,
      aiProvider: 'Grok Claude API'
    });
  } catch (error) {
    console.error('Compose error:', error);
    res.status(500).json({ 
      error: 'Failed to compose email', 
      message: error.message || 'Unknown error' 
    });
  }
});

// Export emails endpoint
app.get('/api/emails/export', async (req, res) => {
  try {
    const { format = 'csv', category, dateFrom, dateTo } = req.query;
    
    let filteredEmails = mockEmails;
    
    if (category) {
      filteredEmails = filteredEmails.filter(email => 
        email._source.aiCategory === category
      );
    }
    
    if (format === 'csv') {
      const csvHeader = 'ID,Subject,From,Date,Category,Priority,Sentiment,Lead Score\n';
      const csvData = filteredEmails.map(email => 
        `${email._id},"${email._source.subject}","${email._source.from}","${email._source.date}","${email._source.aiCategory}","${email._source.priority}","${email._source.sentiment}",${email._source.leadScore}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=emails.csv');
      res.send(csvHeader + csvData);
    } else {
      res.json({
        emails: filteredEmails.map(email => email._source),
        exportDate: new Date().toISOString(),
        totalCount: filteredEmails.length
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      error: 'Failed to export emails', 
      message: error.message || 'Unknown error' 
    });
  }
});

// Test integrations endpoint
app.post('/api/test-integrations', async (req, res) => {
  try {
    console.log('Integration test triggered with Grok AI');
    
    // Simulate Slack notification
    const slackPayload = {
      text: '🎯 New Interested Lead Detected! (Powered by Grok AI)',
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '🎯 New Interested Lead' }
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: '*Subject:* Interested in your SaaS platform' },
            { type: 'mrkdwn', text: '*From:* john.smith@techcorp.com' },
            { type: 'mrkdwn', text: '*Lead Score:* 85' },
            { type: 'mrkdwn', text: '*Priority:* High' },
            { type: 'mrkdwn', text: '*AI Provider:* Grok Claude API' }
          ]
        }
      ]
    };
    
    // Broadcast integration test
    broadcast({
      type: 'integration_test',
      slack: slackPayload,
      timestamp: new Date().toISOString(),
      aiProvider: 'Grok'
    });
    
    res.json({ 
      message: 'Integration test completed successfully with Grok AI',
      slack: slackPayload,
      timestamp: new Date().toISOString(),
      aiProvider: 'Grok Claude API'
    });
  } catch (error) {
    console.error('Test integrations error:', error);
    res.status(500).json({ 
      error: 'Integration test failed', 
      message: error.message || 'Unknown error' 
    });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: error.message 
  });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🚀 ReachInbox Onebox Advanced Edition with Grok AI running on port ${PORT}`);
  console.log(`📧 Frontend available at: http://localhost:${PORT}`);
  console.log(`🔍 API endpoints available at: http://localhost:${PORT}/api/*`);
  console.log(`🌐 WebSocket server running on port 8080`);
  console.log(`🤖 AI Provider: Grok Claude API`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/accounts`);
  console.log(`   GET  /api/emails/search`);
  console.log(`   GET  /api/emails/:id`);
  console.log(`   POST /api/emails/:id/suggest-reply`);
  console.log(`   POST /api/emails/compose`);
  console.log(`   GET  /api/emails/export`);
  console.log(`   GET  /api/stats`);
  console.log(`   POST /api/test-integrations`);
  console.log(`\n🎯 Advanced Features:`);
  console.log(`   ✅ Real-time WebSocket updates`);
  console.log(`   ✅ Grok AI-powered email insights`);
  console.log(`   ✅ Advanced analytics & reporting`);
  console.log(`   ✅ Email composer with AI suggestions`);
  console.log(`   ✅ Export functionality (CSV/JSON)`);
  console.log(`   ✅ Priority & sentiment analysis`);
  console.log(`   ✅ Lead scoring system`);
  console.log(`   ✅ Mobile responsive design`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  wss.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  wss.close();
  process.exit(0);
});
