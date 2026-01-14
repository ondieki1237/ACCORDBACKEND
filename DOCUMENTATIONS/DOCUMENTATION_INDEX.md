# ACCORD Backend - Documentation Index & Navigation Guide

**Quick Links to Everything**

---

## 📚 Documentation Files (Read In This Order)

### 1️⃣ START HERE - Executive Summary
**File:** `UNDERSTANDING_SUMMARY.md`  
**Read Time:** 10 minutes  
**What:** Complete overview of what ACCORD Backend is, does, and how it's organized  
**Why:** Get the big picture before diving into details  
→ **Read this first**

### 2️⃣ Technical Deep Dive
**File:** `PROJECT_COMPREHENSIVE_ANALYSIS.md`  
**Read Time:** 45-60 minutes  
**What:** In-depth analysis of every component, model, service, route, etc.  
**Includes:**
- Architecture overview
- All 20 database models explained
- Route structure and patterns
- Authentication system
- Services layer (email, scheduling)
- API endpoints
- Deployment details

### 3️⃣ Visual Understanding
**File:** `PROJECT_ARCHITECTURE_DIAGRAMS.md`  
**Read Time:** 20-30 minutes  
**What:** ASCII diagrams showing system architecture, data flows, workflows  
**Includes:**
- System architecture diagram
- Authentication & authorization flow
- Data model relationships
- Request-response cycle
- Role-based access control matrix
- Scheduled jobs timeline
- Email notification flow
- Complete workflows (Visit → Report → Approval)
- File structure
- Technology decision tree

### 4️⃣ Quick Reference & Hands-On
**File:** `QUICK_START_GUIDE.md`  
**Read Time:** 5-10 minutes (reference as needed)  
**What:** Cheat sheets, quick code patterns, common tasks  
**Use When:**
- Setting up development environment
- Writing a new API endpoint
- Debugging an issue
- Testing with cURL/Postman
- Need quick code examples

### 5️⃣ API Documentation
**File:** `BACKEND_API_DOCUMENTATION.md`  
**What:** Complete specification of all API endpoints  
**Includes:**
- Endpoint definitions (URL, method, auth required)
- Request/response schemas
- Example payloads
- Error codes
- Pagination details

### 6️⃣ Role & Security
**File:** `ROLE_BASED_ACCESS_CONTROL.md`  
**What:** Detailed permissions matrix and security features  
**Topics:**
- What each role can/cannot do
- Endpoint-level permissions
- Field-level access control
- Security features
- Testing role separation

### 7️⃣ Domain-Specific Guides

#### Engineering Services
**File:** `BACKEND_REQUIREMENTS.md`  
**File:** `ENGINEER_APP_IMPLEMENTATION_GUIDE.md`  
**What:** Complete guide to engineering services module  
→ Read if working on: Engineering app, service assignments, maintenance scheduling

#### Authentication & Registration
**File:** `AUTH_REGISTRATION_GUIDE.md`  
**What:** User registration, login, token management flows  
→ Read if working on: Auth system, user management, role assignment

#### Leads Management
**File:** `LEADS_API.md`  
**What:** API for managing sales leads  
→ Read if working on: Lead tracking, sales pipeline

#### Machines & Equipment
**File:** `MACHINES.md`  
**What:** Equipment registry and management  
→ Read if working on: Machine management, service history

#### Reports System
**File:** `REPORT_STRUCTURE_IMPLEMENTATION.md`  
**What:** Weekly report structure and PDF generation  
→ Read if working on: Report features, PDF generation, admin review

#### Email System
**File:** `EMAIL_CONFIGURATION.md`  
**What:** Email setup and configuration  
→ Read if working on: Email notifications, template setup

#### Machine-Service Integration
**File:** `intergration.md`  
**What:** How machines link to engineering services  
→ Read if working on: Service features, machine history

---

## 🗂️ Code File Navigation

### By Purpose

#### Authentication & Security
- 📁 `/project/src/middleware/auth.js` - JWT validation, role checking
- 📁 `/project/src/routes/auth.js` - Register, login, token endpoints
- 📁 `/project/src/utils/logger.js` - Security audit logging

#### User Management
- 📁 `/project/src/models/User.js` - User data model
- 📁 `/project/src/routes/user.js` - User profile endpoints
- 📁 `/project/src/routes/admin/users.js` - Admin user management

#### Sales Operations
- 📁 `/project/src/models/Lead.js` - Sales lead model
- 📁 `/project/src/models/Visit.js` - Field visit model
- 📁 `/project/src/models/Request.js` - Quotation request model
- 📁 `/project/src/routes/leads.js` - Lead endpoints
- 📁 `/project/src/routes/visits.js` - Visit endpoints
- 📁 `/project/src/routes/quotation.js` - Quotation endpoints

