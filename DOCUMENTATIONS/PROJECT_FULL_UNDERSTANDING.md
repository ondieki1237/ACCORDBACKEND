# ACCORD Backend - Complete Project Understanding

**Date:** February 3, 2026  
**Status:** ✅ Fully Implemented & Deployed to `app.codewithseth.co.ke`  
**Type:** Medical Equipment Sales & Field Service Management System

---

## 📌 Executive Summary

ACCORD Backend is a **comprehensive Node.js/Express REST API** powering a complete field sales and engineering services management system. It handles:

- **Sales Representatives**: Visit tracking, lead management, quotations, weekly reports
- **Engineering Teams**: Service assignments, maintenance records, machine tracking
- **Administrators**: User management, analytics, approvals, system configuration
- **Mobile Apps**: Field-friendly endpoints for iOS/Android apps

**Current Deployment:** Fully operational at `https://app.codewithseth.co.ke`

---

## 🏗️ Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Node.js | ES Modules |
| **Framework** | Express.js | 4.18.2 |
| **Database** | MongoDB | Mongoose 8.0.3 |
| **Authentication** | JWT | Access + Refresh tokens |
| **Real-time** | Socket.IO | 4.7.4 |
| **File Storage** | Cloudinary | Cloud + Local uploads/ |
| **Email** | Nodemailer | 6.9.7 |
| **PDF Generation** | PDFKit | 0.17.2 |
| **Scheduling** | node-cron | 3.0.3 |
| **Logging** | Winston | 3.11.0 |
| **Excel** | XLSX | 0.18.5 |
| **Security** | Helmet, CORS, Rate Limit | Built-in |

---

## 📊 Project Scale

| Metric | Count |
|--------|-------|
| **Data Models** | 27 |
| **API Routes** | 80+ endpoints |
| **Controllers** | 20 |
| **Route Files** | 40+ files |
| **Database Collections** | 27 (one per model) |
| **Middleware Layers** | 5 core |
| **Services** | 7 (email, scheduling, PDF, etc.) |
| **Lines of Code** | 15,000+ |
| **Documentation Files** | 25+ |

---

## 🗂️ Directory Structure

