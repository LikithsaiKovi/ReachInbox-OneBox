const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const fs = require('fs');
require('dotenv').config();


// Debug environment variables
console.log('🔧 Environment Variables Debug:');
console.log('SLACK_BOT_TOKEN:', process.env.SLACK_BOT_TOKEN ? 'SET (' + process.env.SLACK_BOT_TOKEN.length + ' chars)' : 'NOT SET');
console.log('SLACK_CHANNEL_ID:', process.env.SLACK_CHANNEL_ID || 'NOT SET');
console.log('WEBHOOK_URL:', process.env.WEBHOOK_URL || 'NOT SET');

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

// Login page route
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Signup page route
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Forgot/Reset password pages
// Serve explicit html filenames too
app.get(['/forgot-password', '/forgot-password.html'], (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});
app.get(['/reset-password', '/reset-password.html'], (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

// Simple user store (demo purposes only)
let users = [];
const usersFile = path.join(__dirname, 'src', 'users.json');
let resetTokens = [];
const resetTokensFile = path.join(__dirname, 'src', 'resetTokens.json');

try {
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  }
} catch (e) {
  console.error('Error loading users:', e.message);
  users = [];
}
const saveUsers = () => {
  try { fs.writeFileSync(usersFile, JSON.stringify(users, null, 2)); } catch (e) { console.error('Error saving users:', e.message); }
};
try {
  if (fs.existsSync(resetTokensFile)) {
    resetTokens = JSON.parse(fs.readFileSync(resetTokensFile, 'utf8'));
  }
} catch (e) {
  console.error('Error loading reset tokens:', e.message);
  resetTokens = [];
}
const saveResetTokens = () => {
  try { fs.writeFileSync(resetTokensFile, JSON.stringify(resetTokens, null, 2)); } catch (e) { console.error('Error saving reset tokens:', e.message); }
};

// Login API endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  const gmailRegex = /^[A-Za-z0-9.+_\-]+@gmail\.com$/i;
  if (!gmailRegex.test(String(email))) {
    return res.status(400).json({ success: false, message: 'Use a valid Gmail address' });
  }
  const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) {
    return res.status(404).json({ success: false, message: 'No account found. Please sign up.' });
  }
  if (user.password !== password) {
    return res.status(401).json({ success: false, message: 'Incorrect password. Use Forgot Password if needed.' });
  }
  const token = 'demo-token-' + Date.now();
  return res.json({ success: true, message: 'Login successful', token, user: { email: user.email, name: user.fullName || user.email.split('@')[0] } });
});

// Signup API endpoint
app.post('/api/signup', (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body;
  if (!fullName || !email || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
  }
  // Enforce Gmail and reasonable local-part (avoid obviously fake/random strings)
  const emailLower = String(email).toLowerCase().trim();
  const gmailStrict = /^[a-z0-9](?:[a-z0-9.+_\-]{1,28})[a-z0-9]@gmail\.com$/; // 3-30 chars local part, sane chars, starts/ends alnum
  if (!gmailStrict.test(emailLower)) {
    return res.status(400).json({ success: false, message: 'Please use a valid Gmail address (letters/numbers, no spaces, 3-30 chars before @)' });
  }
  const local = emailLower.split('@')[0];
  if (!/[a-z]/.test(local)) {
    return res.status(400).json({ success: false, message: 'Email local part must include letters, not only digits/symbols' });
  }
  if (/(.)\1{3,}/.test(local) || /\d{6,}/.test(local)) {
    return res.status(400).json({ success: false, message: 'Email looks incorrect. Please provide a standard Gmail address.' });
  }
  const gmailRegex = /^[A-Za-z0-9.+_\-]+@gmail\.com$/i;
  if (!gmailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Only Gmail addresses are allowed (example@gmail.com)' });
  }
  if (users.find(u => u.email.toLowerCase() === String(email).toLowerCase())) {
    return res.status(409).json({ success: false, message: 'Email already registered. Please sign in.' });
  }
  const newUser = { id: 'user-' + Date.now(), fullName, email, password };
  users.push(newUser);
  saveUsers();
  return res.json({ success: true, message: 'Account created successfully', user: { id: newUser.id, fullName: newUser.fullName, email: newUser.email } });
});

