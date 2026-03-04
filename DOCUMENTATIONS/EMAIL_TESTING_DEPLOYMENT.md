# Email Service - Testing & Deployment Guide

**Date:** March 3, 2026  
**Status:** Backend Implementation Complete ✅

---

## Phase 1: Backend Testing (Local)

### Prerequisites
- Backend running on `http://localhost:4500`
- MongoDB running and connected
- Valid email credentials for testing
- (Optional) Access to webmail at https://da26.host-ww.net/roundcube/?_task=mail&_mbox=INBOX for manual verification

### Testing with Real Mail Server

**Mail Server Details:**
```
Server: mail.astermedsupplies.co.ke
IMAP: Port 993 (TLS)
SMTP: Port 587 (TLS)
Webmail: https://da26.host-ww.net/roundcube/?_task=mail&_mbox=INBOX
```

**Before Testing Backend:**
1. (Optional) Login to webmail and verify service is working
2. Get email credentials (email: `user@astermedsupplies.co.ke`, password: actual email password)
3. Verify email/password work in webmail first
4. Then test with backend API

---

### 1. Setup Email Account

**Using Postman:**
```
POST http://localhost:4500/api/mail/setup
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "email": "testuser@astermedsupplies.co.ke",
  "password": "your_actual_password"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Email configured successfully",
  "data": {
    "email": "testuser@astermedsupplies.co.ke"
  }
}
```

**Debugging:**
- If "Invalid credentials": 
  - Verify email/password at webmail: https://da26.host-ww.net/roundcube/
  - Check email address format (must be @astermedsupplies.co.ke)
  - Ensure IMAP is enabled on the mail account
- If "Connection refused": 
  - Verify mail server is accessible (ping mail.astermedsupplies.co.ke)
  - Check firewall allows port 993 (IMAP)
  - Try connecting via webmail first to confirm server is online
- Check backend logs: `npm run dev 2>&1 | grep -i email`

---

### 2. Fetch Inbox

**Request:**
```
GET http://localhost:4500/api/mail/inbox?page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "emails": [
      {
        "uid": 1234,
        "from": "john@facility.com",
        "fromName": "John Doe",
        "subject": "Equipment Inquiry",
        "date": "2026-03-03T10:30:00Z",
        "isRead": false,
        "preview": "Hi, we are interested in..."
      },
      // ... more emails
    ],
    "total": 156,
    "page": 1,
    "pages": 8
  }
}
```

**Troubleshooting:**
- Empty inbox: User may not have emails. Send test email to user's address.
- Slow response (>5s): First fetch is slower due to IMAP connection. Should be faster after.
- Error "Email not configured": User didn't complete setup. Run step 1 first.

---

### 3. Get Email Details

**Request:**
```
GET http://localhost:4500/api/mail/email/1234
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "uid": 1234,
    "from": "john@facility.com",
    "fromName": "John Doe",
    "to": "testuser@astermedsupplies.co.ke",
    "cc": "manager@facility.com",
    "subject": "Equipment Inquiry",
    "date": "2026-03-03T10:30:00Z",
    "html": "<p>Hi, we are interested in your equipment...</p>",
    "text": "Hi, we are interested...",
    "attachments": [
      {
        "filename": "spec.pdf",
        "contentType": "application/pdf",
        "size": 102400
      }
    ]
  }
}
```

**Check Database:**
```javascript
// In mongo shell
db.emailactivities.findOne({ action: 'email_read' })
// Should show the fetch was logged
```

---

### 4. Send Email

**Request:**
```
POST http://localhost:4500/api/mail/send
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "to": "john@facility.com",
  "subject": "RE: Equipment Inquiry",
  "body": "Thank you for your inquiry. We can provide..."
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "<timestamp@server>"
  }
}
```

**Verification:**
- Check recipient's mailbox (should see email within 5 seconds)
- Backend logs should show: `[Email] Sent to john@facility.com`
- Database should have: `db.emailactivities.findOne({ action: 'email_sent' })`

---

### 5. Reply to Email

**Request:**
```
POST http://localhost:4500/api/mail/reply/1234
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "body": "Thanks for your inquiry. Our team will contact you soon."
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Reply sent successfully"
}
```

---

### 6. Search Emails

**Request:**
```
GET http://localhost:4500/api/mail/search?from=john@facility.com&since=2026-02-01
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "uids": [1234, 1235, 1236],
    "count": 3
  }
}
```

---

### 7. Mark Email as Read

**Request:**
```
PUT http://localhost:4500/api/mail/email/1234/read
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "isRead": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Email marked as read"
}
```

---

### 8. Get Email Statistics

**Request:**
```
GET http://localhost:4500/api/mail/stats
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5,
    "lastSync": "2026-03-03T14:30:00Z",
    "activityStats": [
      { "_id": "email_sent", "count": 3 },
      { "_id": "email_read", "count": 12 },
      { "_id": "inbox_viewed", "count": 4 }
    ]
  }
}
```

---

## Phase 2: Database Verification