```
/home/seth/Documents/deployed/ACCORDBACKEND/
│
├── project/                              ← MAIN APPLICATION
│   ├── src/
│   │   ├── server.js                     ← Entry point (319 lines)
│   │   ├── config/
│   │   │   └── database.js              ← MongoDB connection
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js                  ← JWT + role authorization
│   │   │   ├── errorHandler.js          ← Centralized error handling
│   │   │   ├── rateLimiters.js          ← Rate limiting
│   │   │   ├── validation.js            ← Input validation
│   │   │   ├── upload.js                ← File upload handling
│   │   │   └── autoRefresh.js           ← Token refresh
│   │   │
│   │   ├── models/                      ← Database schemas (27 files)
│   │   │   ├── User.js                  ← Users (admin, manager, sales, engineer)
│   │   │   ├── Lead.js                  ← Sales opportunities
│   │   │   ├── Visit.js                 ← Field visits
│   │   │   ├── Machine.js               ← Equipment registry
│   │   │   ├── EngineeringService.js    ← Service tasks
│   │   │   ├── Report.js                ← Weekly activity reports
│   │   │   ├── Request.js               ← Quotation requests
│   │   │   ├── Order.js                 ← Orders/sales
│   │   │   ├── Quotation.js             ← Equipment quotes
│   │   │   ├── EngineeringRequest.js    ← Service requests
│   │   │   ├── Facility.js              ← Facility data
│   │   │   ├── Consumable.js            ← Consumables tracking
│   │   │   ├── CallLog.js               ← Call records
│   │   │   ├── Planner.js               ← Planner/schedule
│   │   │   ├── Location.js              ← Location tracking
│   │   │   ├── Communication.js         ← Communications
│   │   │   ├── FollowUp.js              ← Follow-up actions
│   │   │   ├── FollowUpVisit.js         ← Follow-up visits
│   │   │   ├── MachineDocument.js       ← Machine docs
│   │   │   ├── DocumentCategory.js      ← Document categories
│   │   │   ├── Manufacturer.js          ← Equipment manufacturers
│   │   │   ├── EngineeringPricing.js    ← Service pricing
│   │   │   ├── Product.js               ← Products catalog
│   │   │   ├── Sale.js                  ← Sales records
│   │   │   ├── Trail.js                 ← User activity trails
│   │   │   ├── AppUpdate.js             ← Mobile app versions
│   │   │   └── AdminAction.js           ← Admin audit logs
│   │   │
│   │   ├── routes/                      ← API endpoints (40+ files)
│   │   │   ├── auth.js                  ← Authentication (register, login, logout)
│   │   │   ├── user.js                  ← User profile/settings
│   │   │   ├── visits.js                ← Visit management
│   │   │   ├── reports.js               ← Report submission
│   │   │   ├── quotation.js             ← Quotation requests
│   │   │   ├── leads.js                 ← Lead management
│   │   │   ├── machines.js              ← Machine registry
│   │   │   ├── engineeringServices.js   ← Service assignments
│   │   │   ├── engineeringRequests.js   ← Service requests
│   │   │   ├── facilities.js            ← Facility data
│   │   │   ├── consumables.js           ← Consumables tracking
│   │   │   ├── dashboard.js             ← Dashboard data
│   │   │   ├── analytics.js             ← Analytics endpoints
│   │   │   ├── callLogs.js              ← Call logging
│   │   │   ├── communications.js        ← Communications
│   │   │   ├── planner.js               ← Planner endpoints
│   │   │   ├── location.js              ← Location tracking
│   │   │   ├── orders.js                ← Order management
│   │   │   ├── ordersCheckout.js        ← Checkout/payment
│   │   │   ├── appUpdates.js            ← Mobile app updates
│   │   │   ├── debug.js                 ← Debug endpoints
│   │   │   ├── admin/                   ← Admin-only routes
│   │   │   │   ├── users.js             ← User management
│   │   │   │   ├── analytics.js         ├── Analytics
│   │   │   │   ├── reports.js           ├── Report approval
│   │   │   │   ├── quotations.js        ├── Quotation response
│   │   │   │   ├── visits.js            ├── Visit management
│   │   │   │   ├── machines.js          ├── Machine management
│   │   │   │   ├── leads.js             ├── Lead management
│   │   │   │   ├── consumables.js       ├── Consumable management
│   │   │   │   ├── engineeringRequests.js
│   │   │   │   ├── callLogs.js
│   │   │   │   ├── location.js
│   │   │   │   ├── planners.js
│   │   │   │   └── map.js
│   │   │   └── salesDocuments.js, etc.
│   │   │
│   │   ├── controllers/                 ← Business logic (20 files)
│   │   │   ├── analyticsController.js
│   │   │   ├── appUpdateController.js
│   │   │   ├── callLogController.js
│   │   │   ├── communicationsController.js
│   │   │   ├── consumableController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── documentCategoryController.js
│   │   │   ├── engineeringPricingController.js
│   │   │   ├── engineeringRequestController.js
│   │   │   ├── engineeringServiceController.js
│   │   │   ├── facilitiesController.js
│   │   │   ├── locationController.js
│   │   │   ├── machineDocumentController.js
│   │   │   ├── manufacturerController.js
│   │   │   ├── ordersCheckoutController.js
│   │   │   ├── plannerController.js
│   │   │   ├── userController.js
│   │   │   ├── adminAnalyticsController.js
│   │   │   ├── adminUsersController.js
│   │   │   └── adminVisitsController.js
│   │   │
│   │   ├── services/                    ← Business services
│   │   │   ├── emailService.js          ← Email sending (Nodemailer)
│   │   │   ├── emailServiceCheckout.js  ├── Order emails
│   │   │   ├── scheduledJobs.js         ├── Cron jobs
│   │   │   ├── machineReports.js        ├── Machine reports
│   │   │   ├── pdfCatalogService.js     ├── PDF generation
│   │   │   ├── plannerPdfService.js     ├── Planner PDFs
│   │   │   └── mpesaService.js          └── Payment processing
│   │   │
│   │   ├── utils/
│   │   │   ├── logger.js                ← Winston logging
│   │   │   └── cloudinary.js            ← Cloudinary integration
│   │   │
│   │   ├── scripts/
│   │   │   ├── seedData.js
│   │   │   └── create-admins.js
│   │   │
│   │   └── .env                         ← Environment configuration
│   │
│   ├── uploads/                         ← Local file storage
│   ├── logs/                            ← Application logs
│   ├── package.json                     ← Dependencies
│   └── .env.example                     ← Configuration template
│
├── DOCUMENTATIONS/                      ← 25+ documentation files
│   ├── 00_START_HERE.md                 ← Documentation index
│   ├── YOUR_PROJECT_MASTERY.md          ← Learning path
│   ├── UNDERSTANDING_SUMMARY.md         ← Project overview
│   ├── PROJECT_COMPREHENSIVE_ANALYSIS.md ← Deep dive
│   ├── PROJECT_ARCHITECTURE_DIAGRAMS.md ← Visual diagrams
│   ├── QUICK_START_GUIDE.md             ← Quick reference
│   ├── BACKEND_API_DOCUMENTATION.md     ← All endpoints
│   ├── BACKEND_IMPLEMENTATION_STATUS.md ← Build status
│   └── ... 17 more files
│
├── DARAJA_STK_DEBUG_POSTMAN.json        ← Payment testing
├── package.json                         ← Root package
├── service-account.json                 ← Service account creds
└── deploy-to-production.sh              ← Deployment script

```

