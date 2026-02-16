# ACCORD Backend - Quick Reference Card

**File:** `PROJECT_FULL_UNDERSTANDING.md` (in workspace root)

---

## 🚀 Quick Start (1 minute)

```bash
cd /home/seth/Documents/deployed/ACCORDBACKEND/project
npm run dev
# Server runs at http://localhost:5000
```

---

## 🗂️ Where Everything Is

| What | Where |
|------|-------|
| **Start here** | `/project/src/server.js` |
| **Models (27)** | `/project/src/models/*.js` |
| **Routes (80+)** | `/project/src/routes/*.js` |
| **Controllers (20)** | `/project/src/controllers/*.js` |
| **Auth/Middleware** | `/project/src/middleware/` |
| **Email/Jobs** | `/project/src/services/` |
| **Logging** | `/project/src/utils/logger.js` |
| **Full Guide** | `PROJECT_FULL_UNDERSTANDING.md` |

---

## 📊 What's Running

**Server:** Node.js Express on port 5000  
**Database:** MongoDB (27 collections)  
**Real-time:** Socket.IO (live updates)  
**Auth:** JWT (access 15min + refresh 30day)  
**Storage:** Cloudinary + Local uploads/  
**Email:** Nodemailer SMTP  
**Scheduling:** node-cron (daily/weekly)  

---

## 🔐 How to Test

```bash
# Get JWT token (from login endpoint)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'

# Use token in requests
curl -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Admin** | Everything + user management |
| **Manager** | Team oversight, report approval |
| **Sales** | Visits, quotations, reports |
| **Engineer** | Service assignments, tasks |

---

## 📋 Core Models (Key 9)

1. **User** - People in system
2. **Lead** - Sales opportunities
3. **Visit** - Sales activities
4. **Machine** - Equipment registry
5. **EngineeringService** - Maintenance tasks
6. **Report** - Weekly summaries
7. **Request/Quotation** - Equipment quotes
8. **Order** - Sales orders
9. **Facility** - Healthcare locations

---

## 🔌 Main API Routes

### Public
- `POST /api/auth/register`
- `POST /api/auth/login`

### Sales
- `GET/POST /api/visits`
- `POST /api/reports`
- `GET /api/quotation/my`

### Engineering
- `GET /api/engineering-services/my`
- `GET /api/machines`

### Admin
- `GET /api/admin/users`
- `PUT /api/admin/reports/:id/approve`

### Real-Time
- `GET /api/dashboard`
- Socket.IO events auto-emit

---

## 💾 Models Quick Lookup

### User
- email, password, role, department
- Ref'd by: everything

### Lead  
- facilityName, equipmentOfInterest
- Status: new → contacted → negotiation → won/lost

### Visit
- date, facility, contacts, visitPurpose
- Creates: followUp actions

### Machine
- name, serialNumber, facility, status
- Linked to: EngineeringService

### EngineeringService
- serviceType, engineerInCharge, status
- Types: installation, maintenance, repair

### Report
- sections[], status, userId, weekStart
- Status: pending → reviewed → approved

### Request (Quotation)
- hospital, equipmentRequired, urgency
- Admin responds with price/document

### Order
- items, pricing, status
- Integrated with checkout

---

## 🛡️ Security

✅ JWT tokens with 15min expiry  
✅ Role-based authorization  
✅ Bcrypt password hashing  
✅ Rate limiting (10 req/15min)  
✅ Input validation  
✅ CORS & Helmet enabled  

---

## 📧 Emails Sent By

- User registration
- Report submission (to admin)
- Quotation request (to admin)
- Daily reminder (9 AM)
- Weekly summary (Monday)

---

## 🔄 Typical Flow

```
User Logs In
    ↓
Token Created + Stored
    ↓
Include Token in Requests
    ↓
Middleware Verifies Token
    ↓
Route Handler Processes
    ↓
Database Query
    ↓
Response Sent
    ↓
Socket.IO Notifies Others
```

---

## 📊 Pagination

Most list endpoints use pagination:
- Default: 10 items per page
- Params: `?page=1&limit=20&sort=-createdAt`

---

## 🚨 Common Errors

| Error | Meaning | Fix |
|-------|---------|-----|
| 401 | No/bad token | Check Authorization header |
| 403 | Wrong role | Ensure user has required role |
| 400 | Invalid input | Check request body fields |
| 429 | Rate limited | Wait 15 minutes |
| 500 | Server error | Check server logs |

---

## 🔧 Development Commands

```bash
npm run dev              # Start with auto-reload
npm start               # Production start
npm test                # Run tests
npm run seed            # Seed database
npm run create-admins   # Add admin user
```

---

## 📚 Documentation Map

- `PROJECT_FULL_UNDERSTANDING.md` ← **YOU ARE HERE**
- `DOCUMENTATIONS/PROJECT_COMPREHENSIVE_ANALYSIS.md` - Deep dive
- `DOCUMENTATIONS/PROJECT_ARCHITECTURE_DIAGRAMS.md` - Visuals
- `DOCUMENTATIONS/QUICK_START_GUIDE.md` - Patterns
- `DOCUMENTATIONS/BACKEND_API_DOCUMENTATION.md` - Endpoints

---

## 🎯 Key Files to Read First

1. `/project/src/server.js` (319 lines) - Entry point
2. `/project/src/middleware/auth.js` - Authentication
3. `/project/src/routes/auth.js` - Simple example route
4. `/project/src/models/User.js` - Data structure
5. `/project/src/controllers/userController.js` - Business logic

---

## 💡 Common Tasks

### Add New User Route
1. Create model in `/models/YourModel.js`
2. Create controller in `/controllers/yourController.js`
3. Create route in `/routes/yourRoute.js`
4. Import and mount in `/server.js`

### Send an Email
```javascript
import { sendEmail } from './services/emailService.js';
await sendEmail('user@example.com', 'subject', 'html-body');
```

### Create Database Entry
```javascript
const newItem = new YourModel({ field: value });
await newItem.save();
```

### Query Database
```javascript
const items = await YourModel.find({ userId });
const item = await YourModel.findById(id);
```

---

## 🚀 Deployment

**Current:** `https://app.codewithseth.co.ke`

**Deploy Script:** `deploy-to-production.sh` (in workspace root)

**Environment:** MongoDB Atlas + Cloudinary + Nodemailer SMTP

---

## 📞 Quick Help

**How do I...?**

| Q | A |
|---|---|
| Find a specific route | Search `/routes/` |
| Understand a model | Read `/models/YourModel.js` |
| See business logic | Check `/controllers/yourController.js` |
| Add an email | Edit `/services/emailService.js` |
| Schedule a job | Check `/services/scheduledJobs.js` |
| Debug errors | Check `/project/logs/` |

---

## ✨ Project Stats

- **27 Models** (database collections)
- **80+ Routes** (API endpoints)
- **20 Controllers** (business logic)
- **5 Middleware** (security/validation)
- **7 Services** (email, scheduling, PDF)
- **15,000+ Lines** of code
- **25+ Documentation** files

---

**Status:** ✅ Fully Implemented & Deployed

**Last Updated:** February 3, 2026

**For Full Details:** See `PROJECT_FULL_UNDERSTANDING.md`
