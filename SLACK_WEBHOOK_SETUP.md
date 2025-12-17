# 🔔 Slack & Webhook Integration Setup Guide

This guide will help you set up the new Slack Bot API and Webhook integrations for ReachInbox Onebox.

## 🚀 Quick Setup

### 1. Slack Bot API Integration

#### Step 1: Create a Slack App
1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Enter app name: `ReachInbox Onebox`
5. Select your workspace
6. Click **"Create App"**

#### Step 2: Configure Bot Permissions
1. In your app settings, go to **"OAuth & Permissions"**
2. Scroll down to **"Scopes"** → **"Bot Token Scopes"**
3. Add these scopes:
   - `chat:write` - Send messages
   - `chat:write.public` - Send messages to channels
   - `channels:read` - View basic information about public channels
4. Click **"Install to Workspace"**
5. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

#### Step 3: Get Channel ID
1. In Slack, right-click on the channel where you want notifications
2. Select **"Copy link"**
3. The channel ID is the last part of the URL (e.g., `C01234567`)

#### Step 4: Configure Environment Variables
Add these to your `.env` file:

```env
# Slack Bot API Integration
SLACK_BOT_TOKEN=xoxb-your-actual-bot-token-here
SLACK_CHANNEL_ID=C01234567
```

### 2. Webhook Integration

#### Step 1: Get a Webhook URL
1. Go to [https://webhook.site](https://webhook.site)
2. Copy the unique URL provided
3. Or use any webhook service like Zapier, IFTTT, etc.

#### Step 2: Configure Environment Variable
Add this to your `.env` file:

```env
# Generic Webhook Integration
WEBHOOK_URL=https://webhook.site/your-custom-url
```

## 🧪 Testing the Integration

### Method 1: Use the Test Endpoint
1. Start your application: `node server-advanced.js`
2. Open your browser to `http://localhost:4000`
3. Click **"Test Integrations"** button
4. Check your Slack channel and webhook URL for notifications

### Method 2: Test via API
```bash
curl -X POST http://localhost:4000/api/test-integrations
```

### Method 3: Test with Real Email
1. Send an email to your configured IMAP account
2. The email should be automatically categorized
3. If categorized as "Interested", notifications will be sent

## 📋 Integration Features

### Slack Bot API Notifications
When an email is categorized as "Interested", you'll receive a Slack message with:
- ✉️ **Header**: "New Interested Email"
- 👤 **From**: Sender name and email
- 📧 **Subject**: Email subject line
- ⏰ **Timestamp**: When the email was received
- 📝 **Snippet**: First 150 characters of the email body
- 🏷️ **Metadata**: Email ID and AI category

### Webhook Notifications
When an email is categorized as "Interested", a POST request is sent to your webhook URL with:

```json
{
  "event": "email_interested",
  "email": {
    "from": "sender@example.com",
    "from_name": "Sender Name",
    "subject": "Email Subject",
    "snippet": "Email preview...",
    "received_at": "2025-01-19T10:00:00.000Z",
    "email_id": "unique-email-id",
    "account_id": "account-identifier",
    "ai_category": "Interested"
  }
}
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `SLACK_BOT_TOKEN` | Slack Bot OAuth Token | No | `xoxb-1234567890-...` |
| `SLACK_CHANNEL_ID` | Slack Channel ID | No | `C01234567` |
| `WEBHOOK_URL` | Webhook endpoint URL | No | `https://webhook.site/...` |

### Optional Features
- **Slack Only**: Set only `SLACK_BOT_TOKEN` and `SLACK_CHANNEL_ID`
- **Webhook Only**: Set only `WEBHOOK_URL`
- **Both**: Set all three variables for complete integration
- **None**: Leave all unset to disable integrations

## 🚨 Troubleshooting

### Common Issues

#### 1. Slack Bot API Not Working
**Error**: `Slack API error: not_authed`
**Solution**: 
- Verify your `SLACK_BOT_TOKEN` is correct
- Make sure the bot is installed in your workspace
- Check that the bot has the required permissions

#### 2. Channel Not Found
**Error**: `Slack API error: channel_not_found`
**Solution**:
- Verify your `SLACK_CHANNEL_ID` is correct
- Make sure the bot is added to the channel
- Use the channel ID, not the channel name

#### 3. Webhook Not Triggering
**Error**: `Error triggering webhook`
**Solution**:
- Verify your `WEBHOOK_URL` is accessible
- Check that the webhook service is working
- Test the URL manually with a tool like Postman

#### 4. No Notifications for "Interested" Emails
**Solution**:
- Check that emails are being categorized correctly
- Verify the AI categorization is working
- Check the application logs for errors

### Debug Mode
Enable detailed logging by setting:
```env
LOG_LEVEL=debug
```

## 📊 Monitoring

### Check Integration Status
Visit `http://localhost:4000/api/test-integrations` to see:
- Whether Slack is configured
- Whether Webhook is configured
- Test results for both integrations

### Application Logs
Look for these log messages:
- `✅ Slack notification sent successfully`
- `✅ Webhook triggered successfully`
- `❌ Error sending Slack notification`
- `❌ Error triggering webhook`

## 🔒 Security Considerations

1. **Token Security**: Never commit your `.env` file to version control
2. **Channel Access**: Only add the bot to channels where notifications are needed
3. **Webhook Security**: Use HTTPS URLs for webhooks
4. **Rate Limiting**: Be aware of Slack API rate limits

## 🚀 Advanced Configuration

### Custom Slack Message Format
You can modify the Slack message format in `src/integrations.ts`:

```typescript
const result = await slackClient.chat.postMessage({
  channel: process.env.SLACK_CHANNEL_ID,
  text: `New Interested Email ✉️`,
  blocks: [
    // Customize your message blocks here
  ]
});
```

### Custom Webhook Payload
You can modify the webhook payload in `src/integrations.ts`:

```typescript
const webhookPayload = {
  event: 'email_interested',
  email: {
    // Customize your payload structure here
  }
};
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the application logs
3. Test with the `/api/test-integrations` endpoint
4. Verify your environment variables are set correctly

---

**🎉 You're all set! Your ReachInbox Onebox now has powerful Slack and Webhook integrations for interested leads.**