---

## 🔐 Authentication & Authorization System

### JWT Flow
```
1. User registers/logs in
   ↓
2. Server creates:
   - Access Token (15 min expiry)
   - Refresh Token (30 day expiry)
   ↓
3. Client stores tokens and includes in Authorization header
   ↓
4. Middleware (authenticate) verifies JWT
   ↓
5. User details loaded from DB
   ↓
6. Role checked (authorize middleware)
   ↓
7. Request proceeds if authorized
```

### Roles & Permissions
- **Admin**: Full system access, user management, approvals, analytics
- **Manager**: Team oversight, report approval, lead management
- **Sales**: Visit tracking, quotation requests, report submission
- **Engineer**: Service assignment management, maintenance tracking

---

## 📊 Core Data Models

### 1. **User** - Central actor in system
- Stores: credentials, profile, role, department, targets, tokens
- Relationships: Referenced by almost every model

### 2. **Lead** - Sales opportunity
- Stores: facility info, equipment needed, budget, timeline, status
- Status flow: new → contacted → qualified → proposal-sent → negotiation → won/lost

### 3. **Visit** - Sales activity record
- Stores: date, facility, contacts met, equipment discussed, follow-ups
- Tracks what sales reps did in field

### 4. **Machine** - Equipment registry
- Stores: equipment details, facility location, serial #, service history
- Indexed for fast lookups

### 5. **EngineeringService** - Service/maintenance task
- Stores: service type, engineer assigned, before/after conditions, status
- Tracks: installations, repairs, maintenance

### 6. **Report** - Weekly activity summary
- Stores: narrative sections, submission status, approval status
- Can be drafted and submitted in sections

### 7. **Request/Quotation** - Equipment quote request
- Stores: hospital, equipment needed, urgency, admin response
- Used by sales to request quotes from admin

### 8. **Order** - Sales/purchase order
- Stores: items, pricing, status, customer info
- Integrated with checkout/payment

