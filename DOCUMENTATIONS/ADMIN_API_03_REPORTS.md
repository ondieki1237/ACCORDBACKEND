# Admin API - Reports Management

**Version:** 1.0  
**Last Updated:** January 3, 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [List All Reports](#list-all-reports)
3. [Get Report Details](#get-report-details)
4. [Update Report Status](#update-report-status)
5. [Bulk Report Operations](#bulk-report-operations)
6. [Report Statistics](#report-statistics)
7. [Examples](#examples)

---

## Overview

Reports management endpoints allow admins and managers to review, approve, or reject weekly activity reports submitted by sales representatives.

**Base Path**: `/api/admin/reports`  
**Required Role**: `admin` or `manager`  
**Authentication**: Required (Bearer Token)

---

## List All Reports

Retrieve paginated list of all reports with filtering options.

### Endpoint

```http
GET /api/admin/reports
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
| status | string | No | Filter: pending, reviewed, approved, rejected |
| userId | string | No | Filter by user MongoDB ObjectId |
| startDate | string | No | Filter reports from date (ISO format) |
| endDate | string | No | Filter reports until date (ISO format) |

### Response

```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "report123abc",
        "userId": {
          "_id": "user789",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@accordmedical.co.ke",
          "phone": "+254712345678",
          "employeeId": "SALES001"
        },
        "weekStart": "2026-01-01T00:00:00.000Z",
        "weekEnd": "2026-01-05T23:59:59.999Z",
        "weekRange": "01/01/2026 - 01/05/2026",
        "sections": [
          {
            "id": "summary",
            "title": "Weekly Summary",
            "content": "This week I focused on following up leads from December..."
          },
          {
            "id": "visits",
            "title": "Customer Visits",
            "content": "Completed 8 visits to hospitals in Nairobi region..."
          },
          {
            "id": "quotations",
            "title": "Quotations Generated",
            "content": "Submitted 3 quotation requests totaling KES 2.5M..."
          },
          {
            "id": "leads",
            "title": "New Leads",
            "content": "Identified 5 new potential clients..."
          },
          {
            "id": "challenges",
            "title": "Challenges Faced",
            "content": "Faced delays in procurement approvals..."
          },
          {
            "id": "next-week",
            "title": "Next Week's Plan",
            "content": "Will follow up on pending quotations..."
          }
        ],
        "status": "pending",
        "isDraft": false,
        "pdfUrl": "https://res.cloudinary.com/..../report.pdf",
        "reviewedBy": null,
        "reviewedAt": null,
        "adminNotes": null,
        "createdAt": "2026-01-05T17:30:00.000Z",
        "updatedAt": "2026-01-05T17:30:00.000Z"
      }
    ],
    "totalDocs": 45,
    "limit": 20,
    "page": 1,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null
  }
}
```

### Example Requests

```bash
# List all pending reports
curl -X GET "https://app.codewithseth.co.ke/api/admin/reports?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"

# List reports for a specific user
curl -X GET "https://app.codewithseth.co.ke/api/admin/reports?userId=user789&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# List reports in date range
curl -X GET "https://app.codewithseth.co.ke/api/admin/reports?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Get Report Details

Retrieve comprehensive details for a single report including related visits, quotations, planners, and follow-ups.

### Endpoint

```http
GET /api/admin/reports/:id
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Report MongoDB ObjectId |

### Response

```json
{
  "success": true,
  "data": {
    "report": {
      "_id": "report123abc",
      "userId": {
        "_id": "user789",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@accordmedical.co.ke",
        "phone": "+254712345678",
        "employeeId": "SALES001"
      },
      "weekStart": "2026-01-01T00:00:00.000Z",
      "weekEnd": "2026-01-05T23:59:59.999Z",
      "weekRange": "01/01/2026 - 01/05/2026",
      "sections": [
        {
          "id": "summary",
          "title": "Weekly Summary",
          "content": "This week I focused on following up leads..."
        }
      ],
      "status": "pending",
      "isDraft": false,
      "pdfUrl": "https://res.cloudinary.com/.../report.pdf",
      "reviewedBy": null,
      "reviewedAt": null,
      "adminNotes": null,
      "createdAt": "2026-01-05T17:30:00.000Z",
      "updatedAt": "2026-01-05T17:30:00.000Z"
    },
    "visits": [
      {
        "_id": "visit001",
        "userId": {
          "_id": "user789",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@accordmedical.co.ke",
          "employeeId": "SALES001"
        },
        "date": "2026-01-02T08:00:00.000Z",
        "client": {
          "type": "hospital",
          "name": "Nairobi General Hospital",
          "location": "Nairobi CBD",
          "phone": "+254700111222",
          "email": "info@ngh.co.ke"
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
            "notes": "Interested in X-Ray machines",
            "followUpRequired": true,
            "followUpDate": "2026-01-15T00:00:00.000Z",
            "priority": "high"
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
            "lastServiceDate": "2025-11-15T00:00:00.000Z"
          }
        ],
        "requestedEquipment": [
          {
            "name": "Digital X-Ray System",
            "model": "Modern DX-5000",
            "brand": "Siemens",
            "quantity": 1,
            "estimatedBudget": 1200000,
            "currency": "KES",
            "expectedPurchasePeriod": "Q2 2026",
            "urgency": "high"
          }
        ],
        "totalPotentialValue": 1200000,
        "notes": "Hospital is expanding radiology department...",
        "observations": "Current equipment showing age, budget allocated",
        "isFollowUpRequired": true,
        "createdAt": "2026-01-02T16:00:00.000Z",
        "updatedAt": "2026-01-02T16:00:00.000Z"
      }
    ],
    "quotations": [
      {
        "_id": "quot001",
        "userId": {
          "_id": "user789",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@accordmedical.co.ke",
          "employeeId": "SALES001"
        },
        "hospital": "Nairobi General Hospital",
        "equipmentRequired": "Digital X-Ray System",
        "contactName": "Dr. Jane Smith",
        "contactPhone": "+254711222333",
        "contactEmail": "jane.smith@ngh.co.ke",
        "urgency": "high",
        "additionalDetails": "Need installation by March 2026",
        "status": "pending",
        "responded": false,
        "createdAt": "2026-01-02T16:30:00.000Z",
        "updatedAt": "2026-01-02T16:30:00.000Z"
      }
    ],
    "planners": [],
    "followUps": [],
    "statistics": {
      "visits": {
        "total": 8,
        "byOutcome": {
          "successful": 6,
          "pending": 1,
          "followup_required": 1,
          "no_interest": 0
        },
        "byPurpose": {
          "demo": 2,
          "followup": 3,
          "installation": 0,
          "maintenance": 0,
          "consultation": 1,
          "sales": 2,
          "other": 0
        },
        "totalPotentialValue": 3500000
      },
      "quotations": {
        "total": 3,
        "byStatus": {
          "pending": 3,
          "in_progress": 0,
          "responded": 0,
          "completed": 0,
          "rejected": 0
        },
        "byUrgency": {
          "low": 0,
          "medium": 1,
          "high": 2
        }
      }
    },
    "meta": {
      "totalVisits": 8,
      "totalQuotations": 3,
      "weekRange": "01/01/2026 - 01/05/2026",
      "submittedAt": "2026-01-05T17:30:00.000Z",
      "salesRep": {
        "name": "John Doe",
        "email": "john.doe@accordmedical.co.ke",
        "employeeId": "SALES001",
        "phone": "+254712345678"
      }
    }
  }
}
```

### Example Request

```bash
curl -X GET "https://app.codewithseth.co.ke/api/admin/reports/report123abc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Update Report Status

Approve, reject, or update a report's status and add admin notes.

### Endpoint

```http
PUT /api/admin/reports/:id
```

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Report MongoDB ObjectId |

### Request Body

```json
{
  "status": "approved",
  "adminNotes": "Excellent work this week. Great follow-up on leads."
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | No | pending, reviewed, approved, rejected |
| adminNotes | string | No | Admin feedback/comments |

### Response

**Success (200 OK)**

```json
{
  "success": true,
  "message": "Report updated successfully",
  "data": {
    "_id": "report123abc",
    "userId": {
      "_id": "user789",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@accordmedical.co.ke",
      "employeeId": "SALES001"
    },
    "weekStart": "2026-01-01T00:00:00.000Z",
    "weekEnd": "2026-01-05T23:59:59.999Z",
    "weekRange": "01/01/2026 - 01/05/2026",
    "status": "approved",
    "adminNotes": "Excellent work this week. Great follow-up on leads.",
    "reviewedBy": {
      "_id": "admin123",
      "firstName": "Super",
      "lastName": "Admin",
      "email": "info@accordmedical.co.ke"
    },
    "reviewedAt": "2026-01-06T09:15:00.000Z",
    "createdAt": "2026-01-05T17:30:00.000Z",
    "updatedAt": "2026-01-06T09:15:00.000Z"
  }
}
```

**Error Responses**

**400 Bad Request - Invalid Status**
```json
{
  "success": false,
  "message": "Invalid status. Must be: pending, reviewed, approved, or rejected"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Report not found"
}
```

### Example Requests

```bash
# Approve report
curl -X PUT "https://app.codewithseth.co.ke/api/admin/reports/report123abc" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "adminNotes": "Great work this week!"
  }'

