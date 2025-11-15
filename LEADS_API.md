# Leads Management - Backend API Documentation

## Overview
This document describes the backend API endpoints and data structures required for the Leads Management feature in the ACCORD mobile application.

---

## Base URL
```
https://app.codewithseth.co.ke/api
```

---

## Authentication
All endpoints require authentication using Bearer token in the header:
```
Authorization: Bearer <access_token>
```

---

## API Endpoints

### 1. Get All Leads (List with Pagination)

**Endpoint:** `GET /leads`

**Query Parameters:**
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 20)
- Additional filter parameters (optional):
  - `facilityType` - Filter by facility type
  - `leadStatus` - Filter by lead status
  - `urgency` - Filter by urgency
  - `startDate` - Filter leads created after this date
  - `endDate` - Filter leads created before this date

**Example Request:**
```http
GET /leads?page=1&limit=20&leadStatus=new
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "lead_123456",
      "facilityName": "Nairobi General Hospital",
      "facilityType": "hospital",
      "location": "Nairobi, Kenya",
      "contactPerson": {
        "name": "Dr. Jane Smith",
        "role": "Chief Medical Officer",
        "phone": "+254712345678",
        "email": "jane.smith@hospital.com"
      },
      "facilityDetails": {
        "hospitalLevel": "level-5",
        "currentEquipment": "GE Ultrasound System, Siemens X-Ray"
      },
      "equipmentOfInterest": {
        "name": "GE Vivid E95 Ultrasound System",
        "category": "imaging",
        "quantity": 2
      },
      "budget": {
        "amount": "5000000",
        "currency": "KES"
      },
      "timeline": {
        "expectedPurchaseDate": "2025-12-15",
        "urgency": "3 months"
      },
      "competitorAnalysis": "Considering Philips and Siemens. Philips offers better pricing but longer delivery. We can offer faster delivery and better after-sales support.",
      "additionalInfo": {
        "painPoints": "Need better image quality for cardiology department",
        "notes": "Follow up in 2 weeks. Director will be back from conference."
      },
      "leadSource": "field-visit",
      "leadStatus": "new",
      "createdBy": "user_id_123",
      "createdAt": "2025-11-15T10:30:00.000Z",
      "updatedAt": "2025-11-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 2. Get Single Lead by ID

**Endpoint:** `GET /leads/:id`

**Path Parameters:**
- `id` (string, required) - Lead ID

**Example Request:**
```http
GET /leads/lead_123456
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "lead_123456",
    "facilityName": "Nairobi General Hospital",
    "facilityType": "hospital",
    "location": "Nairobi, Kenya",
    "contactPerson": {
      "name": "Dr. Jane Smith",
      "role": "Chief Medical Officer",
      "phone": "+254712345678",
      "email": "jane.smith@hospital.com"
    },
    "facilityDetails": {
      "hospitalLevel": "level-5",
      "currentEquipment": "GE Ultrasound System, Siemens X-Ray"
    },
    "equipmentOfInterest": {
      "name": "GE Vivid E95 Ultrasound System",
      "category": "imaging",
      "quantity": 2
    },
    "budget": {
      "amount": "5000000",
      "currency": "KES"
    },
    "timeline": {
      "expectedPurchaseDate": "2025-12-15",
      "urgency": "3 months"
    },
    "competitorAnalysis": "Considering Philips and Siemens. Philips offers better pricing but longer delivery. We can offer faster delivery and better after-sales support.",
    "additionalInfo": {
      "painPoints": "Need better image quality for cardiology department",
      "notes": "Follow up in 2 weeks. Director will be back from conference."
    },
    "leadSource": "field-visit",
    "leadStatus": "new",
    "createdBy": "user_id_123",
    "createdAt": "2025-11-15T10:30:00.000Z",
    "updatedAt": "2025-11-15T10:30:00.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Lead not found"
}
```

---

### 3. Create New Lead

**Endpoint:** `POST /leads`

**Request Body:**
```json
{
  "facilityName": "Nairobi General Hospital",
  "facilityType": "hospital",
  "location": "Nairobi, Kenya",
  "contactPerson": {
    "name": "Dr. Jane Smith",
    "role": "Chief Medical Officer",
    "phone": "+254712345678",
    "email": "jane.smith@hospital.com"
  },
  "facilityDetails": {
    "hospitalLevel": "level-5",
    "currentEquipment": "GE Ultrasound System, Siemens X-Ray"
  },
  "equipmentOfInterest": {
    "name": "GE Vivid E95 Ultrasound System",
    "category": "imaging",
    "quantity": 2
  },
  "budget": {
    "amount": "5000000",
    "currency": "KES"
  },
  "timeline": {
    "expectedPurchaseDate": "2025-12-15",
    "urgency": "3 months"
  },
  "competitorAnalysis": "Considering Philips and Siemens. Philips offers better pricing but longer delivery. We can offer faster delivery and better after-sales support.",
  "additionalInfo": {
    "painPoints": "Need better image quality for cardiology department",
    "notes": "Follow up in 2 weeks. Director will be back from conference."
  },
  "leadSource": "field-visit",
  "leadStatus": "new",
  "createdAt": "2025-11-15T10:30:00.000Z"
}
```

**Example Request:**
```http
POST /leads
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "facilityName": "Nairobi General Hospital",
  "facilityType": "hospital",
  ...
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": {
    "id": "lead_123456",
    "facilityName": "Nairobi General Hospital",
    "facilityType": "hospital",
    "location": "Nairobi, Kenya",
    "contactPerson": {
      "name": "Dr. Jane Smith",
      "role": "Chief Medical Officer",
      "phone": "+254712345678",
      "email": "jane.smith@hospital.com"
    },
    "facilityDetails": {
      "hospitalLevel": "level-5",
      "currentEquipment": "GE Ultrasound System, Siemens X-Ray"
    },
    "equipmentOfInterest": {
      "name": "GE Vivid E95 Ultrasound System",
      "category": "imaging",
      "quantity": 2
    },
    "budget": {
      "amount": "5000000",
      "currency": "KES"
    },
    "timeline": {
      "expectedPurchaseDate": "2025-12-15",
      "urgency": "3 months"
    },
    "competitorAnalysis": "Considering Philips and Siemens...",
    "additionalInfo": {
      "painPoints": "Need better image quality for cardiology department",
      "notes": "Follow up in 2 weeks."
    },
    "leadSource": "field-visit",
    "leadStatus": "new",
    "createdBy": "user_id_123",
    "createdAt": "2025-11-15T10:30:00.000Z",
    "updatedAt": "2025-11-15T10:30:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "facilityName": "Facility name is required",
    "contactPerson.phone": "Contact phone is required"
  }
}
```

---

### 4. Update Lead

**Endpoint:** `PUT /leads/:id`

**Path Parameters:**
- `id` (string, required) - Lead ID

**Request Body:** (Same structure as Create, all fields optional)
```json
{
  "leadStatus": "contacted",
  "additionalInfo": {
    "notes": "Called facility. Scheduled meeting for next week."
  }
}
```

**Example Request:**
```http
PUT /leads/lead_123456
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "leadStatus": "contacted",
  "additionalInfo": {
    "notes": "Called facility. Scheduled meeting for next week."
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Lead updated successfully",
  "data": {
    "id": "lead_123456",
    "facilityName": "Nairobi General Hospital",
    "leadStatus": "contacted",
    ...
    "updatedAt": "2025-11-16T14:20:00.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Lead not found"
}
```

---

### 5. Delete Lead

**Endpoint:** `DELETE /leads/:id`

**Path Parameters:**
- `id` (string, required) - Lead ID

**Example Request:**
```http
DELETE /leads/lead_123456
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Lead deleted successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Lead not found"
}
```

---

## Data Models

### Lead Schema

```typescript
{
  id: string;                    // Auto-generated unique identifier
  facilityName: string;          // Required
  facilityType: string;          // Optional: "hospital" | "clinic" | "diagnostic-center" | "laboratory" | "pharmacy" | "medical-center" | "other"
  location: string;              // Required
  
  contactPerson: {
    name: string;                // Required
    role: string;                // Optional
    phone: string;               // Required (either phone or email)
    email: string;               // Optional (either phone or email)
  };
  
  facilityDetails: {
    hospitalLevel: string;       // Optional: "level-1" | "level-2" | "level-3" | "level-4" | "level-5" | "level-6" | "private" | "other"
    currentEquipment: string;    // Optional: Text description
  };
  
  equipmentOfInterest: {
    name: string;                // Required
    category: string;            // Optional: "imaging" | "laboratory" | "surgical" | "patient-monitoring" | "diagnostic" | "life-support" | "other"
    quantity: number;            // Optional (default: 1)
  };
  
  budget: {
    amount: string;              // Optional: Numeric string (e.g., "5000000")
    currency: string;            // Optional (default: "KES"): "KES" | "USD" | "EUR"
  };
  
  timeline: {
    expectedPurchaseDate: string; // Optional: ISO date string (e.g., "2025-12-15")
    urgency: string;             // Optional: Free text (e.g., "2 days", "3 months", "ASAP")
  };
  
  competitorAnalysis: string;    // Optional: Comprehensive text field
  
  additionalInfo: {
    painPoints: string;          // Optional: Text description
    notes: string;               // Optional: Additional notes
  };
  
  leadSource: string;            // Optional (default: "field-visit"): "field-visit" | "phone-call" | "email" | "referral" | "event" | "website" | "other"
  leadStatus: string;            // Optional (default: "new"): "new" | "contacted" | "qualified" | "proposal-sent" | "negotiation" | "won" | "lost"
  
  createdBy: string;             // User ID who created the lead (auto-populated from auth token)
  createdAt: string;             // ISO timestamp (auto-generated)
  updatedAt: string;             // ISO timestamp (auto-updated)
}
```

---

## Validation Rules

### Required Fields
- `facilityName` - Must not be empty
- `contactPerson.name` - Must not be empty
- `contactPerson.phone` OR `contactPerson.email` - At least one must be provided
- `equipmentOfInterest.name` - Must not be empty

### Optional Fields
All other fields are optional and can be empty strings or null.

### Field Constraints
- `equipmentOfInterest.quantity` - Must be positive integer (minimum: 1)
- `budget.amount` - Must be numeric string (can contain commas)
- `timeline.expectedPurchaseDate` - Must be valid ISO date format if provided
- Email addresses must be valid format if provided
- Phone numbers should accept international format

---

## Enums / Dropdown Values

### Facility Type
```javascript
["hospital", "clinic", "diagnostic-center", "laboratory", "pharmacy", "medical-center", "other"]
```

### Hospital Level
```javascript
["level-1", "level-2", "level-3", "level-4", "level-5", "level-6", "private", "other"]
```

### Equipment Category
```javascript
["imaging", "laboratory", "surgical", "patient-monitoring", "diagnostic", "life-support", "other"]
```

### Currency
```javascript
["KES", "USD", "EUR"]
```

### Lead Source
```javascript
["field-visit", "phone-call", "email", "referral", "event", "website", "other"]
```

### Lead Status
```javascript
["new", "contacted", "qualified", "proposal-sent", "negotiation", "won", "lost"]
```

---

## Error Handling

### Common HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success (GET, PUT, DELETE) |
| 201 | Created (POST) |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (user doesn't have permission) |
| 404 | Not Found (lead doesn't exist) |
| 500 | Internal Server Error |

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": {
    "field": "Specific validation error"
  }
}
```

