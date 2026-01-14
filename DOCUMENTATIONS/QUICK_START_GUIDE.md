# ACCORD Backend - Quick Reference Guide

**For: Developers, Architects, New Team Members**

---

## 📍 Where to Find Everything

| What | Where | File |
|------|-------|------|
| **Server starts here** | Entry point | `/project/src/server.js` |
| **Database connection** | Config | `/project/src/config/database.js` |
| **All API routes** | Routes folder | `/project/src/routes/*.js` + `/project/src/routes/admin/*.js` |
| **All data models** | Models folder | `/project/src/models/*.js` (20 files) |
| **Business logic** | Controllers | `/project/src/controllers/*.js` |
| **Email & scheduling** | Services | `/project/src/services/` |
| **Security & auth** | Middleware | `/project/src/middleware/auth.js` |
| **Input validation** | Middleware | `/project/src/middleware/validation.js` |
| **Logging** | Utilities | `/project/src/utils/logger.js` |
| **File uploads** | Utilities | `/project/src/utils/cloudinary.js` |
| **Dependencies** | Configuration | `/project/package.json` |

---

## 🚀 Quick Start (5 minutes)

```bash
# 1. Navigate to project
cd /home/seth/Documents/deployed/ACCORDBACKEND/project

# 2. Install dependencies
npm install

# 3. Create .env (copy example and fill values)
cp .env.example .env
# Edit .env with:
#   MONGODB_URI=your_mongo_connection
#   JWT_SECRET=your_secret
#   EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
#   CLOUDINARY_* variables

# 4. Start development server
npm run dev
# Watches on http://localhost:5000

# 5. In another terminal, test a request
curl -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer <token>"
```

---

## 🔑 Environment Variables (Required)

```bash
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# JWT Authentication
JWT_SECRET=your_256bit_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=30d

# Email Service (Nodemailer)
EMAIL_HOST=smtp.gmail.com          # Gmail: smtp.gmail.com
EMAIL_PORT=465                     # Gmail: 465 (SSL)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password       # NOT regular password!

# File Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend
CLIENT_URL=http://localhost:3000   # Dev: localhost, Prod: your domain

# Server
PORT=5000
NODE_ENV=development               # or 'production'
```

---

## 📊 Main Data Models (Quick Reference)

### User
```javascript
{
  employeeId, firstName, lastName, email, password (hashed),
  role: 'admin'|'manager'|'sales'|'engineer',
  department, phone, region, territory,
  isActive, profileImage,
  refreshTokens: [{token, createdAt (TTL: 30d)}],
  targets: {monthly, quarterly},
  timestamps
}
```

### Lead
```javascript
{
  facilityName, facilityType, location,
  contactPerson: {name, role, phone, email},
  equipmentOfInterest, budget, timeline,
  leadStatus: 'new'|'contacted'|...|'won'|'lost',
  leadSource, createdBy (ref: User),
  statusHistory: [{changedBy, changedTo, date}],
  timestamps
}
```

### Visit
```javascript
{
  userId (ref: User), date, duration,
  client: {type, name, location, phone},
  visitPurpose, visitOutcome,
  contacts: [{role, name, phone, email}],
  equipment[], notes,
  followUpActions: [{assignedTo (ref: User), dueDate, description}],
  timestamps
}
```

### EngineeringService
```javascript
{
  date, scheduledDate,
  facility: {name, location},
  serviceType: 'installation'|'maintenance'|'repair'|'service'|'inspection',
  engineerInCharge (ref: User),
  machineId (ref: Machine),
  machineDetails, conditionBefore, conditionAfter,
  status: 'pending'|'assigned'|'in-progress'|'completed'|'cancelled',
  notes, otherPersonnel: [strings],
  nextServiceDate,
  userId (ref: User - creator),
  timestamps
}
```

### Report
```javascript
{
  userId (ref: User), weekStart, weekEnd,
  sections: [{id, title, content}],
  status: 'pending'|'reviewed'|'approved'|'rejected',
  isDraft,
  pdfUrl, fileUrl,
  reviewedBy (ref: User), reviewedAt,
  adminNotes,
  timestamps
}
```

