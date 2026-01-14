# Admin API - Leads Management

**Version:** 1.0  
**Last Updated:** January 3, 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [List All Leads](#list-all-leads)
3. [Diagnostic Check](#diagnostic-check)
4. [Count Leads](#count-leads)
5. [Get Raw Lead Data](#get-raw-lead-data)
6. [Get Lead Details](#get-lead-details)
7. [Get Lead History Timeline](#get-lead-history-timeline)
8. [Update Lead](#update-lead)
9. [Delete Lead](#delete-lead)
10. [Examples](#examples)

---

## Overview

Leads management endpoints allow admins to track, update, and analyze potential customer leads throughout the sales pipeline.

**Base Path**: `/api/admin/leads`  
**Required Role**: `admin` or `manager`  
**Authentication**: Required (Bearer Token)

---

## List All Leads

Retrieve paginated list of all leads with advanced filtering and search.

### Endpoint

```http
GET /api/admin/leads
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
| facilityType | string | No | Filter: hospital, clinic, pharmacy, diagnostic_center |
| leadStatus | string | No | Filter: new, contacted, qualified, proposal, negotiation, closed_won, closed_lost |
| urgency | string | No | Filter: low, medium, high |
| startDate | string | No | Filter from date (ISO format) |
| endDate | string | No | Filter until date (ISO format) |
| search | string | No | Text search across facility name |

### Response

```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "lead123abc",
        "facilityName": "Nairobi Medical Center",
        "facilityType": "hospital",
        "location": {
          "county": "Nairobi",
          "subCounty": "Westlands",
          "address": "Parklands Road"
        },
        "contactPerson": {
          "name": "Dr. Alice Wanjiru",
          "phone": "+254722111222",
          "email": "alice@nmc.co.ke",
          "position": "Procurement Manager"
        },
        "equipmentInterest": [
          {
            "category": "imaging",
            "specificEquipment": "Digital X-Ray System",
            "quantity": 2,
            "budget": 2400000
          }
        ],
        "timeline": {
          "expectedDecisionDate": "2026-03-15T00:00:00.000Z",
          "urgency": "high"
        },
        "leadStatus": "qualified",
        "leadSource": "referral",
        "notes": "Strong interest. Budget approved. Decision expected Q1 2026.",
        "createdBy": {
          "_id": "user789",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@accordmedical.co.ke",
          "employeeId": "SALES001"
        },
        "statusHistory": [
          {
            "from": "new",
            "to": "contacted",
            "changedBy": {
              "_id": "user789",
              "firstName": "John",
              "lastName": "Doe"
            },
            "changedAt": "2026-01-02T10:00:00.000Z",
            "note": "Initial contact made"
          }
        ],
        "createdAt": "2026-01-02T08:00:00.000Z",
        "updatedAt": "2026-01-03T14:00:00.000Z"
      }
    ],
    "totalDocs": 156,
    "limit": 20,
    "page": 1,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Example Requests

```bash
# List all high urgency leads
curl -X GET "https://app.codewithseth.co.ke/api/admin/leads?urgency=high" \
  -H "Authorization: Bearer YOUR_TOKEN"

# List qualified leads
curl -X GET "https://app.codewithseth.co.ke/api/admin/leads?leadStatus=qualified&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search for specific facility
curl -X GET "https://app.codewithseth.co.ke/api/admin/leads?search=Nairobi" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by date range and type
curl -X GET "https://app.codewithseth.co.ke/api/admin/leads?facilityType=hospital&startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Diagnostic Check

Get comprehensive diagnostic information about the lead collection.

### Endpoint

```http
GET /api/admin/leads/check
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Response

```json
{
  "success": true,
  "data": {
    "total": 156,
    "sample": [
      {
        "id": "lead123abc",
        "facilityName": "Nairobi Medical Center",
        "leadStatus": "qualified",
        "createdBy": {
          "email": "john.doe@accordmedical.co.ke",
          "firstName": "John",
          "lastName": "Doe"
        },
        "createdAt": "2026-01-02T08:00:00.000Z"
      }
    ],
    "byCreator": [
      {
        "_id": "user789",
        "count": 45
      },
      {
        "_id": "user456",
        "count": 38
      }
    ],
    "byStatus": [
      {
        "_id": "qualified",
        "count": 52
      },
      {
        "_id": "new",
        "count": 34
      },
      {
        "_id": "contacted",
        "count": 28
      }
    ]
  }
}
```

### Example Request

```bash
curl -X GET "https://app.codewithseth.co.ke/api/admin/leads/check" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Count Leads

Get count of leads matching specific filters (useful for validation).

### Endpoint

```http
GET /api/admin/leads/count
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| facilityType | string | No | Filter by facility type |
| leadStatus | string | No | Filter by lead status |
| urgency | string | No | Filter by urgency level |
| startDate | string | No | Filter from date |
| endDate | string | No | Filter until date |
| search | string | No | Text search |

### Response

```json
{
  "success": true,
  "data": {
    "count": 52
  }
}
```

### Example Requests

```bash
# Count high urgency leads
curl -X GET "https://app.codewithseth.co.ke/api/admin/leads/count?urgency=high" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Count qualified leads this month
curl -X GET "https://app.codewithseth.co.ke/api/admin/leads/count?leadStatus=qualified&startDate=2026-01-01" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Get Raw Lead Data

Retrieve raw lead documents without pagination (max 100).

### Endpoint

```http
GET /api/admin/leads/raw
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Max results (default: 100, max: 100) |
| facilityType | string | No | Filter by facility type |
| leadStatus | string | No | Filter by lead status |
| urgency | string | No | Filter by urgency |
| startDate | string | No | Filter from date |
| endDate | string | No | Filter until date |
| search | string | No | Text search |

### Response

```json
{
  "success": true,
  "data": {
    "docs": [ /* Array of lead objects */ ],
    "count": 52
  }
}
```

### Example Request

```bash
# Get 50 most recent qualified leads
curl -X GET "https://app.codewithseth.co.ke/api/admin/leads/raw?leadStatus=qualified&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Get Lead Details

Retrieve comprehensive details for a single lead.

### Endpoint

```http
GET /api/admin/leads/:id
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Lead MongoDB ObjectId |

### Response

```json
{
  "success": true,
  "data": {
    "_id": "lead123abc",
    "facilityName": "Nairobi Medical Center",
    "facilityType": "hospital",
    "location": {
      "county": "Nairobi",
      "subCounty": "Westlands",
      "ward": "Parklands",
      "address": "Parklands Road, Nairobi",
      "coordinates": {
        "type": "Point",
        "coordinates": [36.8172, -1.2864]
      }
    },
    "contactPerson": {
      "name": "Dr. Alice Wanjiru",
      "phone": "+254722111222",
      "email": "alice@nmc.co.ke",
      "position": "Procurement Manager",
      "alternativeContact": "+254733222333"
    },
    "equipmentInterest": [
      {
        "category": "imaging",
        "specificEquipment": "Digital X-Ray System",
        "quantity": 2,
        "budget": 2400000,
        "specifications": "Digital DR system with PACS integration"
      },
      {
        "category": "laboratory",
        "specificEquipment": "Chemistry Analyzer",
        "quantity": 1,
        "budget": 800000
      }
    ],
    "competitorInfo": {
      "hasCompetitors": true,
      "competitors": ["Competitor A", "Competitor B"],
      "competitorAdvantages": "Lower pricing",
      "ourAdvantages": "Better service, warranty coverage"
    },
    "timeline": {
      "expectedDecisionDate": "2026-03-15T00:00:00.000Z",
      "urgency": "high",
      "budgetApprovalStatus": "approved"
    },
    "leadStatus": "qualified",
    "leadSource": "referral",
    "notes": "Strong interest. Budget approved by board. Decision expected Q1 2026. Contact weekly for updates.",
    "attachments": [
      {
        "type": "document",
        "url": "https://res.cloudinary.com/.../requirements.pdf",
        "description": "Technical requirements document"
      }
    ],
    "createdBy": {
      "_id": "user789",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@accordmedical.co.ke",
      "employeeId": "SALES001",
      "role": "sales"
    },
    "statusHistory": [
      {
        "from": "new",
        "to": "contacted",
        "changedBy": {
          "_id": "user789",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@accordmedical.co.ke"
        },
        "changedAt": "2026-01-02T10:00:00.000Z",
        "note": "Initial contact made via phone"
      },
      {
        "from": "contacted",
        "to": "qualified",
        "changedBy": {
          "_id": "user789",
          "firstName": "John",
          "lastName": "Doe"
        },
        "changedAt": "2026-01-03T14:00:00.000Z",
        "note": "Budget confirmed, decision maker identified"
      }
    ],
    "createdAt": "2026-01-02T08:00:00.000Z",
    "updatedAt": "2026-01-03T14:00:00.000Z"
  }
}
```

### Example Request

```bash
curl -X GET "https://app.codewithseth.co.ke/api/admin/leads/lead123abc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Get Lead History Timeline

Retrieve complete status change history timeline for a lead.

### Endpoint

```http
GET /api/admin/leads/:id/history
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Lead MongoDB ObjectId |

### Response

```json
{
  "success": true,
  "data": {
    "leadId": "lead123abc",
    "facilityName": "Nairobi Medical Center",
    "currentStatus": "qualified",
    "timeline": [
      {
        "event": "created",
        "status": "new",
        "timestamp": "2026-01-02T08:00:00.000Z",
        "user": {
          "id": "user789",
          "name": "John Doe",
          "email": "john.doe@accordmedical.co.ke",
          "employeeId": "SALES001",
          "role": "sales"
        },
        "note": "Lead created"
      },
      {
        "event": "status_changed",
        "from": "new",
        "to": "contacted",
        "timestamp": "2026-01-02T10:00:00.000Z",
        "user": {
          "id": "user789",
          "name": "John Doe",
          "email": "john.doe@accordmedical.co.ke",
          "employeeId": "SALES001",
          "role": "sales"
        },
        "note": "Initial contact made via phone"
      },
      {
        "event": "status_changed",
        "from": "contacted",
        "to": "qualified",
        "timestamp": "2026-01-03T14:00:00.000Z",
        "user": {
          "id": "user789",
          "name": "John Doe",
          "email": "john.doe@accordmedical.co.ke",
          "employeeId": "SALES001",
          "role": "sales"
        },
        "note": "Budget confirmed, decision maker identified"
      }
    ]
  }
}
```

### Example Request

```bash
curl -X GET "https://app.codewithseth.co.ke/api/admin/leads/lead123abc/history" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Update Lead

Update lead information including status changes.

### Endpoint

```http
PUT /api/admin/leads/:id
```

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Lead MongoDB ObjectId |

### Request Body

```json
{
  "leadStatus": "proposal",
  "statusChangeNote": "Submitted detailed proposal with pricing",
  "notes": "Proposal includes 2 X-Ray systems and 1 Chemistry Analyzer. Total value KES 3.2M.",
  "timeline": {
    "expectedDecisionDate": "2026-02-28T00:00:00.000Z",
    "urgency": "high"
  }
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| leadStatus | string | No | new, contacted, qualified, proposal, negotiation, closed_won, closed_lost |
| statusChangeNote | string | No | Note about status change (required if changing status) |
| Any lead field | mixed | No | Any valid lead field can be updated |

### Response

```json
{
  "success": true,
  "message": "Lead updated successfully",
  "data": {
    "_id": "lead123abc",
    "facilityName": "Nairobi Medical Center",
    "leadStatus": "proposal",
    "statusHistory": [
      /* Previous history */,
      {
        "from": "qualified",
        "to": "proposal",
        "changedBy": "admin123",
        "changedAt": "2026-01-06T11:00:00.000Z",
        "note": "Submitted detailed proposal with pricing"
      }
    ],
    "updatedAt": "2026-01-06T11:00:00.000Z"
  }
}
```

### Example Requests

```bash
# Update lead status
curl -X PUT "https://app.codewithseth.co.ke/api/admin/leads/lead123abc" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leadStatus": "proposal",
    "statusChangeNote": "Submitted proposal"
  }'

# Update lead information
curl -X PUT "https://app.codewithseth.co.ke/api/admin/leads/lead123abc" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contactPerson": {
      "name": "Dr. Alice Wanjiru",
      "phone": "+254722111222",
      "email": "alice@nmc.co.ke",
      "position": "Procurement Manager"
    },
    "notes": "Updated contact information"
  }'
```

---

## Delete Lead

Delete a lead record (admin/manager only).

### Endpoint

```http
DELETE /api/admin/leads/:id
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Lead MongoDB ObjectId |

### Response

**Success (200 OK)**

```json
{
  "success": true,
  "message": "Lead deleted successfully"
}
```

**Error Responses**

**404 Not Found**
```json
{
  "success": false,
  "error": "Lead not found"
}
```

### Example Request

```bash
curl -X DELETE "https://app.codewithseth.co.ke/api/admin/leads/lead123abc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Lead Status Workflow

```
new → contacted → qualified → proposal → negotiation → closed_won
                                                     ↘ closed_lost
```

**Status Descriptions:**

| Status | Description | Next Action |
|--------|-------------|-------------|
| new | New lead, not yet contacted | Make initial contact |
| contacted | Initial contact made | Qualify the lead |
| qualified | Budget and need confirmed | Submit proposal |
| proposal | Proposal submitted | Negotiate terms |
| negotiation | Negotiating terms/pricing | Close deal |
| closed_won | Deal won, customer acquired | Fulfill order |
| closed_lost | Deal lost to competitor | Archive |

---

## Lead Fields Reference

### Facility Types
- `hospital` - Hospital facility
- `clinic` - Clinic/health center
- `pharmacy` - Pharmacy
- `diagnostic_center` - Diagnostic/imaging center

### Urgency Levels
- `low` - Long-term opportunity (6+ months)
- `medium` - Mid-term opportunity (3-6 months)
- `high` - Immediate opportunity (< 3 months)

### Lead Sources
- `referral` - Customer referral
- `website` - Website inquiry
- `cold_call` - Cold calling
- `trade_show` - Trade show/event
- `existing_customer` - Existing customer
- `other` - Other source

### Equipment Categories
- `imaging` - Imaging equipment (X-Ray, CT, MRI, Ultrasound)
- `laboratory` - Lab equipment (analyzers, centrifuges)
- `monitoring` - Patient monitoring systems
- `surgical` - Surgical equipment
- `diagnostic` - Diagnostic equipment
- `other` - Other equipment

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

// List high urgency leads
async function getHighUrgencyLeads() {
  const response = await api.get('/admin/leads', {
    params: {
      urgency: 'high',
      page: 1,
      limit: 20
    }
  });
  return response.data;
}

// Get lead details
async function getLeadDetails(leadId) {
  const response = await api.get(`/admin/leads/${leadId}`);
  return response.data;
}

// Get lead history
async function getLeadHistory(leadId) {
  const response = await api.get(`/admin/leads/${leadId}/history`);
  return response.data;
}

// Update lead status
async function updateLeadStatus(leadId, newStatus, note) {
  const response = await api.put(`/admin/leads/${leadId}`, {
    leadStatus: newStatus,
    statusChangeNote: note
  });
  return response.data;
}

// Get lead statistics
async function getLeadCheck() {
  const response = await api.get('/admin/leads/check');
  return response.data;
}

// Count leads by status
async function countLeadsByStatus(status) {
  const response = await api.get('/admin/leads/count', {
    params: { leadStatus: status }
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

# List leads
def list_leads(filters=None):
    params = {"page": 1, "limit": 20}
    if filters:
        params.update(filters)
    
    response = requests.get(
        f"{BASE_URL}/admin/leads",
        headers=headers,
        params=params
    )
    return response.json()

# Get lead details
def get_lead_details(lead_id):
    response = requests.get(
        f"{BASE_URL}/admin/leads/{lead_id}",
        headers=headers
    )
    return response.json()

# Update lead
def update_lead(lead_id, updates):
    response = requests.put(
        f"{BASE_URL}/admin/leads/{lead_id}",
        headers=headers,
        json=updates
    )
    return response.json()

# Get lead history
def get_lead_history(lead_id):
    response = requests.get(
        f"{BASE_URL}/admin/leads/{lead_id}/history",
        headers=headers
    )
    return response.json()

# Example: Update lead to proposal stage
lead_id = "lead123abc"
result = update_lead(lead_id, {
    "leadStatus": "proposal",
    "statusChangeNote": "Submitted detailed proposal",
    "timeline": {
        "expectedDecisionDate": "2026-02-28",
        "urgency": "high"
    }
})
print(f"Lead updated: {result['message']}")
```

---

## Best Practices

### Lead Management

1. **Regular Updates**: Update lead status promptly as progress occurs
2. **Detailed Notes**: Add comprehensive notes at each status change
3. **Track History**: Review status history to understand lead progress
4. **Priority Focus**: Prioritize high urgency and qualified leads
5. **Follow-up Schedule**: Set expected decision dates and follow up consistently

### Status Change Guidelines

1. **Document Reasons**: Always include statusChangeNote when updating status
2. **Realistic Timeline**: Set realistic expected decision dates
3. **Competitor Intel**: Document competitor information when available
4. **Budget Validation**: Confirm budget before moving to qualified status
5. **Decision Makers**: Identify and document key decision makers

### Data Quality

1. **Complete Information**: Ensure all required fields are filled
2. **Contact Verification**: Verify phone and email before first contact
3. **Equipment Details**: Specify exact equipment models and quantities
4. **Budget Accuracy**: Get written budget confirmation when possible
5. **Location Data**: Include accurate facility location information

---

## Related Endpoints

- **Create Lead**: `POST /api/leads` (Sales Rep)
- **View My Leads**: `GET /api/leads` (Sales Rep)
- **Update Lead**: `PUT /api/leads/:id` (Sales Rep)
- **Analytics**: `GET /api/admin/analytics/sales/:userId`
- **Reports**: `GET /api/admin/reports`

---

**[← Back to Visits](./ADMIN_API_05_VISITS.md)** | **[Back to Index](./ADMIN_API_DOCUMENTATION_INDEX.md)** | **[Next: Machines Management →](./ADMIN_API_07_MACHINES.md)**