---

## Offline Support & Sync

The mobile app implements offline-first functionality:

1. **Creating Leads Offline:**
   - Leads created while offline are stored locally with a temporary ID (e.g., `offline_lead_1731672000000`)
   - These leads have a flag `_createdOffline: true`

2. **Auto-Sync When Online:**
   - When the device reconnects, leads in the pending sync queue are automatically sent to the backend
   - The app will POST these leads to `/leads` endpoint
   - Backend should handle these requests normally and return proper IDs

3. **Caching:**
   - The app caches lead data locally for offline viewing
   - When GET requests succeed, data is cached automatically

---

## Database Indexes (Recommended)

For optimal query performance, create indexes on:

```javascript
{
  createdBy: 1,              // Filter by user
  leadStatus: 1,             // Filter by status
  facilityType: 1,           // Filter by facility type
  'timeline.urgency': 1,     // Filter by urgency
  createdAt: -1              // Sort by date (descending)
}

// Compound indexes for common queries
{
  createdBy: 1,
  leadStatus: 1,
  createdAt: -1
}

// Text search index
{
  facilityName: 'text',
  location: 'text',
  'contactPerson.name': 'text',
  'equipmentOfInterest.name': 'text'
}
```

---

## Security Considerations

1. **Authorization:**
   - Users should only see/edit leads they created
   - Admins/Managers should see all leads
   - Implement role-based access control

