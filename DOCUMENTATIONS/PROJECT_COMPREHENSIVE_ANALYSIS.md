# ACCORD Backend - Comprehensive Project Analysis

**Last Updated:** December 11, 2025  
**Project Type:** Full-Stack Field Sales & Engineering Services Management System  
**Technology Stack:** Node.js/Express, MongoDB, Socket.IO, React/Vite (Frontend)

---

## 📋 Executive Summary

This is the backend for **ACCORD Medical's Field Sales Tracking and Engineering Services Management System**. It's a comprehensive platform that manages:
- **Sales Representatives** - Field visits, quotations, reports, leads
- **Engineering Teams** - Service assignments, maintenance, installations, repairs
- **Administrators** - Dashboard, analytics, user management, approvals
- **System Integration** - Real-time notifications, email alerts, PDF generation

**Status:** Fully implemented and deployed to `app.codewithseth.co.ke`

---

## 🏗️ Architecture Overview

### Technology Stack
```
Backend:        Node.js (ES modules) + Express 4.18
Database:       MongoDB with Mongoose 8.0
Authentication: JWT (access + refresh tokens)
Real-time:      Socket.IO 4.7
File Storage:   Cloudinary (images/uploads) + Local uploads folder
Email:          Nodemailer 6.9
PDF:            PDFKit 0.17
Scheduling:     node-cron 3.0
Logging:        Winston 3.11
Validation:     Express-validator + Joi
Rate Limiting:  express-rate-limit
Security:       Helmet, CORS, Compression
```

### Server Entry Point
- **Main:** `/project/src/server.js` (177 lines)
- **Runs on:** `PORT` env variable (typically 5000, 5001, or 3000)
- **DB Connection:** Automatic on startup via `connectDB()` in `/project/src/config/database.js`
- **Scheduled Jobs:** Auto-initialized via `initializeScheduledJobs()` using node-cron

---

## 📊 Database Models & Entity Relationships

### Core Models (20 total)

#### 1. **User** (`/src/models/User.js`) - Central Actor
**Purpose:** Represents all system users (admin, manager, sales, engineer)

**Key Fields:**
- `employeeId` (unique, required)
- `firstName`, `lastName`, `email` (unique)
- `password` (bcrypt hashed)
- `role` (enum: `admin`, `manager`, `sales`, `engineer`)
- `department` (enum: sales, marketing, technical, management, engineering)
- `phone`, `region`, `territory`
- `isActive` (boolean)
- `profileImage` (Cloudinary URL)
- `lastLogin` (timestamp)
- `refreshTokens[]` (30-day TTL subdocs)
- `targets` (nested: monthly/quarterly - visits, orders, revenue)

**Usage:** Referenced by almost every other model as creator, assignee, or actor.

---

#### 2. **Lead** (`/src/models/Lead.js`) - Sales Lead
**Purpose:** Track potential medical equipment sales opportunities

**Key Fields:**
- `facilityName`, `facilityType`, `location`
- `contactPerson` (name, role, phone, email)
- `facilityDetails` (hospitalLevel, currentEquipment)
- `equipmentOfInterest` (name, category, quantity)
- `budget` (amount, currency)
- `timeline` (expectedPurchaseDate, urgency)
- `competitorAnalysis`, `additionalInfo` (painPoints, notes)
- `leadSource` (enum: field-visit, phone-call, email, referral, event, website, other)
- `leadStatus` (enum: new, contacted, qualified, proposal-sent, negotiation, won, lost)
- `statusHistory[]` (tracks who changed status and when)
- `createdBy` (ref: User)
- `tags`, `followUpDate`, `nextActionDate`

**Relationships:** `createdBy` → User, `statusHistory[].changedBy` → User  
**Indexes:** Text indexes on facilityName, location, contactPerson.name, equipmentOfInterest.name

---

#### 3. **Visit** (`/src/models/Visit.js`) - Sales Activity
**Purpose:** Record sales representative field visits to facilities

