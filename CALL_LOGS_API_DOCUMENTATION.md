# Call Logs API Documentation

## Overview
The Call Logs system allows tracking of client phone calls with detailed information about call outcomes, follow-ups, and organization by year/month/week. This is an admin-focused feature for managing sales and client communication.

---

## 📋 Table of Contents
1. [Authentication](#authentication)
2. [Endpoints](#endpoints)
3. [Data Models](#data-models)
4. [Folder Tree Structure](#folder-tree-structure)
5. [Usage Examples](#usage-examples)

---

## Authentication

All endpoints require authentication via JWT Bearer token:

```
Authorization: Bearer {accessToken}
```

**Roles:**
- **Sales/Engineer**: Can create and manage their own call logs
- **Admin/Manager**: Can view and manage all call logs

---

## Endpoints

### 1. Create Call Log

**Endpoint:** `POST /api/call-logs`

**Authentication:** Required (All authenticated users)

**Request Body:**
```json
{
  "clientName": "Dr. John Smith (Radiologist, City Hospital)",
  "clientPhone": "+254712345678",
  "callDirection": "outbound",
  "callDate": "2026-01-13",
  "callTime": "14:30",
  "callDuration": 15,
  "callOutcome": "interested",
  "nextAction": "Send product brochure",
  "followUpDate": "2026-01-20",
  "callNotes": "Client is interested in X-ray machine. Needs quote by end of month.",
  "tags": ["high-priority", "x-ray"],
  "relatedLead": "lead_id_here",
  "relatedVisit": "visit_id_here"
}
```

**Field Descriptions:**
- `clientName` (required): Name of the client/contact person. **Include the role and facility in parentheses, e.g., "Dr. John Smith (Radiologist, City Hospital)"**
- `clientPhone` (required): Phone number of the client
- `callDirection` (required): `inbound` or `outbound`
- `callDate` (required): Date of the call (ISO date format)
- `callTime` (required): Time of the call (HH:MM format)
- `callDuration` (required): Duration in minutes (number)
- `callOutcome` (required): One of:
  - `no_answer` - No Answer
  - `interested` - Interested
  - `follow_up_needed` - Follow-up Needed
  - `not_interested` - Not Interested
  - `sale_closed` - Sale Closed
- `nextAction` (optional): Description of next action to take
- `followUpDate` (optional): Date for follow-up (ISO date format)
- `callNotes` (optional): Detailed notes/summary of the call
- `tags` (optional): Array of tags for categorization
- `relatedLead` (optional): ID of related Lead document
- `relatedVisit` (optional): ID of related Visit document

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Call log created successfully",
  "data": {
    "_id": "call_log_id",
    "clientName": "Dr. John Smith (Radiologist, City Hospital)",
    "clientPhone": "+254712345678",
    "callDirection": "outbound",
    "callDate": "2026-01-13T00:00:00.000Z",
    "callTime": "14:30",
    "callDuration": 15,
    "callOutcome": "interested",
    "nextAction": "Send product brochure",
    "followUpDate": "2026-01-20T00:00:00.000Z",
    "callNotes": "Client is interested in X-ray machine. Needs quote by end of month.",
    "tags": ["high-priority", "x-ray"],
    "year": 2026,
    "month": 1,
    "week": 3,
    "createdBy": {
      "_id": "user_id",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@accord.com",
      "role": "sales"
    },
    "createdAt": "2026-01-13T14:45:00.000Z",
    "updatedAt": "2026-01-13T14:45:00.000Z"
  }
}
```

---

### 2. Get Call Logs (with Filtering & Pagination)

**Endpoint:** `GET /api/call-logs`

**Authentication:** Required

**Query Parameters:**
- `page` (default: 1): Page number for pagination
- `limit` (default: 20): Number of results per page
- `year`: Filter by year (e.g., 2026)
- `month`: Filter by month (1-12)
- `week`: Filter by week number (1-52)
- `callOutcome`: Filter by outcome (`no_answer`, `interested`, etc.)
- `callDirection`: Filter by direction (`inbound`, `outbound`)
- `search`: Text search in client name and notes
- `startDate`: Filter by date range start (ISO date)
- `endDate`: Filter by date range end (ISO date)
- `createdBy`: Filter by user ID (admin/manager only)

**Example Requests:**
```bash
# Get all call logs
GET /api/call-logs

# Get calls from January 2026, Week 2
GET /api/call-logs?year=2026&month=1&week=2

# Get all interested calls
GET /api/call-logs?callOutcome=interested

# Search for specific client
GET /api/call-logs?search=John+Smith

# Get calls in date range
GET /api/call-logs?startDate=2026-01-01&endDate=2026-01-31

# Get calls with pagination
GET /api/call-logs?page=2&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "call_log_id",
      "clientName": "Dr. John Smith (Radiologist, City Hospital)",
      "clientPhone": "+254712345678",
      "callDirection": "outbound",
      "callDate": "2026-01-13T00:00:00.000Z",
      "callTime": "14:30",
      "callDuration": 15,
      "callOutcome": "interested",
      "year": 2026,
      "month": 1,
      "week": 3,
      "createdBy": {
        "_id": "user_id",
        "firstName": "Jane",
        "lastName": "Doe"
      }
    }
  ],
  "pagination": {
    "total": 145,
    "page": 1,
    "pages": 8,
    "limit": 20
  }
}
```

---

### 3. Get Folder Tree Structure

**Endpoint:** `GET /api/call-logs/folder-tree` or `GET /api/admin/call-logs/folder-tree`

**Authentication:** Required

**Query Parameters:**
- `userId` (optional, admin only): Get folder tree for specific user

**Description:** Returns hierarchical structure of years, months, and weeks with call counts.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "year": 2026,
      "totalCalls": 145,
      "months": [
        {
          "month": 1,
          "monthName": "January",
          "totalCalls": 145,
          "weeks": [
            {
              "week": 1,
              "count": 23,
              "firstCall": "2026-01-01T08:00:00.000Z",
              "lastCall": "2026-01-07T17:30:00.000Z"
            },
            {
              "week": 2,
              "count": 31,
              "firstCall": "2026-01-08T09:15:00.000Z",
              "lastCall": "2026-01-14T16:45:00.000Z"
            },
            {
              "week": 3,
              "count": 28,
              "firstCall": "2026-01-15T08:30:00.000Z",
              "lastCall": "2026-01-21T17:00:00.000Z"
            }
          ]
        }
      ]
    },
    {
      "year": 2025,
      "totalCalls": 567,
      "months": [...]
    }
  ]
}
```

**Frontend Usage:**
This endpoint provides the data structure for the collapsible folder tree in the left panel:
```
📁 2026 (145 calls)
  📁 January (145 calls)
    📁 Week 1 (23 calls)
    📁 Week 2 (31 calls)
    📁 Week 3 (28 calls)
📁 2025 (567 calls)
  📁 December (89 calls)
    📁 Week 48 (18 calls)
    ...
```

---

### 4. Get Single Call Log

**Endpoint:** `GET /api/call-logs/:id`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "call_log_id",
    "clientName": "Dr. John Smith (Radiologist, City Hospital)",
    "clientPhone": "+254712345678",
    "callDirection": "outbound",
    "callDate": "2026-01-13T00:00:00.000Z",
    "callTime": "14:30",
    "callDuration": 15,
    "callOutcome": "interested",
    "nextAction": "Send product brochure",
    "followUpDate": "2026-01-20T00:00:00.000Z",
    "callNotes": "Client is interested in X-ray machine...",
    "tags": ["high-priority", "x-ray"],
    "year": 2026,
    "month": 1,
    "week": 3,
    "createdBy": {
      "_id": "user_id",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@accord.com",
      "role": "sales"
    },
    "relatedLead": {
      "_id": "lead_id",
      "facilityName": "City Hospital",
      "leadStatus": "qualified"
    },
    "relatedVisit": {
      "_id": "visit_id",
      "client": { "name": "City Hospital" },
      "visitPurpose": "demo"
    }
  }
}
```

---

### 5. Update Call Log

**Endpoint:** `PUT /api/call-logs/:id`

**Authentication:** Required (owner, admin, or manager)

**Request Body:** (any fields to update)
```json
{
  "callOutcome": "sale_closed",
  "callNotes": "Sale finalized. Contract signed.",
  "nextAction": "Schedule installation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Call log updated successfully",
  "data": {
    "_id": "call_log_id",
    ...updated fields
  }
}
```

---

### 6. Delete Call Log

**Endpoint:** `DELETE /api/call-logs/:id`

**Authentication:** Required (owner, admin, or manager)

**Description:** Soft deletes the call log (sets `isActive: false`)

**Response:**
```json
{
  "success": true,
  "message": "Call log deleted successfully"
}
```

---

### 7. Get Call Statistics

**Endpoint:** `GET /api/call-logs/statistics` or `GET /api/admin/call-logs/statistics`

**Authentication:** Required

**Query Parameters:**
- `year`: Filter by year
- `month`: Filter by month
- `week`: Filter by week
- `userId` (admin only): Get stats for specific user

**Example:**
```bash
GET /api/call-logs/statistics?year=2026&month=1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCalls": 145,
    "totalDuration": 2175,
    "avgDuration": 15,
    "inboundCalls": 58,
    "outboundCalls": 87,
    "noAnswer": 23,
    "interested": 45,
    "followUpNeeded": 32,
    "notInterested": 28,
    "saleClosed": 17,
    "conversionRate": "13.93"
  }
}
```

---

### 8. Get Upcoming Follow-ups

**Endpoint:** `GET /api/call-logs/follow-ups`

**Authentication:** Required

**Query Parameters:**
- `days` (default: 7): Number of days to look ahead

**Example:**
```bash
GET /api/call-logs/follow-ups?days=14
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "call_log_id",
      "clientName": "Dr. John Smith (Radiologist, City Hospital)",
      "clientPhone": "+254712345678",
      "followUpDate": "2026-01-20T00:00:00.000Z",
      "nextAction": "Send product brochure",
      "callOutcome": "follow_up_needed",
      "createdBy": {
        "_id": "user_id",
        "firstName": "Jane",
        "lastName": "Doe"
      }
    }
  ]
}
```

---

## Admin Endpoints

All admin endpoints are under `/api/admin/call-logs` and require `admin` or `manager` role.

**Available Admin Endpoints:**
- `GET /api/admin/call-logs/folder-tree` - Get folder tree for all users
- `GET /api/admin/call-logs` - Get all call logs across all users
- `GET /api/admin/call-logs/statistics` - Get statistics for any user
- `GET /api/admin/call-logs/:id` - View any call log
- `PUT /api/admin/call-logs/:id` - Update any call log
- `DELETE /api/admin/call-logs/:id` - Delete any call log

---

## Data Models

### CallLog Schema

```javascript
{
  clientName: String (required), // Include role and facility, e.g., "Dr. John Smith (Radiologist, City Hospital)"
  clientPhone: String (required),
  callDirection: 'inbound' | 'outbound' (required),
  callDate: Date (required, indexed),
  callTime: String (required),
  callDuration: Number (required, min: 0),
  callOutcome: 'no_answer' | 'interested' | 'follow_up_needed' | 'not_interested' | 'sale_closed' (required),
  nextAction: String (optional),
  followUpDate: Date (optional, indexed),
  callNotes: String (optional),
  tags: [String],
  relatedLead: ObjectId (ref: Lead, optional),
  relatedVisit: ObjectId (ref: Visit, optional),
  year: Number (auto-calculated, indexed),
  month: Number (auto-calculated, indexed),
  week: Number (auto-calculated, indexed),
  createdBy: ObjectId (ref: User, required),
  isActive: Boolean (default: true),
  timestamps: true
}
```

---

## Folder Tree Structure

The system automatically organizes call logs into a hierarchical folder structure:

```
Year (2026, 2025, etc.)
  ├── Month (January, February, etc.)
      ├── Week 1
      ├── Week 2
      ├── Week 3
      └── ...
