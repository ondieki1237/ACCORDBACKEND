# ACCORD Backend - Developer's Deep Dive

A detailed technical reference for developers working with the ACCORD Backend system.

---

## 📋 Table of Contents

1. [Architectural Patterns](#architectural-patterns)
2. [Authentication Flow](#authentication-flow)
3. [Code Structure & Patterns](#code-structure--patterns)
4. [Model Relationships](#model-relationships)
5. [API Development Guide](#api-development-guide)
6. [Testing & Debugging](#testing--debugging)

---

## 🏗️ Architectural Patterns

### 1. MVC (Model-View-Controller) Pattern

```
Request (HTTP)
    ↓
Route Handler (/routes/*.js)
    ↓
Middleware Chain
    - authenticate()
    - authorize(roles)
    - validateInput()
    ↓
Controller (/controllers/*.js)
    - Business logic
    - Query database
    - Call services
    ↓
Model (/models/*.js)
    - Database query
    - Return data
    ↓
Response (JSON)
```

**Example:**

```javascript
// routes/users.js
router.get('/profile', authenticate, userController.getProfile);

// controllers/userController.js
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -refreshTokens');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// models/User.js
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'sales', 'engineer'] }
  // ... more fields
});
```

### 2. Middleware Pipeline Pattern

```
Helmet (Security)
    ↓
CORS (Cross-Origin)
    ↓
Compression
    ↓
Morgan (Logging)
    ↓
Express JSON Parser
    ↓
Rate Limiter
    ↓
[Conditional] authenticate()
    ↓
[Conditional] authorize(roles)
    ↓
[Conditional] validateInput()
    ↓
Route Handler
```

**Example from server.js:**

```javascript
// Middleware stack
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use('/api/', generalLimiter);

// Protected routes
app.use('/api/visits', authenticate, visitRoutes);
app.use('/api/admin', authenticate, authorize('admin'), adminRoutes);
```

### 3. Service Layer Pattern

Services encapsulate reusable business logic:

```javascript
// services/emailService.js
export const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({...});
  return await transporter.sendMail({ to, subject, html });
};

// Used in multiple controllers
await sendEmail('admin@example.com', 'New Report', htmlTemplate);
```

### 4. Repository Pattern (Implicit)

Models act as repositories:

```javascript
// Instead of direct queries in controller:
const reports = await Report.find({ userId });

// Models handle schema + queries
export const getReports = async (req, res) => {
  const reports = await Report.paginate(
    { userId: req.user.id },
    { page: 1, limit: 10 }
  );
  res.json(reports);
};
```

### 5. Observable Pattern (Socket.IO)

Real-time event emission:

```javascript
// In controller, after action
io.emit('visitCreated', {
  visitId: newVisit._id,
  userId: newVisit.userId,
  timestamp: new Date()
});

// On frontend
socket.on('visitCreated', (data) => {
  updateDashboard(data);
});
```

---

## 🔐 Authentication Flow

### Token Generation

```javascript
// In auth controller
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
  
  return { accessToken, refreshToken };
};
```

### Token Verification

```javascript
// middleware/auth.js
export const authenticate = async (req, res, next) => {
  try {
    // Extract from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token' });
    }
    
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Load user from DB
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid user' });
    }
    
    // Attach to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
```

### Role-Based Authorization

```javascript
// middleware/auth.js
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

// Usage in routes
router.post('/approve-report', 
  authenticate, 
  authorize('admin'), 
  approveReport
);
```

---

## 💻 Code Structure & Patterns

### 1. Model Definition Pattern

```javascript
// models/YourModel.js
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const schema = new mongoose.Schema({
  // Fields
  name: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'inactive'],
    default: 'active'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Subdocuments
  metadata: {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }
}, { timestamps: true });

// Indexes
schema.index({ userId: 1, createdAt: -1 });
schema.index({ status: 1 });

// Plugins
schema.plugin(mongoosePaginate);

export default mongoose.model('YourModel', schema);
```

### 2. Route Definition Pattern

```javascript
// routes/yourRoute.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as controller from '../controllers/yourController.js';

const router = express.Router();

// Public route
router.post('/', controller.create);

// Protected route
router.get('/:id', authenticate, controller.getOne);

// Admin-only route
router.delete('/:id', authenticate, authorize('admin'), controller.delete);

export default router;
```

### 3. Controller Pattern

```javascript
// controllers/yourController.js
import YourModel from '../models/YourModel.js';
import logger from '../utils/logger.js';
import { sendEmail } from '../services/emailService.js';

export const create = async (req, res) => {
  try {
    // 1. Validate input
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name is required' 
      });
    }
    
    // 2. Create document
    const item = new YourModel({
      name,
      description,
      userId: req.user.id
    });
    
    // 3. Save to database
    await item.save();
    
    // 4. Perform side effects
    await sendEmail(
      req.user.email,
      'Item Created',
      `Your item "${name}" was created successfully`
    );
    
    // 5. Log action
    logger.info(`Item created by ${req.user.id}`);
    
    // 6. Return response
    res.status(201).json({
      success: true,
      message: 'Item created',
      item
    });
    
  } catch (error) {
    logger.error('Create error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getOne = async (req, res) => {
  try {
    const item = await YourModel.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const list = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    
    const result = await YourModel.paginate(
      { userId: req.user.id },
      { page: parseInt(page), limit: parseInt(limit), sort }
    );
    
    res.json({
      success: true,
      items: result.docs,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.totalDocs,
        pages: result.totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### 4. Service Pattern

```javascript
// services/emailService.js
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
      attachments
    });
    
    logger.info(`Email sent to ${to}`);
    return info;
  } catch (error) {
    logger.error(`Email error to ${to}:`, error);
    throw error;
  }
};

// Usage in any controller
import { sendEmail } from '../services/emailService.js';
await sendEmail('user@example.com', 'Subject', '<h1>Hello</h1>');
```

---

## 🔗 Model Relationships

### One-to-Many (User → Visits)

```javascript
// models/Visit.js
const visitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
});

