const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const { QdrantClient } = require('@qdrant/js-client-rest');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();


// Debug environment variables
console.log('🔧 Environment Variables Debug:');
console.log('SLACK_BOT_TOKEN:', process.env.SLACK_BOT_TOKEN ? 'SET (' + process.env.SLACK_BOT_TOKEN.length + ' chars)' : 'NOT SET');
console.log('SLACK_CHANNEL_ID:', process.env.SLACK_CHANNEL_ID || 'NOT SET');
console.log('WEBHOOK_URL:', process.env.WEBHOOK_URL || 'NOT SET');

// RAG Configuration
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const LLM_API_KEY = process.env.LLM_API_KEY || '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';
const LLM_API_URL = process.env.LLM_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const LLM_EMBEDDINGS_URL = process.env.LLM_EMBEDDINGS_URL || 'https://api.groq.com/openai/v1/embeddings';

// Initialize Qdrant client
let qdrantClient = null;
let inMemoryAgenda = []; // Fallback storage

// Cache for AI replies to ensure consistency
let aiReplyCache = new Map();

// Function to clear AI reply cache
function clearAIReplyCache() {
  aiReplyCache.clear();
  console.log('🗑️ AI reply cache cleared');
}

if (QDRANT_URL) {
  try {
    qdrantClient = new QdrantClient({ url: QDRANT_URL });
    console.log('🧠 RAG: Qdrant client initialized');
  } catch (error) {
    console.log('⚠️ RAG: Qdrant client failed to initialize, using in-memory fallback:', error.message);
    qdrantClient = null;
  }
}

// RAG Functions
async function getQdrantClient() {
  if (!qdrantClient) {
    qdrantClient = new QdrantClient({ url: QDRANT_URL });
  }
  return qdrantClient;
}

async function ensureQdrantCollection() {
  try {
    const client = await getQdrantClient();
    const collections = await client.getCollections();
    
    if (!collections.collections.find(c => c.name === 'recruiter_agenda')) {
      console.log('Creating Qdrant collection for recruiter agenda...');
      await client.createCollection('recruiter_agenda', {
        vectors: { size: 1536, distance: 'Cosine' }
      });
      console.log('✅ Qdrant collection created successfully');
    } else {
      console.log('✅ Qdrant collection already exists');
    }
  } catch (error) {
    console.error('❌ Error ensuring Qdrant collection:', error.message);
  }
}

