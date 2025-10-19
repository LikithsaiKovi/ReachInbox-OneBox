import { WebClient } from '@slack/web-api';
import axios from 'axios';

/**
 * Email data interface for integration functions
 */
export interface EmailData {
  id: string;
  accountId: string;
  folder: string;
  subject: string;
  body: string;
  from: string;
  to: string[];
  date: Date;
  aiCategory?: string;
}

/**
 * Slack Bot API client instance
 */
const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

/**
 * Send Slack notification using the official Slack Bot API
 * @param emailData - Email data to send notification for
 */
export async function sendSlackNotification(emailData: EmailData): Promise<void> {
  try {
    // Validate required environment variables
    if (!process.env.SLACK_BOT_TOKEN) {
      console.log('SLACK_BOT_TOKEN not configured, skipping Slack notification');
      return;
    }

    if (!process.env.SLACK_CHANNEL_ID) {
      console.log('SLACK_CHANNEL_ID not configured, skipping Slack notification');
      return;
    }

    // Extract sender name and email from the 'from' field
    const senderMatch = emailData.from.match(/^(.+?)\s*<(.+?)>$/);
    const senderName = senderMatch ? senderMatch[1].trim() : emailData.from;
    const senderEmail = senderMatch ? senderMatch[2].trim() : emailData.from;

    // Create email snippet (first 150 characters of body)
    const emailSnippet = emailData.body.substring(0, 150).replace(/\n/g, ' ').trim();
    const truncatedSnippet = emailSnippet.length < emailData.body.length ? emailSnippet + '...' : emailSnippet;

    // Format timestamp
    const timestamp = emailData.date.toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });

    // Send message to Slack channel
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
              text: `*From:* ${senderName} <${senderEmail}>`
            },
            {
              type: 'mrkdwn',
              text: `*Subject:* ${emailData.subject}`
            },
            {
              type: 'mrkdwn',
              text: `*Timestamp:* ${timestamp}`
            },
            {
              type: 'mrkdwn',
              text: `*Account:* ${emailData.accountId}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Snippet:* ${truncatedSnippet}`
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
              text: `📧 Email ID: \`${emailData.id}\` | 🤖 AI Category: \`${emailData.aiCategory || 'Interested'}\``
            }
          ]
        }
      ]
    });

    if (result.ok) {
      console.log(`✅ Slack notification sent successfully for email: ${emailData.subject}`);
    } else {
      throw new Error(`Slack API error: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Error sending Slack notification:', error);
    // Don't throw error to prevent breaking the main flow
  }
}

/**
 * Trigger webhook for interested emails
 * @param emailData - Email data to send webhook for
 */
export async function triggerWebhook(emailData: EmailData): Promise<void> {
  try {
    // Validate required environment variable
    if (!process.env.WEBHOOK_URL) {
      console.log('WEBHOOK_URL not configured, skipping webhook trigger');
      return;
    }

    // Extract sender name and email from the 'from' field
    const senderMatch = emailData.from.match(/^(.+?)\s*<(.+?)>$/);
    const senderName = senderMatch ? senderMatch[1].trim() : emailData.from;
    const senderEmail = senderMatch ? senderMatch[2].trim() : emailData.from;

    // Create email snippet (first 200 characters of body)
    const emailSnippet = emailData.body.substring(0, 200).replace(/\n/g, ' ').trim();
    const truncatedSnippet = emailSnippet.length < emailData.body.length ? emailSnippet + '...' : emailSnippet;

    // Prepare webhook payload
    const webhookPayload = {
      event: 'email_interested',
      email: {
        from: senderEmail,
        from_name: senderName,
        subject: emailData.subject,
        snippet: truncatedSnippet,
        received_at: emailData.date.toISOString(),
        email_id: emailData.id,
        account_id: emailData.accountId,
        ai_category: emailData.aiCategory || 'Interested'
      }
    };

    // Send POST request to webhook URL
    const response = await axios.post(process.env.WEBHOOK_URL, webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ReachInbox-Onebox/1.0'
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.status >= 200 && response.status < 300) {
      console.log(`✅ Webhook triggered successfully for email: ${emailData.subject}`);
    } else {
      throw new Error(`Webhook returned status: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Error triggering webhook:', error);
    // Don't throw error to prevent breaking the main flow
  }
}

/**
 * Legacy function for backward compatibility - triggers both Slack and Webhook
 * @param emailData - Email data to send notifications for
 */
export async function triggerIntegrations(emailData: EmailData): Promise<void> {
  console.log(`🔔 Triggering integrations for interested email: ${emailData.subject}`);
  
  const promises = [];
  
  // Trigger Slack notification (new Bot API method)
  if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID) {
    promises.push(sendSlackNotification(emailData));
  }
  
  // Trigger webhook
  if (process.env.WEBHOOK_URL) {
    promises.push(triggerWebhook(emailData));
  }
  
  // Execute all integrations in parallel
  try {
    await Promise.allSettled(promises);
    console.log('✅ All integrations triggered successfully');
  } catch (error) {
    console.error('❌ Error triggering integrations:', error);
  }
}

/**
 * Test function to verify integrations are working
 */
export async function testIntegrations(): Promise<void> {
  const testEmailData: EmailData = {
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

  console.log('🧪 Testing integrations with sample data...');
  console.log('📧 Test email:', testEmailData.subject);
  
  await triggerIntegrations(testEmailData);
}

/**
 * Test function specifically for Slack Bot API
 */
export async function testSlackNotification(): Promise<void> {
  const testEmailData: EmailData = {
    id: 'slack-test-' + Date.now(),
    accountId: 'test-account',
    folder: 'INBOX',
    subject: 'Slack Test - Interested Lead',
    body: 'This is a test to verify Slack Bot API integration is working correctly.',
    from: 'Jane Smith <jane.smith@example.com>',
    to: ['sales@company.com'],
    date: new Date(),
    aiCategory: 'Interested'
  };

  console.log('🧪 Testing Slack Bot API notification...');
  await sendSlackNotification(testEmailData);
}

/**
 * Test function specifically for webhook
 */
export async function testWebhook(): Promise<void> {
  const testEmailData: EmailData = {
    id: 'webhook-test-' + Date.now(),
    accountId: 'test-account',
    folder: 'INBOX',
    subject: 'Webhook Test - Interested Lead',
    body: 'This is a test to verify webhook integration is working correctly.',
    from: 'Bob Johnson <bob.johnson@example.com>',
    to: ['sales@company.com'],
    date: new Date(),
    aiCategory: 'Interested'
  };

  console.log('🧪 Testing webhook notification...');
  await triggerWebhook(testEmailData);
}