### Check EmailSession Collection
```javascript
// Verify encrypted credentials are stored
db.emailsessions.findOne()

// Should show:
{
  "_id": ObjectId(...),
  "userId": ObjectId(...),
  "email": "testuser@astermedsupplies.co.ke",
  "encryptedPassword": "iv:encrypted_string_here",
  "imapServer": "mail.astermedsupplies.co.ke",
  "imapPort": 993,
  "folders": [ "INBOX", "Sent", "Drafts", "Trash" ],
  "lastSync": ISODate("2026-03-03T14:30:00Z"),
  "isActive": true,
  "createdAt": ISODate("2026-03-03T10:00:00Z")
}
```

### Check EmailActivity Collection
```javascript
// Verify audit logs are created
db.emailactivities.find({ userId: ObjectId("...") }).limit(10)

// Should show activities like:
{
  "_id": ObjectId(...),
  "userId": ObjectId(...),
  "action": "inbox_viewed",
  "emailSubject": null,
  "emailFrom": null,
  "details": { "count": 20 },
  "timestamp": ISODate("2026-03-03T14:30:00Z"),
  "ipAddress": "127.0.0.1"
}
```

### Verify TTL Index
```javascript
// Check 90-day auto-delete is configured
db.emailactivities.getIndexes()

// Should show:
[
  { "key": { "_id": 1 }, "v": 2 },
  { "key": { "userId": 1, "timestamp": 1 }, "v": 2 },
  { "key": { "action": 1, "timestamp": 1 }, "v": 2 },
  { "key": { "timestamp": 1 }, "expireAfterSeconds": 7776000, "v": 2 }
]
```

---

## Phase 3: Load Testing

### Test with High Email Volume

**Generate Test Data:**
```bash
# Send 50 test emails to your account
for i in {1..50}; do
  curl -X POST http://localhost:4500/api/mail/send \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"to\": \"testuser@astermedsupplies.co.ke\",
      \"subject\": \"Test email #$i\",
      \"body\": \"This is test email number $i\"
    }"
  sleep 1
done
```

**Test Pagination:**
```bash
# Fetch different pages
curl http://localhost:4500/api/mail/inbox?page=1&limit=20 \
  -H "Authorization: Bearer $TOKEN"
curl http://localhost:4500/api/mail/inbox?page=2&limit=20 \
  -H "Authorization: Bearer $TOKEN"
curl http://localhost:4500/api/mail/inbox?page=3&limit=20 \
  -H "Authorization: Bearer $TOKEN"
```

**Performance Benchmark:**
| Operation | Expected Time | Acceptable Range |
|-----------|-------|------------------|
| First inbox fetch | 2-3s | <5s |
| Subsequent fetch | 500ms | <1s (cached) |
| Get email detail | 1-2s | <3s |
| Send email | 1-2s | <3s |
| Search emails | 3-5s | <10s |

If times exceed acceptable range, enable caching or optimize queries.

---

## Phase 4: Security Verification

### 1. Check Password Encryption

```bash
# Retrieve encrypted password from database
db.emailsessions.findOne().encryptedPassword

# Should be format: "iv:encryptedstring"
# NOT plain text password
```

### 2. Test JWT Authentication

**Without token:**
```bash
curl http://localhost:4500/api/mail/inbox
# Should return: 401 Unauthorized
```

**With invalid token:**
```bash
curl http://localhost:4500/api/mail/inbox \
  -H "Authorization: Bearer invalid_token_here"
# Should return: 401 Unauthorized
```

**With valid token:**
```bash
curl http://localhost:4500/api/mail/inbox \
  -H "Authorization: Bearer YOUR_VALID_JWT_TOKEN"
# Should return: 200 OK with email data
```

### 3. Check Activity Logging

```javascript
// Verify IPs are logged
db.emailactivities.findOne()
// Should have ipAddress: "127.0.0.1" or actual user IP

// Verify no credentials logged
db.emailactivities.findOne({ action: 'email_sent' })
// Should NOT contain plaintext password or encrypted password
```

### 4. Test Rate Limiting

If implemented, test rapid requests:
```bash
for i in {1..150}; do
  curl http://localhost:4500/api/mail/inbox \
    -H "Authorization: Bearer $TOKEN" &
done

# After 100 requests in 1 hour, should get 429 (Too Many Requests)
```

---

## Phase 5: Error Handling Tests

### Test Missing Required Fields

**Send email without 'to' field:**
```bash
curl -X POST http://localhost:4500/api/mail/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject": "Test", "body": "Body"}'

# Expected: 400 Bad Request with helpful message
```

### Test Invalid Email

**Invalid recipient email:**
```bash
curl -X POST http://localhost:4500/api/mail/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "not-an-email",
    "subject": "Test",
    "body": "Body"
  }'

# Expected: 400 Bad Request - "Invalid email format"
```

### Test IMAP Connection Failure

**With invalid IMAP credentials:**
```bash
curl -X POST http://localhost:4500/api/mail/setup \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@wrong-server.com",
    "password": "password"
  }'

# Expected: 401 Bad Request - "Failed to connect to IMAP server"
```

---

## Phase 6: Production Deployment

### 1. Environment Setup

