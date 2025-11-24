# API Verification Checklist

This document summarizes the APIs that the frontend is currently using for **Weekly Planners** and **Weekly Reports**. Please verify with the backend team that these endpoints exist and are functional.

---

## 🔵 Weekly Reports API

### **Status:** ✅ Frontend Implementation Complete

### Endpoints Used:

#### 1. Submit Weekly Report
```
POST https://app.codewithseth.co.ke/api/reports
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {accessToken}"
}
```

**Request Body:**
```json
{
  "weekStart": "2025-01-15",
  "weekEnd": "2025-01-19",
  "content": {
    "metadata": {
      "author": "John Doe",
      "submittedAt": "2025-01-19T17:30:00.000Z",
      "weekRange": "1/15/2025 - 1/19/2025"
    },
    "sections": [
      {
        "id": "summary",
        "title": "Weekly Summary",
        "content": "..."
      },
      {
        "id": "visits",
        "title": "Customer Visits",
        "content": "..."
      },
      {
        "id": "quotations",
        "title": "Quotations Generated",
        "content": "..."
      },
      {
        "id": "leads",
        "title": "New Leads",
        "content": "..."
      },
      {
        "id": "challenges",
        "title": "Challenges Faced",
        "content": "..."
      },
      {
        "id": "next-week",
        "title": "Next Week's Plan",
        "content": "..."
      }
    ]
  },
  "isDraft": false
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Report submitted successfully",
  "data": {
    "_id": "report_abc123",
    "userId": "user_xyz789",
    "weekStart": "2025-01-15",
    "weekEnd": "2025-01-19",
    "content": { ... },
    "isDraft": false,
    "pdfUrl": null,
    "status": "pending",
    "createdAt": "2025-01-19T17:30:00.000Z",
    "updatedAt": "2025-01-19T17:30:00.000Z"
  }
}
```

#### 2. Save Draft Report
```
POST https://app.codewithseth.co.ke/api/reports/draft
```
- Same request body as above with `isDraft: true`

#### 3. Get My Reports
```
GET https://app.codewithseth.co.ke/api/reports/my
```

**Headers:**
```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "report_123",
      "weekStart": "2025-01-15",
      "weekEnd": "2025-01-19",
      "content": { ... },
      "status": "pending",
      "createdAt": "2025-01-19T17:30:00.000Z"
    }
  ]
}
```

#### 4. Get All Reports (Admin?)
```
GET https://app.codewithseth.co.ke/api/reports
```

**Frontend Files:**
- `components/saleshome/reportcreate.tsx` (lines 99, 260, 341)
- `components/saleshome/page.tsx` (lines 147, 187)

---

## � Weekly Planner API

### **Status:** ✅ Backend Verified and Fully Functional

### Endpoints Used:

#### 1. Submit Weekly Planner
```
POST https://app.codewithseth.co.ke/api/planner
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {accessToken}"
}
```

**Request Body:**
```json
{
  "weekCreatedAt": "2025-01-20T10:00:00.000Z",
  "days": [
    {
      "day": "Monday",
      "date": "2025-01-20",
      "place": "Nairobi",
      "means": "Matatu",
      "allowance": "2000",
      "prospects": "Visit 3 hospitals"
    },
    {
      "day": "Tuesday",
      "date": "2025-01-21",
      "place": "Mombasa",
      "means": "Bus",
      "allowance": "5000",
      "prospects": "Meet with procurement team"
    }
    // ... Wednesday, Thursday, Friday
  ],
  "notes": ""
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Planner submitted successfully",
  "data": {
    "_id": "planner_abc123",
    "userId": "user_xyz789",
    "weekCreatedAt": "2025-01-20T10:00:00.000Z",
    "days": [ ... ],
    "notes": "",
    "createdAt": "2025-01-20T10:00:00.000Z",
    "updatedAt": "2025-01-20T10:00:00.000Z"
  }
}
```

#### 2. Get My Planners
```
GET https://app.codewithseth.co.ke/api/planner/my
GET https://app.codewithseth.co.ke/api/planner
```

**Status:** ✅ Implemented (both routes work)

