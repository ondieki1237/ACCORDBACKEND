# ACCORD Backend Project - Visual Summary

A one-page visual reference of the entire system.

---

## 🎯 PROJECT AT A GLANCE

```
┌─────────────────────────────────────────────────────────────────┐
│              ACCORD BACKEND - COMPLETE SYSTEM                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PURPOSE: Medical Equipment Sales & Field Service Management     │
│  STATUS:  ✅ Fully Implemented & Deployed                       │
│  URL:     https://app.codewithseth.co.ke                        │
│                                                                  │
│  TECH STACK:                                                     │
│  ├─ Node.js/Express       (Server)                              │
│  ├─ MongoDB               (Database - 27 collections)           │
│  ├─ Socket.IO             (Real-time - live updates)            │
│  ├─ JWT                   (Authentication)                      │
│  ├─ Nodemailer            (Email notifications)                 │
│  ├─ Cloudinary            (File storage)                        │
│  ├─ PDFKit                (PDF generation)                      │
│  └─ node-cron             (Scheduled jobs)                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ ARCHITECTURE

```
                        FRONTEND APPS
                   (Sales, Engineer, Admin)
                            ↓
                      [HTTP/REST/Socket.IO]
                            ↓
              ┌─────────────────────────────┐
              │   EXPRESS.JS SERVER         │
              │                             │
              │  ┌─────────────────────┐   │
              │  │  MIDDLEWARE STACK   │   │
              │  │ Helmet, CORS, Auth  │   │
              │  │ Validation, Logging │   │
              │  └─────────────────────┘   │
              │            ↓               │
              │  ┌─────────────────────┐   │
              │  │  40+ ROUTE FILES    │   │
              │  │  (80+ endpoints)    │   │
              │  └─────────────────────┘   │
              │            ↓               │
              │  ┌─────────────────────┐   │
              │  │  20 CONTROLLERS     │   │
              │  │  (Business Logic)   │   │
              │  └─────────────────────┘   │
              │            ↓               │
              │  ┌─────────────────────┐   │
              │  │  7 SERVICES         │   │
              │  │ Email, Jobs, PDF    │   │
              │  └─────────────────────┘   │
              └─────────┬──────────────────┘
                        │
      ┌─────────────┬───┴────┬──────────────┐
      ↓             ↓        ↓              ↓
   MONGODB     CLOUDINARY EMAIL         SOCKET.IO
   (27 models) (Files)    (SMTP)      (Real-time)
```

---

## 👥 USER ROLES & PERMISSIONS

```
┌─────────────────────────────────────────────────────────────┐
│  ROLE-BASED ACCESS CONTROL (4 Roles)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔐 ADMIN (Full Access)                                    │
│  ├─ User management (CRUD)                                │
│  ├─ Report approval                                        │
│  ├─ Quotation responses                                    │
│  ├─ All analytics                                          │
│  └─ System configuration                                  │
│                                                             │
│  👨‍💼 MANAGER (Team Oversight)                              │
│  ├─ View team activities                                  │
│  ├─ Approve reports                                        │
│  ├─ Respond to quotations                                 │
│  └─ View team analytics                                   │
│                                                             │
│  💼 SALES (Field Activities)                              │
│  ├─ Record visits                                          │
│  ├─ Submit reports                                         │
│  ├─ Request quotations                                    │
│  └─ Manage leads                                          │
│                                                             │
│  🔧 ENGINEER (Service Tasks)                              │
│  ├─ View assignments                                       │
│  ├─ Update service status                                 │
│  ├─ Record conditions                                      │
│  └─ View machine history                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 DATA MODELS (27 Total)