**Key Fields:**
- `userId` (ref: User) - who performed the visit
- `date`, `duration` (time spent)
- `client` (type, name, location, phone, email)
- `visitPurpose` (enum: demo, followup, installation, maintenance, consultation, sales, other)
- `visitOutcome` (enum: successful, pending, followup_required, no_interest)
- `contacts[]` (role, name, phone, email, designation)
- `existingEquipment[]`, `requestedEquipment[]` (machine details)
- `isFollowUpRequired` (boolean)
- `followUpActions[]` (assignedTo: User ref, dueDate, description)
- `followUpVisits[]` (ref: FollowUpVisit)
- `notes`, `observations`
- `createdAt`, `updatedAt` (timestamps)

**Relationships:** userId → User, followUpActions[].assignedTo → User, followUpVisits[] → FollowUpVisit  
**Indexes:** userId+date, client.type, visitOutcome

---

#### 4. **Machine** (`/src/models/Machine.js`) - Equipment Registry
**Purpose:** Track all medical equipment/machines in the field

**Key Fields:**
- `name`, `manufacturer`, `model`, `category`
- `serialNumber`, `version`
- `facility` (name, location, level)
- `contactPerson` (name, role, phone, email)
- `metadata` (createdBy: User, uploadedAt)
- `status` (active, inactive, maintenance, decommissioned)
- `dates` (installedDate, purchaseDate, warrantyExpiry, lastServicedAt, nextServiceDue)
- `lastServiceEngineer` (_id, name, phone)
- `notes`, `specifications`

**Relationships:** metadata.createdBy → User, lastServiceEngineer.engineerId → User  
**Usage:** Referenced by EngineeringService via `machineId`

---

#### 5. **EngineeringService** (`/src/models/EngineeringService.js`) - Service Records
**Purpose:** Track engineering service tasks (installations, repairs, maintenance)

**Key Fields:**
- `date`, `scheduledDate`
- `facility` (name, location)
- `serviceType` (enum: installation, maintenance, repair, service, inspection)
- `engineerInCharge` (ref: User, required)
- `machineId` (ref: Machine, optional)
- `machineDetails` (string description)
- `conditionBefore`, `conditionAfter` (string)
- `status` (enum: pending, assigned, in-progress, completed, cancelled)
- `notes`, `otherPersonnel[]`
- `nextServiceDate`
- `userId` (ref: User - who created it)

**Relationships:** engineerInCharge → User, machineId → Machine, userId → User  
**Indexes:** engineerInCharge+status, scheduledDate  
**Pagination:** Uses mongoose-paginate-v2

---

#### 6. **Report** (`/src/models/Report.js`) - Weekly Activity Reports
**Purpose:** Sales reps submit weekly activity summaries

**Key Fields:**
- `userId` (ref: User)
- `weekStart`, `weekEnd` (dates)
- `weekRange` (string: "06/10/2025 - 12/10/2025")
- `content` or `sections[]` (flexible structure)
  - `id`, `title`, `content` per section
- `status` (enum: pending, reviewed, approved, rejected)
- `isDraft` (boolean)
- `pdfUrl`, `fileUrl`
- `reviewedBy` (ref: User), `reviewedAt`
- `adminNotes`

**Relationships:** userId → User, reviewedBy → User  
**Pagination:** mongoose-paginate-v2  
**Indexes:** userId+weekStart, status+createdAt

---

#### 7. **Quotation/Request** (`/src/models/Request.js`) - Equipment Quotes
**Purpose:** Track customer quotation requests and admin responses

**Key Fields:**
- `userId` (ref: User - who created)
- `hospital`, `equipmentRequired`, `contactName`, `contactPhone`, `contactEmail`
- `urgency` (low, medium, high)
- `additionalDetails`
- `status` (enum: pending, in_progress, responded, completed, rejected)
- `responded` (boolean)
- `response` (subdoc: message, documentUrl, estimatedCost, respondedBy: User, respondedAt)