---

## 🛣️ API Endpoints (Cheat Sheet)

### Authentication
```
POST   /api/auth/register          Public (sales/engineer only)
POST   /api/auth/login             Public
POST   /api/auth/refresh           Public (refresh token)
POST   /api/auth/logout            Protected
```

### User & Profile
```
GET    /api/users/profile          Protected (own profile)
PUT    /api/users/profile          Protected
GET    /api/users/:id              Admin/Manager
PUT    /api/users/:id              Admin only
```

### Sales Operations
```
GET    /api/visits                 Protected (own visits)
POST   /api/visits                 Protected (create)
PUT    /api/visits/:id             Protected
DELETE /api/visits/:id             Admin only

GET    /api/leads                  Protected
POST   /api/leads                  Protected
PUT    /api/leads/:id              Protected

POST   /api/quotation              Protected (sales creates)
GET    /api/quotation/my           Protected (own)
GET    /api/quotation/all          Admin only
POST   /api/quotation/respond/:id  Admin only (respond to quote)

POST   /api/reports                Protected (sales submits)
GET    /api/reports/my             Protected (own)
GET    /api/reports                Admin only (all)
```

### Engineering Services
```
GET    /api/engineering-services               Protected (role-filtered)
POST   /api/engineering-services               Admin/Manager
PUT    /api/engineering-services/:id           Admin/Manager or Engineer (limited)
PUT    /api/engineering-services/:id/assign    Admin/Manager
GET    /api/engineering-services/mine          Engineer only
DELETE /api/engineering-services/:id           Admin only
POST   /api/engineering-services/bulk-assign   Admin/Manager
```

### Machines & Equipment
```
GET    /api/machines               Protected
POST   /api/machines               Admin/Manager
PUT    /api/machines/:id           Admin/Manager
GET    /api/machines/:id/services  Get services for machine
DELETE /api/machines/:id           Admin only
```

### Admin Operations
```
GET    /api/admin/reports              Admin only
GET    /api/admin/reports/:id          Admin only
PUT    /api/admin/reports/:id          Admin only (approve/reject)

GET    /api/admin/quotations           Admin only
PUT    /api/admin/quotations/:id       Admin only

GET    /api/admin/users                Admin only
POST   /api/admin/users                Admin only
PUT    /api/admin/users/:id            Admin only
DELETE /api/admin/users/:id            Admin only

GET    /api/admin/analytics            Admin/Manager
GET    /api/admin/machines             Admin only
GET    /api/admin/leads                Admin only
```

---

## 🔐 Authentication Pattern

Every protected endpoint follows this pattern:

```javascript
// Request
GET /api/dashboard
Headers: {
  "Authorization": "Bearer eyJhbGc..."
}

// Middleware: authenticate
→ Extract token from "Bearer <token>"
→ jwt.verify(token, JWT_SECRET)
→ User.findById(decoded.id)
→ req.user = user object

// Middleware: authorize (optional)
→ Check req.user.role in allowed list
→ Return 403 if not allowed

// Route Handler
→ req.user is available
→ Access req.user.id, req.user.email, req.user.role, etc.
→ Return data

// Response
200 OK { success: true, data: {...} }
```

### Response Format (Standard)

```javascript
// Success (2xx)
{
  "success": true,
  "message": "Operation successful",
  "data": { /* actual data */ }
}

// Error (4xx/5xx)
{
  "success": false,
  "message": "Error description",
  "errors": ["field error", "another error"]  // Optional
}
```

---

## 🧪 Common API Testing

### Using cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Response: {"success":true,"data":{"tokens":{"accessToken":"...","refreshToken":"..."}}}

# Use token in next request
TOKEN="eyJhbGc..."

# Get dashboard
curl -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"

# Create visit
curl -X POST http://localhost:5000/api/visits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date":"2025-12-11",
    "client":{"type":"hospital","name":"City Hospital","location":"Nairobi"},
    "visitPurpose":"demo",
    "notes":"Good reception"
  }'