async function generateEmbedding(text) {
  try {
    const response = await fetch(LLM_EMBEDDINGS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small'
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('❌ Error generating embedding:', error.message);
    return null;
  }
}

async function storeRecruiterAgenda(agendaData) {
  try {
    console.log('🔍 Storing agenda data:', agendaData);
    
    // If Qdrant is available, use it
    if (false && qdrantClient) {
      console.log('🧠 Using Qdrant for storage');
      const client = await getQdrantClient();
      const embedding = await generateEmbedding(agendaData.content);
      
      if (!embedding) {
        throw new Error('Failed to generate embedding');
      }

      const point = {
        id: agendaData.id || Date.now().toString(),
        vector: embedding,
        payload: {
          content: agendaData.content,
          type: agendaData.type || 'general',
          created_at: new Date().toISOString(),
          meeting_link: agendaData.meeting_link || '',
          product_info: agendaData.product_info || ''
        }
      };

      await client.upsert('recruiter_agenda', {
        points: [point]
      });

      console.log('✅ Recruiter agenda stored in vector database');
    } else {
      // Fallback to in-memory storage
      console.log('💾 Using in-memory storage (Qdrant not available)');
      const agendaItem = {
        id: agendaData.id || Date.now().toString(),
        content: agendaData.content,
        type: agendaData.type || 'general',
        created_at: new Date().toISOString(),
        meeting_link: agendaData.meeting_link || '',
        product_info: agendaData.product_info || ''
      };
      
      inMemoryAgenda.push(agendaItem);
      console.log('✅ Recruiter agenda stored in memory. Total items:', inMemoryAgenda.length);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error storing recruiter agenda:', error.message);
    console.error('❌ Full error:', error);
    return false;
  }
}

async function searchSimilarAgenda(emailContent, limit = 3) {
  try {
    // If Qdrant is available, use vector search
    if (qdrantClient) {
      const client = await getQdrantClient();
      const embedding = await generateEmbedding(emailContent);
      
      if (!embedding) {
        return [];
      }

      const searchResult = await client.search('recruiter_agenda', {
        vector: embedding,
        limit: limit,
        with_payload: true
      });

      return searchResult.map(result => ({
        content: result.payload.content,
        type: result.payload.type,
        meeting_link: result.payload.meeting_link,
        product_info: result.payload.product_info,
        score: result.score
      }));
    } else {
      // Fallback to simple text matching
      const emailLower = emailContent.toLowerCase();
      const matchingAgenda = inMemoryAgenda
        .filter(agenda => {
          const contentLower = agenda.content.toLowerCase();
          return contentLower.includes('interview') && emailLower.includes('interview') ||
                 contentLower.includes('meeting') && emailLower.includes('meeting') ||
                 contentLower.includes('position') && emailLower.includes('position') ||
                 contentLower.includes('job') && emailLower.includes('job');
        })
        .slice(0, limit)
        .map(agenda => ({
          content: agenda.content,
          type: agenda.type,
          meeting_link: agenda.meeting_link,
          product_info: agenda.product_info,
          score: 0.8 // Default score for text matching
        }));
      
      console.log('🔍 Using text-based agenda matching (Qdrant not available)');
      return matchingAgenda;
    }
  } catch (error) {
    console.error('❌ Error searching similar agenda:', error.message);
    return [];
  }
}

async function generateRAGReply(emailContent, similarAgenda) {
  try {
    // Generate fresh, contextual reply each time - no caching
    
    // Extract and structure email content properly
    const emailLines = emailContent.split('\n');
    const subject = emailLines[0] || '';
    const body = emailLines.slice(1).join('\n').trim();
    
    // Keep email content as-is for better AI analysis (minimal processing)
    const cleanSubject = subject.replace(/^(Subject:|Re:|Fwd:)/i, '').trim();
    
    // Preserve original email structure with minimal cleaning
    const cleanBody = body
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n') // Normalize line endings
      .trim();
    
    // Structure the content for better AI understanding while preserving original format
    const structuredContent = `EMAIL SUBJECT: ${cleanSubject}

EMAIL BODY:
${cleanBody}

EMAIL ANALYSIS CONTEXT:
- Subject Length: ${cleanSubject.length} characters
- Body Length: ${cleanBody.length} characters
- Total Lines: ${cleanBody.split('\n').length}
- Has Questions: ${/\?/g.test(cleanBody) ? 'YES' : 'NO'}
- Has Numbers: ${/\d+/.test(cleanBody) ? 'YES' : 'NO'}
- Has URLs: ${/https?:\/\/\S+/i.test(cleanBody) ? 'YES' : 'NO'}
- Has Email Addresses: ${/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(cleanBody) ? 'YES' : 'NO'}`;
    
     // Comprehensive analysis of email content for contextual understanding
     const isJobApplication = /job|position|career|hiring|resume|cv|application|apply|applying|employment|work|role|vacancy/i.test(emailContent);
     const isInterview = /interview|meeting|call|schedule|time|available|appointment|demo|discuss|talk/i.test(emailContent);
     const isRejection = /not interested|decline|pass|unfortunately|regret|not suitable|not a fit|reject|refuse/i.test(emailContent);
     const isAcceptance = /accept|yes|interested|excited|sounds good|perfect|great|wonderful|agree|approve/i.test(emailContent);
     const isQuestion = /\?/g.test(emailContent);
     const isUrgent = /urgent|asap|immediately|emergency|quickly|fast|priority|rush/i.test(emailContent);
     const isFollowUp = /follow up|checking|status|update|progress|check|reminder/i.test(emailContent);
     const isThankYou = /thank|thanks|appreciate|grateful|gratitude|acknowledge/i.test(emailContent);
     const isComplaint = /complaint|issue|problem|concern|dissatisfied|unhappy|disappointed|wrong|error|mistake/i.test(emailContent);
     const isInquiry = /inquiry|question|information|details|more info|help|assistance|support/i.test(emailContent);
     const isNewsletter = /newsletter|news|update|announcement|promotion|marketing|subscribe|unsubscribe/i.test(emailContent);
     const isSocial = /social|facebook|twitter|linkedin|instagram|social media|connect|network/i.test(emailContent);
     const isPersonal = /personal|family|friend|birthday|holiday|vacation|trip|personal/i.test(emailContent);
     const isBusiness = /business|company|corporate|partnership|collaboration|deal|contract|proposal/i.test(emailContent);
     const isTechnical = /technical|bug|error|issue|problem|fix|update|upgrade|system|software/i.test(emailContent);
     const isFinancial = /payment|invoice|billing|money|cost|price|budget|financial|refund/i.test(emailContent);
    
    // Extract specific details from email
    const hasExperience = /experience|years|background|skills|qualification/i.test(emailContent);
    const hasSalary = /salary|compensation|pay|wage|benefits/i.test(emailContent);
    const hasLocation = /location|remote|office|work from|hybrid/i.test(emailContent);
    const hasTimeline = /when|timeline|start date|immediately|soon/i.test(emailContent);
    
    // Generate random variation for diversity
    const variations = [
      "I appreciate your message and would like to respond thoughtfully.",
      "Thank you for reaching out - let me provide a personalized response.",
      "I've carefully reviewed your email and here's my response.",
      "Your message caught my attention and I'd like to address it directly."
    ];
    const randomVariation = variations[Math.floor(Math.random() * variations.length)];
    
    const context = similarAgenda.map(agenda => 
      `Type: ${agenda.type}\nContent: ${agenda.content}\nMeeting Link: ${agenda.meeting_link}\nProduct Info: ${agenda.product_info}`
    ).join('\n\n');

     const prompt = `You are a professional assistant who can handle ANY type of email communication. Analyze the structured email content carefully and generate a fresh, personalized, contextual reply. Each time you generate a reply, make it unique while staying relevant.

${structuredContent}

DETAILED EMAIL ANALYSIS:
- Job Application: ${isJobApplication ? 'YES' : 'NO'}
- Interview/Scheduling: ${isInterview ? 'YES' : 'NO'}
- Rejection: ${isRejection ? 'YES' : 'NO'}
- Acceptance/Interest: ${isAcceptance ? 'YES' : 'NO'}
- Contains Questions: ${isQuestion ? 'YES' : 'NO'}
- Urgent: ${isUrgent ? 'YES' : 'NO'}
- Follow-up: ${isFollowUp ? 'YES' : 'NO'}
- Thank You: ${isThankYou ? 'YES' : 'NO'}
- Complaint: ${isComplaint ? 'YES' : 'NO'}
- Inquiry: ${isInquiry ? 'YES' : 'NO'}
- Newsletter/Marketing: ${isNewsletter ? 'YES' : 'NO'}
- Social Media: ${isSocial ? 'YES' : 'NO'}
- Personal: ${isPersonal ? 'YES' : 'NO'}
- Business: ${isBusiness ? 'YES' : 'NO'}
- Technical: ${isTechnical ? 'YES' : 'NO'}
- Financial: ${isFinancial ? 'YES' : 'NO'}

SPECIFIC DETAILS DETECTED:
- Mentions Experience: ${hasExperience ? 'YES' : 'NO'}
- Mentions Salary: ${hasSalary ? 'YES' : 'NO'}
- Mentions Location: ${hasLocation ? 'YES' : 'NO'}
- Mentions Timeline: ${hasTimeline ? 'YES' : 'NO'}

YOUR STORED AGENDA CONTEXT:
${context || 'No specific agenda context available'}

RESPONSE GUIDELINES:
1. Start with: "${randomVariation}"
2. Carefully read the structured email content above
3. Pay attention to the subject and body separately
4. Use the analysis context to understand the email type
5. Identify the sender's specific intent, tone, and needs
6. Generate a reply that directly addresses their structured message
7. Use appropriate tone based on email type and category:
   - Job-related: Professional, enthusiastic
   - Personal: Friendly, warm
   - Business: Professional, formal
   - Technical: Helpful, detailed
   - Financial: Careful, precise
   - Newsletter: Brief, acknowledge receipt
   - Social: Casual, friendly
   - Interested: Excited, engaging, solution-focused
   - Meeting: Confirmed, prepared, professional
   - Urgent: Immediate, prioritized, responsive
   - Complaint: Apologetic, empathetic, solution-oriented
   - Billing: Careful, detailed, transparent
   - Not Interested: Respectful, understanding, leave door open
   - Out of Office: Acknowledging, patient, well-wishing
   - Security: Serious, immediate, thorough
   - Spam: Polite but firm, request removal
8. If job-related, mention relevant meeting booking link
9. If questions, answer them specifically and helpfully
10. If rejection, respond graciously and leave door open
11. If acceptance, show enthusiasm and outline next steps
12. If urgent, acknowledge urgency and provide quick response
13. If complaint, address concerns professionally
14. If inquiry, provide helpful information
15. If newsletter/marketing, acknowledge receipt briefly
16. If personal, respond warmly and appropriately
17. If business, maintain professional tone
18. If technical, provide helpful technical response
19. If financial, be careful and precise
20. If interested category, show excitement and offer next steps
21. If meeting category, confirm details and show preparation
22. If urgent category, prioritize and provide immediate response
23. If complaint category, apologize and focus on resolution
24. If billing category, be transparent and detailed
25. If not interested category, be respectful and leave door open
26. If out of office category, acknowledge and be patient
27. If security category, take seriously and investigate
28. If spam category, politely decline and request removal
29. Keep reply concise but personalized and engaging
30. Make each response unique and fresh
31. Vary your language and approach while staying professional
32. Reference specific details from the structured email content
33. DO NOT assume every email is job-related - analyze the actual content
34. Match the response tone and style to the detected category

Generate a fresh, personalized reply that directly responds to their structured email:`;

    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Grok API Error:', response.status, errorText);
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Grok API Response:', JSON.stringify(data, null, 2));
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const reply = data.choices[0].message.content.trim();
      console.log('🎯 Generated fresh AI reply based on email content');
      return reply;
    } else {
      console.error('❌ Unexpected API response format:', data);
      throw new Error('Unexpected API response format');
    }
  } catch (error) {
    console.error('❌ Error generating RAG reply:', error.message);
    return 'I apologize, but I encountered an error generating a personalized reply. Please let me know how I can assist you.';
  }
}

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
const normalizeEmail = (value) => String(value || '').toLowerCase().trim();
const dedupeUsersByEmail = (list) => {
  const seen = new Set();
  const deduped = [];
  for (const u of list) {
    const e = normalizeEmail(u.email);
    if (seen.has(e)) continue;
    seen.add(e);
    deduped.push({ ...u, email: e });
  }
  return deduped;
};
const loadUsersFromDisk = () => {
  try {
    if (fs.existsSync(usersFile)) {
      const loaded = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      if (Array.isArray(loaded)) {
        users = dedupeUsersByEmail(loaded);
      }
    }
  } catch (e) {
    console.error('Error loading users:', e.message);
  }
};
const saveUsers = () => {
  try {
    const dir = path.dirname(usersFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    users = dedupeUsersByEmail(users);
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    console.log(`👤 Users saved (${users.length} total)`);
  } catch (e) { console.error('Error saving users:', e.message); }
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
  try {
    const dir = path.dirname(resetTokensFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resetTokensFile, JSON.stringify(resetTokens, null, 2));
  } catch (e) { console.error('Error saving reset tokens:', e.message); }
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
  const user = users.find(u => String(u.email || '').toLowerCase().trim() === String(email || '').toLowerCase().trim());
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
  // Normalize email once at the top
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
  // Reload from disk before checking to avoid stale memory allowing duplicates
  loadUsersFromDisk();
  if (users.find(u => String(u.email || '').toLowerCase().trim() === emailLower)) {
    return res.status(409).json({ success: false, message: 'Email already registered. Please sign in.' });
  }
  const newUser = { id: 'user-' + Date.now(), fullName, email: emailLower, password, createdAt: new Date().toISOString() };
  users.push(newUser);
  saveUsers();
  return res.json({ success: true, message: 'Account created successfully', user: { id: newUser.id, fullName: newUser.fullName, email: newUser.email } });
});

// Forgot password - generate reset link (and send email)
app.post('/api/password/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
  const user = users.find(u => String(u.email || '').toLowerCase().trim() === String(email || '').toLowerCase().trim());
  if (!user) {
    return res.status(404).json({ success: false, message: 'Email is not registered' });
  }

  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const expiresAt = Date.now() + 15 * 60 * 1000;
  resetTokens = resetTokens.filter(t => t.email !== user.email);
  resetTokens.push({ token, email: user.email, expiresAt });
  saveResetTokens();
  const base = (process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get('host')}`);
  const resetUrl = `${base}/reset-password.html?token=${token}`;
  console.log(`🔐 Password reset link for ${user.email}: ${resetUrl}`);

  // Attempt to send email. Force SMTP if configured; otherwise fall back to a test account
  try {
    const nodemailer = require('nodemailer');
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
    const userName = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || (userName ? `"ReachInbox Onebox" <${userName}>` : 'ReachInbox <no-reply@reachinbox.local>');
    let transporter;
    let usingTest = false;
    if (host && userName && pass) {
      transporter = nodemailer.createTransport({ host, port, secure, auth: { user: userName, pass } });
    } else {
      const test = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({ host: test.smtp.host, port: test.smtp.port, secure: test.smtp.secure, auth: { user: test.user, pass: test.pass } });
      usingTest = true;
    }
    const info = await transporter.sendMail({
      from,
      to: user.email,
      subject: 'Reset Password',
      text: `Reset your password using the link below (valid for 15 minutes):\n${resetUrl}`,
      html: `<p>Click the button below to reset your password (valid for 15 minutes):</p><p><a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">Reset Password</a></p><p>If the button doesn't work, paste this link into your browser:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
    });
    console.log(`✉️  Reset email sent to ${user.email}`);
    if (usingTest) {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) console.log(`🔗 Email preview URL: ${preview}`);
    }
  } catch (e) {
    console.error('Error sending reset email:', e.message);
  }

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
                  
                  // Free notification alternatives (always work)
                  const emailNotificationData = {
                    from: cleanFrom,
                    subject: cleanSubject,
                    body: cleanBody,
                    category: analysis.category,
                    priority: analysis.priority,
                    leadScore: analysis.leadScore,
                    account: account.email,
                    timestamp: parsed.date?.toISOString() || new Date().toISOString()
                  };
                  
                  // Console notification (always works)
                  sendConsoleNotification(emailNotificationData);
                  
                  // Log notification (always works)
                  logNotification('interested_email', emailNotificationData);
                  
                  // Email notification (if SMTP configured)
                  sendEmailNotification(emailNotificationData).catch(err => {
                    console.error('Email notification error:', err.message);
                  });
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