**Headers:**
```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Query Parameters (Optional):**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "planner_123",
      "userId": "user_xyz789",
      "weekCreatedAt": "2025-01-20T10:00:00.000Z",
      "days": [
        {
          "day": "Monday",
          "date": "2025-01-20",
          "place": "Nairobi",
          "means": "Matatu",
          "allowance": "2000",
          "prospects": "Visit 3 hospitals"
        }
      ],
      "notes": "",
      "createdAt": "2025-01-20T10:00:00.000Z",
      "updatedAt": "2025-01-20T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "totalDocs": 10
  }
}
```

**Frontend Files:**
- `components/saleshome/planner.tsx` (line 69)

---

## ✅ Verification Checklist

### Weekly Reports API
- [x] `POST /api/reports` - Submit report ✅
- [x] `POST /api/reports/draft` - Save draft report ✅
- [x] `GET /api/reports/my` - Get user's reports ✅
- [x] `GET /api/reports` - Get all reports (admin) ✅
- [x] `GET /api/reports/:id` - Get single report ✅
- [x] `PUT /api/reports/:id/status` - Update report status ✅
- [x] `GET /api/reports/:id/download` - Download report PDF ✅
- [x] PDF generation working for submitted reports ✅
- [x] Email notifications to admin on new report submission ✅

### Weekly Planner API
- [x] `POST /api/planner` - Submit planner ✅
- [x] `GET /api/planner/my` - Get user's planners ✅
- [x] `GET /api/planner` - Get user's planners (alias) ✅

### Admin Endpoints
- [x] `GET /api/admin/reports` - List all reports with filters ✅
- [x] `GET /api/admin/reports/:id` - Get specific report ✅
- [x] `PUT /api/admin/reports/:id` - Update report status/review ✅
- [x] `POST /api/admin/reports/bulk` - Get multiple reports for bulk operations ✅
- [x] `GET /api/admin/reports/stats/summary` - Get report statistics ✅
- [x] `GET /api/admin/planners` - List all planners with filters ✅
- [x] `GET /api/admin/planners/:id` - Get specific planner ✅

---

## 🎉 Verification Complete

**All endpoints have been verified and are fully functional!**

### Issues Resolved:
1. ✅ **Planner Route Alias** - Added `GET /api/planner/my` as an alias to `GET /api/planner`
2. ✅ **Admin Planner Detail Endpoint** - Implemented `GET /api/admin/planners/:id`

---

## 📋 Admin Endpoints Documentation

### Reports Management

#### 1. List All Reports
```
GET https://app.codewithseth.co.ke/api/admin/reports
```

**Headers:**
```json
{
  "Authorization": "Bearer {adminAccessToken}"
}
```

**Query Parameters (Optional):**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `status` - Filter by status: pending, reviewed, approved, rejected
- `userId` - Filter by specific user ID
- `startDate` - Filter by week start date (ISO format)
- `endDate` - Filter by week end date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "report_123",
        "userId": {
          "_id": "user_xyz",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "employeeId": "EMP001"
        },
        "weekStart": "2025-01-15",
        "weekEnd": "2025-01-19",
        "status": "pending",
        "isDraft": false,
        "createdAt": "2025-01-19T17:30:00.000Z"
      }
    ],
    "totalDocs": 50,
    "limit": 20,
    "page": 1,
    "totalPages": 3
  }
}
```

#### 2. Get Specific Report
```
GET https://app.codewithseth.co.ke/api/admin/reports/:id
```

**Headers:**
```json
{
  "Authorization": "Bearer {adminAccessToken}"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "report": {
      "_id": "report_123",
      "userId": { ... },
      "weekStart": "2025-01-15",
      "weekEnd": "2025-01-19",
      "sections": [ ... ],
      "status": "pending",
      "pdfUrl": "https://..."
    },
    "visits": [ ... ],
    "quotations": [ ... ],
    "statistics": {
      "visits": { ... },
      "quotations": { ... }
    },
    "meta": { ... }
  }
}
```

#### 3. Update Report Status
```
PUT https://app.codewithseth.co.ke/api/admin/reports/:id
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {adminAccessToken}"
}
```

**Request Body:**
```json
{
  "status": "approved",
  "adminNotes": "Great work this week!"
}
```

**Valid Status Values:** `pending`, `reviewed`, `approved`, `rejected`

**Response:**
```json
{
  "success": true,
  "message": "Report updated successfully",
  "data": { ... }
}
```

#### 4. Bulk Fetch Reports
```
POST https://app.codewithseth.co.ke/api/admin/reports/bulk
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {adminAccessToken}"
}
```

**Request Body:**
```json
{
  "reportIds": ["report_123", "report_456", "report_789"]
}
```

**Note:** Maximum 50 reports per request

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "report": { ... },
      "visits": [ ... ],
      "quotations": [ ... ],
      "meta": { ... }
    }
  ]
}
```

