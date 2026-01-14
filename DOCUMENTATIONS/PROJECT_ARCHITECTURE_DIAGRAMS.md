# ACCORD Backend - Architecture & Flow Diagrams

## 1. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND APPLICATIONS                            │
├──────────────────────────────────────────────────────────────────────────┤
│  Sales App  │  Engineer App  │  Admin Dashboard  │  Mobile (React Native)│
└───────────────────────┬──────────────────────────────────────────────────┘
                        │
                   HTTPS/REST
                   Socket.IO
                        │
┌───────────────────────▼──────────────────────────────────────────────────┐
│                    EXPRESS.JS SERVER (server.js)                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │           MIDDLEWARE STACK (Request Processing)                 │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │ Helmet │ CORS │ Compression │ Morgan (Logging) │ Rate Limit     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │              ROUTES & CONTROLLERS                               │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                 │    │
│  │  /api/auth              → Authentication (Register/Login)      │    │
│  │  /api/users             → User Profile & Settings              │    │
│  │  /api/visits            → Visit Records CRUD                   │    │
│  │  /api/reports           → Weekly Reports Submission            │    │
│  │  /api/quotation         → Equipment Quotes                     │    │
│  │  /api/leads             → Lead Management                      │    │
│  │  /api/machines          → Equipment Registry                   │    │
│  │  /api/engineering-*     → Service Assignments                  │    │
│  │  /api/facilities        → Facility Data                        │    │
│  │  /api/consumables       → Consumable Tracking                  │    │
│  │  /api/dashboard         → User Dashboard Data                  │    │
│  │  /api/analytics         → Analytics & Stats                    │    │
│  │  /api/admin/*           → Admin-Only Operations                │    │
│  │                                                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │             AUTHENTICATION & AUTHORIZATION                      │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │  JWT Tokens (Access + Refresh) │ Role-Based Access Control     │    │
│  │  Roles: Admin, Manager, Sales, Engineer                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌──────────────────┬──────────────────┬──────────────────┐             │
│  │  SERVICES LAYER  │  EXTERNAL INTEGRATIONS │  UTILS    │             │
│  ├──────────────────┼──────────────────┼──────────────────┤             │
│  │ Email Service    │ Cloudinary       │ Logger (Winston) │             │
│  │ Scheduled Jobs   │ Nodemailer SMTP  │ Pagination      │             │
│  │ (node-cron)      │ Socket.IO Emits  │ Validation      │             │
│  └──────────────────┴──────────────────┴──────────────────┘             │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                   SOCKET.IO (Real-Time Events)                  │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │  visitUpdate → Service assigned → reportSubmitted → quotation   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└───────────────────────┬──────────────────────────────────────────────────┘
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    ▼                   ▼                   ▼
┌─────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   MONGODB       │ │   CLOUDINARY     │ │  EMAIL SERVICE   │
│                 │ │                  │ │ (Nodemailer)     │
│ • Users         │ │ Image Storage    │ │                  │
│ • Leads         │ │ PDF Upload       │ │ Templates:       │
│ • Visits        │ │ Attachments      │ │ • Welcome        │
│ • Machines      │ │                  │ │ • Reset Pass     │
│ • Services      │ │ CDN Delivery     │ │ • Daily Report   │
│ • Reports       │ │                  │ │ • Notifications  │
│ • Quotations    │ │                  │ │ • Approvals      │
│ • +13 more      │ │                  │ │                  │
│                 │ │                  │ │ Scheduled:       │
│ Indexes:        │ │                  │ │ • 9 AM Reminder  │
│ • User Email    │ │                  │ │ • 5 PM Summary   │
│ • Visit Date    │ │                  │ │ • 1st Mo. Clean  │
│ • Lead Status   │ │                  │ │                  │
│ • Machine Ref   │ │                  │ │ Rate Limited ✓   │
│                 │ │                  │ │                  │
└─────────────────┘ └──────────────────┘ └──────────────────┘
```

---

## 2. Authentication & Authorization Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                     USER AUTHENTICATION FLOW                          │
└──────────────────────────────────────────────────────────────────────┘

USER REGISTRATION (Public)
  │
  ├─→ POST /api/auth/register
  │   ├─ Validate: email, password, employeeId (required)
  │   ├─ Check: user not exists
  │   ├─ Hash password with bcrypt (salt: 10)
  │   ├─ Create User document
  │   ├─ Generate tokens:
  │   │  ├─ accessToken (JWT, 15 min, signed with JWT_SECRET)
  │   │  └─ refreshToken (JWT, 30d, signed with JWT_REFRESH_SECRET)
  │   ├─ Store refreshToken in User.refreshTokens[]
  │   ├─ Send welcome email (async)
  │   └─ Return: { user, tokens }
  │
USER LOGIN
  │
  ├─→ POST /api/auth/login
  │   ├─ Validate: email, password
  │   ├─ Find user by email
  │   ├─ Compare password with bcrypt
  │   ├─ Generate tokens
  │   ├─ Store refreshToken with TTL (30d expires)
  │   ├─ Update User.lastLogin
  │   └─ Return: { user, tokens }
  │
TOKEN REFRESH
  │
  ├─→ POST /api/auth/refresh
  │   ├─ Verify refreshToken against JWT_REFRESH_SECRET
  │   ├─ Find user
  │   ├─ Check token in User.refreshTokens[]
  │   ├─ Generate new accessToken
  │   ├─ Return: { accessToken }
  │
LOGOUT
  │
  ├─→ POST /api/auth/logout
  │   ├─ Remove refreshToken from User.refreshTokens[]
  │   └─ Return: { success: true }
  │
PROTECTED REQUEST (Any API endpoint)
  │
  ├─→ GET /api/dashboard
  │   ├─ Headers: "Authorization: Bearer <accessToken>"
  │   │
  │   ├─ Middleware: authenticate
  │   │  ├─ Extract token from header
  │   │  ├─ Verify JWT with JWT_SECRET
  │   │  ├─ Decode user ID
  │   │  ├─ Fetch User from DB
  │   │  ├─ Check User.isActive
  │   │  └─ Set req.user = user object
  │   │
  │   ├─ (Optional) Middleware: authorize('admin', 'manager')
  │   │  ├─ Check req.user.role
  │   │  ├─ If NOT in roles → 403 Forbidden
  │   │  └─ Continue if allowed
  │   │
  │   └─ Route handler executes with req.user
  │
INVALID/EXPIRED TOKEN
  │
  └─→ Responses:
      ├─ 401 Unauthorized (missing token, invalid signature, expired)
      ├─ 403 Forbidden (insufficient permissions)
      └─ Client: Refresh token or re-login
```

---

## 3. Data Model Relationships

```
┌──────────────────────────────────────────────────────────────────┐
│                    CORE DATA RELATIONSHIPS                        │
└──────────────────────────────────────────────────────────────────┘

                            ┌─────────────┐
                            │    USER     │ ◄─── Central to all
                            │             │
                            │ • admin     │
                            │ • manager   │
                            │ • sales     │
                            │ • engineer  │
                            │             │
                            │ Refresh     │
                            │ tokens (TTL)│
                            └──────┬──────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
                ▼                  ▼                  ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │   LEAD       │  │    VISIT     │  │   MACHINE    │
        │              │  │              │  │              │
        │ createdBy→U  │  │ userId→U     │  │ createdBy→U  │
        │ status       │  │ duration     │  │ facility     │
        │ facility     │  │ client(name) │  │ status       │
        │ equipment    │  │ contacts[]   │  │ lastService  │
        │ budget       │  │ equipment[]  │  │  Engineer→U  │
        │ timeline     │  │ followUp[]   │  │              │
        │              │  │              │  │              │
        │ statusHist   │  │ followUpIDs  │  │ machineId    │
        │  [changedBy] │  │  →FollowUp   │  │ relations    │
        │              │  │              │  │              │
        └──────────────┘  └──────┬───────┘  └──────────────┘
                                 │
                      ┌──────────▼─────────┐
                      │  FOLLOWUP / VISIT  │
                      │  assignedTo→U      │
                      │  dueDate           │
                      │  status            │
                      └────────────────────┘


        ┌──────────────────────────┐
        │  ENGINEERINGSERVICE      │
        │                          │
        │ engineerInCharge→U       │
        │ userId (creator)→U       │
        │ machineId→MACHINE        │
        │ facility                 │
        │ serviceType              │
        │ status                   │
        │ schedule/dates           │
        │ conditions before/after  │
        │ notes                    │
        │                          │
        └──────────────────────────┘


   ┌──────────────────────┐
   │     REPORT           │
   │  (Weekly Activity)   │
   │                      │
   │ userId→U             │
   │ weekStart/End        │
   │ sections[] :         │
   │  {id, title,content} │
   │ status:              │
   │ pending/reviewed/    │
   │ approved/rejected    │
   │ reviewedBy→U         │
   │ pdfUrl               │
   │ isDraft              │
   └──────────────────────┘


   ┌──────────────────────┐
   │    QUOTATION         │
   │   (Equipment Quote)  │
   │                      │
   │ userId→U (requester) │
   │ hospital             │
   │ equipment            │
   │ urgency              │
   │ status: pending/     │
   │  responded/completed │
   │ response:            │
   │  {message, cost,     │
   │   respondedBy→U,     │
   │   respondedAt}       │
   └──────────────────────┘
```

---

## 4. Request-Response Cycle (Example: Create Visit)

```
┌────────────────────────────────────────────────────────────────┐
│        REQUEST-RESPONSE CYCLE: Create Visit                    │
└────────────────────────────────────────────────────────────────┘

CLIENT (Frontend)
  │
  ├─→ POST /api/visits
  │   ├─ Headers:
  │   │  ├─ "Authorization: Bearer <accessToken>"
  │   │  ├─ "Content-Type: application/json"
  │   │
  │   ├─ Body:
  │   │  {
  │   │    "date": "2025-12-11",
  │   │    "client": {
  │   │      "type": "hospital",
  │   │      "name": "City Hospital",
  │   │      "location": "Nairobi"
  │   │    },
  │   │    "visitPurpose": "demo",
  │   │    "contacts": [
  │   │      { "role": "doctor", "name": "Dr. Smith", "phone": "..." }
  │   │    ],
  │   │    "notes": "Good reception..."
  │   │  }
  │
EXPRESS SERVER
  │
  ├─→ Middleware Chain:
  │   ├─ helmet() - Add security headers
  │   ├─ compression() - Compress response
  │   ├─ express.json() - Parse JSON body
  │   ├─ cors() - Check CORS
  │   ├─ morgan() - Log request
  │   ├─ generalRateLimiter - Check rate limit
  │   │
  │   ├─ authenticate middleware
  │   │  ├─ Extract "Bearer <token>" from headers
  │   │  ├─ jwt.verify(token, JWT_SECRET)
  │   │  ├─ User.findById(decoded.id)
  │   │  └─ req.user = user object
  │   │
  │   ├─ validateVisit middleware
  │   │  ├─ Check required fields
  │   │  ├─ Validate email format (if present)
  │   │  ├─ Validate dates
  │   │  └─ Return 400 if invalid
  │
  ├─→ Route Handler: POST /api/visits (in routes/visits.js)
  │   │
  │   ├─ Create Visit document:
  │   │  {
  │   │    userId: req.user._id,
  │   │    date: req.body.date,
  │   │    client: req.body.client,
  │   │    visitPurpose: req.body.visitPurpose,
  │   │    contacts: req.body.contacts,
  │   │    notes: req.body.notes,
  │   │    status: 'completed',
  │   │    createdAt: Date.now(),
  │   │    updatedAt: Date.now()
  │   │  }
  │   │
  │   ├─ Validation:
  │   │  ├─ Check visitPurpose is valid enum
  │   │  ├─ Check client.type is valid enum
  │   │  └─ Check all required fields present
  │   │
  │   ├─ Save to MongoDB
  │   │  └─ await visit.save()
  │   │
  │   ├─ Populate relations (if any)
  │   │  └─ await visit.populate('userId', 'firstName lastName')
  │   │
  │   ├─ Emit Socket.IO event
  │   │  └─ io.emit('visitUpdate', { visitData })
  │   │
  │   └─ Log action
  │      └─ logger.info('Visit created by user ' + req.user._id)
  │
ERROR HANDLING (if error occurs)
  │
  ├─→ Centralized errorHandler middleware catches error
  │   ├─ If Mongoose validation error:
  │   │  └─ Map field errors to HTTP 400
  │   ├─ If JWT error:
  │   │  └─ Return HTTP 401
  │   ├─ If Unexpected error:
  │   │  └─ Log to error.log, return HTTP 500
  │   └─ Send error response to client

SUCCESS RESPONSE (HTTP 201 Created)
  │
  ├─ {
  │    "success": true,
  │    "message": "Visit created successfully",
  │    "data": {
  │      "_id": "63a7f8e2c1d2b3a4e5f6g7h8",
  │      "userId": {
  │        "_id": "12a3b4c5d6e7f8g9h0",
  │        "firstName": "John",
  │        "lastName": "Doe"
  │      },
  │      "date": "2025-12-11T00:00:00.000Z",
  │      "client": {
  │        "type": "hospital",
  │        "name": "City Hospital",
  │        "location": "Nairobi"
  │      },
  │      "visitPurpose": "demo",
  │      "contacts": [...],
  │      "notes": "Good reception...",
  │      "status": "completed",
  │      "createdAt": "2025-12-11T14:32:10.123Z",
  │      "updatedAt": "2025-12-11T14:32:10.123Z"
  │    }
  │  }
  │
CLIENT RECEIVES
  │
  └─→ Frontend updates state, shows success message, refreshes list
```

---

## 5. Role-Based Access Control Matrix

```
┌────────────────────────────────────────────────────────────────────┐
│              ROLE-BASED ACCESS CONTROL (RBAC)                      │
└────────────────────────────────────────────────────────────────────┘

RESOURCE          │  ADMIN  │ MANAGER │  SALES  │ ENGINEER
──────────────────┼─────────┼─────────┼─────────┼──────────
USERS             │         │         │         │
├─ View All       │    ✅   │    ✅   │    ❌   │    ❌
├─ View Own       │    ✅   │    ✅   │    ✅   │    ✅
├─ Create         │    ✅   │    ❌   │    ❌   │    ❌
├─ Update Any     │    ✅   │    ❌   │    ❌   │    ❌
├─ Delete         │    ✅   │    ❌   │    ❌   │    ❌
├─ Manage Roles   │    ✅   │    ❌   │    ❌   │    ❌
──────────────────┼─────────┼─────────┼─────────┼──────────
LEADS             │         │         │         │
├─ View All       │    ✅   │    ✅   │    ❌   │    ❌
├─ Create         │    ✅   │    ✅   │    ✅   │    ❌
├─ Update Any     │    ✅   │    ✅   │   Own   │    ❌
├─ Delete Any     │    ✅   │    ❌   │    ❌   │    ❌
├─ Change Status  │    ✅   │    ✅   │   Own   │    ❌
──────────────────┼─────────┼─────────┼─────────┼──────────
VISITS            │         │         │         │
├─ View All       │    ✅   │    ✅   │    ❌   │    ❌
├─ View Own       │    ✅   │    ✅   │    ✅   │    ✅
├─ Create         │    ✅   │    ✅   │    ✅   │    ❌
├─ Update Own     │    ✅   │    ✅   │    ✅   │    ✅
├─ Update Any     │    ✅   │    ✅   │    ❌   │    ❌
├─ Delete         │    ✅   │    ❌   │    ❌   │    ❌
──────────────────┼─────────┼─────────┼─────────┼──────────
REPORTS           │         │         │         │
├─ View All       │    ✅   │    ✅   │    ❌   │    ❌
├─ View Own       │    ✅   │    ✅   │    ✅   │    ❌
├─ Create/Submit  │    ✅   │    ✅   │    ✅   │    ❌
├─ Approve/Reject │    ✅   │    ❌   │    ❌   │    ❌
├─ Add Notes      │    ✅   │    ❌   │    ❌   │    ❌
──────────────────┼─────────┼─────────┼─────────┼──────────
ENG. SERVICES     │         │         │         │
├─ View All       │    ✅   │    ✅   │    ❌   │    ❌
├─ View Own       │    ✅   │    ✅   │   Own   │    Own
├─ Create         │    ✅   │    ✅   │   Req*  │    ❌
├─ Assign         │    ✅   │    ✅   │    ❌   │    ❌
├─ Update Any     │    ✅   │    ✅   │    ❌   │    ❌
├─ Update Own     │    ✅   │    ✅   │    ❌   │    ✅**
├─ Delete         │    ✅   │    ❌   │    ❌   │    ❌
├─ Complete       │    ✅   │    ✅   │    ❌   │    ✅
──────────────────┼─────────┼─────────┼─────────┼──────────
QUOTATIONS        │         │         │         │
├─ View All       │    ✅   │    ✅   │    ❌   │    ❌
├─ View Own       │    ✅   │    ✅   │    ✅   │    ❌
├─ Create Request │    ✅   │    ❌   │    ✅   │    ❌
├─ Respond        │    ✅   │    ✅   │    ❌   │    ❌
├─ Update Status  │    ✅   │    ❌   │    ❌   │    ❌
──────────────────┼─────────┼─────────┼─────────┼──────────
MACHINES          │         │         │         │
├─ View All       │    ✅   │    ✅   │    ✅   │    ✅
├─ Create         │    ✅   │    ✅   │    ❌   │    ❌
├─ Update         │    ✅   │    ✅   │    ❌   │    ❌
├─ Delete         │    ✅   │    ❌   │    ❌   │    ❌
├─ Bulk Import    │    ✅   │    ❌   │    ❌   │    ❌
──────────────────┼─────────┼─────────┼─────────┼──────────
ADMIN FEATURES    │         │         │         │
├─ Analytics      │    ✅   │    ✅   │    ❌   │    ❌
├─ Bulk Ops       │    ✅   │    ❌   │    ❌   │    ❌
├─ Seed Data      │    ✅   │    ❌   │    ❌   │    ❌
├─ Reports Admin  │    ✅   │    ❌   │    ❌   │    ❌
└─ Logs/Settings  │    ✅   │    ❌   │    ❌   │    ❌

* Req = Sales can request service but not create/assign
** Engineer can only update status, conditions, notes (limited fields)
```

---

## 6. Scheduled Jobs Timeline

```
┌────────────────────────────────────────────────────────────────────┐
│              DAILY/WEEKLY SCHEDULED JOBS (node-cron)              │
└────────────────────────────────────────────────────────────────────┘

TIME              FREQUENCY        JOB                    ACTION
───────────────────────────────────────────────────────────────────────

09:00 AM          Daily            Daily Report           Send email to all
                  Mon-Sun          Reminder               sales reps asking
                                                          to submit daily report

09:00 AM          Daily            Follow-up              Check all overdue
                  Mon-Sun          Reminders              follow-ups and
                                                          notify assignees

05:00 PM          Weekly           Weekly Summary         Aggregate stats:
                  Friday           Generation             • Total visits
                                                          • Quotations sent
                                                          • Sales made
                                                          Send to managers

02:00 AM          Monthly          Database Cleanup       • Delete expired
                  1st of month                            refresh tokens
                                                          • Archive old logs
                                                          • Compress data

                  On-Demand        Seed Data              • Import test leads
                  (Manual)         (Development only)     • Create sample users

───────────────────────────────────────────────────────────────────────

IMPORTANT: These jobs run on ALL server instances. If you have multiple
servers, implement distributed locking to avoid duplicate execution.

Future: Use Bull queue or use BullMQ for distributed job scheduling.
```

---

## 7. Email Notification Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                    EMAIL NOTIFICATION FLOW                          │
└────────────────────────────────────────────────────────────────────┘

TRIGGER              TEMPLATE              RECIPIENT          TIMING
────────────────────────────────────────────────────────────────────

User Registration    welcome               User Email         Immediate
  └─→ New user created
       └─→ sendEmail({ template: 'welcome' })
            └─→ Nodemailer SMTP
                 └─→ Inbox

Password Reset       resetPassword         User Email         Immediate
  └─→ User requests reset
       └─→ Generate reset token (10 min expiry)
            └─→ sendEmail({ template: 'resetPassword' })
                 └─→ Inbox with reset link

Daily Report Due     dailyReport           Sales Rep          09:00 AM
  └─→ node-cron trigger
       └─→ Find all sales users
            └─→ sendEmail({ template: 'dailyReport' })
                 └─→ Inbox reminder

Report Submitted     reportNotification    Admin/Manager      Immediate
  └─→ Sales rep submits weekly report
       └─→ POST /api/reports
            └─→ sendEmail to admin
                 └─→ Inbox: "New report from John Doe"

Report Approved      reportApproval        Sales Rep          Immediate
  └─→ Admin approves report
       └─→ PUT /api/admin/reports/:id
            └─→ sendEmail({ status: 'approved' })
                 └─→ Inbox confirmation

Report Rejected      reportRejection       Sales Rep          Immediate
  └─→ Admin rejects report
       └─→ PUT /api/admin/reports/:id
            └─→ sendEmail({ status: 'rejected', notes: '...' })
                 └─→ Inbox with rejection reason

Quotation Request    quotationNew          Admin/Manager      Immediate
  └─→ Sales creates quotation request
       └─→ POST /api/quotation
            └─→ sendEmail to admin
                 └─→ Inbox: "New quote request"

Quotation Response   quotationResponse     Sales Rep          Immediate
  └─→ Admin responds to quote
       └─→ POST /api/quotation/respond/:id
            └─→ sendEmail to sales rep
                 └─→ Inbox: "Your quote has been answered"

Service Assigned     serviceAssignment     Engineer           Immediate (Socket.IO)
  └─→ Manager assigns service
       └─→ PUT /api/engineering-services/:id/assign
            └─→ Socket.IO event emitted
                 └─→ Engineer app notification (Optional: also email)

Consumable Low       consumableAlert       Procurement        On Schedule
  └─→ Inventory < threshold
       └─→ Trigger alert
            └─→ sendEmail to procurement team
                 └─→ Inbox: "Consumable X running low"

────────────────────────────────────────────────────────────────────

SMTP Configuration (from .env):
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=465
  EMAIL_USER=your_email@gmail.com
  EMAIL_PASS=your_app_password  ← Use Gmail App Password, not regular password

Transporter (in emailService.js):
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: { user, pass }
  });
```

---

## 8. Data Flow: Sales Rep Visit → Report → Approval

```
┌────────────────────────────────────────────────────────────────────┐
│      COMPLETE WORKFLOW: Visit Creation to Report Approval          │
└────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ DAY 1: FIELD VISIT (Sales Rep)                                  │
└─────────────────────────────────────────────────────────────────┘

Sales Rep Opens App
  │
  ├─ Dashboard shows:
  │  • Daily targets (visits, quotations, revenue)
  │  • Recent visits
  │  • Pending quotations
  │
  └─→ Click "Record Visit"

Visit Form:
  ├─ Client Info (hospital name, type, location)
  ├─ Contacts (doctor, admin, procurement officer)
  ├─ Equipment (existing + requested)
  ├─ Visit Purpose (demo, followup, etc.)
  ├─ Outcomes (successful, needs followup, etc.)
  ├─ Notes
  │
  └─→ Submit

POST /api/visits
  ├─ Authenticate: JWT token → req.user = sales rep
  ├─ Validate: All required fields present
  ├─ Create Visit document:
  │  {
  │    userId: sales_rep_id,
  │    date: 2025-12-11,
  │    client: { name: "City Hospital", ... },
  │    status: "completed",
  │    ...
  │  }
  ├─ Save to MongoDB
  ├─ Emit Socket.IO: "visitUpdate" → Admin dashboard
  ├─ Log: winston.info("Visit created...")
  │
  └─ Response: 201 Created { visit: {...} }

Frontend:
  ├─ Show success: "Visit recorded"
  ├─ Add to recent visits list
  └─ Update visit count toward daily target

──────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│ DAY 1-5: WEEK OF ACTIVITIES (Sales Rep)                         │
└─────────────────────────────────────────────────────────────────┘

Sales Rep Records:
  ├─ 5 visits to different hospitals
  ├─ 2 quotation requests for equipment
  ├─ 3 follow-up actions
  └─ Updated 2 leads from "contacted" → "qualified"

Each action:
  ├─ POST /api/visits ✓
  ├─ POST /api/quotation ✓
  ├─ PUT /api/leads/:id ✓ (status update)
  └─ Socket.IO events emitted → admins see live updates

──────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│ FRIDAY 5 PM: WEEKLY REPORT SUBMISSION (Sales Rep)               │
└─────────────────────────────────────────────────────────────────┘

Sales Rep Opens "Weekly Report" Screen
  │
  ├─ Form with Sections:
  │  1. Weekly Summary (narrative)
  │  2. Customer Visits (list with details)
  │  3. Quotations Generated (equipment + amounts)
  │  4. New Leads (contact info)
  │  5. Challenges Faced (narrative)
  │  6. Next Week Plan (narrative)
  │
  └─→ Fill in all sections

POST /api/reports
  ├─ Auth: req.user = sales rep
  ├─ Validate:
  │  ├─ weekStart & weekEnd provided
  │  ├─ All required sections filled (not draft)
  │  └─ weekEnd > weekStart
  ├─ Create Report:
  │  {
  │    userId: sales_rep_id,
  │    weekStart: 2025-12-08,
  │    weekEnd: 2025-12-12,
  │    sections: [{id, title, content}, ...],
  │    status: "pending",
  │    isDraft: false,
  │    createdAt: now
  │  }
  ├─ Save to MongoDB
  ├─ Generate PDF asynchronously:
  │  └─ PDFKit creates PDF from report content
  │      └─ Upload to Cloudinary
  │          └─ Store pdfUrl in Report document
  ├─ Send Email to Admin:
  │  └─ "New Weekly Report from John Doe - Week of 12/8-12/12"
  │      └─ Link to admin dashboard
  ├─ Log: "Report submitted by user_id"
  │
  └─ Response: 201 { report: {..., status: 'pending'} }

Frontend:
  ├─ Show: "Report submitted successfully"
  ├─ Show: "PDF being generated..."
  └─ Link: "Download PDF" (once ready)

──────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│ FRIDAY 6 PM: ADMIN NOTIFICATION (Admin/Manager)                 │
└─────────────────────────────────────────────────────────────────┘

Admin Dashboard:
  ├─ Email received: "New report from John Doe"
  ├─ Or: Real-time notification via Socket.IO
  │
  └─→ Clicks to Admin Panel

GET /api/admin/reports?status=pending&page=1
  ├─ Auth: req.user.role = 'admin' or 'manager'
  ├─ Query pending reports
  ├─ Return with pagination:
  │  {
  │    docs: [
  │      {
  │        _id, userId, weekStart, weekEnd,
  │        sections, status: 'pending',
  │        pdfUrl, createdAt, ...
  │      }
  │    ],
  │    totalDocs: 5,
  │    totalPages: 1,
  │    page: 1
  │  }

Admin Reviews Report:
  ├─ Clicks report to view details
  ├─ Reads all sections
  ├─ Downloads/views PDF
  └─ Decides: Approve or Reject

──────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│ MONDAY 9 AM: REPORT APPROVAL/REJECTION (Admin/Manager)          │
└─────────────────────────────────────────────────────────────────┘

Admin Action: Approve

PUT /api/admin/reports/report_id
  ├─ Auth: req.user = admin/manager
  ├─ Body: { status: "approved", adminNotes: "Great work!" }
  ├─ Update Report:
  │  ├─ status = "approved"
  │  ├─ reviewedBy = admin_user_id
  │  ├─ reviewedAt = now
  │  ├─ adminNotes = "Great work!"
  ├─ Save to MongoDB
  ├─ Send Email to Sales Rep:
  │  └─ "Your weekly report has been APPROVED"
  │      └─ "Admin comments: Great work!"
  ├─ Log: "Report approved by admin_id"
  │
  └─ Response: 200 { success: true, report: {...} }

Or: Admin Action: Reject

PUT /api/admin/reports/report_id
  ├─ Auth: req.user = admin/manager
  ├─ Body: { status: "rejected", adminNotes: "Please add more details on challenges" }
  ├─ Update Report:
  │  ├─ status = "rejected"
  │  ├─ reviewedBy = admin_user_id
  │  ├─ reviewedAt = now
  │  ├─ adminNotes = "Please add more details..."
  ├─ Save to MongoDB
  ├─ Send Email to Sales Rep:
  │  └─ "Your weekly report has been REJECTED"
  │      └─ "Admin feedback: Please add more details on challenges"
  │         └─ "Please resubmit by Friday"
  ├─ Log: "Report rejected by admin_id"
  │
  └─ Response: 200 { success: true, report: {...} }

Sales Rep Receives:
  ├─ Email notification
  ├─ Or: In-app notification
  ├─ If approved: Sees status changed to "approved"
  └─ If rejected: Resubmits report with more details

──────────────────────────────────────────────────────────────────

SUMMARY:
  Visit → Report → Email Notification → Admin Review → Approval
       ↓
   Socket.IO Real-time Updates & Email Alerts throughout
```

---

## 9. File Structure (Detailed)

```
PROJECT DIRECTORY STRUCTURE

ACCORDBACKEND/
│
├── project/                              ← Main application
│   ├── src/
│   │   ├── server.js                     ← Entry point (HTTP server setup)
│   │   │
│   │   ├── config/
│   │   │   └── database.js               ← MongoDB connection
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js                   ← JWT authentication, role checking
│   │   │   ├── validation.js             ← Input validation rules
│   │   │   ├── errorHandler.js           ← Centralized error handling
│   │   │   └── rateLimiters.js           ← Rate limiting configs
│   │   │
│   │   ├── models/                       ← Mongoose schemas
│   │   │   ├── User.js                   ← User document
│   │   │   ├── Lead.js                   ← Sales lead
│   │   │   ├── Visit.js                  ← Field visit record
│   │   │   ├── Machine.js                ← Equipment
│   │   │   ├── EngineeringService.js     ← Service assignment
│   │   │   ├── Report.js                 ← Weekly report
│   │   │   ├── Request.js                ← Quotation request
│   │   │   ├── FollowUp.js
│   │   │   ├── FollowUpVisit.js
│   │   │   ├── Order.js
│   │   │   ├── Facility.js
│   │   │   ├── Consumable.js
│   │   │   ├── Planner.js
│   │   │   ├── Communication.js
│   │   │   ├── EngineeringPricing.js
│   │   │   ├── Trail.js
│   │   │   ├── LocationTrack.js
│   │   │   ├── Sale.js
│   │   │   ├── Product.js
│   │   │   └── Quotation.js
│   │   │
│   │   ├── routes/                       ← API endpoints
│   │   │   ├── auth.js                   ← Register, login, tokens
│   │   │   ├── user.js                   ← User profile
│   │   │   ├── visits.js                 ← Visit CRUD
│   │   │   ├── reports.js                ← Report submission
│   │   │   ├── quotation.js              ← Quote requests
│   │   │   ├── leads.js                  ← Lead management
│   │   │   ├── machines.js               ← Machine registry
│   │   │   ├── facilities.js
│   │   │   ├── consumables.js
│   │   │   ├── engineering-services.js   ← Service management
│   │   │   ├── engineering-pricing.js
│   │   │   ├── planner.js
│   │   │   ├── dashboard.js              ← User dashboard
│   │   │   ├── analytics.js              ← Analytics
│   │   │   ├── notifications.js
│   │   │   ├── trails.js                 ← GPS tracking
│   │   │   ├── equipment.js
│   │   │   ├── orders.js
│   │   │   ├── sales.js
│   │   │   ├── follow-ups.js
│   │   │   ├── follow-up-visits.js
│   │   │   ├── communications.js
│   │   │   ├── kmhfr.js                  ← Integration endpoint
│   │   │   ├── location.js
│   │   │   ├── app.js
│   │   │   ├── admin.js                  ← Admin general
│   │   │   │
│   │   │   └── admin/                    ← Admin-specific routes
│   │   │       ├── reports.js            ← Admin report review
│   │   │       ├── quotations.js         ← Admin quote management
│   │   │       ├── users.js              ← User management
│   │   │       ├── analytics.js          ← Admin analytics
│   │   │       ├── visits.js
│   │   │       ├── machines.js
│   │   │       ├── consumables.js
│   │   │       ├── leads.js
│   │   │       ├── planners.js
│   │   │       ├── location.js
│   │   │       └── map.js
│   │   │
│   │   ├── controllers/                  ← Business logic
│   │   │   ├── engineeringServiceController.js
│   │   │   ├── adminAnalyticsController.js
│   │   │   ├── adminUsersController.js
│   │   │   ├── adminVisitsController.js
│   │   │   ├── analyticsController.js
│   │   │   ├── communicationsController.js
│   │   │   ├── consumableController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── engineeringPricingController.js
│   │   │   ├── facilitiesController.js
│   │   │   ├── locationController.js
│   │   │   ├── plannerController.js
│   │   │   └── userController.js
│   │   │
│   │   ├── services/                     ← Business services
│   │   │   ├── emailService.js           ← Nodemailer integration
│   │   │   ├── scheduledJobs.js          ← Cron jobs (node-cron)
│   │   │   └── machineReports.js
│   │   │
│   │   ├── utils/                        ← Utilities
│   │   │   ├── logger.js                 ← Winston logger
│   │   │   └── cloudinary.js             ← File upload service
│   │   │
│   │   ├── lib/                          ← Libraries
│   │   │   └── api/
│   │   │
│   │   ├── data/                         ← Seed data
│   │   │
│   │   ├── uploads/                      ← Local file storage
│   │   │   ├── reports/                  ← Generated PDFs
│   │   │   ├── weekly-reports/
│   │   │   └── data.json
│   │   │
│   │   ├── logs/                         ← Application logs
│   │   │   ├── error.log                 ← Error log (Winston)
│   │   │   └── combined.log              ← All logs (Winston)
│   │   │
│   │   ├── .env                          ← Environment variables (local)
│   │   ├── App.tsx                       ← Frontend React component
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── vite-env.d.ts
│   │   │
│   │   ├── debug/                        ← Debugging scripts
│   │   │   ├── cloudinary-debug.mjs
│   │   │   ├── list-resources.mjs
│   │   │   └── print-report.mjs
│   │   │
│   │   ├── downloads/                    ← App download assets
│   │   │   └── README.md
│   │   │
│   │   └── scripts/                      ← Utility scripts
│   │       ├── checkLeads.js
│   │       ├── seedConsumables.js
│   │       ├── sendCatchupReports.js
│   │       ├── test_visit_api.js
│   │       ├── testAdminConsumables.js
│   │       ├── testDeleteSale.js
│   │       ├── verifyConsumables.js
│   │       └── facilities.sample.json
│   │
│   ├── package.json                      ← Dependencies
│   ├── tsconfig.json                     ← TypeScript config
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts                    ← Vite build config
│   ├── eslint.config.js                  ← Linting config
│   ├── postcss.config.js                 ← PostCSS config
│   ├── tailwind.config.js                ← Tailwind CSS config
│   ├── README.md
│   │
│   ├── Postman Collections (for API testing)
│   │   ├── postman_collection.json
│   │   ├── api_for_smoke.postman_collection.json
│   │   └── postman_kmhfr_collection.json
│   │
│   └── Seed/Utility Scripts
│       ├── seedAdmin.js
│       ├── seedLeads.js
│       ├── seedMachines.js
│       ├── verifyAdmin.js
│       └── server_*.pid                  ← Process IDs
│
├── scripts/                              ← Root-level scripts
│   └── seedFacilities.js
│
├── logs/                                 ← Root-level logs
│
├── Documentation Files
│   ├── BACKEND_API_DOCUMENTATION.md
│   ├── BACKEND_IMPLEMENTATION_STATUS.md
│   ├── BACKEND_REQUIREMENTS.md
│   ├── ROLE_BASED_ACCESS_CONTROL.md
│   ├── PROJECT_ANALYSIS.md
│   ├── PROJECT_COMPREHENSIVE_ANALYSIS.md ← THIS FILE
│   ├── AUTH_REGISTRATION_GUIDE.md
│   ├── ENGINEER_APP_IMPLEMENTATION_GUIDE.md
│   ├── LEADS_API.md
│   ├── MACHINES.md
│   ├── EMAIL_CONFIGURATION.md
│   ├── REPORT_STRUCTURE_IMPLEMENTATION.md
│   ├── intergration.md
│   ├── QUICK_REFERENCE.md
│   └── (25+ more documentation files)
│
└── Data Files
    ├── facilities.flat.json
    ├── machines_bulk.md
    └── ENGINEERS_FINANCE.md
```

---

## 10. Technology Decision Tree

```
TECHNOLOGY SELECTION RATIONALE

┌─ WEB FRAMEWORK
│  ├─ EXPRESS.JS
│  │  ├─ Lightweight & fast
│  │  ├─ Massive ecosystem (middleware)
│  │  ├─ Easy routing & middleware
│  │  └─ Best for REST APIs ✅
│  │
│  └─ WHY NOT: Django, Fastapi, Rails
│     └─ Overkill for REST API, slower setup
│
├─ DATABASE
│  ├─ MONGODB with MONGOOSE
│  │  ├─ Flexible schema (reports, machines, etc.)
│  │  ├─ Scalability (cloud Atlas)
│  │  ├─ Rich querying with aggregation
│  │  ├─ TTL indexes (refresh tokens)
│  │  └─ Great for IoT/field data ✅
│  │
│  └─ WHY NOT: PostgreSQL, MySQL
│     └─ SQL better for structured data, harder for flexibility needed here
│
├─ AUTHENTICATION
│  ├─ JWT (JSON Web Tokens)
│  │  ├─ Stateless (no session storage)
│  │  ├─ Scalable (multiple servers)
│  │  ├─ Mobile-friendly
│  │  ├─ Access + Refresh token pattern ✅
│  │  └─ Included in jsonwebtoken npm package
│  │
│  └─ WHY NOT: OAuth2, SAML, Session-based
│     └─ Overkill for internal app, JWT simpler & sufficient
│
├─ REAL-TIME
│  ├─ SOCKET.IO
│  │  ├─ Fallback to polling (if WebSocket fails)
│  │  ├─ Easy event-based communication
│  │  ├─ Works with admin dashboards
│  │  ├─ Auto-reconnect ✅
│  │  └─ Lower latency than polling
│  │
│  └─ WHY NOT: Native WebSocket, GraphQL Subscriptions
│     └─ Socket.IO more robust, handles disconnects better
│
├─ FILE STORAGE
│  ├─ CLOUDINARY (Primary) + LOCAL UPLOADS (Backup)
│  │  ├─ Cloudinary: CDN, transformations, reliability
│  │  ├─ Local: /uploads/ as fallback
│  │  ├─ Better than AWS S3 (cost + complexity) ✅
│  │  └─ Better than Firebase Storage (price)
│  │
│  └─ Configuration: env variables, easy migration
│
├─ EMAIL SERVICE
│  ├─ NODEMAILER with SMTP
│  │  ├─ Works with Gmail, SendGrid, AWS SES
│  │  ├─ No cost for Gmail
│  │  ├─ Simple setup ✅
│  │  ├─ Template support (inline for now)
│  │  └─ Better than: Mailgun, AWS SES (pricing)
│  │
│  └─ Future: SendGrid transactional emails for scale
│
├─ BACKGROUND JOBS
│  ├─ NODE-CRON
│  │  ├─ Lightweight (cron expressions)
│  │  ├─ Works for reminders, cleanup
│  │  ├─ Single-instance only ⚠️
│  │  └─ Good for MVP ✅
│  │
│  └─ Future: Bull Queue (Redis-backed) for scale
│
├─ LOGGING
│  ├─ WINSTON
│  │  ├─ Multiple transports (console, file)
│  │  ├─ Log levels (error, info, debug)
│  │  ├─ Rotation (important for disk space)
│  │  ├─ Better than console.log ✅
│  │  └─ Professional logging
│  │
│  └─ Integration: Combined.log + error.log
│
├─ INPUT VALIDATION
│  ├─ EXPRESS-VALIDATOR + JOI
│  │  ├─ Chain-based validation (express-validator)
│  │  ├─ Schema validation (Joi)
│  │  ├─ Custom rules
│  │  ├─ Error messages ✅
│  │  └─ Better than manual if-statements
│  │
│  └─ Mongoose schema validation as 2nd layer
│
├─ SECURITY
│  ├─ HELMET (Security headers)
│  │  ├─ Prevents X-Frame-Options attacks
│  │  ├─ Sets CSP headers
│  │  ├─ Removes X-Powered-By
│  │  └─ Industry standard ✅
│  │
│  ├─ CORS (Cross-Origin)
│  │  ├─ Whitelist origins in production
│  │  ├─ Prevent unauthorized access
│  │  └─ Currently allows all (adjust for prod) ⚠️
│  │
│  ├─ RATE LIMITING (express-rate-limit)
│  │  ├─ DDoS protection
│  │  ├─ Auth endpoint stricter limits
│  │  └─ Global 100 req/15min ✅
│  │
│  └─ PASSWORD: BCRYPTJS
│     ├─ Industry standard hashing
│     ├─ Salt: 10 rounds
│     └─ Slow by design (prevents brute force)
│
└─ OVERALL ARCHITECTURE ✅
   ├─ Clean separation (routes, controllers, services, models)
   ├─ Scalable (stateless JWT, can add servers)
   ├─ Testable (middleware, services decoupled)
   ├─ Maintainable (clear structure, documented)
   └─ Production-ready (logging, error handling, security)
```

---

**End of Diagram Document**

*This visual guide complements the comprehensive analysis document.*
