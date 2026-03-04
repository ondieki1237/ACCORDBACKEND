# Roundcube Integration Analysis for ACCORD Backend

**Date:** March 3, 2026  
**Status:** Feasibility Analysis → **UPDATED: Recommending Custom Email Solution**

---

## EXECUTIVE DECISION

**❌ REJECTED:** Roundcube Iframe Embedding  
**✅ APPROVED:** Custom Email Microservice (Option C - Modified)

**Rationale:**
- Centralized single-login architecture
- Full control over UI/UX
- No iframe limitations or CORS issues
- Better user experience
- Aligns with existing microservice pattern

---

## 1. Current System State

### Email Configuration
- **Mail Server:** mail.astermedsupplies.co.ke
- **SMTP Port:** 587 (TLS)
- **IMAP Port:** 993 (assumed - need to verify)
- **System Email:** accord@astermedsupplies.co.ke
- **User Email:** Users have email addresses in profiles

### Technology Stack
- **Backend:** Node.js + Express + MongoDB
- **Authentication:** JWT-based with role-based access control
- **Architecture:** Microservices-ready
- **Deployment:** Docker-capable (from context)

---

## 2. RECOMMENDED ARCHITECTURE

### System Flow
```
┌─────────────┐
│  ACCORD UI  │
└──────┬──────┘
       │ (Single JWT token)
       ↓
┌──────────────────────┐
│  ACCORD Backend      │
│  - Auth Middleware   │
│  - Email Routes      │
│  - IMAP Handler      │
│  - SMTP Handler      │
└──────┬───────────────┘
       │ (IMAP/SMTP)
       ↓
┌──────────────────────┐
│  Mail Server         │
│  astermedsupplies    │
│  .co.ke              │
└──────────────────────┘
```

### Key Benefits
✅ Single login (no re-authentication)
✅ Full control over email UI/UX
✅ No external dependencies (Roundcube)
✅ Extensible for future features
✅ Secure credential handling
✅ Activity logging built-in
✅ Works with Docker & scaling

---

## 3. IMPLEMENTATION APPROACH

### Phase 1: Backend Email Service (Week 1)

**Create Email Microservice Endpoints:**

```javascript
// Email Routes
GET    /api/mail/inbox              // List emails
GET    /api/mail/email/:id          // Get email details
POST   /api/mail/send               // Send email
POST   /api/mail/reply/:id          // Reply to email
PUT    /api/mail/mark-read/:id      // Mark as read
DELETE /api/mail/delete/:id         // Delete email
GET    /api/mail/folders            // List folders
GET    /api/mail/search             // Search emails
```

**Libraries Needed:**
```json
{
  "imap": "^0.8.19",           // IMAP protocol
  "mailparser": "^3.5.0",      // Parse email content
  "nodemailer": "^6.9.0"       // Already installed, use for SMTP
}
```

### Phase 2: Email Inbox UI (Week 2-3)

**Frontend Components:**
- Email list with search/filter
- email detail view
- Compose email modal
- Reply/Forward functionality
- Folder navigation
- Attachment handling

### Phase 3: Advanced Features (Week 4+)

- Email drafts
- Email signatures
- Contact management
- Batch operations
- Email templates
- Mobile optimization

---

## 4. DATABASE SCHEMA

### EmailSession
Store IMAP session credentials securely
```javascript
{
  userId: ObjectId,
  email: String,
  encryptedPassword: String,  // Encrypted
  iserver: String,            // IMAP server
  imapPort: Number,
  foldersList: Array,
  lastSync: Date,
  isActive: Boolean
}
```

### EmailCache
Cache email data for performance
```javascript
{
  userId: ObjectId,
  emailId: String,            // IMAP UID
  from: String,
  to: [String],
  subject: String,
  body: String,
  plaintext: String,
  date: Date,
  folder: String,
  isRead: Boolean,
  attachments: Array
}
```

### EmailActivity (Audit Log)
```javascript
{
  userId: ObjectId,
  action: String,             // 'read', 'send', 'delete'
  emailId: String,
  timestamp: Date,
  ipAddress: String
}
```

---

## 5. SECURITY MEASURES

### Credential Handling
- 🔐 Never store plain passwords
- 🔐 Encrypt stored credentials with `crypto` module
- 🔐 Use environment variable for encryption key
- 🔐 Decrypt on-demand for IMAP connection

### Authentication
- ✅ JWT verification on all email routes
- ✅ User can only access their own emails
- ✅ Activity audit logging
- ✅ Rate limiting on API endpoints

### Email Data
- ✅ IMAP connection closes after use
- ✅ No credentials in logs
- ✅ Cache with expiration (1 hour)
- ✅ HTTPS only for production

---

## 6. IMPLEMENTATION ROADMAP

### **Week 1: Backend Core (15-20 hours)**

**Day 1-2: Email Service Setup**
- [ ] Create `src/services/emailService.js` - IMAP/SMTP wrapper
- [ ] Create `src/controllers/emailController.js` - Route handlers
- [ ] Create `src/routes/email.js` - Email routes
- [ ] Add models: `EmailSession`, `EmailCache`, `EmailActivity`

**Day 3-4: IMAP Integration**
- [ ] Implement `fetchInbox()` - Get email list
- [ ] Implement `fetchEmail(id)` - Get email details
- [ ] Implement `markAsRead(id)` - Update read status
- [ ] Implement `deleteEmail(id)` - Mark as deleted
- [ ] Implement `getFolders()` - List mail folders

**Day 5: SMTP Integration & Testing**
- [ ] Implement `sendEmail()` - Send new email
- [ ] Implement `replyEmail(id)` - Reply to email
- [ ] Test with real mail account
- [ ] Error handling & logging

### **Week 2: Frontend UI (20-25 hours)**