#### 5. Get Report Statistics
```
GET https://app.codewithseth.co.ke/api/admin/reports/stats/summary
```

**Headers:**
```json
{
  "Authorization": "Bearer {adminAccessToken}"
}
```

**Query Parameters (Optional):**
- `startDate` - Filter from date (ISO format)
- `endDate` - Filter to date (ISO format)
- `userId` - Filter by specific user

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReports": 150,
    "pendingReports": 25,
    "reviewedReports": 50,
    "approvedReports": 70,
    "rejectedReports": 5,
    "draftReports": 10
  }
}
```

---

### Planners Management

#### 1. List All Planners
```
GET https://app.codewithseth.co.ke/api/admin/planners
```

**Headers:**
```json
{
  "Authorization": "Bearer {adminAccessToken}"
}
```

**Query Parameters (Optional):**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `userId` - Filter by specific user ID
- `from` - Filter from date (ISO format)
- `to` - Filter to date (ISO format)
- `sortBy` - Sort by: `date` or `name` (default: date)
- `order` - Sort order: `asc` or `desc` (default: desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "planner_123",
      "userId": {
        "_id": "user_xyz",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "employeeId": "EMP001"
      },
      "weekCreatedAt": "2025-01-20T10:00:00.000Z",
      "days": [
        {
          "day": "Monday",
          "date": "2025-01-20",
          "place": "Nairobi",
          "means": "Matatu",
          "allowance": "2000",
          "prospects": "Visit 3 hospitals"
        }
      ],
      "notes": "",
      "createdAt": "2025-01-20T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "totalDocs": 100,
    "totalPages": 2
  }
}
```

#### 2. Get Specific Planner
```
GET https://app.codewithseth.co.ke/api/admin/planners/:id
```

**Headers:**
```json
{
  "Authorization": "Bearer {adminAccessToken}"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "planner_123",
    "userId": {
      "_id": "user_xyz",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "employeeId": "EMP001",
      "phone": "+254712345678"
    },
    "weekCreatedAt": "2025-01-20T10:00:00.000Z",
    "days": [
      {
        "day": "Monday",
        "date": "2025-01-20",
        "place": "Nairobi",
        "means": "Matatu",
        "allowance": "2000",
        "prospects": "Visit 3 hospitals"
      },
      {
        "day": "Tuesday",
        "date": "2025-01-21",
        "place": "Mombasa",
        "means": "Bus",
        "allowance": "5000",
        "prospects": "Meet procurement team"
      }
    ],
    "notes": "Focus on Level 5 hospitals",
    "createdAt": "2025-01-20T10:00:00.000Z",
    "updatedAt": "2025-01-20T10:00:00.000Z"
  }
}
```

---

## 📝 Summary

### Endpoints Previously Missing (Now Implemented)
1. ✅ `GET /api/planner/my` - Alias route for getting user's planners
2. ✅ `GET /api/admin/planners/:id` - Admin endpoint to view specific planner

### All Available Endpoints

**User Endpoints:**
- Reports: 7 endpoints (POST, GET, PUT, download)
- Planners: 2 endpoints (POST, GET)

**Admin Endpoints:**
- Reports: 5 endpoints (list, detail, update, bulk, stats)
- Planners: 2 endpoints (list, detail)
