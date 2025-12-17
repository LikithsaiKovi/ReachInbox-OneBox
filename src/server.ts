import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { searchEmails, getEmailById, getEmailStats } from './indexer';
import { generateSuggestedReply } from './rag';
import { testIntegrations } from './integrations';
import { ensureIndex } from './indexer';
import { ensureQdrantCollection } from './rag';
import { initializeImapListeners } from './imapClient';

// Load environment variables
dotenv.config();

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
    version: '1.0.0'
  });
});

// Get configured IMAP accounts
app.get('/api/accounts', (req, res) => {
  const accounts = [];
  
  if (process.env.IMAP_ACCOUNT_1_USER) {
    accounts.push({
      id: 'account_1',
      email: process.env.IMAP_ACCOUNT_1_USER,
      host: process.env.IMAP_ACCOUNT_1_HOST || 'imap.gmail.com'
    });
  }
  
  if (process.env.IMAP_ACCOUNT_2_USER) {
    accounts.push({
      id: 'account_2',
      email: process.env.IMAP_ACCOUNT_2_USER,
      host: process.env.IMAP_ACCOUNT_2_HOST || 'imap.gmail.com'
    });
  }
  
  res.json(accounts);
});

// Search emails endpoint
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
    
    const searchQuery = {
      q: q as string,
      account: account as string,
      folder: folder as string,
      page: parseInt(page as string),
      size: parseInt(size as string),
      category: category as string
    };
    
    const results = await searchEmails(searchQuery);
    
    res.json({
      hits: results.hits.hits,
      total: results.hits.total.value,
      page: searchQuery.page,
      size: searchQuery.size,
      query: searchQuery
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get all emails (simplified endpoint)
app.get('/api/emails', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const results = await searchEmails({
      page: parseInt(offset as string) / parseInt(limit as string),
      size: parseInt(limit as string)
    });
    
    res.json({
      emails: results.hits.hits.map(hit => ({
        id: hit._id,
        ...hit._source
      })),
      total: results.hits.total.value
    });
  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({ 
      error: 'Failed to get emails', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get specific email by ID
app.get('/api/emails/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const email = await getEmailById(id);
    
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    res.json(email);
  } catch (error) {
    console.error('Get email error:', error);
    res.status(500).json({ 
      error: 'Failed to get email', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Generate suggested reply using RAG
app.post('/api/emails/:id/suggest-reply', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get email data
    const email = await getEmailById(id);
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    // Generate reply using RAG
    const emailText = `${email.subject}\n\n${email.body}`;
    const suggestion = await generateSuggestedReply(id, emailText);
    
    res.json({ 
      suggestion,
      emailId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Suggest reply error:', error);
    res.status(500).json({ 
      error: 'Failed to generate reply suggestion', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get email statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getEmailStats();
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get stats', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Test integrations endpoint
app.post('/api/test-integrations', async (req, res) => {
  try {
    await testIntegrations();
    res.json({ message: 'Integration test completed' });
  } catch (error) {
    console.error('Test integrations error:', error);
    res.status(500).json({ 
      error: 'Integration test failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: error.message 
  });
});

// Initialize services and start server
async function startServer() {
  try {
    console.log('Starting ReachInbox Onebox server...');
    
    // Ensure Elasticsearch index exists
    await ensureIndex();
    console.log('✓ Elasticsearch index ready');
    
    // Ensure Qdrant collection exists
    await ensureQdrantCollection();
    console.log('✓ Qdrant collection ready');
    
    // Initialize IMAP listeners
    initializeImapListeners();
    console.log('✓ IMAP listeners initialized');
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📧 IMAP listeners active`);
      console.log(`🔍 Elasticsearch: ${process.env.ES_URL}`);
      console.log(`🧠 Qdrant: ${process.env.QDRANT_URL}`);
      console.log(`🤖 LLM API: ${process.env.LLM_API_URL ? 'Configured' : 'Not configured'}`);
      console.log(`\n📋 Available endpoints:`);
      console.log(`   GET  /api/accounts`);
      console.log(`   GET  /api/emails/search`);
      console.log(`   GET  /api/emails/:id`);
      console.log(`   POST /api/emails/:id/suggest-reply`);
      console.log(`   GET  /api/stats`);
      console.log(`   POST /api/test-integrations`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

// Start the server
startServer();