**Relationships:** userId → User, response.respondedBy → User  
**Pagination:** mongoose-paginate-v2  
**Indexes:** userId+createdAt, urgency+status, text on hospital/equipmentRequired

---

#### 8. **FollowUp** (`/src/models/FollowUp.js`)
**Purpose:** Track follow-up actions for visits and leads

**Key Fields:**
- `relatedTo` (visit/lead reference)
- `assignedTo` (ref: User)
- `dueDate`, `completedDate`
- `status` (pending, completed, overdue)
- `description`, `notes`

---

#### 9. **FollowUpVisit** (`/src/models/FollowUpVisit.js`)
**Purpose:** Record follow-up visits made after initial contact

**Key Fields:** Similar to Visit but linked to initial visit

---

#### 10. **Order** (`/src/models/Order.js`)
**Purpose:** Track equipment sales orders

**Key Fields:**
- `userId` (ref: User)
- `items[]`, `totalAmount`, `status`, `deliveryDate`

---

#### 11. **Facility** (`/src/models/Facility.js`)
**Purpose:** Registry of medical facilities

**Key Fields:**
- `name`, `location`, `type`, `level`
- `contactPerson` info
- `visitCount`, `lastVisited`

---

#### 12. **Machine/Consumable Models**
- **Consumable.js** - Track consumable medical supplies
- **Planner.js** - Schedule planning for activities
- **Communication.js** - Inter-user messaging

---

#### 13-20. **Other Models**
- Product, Sale, Trail, LocationTrack, EngineeringPricing, etc.

---

## 🛣️ Route Structure & API Architecture

### Route Organization
```
/api/
├── /auth                          (public registration, login, tokens)
├── /users                         (user profile, preferences)
├── /visits                        (CRUD, analytics)
├── /trails                        (GPS tracking)
├── /reports                       (weekly reports submission)
├── /quotation                     (equipment quote requests)
├── /leads                         (lead management)
├── /machines                      (equipment registry)
├── /facilities                    (facility management)
├── /consumables                   (consumable tracking)
├── /engineering-services          (service assignments)
├── /engineering-pricing           (pricing rules)
├── /planner                       (activity planning)
├── /communications                (messaging)
├── /notifications                 (notification management)
├── /dashboard                     (user dashboard data)
├── /analytics                     (analytics & reporting)
└── /admin/
    ├── /reports                   (admin report review)
    ├── /quotations                (admin quote management)
    ├── /visits                    (admin visit oversight)
    ├── /users                     (user management)
    ├── /analytics                 (admin analytics)
    ├── /machines                  (machine management)
    ├── /consumables               (consumable admin)
    ├── /leads                     (lead admin)
    ├── /planners                  (planner management)
    ├── /location                  (location data)
    └── /map                       (map data for admin)
```

### Key Routes Implementation Pattern

**Example: Engineering Services (`/src/routes/engineeringServices.js`)**
```javascript
router.get('/', authenticate, async (req, res) => {
  // Get with filters, pagination, role-based filtering
  // Users see own services, engineers see assigned, admins see all
});

router.post('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  // Create new service (admin/manager only)
});

router.put('/:id', authenticate, async (req, res) => {
  // Update (full for admin/manager, limited for engineer)
});

router.get('/mine', authenticate, authorize('engineer'), async (req, res) => {
  // Engineer gets assigned services only
});
```

---

## 🔐 Authentication & Authorization System

### Authentication Flow
1. **Registration** (`POST /api/auth/register`)
   - Public for `sales` and `engineer` roles only
   - Admin/Manager created by admin panel
   - Password bcrypt-hashed before storage
   - Welcome email sent

2. **Login** (`POST /api/auth/login`)
   - Email + password validation
   - Returns: `accessToken` (15 min) + `refreshToken` (30 days)
   - Refresh token stored in User.refreshTokens with TTL index

3. **Token Refresh** (`POST /api/auth/refresh`)
   - Validate refresh token
   - Issue new access token
   - Manage refresh token rotation

4. **Logout** (`POST /api/auth/logout`)
   - Remove refresh token from User.refreshTokens