#### Engineering Services
- 📁 `/project/src/models/EngineeringService.js` - Service assignment model
- 📁 `/project/src/routes/engineering-services.js` - Service endpoints
- 📁 `/project/src/controllers/engineeringServiceController.js` - Service logic

#### Equipment Management
- 📁 `/project/src/models/Machine.js` - Equipment model
- 📁 `/project/src/routes/machines.js` - Machine endpoints
- 📁 `/project/src/routes/admin/machines.js` - Admin machine management

#### Reporting
- 📁 `/project/src/models/Report.js` - Weekly report model
- 📁 `/project/src/routes/reports.js` - Report submission
- 📁 `/project/src/routes/admin/reports.js` - Admin report review

#### Notifications & Integration
- 📁 `/project/src/services/emailService.js` - Email sending
- 📁 `/project/src/services/scheduledJobs.js` - Scheduled tasks
- 📁 `/project/src/services/machineReports.js` - Machine-related reports

#### Analytics & Dashboards
- 📁 `/project/src/routes/dashboard.js` - User dashboard
- 📁 `/project/src/routes/analytics.js` - Analytics endpoints
- 📁 `/project/src/routes/admin/analytics.js` - Admin analytics
- 📁 `/project/src/controllers/adminAnalyticsController.js` - Admin analytics logic

#### System Configuration
- 📁 `/project/src/config/database.js` - MongoDB connection
- 📁 `/project/src/middleware/validation.js` - Input validation rules
- 📁 `/project/src/middleware/errorHandler.js` - Error handling
- 📁 `/project/src/middleware/rateLimiters.js` - Rate limiting rules

### By Task

**Want to:** | **Go to:** 
---|---
Add new API endpoint | `/project/src/routes/` + create new file
Add new data model | `/project/src/models/` + follow User.js pattern
Send email | `/project/src/services/emailService.js` (use sendEmail function)
Schedule a job | `/project/src/services/scheduledJobs.js` (add cron rule)
Validate input | `/project/src/middleware/validation.js` (add validator)
Check user role | `/project/src/middleware/auth.js` (use authorize middleware)
Log an event | Import logger from `/project/src/utils/logger.js`
Upload file | Use Cloudinary utils or `/project/uploads/` directory
Query database | See `/project/src/models/*.js` for Mongoose syntax
Implement analytics | Reference `/project/src/controllers/adminAnalyticsController.js`

---

## 🔍 Feature-by-Feature Guide

### Feature: User Registration
**Docs:** `AUTH_REGISTRATION_GUIDE.md`, `QUICK_START_GUIDE.md`  
**Code:** `/project/src/routes/auth.js` (POST /api/auth/register)  
**Flow:**
1. Client POSTs email, password, name, role
2. Validation checks required fields
3. Hash password with bcryptjs
4. Create User in MongoDB
5. Generate JWT tokens
6. Send welcome email
7. Return tokens to client

### Feature: Submit Weekly Report
**Docs:** `REPORT_STRUCTURE_IMPLEMENTATION.md`  
**Code:** `/project/src/routes/reports.js` (POST /api/reports)  
**Flow:**
1. Sales rep fills form with sections
2. Client POSTs to /api/reports
3. Validation ensures all sections filled (if not draft)
4. Save to MongoDB
5. Generate PDF async
6. Send notification email to admin
7. Return success

### Feature: Approve Report
**Docs:** `BACKEND_API_DOCUMENTATION.md`  
**Code:** `/project/src/routes/admin/reports.js` (PUT /api/admin/reports/:id)  
**Flow:**
1. Admin clicks approve/reject
2. POSTs status + notes
3. Update Report document
4. Send email to sales rep
5. Emit Socket.IO event (real-time update)
6. Return success

### Feature: Engineering Service Assignment
**Docs:** `BACKEND_REQUIREMENTS.md`, `ROLE_BASED_ACCESS_CONTROL.md`  
**Code:** `/project/src/routes/engineering-services.js`  
**Flow:**
1. Admin creates or assigns service
2. POST/PUT to /api/engineering-services
3. Validate required fields
4. Set engineer as assignee
5. Set status to "assigned"
6. Emit Socket.IO event to engineer (real-time notification)
7. Engineer gets assignment notification

### Feature: Complete Service
**Docs:** `ENGINEER_APP_IMPLEMENTATION_GUIDE.md`  
**Code:** `/project/src/routes/engineering-services.js` (Engineer-only update)  
**Flow:**
1. Engineer updates service: status → "completed"
2. Records: condition after, notes, next service date
3. PUT to /api/engineering-services/:id
4. Auth checks: Engineer is assigned to this service
5. Update only allowed fields
6. Save to MongoDB
7. Emit Socket.IO: Admin sees live update