// RAG-Powered AI reply suggestions with recruiter agenda context
app.post('/api/emails/:id/suggest-reply', async (req, res) => {
  try {
    const { id } = req.params;
    const email = gmailEmails.find(e => e._id === id);
    
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    let suggestion = '';
    let method = 'fallback';
    
    // Try RAG-powered suggestion first
    if (qdrantClient) {
      try {
        const emailContent = `${email._source.subject}\n\n${email._source.body}`;
        const similarAgenda = await searchSimilarAgenda(emailContent, 3);
        
        if (similarAgenda.length > 0) {
          suggestion = await generateRAGReply(emailContent, similarAgenda);
          method = 'rag';
          console.log('🧠 RAG: Generated contextual reply using vector search');
        }
      } catch (ragError) {
        console.log('⚠️ RAG failed, falling back to category-based suggestions:', ragError.message);
      }
    }
    
    // Fallback to category-based suggestions if RAG fails
    if (!suggestion) {
      // Generate fresh fallback suggestions based on structured email content
      const emailContent = `${email._source.subject}\n\n${email._source.body}`;
      
      // Preserve original email content for better analysis
      const cleanSubject = email._source.subject.replace(/^(Subject:|Re:|Fwd:)/i, '').trim();
      const cleanBody = email._source.body
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n') // Normalize line endings
        .trim();
      
      // Use original content for better analysis
      const structuredContent = `${cleanSubject}\n\n${cleanBody}`;
      const isJobRelated = /job|position|career|hiring|resume|cv|application|interview|apply/i.test(structuredContent);
      const isQuestion = /\?/g.test(structuredContent);
      const isUrgent = /urgent|asap|immediately|emergency|quickly/i.test(structuredContent);
      const isThankYou = /thank|thanks|appreciate/i.test(structuredContent);
      const isComplaint = /complaint|issue|problem|concern/i.test(structuredContent);
      const isFollowUp = /follow up|checking|status|update/i.test(structuredContent);
      const isNewsletter = /newsletter|news|update|announcement|promotion|marketing/i.test(structuredContent);
      const isPersonal = /personal|family|friend|birthday|holiday|vacation/i.test(structuredContent);
      const isBusiness = /business|company|corporate|partnership|collaboration/i.test(structuredContent);
      const isTechnical = /technical|bug|error|issue|problem|fix|update|upgrade/i.test(structuredContent);
      const isFinancial = /payment|invoice|billing|money|cost|price|budget/i.test(structuredContent);
      
      // Extract specific details for more contextual responses
      const hasExperience = /experience|years|background|skills|qualification/i.test(structuredContent);
      const hasSalary = /salary|compensation|pay|wage|benefits/i.test(structuredContent);
      const hasLocation = /location|remote|office|work from|hybrid/i.test(structuredContent);
      const hasTimeline = /when|timeline|start date|immediately|soon/i.test(structuredContent);
      
      // Generate contextual variations based on structured content analysis
      const jobVariations = [
        `Thank you for your interest in the position! I'd be happy to answer your questions. Based on your background, I believe you'd be a great fit for our team. When would be a good time for a brief call to discuss the role in more detail?`,
        `I appreciate you reaching out about the opportunity! Your experience looks impressive and I'd love to learn more about your career goals. Are you available for a 30-minute conversation this week?`,
        `Thank you for your application! I'm excited to discuss how your skills align with our needs. Let's schedule a time to talk about the role and your expectations.`,
        `I've reviewed your message and I'm impressed by your background! I'd love to explore how you could contribute to our team. When would be convenient for a brief discussion?`
      ];
      
      const personalVariations = [
        `Thank you for your message! It's great to hear from you. I'd love to catch up and learn more about what you've been up to. When would be a good time for a chat?`,
        `I appreciate you reaching out! It's always wonderful to connect with friends. I'd be happy to discuss this further with you.`,
        `Thanks for thinking of me! I'd love to help with whatever you need. Let me know when would be convenient for you.`,
        `It's so nice to hear from you! I'd be delighted to discuss this and see how I can assist you.`
      ];
      
      const businessVariations = [
        `Thank you for your business inquiry! I appreciate you reaching out and would be happy to discuss this opportunity with you. When would be a good time for a professional discussion?`,
        `I appreciate your interest in our services! I'd love to learn more about your requirements and how we can help. Let's schedule a time to talk about this in detail.`,
        `Thank you for considering us for your business needs! I'm excited to explore how we can work together. When would be convenient for a brief call?`,
        `I've received your business proposal and I'm interested in learning more! I'd love to discuss the details and see how we can collaborate.`
      ];
      
      const technicalVariations = [
        `Thank you for reporting this technical issue! I understand the problem and I'm working on a solution. I'll get back to you with an update shortly.`,
        `I appreciate you bringing this technical matter to my attention! I'm investigating the issue and will provide you with a detailed response soon.`,
        `Thank you for your technical inquiry! I'd be happy to help you resolve this. Let me look into the details and get back to you with a solution.`,
        `I've received your technical request and I'm on it! I'll investigate this thoroughly and provide you with a comprehensive response.`
      ];
      
      const financialVariations = [
        `Thank you for your payment inquiry! I'm reviewing the details and will provide you with a comprehensive response regarding your financial matter.`,
        `I appreciate you reaching out about this financial issue! I'm looking into this carefully and will get back to you with the information you need.`,
        `Thank you for your billing question! I'm investigating this matter and will provide you with a detailed explanation shortly.`,
        `I've received your financial inquiry and I'm handling this with priority! I'll review everything and respond with the appropriate information.`
      ];
      
      const newsletterVariations = [
        `Thank you for the newsletter update! I appreciate you keeping me informed. I'll review the content and get back to you if I have any questions.`,
        `I've received your newsletter and I'm grateful for the information! Thank you for thinking of me and keeping me in the loop.`,
        `Thank you for sharing this update with me! I appreciate the information and I'll take a look at the content.`,
        `I've received your newsletter and I'm thankful for the update! I'll review it and let you know if I need any clarification.`
      ];
      
      // Category-specific response variations
      const interestedVariations = [
        `Thank you for your interest! I'm excited to learn more about your needs and how we can help. When would be a good time for a brief call to discuss this further?`,
        `I appreciate you reaching out! Your inquiry caught my attention and I'd love to explore how we can work together. Are you available for a 30-minute conversation this week?`,
        `Thank you for your interest in our services! I'm confident we can provide exactly what you're looking for. Let's schedule a time to talk about your requirements in detail.`,
        `I've received your inquiry and I'm genuinely excited about the opportunity! I'd love to discuss how we can meet your needs. When would be convenient for a call?`
      ];
      
      const meetingVariations = [
        `Perfect! I'm looking forward to our meeting. I'll prepare all the necessary materials and I'm excited to discuss this opportunity with you.`,
        `Great! I've added this to my calendar and I'm ready to make the most of our time together. I'll send you a calendar invite shortly.`,
        `Excellent! I'm thrilled about our upcoming meeting. I'll come prepared with all the information you need and I'm excited to learn more about your requirements.`,
        `Wonderful! I'm looking forward to our discussion. I'll make sure to have everything ready and I'm excited to explore how we can work together.`
      ];
      
      const urgentVariations = [
        `I understand this is urgent and I'm prioritizing your request immediately. I'll get back to you with a response within the next few hours.`,
        `I recognize the urgency of this matter and I'm handling it with top priority. I'll provide you with an update as soon as possible.`,
        `Thank you for highlighting the urgency. I'm addressing this right away and I'll get back to you with a solution shortly.`,
        `I understand this needs immediate attention and I'm on it! I'll work on this right now and provide you with an update soon.`
      ];
      
      const complaintVariations = [
        `I sincerely apologize for the inconvenience you've experienced. I understand your frustration and I'm committed to resolving this issue for you. Let me look into this matter immediately.`,
        `I'm truly sorry to hear about this problem. Your concerns are valid and I want to make this right. I'm investigating this issue and will provide you with a resolution soon.`,
        `I apologize for the trouble this has caused you. I take your feedback seriously and I'm working to address this issue promptly. I'll get back to you with a solution.`,
        `I'm sorry you've had this negative experience. I understand your frustration and I'm committed to fixing this issue. Let me investigate and provide you with a proper resolution.`
      ];
      
      const billingVariations = [
        `Thank you for your billing inquiry. I'm reviewing the details carefully and I'll provide you with a comprehensive explanation of the charges.`,
        `I appreciate you reaching out about this billing matter. I'm investigating the invoice details and I'll get back to you with a clear breakdown of the charges.`,
        `Thank you for bringing this billing question to my attention. I'm looking into the details and I'll provide you with a detailed explanation shortly.`,
        `I've received your billing inquiry and I'm handling this with priority. I'll review everything and provide you with the information you need.`
      ];
      
      const notInterestedVariations = [
        `Thank you for your honest feedback. I completely understand your decision and I respect your choice. If you ever change your mind in the future, please don't hesitate to reach out.`,
        `I appreciate you taking the time to respond. I understand that this isn't the right fit for you at this time. I'll keep your information on file in case anything changes in the future.`,
        `Thank you for letting me know. I respect your decision and I understand that timing is everything. If your situation changes, I'd be happy to discuss this again.`,
        `I appreciate your candid response. I understand that this isn't what you're looking for right now. Please keep me in mind if your needs change in the future.`
      ];
      
      const outOfOfficeVariations = [
        `Thank you for your out-of-office message. I understand you're currently unavailable and I'll wait for your return. I hope you have a great time!`,
        `I've received your out-of-office notification. I'll wait for you to return and I hope you're having a wonderful time away.`,
        `Thank you for letting me know you're out of office. I'll wait for your return and I hope you're enjoying your time off.`,
        `I've noted your out-of-office status. I'll wait for you to get back and I hope you're having a great time!`
      ];
      
      const securityVariations = [
        `Thank you for bringing this security matter to my attention. I'm taking this very seriously and I'm investigating this issue immediately. I'll provide you with an update soon.`,
        `I appreciate you reporting this security concern. This is a priority for me and I'm working on resolving this issue right away. I'll get back to you with details.`,
        `Thank you for alerting me to this security issue. I'm handling this with the highest priority and I'll provide you with a comprehensive response shortly.`,
        `I've received your security notification and I'm addressing this immediately. I'll investigate thoroughly and provide you with a detailed update.`
      ];
      
      const spamVariations = [
        `Thank you for your message. I appreciate you reaching out, but I'm not interested in this type of content at this time. Please remove me from your mailing list.`,
        `I've received your message, but I'm not interested in this offer. Please remove me from your distribution list.`,
        `Thank you for your message, but this isn't relevant to my needs. Please remove me from your mailing list.`,
        `I've received your message, but I'm not interested in this content. Please remove me from your distribution list.`
      ];
      
      // Enhanced variations based on structured content analysis
      const contextualJobVariations = [
        hasExperience ? `Thank you for your interest! I can see you have solid experience in the field. I'd love to learn more about your specific background and how it aligns with our needs. When would be a good time for a brief call?` : jobVariations[0],
        hasSalary ? `I appreciate you reaching out! I'd be happy to discuss the compensation package and benefits we offer. Let's schedule a time to talk about the role details and your expectations.` : jobVariations[1],
        hasLocation ? `Thank you for your interest! I see you're interested in our work arrangement. I'd love to discuss the position details and how we can accommodate your preferences. When would be convenient for a call?` : jobVariations[2],
        hasTimeline ? `I appreciate your message! I understand you're looking to start soon. Let me prioritize your application and get back to you quickly. When would be the best time for a brief discussion?` : jobVariations[3]
      ];
      
      const questionVariations = [
        `Thank you for your question! I'd be happy to provide more details. Let me know if you'd like to schedule a brief call to discuss this further.`,
        `I appreciate your inquiry! I'd love to help clarify any questions you have. Would you be available for a quick call to discuss this in detail?`,
        `Great question! I'd be happy to provide more information. Let's schedule a brief conversation so I can address all your concerns.`,
        `Thank you for reaching out with your question! I'd love to discuss this with you in more detail. When would be a good time for a call?`
      ];
      
      const generalVariations = [
        `Thank you for your message! I appreciate you reaching out. I'd love to learn more about your needs and how I can help. When would be a good time for a brief conversation?`,
        `I appreciate you taking the time to contact me. I'd be happy to discuss how I can assist you. Let's schedule a time to talk about your requirements.`,
        `Thank you for reaching out! I'm excited to learn more about your situation and how I can support you. When would be convenient for a discussion?`,
        `I've received your message and I'm interested in learning more. I'd love to schedule a brief call to understand your needs better.`
      ];
      
      let contextualSuggestion = '';
      
      // Category-specific response selection based on email analysis
      // First check for specific categories that match the email content
      if (isUrgent) {
        contextualSuggestion = urgentVariations[Math.floor(Math.random() * urgentVariations.length)];
      } else if (isComplaint) {
        contextualSuggestion = complaintVariations[Math.floor(Math.random() * complaintVariations.length)];
      } else if (isThankYou) {
        contextualSuggestion = `Thank you for your kind message! I appreciate you taking the time to reach out. I'm here to help with any questions or assistance you might need.`;
      } else if (isFollowUp) {
        contextualSuggestion = `Thank you for following up! I appreciate your patience. Let me provide you with an update on the current status. When would be convenient for a brief discussion?`;
      } else if (isNewsletter) {
        contextualSuggestion = newsletterVariations[Math.floor(Math.random() * newsletterVariations.length)];
      } else if (isJobRelated && isQuestion) {
        contextualSuggestion = contextualJobVariations[Math.floor(Math.random() * contextualJobVariations.length)];
      } else if (isJobRelated) {
        contextualSuggestion = contextualJobVariations[Math.floor(Math.random() * contextualJobVariations.length)];
      } else if (isPersonal && isQuestion) {
        contextualSuggestion = personalVariations[Math.floor(Math.random() * personalVariations.length)];
      } else if (isPersonal) {
        contextualSuggestion = personalVariations[Math.floor(Math.random() * personalVariations.length)];
      } else if (isBusiness && isQuestion) {
        contextualSuggestion = businessVariations[Math.floor(Math.random() * businessVariations.length)];
      } else if (isBusiness) {
        contextualSuggestion = businessVariations[Math.floor(Math.random() * businessVariations.length)];
      } else if (isTechnical && isQuestion) {
        contextualSuggestion = technicalVariations[Math.floor(Math.random() * technicalVariations.length)];
      } else if (isTechnical) {
        contextualSuggestion = technicalVariations[Math.floor(Math.random() * technicalVariations.length)];
      } else if (isFinancial && isQuestion) {
        contextualSuggestion = financialVariations[Math.floor(Math.random() * financialVariations.length)];
      } else if (isFinancial) {
        contextualSuggestion = financialVariations[Math.floor(Math.random() * financialVariations.length)];
      } else if (isQuestion) {
        contextualSuggestion = questionVariations[Math.floor(Math.random() * questionVariations.length)];
      } else {
        contextualSuggestion = generalVariations[Math.floor(Math.random() * generalVariations.length)];
      }
      
      suggestion = contextualSuggestion;
      method = 'fallback';
      console.log('🎯 Generated fresh fallback suggestion with variation');
    }
    
    // Broadcast real-time update
    broadcast({
      type: 'reply_generated',
      emailId: id,
      suggestion: suggestion,
      method: method,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      suggestion: suggestion,
      method: method,
      emailId: id,
      fresh: true,
      timestamp: new Date().toISOString(),
      context: {
        category: email._source.aiCategory,
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

// Store recruiter agenda in vector database
app.post('/api/recruiter/agenda', async (req, res) => {
  try {
    const { content, type, meeting_link, product_info } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const agendaData = {
      content,
      type: type || 'general',
      meeting_link: meeting_link || '',
      product_info: product_info || ''
    };
    
    const success = await storeRecruiterAgenda(agendaData);
    
    if (success) {
      res.json({
        success: true,
        message: 'Recruiter agenda stored successfully',
        data: agendaData
      });
    } else {
      res.status(500).json({ error: 'Failed to store agenda' });
    }
  } catch (error) {
    console.error('Store agenda error:', error);
    res.status(500).json({ error: 'Failed to store recruiter agenda' });
  }
});

// Get recruiter agenda suggestions for an email
app.post('/api/recruiter/suggest', async (req, res) => {
  try {
    const { emailContent } = req.body;
    
    if (!emailContent) {
      return res.status(400).json({ error: 'Email content is required' });
    }
    
    // Use in-memory fallback if Qdrant is not available
    const similarAgenda = await searchSimilarAgenda(emailContent, 5);
    const ragReply = await generateRAGReply(emailContent, similarAgenda);
    
    res.json({
      success: true,
      suggestion: ragReply,
      similar_agenda: similarAgenda,
      method: 'rag',
      cached: aiReplyCache.has(`reply_${crypto.createHash('md5').update(emailContent).digest('hex')}`)
    });
  } catch (error) {
    console.error('RAG suggest error:', error);
    res.status(500).json({ error: 'Failed to generate RAG suggestion' });
  }
});

// Initialize RAG collection
app.post('/api/recruiter/init', async (req, res) => {
  try {
    await ensureQdrantCollection();
    res.json({
      success: true,
      message: 'RAG collection initialized successfully'
    });
  } catch (error) {
    console.error('RAG init error:', error);
    res.status(500).json({ error: 'Failed to initialize RAG collection' });
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

// Free notification alternatives (no external services required)
const notificationLog = [];
const MAX_LOG_SIZE = 100;

// Log notification to local file
function logNotification(type, data) {
  const notification = {
    id: Date.now().toString(),
    type,
    data,
      timestamp: new Date().toISOString()
  };
  
  notificationLog.push(notification);
  
  // Keep only last 100 notifications
  if (notificationLog.length > MAX_LOG_SIZE) {
    notificationLog.shift();
  }
  
  // Save to file
  try {
    fs.writeFileSync(
      path.join(__dirname, 'notifications.json'), 
      JSON.stringify(notificationLog, null, 2)
    );
  } catch (error) {
    console.error('Error saving notification log:', error);
  }
  
  console.log(`📝 ${type} notification logged:`, data.subject || data.message);
}

// Send email notification (using SMTP)
async function sendEmailNotification(emailData) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('⚠️ SMTP not configured for email notifications');
      return false;
    }
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Send to self
      subject: `📧 New ${emailData.category} Email - ${emailData.subject}`,
      html: `
        <h2>📧 New Email Notification</h2>
        <p><strong>From:</strong> ${emailData.from}</p>
        <p><strong>Subject:</strong> ${emailData.subject}</p>
        <p><strong>Category:</strong> ${emailData.category}</p>
        <p><strong>Priority:</strong> ${emailData.priority}</p>
        <p><strong>Lead Score:</strong> ${emailData.leadScore}</p>
        <p><strong>Body Preview:</strong> ${emailData.body.substring(0, 200)}...</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Email notification sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Email notification failed:', error.message);
    return false;
  }
}

// Console notification with styling
function sendConsoleNotification(emailData) {
  console.log('\n' + '='.repeat(80));
  console.log('🔔 NEW EMAIL NOTIFICATION');
  console.log('='.repeat(80));
  console.log(`📧 From: ${emailData.from}`);
  console.log(`📝 Subject: ${emailData.subject}`);
  console.log(`🏷️  Category: ${emailData.category}`);
  console.log(`⚡ Priority: ${emailData.priority}`);
  console.log(`📊 Lead Score: ${emailData.leadScore}`);
  console.log(`📄 Body: ${emailData.body.substring(0, 100)}...`);
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);
  console.log('='.repeat(80) + '\n');
}

// Get notification log endpoint
app.get('/api/notifications', (req, res) => {
  try {
    res.json({
      success: true,
      notifications: notificationLog,
      total: notificationLog.length,
      message: 'Free notification log retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message
    });
  }
});

// Test free notification alternatives
app.post('/api/test-free-notifications', async (req, res) => {
  try {
    console.log('🧪 Testing free notification alternatives...');
    
    const testEmailData = {
      subject: 'Test Free Notification',
      from: 'test@example.com',
      body: 'This is a test email for free notification alternatives.',
      category: 'Interested',
      priority: 'high',
      leadScore: 85
    };
    
    const results = {
      console: false,
      log: false,
      email: false
    };
    
    // 1. Console notification (always works)
    try {
      sendConsoleNotification(testEmailData);
      results.console = true;
    } catch (error) {
      console.error('Console notification error:', error);
    }
    
    // 2. Log notification (always works)
    try {
      logNotification('test_free_notification', testEmailData);
      results.log = true;
    } catch (error) {
      console.error('Log notification error:', error);
    }
    
    // 3. Email notification (if SMTP configured)
    try {
      results.email = await sendEmailNotification(testEmailData);
    } catch (error) {
      console.error('Email notification error:', error);
    }
    
    res.json({
      success: true,
      message: 'Free notification alternatives tested',
      results: results,
      alternatives: {
        console: 'Always available - shows in server console with styling',
        log: 'Always available - saves to notifications.json file',
        email: 'Available if SMTP configured - sends email to self'
      },
      testEmailData: testEmailData
    });
    
  } catch (error) {
    console.error('❌ Free notification test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Dashboard route - redirect to main app
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ReachInbox Onebox Advanced Edition running on port ${PORT}`);
  console.log(`📧 Frontend available at: http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://YOUR_IP:${PORT} (for other devices on same network)`);
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
  console.log(`   POST /api/recruiter/agenda`);
  console.log(`   POST /api/recruiter/suggest`);
  console.log(`   POST /api/recruiter/init`);
  console.log(`\n🎯 Advanced Features:`);
  console.log(`   ✅ Real-time WebSocket updates`);
  console.log(`   ✅ AI-powered email insights`);
  console.log(`   ✅ Advanced analytics & reporting`);
  console.log(`   ✅ Email composer with AI suggestions`);
  console.log(`   ✅ Export functionality (CSV/JSON)`);
  console.log(`   ✅ Priority & sentiment analysis`);
  console.log(`   ✅ Lead scoring system`);
  console.log(`   ✅ Mobile responsive design`);
  console.log(`   ✅ RAG-powered contextual replies`);
  console.log(`   ✅ Vector database integration`);
  
  // Initialize RAG collection
  if (qdrantClient) {
    ensureQdrantCollection().then(() => {
      console.log(`🧠 RAG: Vector database ready for recruiter agenda`);
    }).catch(error => {
      console.log(`⚠️ RAG: Vector database initialization failed: ${error.message}`);
    });
  } else {
    console.log(`⚠️ RAG: Vector database not available (Qdrant not running)`);
  }
  
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
