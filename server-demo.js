const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (for React frontend)
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    message: 'ReachInbox Onebox is running!'
  });
});

// Get configured IMAP accounts
app.get('/api/accounts', (req, res) => {
  const accounts = [
    {
      id: 'account_1',
      email: 'demo@example.com',
      host: 'imap.gmail.com'
    },
    {
      id: 'account_2',
      email: 'test@company.com',
      host: 'imap.gmail.com'
    }
  ];
  
  res.json(accounts);
});

// Mock search emails endpoint (for demo purposes)
app.get('/api/emails/search', async (req, res) => {
  try {
    const { 
      q = '', 
      account, 
      folder, 
      page = 0, 
      size = 20, 
      category 
    } = req.query;
    
    // Mock email data for demonstration
    const mockEmails = [
      {
        _id: 'email-1',
        _source: {
          id: 'email-1',
          subject: 'Interested in your product',
          from: 'prospect@example.com',
          body: 'Hi, I am interested in learning more about your services. Can we schedule a call?',
          date: new Date().toISOString(),
          aiCategory: 'Interested',
          accountId: 'account_1',
          folder: 'INBOX'
        }
      },
      {
        _id: 'email-2',
        _source: {
          id: 'email-2',
          subject: 'Meeting scheduled for next week',
          from: 'client@company.com',
          body: 'Thank you for the demo. I would like to schedule a follow-up meeting for next Tuesday.',
          date: new Date(Date.now() - 3600000).toISOString(),
          aiCategory: 'Meeting Booked',
          accountId: 'account_1',
          folder: 'INBOX'
        }
      },
      {
        _id: 'email-3',
        _source: {
          id: 'email-3',
          subject: 'Newsletter subscription',
          from: 'newsletter@spam.com',
          body: 'Check out our latest offers and promotions!',
          date: new Date(Date.now() - 7200000).toISOString(),
          aiCategory: 'Spam',
          accountId: 'account_1',
          folder: 'INBOX'
        }
      },
      {
        _id: 'email-4',
        _source: {
          id: 'email-4',
          subject: 'Out of office - vacation',
          from: 'colleague@company.com',
          body: 'I am currently on vacation and will be back next week.',
          date: new Date(Date.now() - 10800000).toISOString(),
          aiCategory: 'Out of Office',
          accountId: 'account_2',
          folder: 'INBOX'
        }
      },
      {
        _id: 'email-5',
        _source: {
          id: 'email-5',
          subject: 'Not interested in your offer',
          from: 'decline@example.com',
          body: 'Thank you for reaching out, but we are not interested at this time.',
          date: new Date(Date.now() - 14400000).toISOString(),
          aiCategory: 'Not Interested',
          accountId: 'account_2',
          folder: 'INBOX'
        }
      }
    ];
    
    // Filter emails based on search criteria
    let filteredEmails = mockEmails;
    
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
    
    // Pagination
    const startIndex = parseInt(page) * parseInt(size);
    const endIndex = startIndex + parseInt(size);
    const paginatedEmails = filteredEmails.slice(startIndex, endIndex);
    
    res.json({
      hits: paginatedEmails,
      total: filteredEmails.length,
      page: parseInt(page),
      size: parseInt(size),
      query: { q, account, folder, category }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      message: error.message || 'Unknown error' 
    });
  }
});

// Mock get specific email by ID
app.get('/api/emails/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock email data
    const mockEmail = {
      id: id,
      subject: 'Sample Email',
      from: 'sender@example.com',
      body: 'This is a sample email for demonstration purposes.',
      date: new Date().toISOString(),
      aiCategory: 'Interested',
      accountId: 'account_1',
      folder: 'INBOX'
    };
    
    res.json(mockEmail);
  } catch (error) {
    console.error('Get email error:', error);
    res.status(500).json({ 
      error: 'Failed to get email', 
      message: error.message || 'Unknown error' 
    });
  }
});

// Mock generate suggested reply
app.post('/api/emails/:id/suggest-reply', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock reply suggestions
    const mockReplies = [
      'Thank you for your interest in our product! I would be happy to schedule a call to discuss how we can help your business. Please let me know your availability.',
      'I appreciate you reaching out. I would love to learn more about your requirements and show you how our solution can address your needs. When would be a good time for a brief call?',
      'Thank you for your email. I am excited about the possibility of working together. Let me know when you would be available for a 15-minute discovery call.',
      'I am thrilled to hear about your interest! I would be delighted to schedule a demo to show you how our solution can help your team. What time works best for you?',
      'Thank you for reaching out. I would love to learn more about your specific needs and show you how we can help. When would be convenient for a quick call?'
    ];
    
    const randomReply = mockReplies[Math.floor(Math.random() * mockReplies.length)];
    
    res.json({ 
      suggestion: randomReply,
      emailId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Suggest reply error:', error);
    res.status(500).json({ 
      error: 'Failed to generate reply suggestion', 
      message: error.message || 'Unknown error' 
    });
  }
});

// Mock email statistics
app.get('/api/stats', async (req, res) => {
  try {
    const mockStats = {
      totalEmails: 5,
      byCategory: [
        { key: 'Interested', doc_count: 1 },
        { key: 'Meeting Booked', doc_count: 1 },
        { key: 'Spam', doc_count: 1 },
        { key: 'Not Interested', doc_count: 1 },
        { key: 'Out of Office', doc_count: 1 }
      ],
      byAccount: [
        { key: 'account_1', doc_count: 3 },
        { key: 'account_2', doc_count: 2 }
      ]
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

// Test integrations endpoint
app.post('/api/test-integrations', async (req, res) => {
  try {
    console.log('Integration test triggered');
    res.json({ 
      message: 'Integration test completed successfully',
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
  console.log(`🚀 ReachInbox Onebox server running on port ${PORT}`);
  console.log(`📧 Frontend available at: http://localhost:${PORT}`);
  console.log(`🔍 API endpoints available at: http://localhost:${PORT}/api/*`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/accounts`);
  console.log(`   GET  /api/emails/search`);
  console.log(`   GET  /api/emails/:id`);
  console.log(`   POST /api/emails/:id/suggest-reply`);
  console.log(`   GET  /api/stats`);
  console.log(`   POST /api/test-integrations`);
  console.log(`\n🎯 This is a demo version with mock data.`);
  console.log(`   To enable full functionality, configure Docker services and IMAP accounts.`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});