```
┌─────────────────────────────────────────────────────────────┐
│  PRIMARY MODELS                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👤 USER              - People in system                   │
│  🎯 LEAD              - Sales opportunities                │
│  📍 VISIT             - Sales field activities             │
│  🏥 FACILITY          - Healthcare locations               │
│  🔧 MACHINE           - Equipment registry                 │
│  🛠️  ENGINEERINGSERVICE - Maintenance/repair tasks        │
│  📄 REPORT            - Weekly activity summaries          │
│  💰 REQUEST/QUOTATION - Equipment quote requests          │
│  📦 ORDER             - Sales/purchase orders              │
│                                                             │
│  + 18 MORE SUPPORTING MODELS                               │
│  (FollowUp, Consumable, Planner, Communication, etc.)    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 AUTHENTICATION FLOW

```
1. USER REGISTERS/LOGS IN
   ↓
2. PASSWORD VERIFIED (bcrypt hash compare)
   ↓
3. JWT TOKENS CREATED
   ├─ Access Token (15 min, short-lived)
   └─ Refresh Token (30 days, long-lived)
   ↓
4. TOKENS SENT TO CLIENT
   ↓
5. CLIENT INCLUDES TOKEN IN REQUESTS
   Header: "Authorization: Bearer <token>"
   ↓
6. MIDDLEWARE VERIFIES TOKEN
   ├─ Extract token
   ├─ Verify JWT signature
   ├─ Check expiry
   └─ Load user from DB
   ↓
7. AUTHORIZE BY ROLE
   ├─ Check: user.role in allowedRoles
   └─ Return 403 if unauthorized
   ↓
8. PROCEED WITH REQUEST
```

---

## 🔄 REQUEST/RESPONSE CYCLE

```
CLIENT                    SERVER                    DATABASE
  │                         │                          │
  ├──────► POST /api/visits ──────────────────────────┤
  │        + JWT token       │                         │
  │                         │◄─ Auth middleware ─────┤
  │                         │ (verify JWT)            │
  │                    [Route matching]                │
  │                         │                         │
  │                    [Controller logic]              │
  │                         │                         │
  │                         ├──────► CREATE Visit ────►
  │                         │                         │
  │                    [Format response]               │
  │                         │◄─ Send email ────────┤  │
  │                         │ (async)              │  │
  │                         │                         │
  │◄────────────────────────┤                         │
  │  200 OK + data          │                         │
  │  (Socket.IO event)      │                         │
  │                         │
