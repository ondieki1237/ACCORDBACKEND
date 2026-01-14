# Backend & Admin Requirements for Engineering Services

## 🚨 CRITICAL: Backend Implementation Required

The frontend engineering services implementation is **100% complete**, but it will **NOT work** until the backend implements the required API endpoints and database models.

---

## 📋 Required Backend Changes

### 1. **Database Model - Engineering Service**

Create a new MongoDB model: `EngineeringService`

```javascript
// models/EngineeringService.js
const mongoose = require('mongoose');

const engineeringServiceSchema = new mongoose.Schema({
  // Service Details
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  
  // Facility Information
  facility: {
    name: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    }
  },
  
  // Service Type
  serviceType: {
    type: String,
    enum: ['installation', 'maintenance', 'repair', 'service', 'inspection'],
    required: true
  },
  
  // Engineer Assignment
  engineerInCharge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Machine Details
  machineDetails: {
    type: String,
    required: true
  },
  
  // Service Conditions
  conditionBefore: {
    type: String,
    default: ''
  },
  conditionAfter: {
    type: String,
    default: ''
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'assigned'
  },
  
  // Notes and Additional Info
  notes: {
    type: String,
    default: ''
  },
  otherPersonnel: [{
    type: String
  }],
  
  // Next Service
  nextServiceDate: {
    type: Date
  },
  
  // Created By (Admin/Manager)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for better query performance
engineeringServiceSchema.index({ engineerInCharge: 1, status: 1 });
engineeringServiceSchema.index({ scheduledDate: 1 });

module.exports = mongoose.model('EngineeringService', engineeringServiceSchema);
```

---

### 2. **API Endpoints - Engineering Services**

Create: `routes/engineeringServices.js`

```javascript
const express = require('express');
const router = express.Router();
const EngineeringService = require('../models/EngineeringService');
const { authenticate } = require('../middleware/auth'); // Your auth middleware

// ============================================
// GET /api/engineering-services
// Get all services (with filters)
// ============================================
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      engineerId, 
      status, 
      startDate, 
      endDate,
      page = 1, 
      limit = 20 
    } = req.query;

    // Build query
    const query = {};
    
    if (engineerId) {
      query.engineerInCharge = engineerId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;
    
    // Execute query with pagination
    const services = await EngineeringService.find(query)
      .populate('engineerInCharge', 'firstName lastName email phone')
      .populate('userId', 'firstName lastName')
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalDocs = await EngineeringService.countDocuments(query);
    const totalPages = Math.ceil(totalDocs / limit);

    res.json({
      success: true,
      data: {
        docs: services,
        totalDocs,
        totalPages,
        page: parseInt(page),
        limit: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services'
    });
  }
});

// ============================================
// GET /api/engineering-services/:id
// Get single service by ID
// ============================================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const service = await EngineeringService.findById(req.params.id)
      .populate('engineerInCharge', 'firstName lastName email phone')
      .populate('userId', 'firstName lastName');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service'
    });
  }
});

// ============================================
// POST /api/engineering-services
// Create new service (Admin only)
// ============================================
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      scheduledDate,
      facility,
      serviceType,
      engineerInCharge,
      machineDetails,
      notes
    } = req.body;

    // Validate required fields
    if (!scheduledDate || !facility?.name || !facility?.location || 
        !serviceType || !engineerInCharge || !machineDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create service
    const service = new EngineeringService({
      scheduledDate,
      facility,
      serviceType,
      engineerInCharge,
      machineDetails,
      notes: notes || '',
      status: 'assigned',
      userId: req.user._id // From auth middleware
    });

    await service.save();

    // Populate engineer details
    await service.populate('engineerInCharge', 'firstName lastName email phone');

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service'
    });
  }
});

// ============================================
// PUT /api/engineering-services/:id
// Update service (Status, Reports, etc.)
// ============================================
router.put('/:id', authenticate, async (req, res) => {
  try {
    const {
      status,
      conditionBefore,
      conditionAfter,
      notes,
      otherPersonnel,
      nextServiceDate
    } = req.body;

    const service = await EngineeringService.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Update fields
    if (status) service.status = status;
    if (conditionBefore) service.conditionBefore = conditionBefore;
    if (conditionAfter) service.conditionAfter = conditionAfter;
    if (notes) service.notes = notes;
    if (otherPersonnel) service.otherPersonnel = otherPersonnel;
    if (nextServiceDate) service.nextServiceDate = nextServiceDate;

    await service.save();

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service'
    });
  }
});

// ============================================
// DELETE /api/engineering-services/:id
// Delete service (Admin only)
// ============================================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const service = await EngineeringService.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service'
    });
  }
});

module.exports = router;
```

