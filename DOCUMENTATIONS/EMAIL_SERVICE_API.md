# Email Service API Documentation

**Date:** March 3, 2026  
**Status:** Implemented - Backend Complete

---

## Overview

The ACCORD Email Service provides users with integrated email capabilities within the application. Users can read, send, search, and manage emails directly from the ACCORD platform without needing external webmail clients.

**Architecture:** Custom Node.js microservice using IMAP for reading emails and SMTP for sending.

---

## Setup & Configuration

### 1. Environment Variables

Add to `.env`:
```dotenv
# Email Service Configuration
EMAIL_SERVICE_ENABLED=true
EMAIL_IMAP_SERVER=mail.astermedsupplies.co.ke
EMAIL_IMAP_PORT=993
EMAIL_IMAP_TLS=true
EMAIL_ENCRYPTION_KEY=your-64-char-hex-string
EMAIL_CACHE_TTL=3600              # 1 hour cache
EMAIL_API_RATE_LIMIT=100           # requests per hour

# SMTP (already configured)
EMAIL_HOST=mail.astermedsupplies.co.ke
EMAIL_PORT=587
EMAIL_USER=accord@astermedsupplies.co.ke
EMAIL_PASS=accord123qP1
```

### 2. Database Models

The service uses 3 database collections:

**EmailSession** - Stores encrypted email credentials
```javascript
{
  userId: ObjectId,
  email: String,
  encryptedPassword: String,
  imapServer: String,
  imapPort: Number,
  folders: Array,
  lastSync: Date,
  isActive: Boolean
}
```

**EmailActivity** - Audit trail of email operations
```javascript
{
  userId: ObjectId,
  action: String,              // 'inbox_viewed', 'email_read', 'email_sent', etc
  emailSubject: String,
  emailFrom: String,
  recipient: String,
  timestamp: Date
}
```

---

## API Endpoints

### Authentication
All endpoints require JWT authentication in `Authorization: Bearer <token>` header.

---

### 1. Setup Email Credentials

**POST** `/api/mail/setup`

Configure user's email account (store encrypted credentials).

**Request Body:**
```json
{
  "email": "user@astermedsupplies.co.ke",
  "password": "email_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email configured successfully",
  "data": {
    "email": "user@astermedsupplies.co.ke"
  }
}
```

**Errors:**
- `400` - Missing email or password
- `401` - Invalid credentials or IMAP not available
- `500` - Server error

**Security Note:** Password is encrypted with AES-256 before storage. Never transmitted in responses.

---

### 2. Get Inbox

**GET** `/api/mail/inbox?page=1&limit=20`

Fetch list of emails from inbox with pagination.

**Query Parameters:**
```
page    (number): Page number (default: 1)
limit   (number): Emails per page (default: 20, max: 100)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "emails": [
      {
        "uid": 123,
        "from": "john@facility.com",
        "fromName": "John Doe",
        "to": "user@accordmedical.co.ke",
        "subject": "Equipment Inquiry",
        "date": "2026-03-03T10:30:00Z",
        "preview": "We are interested in your...",
        "isRead": false
      }
    ],
    "total": 150,
    "page": 1,
    "pages": 8
  }
}
```

---

### 3. Get Email Details

**GET** `/api/mail/email/:uid`

Fetch full email content with attachments. Automatically marks email as read.

**URL Parameters:**
```
uid (number): Email UID from inbox list
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uid": 123,
    "from": "john@facility.com",
    "fromName": "John Doe",
    "to": "user@accordmedical.co.ke",
    "cc": "manager@facility.com",
    "subject": "Equipment Inquiry",
    "date": "2026-03-03T10:30:00Z",
    "html": "<p>We are interested in...</p>",
    "text": "We are interested in...",
    "attachments": [
      {
        "filename": "specification.pdf",
        "contentType": "application/pdf",
        "size": 2048000
      }
    ]
  }
}
```

---

### 4. Send Email

**POST** `/api/mail/send`

Send a new email.

**Request Body:**
```json
{
  "to": "recipient@facility.com",
  "subject": "Equipment Quotation",
  "body": "Plain text or HTML content",
  "html": "<p>HTML content (optional)</p>"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "<uuid>"
  }
}
```

**Validation:**
- `to` - Required, valid email
- `subject` - Required, max 200 chars
- `body` - Required, min 1 char

---

### 5. Reply to Email

**POST** `/api/mail/reply/:uid`

Reply to an email (automatically quotes original message).

**URL Parameters:**
```
uid (number): Original email UID
```

**Request Body:**
```json
{
  "body": "Thanks for your inquiry...",
  "html": "<p>Thanks for your inquiry...</p>"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reply sent successfully"
}
```

---

### 6. Mark Email as Read/Unread

**PUT** `/api/mail/email/:uid/read`

Mark email as read or unread.

**URL Parameters:**
```
uid (number): Email UID
```