**Day 1-2: Email List Component**
- [ ] Create email list view with pagination
- [ ] Add search/filter functionality
- [ ] Add folder selector
- [ ] Implement mark-as-read on UI

**Day 3-4: Email Detail & Compose**
- [ ] Create email detail view
- [ ] Create compose modal
- [ ] Create reply modal
- [ ] Add attachment preview

**Day 5: Polish & Testing**
- [ ] Responsive design
- [ ] Error handling
- [ ] Loading states
- [ ] E2E testing

### **Week 3: Advanced Features (15-20 hours)**

- [ ] Email caching optimization
- [ ] Drafts functionality
- [ ] Contact extraction from emails
- [ ] Email signatures
- [ ] Bulk operations
- [ ] User documentation

---

## 7. CODE STRUCTURE

```
src/
├── services/
│   └── emailService.js          // IMAP/SMTP wrapper
├── controllers/
│   └── emailController.js       // Route handlers
├── routes/
│   └── email.js                 // Email endpoints
├── models/
│   ├── EmailSession.js
│   ├── EmailCache.js
│   └── EmailActivity.js
├── middleware/
│   └── emailAuth.js             // Email-specific auth
└── utils/
    ├── credentialEncrypt.js     // Password encryption
    └── emailParser.js           // Email content parsing
```

---

## 8. ENV CONFIGURATION

```dotenv
# Email Service
EMAIL_SERVICE_ENABLED=true
EMAIL_IMAP_SERVER=mail.astermedsupplies.co.ke
EMAIL_IMAP_PORT=993
EMAIL_IMAP_TLS=true

# SMTP (already configured)
EMAIL_HOST=mail.astermedsupplies.co.ke
EMAIL_PORT=587
EMAIL_USER=accord@astermedsupplies.co.ke
EMAIL_PASS=accord123qP1
EMAIL_FROM="ACCORD Medical <accord@astermedsupplies.co.ke>"

# Email Service Security
EMAIL_ENCRYPTION_KEY=your-secure-encryption-key-32-chars
EMAIL_CACHE_TTL=3600              # 1 hour cache
EMAIL_API_RATE_LIMIT=100           # requests per hour
```

---

## 9. SAMPLE IMPLEMENTATION

### Email Service (emailService.js)
```javascript
import Imap from 'imap';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export class EmailService {
  constructor(email, password) {
    this.email = email;
    this.password = password;
    this.imap = null;
    this.smtpTransporter = null;
  }

  // Initialize IMAP connection
  async connect() {
    this.imap = new Imap({
      user: this.email,
      password: this.password,
      host: process.env.EMAIL_IMAP_SERVER,
      port: parseInt(process.env.EMAIL_IMAP_PORT),
      tls: true
    });

    return new Promise((resolve, reject) => {
      this.imap.openBox('INBOX', false, (err, box) => {
        if (err) reject(err);
        else resolve(box);
      });
    });
  }

  // Fetch inbox list
  async fetchInbox(limit = 20) {
    // IMAP search and fetch implementation
  }

  // Fetch single email
  async fetchEmail(uid) {
    // Parse email with attachments
  }

  // Send email
  async sendEmail(to, subject, body) {
    if (!this.smtpTransporter) {
      this.smtpTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }

    return this.smtpTransporter.sendMail({
      from: this.email,
      to,
      subject,
      html: body
    });
  }

  // Cleanup
  disconnect() {
    if (this.imap) this.imap.closeBox(() => this.imap.closeBox(() => {}));
  }
}
```

### Email Controller
```javascript
export async function getInbox(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Get user's email session
    const session = await EmailSession.findOne({ userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Email not configured' });

    // Decrypt password
    const password = decrypt(session.encryptedPassword);

    // Fetch emails
    const emailService = new EmailService(session.email, password);
    await emailService.connect();
    const emails = await emailService.fetchInbox(limit);

    // Log activity
    await EmailActivity.create({
      userId: req.user._id,
      action: 'inbox_viewed',
      timestamp: new Date()
    });

    res.json({ success: true, data: emails });
  } catch (error) {
    logger.error('Inbox fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
}
```

---

## 10. COMPARISON TABLE

| Feature | Roundcube (Iframe) | Custom Solution | Winner |
|---------|-------------------|-----------------|--------|
| Single Login | ❌ No | ✅ Yes | **Custom** |
| Control | ❌ Limited | ✅ Full | **Custom** |
| UI Customization | ❌ Hard | ✅ Easy | **Custom** |
| Maintenance | ⚠️ External | ✅ Yours | **Custom** |
| Scalability | ⚠️ Depends | ✅ Native | **Custom** |
| Time to Implement | ✅ 2-3 days | ⚠️ 3-4 weeks | Roundcube |
| Long-term Cost | ❌ Higher | ✅ Lower | **Custom** |

---

## 11. RISK MITIGATION

| Risk | Mitigation |
|------|-----------|
| IMAP connection issues | Implement retry logic, connection pooling |
| Slow email fetching | Implement caching, pagination, background sync |
| Password security | Encrypt with crypto, never log, secure key storage |
| Rate limiting | Implement API rate limiting, user quotas |
| Attachment handling | Validate file types, scan for malware |

---

## 12. IMPLEMENTATION TIMELINE

```
Week 1:  Backend email service (IMAP/SMTP)
Week 2:  Frontend email UI (list, detail, compose)
Week 3:  Advanced features & testing
Week 4:  Performance optimization, launch
```

**Total: ~4 weeks, ~60-80 development hours**

---

## 13. NEXT STEPS

1. ✅ Confirm IMAP port (993 or 143?)
2. ✅ Test IMAP access with system email account
3. ✅ Approve architecture & timeline
4. ✅ Begin backend implementation

**Ready to start coding?**