---

### 3. **Register Routes in Main App**

In your main `app.js` or `server.js`:

```javascript
const engineeringServicesRoutes = require('./routes/engineeringServices');

// Register routes
app.use('/api/engineering-services', engineeringServicesRoutes);
```

---

### 4. **User Model - Ensure Role Field Exists**

Make sure your `User` model has a `role` field:

```javascript
// models/User.js
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ['admin', 'sales', 'engineer', 'manager'],
    default: 'sales'
  },
  phone: String,
  department: String
  // ... other fields
});
```

---

## 🎯 Admin Panel Requirements

### Option 1: **Admin API Endpoints** (Recommended)

Create admin endpoints for managing engineering services:

```javascript
// routes/admin/engineeringServices.js
const express = require('express');
const router = express.Router();
const EngineeringService = require('../../models/EngineeringService');
const User = require('../../models/User');
const { authenticate, isAdmin } = require('../../middleware/auth');

// Get all engineers (for assignment dropdown)
router.get('/engineers', authenticate, isAdmin, async (req, res) => {
  try {
    const engineers = await User.find({ 
      role: { $regex: /engineer/i } 
    }).select('firstName lastName email phone');

    res.json({
      success: true,
      data: engineers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch engineers'
    });
  }
});

// Create service (Admin)
router.post('/services', authenticate, isAdmin, async (req, res) => {
  try {
    const service = new EngineeringService({
      ...req.body,
      status: 'assigned',
      userId: req.user._id
    });

    await service.save();
    await service.populate('engineerInCharge', 'firstName lastName email phone');

    res.status(201).json({
      success: true,
      message: 'Service assigned successfully',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to assign service'
    });
  }
});

// Update service (Admin)
router.put('/services/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const service = await EngineeringService.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update service'
    });
  }
});

// Get all services with statistics
router.get('/services', authenticate, isAdmin, async (req, res) => {
  try {
    const services = await EngineeringService.find()
      .populate('engineerInCharge', 'firstName lastName email')
      .sort({ scheduledDate: -1 });

    const stats = {
      total: services.length,
      assigned: services.filter(s => s.status === 'assigned').length,
      inProgress: services.filter(s => s.status === 'in-progress').length,
      completed: services.filter(s => s.status === 'completed').length
    };

    res.json({
      success: true,
      data: {
        services,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services'
    });
  }
});

module.exports = router;
```

Register in app:
```javascript
app.use('/api/admin/engineering', require('./routes/admin/engineeringServices'));
```

---

### Option 2: **Simple Admin Web Form** (Quick Start)

Create a simple HTML form for admins to assign services:

