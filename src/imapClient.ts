import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { indexEmail } from './indexer';
import { categorizeAndUpdate } from './categorizer';

export interface ImapConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

export interface EmailData {
  id: string;
  accountId: string;
  folder: string;
  subject: string;
  body: string;
  from: string;
  to: string[];
  date: Date;
  messageId?: string;
}

export function createImapListener(accountId: string, config: ImapConfig): void {
  const imap = new Imap({
    user: config.user,
    password: config.password,
    host: config.host,
    port: config.port,
    tls: config.tls,
    tlsOptions: { rejectUnauthorized: false }
  });

  function openInbox(cb: (err?: Error) => void): void {
    imap.openBox('INBOX', true, (err) => cb(err));
  }

  imap.once('ready', () => {
    console.log(`IMAP connection ready for account: ${accountId}`);
    openInbox(async (err) => {
      if (err) {
        console.error(`Error opening INBOX for ${accountId}:`, err);
        return;
      }

      // Initial sync: fetch emails from last 30 days
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
      imap.search(['ALL', ['SINCE', since.toISOString().slice(0, 10)]], (err, results) => {
        if (err) {
          console.error(`Search error for ${accountId}:`, err);
          return;
        }

        if (!results || results.length === 0) {
          console.log(`No emails found for ${accountId}, starting IDLE`);
          imap.idle();
          return;
        }

        console.log(`Found ${results.length} emails for ${accountId}, processing...`);
        const f = imap.fetch(results, { bodies: '' });
        
        f.on('message', (msg) => {
          let raw = '';
          msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
              raw += chunk.toString('utf8');
            });
          });
          
          msg.once('end', async () => {
            try {
              const parsed = await simpleParser(raw);
              const emailData: EmailData = {
                id: parsed.messageId || `${accountId}-${Date.now()}-${Math.random()}`,
                accountId,
                folder: 'INBOX',
                subject: parsed.subject || '',
                body: parsed.text || parsed.html || '',
                from: parsed.from?.text || '',
                to: parsed.to?.value?.map(v => v.address) || [],
                date: parsed.date || new Date(),
                messageId: parsed.messageId
              };
              
              await indexEmail(emailData);
              console.log(`Indexed email: ${emailData.subject} from ${emailData.from}`);
            } catch (error) {
              console.error(`Error parsing email for ${accountId}:`, error);
            }
          });
        });

        f.once('end', () => {
          console.log(`Finished processing emails for ${accountId}, starting IDLE`);
          imap.idle();
        });
      });
    });
  });

  imap.on('mail', (numNew) => {
    console.log(`New mail detected for ${accountId}: ${numNew} messages`);
    
    // Fetch the latest message
    const f = imap.seq.fetch('LAST', { bodies: '' });
    
    f.on('message', (msg) => {
      let raw = '';
      msg.on('body', (stream) => {
        stream.on('data', (chunk) => {
          raw += chunk.toString('utf8');
        });
      });
      
      msg.once('end', async () => {
        try {
          const parsed = await simpleParser(raw);
          const emailData: EmailData = {
            id: parsed.messageId || `${accountId}-${Date.now()}-${Math.random()}`,
            accountId,
            folder: 'INBOX',
            subject: parsed.subject || '',
            body: parsed.text || parsed.html || '',
            from: parsed.from?.text || '',
            to: parsed.to?.value?.map(v => v.address) || [],
            date: parsed.date || new Date(),
            messageId: parsed.messageId
          };
          
          await indexEmail(emailData);
          console.log(`Indexed new email: ${emailData.subject} from ${emailData.from}`);
        } catch (error) {
          console.error(`Error parsing new email for ${accountId}:`, error);
        }
      });
    });
  });

  // Watchdog: re-open IDLE before server-side timeout (every 25 minutes)
  setInterval(() => {
    try {
      if (imap.state === 'authenticated') {
        imap.idle();
      }
    } catch (e) {
      console.error(`IDLE watchdog error for ${accountId}:`, e);
    }
  }, 25 * 60 * 1000);

  imap.on('error', (err) => {
    console.error(`IMAP error for ${accountId}:`, err);
    imap.end();
    setTimeout(() => {
      console.log(`Reconnecting IMAP for ${accountId}...`);
      imap.connect();
    }, 5000);
  });

  imap.on('end', () => {
    console.log(`IMAP connection ended for ${accountId}, reconnecting...`);
    setTimeout(() => {
      imap.connect();
    }, 2000);
  });

  imap.connect();
}

export function initializeImapListeners(): void {
  const accounts = getImapAccounts();
  
  accounts.forEach((account, index) => {
    const accountId = `account_${index + 1}`;
    console.log(`Initializing IMAP listener for ${accountId}: ${account.user}`);
    createImapListener(accountId, account);
  });
}

function getImapAccounts(): ImapConfig[] {
  const accounts: ImapConfig[] = [];
  
  // Account 1
  if (process.env.IMAP_ACCOUNT_1_USER && process.env.IMAP_ACCOUNT_1_PASS) {
    accounts.push({
      user: process.env.IMAP_ACCOUNT_1_USER,
      password: process.env.IMAP_ACCOUNT_1_PASS,
      host: process.env.IMAP_ACCOUNT_1_HOST || 'imap.gmail.com',
      port: parseInt(process.env.IMAP_ACCOUNT_1_PORT || '993'),
      tls: process.env.IMAP_ACCOUNT_1_TLS === 'true'
    });
  }
  
  // Account 2
  if (process.env.IMAP_ACCOUNT_2_USER && process.env.IMAP_ACCOUNT_2_PASS) {
    accounts.push({
      user: process.env.IMAP_ACCOUNT_2_USER,
      password: process.env.IMAP_ACCOUNT_2_PASS,
      host: process.env.IMAP_ACCOUNT_2_HOST || 'imap.gmail.com',
      port: parseInt(process.env.IMAP_ACCOUNT_2_PORT || '993'),
      tls: process.env.IMAP_ACCOUNT_2_TLS === 'true'
    });
  }
  
  return accounts;
}