### Authorization Levels
```javascript
// Middleware: authenticate - validates JWT, populates req.user
export const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id).select('-password -refreshTokens');
}

// Middleware: authorize - checks user role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
  }
}
```

### Role-Based Access Control (RBAC)

| Feature | Admin | Manager | Sales | Engineer |
|---------|-------|---------|-------|----------|
| **View Reports** | All | All | Own | None |
| **Approve Reports** | ✅ | ❌ | ❌ | ❌ |
| **Create Services** | ✅ | ✅ | Request only | ❌ |
| **Assign Services** | ✅ | ✅ | ❌ | ❌ |
| **Update Services** | Full | Full | Limited | Own only |
| **View All Visits** | ✅ | ✅ | Own | ❌ |
| **View Analytics** | ✅ | ✅ | Own | ❌ |
| **Manage Users** | ✅ | Limited | ❌ | ❌ |
| **Delete Records** | ✅ | Limited | ❌ | ❌ |

---

## 🔧 Middleware Stack

### Security & Performance
- **helmet** - HTTP headers security
- **cors** - Cross-Origin Resource Sharing
- **compression** - Response compression
- **morgan** - HTTP logging
- **express-rate-limit** - DDoS protection
  - Global: 100 requests/15 min
  - Auth endpoints: Stricter limits

### Custom Middleware (`/src/middleware/`)

1. **auth.js**
   - `authenticate` - JWT validation
   - `authorize(...roles)` - Role checking
   - `optionalAuth` - Optional authentication

2. **validation.js** - Express-validator chains
   - `validateRegistration`
   - `validateLogin`
   - `validateVisit`
   - `validatePagination`
   - etc.

3. **errorHandler.js** - Centralized error handling
   - Maps Mongoose errors to HTTP responses
   - JWT errors handling
   - Validation error formatting
   - Logging via winston

4. **rateLimiters.js**
   - `generalLimiter` - Global API rate limit
   - `authUserLimiter` - Auth endpoint limit

---

## 📧 Services Layer

### Email Service (`/src/services/emailService.js`)

**Transporter Setup:**
- Uses Nodemailer with SMTP
- Configuration from env: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS

**Email Templates:**
```javascript
'welcome'           // New user registration
'resetPassword'     // Password reset link
'dailyReport'       // Activity summary
'quotationResponse' // Quote received
'reportApproval'    // Report status update
'reportRejection'   // Report rejection notice
// Raw HTML support for custom emails
```

**Example Usage:**
```javascript
await sendEmail({
  to: user.email,
  subject: 'Welcome to Accord Medical',
  template: 'welcome',
  data: { firstName, employeeId, loginUrl }
});
```

### Scheduled Jobs (`/src/services/scheduledJobs.js`)

Uses **node-cron** for background tasks:

1. **Daily Report Reminder** (9 AM daily)
   - Sends email to all sales reps
   - "Submit your daily activity report"

2. **Weekly Summary** (Friday 5 PM)
   - Aggregates visits, quotations, sales
   - Sends to managers/admins

3. **Monthly Cleanup** (1st of month 2 AM)
   - Archives old logs
   - Deletes expired refresh tokens

4. **Follow-up Reminders** (9 AM daily)
   - Checks overdue follow-ups
   - Notifies assigned users

**Important:** Designed for single-instance deployment; multiple servers need distributed lock mechanism.

---

## 🗄️ Database Connection & Indexing

### Connection (`/src/config/database.js`)
```javascript
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
```

**Auto-Created Indexes on Startup:**
- `users: { email: 1 (unique), employeeId: 1 (unique) }`
- `trails: { userId: 1, date: -1 }`
- `visits: { userId: 1, date: -1 }, { client.type: 1 }`
- `orders: { userId: 1, status: 1, createdAt: -1 }`

---

## 🔌 Real-Time Features (Socket.IO)

**Setup in server.js:**
```javascript
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || "*" }
});
app.set('io', io);
```