2. **Input Sanitization:**
   - Sanitize all text inputs to prevent XSS
   - Validate phone numbers and email formats
   - Limit text field lengths

3. **Rate Limiting:**
   - Implement rate limiting on POST/PUT/DELETE endpoints
   - Recommended: 100 requests per minute per user

---

## Sample Implementation (Node.js/Express/MongoDB)

### Model (Mongoose Schema)
```javascript
const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  facilityName: { type: String, required: true },
  facilityType: { type: String },
  location: { type: String, required: true },
  
  contactPerson: {
    name: { type: String, required: true },
    role: { type: String },
    phone: { type: String },
    email: { type: String }
  },
  
  facilityDetails: {
    hospitalLevel: { type: String },
    currentEquipment: { type: String }
  },
  
  equipmentOfInterest: {
    name: { type: String, required: true },
    category: { type: String },
    quantity: { type: Number, default: 1 }
  },
  
  budget: {
    amount: { type: String },
    currency: { type: String, default: 'KES' }
  },
  
  timeline: {
    expectedPurchaseDate: { type: Date },
    urgency: { type: String }
  },
  
  competitorAnalysis: { type: String },
  
  additionalInfo: {
    painPoints: { type: String },
    notes: { type: String }
  },
  
  leadSource: { 
    type: String, 
    default: 'field-visit',
    enum: ['field-visit', 'phone-call', 'email', 'referral', 'event', 'website', 'other']
  },
  
  leadStatus: { 
    type: String, 
    default: 'new',
    enum: ['new', 'contacted', 'qualified', 'proposal-sent', 'negotiation', 'won', 'lost']
  },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

// Indexes
leadSchema.index({ createdBy: 1, leadStatus: 1, createdAt: -1 });
leadSchema.index({ facilityName: 'text', location: 'text', 'contactPerson.name': 'text' });

module.exports = mongoose.model('Lead', leadSchema);
```

