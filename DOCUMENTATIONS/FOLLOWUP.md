# Follow-up Visit Backend API Documentation

## Overview
This document provides comprehensive specifications for implementing the Follow-up Visit feature in the backend API. This feature allows sales users to record details of follow-up visits with clients, track outcomes, and determine if additional follow-ups are needed.

## API Endpoints

### Base URL
```
https://app.codewithseth.co.ke/api
```

### Authentication
All endpoints require JWT Bearer token authentication:
```
Authorization: Bearer <access_token>
```

---

## 1. Get Follow-up Visits (List)

### Endpoint
```
GET /follow-up-visits
```

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 50) |
| needAnotherFollowUp | boolean | No | Filter by follow-up required status |
| startDate | string (ISO date) | No | Filter visits from this date |
| endDate | string (ISO date) | No | Filter visits until this date |
| userId | string | No | Filter by user ID (admin only) |

### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f7a2c9e3b1c8d5f6e9a1b2",
      "userId": "64f7a2c9e3b1c8d5f6e9a1b3",
      "user": {
        "_id": "64f7a2c9e3b1c8d5f6e9a1b3",
        "fullName": "John Doe",
        "email": "john@example.com"
      },
      "followUpDate": "2024-01-15",
      "reason": "Follow up on quotation for X-ray machine",
      "outcome": "Client approved the quotation. Waiting for procurement approval from finance department.",
      "needAnotherFollowUp": true,
      "whyAnotherFollowUp": "Need to confirm procurement approval status and delivery timeline preferences",
      "whyNoMoreFollowUp": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 45,
  "page": 1,
  "totalPages": 1
}
```

### Status Codes
- `200 OK` - Success
- `401 Unauthorized` - Invalid or missing token
- `500 Internal Server Error` - Server error

---

## 2. Create Follow-up Visit

### Endpoint
```
POST /follow-up-visits
```

### Request Body
```json
{
  "followUpDate": "2024-01-15",
  "reason": "Follow up on quotation for X-ray machine",
  "outcome": "Client approved the quotation. Waiting for procurement approval from finance department.",
  "needAnotherFollowUp": true,
  "whyAnotherFollowUp": "Need to confirm procurement approval status and delivery timeline preferences",
  "whyNoMoreFollowUp": null
}
```

### Field Specifications
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| followUpDate | string (ISO date) | Yes | Date of the follow-up visit (YYYY-MM-DD) |
| reason | string | Yes | Reason for scheduling the follow-up visit |
| outcome | string | Yes | Description of what happened during the visit |
| needAnotherFollowUp | boolean | Yes | Whether another follow-up is required |
| whyAnotherFollowUp | string | Conditional | Required if needAnotherFollowUp is true |
| whyNoMoreFollowUp | string | Conditional | Required if needAnotherFollowUp is false |

### Response
```json
{
  "success": true,
  "message": "Follow-up visit recorded successfully",
  "data": {
    "_id": "64f7a2c9e3b1c8d5f6e9a1b2",
    "userId": "64f7a2c9e3b1c8d5f6e9a1b3",
    "followUpDate": "2024-01-15",
    "reason": "Follow up on quotation for X-ray machine",
    "outcome": "Client approved the quotation. Waiting for procurement approval from finance department.",
    "needAnotherFollowUp": true,
    "whyAnotherFollowUp": "Need to confirm procurement approval status and delivery timeline preferences",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Status Codes
- `201 Created` - Follow-up visit created successfully
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Invalid or missing token
- `500 Internal Server Error` - Server error

### Validation Rules
1. `followUpDate` must be a valid date in YYYY-MM-DD format
2. `followUpDate` cannot be in the future
3. `reason` must be at least 10 characters
4. `outcome` must be at least 10 characters
5. If `needAnotherFollowUp` is `true`, `whyAnotherFollowUp` is required and must be at least 10 characters
6. If `needAnotherFollowUp` is `false`, `whyNoMoreFollowUp` is required and must be at least 10 characters

---

## 3. Update Follow-up Visit

### Endpoint
```
PUT /follow-up-visits/:id
```

### Path Parameters
- `id` (string, required) - Follow-up visit ID

### Request Body
Same as Create Follow-up Visit endpoint. All fields are optional for updates.

```json
{
  "outcome": "Updated outcome: Finance department approved. Delivery scheduled for next month.",
  "needAnotherFollowUp": true,
  "whyAnotherFollowUp": "Need to follow up on delivery date confirmation and installation requirements"
}
```

### Response
```json
{
  "success": true,
  "message": "Follow-up visit updated successfully",
  "data": {
    "_id": "64f7a2c9e3b1c8d5f6e9a1b2",
    "userId": "64f7a2c9e3b1c8d5f6e9a1b3",
    "followUpDate": "2024-01-15",
    "reason": "Follow up on quotation for X-ray machine",
    "outcome": "Updated outcome: Finance department approved. Delivery scheduled for next month.",
    "needAnotherFollowUp": true,
    "whyAnotherFollowUp": "Need to follow up on delivery date confirmation and installation requirements",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T14:20:00.000Z"
  }
}
```

### Status Codes
- `200 OK` - Update successful
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User not authorized to update this follow-up visit
- `404 Not Found` - Follow-up visit not found
- `500 Internal Server Error` - Server error

---

## 4. Delete Follow-up Visit

### Endpoint
```
DELETE /follow-up-visits/:id
```

### Path Parameters
- `id` (string, required) - Follow-up visit ID

### Response
```json
{
  "success": true,
  "message": "Follow-up visit deleted successfully"
}
```

### Status Codes
- `200 OK` - Delete successful
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User not authorized to delete this follow-up visit
- `404 Not Found` - Follow-up visit not found
- `500 Internal Server Error` - Server error

---

## Data Model

### FollowUpVisit Schema (MongoDB/Mongoose)

```javascript
const mongoose = require('mongoose');

const followUpVisitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  followUpDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        // Cannot be in the future
        return value <= new Date();
      },
      message: 'Follow-up date cannot be in the future'
    }
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    minlength: [10, 'Reason must be at least 10 characters']
  },
  outcome: {
    type: String,
    required: true,
    trim: true,
    minlength: [10, 'Outcome must be at least 10 characters']
  },
  needAnotherFollowUp: {
    type: Boolean,
    required: true
  },
  whyAnotherFollowUp: {
    type: String,
    trim: true,
    minlength: [10, 'Explanation must be at least 10 characters'],
    required: function() {
      return this.needAnotherFollowUp === true;
    }
  },
  whyNoMoreFollowUp: {
    type: String,
    trim: true,
    minlength: [10, 'Explanation must be at least 10 characters'],
    required: function() {
      return this.needAnotherFollowUp === false;
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
followUpVisitSchema.index({ userId: 1, followUpDate: -1 });
followUpVisitSchema.index({ needAnotherFollowUp: 1 });
followUpVisitSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FollowUpVisit', followUpVisitSchema);
```

---

## Sample Implementation

### Controller Example (Node.js/Express)

```javascript
const FollowUpVisit = require('../models/FollowUpVisit');

// Get all follow-up visits
exports.getFollowUpVisits = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      needAnotherFollowUp,
      startDate,
      endDate,
      userId
    } = req.query;

    const query = {};

    // Filter by user (only own visits unless admin)
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }

    // Filter by follow-up status
    if (needAnotherFollowUp !== undefined) {
      query.needAnotherFollowUp = needAnotherFollowUp === 'true';
    }

    // Filter by date range
    if (startDate || endDate) {
      query.followUpDate = {};
      if (startDate) query.followUpDate.$gte = new Date(startDate);
      if (endDate) query.followUpDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [visits, total] = await Promise.all([
      FollowUpVisit.find(query)
        .populate('userId', 'fullName email')
        .sort({ followUpDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      FollowUpVisit.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: visits,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching follow-up visits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch follow-up visits',
      error: error.message
    });
  }
};

// Create follow-up visit
exports.createFollowUpVisit = async (req, res) => {
  try {
    const {
      followUpDate,
      reason,
      outcome,
      needAnotherFollowUp,
      whyAnotherFollowUp,
      whyNoMoreFollowUp
    } = req.body;

    // Validation
    if (!followUpDate || !reason || !outcome || needAnotherFollowUp === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate conditional fields
    if (needAnotherFollowUp && !whyAnotherFollowUp) {
      return res.status(400).json({
        success: false,
        message: 'Please explain why another follow-up is needed'
      });
    }

    if (!needAnotherFollowUp && !whyNoMoreFollowUp) {
      return res.status(400).json({
        success: false,
        message: 'Please explain why no more follow-up is needed'
      });
    }

    // Create follow-up visit
    const followUpVisit = new FollowUpVisit({
      userId: req.user._id,
      followUpDate,
      reason,
      outcome,
      needAnotherFollowUp,
      ...(needAnotherFollowUp ? { whyAnotherFollowUp } : { whyNoMoreFollowUp })
    });

    await followUpVisit.save();

    res.status(201).json({
      success: true,
      message: 'Follow-up visit recorded successfully',
      data: followUpVisit
    });
  } catch (error) {
    console.error('Error creating follow-up visit:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create follow-up visit',
      error: error.message
    });
  }
};

// Update follow-up visit
exports.updateFollowUpVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the follow-up visit
    const followUpVisit = await FollowUpVisit.findById(id);

    if (!followUpVisit) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up visit not found'
      });
    }

    // Check authorization (user can only update own visits unless admin)
    if (req.user.role !== 'admin' && followUpVisit.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this follow-up visit'
      });
    }

    // Validate conditional fields if needAnotherFollowUp is being updated
    if (updateData.needAnotherFollowUp !== undefined) {
      if (updateData.needAnotherFollowUp && !updateData.whyAnotherFollowUp) {
        return res.status(400).json({
          success: false,
          message: 'Please explain why another follow-up is needed'
        });
      }
      if (!updateData.needAnotherFollowUp && !updateData.whyNoMoreFollowUp) {
        return res.status(400).json({
          success: false,
          message: 'Please explain why no more follow-up is needed'
        });
      }
    }

    // Update the follow-up visit
    Object.assign(followUpVisit, updateData);
    await followUpVisit.save();

    res.status(200).json({
      success: true,
      message: 'Follow-up visit updated successfully',
      data: followUpVisit
    });
  } catch (error) {
    console.error('Error updating follow-up visit:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update follow-up visit',
      error: error.message
    });
  }
};

// Delete follow-up visit
exports.deleteFollowUpVisit = async (req, res) => {
  try {
    const { id } = req.params;

    const followUpVisit = await FollowUpVisit.findById(id);

    if (!followUpVisit) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up visit not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && followUpVisit.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this follow-up visit'
      });
    }

    await followUpVisit.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Follow-up visit deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting follow-up visit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete follow-up visit',
      error: error.message
    });
  }
};
```

### Routes Example

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const followUpVisitController = require('../controllers/followUpVisitController');

// All routes require authentication
router.use(authenticate);

router.get('/', followUpVisitController.getFollowUpVisits);
router.post('/', followUpVisitController.createFollowUpVisit);
router.put('/:id', followUpVisitController.updateFollowUpVisit);
router.delete('/:id', followUpVisitController.deleteFollowUpVisit);

module.exports = router;
```

### Main App Integration

```javascript
const followUpVisitRoutes = require('./routes/followUpVisitRoutes');

app.use('/api/follow-up-visits', followUpVisitRoutes);
```

---

## Testing

### Sample cURL Commands

#### Create Follow-up Visit
```bash
curl -X POST https://app.codewithseth.co.ke/api/follow-up-visits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "followUpDate": "2024-01-15",
    "reason": "Follow up on quotation for X-ray machine",
    "outcome": "Client approved the quotation. Waiting for procurement approval.",
    "needAnotherFollowUp": true,
    "whyAnotherFollowUp": "Need to confirm procurement approval status"
  }'
```

#### Get Follow-up Visits
```bash
curl -X GET "https://app.codewithseth.co.ke/api/follow-up-visits?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update Follow-up Visit
```bash
curl -X PUT https://app.codewithseth.co.ke/api/follow-up-visits/64f7a2c9e3b1c8d5f6e9a1b2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "outcome": "Finance approved. Delivery scheduled for next month.",
    "needAnotherFollowUp": false,
    "whyNoMoreFollowUp": "Deal closed successfully"
  }'
```

#### Delete Follow-up Visit
```bash
curl -X DELETE https://app.codewithseth.co.ke/api/follow-up-visits/64f7a2c9e3b1c8d5f6e9a1b2 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Analytics & Reporting

### Suggested Additional Endpoints

#### Get Follow-up Statistics
```
GET /follow-up-visits/statistics
```

Response:
```json
{
  "success": true,
  "data": {
    "totalFollowUps": 45,
    "needingFollowUp": 23,
    "completed": 22,
    "thisMonth": 12,
    "thisWeek": 5,
    "conversionRate": 48.9
  }
}
```

#### Get Follow-up by Date Range
```
GET /follow-up-visits/by-date?startDate=2024-01-01&endDate=2024-01-31
```

---

## Notes for Backend Implementation

1. **User Association**: Always associate follow-up visits with the authenticated user's ID
2. **Date Validation**: Ensure follow-up date is not in the future
3. **Conditional Validation**: Implement proper validation for conditional fields (whyAnotherFollowUp vs whyNoMoreFollowUp)
4. **Indexes**: Create database indexes on userId, followUpDate, and needAnotherFollowUp for better query performance
5. **Soft Delete**: Consider implementing soft delete instead of hard delete to maintain audit trail
6. **Notifications**: Consider implementing notifications for follow-ups that need action
7. **Analytics**: Implement analytics endpoints to track follow-up conversion rates
8. **Export**: Consider adding CSV/Excel export functionality for reporting

---

## Frontend Implementation Reference

The frontend implementation includes:
- **Component**: `components/visits/followup-visit-form.tsx` - Form for creating follow-up visits
- **API Methods**: `lib/api.ts` - Methods for CRUD operations on follow-up visits
- **Offline Support**: `lib/offline-storage.ts` - Caching and sync queue for offline functionality
- **Integration**: `components/visits/visit-management.tsx` - Routing and state management
- **UI**: `components/visits/visit-list.tsx` - Follow-up button in visit list

---

## Version History

- **v1.0** (2024-01-15): Initial API specification

## Implementation status (code added)

I implemented the Follow-up Visits backend feature and wired it into the API.

Files added/updated:

- `project/src/models/FollowUpVisit.js` — Mongoose model implementing the `FollowUpVisit` schema described above (conditional validation, indexes).
- `project/src/models/Visit.js` — (updated) added `followUpVisits` array (references to `FollowUpVisit`) so follow-ups are attached to the visit record.
- `project/src/routes/follow-up-visits.js` — CRUD endpoints for follow-up visits mounted at `/api/follow-up-visits`:
  - POST `/api/follow-up-visits` — create a follow-up and attach it to a visit (updates `visit.followUpVisits` and `visit.isFollowUpRequired`)
  - GET `/api/follow-up-visits` — list follow-up visits (user-scoped or admin)
  - GET `/api/follow-up-visits/:id` — get a single follow-up visit
  - PUT `/api/follow-up-visits/:id` — update (owner or admin)
  - DELETE `/api/follow-up-visits/:id` — delete (owner or admin) and remove reference from visit

Notes and next steps:
- Conditional validation is performed both in the Mongoose model and in the route handlers for clearer error messages.
- The route updates `Visit.isFollowUpRequired` based on the follow-up's `needAnotherFollowUp` flag.
- Consider adding unit/integration tests (jest + supertest) for these endpoints.
- Consider sending notifications (email/push) when follow-ups are created or when `needAnotherFollowUp` is true.