**Emitted Events:**
- `visitUpdate` - When visit created/updated
- `serviceAssignment` - When engineer assigned task
- `reportSubmitted` - Admin notification
- `quotationResponse` - Sales rep notification

**Usage Pattern:**
```javascript
const io = app.get('io');
io.emit('visitUpdate', { visitData });
```

---

## 📝 File Upload & Storage

### Cloudinary Integration (`/src/utils/cloudinary.js`)
- **Purpose:** Store images, documents, PDFs
- **Config:** cloudinary.config via env vars
- **Usage:** Upload profile images, report PDFs, attachments

### Local Storage
- **Path:** `/project/uploads/`
- **Served via:** `app.use('/uploads', express.static('uploads'))`
- **Contents:**
  - `/uploads/reports/` - Generated PDFs
  - `/uploads/weekly-reports/` - Report archives
  - `/uploads/data.json` - Bulk data exports

---

## 📊 Analytics & Reporting

### Admin Analytics (`/src/routes/admin/analytics.js`)
- **Sales Metrics:** Total visits, quotations, conversions, revenue
- **Team Performance:** Per-user/per-team stats
- **Lead Funnel:** By stage (new → qualified → won/lost)
- **Engineering Services:** By status, type, completion rate
- **Time Trends:** Monthly/quarterly comparisons

### User Dashboard (`/src/routes/dashboard.js`)
- **Personal Targets:** Monthly/quarterly goals vs actual
- **Recent Activity:** Last 10 visits, quotations
- **Tomorrow's Schedule:** Planned activities
- **Summary Stats:** Relevant to user role

### PDF Generation (Scheduled)
- Reports auto-generate PDFs on submission
- Stored in Cloudinary + local backup
- Sent via email to admins

---

## 🚀 Deployment & Environment

### Environment Variables Required
```
# Database
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=30d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend
CLIENT_URL=https://app.codewithseth.co.ke

# Server
PORT=5000
NODE_ENV=production
```

### Deployment Details
- **Current URL:** `https://app.codewithseth.co.ke`
- **Framework:** Express.js with ES modules
- **Process Management:** PM2 (or similar)
- **Logging:** Stored in `/project/logs/`
  - error.log
  - combined.log

---

## 🧪 Testing & Quality

### Testing Setup
- **Framework:** Jest 29.7
- **HTTP Testing:** Supertest 6.3
- **Run:** `npm test`

### Code Quality
- ESLint configured (`eslint.config.js`)
- Winston logger for all operations
- Error handling centralized in middleware
- Input validation via express-validator

---

## 📈 Key Business Logic Flows

### Sales Rep Flow
1. **Login** → Get dashboard with targets, recent activity
2. **Create Visit** → Record facility visit with equipment/contacts
3. **Add Quotation** → Submit equipment quote request
4. **Submit Report** → Weekly activity report with sections
5. **Admin Reviews** → Manager approves/rejects
6. **Get Assigned Service** → Engineering task (if multi-role)

### Admin Flow
1. **Login** → Admin dashboard with system-wide stats
2. **User Management** → Create/update users, set targets
3. **Review Reports** → Approve/reject weekly submissions
4. **Quote Management** → Respond to quotation requests
5. **Service Management** → Assign tasks to engineers
6. **Analytics** → View team performance, trends
7. **Bulk Operations** → Seed data, import machines, etc.

### Engineer Flow
1. **Login** → Dashboard showing assigned services
2. **View Services** → Filter by status, date, facility
3. **Start Service** → Update status to in-progress
4. **Record Details** → Add condition before, notes
5. **Complete Service** → Record after condition, next service date
6. **Sync Status** → Updates visible to admin immediately

---

## 🔍 Project File Structure Summary