```

**How it works:**
1. When a call log is created with a `callDate`
2. The system automatically calculates:
   - `year`: Full year (e.g., 2026)
   - `month`: Month number 1-12
   - `week`: ISO week number 1-52
3. These values are indexed for fast querying
4. The folder tree endpoint aggregates these to show counts

**Week Calculation:**
- Uses ISO 8601 week numbering
- Week 1 is the first week with a Thursday in the new year
- Weeks run Monday to Sunday

---

## Usage Examples

### Frontend Implementation Example

**1. Display Folder Tree (Left Panel):**
```javascript
// Fetch folder tree
const response = await fetch('/api/call-logs/folder-tree', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();

// Render collapsible tree
data.forEach(yearData => {
  // 📁 2026 (145 calls)
  yearData.months.forEach(monthData => {
    // 📁 January (145 calls)
    monthData.weeks.forEach(weekData => {
      // 📁 Week 1 (23 calls)
    });
  });
});
```

**2. Filter Calls by Folder Selection:**
```javascript
// User clicks on "2026 > January > Week 2"
const response = await fetch(
  `/api/call-logs?year=2026&month=1&week=2`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

**3. Create New Call Log:**
```javascript
const callLog = {
  clientName: "Dr. Sarah Johnson (Procurement, County Clinic)",
  clientPhone: "+254700123456",
  callDirection: "outbound",
  callDate: "2026-01-13",
  callTime: "10:30",
  callDuration: 20,
  callOutcome: "interested",
  callNotes: "Discussed CT scanner options..."
};

await fetch('/api/call-logs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(callLog)
});
```

**4. Dashboard Stats Widget:**
```javascript
// Get this month's statistics
const response = await fetch(
  `/api/call-logs/statistics?year=2026&month=1`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);
const { data } = await response.json();

// Display: Total Calls, Conversion Rate, etc.
console.log(`Conversion Rate: ${data.conversionRate}%`);
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token is required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Call log not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to create call log",
  "error": "Error details..."
}
```

---

## Best Practices

1. **Always set follow-up dates** for outcomes that need follow-up
2. **Use tags** for easy categorization and filtering
3. **Link to leads/visits** when relevant for complete context
4. **Be detailed in call notes** - future you will thank you
5. **Update call outcomes** as situations progress
6. **Use the folder tree** to organize and review past calls by time period

---

## Future Enhancements

Potential features for future versions:
- Call recording integration
- Automatic transcription
- AI-powered call summaries
- Sentiment analysis
- Call reminders/notifications
- Export to Excel/PDF
- Integration with phone systems
- Call performance analytics
- Team leaderboards
