# Email Service Setup Guide

## Overview

LingoLab uses email for:
- **Email Verification** (BR5): Verify user email after signup
- **Password Reset** (BR9-11): Reset password via email link
- **Teacher Evaluation Notification** (BR38): Notify learner when teacher evaluates their attempt

## Environment Variables

Add these to your `.env` file:

```env
# ===========================================
# EMAIL CONFIGURATION (SMTP)
# ===========================================
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
SMTP_SECURE=false
SMTP_FROM_NAME=LingoLab
SMTP_FROM_EMAIL=noreply@lingolab.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

## Recommended Providers

### 1. Mailtrap (Development/Testing) ⭐ Recommended

**Why:** Free, safe (emails don't actually send), can view all "sent" emails in inbox.

1. Go to [mailtrap.io](https://mailtrap.io) and create free account
2. Go to Email Testing → Inboxes → My Inbox
3. Click "Show Credentials" and copy SMTP settings
4. Add to `.env`:

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=<your-mailtrap-username>
SMTP_PASS=<your-mailtrap-password>
```

### 2. Gmail (Production - Simple)

1. Enable 2FA on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate new app password for "Mail"
4. Add to `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=<app-password>
```

### 3. SendGrid (Production - Professional)

1. Go to [sendgrid.com](https://sendgrid.com) and create account
2. Go to Settings → API Keys → Create API Key
3. Add to `.env`:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your-sendgrid-api-key>
```

## Development Mode

If no SMTP credentials are configured, the email service runs in **development mode**:
- Emails are logged to console instead of being sent
- You can see the email content and links in terminal
- Perfect for local development without SMTP setup

## Testing Email Service

After configuration, restart the server. Check console for:
```
✅ Email service connected successfully
```

Or in development mode:
```
⚠️  Email service not configured. Emails will be logged to console.
📧 Email service running in development mode (no SMTP configured)
```

## Troubleshooting

### Gmail: "Less secure app access"
Use App Passwords instead of your actual password.

### Mailtrap: "Authentication failed"
Make sure you're using the SMTP credentials (not API), found under Email Testing → Inboxes.

### No emails received
1. Check spam folder
2. Verify SMTP credentials are correct
3. Check server console for error logs