```
project/src/
├── server.js                    ← Entry point
├── config/
│   └── database.js              ← MongoDB connection & indexes
├── middleware/
│   ├── auth.js                  ← JWT authentication
│   ├── validation.js            ← Express-validator chains
│   ├── errorHandler.js          ← Centralized error handling
│   └── rateLimiters.js          ← Rate limiting middleware
├── models/                      ← Mongoose schemas (20 models)
│   ├── User.js
│   ├── Lead.js
│   ├── Visit.js
│   ├── Machine.js
│   ├── EngineeringService.js
│   ├── Report.js
│   └── ... (14 more)
├── routes/                      ← API route definitions
│   ├── auth.js
│   ├── visits.js
│   ├── reports.js
│   ├── quotation.js
│   ├── engineering-services.js
│   └── admin/                   ← Admin-specific routes
│       ├── reports.js
│       ├── users.js
│       ├── analytics.js
│       └── ... (8 more)
├── controllers/                 ← Business logic
│   ├── engineeringServiceController.js
│   ├── adminAnalyticsController.js
│   ├── adminUsersController.js
│   └── ... (10 more)
├── services/                    ← Business services
│   ├── emailService.js          ← Nodemailer integration
│   └── scheduledJobs.js         ← Cron jobs
├── utils/                       ← Utilities
│   ├── logger.js                ← Winston logger
│   └── cloudinary.js            ← File upload service
└── lib/                         ← Libraries
```

---

## ⚠️ Important Notes & Gotchas

### 1. **Scheduled Jobs - Single Instance Only**
If you run multiple server instances, cron jobs will execute multiple times. Use:
- Bull queue library, or
- Distributed lock mechanism, or
- Run cron on dedicated instance only

### 2. **Refresh Token Cleanup**
TTL index on `User.refreshTokens.createdAt` auto-expires 30-day tokens. However, very old refresh tokens may accumulate; monthly cleanup cron helps.

### 3. **Email Templates**
Currently inline HTML. For production, consider:
- Template files in `/templates` folder
- Handlebars or EJS templating
- Transactional email service (SendGrid, AWS SES)

### 4. **File Upload Size Limits**
- Express limit: 10MB (`app.use(express.json({ limit: '10mb' }))`)
- Adjust if needed for large PDFs

### 5. **Socket.IO Rooms**
Currently using default broadcast. For better scalability, implement room-based messaging:
- Admin room: `/admin`
- Engineer room: `/engineer/:userId`
- Broadcast room: `/notifications`

### 6. **Pagination Implementation**
Uses `mongoose-paginate-v2`. Response format:
```json
{
  "docs": [...],
  "totalDocs": 100,
  "totalPages": 5,
  "page": 1,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

### 7. **CORS Configuration**
Currently allows all origins. In production, restrict to frontend domain:
```javascript
app.use(cors({ origin: process.env.CLIENT_URL }));
```

---

## 🎯 Critical Dependencies

```json
{
  "express": "^4.18.2",           // Web framework
  "mongoose": "^8.0.3",           // MongoDB ODM
  "jsonwebtoken": "^9.0.2",       // JWT tokens
  "bcryptjs": "^2.4.3",           // Password hashing
  "nodemailer": "^6.9.7",         // Email service
  "socket.io": "^4.7.4",          // Real-time
  "node-cron": "^3.0.3",          // Scheduled jobs
  "cloudinary": "^2.7.0",         // File storage
  "pdfkit": "^0.17.2",            // PDF generation
  "express-validator": "^7.0.1",  // Input validation
  "helmet": "^7.1.0",             // Security headers
  "cors": "^2.8.5",               // CORS handling
  "morgan": "^1.10.0",            // HTTP logging
  "winston": "^3.11.0",           // Logging
  "xlsx": "^0.18.5"               // Excel export
}
```

---

## 🚀 Getting Started (Developer)

### Local Setup
```bash
cd /home/seth/Documents/deployed/ACCORDBACKEND/project

# 1. Install dependencies
npm install

# 2. Create .env from .env.example
cp .env.example .env
# Fill in all environment variables

# 3. Run in development
npm run dev        # Uses nodemon for auto-reload

# 4. Run tests
npm test