# Reject report
curl -X PUT "https://app.codewithseth.co.ke/api/admin/reports/report123abc" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "adminNotes": "Please provide more detail on customer interactions."
  }'

# Mark as reviewed
curl -X PUT "https://app.codewithseth.co.ke/api/admin/reports/report123abc" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "reviewed",
    "adminNotes": "Report reviewed. Awaiting manager approval."
  }'
```

---

## Bulk Report Operations

Fetch multiple reports with full details for bulk PDF generation or analysis.

### Endpoint

```http
POST /api/admin/reports/bulk
```

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request Body

```json
{
  "reportIds": [
    "report123abc",
    "report456def",
    "report789ghi"
  ]
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reportIds | array | Yes | Array of report MongoDB ObjectIds (max 50) |

### Response

```json
{
  "success": true,
  "data": [
    {
      "report": { /* Full report object */ },
      "visits": [ /* Array of visits */ ],
      "quotations": [ /* Array of quotations */ ],
      "planners": [ /* Array of planners */ ],
      "followUps": [ /* Array of follow-ups */ ],
      "statistics": { /* Visit and quotation stats */ }
    },
    // ... more reports
  ]
}
```

### Example Request

```bash
curl -X POST "https://app.codewithseth.co.ke/api/admin/reports/bulk" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportIds": ["report123abc", "report456def"]
  }'
```

### Limitations

- Maximum 50 reports per request
- Large requests may take longer to process
- Consider pagination for very large datasets

---

## Report Statistics

### Report Status Workflow

```
pending → reviewed → approved
                  ↘ rejected
```

**Status Descriptions:**

| Status | Description | Who Sets It | Next Action |
|--------|-------------|-------------|-------------|
| pending | Newly submitted | Sales Rep | Admin review |
| reviewed | Under review | Admin/Manager | Approval/Rejection |
| approved | Accepted | Admin/Manager | Archived |
| rejected | Not accepted | Admin/Manager | Resubmission |

### Report Sections

Standard sections included in reports:

1. **summary** - Weekly Summary
2. **visits** - Customer Visits
3. **quotations** - Quotations Generated
4. **leads** - New Leads
5. **challenges** - Challenges Faced
6. **next-week** - Next Week's Plan

### Metrics Tracked

**Visit Metrics:**
- Total visits
- Visits by outcome (successful, pending, followup_required, no_interest)
- Visits by purpose (demo, followup, installation, maintenance, consultation, sales, other)
- Total potential value

**Quotation Metrics:**
- Total quotations
- Quotations by status
- Quotations by urgency level

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

// List pending reports
async function listPendingReports() {
  const response = await api.get('/admin/reports', {
    params: {
      status: 'pending',
      page: 1,
      limit: 20
    }
  });
  return response.data;
}

// Get report details
async function getReportDetails(reportId) {
  const response = await api.get(`/admin/reports/${reportId}`);
  return response.data;
}

// Approve report
async function approveReport(reportId, notes) {
  const response = await api.put(`/admin/reports/${reportId}`, {
    status: 'approved',
    adminNotes: notes
  });
  return response.data;
}

// Reject report
async function rejectReport(reportId, reason) {
  const response = await api.put(`/admin/reports/${reportId}`, {
    status: 'rejected',
    adminNotes: reason
  });
  return response.data;
}

// Bulk fetch reports
async function bulkFetchReports(reportIds) {
  const response = await api.post('/admin/reports/bulk', {
    reportIds
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

# List reports
def list_reports(status=None, user_id=None):
    params = {"page": 1, "limit": 20}
    if status:
        params["status"] = status
    if user_id:
        params["userId"] = user_id
    
    response = requests.get(
        f"{BASE_URL}/admin/reports",
        headers=headers,
        params=params
    )
    return response.json()

# Get report details
def get_report_details(report_id):
    response = requests.get(
        f"{BASE_URL}/admin/reports/{report_id}",
        headers=headers
    )
    return response.json()

# Update report status
def update_report(report_id, status, admin_notes):
    data = {
        "status": status,
        "adminNotes": admin_notes
    }
    response = requests.put(
        f"{BASE_URL}/admin/reports/{report_id}",
        headers=headers,
        json=data
    )
    return response.json()
```

---

## Best Practices

### Reviewing Reports

1. **Review Promptly**: Check pending reports within 24-48 hours
2. **Provide Feedback**: Always add admin notes when approving/rejecting
3. **Check Data**: Verify visits and quotations match report narrative
4. **Be Constructive**: Offer specific guidance for rejected reports
5. **Track Trends**: Monitor individual and team performance over time

### Admin Notes Guidelines

**Good Examples:**
- "Excellent follow-up on leads. Consider documenting competitive intel more thoroughly."
- "Strong visit count. Need more detail on quotation outcomes."
- "Great work on hospital visits. Remember to log all contacts."

**Avoid:**
- Single word responses ("Good", "OK")
- Vague criticism ("Not enough detail")
- No feedback at all

### Workflow Tips

1. **Batch Process**: Review multiple reports in one session
2. **Use Filters**: Focus on pending reports first
3. **Set Deadlines**: Establish report submission deadlines (e.g., Friday 5 PM)
4. **Follow Up**: Contact sales reps about rejected reports
5. **Archive**: Keep approved reports organized by date

---

## Related Endpoints

- **Get All Reports**: `GET /api/reports` (Sales Rep view)
- **Submit Report**: `POST /api/reports` (Sales Rep)
- **Download Report PDF**: `GET /api/reports/:id/download`
- **User Analytics**: `GET /api/admin/analytics/sales/:userId`

---

**[← Back to Index](./ADMIN_API_DOCUMENTATION_INDEX.md)** | **[Next: Quotations Management →](./ADMIN_API_04_QUOTATIONS.md)**
