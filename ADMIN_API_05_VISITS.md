# Admin API - Visits Management

**Version:** 1.0  
**Last Updated:** January 3, 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Get Daily Activities](#get-daily-activities)
3. [Get User Visits](#get-user-visits)
4. [Get Visit Summary](#get-visit-summary)
5. [Get Visit Details](#get-visit-details)
6. [Delete Visit](#delete-visit)
7. [Examples](#examples)

---

## Overview

Visits management endpoints allow admins to monitor customer visits made by sales representatives and engineers.

**Base Path**: `/api/admin/visits`  
**Required Role**: `admin` or `manager`  
**Authentication**: Required (Bearer Token)

---

## Get Daily Activities

Retrieve all visits for a specific date with user information.

### Endpoint

```http
GET /api/admin/visits/daily/:date
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | string | Yes | Date in YYYY-MM-DD format |

### Response

```json
{
  "success": true,
  "data": {
    "date": "2026-01-06",
    "totalVisits": 12,
    "visits": [
      {
        "_id": "visit001",
        "userId": {
          "_id": "user789",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@accordmedical.co.ke",
          "employeeId": "SALES001",
          "phone": "+254712345678"
        },
        "date": "2026-01-06T08:00:00.000Z",
        "client": {
          "type": "hospital",
          "name": "Nairobi General Hospital",
          "location": "Nairobi CBD",
          "phone": "+254700111222",
          "email": "info@ngh.co.ke"
        },
        "visitPurpose": "sales",
        "visitOutcome": "successful",
        "totalPotentialValue": 1200000,
        "isFollowUpRequired": true,
        "contacts": [
          {
            "name": "Dr. Jane Smith",
            "role": "procurement",
            "phone": "+254711222333",
            "email": "jane.smith@ngh.co.ke",
            "department": "Procurement",
            "priority": "high"
          }
        ],
        "requestedEquipment": [
          {
            "name": "Digital X-Ray System",
            "quantity": 1,
            "estimatedBudget": 1200000
          }
        ],
        "createdAt": "2026-01-06T16:00:00.000Z"
      }
    ],
    "byOutcome": {
      "successful": 8,
      "pending": 2,
      "followup_required": 2,
      "no_interest": 0
    },
    "byPurpose": {
      "sales": 7,
      "demo": 2,
      "followup": 2,
      "installation": 1
    },
    "totalPotentialValue": 8500000
  }
}
```

### Example Requests

```bash
# Get today's visits
curl -X GET "https://app.codewithseth.co.ke/api/admin/visits/daily/2026-01-06" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Get User Visits

Retrieve all visits for a specific user with pagination and filtering.

### Endpoint

```http
GET /api/admin/visits/user/:userId
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User MongoDB ObjectId |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Results per page (default: 20) |
| startDate | string | No | Filter from date (ISO format) |
| endDate | string | No | Filter until date (ISO format) |
| purpose | string | No | Filter: demo, followup, installation, maintenance, consultation, sales, other |
| outcome | string | No | Filter: successful, pending, followup_required, no_interest |

### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user789",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@accordmedical.co.ke",
      "employeeId": "SALES001"
    },
    "visits": {
      "docs": [ /* Visit objects */ ],
      "totalDocs": 45,
      "limit": 20,
      "page": 1,
      "totalPages": 3
    },
    "statistics": {
      "total": 45,
      "thisMonth": 12,
      "byOutcome": {
        "successful": 32,
        "pending": 8,
        "followup_required": 5,
        "no_interest": 0
      },
      "byPurpose": {
        "sales": 28,
        "demo": 7,
        "followup": 6,
        "installation": 2,
        "maintenance": 1,
        "consultation": 1
      },
      "totalPotentialValue": 15500000
    }
  }
}
```

### Example Requests

```bash
# Get all visits for user
curl -X GET "https://app.codewithseth.co.ke/api/admin/visits/user/user789" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get successful sales visits
curl -X GET "https://app.codewithseth.co.ke/api/admin/visits/user/user789?purpose=sales&outcome=successful" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get visits in date range
curl -X GET "https://app.codewithseth.co.ke/api/admin/visits/user/user789?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Get Visit Summary

Get aggregated summary statistics for all visits or filtered by date range.

### Endpoint

```http
GET /api/admin/visits/summary
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Filter from date (ISO format) |
| endDate | string | No | Filter until date (ISO format) |
| userId | string | No | Filter by specific user |

### Response

```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2026-01-01T00:00:00.000Z",
      "end": "2026-01-31T23:59:59.999Z"
    },
    "totalVisits": 156,
    "byOutcome": {
      "successful": 98,
      "pending": 32,
      "followup_required": 20,
      "no_interest": 6
    },
    "byPurpose": {
      "sales": 85,
      "demo": 28,
      "followup": 24,
      "installation": 10,
      "maintenance": 5,
      "consultation": 3,
      "other": 1
    },
    "byClientType": {
      "hospital": 102,
      "clinic": 35,
      "pharmacy": 12,
      "diagnostic_center": 7
    },
    "totalPotentialValue": 42500000,
    "averagePotentialValue": 272436,
    "topPerformers": [
      {
        "userId": "user789",
        "name": "John Doe",
        "totalVisits": 45,
        "successfulVisits": 32,
        "potentialValue": 15500000
      },
      {
        "userId": "user456",
        "name": "Mary Johnson",
        "totalVisits": 38,
        "successfulVisits": 28,
        "potentialValue": 12200000
      }
    ],
    "visitsByDate": [
      {
        "date": "2026-01-06",
        "count": 12,
        "potentialValue": 3200000
      },
      {
        "date": "2026-01-05",
        "count": 10,
        "potentialValue": 2800000
      }
    ]
  }
}
```

### Example Requests

```bash
# Get monthly summary
curl -X GET "https://app.codewithseth.co.ke/api/admin/visits/summary?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get summary for specific user
curl -X GET "https://app.codewithseth.co.ke/api/admin/visits/summary?userId=user789" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Get Visit Details

Retrieve comprehensive details for a single visit.

### Endpoint

```http
GET /api/admin/visits/:id
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Visit MongoDB ObjectId |

### Response

```json
{
  "success": true,
  "data": {
    "_id": "visit001",
    "userId": {
      "_id": "user789",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@accordmedical.co.ke",
      "employeeId": "SALES001",
      "phone": "+254712345678",
      "department": "sales"
    },
    "date": "2026-01-06T08:00:00.000Z",
    "client": {
      "type": "hospital",
      "name": "Nairobi General Hospital",
      "location": "Nairobi CBD, Kenyatta Avenue",
      "phone": "+254700111222",
      "email": "info@ngh.co.ke",
      "facilityCode": "NGH001"
    },
    "visitPurpose": "sales",
    "visitOutcome": "successful",
    "contacts": [
      {
        "name": "Dr. Jane Smith",
        "role": "procurement",
        "phone": "+254711222333",
        "email": "jane.smith@ngh.co.ke",
        "department": "Procurement",
        "notes": "Decision maker for capital equipment. Prefers email communication.",
        "followUpRequired": true,
        "followUpDate": "2026-01-15T00:00:00.000Z",
        "priority": "high"
      },
      {
        "name": "Dr. Peter Kamau",
        "role": "technical",
        "phone": "+254722333444",
        "email": "peter.kamau@ngh.co.ke",
        "department": "Radiology",
        "notes": "Head of radiology. Technical specifications approval required.",
        "followUpRequired": false,
        "priority": "medium"
      }
    ],
    "existingEquipment": [
      {
        "name": "X-Ray Machine",
        "model": "GE 500",
        "brand": "GE Healthcare",
        "quantity": 2,
        "condition": "fair",
        "yearInstalled": 2018,
        "lastServiceDate": "2025-11-15T00:00:00.000Z",
        "serviceHistory": "Regular maintenance. One unit showing age.",
        "needsReplacement": true
      }
    ],
    "requestedEquipment": [
      {
        "name": "Digital X-Ray System",
        "model": "Siemens DX-5000",
        "brand": "Siemens",
        "quantity": 1,
        "estimatedBudget": 1200000,
        "currency": "KES",
        "expectedPurchasePeriod": "Q2 2026",
        "urgency": "high",
        "specifications": "Digital system with PACS integration. Min 500mA output."
      }
    ],
    "totalPotentialValue": 1200000,
    "notes": "Hospital is expanding radiology department. Budget pre-approved by board. Current equipment 8 years old and showing wear. Strong interest in modernization.",
    "observations": "Well-maintained facility. Professional staff. Existing relationship with GE but open to other brands. Price-conscious but prioritizing quality.",
    "isFollowUpRequired": true,
    "nextSteps": "Send quotation by Jan 10. Schedule demo for Jan 20. Follow up with Dr. Smith weekly.",
    "attachments": [
      {
        "type": "image",
        "url": "https://res.cloudinary.com/.../existing-equipment.jpg",
        "description": "Photo of current X-Ray room"
      },
      {
        "type": "document",
        "url": "https://res.cloudinary.com/.../requirements.pdf",
        "description": "Technical requirements document"
      }
    ],
    "location": {
      "type": "Point",
      "coordinates": [-1.2864, 36.8172]
    },
    "createdAt": "2026-01-06T16:00:00.000Z",
    "updatedAt": "2026-01-06T16:00:00.000Z"
  }
}
```

### Example Request

```bash
curl -X GET "https://app.codewithseth.co.ke/api/admin/visits/visit001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Delete Visit

Delete a visit record (admin only).

### Endpoint

```http
DELETE /api/admin/visits/:id
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Visit MongoDB ObjectId |

### Response

**Success (200 OK)**

```json
{
  "success": true,
  "message": "Visit deleted successfully"
}
```

**Error Responses**

**404 Not Found**
```json
{
  "success": false,
  "message": "Visit not found"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "Only admins can delete visits"
}
```

### Example Request

```bash
curl -X DELETE "https://app.codewithseth.co.ke/api/admin/visits/visit001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Visit Fields Reference

### Visit Purpose Options
- `demo` - Product demonstration
- `followup` - Follow-up visit
- `installation` - Equipment installation
- `maintenance` - Service/maintenance
- `consultation` - Technical consultation
- `sales` - Sales meeting
- `other` - Other purpose

### Visit Outcome Options
- `successful` - Productive visit with next steps
- `pending` - Awaiting further action
- `followup_required` - Needs follow-up visit
- `no_interest` - No immediate interest

### Client Types
- `hospital` - Hospital facility
- `clinic` - Clinic/health center
- `pharmacy` - Pharmacy
- `diagnostic_center` - Diagnostic/imaging center

### Contact Roles
- `procurement` - Procurement/purchasing officer
- `technical` - Technical/engineering staff
- `finance` - Finance/accounts staff
- `management` - Management/executive
- `clinical` - Clinical/medical staff

---

## Examples

### JavaScript/Axios

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://app.codewithseth.co.ke/api',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Get daily activities
async function getDailyActivities(date) {
  const response = await api.get(`/admin/visits/daily/${date}`);
  return response.data;
}

// Get user visits
async function getUserVisits(userId, filters = {}) {
  const response = await api.get(`/admin/visits/user/${userId}`, {
    params: {
      page: filters.page || 1,
      limit: filters.limit || 20,
      startDate: filters.startDate,
      endDate: filters.endDate,
      purpose: filters.purpose,
      outcome: filters.outcome
    }
  });
  return response.data;
}

// Get visit summary
async function getVisitSummary(startDate, endDate, userId = null) {
  const params = { startDate, endDate };
  if (userId) params.userId = userId;
  
  const response = await api.get('/admin/visits/summary', { params });
  return response.data;
}

// Get visit details
async function getVisitDetails(visitId) {
  const response = await api.get(`/admin/visits/${visitId}`);
  return response.data;
}

// Delete visit
async function deleteVisit(visitId) {
  const response = await api.delete(`/admin/visits/${visitId}`);
  return response.data;
}
```

### Python

```python
import requests
from datetime import datetime

BASE_URL = "https://app.codewithseth.co.ke/api"
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

# Get daily activities
def get_daily_activities(date):
    response = requests.get(
        f"{BASE_URL}/admin/visits/daily/{date}",
        headers=headers
    )
    return response.json()

# Get user visits
def get_user_visits(user_id, filters=None):
    params = {
        "page": 1,
        "limit": 20
    }
    if filters:
        params.update(filters)
    
    response = requests.get(
        f"{BASE_URL}/admin/visits/user/{user_id}",
        headers=headers,
        params=params
    )
    return response.json()

# Get visit summary
def get_visit_summary(start_date, end_date, user_id=None):
    params = {
        "startDate": start_date,
        "endDate": end_date
    }
    if user_id:
        params["userId"] = user_id
    
    response = requests.get(
        f"{BASE_URL}/admin/visits/summary",
        headers=headers,
        params=params
    )
    return response.json()

# Delete visit
def delete_visit(visit_id):
    response = requests.delete(
        f"{BASE_URL}/admin/visits/{visit_id}",
        headers=headers
    )
    return response.json()

# Example: Get today's visits
today = datetime.now().strftime("%Y-%m-%d")
daily_visits = get_daily_activities(today)
print(f"Total visits today: {daily_visits['data']['totalVisits']}")
```

---

## Best Practices

### Monitoring Visits

1. **Daily Review**: Check daily activities each morning
2. **Track Outcomes**: Monitor success rates and follow-up requirements
3. **Identify Trends**: Analyze visit patterns and peak days
4. **Support Team**: Provide feedback on visit quality
5. **Resource Planning**: Allocate resources based on visit data

### Data Quality

1. **Verify Details**: Check for complete contact information
2. **Equipment Info**: Ensure requested equipment is specific
3. **Budget Validation**: Verify realistic budget estimates
4. **Follow-ups**: Confirm follow-up dates are set
5. **Location Data**: Ensure GPS coordinates captured

### Performance Analysis

1. **Conversion Rates**: Track visit-to-sale conversion
2. **Potential Value**: Monitor total opportunity pipeline
3. **Response Times**: Measure follow-up timeliness
4. **Team Comparison**: Compare performance across sales reps
5. **Territory Coverage**: Ensure balanced geographic coverage

---

## Related Endpoints

- **Create Visit**: `POST /api/visits` (Sales Rep/Engineer)
- **Update Visit**: `PUT /api/visits/:id` (Sales Rep/Engineer)
- **View My Visits**: `GET /api/visits` (Sales Rep/Engineer)
- **Reports Management**: `GET /api/admin/reports`
- **Analytics Dashboard**: `GET /api/admin/analytics`

---

**[← Back to Quotations](./ADMIN_API_04_QUOTATIONS.md)** | **[Back to Index](./ADMIN_API_DOCUMENTATION_INDEX.md)** | **[Next: Leads Management →](./ADMIN_API_06_LEADS.md)**