### 9-27. **Other Models**
- `FollowUp`, `FollowUpVisit` - Follow-up tracking
- `Facility` - Healthcare facility data
- `Consumable` - Inventory items
- `Planner` - Schedule/planning
- `Communication` - Message/communication logs
- `Location` - GPS location tracking
- `CallLog` - Phone call records
- `MachineDocument` - Equipment documentation
- `DocumentCategory` - Document organization
- `Manufacturer` - Equipment manufacturer info
- `EngineeringPricing` - Service pricing
- `Product` - Product catalog
- `Sale` - Sales transaction records
- `Trail` - User activity audit trail
- `AppUpdate` - Mobile app version management
- `AdminAction` - Admin action logging

---

## 🛣️ API Routes Organization

### Public Routes (No Auth Required)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/app-updates/check` - Check app update availability

### Protected Routes (Auth Required)

**User/Profile:**
- `GET/PUT /api/user/profile` - User profile
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

**Sales Features:**
- `GET/POST /api/visits` - Visit management
- `POST /api/reports` - Submit report
- `GET /api/reports/my` - Get my reports
- `POST /api/quotation` - Request quotation
- `GET /api/quotation/my` - Get my quotations
- `POST /api/leads` - Create lead
- `GET /api/leads/my` - Get my leads

**Engineering Features:**
- `GET/POST /api/engineering-services` - Service management
- `GET /api/engineering-services/my` - My assignments
- `PUT /api/engineering-services/:id/status` - Update status
- `POST /api/engineering-requests` - Request service
- `GET /api/machines` - Machine list
- `GET /api/machines/:id/history` - Service history

**Dashboard & Analytics:**
- `GET /api/dashboard` - Dashboard data
- `GET /api/analytics/*` - Various analytics endpoints

**Admin-Only Routes:**
- `GET /api/admin/users` - User management
- `PUT /api/admin/reports/:id/approve` - Approve report
- `POST /api/admin/quotations/:id/respond` - Respond to quotation
- `GET /api/admin/analytics` - Full analytics
- `POST /api/app-updates` - Manage app versions

---

## 💾 Database Schema Highlights

### Indexing Strategy
- `User`: email, employeeId
- `Visit`: userId, date, status
- `Machine`: serialNumber, status, facility
- `Report`: userId, weekStart, status
- `Lead`: facilityName (text), status, createdAt
- Text indexes on searchable fields for fast lookups

### Pagination
- Uses `mongoose-paginate-v2` plugin
- Default: 10 items per page
- Supports sort, limit, skip parameters

### Timestamps
- Most models include `createdAt`, `updatedAt`
- Auto-managed by Mongoose

---

## 🔧 Key Services

### Email Service (`emailService.js`)
- Template-based emails
- Scheduled daily/weekly notifications
- Rate limited to prevent spam
- Nodemailer SMTP integration

### Scheduled Jobs (`scheduledJobs.js`)
- Daily reminder emails (9 AM)
- Weekly summary generation (every Monday)
- Monthly cleanup jobs (1st of month)
- Uses node-cron for scheduling

### PDF Generation (`pdfCatalogService.js`, `plannerPdfService.js`)
- Creates PDF reports
- Exports to Cloudinary
- Used for report downloads

### File Uploads
- Local: `/uploads` directory
- Cloud: Cloudinary with CDN
- Supported: Images, PDFs, documents

---

## 🚀 Middleware Stack

```
Request
  ↓
Helmet (Security headers)
  ↓
CORS (Cross-origin)
  ↓
Compression (Response compression)
  ↓
Morgan (Logging)
  ↓
Express JSON Parser
  ↓
Rate Limiter
  ↓
[Optional] Authenticate (JWT check)
  ↓
[Optional] Authorize (Role check)
  ↓
[Optional] Validation (Input check)
  ↓
Route Handler
  ↓
Response
```

---

## 🔄 Request/Response Flow Example

**Example: Submit Weekly Report**

