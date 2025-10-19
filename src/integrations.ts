import fetch from 'node-fetch';

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

export async function triggerIntegrations(emailData: EmailData): Promise<void> {
  console.log(`Triggering integrations for interested email: ${emailData.subject}`);
  
  const promises = [];
  
  // Trigger Slack webhook
  if (process.env.SLACK_WEBHOOK_URL) {
    promises.push(triggerSlackWebhook(emailData));
  }
  
  // Trigger generic webhook
  if (process.env.WEBHOOK_SITE_URL) {
    promises.push(triggerGenericWebhook(emailData));
  }
  
  // Execute all integrations in parallel
  try {
    await Promise.allSettled(promises);
    console.log('All integrations triggered successfully');
  } catch (error) {
    console.error('Error triggering integrations:', error);
  }
}

async function triggerSlackWebhook(emailData: EmailData): Promise<void> {
  try {
    const slackUrl = process.env.SLACK_WEBHOOK_URL;
    if (!slackUrl) {
      console.log('No Slack webhook URL configured');
      return;
    }

    const slackPayload = {
      text: `🎯 *New Interested Lead Detected!*`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎯 New Interested Lead'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Subject:* ${emailData.subject}`
            },
            {
              type: 'mrkdwn',
              text: `*From:* ${emailData.from}`
            },
            {
              type: 'mrkdwn',
              text: `*Account:* ${emailData.accountId}`
            },
            {
              type: 'mrkdwn',
              text: `*Date:* ${emailData.date.toLocaleString()}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Preview:* ${emailData.body.substring(0, 200)}${emailData.body.length > 200 ? '...' : ''}`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Email'
              },
              url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/emails/${emailData.id}`,
              style: 'primary'
            }
          ]
        }
      ]
    };

    const response = await fetch(slackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(slackPayload)
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log('Slack webhook triggered successfully');
  } catch (error) {
    console.error('Error triggering Slack webhook:', error);
    throw error;
  }
}

async function triggerGenericWebhook(emailData: EmailData): Promise<void> {
  try {
    const webhookUrl = process.env.WEBHOOK_SITE_URL;
    if (!webhookUrl) {
      console.log('No generic webhook URL configured');
      return;
    }

    const webhookPayload = {
      event: 'InterestedLead',
      timestamp: new Date().toISOString(),
      data: {
        emailId: emailData.id,
        accountId: emailData.accountId,
        subject: emailData.subject,
        from: emailData.from,
        to: emailData.to,
        date: emailData.date.toISOString(),
        category: emailData.aiCategory,
        preview: emailData.body.substring(0, 500),
        metadata: {
          source: 'reachinbox-onebox',
          version: '1.0.0'
        }
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ReachInbox-Onebox/1.0'
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!response.ok) {
      throw new Error(`Generic webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log('Generic webhook triggered successfully');
  } catch (error) {
    console.error('Error triggering generic webhook:', error);
    throw error;
  }
}

export async function testIntegrations(): Promise<void> {
  const testEmailData: EmailData = {
    id: 'test-email-123',
    accountId: 'test-account',
    folder: 'INBOX',
    subject: 'Test Email - Interested in Your Product',
    body: 'This is a test email to verify that integrations are working correctly.',
    from: 'test@example.com',
    to: ['sales@company.com'],
    date: new Date(),
    aiCategory: 'Interested'
  };

  console.log('Testing integrations with sample data...');
  await triggerIntegrations(testEmailData);
}