# 5. Seed data (if needed)
npm run seed
npm run seed:facilities
```

### Key npm Scripts
```json
{
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "test": "jest",
  "seed": "node src/scripts/seedData.js",
  "seed:facilities": "node ../scripts/seedFacilities.js"
}
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `BACKEND_API_DOCUMENTATION.md` | Complete API endpoint specs |
| `BACKEND_IMPLEMENTATION_STATUS.md` | Feature completion tracking |
| `ROLE_BASED_ACCESS_CONTROL.md` | RBAC details & permissions |
| `ENGINEER_APP_IMPLEMENTATION_GUIDE.md` | Engineer mobile app guide |
| `AUTH_REGISTRATION_GUIDE.md` | Authentication workflows |
| `LEADS_API.md` | Lead management API |
| `MACHINES.md` | Machine management |
| `REPORT_STRUCTURE_IMPLEMENTATION.md` | Report schema details |
| `EMAIL_CONFIGURATION.md` | Email setup guide |
| `BACKEND_REQUIREMENTS.md` | Engineering services requirements |

---

## ✅ Implementation Checklist

### Core Features
- ✅ User authentication (registration, login, tokens)
- ✅ Role-based access control
- ✅ Sales rep workflows (visits, quotations, reports)
- ✅ Engineering service management
- ✅ Admin dashboard & analytics
- ✅ Email notifications
- ✅ PDF generation for reports
- ✅ Scheduled jobs (daily reminders, cleanup)
- ✅ Real-time updates (Socket.IO)
- ✅ File uploads (Cloudinary)

### Advanced Features
- ✅ Pagination & filtering
- ✅ Text search on leads/machines
- ✅ Rate limiting
- ✅ Request validation
- ✅ Centralized error handling
- ✅ Comprehensive logging
- ✅ HTTPS ready
- ✅ Security headers (Helmet)

---

## 🔮 Future Enhancement Opportunities

1. **Distributed Caching** - Redis for session/data caching
2. **GraphQL API** - Alongside REST API
3. **Mobile App** - React Native/Flutter
4. **Advanced Analytics** - Dashboards with charting
5. **Payment Integration** - For online orders
6. **SMS Notifications** - Twilio integration
7. **Geofencing** - For location-based services
8. **Offline Mode** - Service worker for PWA
9. **Microservices** - Separate services for email, files, etc.
10. **CI/CD Pipeline** - GitHub Actions/GitLab CI

---

## 🎓 Learning Path

To fully understand this codebase:

1. **Start:** Read this file + README.md
2. **Routes:** Study `/src/routes/auth.js` (simplest)
3. **Models:** Review User, Visit, Lead models
4. **Middleware:** Understand auth.js, validation.js
5. **Controllers:** Examine engineeringServiceController.js
6. **Services:** Study emailService.js and scheduledJobs.js
7. **Database:** Trace a complete flow (e.g., login → dashboard)
8. **Testing:** Write tests for a new endpoint

---

## 📞 Quick Reference

### API Health Check
```bash
curl -X GET https://app.codewithseth.co.ke/api/dashboard
# If protected, returns 401; if server is up, returns response
```

### Common Errors
- **401 Unauthorized** - Missing/invalid token
- **403 Forbidden** - Insufficient permissions for role
- **400 Bad Request** - Validation error (check response.errors)
- **500 Server Error** - Check logs in `/project/logs/error.log`

### Database Queries
```javascript
// In any route/controller:
const user = await User.findById(req.user._id);
const visits = await Visit.find({ userId: req.user._id }).sort({ date: -1 });
const report = await Report.findById(id).populate('userId reviewedBy');
```

---

## 📝 Conclusion

This is a **production-ready, feature-complete backend** for a comprehensive field sales and engineering services management system. The architecture is clean, scalable, and well-documented. All critical features are implemented with proper error handling, logging, and security measures.

The codebase follows Express.js best practices with clear separation of concerns:
- Routes handle HTTP
- Controllers handle business logic
- Services handle external integrations
- Models define data structures
- Middleware handles cross-cutting concerns

**Status: Ready for production use** ✅

---

*Document compiled: December 11, 2025*