### Controller Example
```javascript
// GET /leads
exports.getLeads = async (req, res) => {
  try {
    const { page = 1, limit = 20, leadStatus, facilityType } = req.query;
    const userId = req.user.id; // From auth middleware
    
    const query = { createdBy: userId };
    if (leadStatus) query.leadStatus = leadStatus;
    if (facilityType) query.facilityType = facilityType;
    
    const leads = await Lead.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
      
    const total = await Lead.countDocuments(query);
    
    res.json({
      success: true,
      data: leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /leads
exports.createLead = async (req, res) => {
  try {
    const leadData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    // Validate required fields
    if (!leadData.facilityName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Facility name is required' 
      });
    }
    
    if (!leadData.contactPerson?.name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Contact person name is required' 
      });
    }
    
    if (!leadData.contactPerson?.phone && !leadData.contactPerson?.email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Contact phone or email is required' 
      });
    }
    
    const lead = new Lead(leadData);
    await lead.save();
    
    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: lead
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /leads/:id
exports.updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const lead = await Lead.findOne({ _id: id, createdBy: userId });
    
    if (!lead) {
      return res.status(404).json({ 
        success: false, 
        error: 'Lead not found' 
      });
    }
    
    Object.assign(lead, req.body);
    await lead.save();
    
    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /leads/:id
exports.deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const lead = await Lead.findOneAndDelete({ _id: id, createdBy: userId });
    
    if (!lead) {
      return res.status(404).json({ 
        success: false, 
        error: 'Lead not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### Routes Example
```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const leadsController = require('../controllers/leads');