Update `.env` for production:
```dotenv
# Production SMTP
EMAIL_HOST=mail.astermedsupplies.co.ke
EMAIL_PORT=587
EMAIL_USER=accord@astermedsupplies.co.ke
EMAIL_PASS=production_password_here

# Security
EMAIL_ENCRYPTION_KEY=your-production-64-char-key
JWT_SECRET=your-production-jwt-key

# Performance
EMAIL_CACHE_TTL=3600
EMAIL_API_RATE_LIMIT=100

# Logging
LOG_LEVEL=info
```

### 2. Database Backup

Before deploying:
```bash
# Backup MongoDB
mongodump --db accorddb --out /backup/accorddb_$(date +%Y%m%d)

# Verify backup
ls -lh /backup/accorddb_*/
```

### 3. Test in Staging

Deploy to staging environment first and run full test suite:
```bash
# Run all tests
npm run test

# Test email endpoints specifically
npm run test -- email.test.js
```

### 4. Deploy to Production

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Update .env with production values
# (Already done in step 1)

# 4. Run migrations if needed
# (None required for this release)

# 5. Restart application
pm2 restart accord-backend
# or
docker-compose restart web

# 6. Verify health
curl http://production-api.accordmedical.co.ke/api/health
# Should return: { "status": "ok" }

# 7. Monitor logs
tail -f /var/log/accord-backend.log | grep -i email
```

### 5. Post-Deployment Verification

```bash
# Test email setup with production account
curl -X POST https://api.accordmedical.co.ke/api/mail/setup \
  -H "Authorization: Bearer PRODUCTION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operations@astermedsupplies.co.ke",
    "password": "password"
  }'

# Test fetch emails
curl https://api.accordmedical.co.ke/api/mail/inbox \
  -H "Authorization: Bearer PRODUCTION_TOKEN"

# Check monitor
# - CPU usage normal
# - Memory stable
# - No error spikes in logs
```

---

## Rollback Plan

If issues occur in production:

```bash
# 1. Stop affected service
pm2 stop accord-backend

# 2. Revert to previous version
git checkout previous-commit-hash

# 3. Reinstall dependencies (if reverted package.json)
npm install

# 4. Restart
pm2 restart accord-backend

# 5. Verify
curl http://api/health
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Email API Response Time**
   - Inbox fetch: Should be <2s (first), <500ms (cached)
   - Email detail: Should be <2s
   - Alert if: >5s

2. **Error Rate**
   - Should be <0.1%
   - Alert if: >1% errors

3. **IMAP Connection Status**
   - Monitor successful connections
   - Alert if: >5% failures

4. **Database Size**
   - EmailActivity grows ~100MB/month
   - Alert if: Quota exceeded

### Setup Monitoring

```bash
# Add to your monitoring (e.g., DataDog, New Relic)
PORT=4500 npm run start > /var/log/accord-backend.log 2>&1 &

# Monitor logs for errors
tail -f /var/log/accord-backend.log | grep -i "error\|fail"

# Monitor response times
tail -f /var/log/accord-backend.log | grep "ms" | awk '{print $NF}'
```

---

## Maintenance

### Weekly Tasks
- [ ] Review error logs for patterns
- [ ] Check database growth (EmailActivity TTL working?)
- [ ] Monitor API response times

### Monthly Tasks
- [ ] Update npm dependencies: `npm update`
- [ ] Review and rotate JWT secrets
- [ ] Verify IMAP connection stability
- [ ] Clean old logs

### Quarterly Tasks
- [ ] Full security audit
- [ ] Performance optimization review
- [ ] Database optimization
- [ ] Update documentation

---

## Quick Testing Reference

### Mail Server Access

**For Manual Verification:**
- **Webmail:** https://da26.host-ww.net/roundcube/?_task=mail&_mbox=INBOX
- **Server:** mail.astermedsupplies.co.ke
- **Purpose:** Verify credentials work, check if sent emails arrived, inspect mail folders

**This is useful for:**
1. Testing email credentials before adding to ACCORD
2. Verifying emails sent by the system were actually received
3. Confirming mail server is online and working
4. Inspecting email folders and structure

**Example Testing Flow:**
```
1. Login to webmail with test credentials
2. Verify you can access inbox
3. Send a test email to yourself
4. Now test the same credentials in ACCORD backend
5. Verify both send and receive work via API
```

---

## Troubleshooting Production Issues

### "Email not configured" for all users
**Cause:** Database connection lost  
**Fix:** Check MongoDB connection in logs

### Emails not appearing in inbox
**Cause:** IMAP sync issue  
**Fix:** 
- Check IMAP server credentials via webmail login
- Verify firewall allows port 993
- Check IMAP is enabled on mail account

### Slow email fetch
**Cause:** Large inbox or network latency  
**Fix:** Implement background sync or caching layer

### Memory usage increasing
**Cause:** Connection pool leak  
**Fix:** Verify IMAP connections are properly closed after use

---

**Testing Status:** ✅ Follow phases 1-5 before production  
**Deployment Status:** Ready for Phase 5 (Frontend) or direct testing  
**Support:** Check backend logs in `/var/log/accord-backend.log`