### Feature: Admin Analytics
**Docs:** `BACKEND_IMPLEMENTATION_STATUS.md`  
**Code:** `/project/src/routes/admin/analytics.js`, `/project/src/controllers/adminAnalyticsController.js`  
**Flow:**
1. Admin requests analytics
2. GET /api/admin/analytics
3. Aggregate data from multiple collections
4. Calculate metrics: visits, quotations, revenue, conversions
5. Return formatted data
6. Frontend renders charts/dashboards

---

## 📋 Common Tasks & Where to Find Help

### Task: I need to understand how authentication works
**Start:** `AUTH_REGISTRATION_GUIDE.md` (overview)  
**Then:** `PROJECT_ARCHITECTURE_DIAGRAMS.md` (see Auth Flow section)  
**Code:** `/project/src/middleware/auth.js`  
**Quick:** `QUICK_START_GUIDE.md` (Authentication Pattern section)

### Task: I want to add a new field to a model
**Start:** Pick a model in `/project/src/models/`  
**See:** How other fields are defined  
**Update:** Add new field with proper type  
**Database:** Add migration if production data needs updating

### Task: I need to fix an error
**Start:** Check `/project/logs/error.log`  
**Read:** Error message and stack trace  
**Code:** Go to file and line mentioned in stack trace  
**Debug:** Use `logger.info()` to add debug logging

### Task: I want to add email notification
**Start:** `EMAIL_CONFIGURATION.md`  
**Code:** `/project/src/services/emailService.js`  
**Pattern:** `await sendEmail({ to, subject, template, data })`  
**Place:** Call from route handler or service

### Task: I want to create a new API endpoint
**Start:** `QUICK_START_GUIDE.md` (Common Code Patterns)  
**Code:** Create in `/project/src/routes/<feature>.js`  
**Register:** Add route in `/project/src/server.js`  
**Test:** Use cURL or Postman (see QUICK_START_GUIDE)

### Task: I need to understand data relationships
**Start:** `PROJECT_ARCHITECTURE_DIAGRAMS.md` (Data Model Relationships)  
**Reference:** `PROJECT_COMPREHENSIVE_ANALYSIS.md` (Models section)  
**Diagram:** See the entity relationship visual in diagrams file

### Task: I want to check who can do what
**Go To:** `ROLE_BASED_ACCESS_CONTROL.md`  
**See:** Access control matrix by role  
**Code:** `/project/src/middleware/auth.js` (authorize middleware)

---

## 🚀 By Development Stage

### Getting Started (Day 1)
1. Read: `UNDERSTANDING_SUMMARY.md`
2. Read: `PROJECT_ARCHITECTURE_DIAGRAMS.md`
3. Run: `npm install && npm run dev`
4. Test: `curl http://localhost:5000/health`

### Learning (Days 2-3)
1. Read: `PROJECT_COMPREHENSIVE_ANALYSIS.md`
2. Trace: User registration flow (code + docs)
3. Trace: Weekly report workflow
4. Read: `ROLE_BASED_ACCESS_CONTROL.md`

### Developing (Week 1+)
1. Use: `QUICK_START_GUIDE.md` as reference
2. Use: Domain-specific guides (reports, engineering, etc.)
3. Code: Add new endpoints following patterns
4. Test: Create test cases for new features
5. Document: Update API docs, add comments

### Production (Ongoing)
1. Monitor: `/project/logs/error.log`
2. Review: `PROJECT_COMPREHENSIVE_ANALYSIS.md` (deployment section)
3. Maintain: Keep dependencies updated
4. Scale: Reference architecture for multi-server setup

---

## 📱 By Role

### Backend Developer
**Essential Reads:**
- PROJECT_COMPREHENSIVE_ANALYSIS.md
- QUICK_START_GUIDE.md
- BACKEND_API_DOCUMENTATION.md

**Key Folders:**
- `/project/src/routes/`
- `/project/src/models/`
- `/project/src/services/`

### DevOps/Operations
**Essential Reads:**
- PROJECT_COMPREHENSIVE_ANALYSIS.md (Deployment section)
- EMAIL_CONFIGURATION.md (setup)
- logs/ (monitoring)

**Key Concerns:**
- MongoDB connection
- Environment variables
- Scheduled jobs
- Log rotation
- Error monitoring

### QA/Tester
**Essential Reads:**
- BACKEND_API_DOCUMENTATION.md (endpoints)
- ROLE_BASED_ACCESS_CONTROL.md (permissions)
- AUTH_REGISTRATION_GUIDE.md (auth flows)

