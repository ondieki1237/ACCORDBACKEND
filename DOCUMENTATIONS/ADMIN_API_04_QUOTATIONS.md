# Admin API - Quotations Management

**Version:** 1.0  
**Last Updated:** January 3, 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [List All Quotations](#list-all-quotations)
3. [Get Quotation Details](#get-quotation-details)
4. [Respond to Quotation](#respond-to-quotation)
5. [Update Quotation Status](#update-quotation-status)
6. [Quotation Statistics](#quotation-statistics)
7. [Search Quotations](#search-quotations)
8. [Examples](#examples)

---

## Overview

Quotations management endpoints allow admins to view, respond to, and track equipment quotation requests submitted by sales representatives.

**Base Path**: `/api/admin/quotations`  
**Required Role**: `admin` or `manager`  
**Authentication**: Required (Bearer Token)

---

## List All Quotations

Retrieve paginated list of all quotation requests with advanced filtering.

### Endpoint

```http
GET /api/admin/quotations
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Results per page (default: 20) |
| status | string | No | Filter: pending, in_progress, responded, completed, rejected |
| urgency | string | No | Filter: low, medium, high |
| responded | boolean | No | Filter by response status (true/false) |
| userId | string | No | Filter by sales rep MongoDB ObjectId |
| search | string | No | Search by hospital, equipment, or contact name |
| startDate | string | No | Filter from date (ISO format) |
| endDate | string | No | Filter until date (ISO format) |

### Response

```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "quot123abc",
        "userId": {
          "_id": "user789",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@accordmedical.co.ke",
          "employeeId": "SALES001",
          "phone": "+254712345678"
        },
        "hospital": "Nairobi General Hospital",
        "equipmentRequired": "Digital X-Ray System - Siemens DX-5000",
        "contactName": "Dr. Jane Smith",
        "contactPhone": "+254711222333",
        "contactEmail": "jane.smith@ngh.co.ke",
        "urgency": "high",
        "additionalDetails": "Hospital needs installation by March 2026. Budget pre-approved.",
        "status": "pending",
        "responded": false,
        "responseDetails": null,
        "respondedBy": null,
        "respondedAt": null,
        "createdAt": "2026-01-02T16:30:00.000Z",
        "updatedAt": "2026-01-02T16:30:00.000Z"
      },
      {
        "_id": "quot456def",
        "userId": {
          "_id": "user456",
          "firstName": "Mary",
          "lastName": "Johnson",
          "email": "mary.johnson@accordmedical.co.ke",
          "employeeId": "SALES002",
          "phone": "+254723456789"
        },
        "hospital": "Kenyatta National Hospital",
        "equipmentRequired": "Ultrasound Machine - GE Voluson E10",
        "contactName": "Dr. Peter Kamau",
        "contactPhone": "+254722333444",
        "contactEmail": "peter.kamau@knh.or.ke",
        "urgency": "medium",
        "additionalDetails": "Looking for competitive pricing. Tender process in Q2 2026.",
        "status": "responded",
        "responded": true,
        "responseDetails": {
          "pricing": "KES 3,500,000 (ex-VAT)\nIncludes:\n- Equipment supply\n- Installation & commissioning\n- 1 year warranty\n- Staff training (5 users)",
          "availability": "In stock - 4-6 weeks delivery",
          "warranty": "12 months comprehensive warranty with on-site support",
          "deliveryTime": "4-6 weeks from order confirmation",
          "specifications": "https://res.cloudinary.com/.../specs.pdf",
          "additionalNotes": "Volume discount available for multiple units"
        },
        "respondedBy": {
          "_id": "admin123",
          "firstName": "Super",
          "lastName": "Admin",
          "email": "info@accordmedical.co.ke"
        },
        "respondedAt": "2026-01-03T10:15:00.000Z",
        "createdAt": "2026-01-02T14:20:00.000Z",
        "updatedAt": "2026-01-03T10:15:00.000Z"
      }
    ],
    "totalDocs": 87,
    "limit": 20,
    "page": 1,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null
  }
}
```

### Example Requests

```bash
# List all pending quotations
curl -X GET "https://app.codewithseth.co.ke/api/admin/quotations?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"

# List high urgency quotations
curl -X GET "https://app.codewithseth.co.ke/api/admin/quotations?urgency=high&responded=false" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search for X-Ray equipment quotations
curl -X GET "https://app.codewithseth.co.ke/api/admin/quotations?search=X-Ray" \
  -H "Authorization: Bearer YOUR_TOKEN"

# List quotations by sales rep
curl -X GET "https://app.codewithseth.co.ke/api/admin/quotations?userId=user789&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Get Quotation Details

Retrieve comprehensive details for a single quotation including full response history.

### Endpoint

```http
GET /api/admin/quotations/:id
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Quotation MongoDB ObjectId |

### Response

```json
{
  "success": true,
  "data": {
    "_id": "quot123abc",
    "userId": {
      "_id": "user789",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@accordmedical.co.ke",
      "employeeId": "SALES001",
      "phone": "+254712345678",
      "department": "sales"
    },
    "hospital": "Nairobi General Hospital",
    "equipmentRequired": "Digital X-Ray System - Siemens DX-5000",
    "contactName": "Dr. Jane Smith",
    "contactPhone": "+254711222333",
    "contactEmail": "jane.smith@ngh.co.ke",
    "urgency": "high",
    "additionalDetails": "Hospital needs installation by March 2026. Budget pre-approved at KES 1.2M. Current equipment is 8 years old.",
    "status": "pending",
    "responded": false,
    "responseDetails": null,
    "respondedBy": null,
    "respondedAt": null,
    "createdAt": "2026-01-02T16:30:00.000Z",
    "updatedAt": "2026-01-02T16:30:00.000Z"
  }
}
```

### Example Request

```bash
curl -X GET "https://app.codewithseth.co.ke/api/admin/quotations/quot123abc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Respond to Quotation

Submit a detailed response to a quotation request including pricing, availability, and specifications.

### Endpoint

```http
POST /api/admin/quotations/:id/respond
```

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Quotation MongoDB ObjectId |

### Request Body

```json
{
  "pricing": "KES 1,200,000 (ex-VAT)\n\nIncludes:\n- Siemens DX-5000 Digital X-Ray System\n- Installation & commissioning\n- 1 year comprehensive warranty\n- Staff training for 5 users\n- Preventive maintenance (Year 1)",
  "availability": "In stock - Delivery within 3-4 weeks",
  "warranty": "12 months comprehensive warranty with on-site support. Extended warranties available.",
  "deliveryTime": "3-4 weeks from purchase order",
  "specifications": "https://res.cloudinary.com/.../siemens-dx5000-specs.pdf",
  "additionalNotes": "Payment terms: 50% advance, 40% on delivery, 10% on commissioning. Installation will take 2-3 days."
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| pricing | string | Yes | Detailed pricing breakdown |
| availability | string | Yes | Stock availability status |
| warranty | string | Yes | Warranty terms and coverage |
| deliveryTime | string | Yes | Expected delivery timeline |
| specifications | string | No | URL to specification documents |
| additionalNotes | string | No | Additional information or terms |

### Response

**Success (200 OK)**

```json
{
  "success": true,
  "message": "Quotation response submitted successfully. Email sent to sales rep and client.",
  "data": {
    "_id": "quot123abc",
    "hospital": "Nairobi General Hospital",
    "equipmentRequired": "Digital X-Ray System - Siemens DX-5000",
    "contactName": "Dr. Jane Smith",
    "contactEmail": "jane.smith@ngh.co.ke",
    "urgency": "high",
    "status": "responded",
    "responded": true,
    "responseDetails": {
      "pricing": "KES 1,200,000 (ex-VAT)...",
      "availability": "In stock - Delivery within 3-4 weeks",
      "warranty": "12 months comprehensive warranty...",
      "deliveryTime": "3-4 weeks from purchase order",
      "specifications": "https://res.cloudinary.com/.../specs.pdf",
      "additionalNotes": "Payment terms: 50% advance..."
    },
    "respondedBy": {
      "_id": "admin123",
      "firstName": "Super",
      "lastName": "Admin",
      "email": "info@accordmedical.co.ke"
    },
    "respondedAt": "2026-01-06T11:30:00.000Z",
    "createdAt": "2026-01-02T16:30:00.000Z",
    "updatedAt": "2026-01-06T11:30:00.000Z"
  }
}
```

**Error Responses**

**400 Bad Request - Missing Fields**
```json
{
  "success": false,
  "message": "Missing required fields: pricing, availability, warranty, deliveryTime"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Quotation not found"
}
```

**409 Conflict - Already Responded**
```json
{
  "success": false,
  "message": "Quotation has already been responded to"
}
```

### Email Notifications

When quotation is responded to, emails are automatically sent to:

**Sales Rep Email:**
```
Subject: Quotation Response: [Hospital Name]

Your quotation request for [Equipment] at [Hospital] has been responded to.

View details: https://app.codewithseth.co.ke/quotations/[id]
```

**Client Email:**
```
Subject: Equipment Quotation from ACCORD Medical

Dear [Contact Name],

Thank you for your interest in [Equipment].

We are pleased to provide the following quotation:

PRICING:
[Pricing details]

AVAILABILITY:
[Availability details]

WARRANTY:
[Warranty details]

DELIVERY TIME:
[Delivery timeline]

[Additional notes]

For more information, contact: [Sales Rep Name]
Phone: [Sales Rep Phone]
Email: [Sales Rep Email]

Best regards,
ACCORD Medical Team
```

### Example Requests

```bash
# Respond to quotation
curl -X POST "https://app.codewithseth.co.ke/api/admin/quotations/quot123abc/respond" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pricing": "KES 1,200,000 (ex-VAT)\n\nIncludes:\n- Equipment\n- Installation\n- Training",
    "availability": "In stock - 3-4 weeks delivery",
    "warranty": "12 months comprehensive warranty",
    "deliveryTime": "3-4 weeks from order",
    "specifications": "https://res.cloudinary.com/.../specs.pdf",
    "additionalNotes": "Payment: 50% advance, 40% delivery, 10% commissioning"
  }'
```

---

## Update Quotation Status

Update the status of a quotation (e.g., mark as completed, rejected, or in progress).

### Endpoint

```http
PUT /api/admin/quotations/:id/status
```

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Quotation MongoDB ObjectId |

### Request Body

```json
{
  "status": "completed"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | Yes | pending, in_progress, responded, completed, rejected |

### Response

```json
{
  "success": true,
  "message": "Quotation status updated successfully",
  "data": {
    "_id": "quot123abc",
    "hospital": "Nairobi General Hospital",
    "equipmentRequired": "Digital X-Ray System",
    "status": "completed",
    "updatedAt": "2026-01-10T14:20:00.000Z"
  }
}
```

### Example Requests

```bash
# Mark as completed (deal closed)
curl -X PUT "https://app.codewithseth.co.ke/api/admin/quotations/quot123abc/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'

# Mark as in progress
curl -X PUT "https://app.codewithseth.co.ke/api/admin/quotations/quot123abc/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'

# Reject quotation
curl -X PUT "https://app.codewithseth.co.ke/api/admin/quotations/quot123abc/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "rejected"}'
```

---

## Quotation Statistics

Get comprehensive statistics about quotations.

### Endpoint

```http
GET /api/admin/quotations/statistics
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
| userId | string | No | Filter by sales rep |

### Response

```json
{
  "success": true,
  "data": {
    "total": 87,
    "byStatus": {
      "pending": 23,
      "in_progress": 15,
      "responded": 32,
      "completed": 12,
      "rejected": 5
    },
    "byUrgency": {
      "low": 18,
      "medium": 42,
      "high": 27
    },
    "responded": 44,
    "notResponded": 43,
    "averageResponseTime": "2.3 days",
    "topEquipment": [
      {
        "equipment": "X-Ray Machine",
        "count": 15
      },
      {
        "equipment": "Ultrasound Machine",
        "count": 12
      },
      {
        "equipment": "Patient Monitor",
        "count": 10
      }
    ],
    "topSalesReps": [
      {
        "userId": "user789",
        "name": "John Doe",
        "totalQuotations": 18,
        "completed": 4
      },
      {
        "userId": "user456",
        "name": "Mary Johnson",
        "totalQuotations": 15,
        "completed": 3
      }
    ],
    "recentActivity": [
      {
        "date": "2026-01-06",
        "submitted": 5,
        "responded": 3,
        "completed": 1
      },
      {
        "date": "2026-01-05",
        "submitted": 4,
        "responded": 2,
        "completed": 0
      }
    ]
  }
}
```

### Example Request

```bash
# Get overall statistics
curl -X GET "https://app.codewithseth.co.ke/api/admin/quotations/statistics" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Statistics for date range
curl -X GET "https://app.codewithseth.co.ke/api/admin/quotations/statistics?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Statistics for specific sales rep
curl -X GET "https://app.codewithseth.co.ke/api/admin/quotations/statistics?userId=user789" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Search Quotations

Advanced search across multiple fields.

### Endpoint

```http
GET /api/admin/quotations/search
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search term |
| fields | string | No | Comma-separated: hospital,equipment,contact |
| limit | number | No | Results limit (default: 20) |

### Response

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "_id": "quot123abc",
        "hospital": "Nairobi General Hospital",
        "equipmentRequired": "Digital X-Ray System",
        "contactName": "Dr. Jane Smith",
        "urgency": "high",
        "status": "pending",
        "matchField": "equipment",
        "matchScore": 0.95
      }
    ],
    "total": 8
  }
}
```

### Example Request

```bash
curl -X GET "https://app.codewithseth.co.ke/api/admin/quotations/search?q=X-Ray" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Status Workflow

```
pending → in_progress → responded → completed
                                 ↘ rejected
```

**Status Descriptions:**

| Status | Description | Action Required |
|--------|-------------|-----------------|
| pending | New quotation request | Admin needs to respond |
| in_progress | Being processed | Admin working on quote |
| responded | Quote sent to client | Awaiting client decision |
| completed | Deal closed/won | Archive |
| rejected | Lost deal | Archive |

---

## Urgency Levels

| Level | Response Time | Description |
|-------|---------------|-------------|
| high | Within 24 hours | Urgent purchase, competition |
| medium | Within 48 hours | Standard procurement |
| low | Within 1 week | Research/future planning |

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

// List high priority pending quotations
async function getHighPriorityQuotations() {
  const response = await api.get('/admin/quotations', {
    params: {
      urgency: 'high',
      responded: false,
      page: 1,
      limit: 20
    }
  });
  return response.data;
}

// Get quotation details
async function getQuotationDetails(quotId) {
  const response = await api.get(`/admin/quotations/${quotId}`);
  return response.data;
}

// Respond to quotation
async function respondToQuotation(quotId, responseData) {
  const response = await api.post(
    `/admin/quotations/${quotId}/respond`,
    {
      pricing: responseData.pricing,
      availability: responseData.availability,
      warranty: responseData.warranty,
      deliveryTime: responseData.deliveryTime,
      specifications: responseData.specifications,
      additionalNotes: responseData.additionalNotes
    }
  );
  return response.data;
}

// Update status
async function updateQuotationStatus(quotId, status) {
  const response = await api.put(
    `/admin/quotations/${quotId}/status`,
    { status }
  );
  return response.data;
}

// Get statistics
async function getQuotationStatistics(startDate, endDate) {
  const response = await api.get('/admin/quotations/statistics', {
    params: { startDate, endDate }
  });
  return response.data;
}
```

### Python

```python
import requests

BASE_URL = "https://app.codewithseth.co.ke/api"
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

# List quotations
def list_quotations(urgency=None, responded=None):
    params = {"page": 1, "limit": 20}
    if urgency:
        params["urgency"] = urgency
    if responded is not None:
        params["responded"] = str(responded).lower()
    
    response = requests.get(
        f"{BASE_URL}/admin/quotations",
        headers=headers,
        params=params
    )
    return response.json()

# Respond to quotation
def respond_to_quotation(quot_id, response_data):
    response = requests.post(
        f"{BASE_URL}/admin/quotations/{quot_id}/respond",
        headers=headers,
        json=response_data
    )
    return response.json()

# Update status
def update_quotation_status(quot_id, status):
    data = {"status": status}
    response = requests.put(
        f"{BASE_URL}/admin/quotations/{quot_id}/status",
        headers=headers,
        json=data
    )
    return response.json()
```

---

## Best Practices

### Response Guidelines

1. **Be Prompt**: Respond to high urgency quotations within 24 hours
2. **Be Detailed**: Include comprehensive pricing breakdowns
3. **Be Clear**: Specify all terms, conditions, and payment options
4. **Include Documents**: Attach specification sheets and brochures
5. **Follow Up**: Update status as deal progresses

### Pricing Format

**Good Example:**
```
KES 1,200,000 (ex-VAT)

Package Includes:
- Siemens DX-5000 Digital X-Ray System
- Installation & commissioning (2-3 days)
- Staff training for 5 users (2 days)
- 1 year comprehensive warranty
- Preventive maintenance visits (Year 1)

Payment Terms:
- 50% advance (KES 600,000)
- 40% on delivery (KES 480,000)
- 10% on commissioning (KES 120,000)

Total Investment: KES 1,200,000 + 16% VAT
```

### Status Management

1. **Track Progress**: Update status as deal moves forward
2. **Document Decisions**: Add notes for rejected quotations
3. **Monitor Response Times**: Track average time to respond
4. **Report Trends**: Identify popular equipment types
5. **Team Coordination**: Ensure sales reps follow up

---

## Related Endpoints

- **Submit Quotation**: `POST /api/quotations` (Sales Rep)
- **View My Quotations**: `GET /api/quotations` (Sales Rep)
- **Sales Analytics**: `GET /api/admin/analytics/sales`
- **Reports Management**: `GET /api/admin/reports`

---

**[← Back to Reports](./ADMIN_API_03_REPORTS.md)** | **[Back to Index](./ADMIN_API_DOCUMENTATION_INDEX.md)** | **[Next: Visits Management →](./ADMIN_API_05_VISITS.md)**