```

### Using Postman

1. **Create Environment** with variables:
   - `baseUrl` = `http://localhost:5000`
   - `token` = (will be set after login)

2. **Login Request:**
   - Method: POST
   - URL: `{{baseUrl}}/api/auth/login`
   - Body: `{"email":"...","password":"..."}`
   - Tests: Set `pm.environment.set("token", pm.response.json().data.tokens.accessToken);`

3. **Protected Requests:**
   - Headers: `Authorization: Bearer {{token}}`

---

## 📝 Common Code Patterns

### Create a New Route

**File: `/project/src/routes/example.js`**

```javascript
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateExample } from '../middleware/validation.js';

const router = express.Router();

// GET /api/example
router.get('/', authenticate, async (req, res) => {
  try {
    const data = await Example.find({ userId: req.user._id });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching' });
  }
});

// POST /api/example (admin only)
router.post('/', authenticate, authorize('admin'), validateExample, async (req, res) => {
  try {
    const example = new Example({...req.body, userId: req.user._id});
    await example.save();
    res.status(201).json({ success: true, data: example });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
```

**Register in `/project/src/server.js`:**
```javascript
import exampleRoutes from './routes/example.js';
app.use('/api/example', exampleRoutes);
```

---

### Create a New Model

**File: `/project/src/models/Example.js`**

```javascript
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const exampleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

exampleSchema.plugin(mongoosePaginate);

// Index for common queries
exampleSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Example', exampleSchema);
```

---

### Send Email

```javascript
import { sendEmail } from '../services/emailService.js';

// In route handler:
await sendEmail({
  to: user.email,
  subject: 'Weekly Report Submitted',
  template: 'reportNotification',
  data: {
    firstName: user.firstName,
    weekRange: '06/10/2025 - 12/10/2025',
    reportUrl: 'https://...'
  }
});
```

---

### Emit Socket.IO Event

```javascript
// In route handler:
const io = app.get('io');
io.emit('visitUpdate', {
  visitId: visit._id,
  userId: req.user._id,
  action: 'created'
});
```

---

## 🐛 Debugging & Troubleshooting

### Check Server Logs
```bash
# Watch error log
tail -f /home/seth/Documents/deployed/ACCORDBACKEND/project/logs/error.log

# Watch all logs
tail -f /home/seth/Documents/deployed/ACCORDBACKEND/project/logs/combined.log
```

### Database Query Debugging
```javascript
// In route handler
import logger from '../utils/logger.js';

logger.info(`Fetching visits for user ${req.user._id}`);
const visits = await Visit.find({ userId: req.user._id });
logger.info(`Found ${visits.length} visits`);
```

### Common Error Responses

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Missing/invalid token | Check Authorization header, refresh token |
| 403 Forbidden | Wrong role | Check user role, ensure user has correct permission |
| 400 Bad Request | Validation failed | Check request body, required fields |
| 404 Not Found | Resource doesn't exist | Check if ID is correct, resource deleted |
| 500 Server Error | Exception in code | Check error.log, debug the handler |

---

## 📈 Performance Tips

1. **Database Queries**
   - Use `.select()` to limit fields returned
   - Use `.populate()` for relations only when needed
   - Add indexes for frequently queried fields
   - Use pagination for large result sets