// Query with population
const visits = await Visit.find({ userId })
  .populate('userId', 'firstName lastName email');
```

### Many-to-Many (Implicit)

```javascript
// models/Visit.js
const visitSchema = new mongoose.Schema({
  contacts: [{
    name: String,
    role: String,
    phone: String
  }]
});

// Query
const visit = await Visit.findById(id);
const contacts = visit.contacts;
```

### Subdocuments with References

```javascript
// models/Request.js
const requestSchema = new mongoose.Schema({
  response: {
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date,
    message: String
  }
});

// Update subdocument
await Request.findByIdAndUpdate(
  id,
  {
    $set: {
      'response.respondedBy': adminId,
      'response.respondedAt': new Date(),
      'response.message': 'Quote approved'
    }
  }
);
```

### Indexes for Performance

```javascript
// models/Report.js
schema.index({ userId: 1, weekStart: -1 });
schema.index({ status: 1, createdAt: -1 });
schema.index({ userId: 1, isDraft: 1 });

// Text index for searching
schema.index({
  title: 'text',
  description: 'text'
});

// Query using index
const reports = await Report.find(
  { $text: { $search: 'weekly' } },
  { score: { $meta: 'textScore' } }
).sort({ score: { $meta: 'textScore' } });
```

---

## 🛣️ API Development Guide

### Adding a New Endpoint

**Step 1: Create/Update Model**

```javascript
// models/Machine.js
import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  serialNumber: { type: String, unique: true },
  facility: {
    name: String,
    location: String
  },
  status: { type: String, enum: ['active', 'maintenance'] },
  lastServiceDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

machineSchema.index({ serialNumber: 1 });
export default mongoose.model('Machine', machineSchema);
```

**Step 2: Create Controller**

```javascript
// controllers/machineController.js
import Machine from '../models/Machine.js';

export const createMachine = async (req, res) => {
  try {
    const { name, serialNumber, facility, status } = req.body;
    
    const machine = new Machine({
      name,
      serialNumber,
      facility,
      status,
      createdBy: req.user.id
    });
    
    await machine.save();
    
    res.status(201).json({
      success: true,
      machine
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMachines = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const filter = status ? { status } : {};
    
    const result = await Machine.paginate(filter, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: '-createdAt',
      populate: 'createdBy'
    });
    
    res.json({
      success: true,
      machines: result.docs,
      pagination: {
        page: result.page,
        total: result.totalDocs,
        pages: result.totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

**Step 3: Create Route**

```javascript
// routes/machines.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as machineController from '../controllers/machineController.js';

const router = express.Router();

// Public route (with pagination)
router.get('/', authenticate, machineController.getMachines);

// Protected route
router.post('/', authenticate, authorize('admin', 'manager'), 
  machineController.createMachine);

export default router;
```

**Step 4: Mount Route in server.js**

```javascript
// In /project/src/server.js
import machinesRoutes from './routes/machines.js';

// Mount at appropriate point
app.use('/api/machines', machinesRoutes);
```

### Response Format Convention

```javascript
// Success response
{
  success: true,
  message: 'Operation successful',
  data: { /* actual data */ },
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    pages: 10
  }
}

// Error response
{
  success: false,
  message: 'Description of what went wrong',
  error: 'Error type'
}
```

---

## 🧪 Testing & Debugging

### Using Logger

```javascript
import logger from '../utils/logger.js';

// Different log levels
logger.info('User registered: ' + userId);
logger.warn('Rate limit approaching for: ' + ip);
logger.error('Database connection failed:', error);

// Logs appear in /project/logs/
```

### Using Postman

```bash
1. Set base URL: http://localhost:5000

2. Login to get token:
   POST /api/auth/login
   {
     "email": "admin@example.com",
     "password": "password"
   }

3. Copy token from response

4. Use in subsequent requests:
   Authorization: Bearer <token>
   
5. Test endpoint:
   GET /api/dashboard
```

### Debugging Database Queries

```javascript
// Enable Mongoose logging
mongoose.set('debug', true);

// Or manually log queries
const result = await User.find({});
console.log('Query result:', result);
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check token in Authorization header |
| 403 Forbidden | Check user role matches required role |
| 400 Bad Request | Log req.body and check required fields |
| 404 Not Found | Check document ID exists in database |
| 500 Server Error | Check server logs in /project/logs/ |
| Rate Limited | Wait 15 minutes or clear IP in Redis |

---

## 🚀 Deployment Checklist

- [ ] All environment variables set in `.env`
- [ ] MongoDB connection working
- [ ] Email credentials valid
- [ ] Cloudinary account configured
- [ ] JWT secrets set and secure
- [ ] Rate limiting configured
- [ ] CORS origins whitelisted
- [ ] Error logging enabled
- [ ] Database indexes created
- [ ] Tests passing
- [ ] Dependencies installed
- [ ] Server starts without errors

---

**This guide should give you everything needed to develop features in ACCORD Backend.**

**For more detailed information, see:**
- `PROJECT_FULL_UNDERSTANDING.md` - Complete project overview
- `DOCUMENTATIONS/PROJECT_COMPREHENSIVE_ANALYSIS.md` - Deep technical dive
- Specific route/controller/model files in `/project/src/`