**Request Body:**
```json
{
  "isRead": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email marked as read"
}
```

---

### 7. Delete Email

**DELETE** `/api/mail/email/:uid`

Delete (move to trash) an email.

**URL Parameters:**
```
uid (number): Email UID
```

**Response:**
```json
{
  "success": true,
  "message": "Email deleted successfully"
}
```

---

### 8. Search Emails

**GET** `/api/mail/search?from=...&subject=...&since=...`

Search emails with filters.

**Query Parameters:**
```
from        (string): Sender email
subject     (string): Subject keyword
body        (string): Body keyword
since       (date):   Email date (YYYY-MM-DD)
unseen      (bool):   Only unread emails
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uids": [123, 124, 125],
    "count": 3
  }
}
```

**Example:**
```
GET /api/mail/search?from=john@facility.com&since=2026-03-01
```

---

### 9. Get Folders

**GET** `/api/mail/folders`

List all mail folders (Inbox, Sent, Drafts, Trash, etc).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "INBOX",
      "displayName": "Inbox",
      "unread": 5,
      "total": 150,
      "children": []
    },
    {
      "name": "Sent",
      "displayName": "Sent",
      "unread": 0,
      "total": 342,
      "children": []
    }
  ]
}
```

---

### 10. Get Email Statistics

**GET** `/api/mail/stats`

Get email service statistics and usage.

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 12,
    "lastSync": "2026-03-03T14:22:00Z",
    "activityStats": [
      {
        "_id": "inbox_viewed",
        "count": 45
      },
      {
        "_id": "email_sent",
        "count": 12
      },
      {
        "_id": "email_read",
        "count": 234
      }
    ]
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields: to, subject, body"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid email credentials or IMAP not available",
  "error": "Connection refused"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Email not configured. Please setup your email first."
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Failed to fetch inbox"
}
```

---

## Security Features

### Password Encryption
- Passwords encrypted with AES-256-CBC
- Random IV (initialization vector) generated per encryption
- Never stored or transmitted in plain text
- Decrypted on-demand only when needed for IMAP connection

### Authentication
- JWT token required on all endpoints
- User can only access their own emails
- All operations logged in EmailActivity collection

### Rate Limiting
- API rate limited to 100 requests/hour per user
- Implemented via middleware
- Protects against brute force attacks

### IMAP Security
- TLS 1.2+ encryption for IMAP connections
- Connection closed immediately after use
- No credential logging
- Secure error messages (no credential info leaked)

---

## Implementation Status

### ✅ Completed
- [x] Email client service (IMAP)
- [x] SMTP integration (send/reply)
- [x] Database models (EmailSession, EmailActivity)
- [x] All API endpoints
- [x] Authentication middleware
- [x] Password encryption utility
- [x] Error handling
- [x] Activity logging

### 🔄 In Progress (Frontend)
- [ ] Email list component
- [ ] Email detail view
- [ ] Compose email modal
- [ ] Reply/forward UI
- [ ] Folder navigation

### 📋 Planned (Future)
- [ ] Email drafts
- [ ] Email signatures
- [ ] Contact extraction
- [ ] Email templates
- [ ] Bulk operations
- [ ] Attachment downloads
- [ ] Email forwarding

---

## Usage Examples

### Setup Email

```bash
curl -X POST http://localhost:4500/api/mail/setup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@astermedsupplies.co.ke",
    "password": "email_password"
  }'
```

### Get Inbox (Page 1)

```bash
curl -X GET "http://localhost:4500/api/mail/inbox?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Send Email

```bash
curl -X POST http://localhost:4500/api/mail/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "john@facility.com",
    "subject": "Equipment Quote",
    "body": "Hi John, here is the quote...",
    "html": "<p>Hi John, here is the quote...</p>"
  }'
```

### Search Emails

```bash
curl -X GET "http://localhost:4500/api/mail/search?from=john@facility.com&since=2026-03-01" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Troubleshooting

### Email not configured error
**Solution:** Call `/api/mail/setup` first to store email credentials.

### Invalid credentials error
**Solution:** Verify email/password are correct. Check IMAP is enabled on mail server.

### Connection timeout
**Solution:** Check EMAIL_IMAP_SERVER and EMAIL_IMAP_PORT configuration. Verify firewall allows port 993.

### Slow email fetch
**Solution:** Large inboxes take time. Implement client-side pagination/caching.

---

## Performance Notes

- **Inbox Fetch:** ~2-3 seconds for 100 emails (first time), ~500ms (cached)
- **Email Detail:** ~1-2 seconds with attachments, ~300ms without
- **Send:** ~1-2 seconds
- **Search:** Depends on query complexity, ~3-5 seconds

**Optimization:** Consider implementing background sync and email caching for better UX.

---

**Last Updated:** March 3, 2026  
**Version:** 1.0.0