2. **Caching**
   - Cache user roles in JWT (don't refetch)
   - Cache facility lists (rarely change)
   - Redis (future) for session caching

3. **File Uploads**
   - Cloudinary for images/PDFs
   - Local /uploads/ as backup
   - Set 10MB limit (adjust if needed)

4. **Rate Limiting**
   - Global: 100 requests / 15 minutes
   - Auth: Stricter for /api/auth endpoints
   - Adjust if needed in rateLimiters.js

---

## 🎓 Learning Path

To fully understand the codebase:

1. **Start Here**
   - Read `PROJECT_COMPREHENSIVE_ANALYSIS.md` (main doc)
   - Read this quick reference

2. **Study Core Files** (in order)
   - `/project/src/server.js` - See what gets loaded
   - `/project/src/middleware/auth.js` - Understand authentication
   - `/project/src/models/User.js` - Simplest model
   - `/project/src/routes/auth.js` - Simplest routes

3. **Understand Flow**
   - Pick a feature (e.g., "Submit Report")
   - Trace: Frontend → POST /api/reports → Route → Controller → Model → Database → Email
   - Read relevant documentation

4. **Deep Dive**
   - Study complex features (Engineering Services, Analytics)
   - Review role-based access control implementation
   - Examine scheduled jobs

5. **Practice**
   - Add a new API endpoint
   - Create validation rules
   - Write a new model
   - Send an email notification

---

## 📞 Quick Troubleshooting

### Server won't start
```bash
# Check if port is in use
lsof -i :5000

# Kill process if needed
kill -9 <PID>

# Check .env file exists and is valid
cat project/.env | grep MONGODB_URI
```

### Database connection fails
```bash
# Verify MongoDB URI
# Check: host is correct, credentials are valid
# Test with MongoDB client:
mongosh "your_connection_string"
```

### Email not sending
```bash
# Check .env EMAIL_* variables
# Gmail: Use App Password, not regular password
# Check less secure apps setting in Gmail
# Test with sample code in emailService.js
```

### JWT authentication fails
```bash
# Ensure JWT_SECRET is set in .env
# Verify token format: "Bearer <token>"
# Check token not expired (15 min for access)
# Refresh if needed: POST /api/auth/refresh
```

---

## 🔄 Common Workflows

### Add a New User Role

1. Update `User.js` model role enum
2. Update `authorize()` middleware calls
3. Update RBAC documentation
4. Test all endpoints with new role
5. Update frontend (if needed)

### Add a New API Endpoint

1. Create route in appropriate `/src/routes/*.js` file
2. Add authentication & validation middleware
3. Add controller function (if complex logic)
4. Register route in `server.js`
5. Test with Postman/cURL
6. Document in API documentation file

### Deploy to Production

1. Update `.env` with production values
2. Ensure MONGODB_URI points to production cluster
3. Set NODE_ENV=production
4. Build: `npm install --production`
5. Start: `npm start` or use PM2
6. Set up SSL/HTTPS (Nginx reverse proxy)
7. Verify logs are rotating

---

## 📚 Important Files You'll Touch Often

| File | Purpose | When to Edit |
|------|---------|--------------|
| `/project/src/routes/*.js` | API endpoints | Adding new feature |
| `/project/src/models/*.js` | Data schema | Changing data structure |
| `/project/src/middleware/validation.js` | Input rules | Stricter validation needed |
| `/project/src/services/emailService.js` | Email templates | New email type |
| `/project/src/services/scheduledJobs.js` | Cron jobs | New scheduled task |
| `.env` | Configuration | Local/production setup |
| `/project/logs/error.log` | Error tracking | Debugging failures |

---

## ✅ Pre-Deployment Checklist

- [ ] .env configured for production
- [ ] MONGODB_URI points to production database
- [ ] JWT_SECRET is strong (256+ chars)
- [ ] EMAIL_* variables configured
- [ ] CLOUDINARY_* variables set
- [ ] CLIENT_URL set to frontend domain
- [ ] CORS whitelist updated (not all origins)
- [ ] Rate limiting checked
- [ ] Error logging verified
- [ ] Password hashing confirmed (bcryptjs)
- [ ] HTTPS/SSL configured
- [ ] Database backups configured
- [ ] Monitoring/alerting set up
- [ ] Postman collection tested
- [ ] Load test performed

---

## 🎯 Next Steps

1. **Read** `PROJECT_COMPREHENSIVE_ANALYSIS.md` for deep dive
2. **Review** `PROJECT_ARCHITECTURE_DIAGRAMS.md` for visual understanding
3. **Study** a simple feature end-to-end (e.g., User login)
4. **Build** a new small feature (e.g., new endpoint)
5. **Test** thoroughly before deploying
6. **Monitor** logs and errors after deployment

---

*This is your quick reference. Keep it handy!*

**Last Updated:** December 11, 2025