```javascript
// 1. Frontend sends
POST /api/reports
Authorization: Bearer <access_token>
{
  "sections": [
    { "title": "Summary", "content": "..." },
    { "title": "Visits", "content": "..." }
  ]
}

// 2. Middleware chain
- Morgan logs request
- Rate limiter checks (10 req/15min per IP)
- Authenticate extracts token, verifies JWT
- Validates token in User.refreshTokens[]
- Authorize checks if user.role === 'sales' or 'admin'
- Validation checks required fields

// 3. Route handler (reports.js)
- Receives POST /api/reports
- Calls controller.createReport()

// 4. Controller
- Validates sections
- Creates Report document in DB
- Generates PDF if complete
- Sends email to admin
- Emits Socket.IO event

// 5. Database
- INSERT into reports collection
- Uses indexes on userId + weekStart

// 6. Response
200 OK
{
  "success": true,
  "report": { ... }
}

// 7. Frontend
- Shows success toast
- Updates report list
```

---

## 📧 Email Notifications

### Automatic Emails Triggered By:
1. **User Registration** → Welcome email
2. **Password Reset** → Reset link
3. **Report Submitted** → Admin notification
4. **Quotation Submitted** → Admin notification
5. **Service Assignment** → Engineer notification
6. **Status Change** → User notification

### Scheduled Emails:
- **9 AM Daily** - Activity reminder for sales staff
- **5 PM Weekly** - Weekly summary to managers
- **1st of Month** - Monthly performance report

---

## 🔌 Socket.IO Real-Time Features

**Emitted Events:**
- `visitUpdate` - When visit created/updated
- `serviceAssigned` - When engineer gets task
- `reportSubmitted` - When report submitted
- `quotationRequest` - When quotation requested
- `statusChanged` - When status updates

**Use Cases:**
- Admin dashboard updates in real-time
- Engineers get instant notifications
- Managers see team activities live

---

## 🛡️ Security Features

✅ **Authentication**: JWT tokens (access + refresh)  
✅ **Authorization**: Role-based access control  
✅ **Encryption**: Passwords hashed with bcrypt (salt 10)  
✅ **API Security**: Helmet, CORS, rate limiting  
✅ **Input Validation**: express-validator + Joi  
✅ **Rate Limiting**: 10 req/15min per IP  
✅ **HTTPS**: Enforced in production  
✅ **Token Expiry**: 15min access, 30day refresh  
✅ **Error Handling**: Centralized, no stack traces exposed  
✅ **Logging**: All requests logged (non-sensitive data)  

---

## 🚀 Running the Project

### Start Development Server
```bash
cd /home/seth/Documents/deployed/ACCORDBACKEND/project
npm install
npm run dev
# Runs on http://localhost:5000
```

### Environment Variables (.env)
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CLOUDINARY_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CLIENT_URL=http://localhost:3000
ALLOWED_CLIENT_ORIGINS=...
PORT=5000
NODE_ENV=development
```

### Useful Commands
```bash
npm run dev              # Development with nodemon
npm start               # Production
npm test                # Run tests
npm run seed            # Seed database
npm run create-admins   # Create admin user
```

---

## 📈 Current Deployment Status

**✅ Production URL:** `https://app.codewithseth.co.ke`

**Last Known Configuration:**
- Database: MongoDB Atlas
- Server: Node.js with Express
- File Storage: Cloudinary
- Email: SMTP configured
- Real-time: Socket.IO active

---

## 🎯 Key Features Implemented

### Sales Module
✅ Visit recording and tracking  
✅ Lead management with pipeline  
✅ Quotation request submission  
✅ Weekly report with sections  
✅ Performance targets tracking  
✅ Daily activity reminders  

### Engineering Module
✅ Service assignment system  
✅ Task status tracking  
✅ Machine maintenance history  
✅ Service pricing  
✅ Equipment documentation  

### Admin Module
✅ User management (CRUD)  
✅ Report approval workflow  
✅ Quotation response system  
✅ Analytics dashboard  
✅ Comprehensive auditing  
✅ System configuration  

### System Features
✅ JWT authentication  
✅ Role-based access control  
✅ Real-time notifications (Socket.IO)  
✅ Email alerts & summaries  
✅ PDF report generation  
✅ Mobile app update management  
✅ Activity tracking  
✅ Comprehensive logging  