```

---

## 📈 KEY FEATURES BY USER

```
┌──────────────────┬──────────────────┬──────────────────┬──────────────┐
│    SALES REP     │    ENGINEER      │     MANAGER      │    ADMIN     │
├──────────────────┼──────────────────┼──────────────────┼──────────────┤
│                  │                  │                  │              │
│ 📍 Record visits │ 🔧 View tasks   │ 👥 View team    │ 🎛️  Settings │
│ 📊 Submit report │ ✅ Update status│ ✏️  Approve rep │ 👤 Users    │
│ 💬 Request quote │ 🏥 View machines│ 💰 Respond quo  │ 📊 Analytics│
│ 📝 Track leads   │ 📋 View history │ 📈 View stats  │ 🔒 Authorize│
│ 🎯 See targets   │ ⏰ Track time   │ 📧 Send email  │ 📱 App vers │
│                  │                  │                  │              │
└──────────────────┴──────────────────┴──────────────────┴──────────────┘
```

---

## 📁 PROJECT STRUCTURE

```
/project/src/
│
├── server.js                    ← ENTRY POINT (319 lines)
│   ├─ Express setup
│   ├─ Middleware stack
│   ├─ Route mounting
│   ├─ Socket.IO setup
│   └─ Server listen
│
├── config/
│   └─ database.js              ← MongoDB connection
│
├── middleware/                  ← REQUEST PROCESSING
│   ├─ auth.js                  ← JWT verification + role check
│   ├─ errorHandler.js          ← Centralized error handling
│   ├─ rateLimiters.js          ← Rate limiting
│   ├─ validation.js            ← Input validation
│   └─ upload.js                ← File uploads
│
├── models/ (27 files)          ← DATABASE SCHEMAS
│   ├─ User.js
│   ├─ Lead.js
│   ├─ Visit.js
│   ├─ Machine.js
│   ├─ EngineeringService.js
│   ├─ Report.js
│   ├─ Request.js
│   └─ ... 20 more
│
├── routes/ (40+ files)         ← API ENDPOINTS
│   ├─ auth.js                  ← Authentication
│   ├─ user.js                  ← User profile
│   ├─ visits.js                ← Visit management
│   ├─ reports.js               ← Report submission
│   ├─ quotation.js             ← Quote requests
│   ├─ leads.js                 ← Lead management
│   ├─ machines.js              ← Equipment
│   ├─ engineeringServices.js   ← Maintenance
│   ├─ dashboard.js             ← Dashboard data
│   ├─ analytics.js             ← Analytics
│   ├─ admin/                   ← ADMIN ROUTES
│   │   ├─ users.js
│   │   ├─ analytics.js
│   │   ├─ reports.js
│   │   └─ ... more
│   └─ ... 30+ more routes
│
├── controllers/ (20 files)     ← BUSINESS LOGIC
│   ├─ userController.js
│   ├─ analyticsController.js
│   ├─ callLogController.js
│   └─ ... more
│
├── services/                   ← REUSABLE SERVICES
│   ├─ emailService.js          ← Nodemailer
│   ├─ scheduledJobs.js         ← node-cron
│   ├─ machineReports.js        ← Report generation
│   ├─ pdfCatalogService.js     ← PDF creation
│   └─ ... more
│
├── utils/
│   ├─ logger.js                ← Winston logging
│   └─ cloudinary.js            ← File upload
│
└── .env                        ← CONFIGURATION

```

---

## 🔌 API ENDPOINTS (Sample)

```
PUBLIC ENDPOINTS:
  POST   /api/auth/register           - Register user
  POST   /api/auth/login              - Login user
  POST   /api/app-updates/check       - Check app version

SALES ENDPOINTS (Protected):
  GET    /api/visits                  - List visits
  POST   /api/visits                  - Create visit
  PUT    /api/visits/:id              - Update visit
  POST   /api/reports                 - Submit report
  GET    /api/reports/my              - My reports
  POST   /api/quotation               - Request quote
  GET    /api/quotation/my            - My quotations
  POST   /api/leads                   - Create lead
  GET    /api/leads/my                - My leads

ENGINEERING ENDPOINTS (Protected):
  GET    /api/engineering-services    - My tasks
  PUT    /api/engineering-services/:id/status - Update task
  GET    /api/machines                - Equipment list
  GET    /api/machines/:id/history    - Service history

ADMIN ENDPOINTS (Protected + Admin role):
  GET    /api/admin/users             - User management
  PUT    /api/admin/reports/:id/approve - Approve report
  POST   /api/admin/quotations/:id/respond - Respond quote
  GET    /api/admin/analytics         - Full analytics
  POST   /api/app-updates             - Manage app versions

DASHBOARD/ANALYTICS:
  GET    /api/dashboard               - Dashboard data
  GET    /api/analytics/...           - Analytics endpoints
```

---

## 🛡️ SECURITY FEATURES

```
┌─────────────────────────────────────────────────────────────┐
│  SECURITY IMPLEMENTATION                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔐 AUTHENTICATION                                          │
│     └─ JWT tokens (access + refresh)                       │
│        ├─ Access token: 15 minutes                         │
│        └─ Refresh token: 30 days                           │
│                                                             │
│  🔒 AUTHORIZATION                                           │
│     └─ Role-based access control                           │
│        ├─ Admin, Manager, Sales, Engineer                  │
│        └─ Per-endpoint role checking                       │
│                                                             │
│  🔑 PASSWORD SECURITY                                       │
│     └─ Bcrypt hashing (salt: 10)                           │
│                                                             │
│  🛡️  API SECURITY                                           │
│     ├─ Helmet (security headers)                           │
│     ├─ CORS (origin validation)                            │
│     ├─ Rate limiting (10 req/15min)                        │
│     └─ Input validation (express-validator)               │
│                                                             │
│  📋 AUDIT & LOGGING                                         │
│     ├─ Winston logging                                     │
│     ├─ Activity trails                                     │
│     └─ Error tracking                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ HOW TO ADD A NEW ENDPOINT