router.use(authenticate); // All routes require authentication

router.get('/', leadsController.getLeads);
router.get('/:id', leadsController.getLeadById);
router.post('/', leadsController.createLead);
router.put('/:id', leadsController.updateLead);
router.delete('/:id', leadsController.deleteLead);

module.exports = router;
```

---

## Implementation status (code added)

I implemented the Leads backend feature and added admin routes. Files added to the repository:

- `project/src/models/Lead.js` — Mongoose model for leads (indexes & pagination)
- `project/src/routes/leads.js` — Public endpoints for authenticated users:
  - POST `/api/leads` — create a lead (owner = authenticated user)
  - GET `/api/leads` — list leads for current user (paginated, filters supported)
  - GET `/api/leads/:id` — get a single lead (owner or admin/manager)
  - PUT `/api/leads/:id` — update a lead (owner or admin/manager)
  - DELETE `/api/leads/:id` — delete a lead (owner or admin/manager)
- `project/src/routes/admin/leads.js` — Admin/Manager endpoints:
  - GET `/api/admin/leads` — list all leads (filters & pagination)
  - GET `/api/admin/leads/:id` — get any lead
  - PUT `/api/admin/leads/:id` — update any lead
  - DELETE `/api/admin/leads/:id` — delete any lead

Status history (new)
--------------------

When a lead's `leadStatus` changes (either from the sales rep UI or via the admin panel), the backend now records the transition in a `statusHistory` array on the lead document. Each history entry has the following shape:

```json
{
  "from": "contacted",
  "to": "won",
  "changedBy": "<userId>",
  "changedAt": "2025-11-15T10:30:00.000Z",
  "note": "Optional note about the change"
}
```

This preserves the timeline of the conversation so admins can see previous states and when/how they changed (for example: "2 days ago the conversation was at 'contacted'"). An optional `statusChangeNote` may be provided when calling the update endpoint to record contextual information about the transition.

Implementation details:
- The `Lead` model includes a `statusHistory` array (see `project/src/models/Lead.js`).
- Both user and admin update endpoints push a statusHistory entry when `leadStatus` differs from the previous value. The updater's user id and timestamp are recorded.
- The current `leadStatus` field continues to represent the latest status.


These routes are wired in the server bootstrap at `project/src/server.js` so the endpoints are available when the server runs.

Notes / Safety
- Input validation is basic (server-side checks for required fields). You may want to integrate the project's existing `middleware/validation.js` patterns to reuse Joi/express-validator rules for stricter validation and consistent error responses.
- Text-search uses MongoDB text index; ensure `mongo` is configured with text indexes (they are created by the model on startup when connected).

Next steps / suggestions
- Add unit/integration tests (jest + supertest) for the happy path and authorization edge cases.
- Add request validation middleware to match the project's existing style.
- Add ACL checks / owner-only deletion policy if you want to restrict deletes to admin only.


## Testing

### Sample Test Cases

1. **Create Lead with all fields**
2. **Create Lead with only required fields**
3. **Create Lead without required fields (should fail)**
4. **Get leads for authenticated user**
5. **Get leads with pagination**
6. **Get leads with filters (status, type)**
7. **Update lead status**
8. **Delete lead**
9. **Try to access another user's lead (should fail)**
10. **Offline sync - create multiple leads while offline, then sync**

### Postman Collection
Import the collection using the examples provided above. Test all endpoints with different scenarios.

---

## Questions or Issues?

If you encounter any issues implementing the backend or need clarification on any endpoint, please refer to:

- Frontend implementation: `/components/leads/`
- API service: `/lib/api.ts` (lines containing `createLead`, `getLeads`, etc.)
- Offline storage: `/lib/offline-storage.ts`

---

**Document Version:** 1.0  
**Last Updated:** November 15, 2025  
**Frontend Version:** Leads Feature v1.0