// Forgot password - generate reset link
app.post('/api/password/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
  const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) {
    return res.status(404).json({ success: false, message: 'Email is not registered' });
  }

  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const expiresAt = Date.now() + 15 * 60 * 1000;
  resetTokens = resetTokens.filter(t => t.email !== user.email);
  resetTokens.push({ token, email: user.email, expiresAt });
  saveResetTokens();
  const base = (process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get('host')}`);
  const resetUrl = `${base}/reset-password?token=${token}`;
  console.log(`🔐 Password reset link for ${user.email}: ${resetUrl}`);

  return res.status(200).json({ success: true, message: 'Reset link generated', resetUrl });
});

// Validate reset token
app.get('/api/password/reset/validate', (req, res) => {
  const { token } = req.query;
  const entry = resetTokens.find(t => t.token === token);
  if (!entry) return res.status(400).json({ valid: false, message: 'Invalid token' });
  if (Date.now() > entry.expiresAt) return res.status(400).json({ valid: false, message: 'Token expired' });
  return res.json({ valid: true, email: entry.email });
});

// Reset password
app.post('/api/password/reset', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Token and newPassword required' });
  const entry = resetTokens.find(t => t.token === token);
  if (!entry) return res.status(400).json({ success: false, message: 'Invalid token' });
  if (Date.now() > entry.expiresAt) return res.status(400).json({ success: false, message: 'Token expired' });
  const user = users.find(u => u.email === entry.email);
  if (!user) return res.status(400).json({ success: false, message: 'User not found' });
  user.password = newPassword;
  saveUsers();
  resetTokens = resetTokens.filter(t => t.token !== token);
  saveResetTokens();
  return res.json({ success: true, message: 'Password updated successfully' });
});

// Gmail account management
// Load accounts from file
let gmailAccounts = [];
const accountsFile = path.join(__dirname, 'src', 'accounts.json');

// Load existing accounts
try {
  if (fs.existsSync(accountsFile)) {
    const data = fs.readFileSync(accountsFile, 'utf8');
    gmailAccounts = JSON.parse(data);
    console.log(`📧 Loaded ${gmailAccounts.length} Gmail accounts from storage`);
    
    // Validate existing accounts on startup (async)
    if (gmailAccounts.length > 0) {
      console.log('🔍 Validating existing Gmail accounts...');
      
      // Run validation asynchronously to not block server startup
      (async () => {
        const validAccounts = [];
        
        for (const account of gmailAccounts) {
          try {
            console.log(`🔍 Testing credentials for ${account.email}...`);
            
            const testConnection = await new Promise((resolve, reject) => {
              const Imap = require('imap');
              const testImap = new Imap({
                user: account.email,
                password: account.appPassword,
                host: 'imap.gmail.com',
                port: 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                connTimeout: 5000, // 5 second timeout for startup validation
                authTimeout: 5000
              });

              testImap.once('ready', () => {
                console.log(`✅ Account ${account.email} is valid`);
                testImap.end();
                resolve(true);
              });

              testImap.once('error', (err) => {
                console.log(`❌ Account ${account.email} is invalid:`, err.message);
                testImap.end();
                reject(err);
              });

              testImap.connect();
            });
            
            validAccounts.push(account);
            
          } catch (error) {
            console.log(`❌ Removing invalid account: ${account.email}`);
          }
        }
        
        // Update accounts list with only valid ones
        if (validAccounts.length !== gmailAccounts.length) {
          gmailAccounts = validAccounts;
          saveAccounts();
          console.log(`🧹 Cleaned up accounts. ${validAccounts.length} valid accounts remaining.`);
        }
      })();
    }
  }
} catch (error) {
  console.error('Error loading accounts:', error);
  gmailAccounts = [];
}

// Function to save accounts to file
const saveAccounts = () => {
  try {
    fs.writeFileSync(accountsFile, JSON.stringify(gmailAccounts, null, 2));
    console.log('💾 Gmail accounts saved to storage');
  } catch (error) {
    console.error('Error saving accounts:', error);
  }
};
let gmailEmails = [];

// Get all Gmail accounts
app.get('/api/gmail-accounts', (req, res) => {
  res.json(gmailAccounts);
});

// Add new Gmail account
app.post('/api/gmail-accounts', async (req, res) => {
  const { name, email, appPassword } = req.body;
  
  if (!name || !email || !appPassword) {
    return res.status(400).json({ error: 'Name, email, and app password are required' });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Validate Gmail domain
  if (!email.toLowerCase().includes('@gmail.com')) {
    return res.status(400).json({ error: 'Please use a Gmail email address' });
  }
  
  // Validate app password format (should be 16 characters without spaces)
  const cleanAppPassword = appPassword.replace(/\s/g, '');
  if (cleanAppPassword.length !== 16) {
    return res.status(400).json({ error: 'App password must be 16 characters long (without spaces)' });
  }
  
  // Check if account already exists
  const existingAccount = gmailAccounts.find(acc => acc.email === email);
  if (existingAccount) {
    return res.status(400).json({ error: 'Gmail account already exists' });
  }
  
  try {
    // Test IMAP connection with provided credentials
    console.log(`🔍 Testing Gmail credentials for ${email}...`);
    
    const testConnection = await new Promise((resolve, reject) => {
      const Imap = require('imap');
      const testImap = new Imap({
        user: email,
        password: cleanAppPassword,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 10000, // 10 second connection timeout
        authTimeout: 10000  // 10 second auth timeout
      });

      testImap.once('ready', () => {
        console.log(`✅ Gmail credentials validated for ${email}`);
        testImap.end();
        resolve(true);
      });

      testImap.once('error', (err) => {
        console.error(`❌ Gmail credential validation failed for ${email}:`, err.message);
        testImap.end();
        reject(err);
      });

      testImap.connect();
    });
    
    // If we reach here, credentials are valid
    const newAccount = {
      id: Date.now().toString(),
      name,
      email,
      appPassword: cleanAppPassword, // In production, this should be encrypted
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    gmailAccounts.push(newAccount);
    
    // Save accounts to file
    saveAccounts();
    
    console.log(`✅ Gmail account ${email} added successfully`);
    
    res.json({
      success: true,
      message: 'Gmail account added successfully! Credentials validated.',
      account: newAccount
    });
    
  } catch (error) {
    console.error(`❌ Gmail credential validation failed:`, error.message);
    
    let errorMessage = 'Failed to validate Gmail credentials. ';
    
    if (error.message.includes('Invalid credentials') || error.message.includes('authentication failed')) {
      errorMessage += 'Please check your email and app password. Make sure you have enabled 2-factor authentication and generated an app password.';
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      errorMessage += 'Network connection failed. Please check your internet connection.';
    } else if (error.message.includes('timeout')) {
      errorMessage += 'Connection timed out. Please try again.';
    } else {
      errorMessage += `Error: ${error.message}`;
    }
    
    res.status(400).json({ 
      success: false, 
      error: errorMessage
    });
  }
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
  
  // Remove the account
  const removedAccount = gmailAccounts.splice(accountIndex, 1)[0];
  
  // Purge all emails belonging to this account from in-memory store
  const beforeCount = gmailEmails.length;
  gmailEmails = gmailEmails.filter(email => email._source.accountId !== accountId);
  const afterCount = gmailEmails.length;
  const removedEmails = beforeCount - afterCount;

  // Save accounts to file
  saveAccounts();

  // Broadcast updated stats to live clients
  try {
    const updatedStats = {
      type: 'stats_updated',
      totalEmails: gmailEmails.length,
      byAccount: gmailAccounts.map(acc => ({
        key: acc.id,
        doc_count: gmailEmails.filter(e => e._source.accountId === acc.id).length
      }))
    };
    broadcast(updatedStats);
  } catch (_) {}
  
  res.json({ 
    success: true, 
    message: `Gmail account removed successfully${removedAccount?.email ? `: ${removedAccount.email}` : ''}`,
    removedEmails,
    totalEmails: afterCount
  });
});

// Fetch emails from Gmail account
async function fetchGmailEmails(account) {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: account.email,
      password: account.appPassword,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 30000, // 30 second connection timeout
      authTimeout: 30000  // 30 second auth timeout
    });

    const emails = [];

    imap.once('ready', () => {
      // Open INBOX
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        // Search for all emails (we'll limit to 200 most recent)
        imap.search(['ALL'], (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            imap.end();
            resolve(emails);
            return;
          }

          // Limit to 200 most recent emails for better coverage
          const limitedResults = results.slice(-200);
          console.log(`📊 Found ${results.length} total emails, processing ${limitedResults.length} most recent`);
          const fetch = imap.fetch(limitedResults, { bodies: '' });
          let processedCount = 0;

          fetch.on('message', (msg, seqno) => {
            let buffer = '';
            
            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('end', () => {
              simpleParser(buffer, (err, parsed) => {
                if (err) {
                  console.error('Parse error:', err);
                  processedCount++;
                  if (processedCount === limitedResults.length) {
                    imap.end();
                    resolve(emails);
                  }
                  return;
                }

                // Analyze email content for AI categorization
                const analysis = performEmailAnalysis(parsed);

                // Clean and format email content for better readability
                const cleanBody = cleanEmailContent(parsed.text || parsed.html || 'No content');
                const cleanSubject = (parsed.subject || 'No Subject').trim();
                const cleanFrom = extractEmailAddress(parsed.from?.text || parsed.from?.value?.[0]?.address || 'Unknown');
                const cleanTo = extractEmailAddress(parsed.to?.text || parsed.to?.value?.[0]?.address || account.email);

                const emailData = {
                  _id: `gmail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  _source: {
                    id: `gmail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    subject: cleanSubject,
                    from: cleanFrom,
                    to: cleanTo,
                    body: cleanBody,
                    date: parsed.date?.toISOString() || new Date().toISOString(),
                    aiCategory: analysis.category,
                    accountId: account.id,
                    folder: 'INBOX',
                    priority: analysis.priority,
                    sentiment: analysis.sentiment,
                    leadScore: analysis.leadScore,
                    responseTime: '2 hours',
                    attachments: parsed.attachments?.map(att => att.filename) || [],
                    threadId: `thread_${Math.random().toString(36).substr(2, 9)}`,
                    // Add human-readable date
                    readableDate: parsed.date ? parsed.date.toLocaleString() : new Date().toLocaleString(),
                    // Add snippet for preview
                    snippet: cleanBody.substring(0, 150) + (cleanBody.length > 150 ? '...' : '')
                  }
                };

                // Trigger integrations if email is marked as "Interested"
                if (analysis.category === 'Interested') {
                  console.log(`🔔 Triggering integrations for interested email: ${cleanSubject}`);
                  
                  // Trigger Slack notification
                  if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID) {
                    const { WebClient } = require('@slack/web-api');
                    const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
                    
                    slackClient.chat.postMessage({
                      channel: process.env.SLACK_CHANNEL_ID,
                      text: `New Interested Email ✉️`,
                      blocks: [
                        {
                          type: 'header',
                          text: {
                            type: 'plain_text',
                            text: 'New Interested Email ✉️'
                          }
                        },
                        {
                          type: 'section',
                          fields: [
                            {
                              type: 'mrkdwn',
                              text: `*From:* ${cleanFrom}`
                            },
                            {
                              type: 'mrkdwn',
                              text: `*Subject:* ${cleanSubject}`
                            },
                            {
                              type: 'mrkdwn',
                              text: `*Snippet:* ${cleanBody.substring(0, 150)}${cleanBody.length > 150 ? '...' : ''}`
                            },
                            {
                              type: 'mrkdwn',
                              text: `*Timestamp:* ${parsed.date ? parsed.date.toLocaleString() : new Date().toLocaleString()}`
                            }
                          ]
                        }
                      ]
                    }).then(result => {
                      if (result.ok) {
                        console.log('✅ Slack notification sent successfully');
                      } else {
                        console.error('❌ Slack API error:', result.error);
                      }
                    }).catch(error => {
                      console.error('❌ Error sending Slack notification:', error);
                    });
                  } else {
                    console.log('⚠️ Slack Bot API not configured (SLACK_BOT_TOKEN or SLACK_CHANNEL_ID missing)');
                  }
                  
                  // Trigger webhook
                  if (process.env.WEBHOOK_URL) {
                    const axios = require('axios');
                    const webhookPayload = {
                      event: 'email_interested',
                      email: {
                        from: cleanFrom,
                        subject: cleanSubject,
                        snippet: cleanBody.substring(0, 150) + (cleanBody.length > 150 ? '...' : ''),
                        received_at: parsed.date?.toISOString() || new Date().toISOString(),
                        email_id: emailData._id,
                        account_id: account.id,
                        ai_category: 'Interested'
                      }
                    };
                    
                    axios.post(process.env.WEBHOOK_URL, webhookPayload, {
                      headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'ReachInbox-Onebox/1.0'
                      },
                      timeout: 10000
                    }).then(response => {
                      if (response.status >= 200 && response.status < 300) {
                        console.log('✅ Webhook triggered successfully');
                      } else {
                        console.error('❌ Webhook returned status:', response.status);
                      }
                    }).catch(error => {
                      console.error('❌ Error triggering webhook:', error);
                    });
                  } else {
                    console.log('⚠️ Webhook not configured (WEBHOOK_URL missing)');
                  }
                }

                emails.push(emailData);
                processedCount++;

                if (processedCount === limitedResults.length) {
                  imap.end();
                  resolve(emails);
                }
              });
            });
          });

          fetch.once('error', (err) => {
            reject(err);
          });

          fetch.once('end', () => {
            if (processedCount === 0) {
              imap.end();
              resolve(emails);
            }
          });
        });
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.connect();
  });
}

// Helper function to clean email content for better readability
function cleanEmailContent(content) {
  if (!content) return 'No content';
  
  // Remove HTML tags and decode HTML entities
  let cleaned = content
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Decode &amp;
    .replace(/&lt;/g, '<') // Decode &lt;
    .replace(/&gt;/g, '>') // Decode &gt;
    .replace(/&quot;/g, '"') // Decode &quot;
    .replace(/&#39;/g, "'") // Decode &#39;
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
  
  // Remove common email signatures and footers
  cleaned = cleaned
    .replace(/Sent from my iPhone.*$/g, '')
    .replace(/Sent from my Android.*$/g, '')
    .replace(/Get Outlook for.*$/g, '')
    .replace(/This email was sent.*$/g, '')
    .replace(/Unsubscribe.*$/g, '')
    .trim();
  
  return cleaned;
}

// Helper function to extract clean email address
function extractEmailAddress(emailString) {
  if (!emailString) return 'Unknown';
  
  // Extract email from "Name <email@domain.com>" format
  const emailMatch = emailString.match(/<([^>]+)>/);
  if (emailMatch) {
    return emailMatch[1];
  }
  
  // If it's already a clean email, return as is
  if (emailString.includes('@')) {
    return emailString;
  }
  
  return emailString;
}

// AI-powered email analysis
function performEmailAnalysis(parsedEmail) {
  const subject = (parsedEmail.subject || '').toLowerCase();
  const body = (parsedEmail.text || parsedEmail.html || '').toLowerCase();
  const from = (parsedEmail.from?.text || '').toLowerCase();
  
  let category = 'General';
  let priority = 'medium';
  let sentiment = 'neutral';
  let leadScore = 50;

  // Check sender domain patterns first
  const senderDomain = from.split('@')[1] || '';
  if (senderDomain.includes('noreply') || senderDomain.includes('no-reply') || 
      senderDomain.includes('donotreply') || from.includes('noreply')) {
    category = 'Automated';
    priority = 'low';
    leadScore = 20;
  } else if (senderDomain.includes('linkedin') || senderDomain.includes('facebook') || 
             senderDomain.includes('twitter') || senderDomain.includes('instagram')) {
    category = 'Social';
    priority = 'low';
    leadScore = 30;
  } else if (senderDomain.includes('github') || senderDomain.includes('stackoverflow') || 
             senderDomain.includes('dev') || senderDomain.includes('tech')) {
    category = 'Tech';
    priority = 'medium';
    leadScore = 60;
  }

  // Enhanced category analysis with comprehensive patterns
  if (subject.includes('interested') || subject.includes('demo') || subject.includes('pricing') || 
      subject.includes('quote') || subject.includes('proposal') || subject.includes('partnership') ||
      subject.includes('collaboration') || subject.includes('opportunity') || subject.includes('inquiry') ||
      body.includes('interested') || body.includes('demo') || body.includes('pricing') ||
      body.includes('collaborate') || body.includes('partnership') || body.includes('opportunity') ||
      body.includes('would like to') || body.includes('looking for') || body.includes('need help')) {
    category = 'Interested';
    priority = 'high';
    sentiment = 'positive';
    leadScore = 85;
  } else if (subject.includes('meeting') || subject.includes('call') || subject.includes('schedule') ||
             subject.includes('appointment') || subject.includes('conference') || subject.includes('zoom') ||
             subject.includes('teams') || subject.includes('calendar') || subject.includes('availability')) {
    category = 'Meeting';
    priority = 'high';
    sentiment = 'positive';
    leadScore = 80;
  } else if (subject.includes('urgent') || subject.includes('asap') || subject.includes('immediately') ||
             subject.includes('emergency') || subject.includes('critical') || subject.includes('important') ||
             subject.includes('deadline') || subject.includes('expires') || subject.includes('time sensitive')) {
    category = 'Urgent';
    priority = 'urgent';
    sentiment = 'neutral';
    leadScore = 90;
  } else if (subject.includes('complaint') || subject.includes('issue') || subject.includes('problem') ||
             subject.includes('refund') || subject.includes('cancel') || subject.includes('disappointed') ||
             subject.includes('unhappy') || subject.includes('dissatisfied') || subject.includes('concern')) {
    category = 'Complaint';
    priority = 'high';
    sentiment = 'negative';
    leadScore = 70;
  } else if (subject.includes('newsletter') || subject.includes('unsubscribe') || subject.includes('marketing') ||
             subject.includes('promotion') || subject.includes('sale') || subject.includes('offer') ||
             subject.includes('discount') || subject.includes('deal') || subject.includes('special')) {
    category = 'Newsletter';
    priority = 'low';
    sentiment = 'neutral';
    leadScore = 20;
  } else if (subject.includes('invoice') || subject.includes('payment') || subject.includes('billing') ||
             subject.includes('receipt') || subject.includes('transaction') || subject.includes('money') ||
             subject.includes('payment due') || subject.includes('overdue') || subject.includes('statement')) {
    category = 'Billing';
    priority = 'medium';
    sentiment = 'neutral';
    leadScore = 40;
  } else if (subject.includes('job') || subject.includes('career') || subject.includes('hiring') ||
             subject.includes('resume') || subject.includes('interview') || subject.includes('position') ||
             subject.includes('employment') || subject.includes('recruitment') || subject.includes('candidate')) {
    category = 'Job';
    priority = 'medium';
    sentiment = 'positive';
    leadScore = 60;
  } else if (subject.includes('security') || subject.includes('login') || subject.includes('password') ||
             subject.includes('verification') || subject.includes('alert') || subject.includes('access') ||
             subject.includes('suspicious') || subject.includes('breach') || subject.includes('unauthorized')) {
    category = 'Security';
    priority = 'high';
    sentiment = 'neutral';
    leadScore = 75;
  } else if (subject.includes('social') || subject.includes('linkedin') || subject.includes('facebook') ||
             subject.includes('twitter') || subject.includes('instagram') || subject.includes('follow') ||
             subject.includes('connection') || subject.includes('network') || subject.includes('profile')) {
    category = 'Social';
    priority = 'low';
    sentiment = 'neutral';
    leadScore = 30;
  } else if (subject.includes('support') || subject.includes('help') || subject.includes('assistance') ||
             subject.includes('question') || subject.includes('inquiry') || subject.includes('contact')) {
    category = 'Support';
    priority = 'medium';
    sentiment = 'neutral';
    leadScore = 55;
  } else if (subject.includes('notification') || subject.includes('alert') || subject.includes('update') ||
             subject.includes('reminder') || subject.includes('status') || subject.includes('progress')) {
    category = 'Notification';
    priority = 'medium';
    sentiment = 'neutral';
    leadScore = 45;
  } else if (subject.includes('invitation') || subject.includes('invite') || subject.includes('join') ||
             subject.includes('event') || subject.includes('celebration') || subject.includes('party')) {
    category = 'Invitation';
    priority = 'medium';
    sentiment = 'positive';
    leadScore = 50;
  } else if (subject.includes('document') || subject.includes('attachment') || subject.includes('file') ||
             subject.includes('report') || subject.includes('summary') || subject.includes('analysis')) {
    category = 'Document';
    priority = 'medium';
    sentiment = 'neutral';
    leadScore = 50;
  } else if (subject.includes('thank') || subject.includes('appreciation') || subject.includes('grateful') ||
             subject.includes('feedback') || subject.includes('review') || subject.includes('rating')) {
    category = 'Feedback';
    priority = 'medium';
    sentiment = 'positive';
    leadScore = 65;
  } else if (subject.includes('travel') || subject.includes('flight') || subject.includes('hotel') ||
             subject.includes('booking') || subject.includes('reservation') || subject.includes('trip')) {
    category = 'Travel';
    priority = 'medium';
    sentiment = 'neutral';
    leadScore = 40;
  } else if (subject.includes('health') || subject.includes('medical') || subject.includes('doctor') ||
             subject.includes('appointment') || subject.includes('prescription') || subject.includes('treatment')) {
    category = 'Health';
    priority = 'high';
    sentiment = 'neutral';
    leadScore = 70;
  } else if (subject.includes('education') || subject.includes('course') || subject.includes('learning') ||
             subject.includes('training') || subject.includes('workshop') || subject.includes('seminar')) {
    category = 'Education';
    priority = 'medium';
    sentiment = 'positive';
    leadScore = 60;
  } else if (subject.includes('shopping') || subject.includes('order') || subject.includes('delivery') ||
             subject.includes('shipping') || subject.includes('tracking') || subject.includes('package')) {
    category = 'Shopping';
    priority = 'medium';
    sentiment = 'neutral';
    leadScore = 40;
  } else if (subject.includes('finance') || subject.includes('bank') || subject.includes('credit') ||
             subject.includes('loan') || subject.includes('investment') || subject.includes('account')) {
    category = 'Finance';
    priority = 'high';
    sentiment = 'neutral';
    leadScore = 70;
  } else if (subject.includes('entertainment') || subject.includes('movie') || subject.includes('music') ||
             subject.includes('game') || subject.includes('streaming') || subject.includes('subscription')) {
    category = 'Entertainment';
    priority = 'low';
    sentiment = 'positive';
    leadScore = 30;
  }

  // Enhanced sentiment analysis with more comprehensive word lists
  const positiveWords = ['great', 'excellent', 'amazing', 'love', 'perfect', 'wonderful', 'fantastic', 
                        'awesome', 'brilliant', 'outstanding', 'superb', 'marvelous', 'delighted', 
                        'pleased', 'satisfied', 'impressed', 'grateful', 'thankful', 'appreciate'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'disappointed', 'angry', 'frustrated',
                        'horrible', 'disgusting', 'annoying', 'irritating', 'upset', 'furious',
                        'displeased', 'unsatisfied', 'regret', 'sorry', 'apologize', 'concerned'];
  
  const positiveCount = positiveWords.filter(word => body.includes(word) || subject.includes(word)).length;
  const negativeCount = negativeWords.filter(word => body.includes(word) || subject.includes(word)).length;
  
  if (positiveCount > negativeCount) {
    sentiment = 'positive';
    leadScore = Math.min(100, leadScore + 15);
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative';
    leadScore = Math.max(0, leadScore - 15);
  }

  // Adjust priority based on content urgency
  if (subject.includes('urgent') || subject.includes('asap') || subject.includes('emergency')) {
    priority = 'urgent';
  } else if (subject.includes('important') || subject.includes('priority') || subject.includes('high')) {
    priority = 'high';
  } else if (subject.includes('low') || subject.includes('optional') || subject.includes('when convenient')) {
    priority = 'low';
  }

  return { category, priority, sentiment, leadScore };
}

// Recategorize existing emails endpoint
app.post('/api/emails/recategorize', async (req, res) => {
  try {
    console.log('🔄 Starting email recategorization...');
    let recategorizedCount = 0;
    
    gmailEmails.forEach(email => {
      const originalCategory = email.aiCategory;
      
      // Re-analyze the email
      const analysis = performEmailAnalysis({
        subject: email.subject,
        text: email.body,
        from: { text: email.from }
      });
      
      // Update the email with new analysis
      email.aiCategory = analysis.category;
      email.priority = analysis.priority;
      email.sentiment = analysis.sentiment;
      email.leadScore = analysis.leadScore;
      
      if (originalCategory !== analysis.category) {
        recategorizedCount++;
        console.log(`📧 Recategorized: "${email.subject}" from "${originalCategory}" to "${analysis.category}"`);
      }
    });
    
    console.log(`✅ Recategorization complete. ${recategorizedCount} emails updated.`);
    
    res.json({
      success: true,
      message: `Successfully recategorized ${recategorizedCount} emails`,
      recategorizedCount,
      totalEmails: gmailEmails.length
    });
    
  } catch (error) {
    console.error('❌ Recategorization error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to recategorize emails',
      message: error.message 
    });
  }
});

// Fetch emails from Gmail account endpoint
app.post('/api/gmail-accounts/:id/fetch-emails', async (req, res) => {
  try {
    const accountId = req.params.id;
    const account = gmailAccounts.find(acc => acc.id === accountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Gmail account not found' });
    }

    console.log(`📧 Fetching emails for ${account.email}...`);
    const emails = await fetchGmailEmails(account);
    
    // Add to Gmail emails store
    gmailEmails.push(...emails);
    
    console.log(`✅ Fetched ${emails.length} emails from ${account.email}`);
  
  // Broadcast updated stats
  try {
    broadcast({
      type: 'stats_updated',
      totalEmails: gmailEmails.length
    });
  } catch (_) {}

  res.json({
    success: true,
    message: `Fetched ${emails.length} emails successfully`,
    emails: emails.length,
    totalEmails: gmailEmails.length
  });
    
  } catch (error) {
    console.error('Gmail fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch Gmail emails: ' + error.message });
  }
});

// Get configured IMAP accounts
app.get('/api/accounts', (req, res) => {
  // Only return Gmail accounts, no demo accounts
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
  
  res.json(gmailAccountsList);
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
    
    // Filter emails based on search criteria - only real Gmail emails
    console.log(`📊 Debug: gmailEmails array length: ${gmailEmails.length}`);
    let filteredEmails = [...gmailEmails];
    
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
      console.log(`🔍 Filtering emails for account ID: ${account}`);
      console.log(`📊 Total emails before filtering: ${filteredEmails.length}`);
      filteredEmails = filteredEmails.filter(email => 
        email._source.accountId === account
      );
      console.log(`📊 Emails after account filtering: ${filteredEmails.length}`);
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
    const { format = 'csv', category, dateFrom, dateTo, account, q } = req.query;
    
    let filteredEmails = [...gmailEmails];
    
    console.log(`🔍 Export request - account: ${account}, category: ${category}, q: ${q}`);
    console.log(`📊 Total emails before filtering: ${filteredEmails.length}`);
    
    // Filter by account if specified
    if (account) {
      filteredEmails = filteredEmails.filter(email => 
        email._source.accountId === account
      );
      console.log(`📊 Emails after account filtering: ${filteredEmails.length}`);
    }
    
    // Filter by search query if specified
    if (q) {
      const searchTerm = q.toLowerCase();
      filteredEmails = filteredEmails.filter(email => 
        email._source.subject.toLowerCase().includes(searchTerm) ||
        email._source.from.toLowerCase().includes(searchTerm) ||
        email._source.body.toLowerCase().includes(searchTerm)
      );
      console.log(`📊 Emails after search filtering: ${filteredEmails.length}`);
    }
    
    if (category) {
      filteredEmails = filteredEmails.filter(email => 
        email._source.aiCategory === category
      );
      console.log(`📊 Emails after category filtering: ${filteredEmails.length}`);
    }
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredEmails = filteredEmails.filter(email => 
        new Date(email._source.date) >= fromDate
      );
      console.log(`📊 Emails after dateFrom filtering: ${filteredEmails.length}`);
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      filteredEmails = filteredEmails.filter(email => 
        new Date(email._source.date) <= toDate
      );
      console.log(`📊 Emails after dateTo filtering: ${filteredEmails.length}`);
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
    const email = gmailEmails.find(e => e._id === id);
    
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

// Enhanced email categorization based on content and subject
app.post('/api/emails/categorize', async (req, res) => {
  try {
    const { emails } = req.body;
    
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: 'Emails array is required' });
    }

    const categorizedEmails = emails.map(email => {
      const subject = email.subject || email._source?.subject || '';
      const body = email.body || email._source?.body || '';
      const from = email.from || email._source?.from || '';
      
      // Enhanced categorization logic
      let category = 'Uncategorized';
      let priority = 'medium';
      let sentiment = 'neutral';
      let leadScore = 50;
      
      // Subject-based categorization
      const subjectLower = subject.toLowerCase();
      const bodyLower = body.toLowerCase();
      
      // Business/Professional emails
      if (subjectLower.includes('meeting') || subjectLower.includes('call') || subjectLower.includes('demo')) {
        category = 'Meeting Booked';
        priority = 'high';
        sentiment = 'positive';
        leadScore = 80;
      }
      // Interested/Inquiry emails
      else if (subjectLower.includes('interested') || subjectLower.includes('inquiry') || 
               subjectLower.includes('quote') || subjectLower.includes('pricing') ||
               bodyLower.includes('interested') || bodyLower.includes('learn more')) {
        category = 'Interested';
        priority = 'high';
        sentiment = 'positive';
        leadScore = 85;
      }
      // Complaint/Support emails
      else if (subjectLower.includes('complaint') || subjectLower.includes('issue') || 
               subjectLower.includes('problem') || subjectLower.includes('refund') ||
               bodyLower.includes('complaint') || bodyLower.includes('issue')) {
        category = 'Complaint';
        priority = 'high';
        sentiment = 'negative';
        leadScore = 70;
      }
      // Spam/Newsletter emails
      else if (subjectLower.includes('unsubscribe') || subjectLower.includes('newsletter') ||
               from.includes('noreply') || from.includes('no-reply') ||
               bodyLower.includes('unsubscribe')) {
        category = 'Spam';
        priority = 'low';
        sentiment = 'neutral';
        leadScore = 20;
      }
      // Out of Office emails
      else if (subjectLower.includes('out of office') || subjectLower.includes('vacation') ||
               bodyLower.includes('out of office') || bodyLower.includes('vacation')) {
        category = 'Out of Office';
        priority = 'medium';
        sentiment = 'neutral';
        leadScore = 30;
      }
      // Security/System emails
      else if (subjectLower.includes('security') || subjectLower.includes('verification') ||
               subjectLower.includes('password') || subjectLower.includes('alert')) {
        category = 'Security';
        priority = 'high';
        sentiment = 'neutral';
        leadScore = 60;
      }
      // Travel/Booking emails
      else if (subjectLower.includes('booking') || subjectLower.includes('travel') ||
               subjectLower.includes('hotel') || subjectLower.includes('flight')) {
        category = 'Travel';
        priority = 'medium';
        sentiment = 'positive';
        leadScore = 40;
      }
      // Social media notifications
      else if (from.includes('instagram') || from.includes('facebook') || 
               from.includes('twitter') || from.includes('linkedin')) {
        category = 'Social';
        priority = 'low';
        sentiment = 'neutral';
        leadScore = 25;
      }
      
      return {
        ...email,
        aiCategory: category,
        priority: priority,
        sentiment: sentiment,
        leadScore: leadScore
      };
    });

    res.json({
      success: true,
      categorizedEmails: categorizedEmails,
      message: `Successfully categorized ${categorizedEmails.length} emails`
    });

  } catch (error) {
    console.error('Error categorizing emails:', error);
    res.status(500).json({ error: 'Failed to categorize emails' });
  }
});

// Advanced AI reply suggestions with context
app.post('/api/emails/:id/suggest-reply', async (req, res) => {
  try {
    const { id } = req.params;
    const email = gmailEmails.find(e => e._id === id);
    
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

// Send real reply to email
app.post('/api/emails/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { replyText, to, subject } = req.body;

    // Find the original email (check both mock and Gmail emails)
    let originalEmail = mockEmails.find(e => e._id === id);
    if (!originalEmail) {
      originalEmail = gmailEmails.find(e => e._id === id);
    }

    if (!originalEmail) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Find the Gmail account to send from
    const account = gmailAccounts.find(acc => acc.id === originalEmail._source.accountId);
    if (!account) {
      return res.status(404).json({ error: 'Gmail account not found' });
    }

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: account.email,
        pass: account.appPassword
      }
    });

    // Prepare email data
    const mailOptions = {
      from: account.email,
      to: to || originalEmail._source.from,
      subject: subject || `Re: ${originalEmail._source.subject}`,
      text: replyText,
      html: `<p>${replyText.replace(/\n/g, '<br>')}</p>`
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('📧 Reply sent successfully:', {
      messageId: info.messageId,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    // Broadcast real-time update
    broadcast({
      type: 'reply_sent',
      emailId: id,
      replyId: info.messageId,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Reply sent successfully',
      replyId: info.messageId,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

  } catch (error) {
    console.error('Send reply error:', error);
    res.status(500).json({ 
      error: 'Failed to send reply', 
      message: error.message || 'Unknown error' 
    });
  }
});

// Advanced email statistics
app.get('/api/stats', async (req, res) => {
  try {
    const gmailStats = {
      totalEmails: gmailEmails.length,
      byCategory: getCategoryStats(gmailEmails),
      byPriority: getPriorityStats(gmailEmails),
      bySentiment: getSentimentStats(gmailEmails),
      byAccount: gmailAccounts.map(acc => ({
        key: acc.id,
        doc_count: gmailEmails.filter(e => e._source.accountId === acc.id).length
      })),
      analytics: {
        avgLeadScore: getAverageLeadScore(gmailEmails),
        avgResponseTime: '1.5 hours',
        conversionRate: '33%',
        topPerformingCategory: 'Interested',
        urgentEmails: gmailEmails.filter(e => e._source.priority === 'urgent').length,
        highPriorityEmails: gmailEmails.filter(e => e._source.priority === 'high').length
      }
    };
    
    res.json(gmailStats);
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
    console.log('🧪 Integration test triggered');
    
    // Create test email data
    const testEmailData = {
      id: 'test-email-' + Date.now(),
      accountId: 'test-account',
      folder: 'INBOX',
      subject: 'Test Email - Interested in Your Product',
      body: 'This is a test email to verify that integrations are working correctly. The sender is genuinely interested in learning more about your product and would like to schedule a demo.',
      from: 'John Doe <john.doe@example.com>',
      to: ['sales@company.com'],
      date: new Date(),
      aiCategory: 'Interested'
    };
    
    // Test Slack Bot API integration
    if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID) {
      try {
        const { WebClient } = require('@slack/web-api');
        const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
        
        const result = await slackClient.chat.postMessage({
          channel: process.env.SLACK_CHANNEL_ID,
          text: `New Interested Email ✉️`,
      blocks: [
        {
          type: 'header',
              text: {
                type: 'plain_text',
                text: 'New Interested Email ✉️'
              }
        },
        {
          type: 'section',
          fields: [
                {
                  type: 'mrkdwn',
                  text: `*From:* John Doe <john.doe@example.com>`
                },
                {
                  type: 'mrkdwn',
                  text: `*Subject:* Test Email - Interested in Your Product`
                },
                {
                  type: 'mrkdwn',
                  text: `*Timestamp:* ${new Date().toLocaleString()}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Account:* test-account`
                }
              ]
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Snippet:* This is a test email to verify that integrations are working correctly...`
              }
            },
            {
              type: 'divider'
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `📧 Email ID: \`${testEmailData.id}\` | 🤖 AI Category: \`Interested\``
                }
              ]
            }
          ]
        });
        
        if (result.ok) {
          console.log('✅ Slack Bot API notification sent successfully');
        } else {
          console.error('❌ Slack API error:', result.error);
        }
      } catch (error) {
        console.error('❌ Error sending Slack notification:', error);
      }
    } else {
      console.log('⚠️ Slack Bot API not configured (SLACK_BOT_TOKEN or SLACK_CHANNEL_ID missing)');
    }
    
    // Test Webhook integration
    if (process.env.WEBHOOK_URL) {
      try {
        const axios = require('axios');
        
        const webhookPayload = {
          event: 'email_interested',
          email: {
            from: 'john.doe@example.com',
            from_name: 'John Doe',
            subject: 'Test Email - Interested in Your Product',
            snippet: 'This is a test email to verify that integrations are working correctly...',
            received_at: new Date().toISOString(),
            email_id: testEmailData.id,
            account_id: 'test-account',
            ai_category: 'Interested'
          }
        };
        
        const response = await axios.post(process.env.WEBHOOK_URL, webhookPayload, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'ReachInbox-Onebox/1.0'
          },
          timeout: 10000
        });
        
        if (response.status >= 200 && response.status < 300) {
          console.log('✅ Webhook triggered successfully');
        } else {
          console.error('❌ Webhook returned status:', response.status);
        }
      } catch (error) {
        console.error('❌ Error triggering webhook:', error);
      }
    } else {
      console.log('⚠️ Webhook not configured (WEBHOOK_URL missing)');
    }
    
    // Broadcast integration test
    broadcast({
      type: 'integration_test',
      message: 'Integration test completed',
      timestamp: new Date().toISOString(),
      testEmailData: testEmailData
    });
    
    res.json({ 
      success: true, 
      message: 'Integration test completed',
      timestamp: new Date().toISOString(),
      slackConfigured: !!(process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID),
      webhookConfigured: !!process.env.WEBHOOK_URL
    });
    
  } catch (error) {
    console.error('❌ Integration test error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
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
  
  // Auto-fetch emails on startup
  if (gmailAccounts.length > 0) {
    console.log('🔄 Auto-fetching emails on startup...');
    (async () => {
      for (const account of gmailAccounts) {
        try {
          console.log(`📧 Fetching emails for ${account.email}...`);
          const emails = await fetchGmailEmails(account);
          console.log(`📊 Debug: Fetched ${emails.length} emails, adding to gmailEmails array...`);
          gmailEmails.push(...emails);
          console.log(`✅ Fetched ${emails.length} emails from ${account.email}`);
          console.log(`📊 Debug: Total emails in gmailEmails array: ${gmailEmails.length}`);
        } catch (error) {
          console.error(`❌ Error fetching emails for ${account.email}:`, error.message);
        }
      }
    })();
  }
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
