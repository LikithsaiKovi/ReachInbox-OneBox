# Gmail App Password Setup Guide

## 🔐 **IMPORTANT: Gmail App Password Required**

To connect your real Gmail account (sailikith57@gmail.com) to the application, you need to:

### **Step 1: Enable 2-Factor Authentication**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Sign in with your Gmail account: `sailikith57@gmail.com`
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the setup process to enable 2FA

### **Step 2: Generate App Password**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **App passwords**
3. Select **Mail** as the app
4. Select **Other (custom name)** as the device
5. Enter name: "ReachInbox Onebox"
6. Click **Generate**
7. **COPY THE 16-CHARACTER PASSWORD** (it looks like: `abcd efgh ijkl mnop`)

### **Step 3: Set Environment Variable**
```bash
# Windows (PowerShell)
$env:GMAIL_APP_PASSWORD="your-16-character-app-password"

# Windows (Command Prompt)
set GMAIL_APP_PASSWORD=your-16-character-app-password

# Mac/Linux
export GMAIL_APP_PASSWORD="your-16-character-app-password"
```

### **Step 4: Start the Real Gmail Server**
```bash
# Option 1: Set environment variable and run
GMAIL_APP_PASSWORD="your-app-password" node server-real-gmail.js

# Option 2: Use npm script
npm run real-gmail
```

## 🚀 **What You'll Get:**

### **Real-time Gmail Integration**
- ✅ Live connection to your Gmail account
- ✅ Real-time email fetching
- ✅ Automatic AI categorization with Grok
- ✅ WebSocket updates for new emails
- ✅ Live email management

### **AI-Powered Features**
- ✅ Grok AI email categorization
- ✅ Context-aware reply suggestions
- ✅ Lead scoring and sentiment analysis
- ✅ Priority classification
- ✅ Real-time notifications

### **Advanced Analytics**
- ✅ Live email statistics
- ✅ Category breakdown
- ✅ Lead conversion tracking
- ✅ Export functionality
- ✅ Mobile responsive design

## ⚠️ **Security Notes:**

1. **App Password is Safe**: This is a secure way to access Gmail
2. **No Main Password**: Never use your main Gmail password
3. **Revocable**: You can revoke the app password anytime
4. **Limited Access**: Only allows IMAP access, not full account access

## 🔧 **Troubleshooting:**

### **"Authentication failed" Error**
- Make sure 2FA is enabled
- Verify the app password is correct (16 characters, no spaces)
- Check that IMAP is enabled in Gmail settings

### **"Connection timeout" Error**
- Check your internet connection
- Verify Gmail IMAP settings are enabled
- Try restarting the application

### **"No emails found"**
- Check if your Gmail account has emails
- Verify the IMAP connection is successful
- Check the server logs for errors

## 📧 **Gmail IMAP Settings (Auto-configured):**
- **Server**: imap.gmail.com
- **Port**: 993
- **Security**: SSL/TLS
- **Authentication**: App Password

## 🎯 **Ready to Start:**

Once you have your app password:

1. **Set the environment variable** with your app password
2. **Run the real Gmail server**: `npm run real-gmail`
3. **Open the application**: http://localhost:4000
4. **See your real emails** with AI categorization!

Your Gmail account will be live and connected with real-time AI-powered email management! 🚀