```
1. CREATE MODEL (if needed)
   └─ Define schema in /models/YourModel.js

2. CREATE CONTROLLER
   └─ Add logic in /controllers/yourController.js

3. CREATE ROUTE
   └─ Define endpoint in /routes/yourRoute.js

4. MOUNT ROUTE
   └─ Import & register in server.js

EXAMPLE:
  POST /api/machines
    └─ Route: routes/machines.js
    └─ Controller: controllers/machineController.js
    └─ Model: models/Machine.js
    └─ Mounted: app.use('/api/machines', routes)
```

---

## 📊 PROJECT STATISTICS

```
┌──────────────────────────────────┐
│  CODE METRICS                    │
├──────────────────────────────────┤
│  Data Models:        27          │
│  API Endpoints:      80+         │
│  Route Files:        40+         │
│  Controllers:        20          │
│  Services:           7           │
│  Middleware Layers:  5           │
│  Lines of Code:      15,000+     │
│  Database Indexes:   50+         │
│                                  │
│  DOCUMENTATION                  │
│  Docs Files:         25+         │
│  New Guides:         5           │
│  Total Doc Lines:    8,000+      │
└──────────────────────────────────┘
```

---

## 🚀 QUICK START

```bash
# 1. Install & Navigate
cd /home/seth/Documents/deployed/ACCORDBACKEND/project
npm install

# 2. Configure Environment
cp .env.example .env
# Edit .env with your values

# 3. Start Development Server
npm run dev
# Runs on http://localhost:5000

# 4. Test First Endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# 5. Use Token
curl -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📚 DOCUMENTATION FILES

```
New Documentation Created:

1. STUDY_COMPLETE.md               (400 lines)
   └─ Project overview & navigation

2. QUICK_REFERENCE.md              (800 lines)
   └─ Cheat sheet & quick lookup

3. LEARNING_PATH.md                (1000 lines)
   └─ Structured learning (8 hours)

4. PROJECT_FULL_UNDERSTANDING.md   (5000 lines)
   └─ Complete technical reference

5. DEVELOPERS_GUIDE.md             (1200 lines)
   └─ Implementation & patterns

6. DOCUMENTATION_INDEX.md          (400 lines)
   └─ This navigation document
```

**Total:** 8,000+ lines of new documentation

---

## ✅ YOU NOW UNDERSTAND

- ✅ Complete system architecture
- ✅ All 27 data models
- ✅ 80+ API endpoints
- ✅ Authentication & authorization
- ✅ Request/response flow
- ✅ Security implementation
- ✅ Service layer patterns
- ✅ How to add features
- ✅ Deployment process
- ✅ Project structure & organization

---

## 🎯 NEXT STEPS

**Right Now:**
→ Read [STUDY_COMPLETE.md](STUDY_COMPLETE.md) (5 min)

**Within 1 Hour:**
→ Start [LEARNING_PATH.md](LEARNING_PATH.md) Phase 1

**For Development:**
→ Refer to [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

**For Deep Dives:**
→ Use [PROJECT_FULL_UNDERSTANDING.md](PROJECT_FULL_UNDERSTANDING.md)

**For Implementation:**
→ Follow [DEVELOPERS_GUIDE.md](DEVELOPERS_GUIDE.md)

---

**Status:** ✅ Complete & Ready
**Created:** February 3, 2026
**For:** Complete Project Understanding