---

## 📚 Documentation Files

The `DOCUMENTATIONS/` folder contains 25+ guides:

**Quick Start:**
- `00_START_HERE.md` - Navigation guide
- `YOUR_PROJECT_MASTERY.md` - Learning path
- `QUICK_START_GUIDE.md` - Quick reference

**Architecture:**
- `PROJECT_COMPREHENSIVE_ANALYSIS.md` - Deep dive (888 lines)
- `PROJECT_ARCHITECTURE_DIAGRAMS.md` - Visual guide (1146 lines)
- `UNDERSTANDING_SUMMARY.md` - Overview (650 lines)

**API Documentation:**
- `BACKEND_API_DOCUMENTATION.md` - All endpoints
- `BACKEND_IMPLEMENTATION_STATUS.md` - Build tracking
- `QUICK_REFERENCE.md` - Code patterns

**Features:**
- `ADMIN_API_COMPLETE_SUMMARY.md`
- `ADMIN_ANALYTICS_API.md`
- `LEADS_API.md`
- `MACHINES.md`
- `REPORT_STRUCTURE_IMPLEMENTATION.md`
- ... and more

---

## 🔍 What's NOT Implemented (Known Gaps)

1. **Frontend code** - In separate repository
2. **Mobile apps** - Separate React Native projects
3. **CI/CD pipeline** - Manual deployment via `deploy-to-production.sh`
4. **Database backups** - Relies on MongoDB Atlas
5. **Unit tests** - Jest configured but not comprehensive
6. **API versioning** - Single version in `/api/*`

---

## 💡 Architectural Patterns Used

### MVC Pattern
- **Models**: Schema definitions in `/models`
- **Views**: JSON responses (consumed by frontend)
- **Controllers**: Business logic in `/controllers`
- **Routes**: HTTP handlers in `/routes`

### Middleware Pattern
- Request → Authenticate → Authorize → Validate → Process

### Service Layer Pattern
- Email, PDF, Scheduling abstracted into services
- Reusable across multiple routes

### Repository Pattern (Implicit)
- Models handle DB queries
- Controllers use models for data access

### Observable Pattern (Socket.IO)
- Server emits events
- Connected clients receive real-time updates

---

## 🎓 Learning Path

**For Complete Understanding (2-3 hours):**

1. **Start** → `UNDERSTANDING_SUMMARY.md` (10 min)
   - What is it, what does it do

2. **Architecture** → `PROJECT_ARCHITECTURE_DIAGRAMS.md` (20 min)
   - Visual overview, data flows

3. **Deep Dive** → `PROJECT_COMPREHENSIVE_ANALYSIS.md` (45 min)
   - Every model, route, service explained

4. **Reference** → `QUICK_START_GUIDE.md` (10 min)
   - Quick lookup patterns, commands

5. **API Docs** → `BACKEND_API_DOCUMENTATION.md` (as needed)
   - Specific endpoint details

6. **Code Exploration** →
   - Start with `/project/src/server.js` (entry point)
   - Then `/project/src/middleware/auth.js` (authentication)
   - Then `/project/src/routes/auth.js` (simple route)
   - Then `/project/src/models/User.js` (data structure)

---

## 🎯 Summary

You now have a complete understanding of the ACCORD Backend project:

✅ **What it is**: Field sales & engineering management system  
✅ **How it works**: Express + MongoDB + Socket.IO architecture  
✅ **What's in it**: 27 models, 80+ routes, comprehensive features  
✅ **How to run it**: npm run dev  
✅ **Where to find things**: Complete directory map above  
✅ **Current status**: Fully deployed and operational  

The system is **production-ready** and handles real business operations for sales teams, engineers, and administrators managing medical equipment services.

---

**Next Steps:**
- Explore `/project/src/server.js` to understand entry point
- Read specific route/controller files for detailed implementation
- Review documentation for specific features
- Check deployment script for production setup
