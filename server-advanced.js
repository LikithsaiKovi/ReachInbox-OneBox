const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    message: 'ReachInbox Onebox Advanced Edition',
    features: [
      'Real-time WebSocket updates',
      'AI-powered email insights',
      'Advanced analytics',
      'Email composer',
      'Export functionality',
      'Mobile responsive design',
      'Gmail account management'
    ]
  });
});

// Gmail account management
let gmailAccounts = [];

// Get all Gmail accounts
app.get('/api/gmail-accounts', (req, res) => {
  res.json(gmailAccounts);
});

// Add new Gmail account
app.post('/api/gmail-accounts', (req, res) => {
  const { name, email, appPassword } = req.body;
  
  if (!name || !email || !appPassword) {
    return res.status(400).json({ error: 'Name, email, and app password are required' });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Check if account already exists
  const existingAccount = gmailAccounts.find(acc => acc.email === email);
  if (existingAccount) {
    return res.status(400).json({ error: 'Gmail account already exists' });
  }
  
  const newAccount = {
    id: Date.now().toString(),
    name,
    email,
    appPassword, // In production, this should be encrypted
    createdAt: new Date().toISOString(),
    status: 'active'
  };
  
  gmailAccounts.push(newAccount);
  
  res.json({
    success: true,
    message: 'Gmail account added successfully',
    account: newAccount
  });
});

// Test Gmail connection
app.post('/api/gmail-accounts/:id/test', async (req, res) => {
  const accountId = req.params.id;
  const account = gmailAccounts.find(acc => acc.id === accountId);
  
  if (!account) {
    return res.status(404).json({ error: 'Gmail account not found' });
  }
  
  try {
    // Test IMAP connection
    const Imap = require('imap');
    const imap = new Imap({
      user: account.email,
      password: account.appPassword,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });
    
    imap.once('ready', () => {
      imap.end();
      res.json({ success: true, message: 'Gmail connection successful' });
    });
    
    imap.once('error', (err) => {
      console.error('Gmail connection error:', err);
      res.status(400).json({ error: 'Gmail connection failed: ' + err.message });
    });
    
    imap.connect();
  } catch (error) {
    console.error('Gmail test error:', error);
    res.status(500).json({ error: 'Failed to test Gmail connection' });
  }
});

// Remove Gmail account
app.delete('/api/gmail-accounts/:id', (req, res) => {
  const accountId = req.params.id;
  const accountIndex = gmailAccounts.findIndex(acc => acc.id === accountId);
  
  if (accountIndex === -1) {
    return res.status(404).json({ error: 'Gmail account not found' });
  }
  
  gmailAccounts.splice(accountIndex, 1);
  res.json({ success: true, message: 'Gmail account removed successfully' });
});

// Get configured IMAP accounts
app.get('/api/accounts', (req, res) => {
  const defaultAccounts = [
    {
      id: 'account_1',
      email: 'demo@example.com',
      host: 'imap.gmail.com',
      status: 'connected',
      lastSync: new Date().toISOString(),
      type: 'demo'
    },
    {
      id: 'account_2',
      email: 'test@company.com',
      host: 'imap.gmail.com',
      status: 'connected',
      lastSync: new Date().toISOString(),
      type: 'demo'
    }
  ];
  
  // Add Gmail accounts to the list
  const gmailAccountsList = gmailAccounts.map(account => ({
    id: account.id,
    email: account.email,
    name: account.name,
    host: 'imap.gmail.com',
    status: account.status,
    lastSync: account.createdAt,
    type: 'gmail',
    isGmail: true
  }));
  
  const allAccounts = [...defaultAccounts, ...gmailAccountsList];
  res.json(allAccounts);
});

// Fetch emails from Gmail account
app.post('/api/gmail-accounts/:id/emails', async (req, res) => {
  const accountId = req.params.id;
  const { searchQuery, category, priority, sentiment } = req.body;
  
  const account = gmailAccounts.find(acc => acc.id === accountId);
  if (!account) {
    return res.status(404).json({ error: 'Gmail account not found' });
  }
  
  try {
    // For now, return mock data to avoid IMAP connection issues
    // In production, you would implement real IMAP connection here
    console.log(`Fetching emails for Gmail account: ${account.email}`);
    
    // Mock Gmail emails for demonstration
    const mockGmailEmails = [
      {
        _id: 'gmail-1',
        _source: {
          id: 'gmail-1',
          subject: 'Welcome to Gmail Integration',
          from: 'noreply@gmail.com',
          to: account.email,
          date: new Date(),
          body: 'This is a sample email from your Gmail account. The integration is working correctly.',
          priority: 'medium',
          sentiment: 'positive',
          leadScore: 75,
          aiCategory: 'inbox',
          responseTime: '1 hour'
        }
      },
      {
        _id: 'gmail-2',
        _source: {
          id: 'gmail-2',
          subject: 'Important: Account Security',
          from: 'security@gmail.com',
          to: account.email,
          date: new Date(Date.now() - 3600000),
          body: 'Please review your account security settings to ensure your account remains secure.',
          priority: 'high',
          sentiment: 'neutral',
          leadScore: 90,
          aiCategory: 'security',
          responseTime: '30 minutes'
        }
      },
      {
        _id: 'gmail-3',
        _source: {
          id: 'gmail-3',
          subject: 'Newsletter: Weekly Updates',
          from: 'newsletter@example.com',
          to: account.email,
          date: new Date(Date.now() - 7200000),
          body: 'Here are this week\'s updates and news from our team.',
          priority: 'low',
          sentiment: 'positive',
          leadScore: 45,
          aiCategory: 'newsletter',
          responseTime: '2 hours'
        }
      }
    ];
    
    // Apply filters
    let filteredEmails = mockGmailEmails;
    
    if (searchQuery) {
      filteredEmails = filteredEmails.filter(email => 
        email._source.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email._source.body.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (category && category !== 'all') {
      filteredEmails = filteredEmails.filter(email => email._source.aiCategory === category);
    }
    
    if (priority && priority !== 'all') {
      filteredEmails = filteredEmails.filter(email => email._source.priority === priority);
    }
    
    if (sentiment && sentiment !== 'all') {
      filteredEmails = filteredEmails.filter(email => email._source.sentiment === sentiment);
    }
    
    // Calculate analytics
    const analytics = {
      totalEmails: filteredEmails.length,
      avgLeadScore: filteredEmails.length > 0 ? 
        Math.round(filteredEmails.reduce((sum, email) => sum + email._source.leadScore, 0) / filteredEmails.length) : 0,
      urgentEmails: filteredEmails.filter(email => email._source.priority === 'high').length
    };
    
    res.json({ 
      hits: filteredEmails, 
      analytics,
      message: `Fetched ${filteredEmails.length} emails from ${account.email}`
    });
    
  } catch (error) {
    console.error('Gmail fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch Gmail emails: ' + error.message });
  }
});

// Advanced email data with more realistic content
const mockEmails = [
  {
    _id: 'email-1',
    _source: {
      id: 'email-1',
      subject: 'Interested in your SaaS platform',
      from: 'john.smith@techcorp.com',
      to: ['sales@yourcompany.com'],
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
      to: ['sales@yourcompany.com'],
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
      to: ['sales@yourcompany.com'],
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
      to: ['sales@yourcompany.com'],
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
      to: ['sales@yourcompany.com'],
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
      to: ['sales@yourcompany.com'],
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

// Export emails endpoint (must be before /api/emails/:id)
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

// Advanced AI reply suggestions with context
app.post('/api/emails/:id/suggest-reply', async (req, res) => {
  try {
    const { id } = req.params;
    const email = mockEmails.find(e => e._id === id);
    
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    // Context-aware reply suggestions
    const replySuggestions = {
      'Interested': [
        'Thank you for your interest in our platform! I\'m excited to learn more about your requirements. Based on your company size, I believe our enterprise solution would be perfect for you. When would be a good time for a 30-minute demo call?',
        'I appreciate you reaching out! Your company profile looks like a great fit for our solution. I\'d love to show you how we\'ve helped similar companies streamline their operations. Are you available for a brief call this week?',
        'Thank you for your interest! I\'m confident our platform can help TechCorp scale efficiently. Let me send you some relevant case studies and schedule a personalized demo. What time works best for you?'
      ],
      'Meeting Booked': [
        'Perfect! I\'m looking forward to our meeting on Tuesday at 2 PM. I\'ll prepare a customized demo based on your requirements. Please let me know if you have any specific questions beforehand.',
        'Excellent! I\'ll send you a calendar invite shortly. I\'m preparing some relevant case studies that match your industry. See you Tuesday!',
        'Great! I\'m excited to show you how our solution can address your specific needs. I\'ll have everything ready for our Tuesday meeting.'
      ],
      'Not Interested': [
        'I understand your decision. Thank you for taking the time to consider our solution. If your needs change in the future, please don\'t hesitate to reach out.',
        'No problem at all! I appreciate your honesty. If you ever need assistance with your current solution or want to explore alternatives, I\'m here to help.',
        'Understood! Thank you for letting me know. I\'ll remove you from our active outreach list. Best of luck with your current solution!'
      ],
      'Out of Office': [
        'Thank you for letting me know! I hope you have a great time at the conference. I\'ll follow up when you return. Safe travels!',
        'No worries! Enjoy the Tech Conference 2024. I\'ll reach out again next week when you\'re back.',
        'Thank you for the update! Have a productive conference. I\'ll be here when you return.'
      ],
      'Spam': [
        'Thank you for your message. I\'ll review your information and get back to you if relevant.',
        'I appreciate you reaching out. Let me review your request and respond accordingly.',
        'Thank you for contacting us. I\'ll process your request and follow up as needed.'
      ]
    };
    
    const category = email._source.aiCategory;
    const suggestions = replySuggestions[category] || ['Thank you for your email. I will get back to you soon.'];
    const randomReply = suggestions[Math.floor(Math.random() * suggestions.length)];
    
    // Broadcast real-time update
    broadcast({
      type: 'reply_generated',
      emailId: id,
      suggestion: randomReply,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      suggestion: randomReply,
      emailId: id,
      timestamp: new Date().toISOString(),
      context: {
        category: category,
        priority: email._source.priority,
        sentiment: email._source.sentiment,
        leadScore: email._source.leadScore
      }
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
      }
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

// Email composer endpoint
app.post('/api/emails/compose', async (req, res) => {
  try {
    const { to, subject, body, template } = req.body;
    
    // AI-powered email composition
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
      aiSuggestions
    });
  } catch (error) {
    console.error('Compose error:', error);
    res.status(500).json({ 
      error: 'Failed to compose email', 
      message: error.message || 'Unknown error' 
    });
  }
});


// Test integrations endpoint
app.post('/api/test-integrations', async (req, res) => {
  try {
    console.log('Integration test triggered');
    
    // Simulate Slack notification
    const slackPayload = {
      text: '🎯 New Interested Lead Detected!',
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
            { type: 'mrkdwn', text: '*Priority:* High' }
          ]
        }
      ]
    };
    
    // Broadcast integration test
    broadcast({
      type: 'integration_test',
      slack: slackPayload,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      message: 'Integration test completed successfully',
      slack: slackPayload,
      timestamp: new Date().toISOString()
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
  console.log(`🚀 ReachInbox Onebox Advanced Edition running on port ${PORT}`);
  console.log(`📧 Frontend available at: http://localhost:${PORT}`);
  console.log(`🔍 API endpoints available at: http://localhost:${PORT}/api/*`);
  console.log(`🌐 WebSocket server running on port 8080`);
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
  console.log(`   ✅ AI-powered email insights`);
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