```html
<!-- admin/assign-service.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Assign Engineering Service</title>
</head>
<body>
  <h1>Assign Engineering Service</h1>
  
  <form id="serviceForm">
    <label>Engineer:</label>
    <select id="engineer" required>
      <!-- Populated via API -->
    </select>
    
    <label>Facility Name:</label>
    <input type="text" id="facilityName" required>
    
    <label>Facility Location:</label>
    <input type="text" id="facilityLocation" required>
    
    <label>Service Type:</label>
    <select id="serviceType" required>
      <option value="installation">Installation</option>
      <option value="maintenance">Maintenance</option>
      <option value="repair">Repair</option>
      <option value="service">Service</option>
    </select>
    
    <label>Scheduled Date:</label>
    <input type="datetime-local" id="scheduledDate" required>
    
    <label>Machine Details:</label>
    <textarea id="machineDetails" required></textarea>
    
    <label>Notes (Optional):</label>
    <textarea id="notes"></textarea>
    
    <button type="submit">Assign Service</button>
  </form>

  <script>
    // Load engineers
    fetch('/api/admin/engineering/engineers', {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
      }
    })
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById('engineer');
      data.data.forEach(eng => {
        const option = document.createElement('option');
        option.value = eng._id;
        option.textContent = `${eng.firstName} ${eng.lastName}`;
        select.appendChild(option);
      });
    });

    // Submit form
    document.getElementById('serviceForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const data = {
        engineerInCharge: document.getElementById('engineer').value,
        facility: {
          name: document.getElementById('facilityName').value,
          location: document.getElementById('facilityLocation').value
        },
        serviceType: document.getElementById('serviceType').value,
        scheduledDate: document.getElementById('scheduledDate').value,
        machineDetails: document.getElementById('machineDetails').value,
        notes: document.getElementById('notes').value
      };

      const response = await fetch('/api/engineering-services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Service assigned successfully!');
        e.target.reset();
      } else {
        alert('Error: ' + result.message);
      }
    });
  </script>
</body>
</html>
```

---

## 📝 Quick Implementation Checklist

### Backend Developer Tasks:

- [ ] Create `EngineeringService` MongoDB model
- [ ] Create `/api/engineering-services` routes
- [ ] Implement GET endpoint (fetch services with filters)
- [ ] Implement GET by ID endpoint
- [ ] Implement POST endpoint (create service)
- [ ] Implement PUT endpoint (update service/reports)
- [ ] Implement DELETE endpoint (optional)
- [ ] Add authentication middleware to all routes
- [ ] Test endpoints with Postman/Thunder Client
- [ ] Deploy to production (`app.codewithseth.co.ke`)

### Admin Panel Tasks:

- [ ] Create admin endpoint to fetch engineers list
- [ ] Create admin form to assign services
- [ ] Add service type dropdown (installation/maintenance/repair)
- [ ] Add engineer selection dropdown
- [ ] Add date/time picker for scheduled date
- [ ] Test service creation from admin panel
- [ ] (Optional) Add service management dashboard

### Database Tasks:

- [ ] Ensure User model has `role` field
- [ ] Create at least one user with role = "engineer"
- [ ] Test role detection in frontend

---

## 🧪 Testing the Implementation

### 1. Create Test Engineer User
```javascript
// In MongoDB or via API
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "engineer@accord.com",
  "password": "hashedPassword",
  "role": "engineer",
  "phone": "+254712345678"
}
```

### 2. Create Test Service
```bash
POST /api/engineering-services
{
  "engineerInCharge": "engineer_user_id",
  "facility": {
    "name": "City Hospital",
    "location": "Nairobi, Kenya"
  },
  "serviceType": "maintenance",
  "scheduledDate": "2025-10-30T08:00:00Z",
  "machineDetails": "X-Ray Machine Model X500\nSerial: 12345",
  "notes": "Routine maintenance"
}
```

### 3. Test Frontend
1. Login with engineer credentials
2. Should see Engineer Dashboard
3. Navigate to "My Services"
4. Should see assigned service
5. Click service → View details
6. Click "Start Service" → Fill condition before
7. Click "Complete Service" → Fill full report

---

## 🚨 IMPORTANT NOTES

1. **Frontend is Ready**: All frontend code is complete and deployed
2. **Backend Required**: None of this will work without backend endpoints
3. **API Base URL**: Frontend is configured to use `https://app.codewithseth.co.ke/api`
4. **Authentication**: All endpoints must require JWT authentication
5. **Role Detection**: Frontend checks `user.role` field (case-insensitive)

---

## 📞 Summary

### What's Done ✅
- ✅ Frontend engineer interface
- ✅ Engineering services list component
- ✅ Service detail and report form
- ✅ Role-based navigation
- ✅ Engineer dashboard

### What's Needed 🔴
- ❌ Backend API endpoints
- ❌ Database model
- ❌ Admin panel to assign services
- ❌ Engineer users in database

**The frontend will make API calls to the backend, but will fail until the backend implements these endpoints.**

---

**Next Steps**: Share this document with your backend developer to implement the required API endpoints.