**Test Coverage:**
- API endpoints (happy path + errors)
- Role permissions (who can do what)
- Data validation (bad inputs)
- Email notifications
- File uploads

### Frontend Developer
**Essential Reads:**
- BACKEND_API_DOCUMENTATION.md (all endpoints)
- AUTH_REGISTRATION_GUIDE.md (authentication)
- QUICK_START_GUIDE.md (API testing)

**Reference:**
- All route files for endpoint specs
- Admin docs for admin panel endpoints
- Error responses (see quick reference)

---

## 🎯 File Search Index

| I Want To Find | Search For |
|---|---|
| How to register user | `/auth.js` or `POST /api/auth/register` |
| Weekly report submission | `/reports.js` or `POST /api/reports` |
| Engineering service assignment | `/engineering-services.js` or `PUT /assign` |
| Lead management | `/leads.js` or `Lead.js` model |
| Admin dashboard data | `/admin/analytics.js` |
| Email template | `emailService.js` |
| Scheduled jobs | `scheduledJobs.js` |
| Database connection | `config/database.js` |
| Authentication logic | `middleware/auth.js` |
| Validation rules | `middleware/validation.js` |
| Error handling | `middleware/errorHandler.js` |
| Rate limiting | `middleware/rateLimiters.js` |
| File upload | `utils/cloudinary.js` |
| Logging | `utils/logger.js` |

---

## 🔑 Quick Search by Keyword

**Database Models:** `/project/src/models/`
- User, Lead, Visit, Machine, EngineeringService, Report, Request, etc.

**Routes & Endpoints:** `/project/src/routes/`
- auth, user, visits, reports, quotation, leads, machines, engineering-services, admin/*, etc.

**Business Logic:** `/project/src/controllers/`
- engineeringServiceController, adminAnalyticsController, etc.

**Email & Scheduling:** `/project/src/services/`
- emailService.js, scheduledJobs.js

**Security:** `/project/src/middleware/`
- auth.js, validation.js, errorHandler.js, rateLimiters.js

**Configuration:** `/project/src/config/`
- database.js

**Utilities:** `/project/src/utils/`
- logger.js, cloudinary.js

---

## ✅ Checklist for New Developers

- [ ] Read UNDERSTANDING_SUMMARY.md
- [ ] Read PROJECT_ARCHITECTURE_DIAGRAMS.md
- [ ] Run `npm install`
- [ ] Create `.env` file with required variables
- [ ] Run `npm run dev`
- [ ] Test with `curl http://localhost:5000/api/auth/login` (expect error, that's fine)
- [ ] Read PROJECT_COMPREHENSIVE_ANALYSIS.md
- [ ] Trace a simple feature (user registration)
- [ ] Read QUICK_START_GUIDE.md
- [ ] Try to create a simple test endpoint
- [ ] Read domain-specific guides relevant to your work
- [ ] Bookmark this index page for reference

---

## 🆘 Help! I'm Lost

**If you don't know where something is:**
1. What feature? (e.g., "reports", "engineering services")
2. What action? (e.g., "create", "approve", "view")
3. What role? (e.g., "admin", "engineer", "sales")

**Example:** "I need to understand how admin approves a report"
→ Search: `ROLE_BASED_ACCESS_CONTROL.md` + `REPORT_STRUCTURE_IMPLEMENTATION.md` + `/routes/admin/reports.js`

---

## 📞 Key Files Quick Access

| Document | Purpose | Length |
|----------|---------|--------|
| UNDERSTANDING_SUMMARY.md | Executive overview | 10 min |
| PROJECT_COMPREHENSIVE_ANALYSIS.md | Deep technical dive | 45 min |
| PROJECT_ARCHITECTURE_DIAGRAMS.md | Visual guide | 20 min |
| QUICK_START_GUIDE.md | Quick reference | 5 min |
| BACKEND_API_DOCUMENTATION.md | API specs | 30 min |
| ROLE_BASED_ACCESS_CONTROL.md | Permissions | 15 min |
| AUTH_REGISTRATION_GUIDE.md | Auth system | 20 min |
| ENGINEER_APP_IMPLEMENTATION_GUIDE.md | Engineer features | 25 min |
| EMAIL_CONFIGURATION.md | Email setup | 10 min |
| BACKEND_REQUIREMENTS.md | Engineering services | 30 min |

---

**Total Time to Understand Project:** 3-4 hours (reading) + 2-3 days (hands-on coding)

**Ready to dive in?** Start with `UNDERSTANDING_SUMMARY.md` →

---

*Last Updated: December 11, 2025*
