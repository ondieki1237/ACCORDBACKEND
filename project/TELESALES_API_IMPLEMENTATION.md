# Telesales API Implementation Guide

**Implementation Date:** March 12, 2026  
**Status:** ✅ Production Ready  
**Last Updated:** March 12, 2026

---

## Overview

The Telesales API has been completely revamped to support the new Telesales Module with comprehensive call recording, history tracking, and analytics capabilities. All calls are automatically saved to the database with complete facility and contact information.

---

## API Endpoints

### 1. Create Call Log (POST)

**Endpoint:** `POST /api/call-logs`

**Authentication:** Required (Bearer Token)  
**Authorization:** Any authenticated user

**Request Body:**

```json
{
  "clientName": "Aga Khan Hospital",
  "clientPhone": "+254-700-123456",
  "callDirection": "outbound",
  "callDate": "2026-03-12",
  "callTime": "14:30",
  "callDuration": 0,
  "callOutcome": "interested",
  "callType": "product_inquiry",
  "nextAction": "Product inquiry: Dialysis Machine",
  "followUpDate": "2026-04-15",
  "callNotes": "Client very interested in rental options",
  "year": 2026,
  "month": 3,
  "week": 2,
  
  "facilityName": "Aga Khan Hospital",
  "facilityLocation": "Nairobi",
  "contactPerson": {
    "name": "Dr. John Doe",
    "role": "Medical Director",
    "email": "john@agakhan.com",
    "phone": "+254-700-123456",
    "department": "Administration"
  },
  "productInterest": "Dialysis Machine",
  "expectedPurchaseDate": "2026-04-15",
  "machineModel": "Fresenius 5008S",
  "machineSerialNumber": "FSN-2025-001",
  "serviceAccepted": false,
  "serviceRequestType": "maintenance"
}
```

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| clientName | string | ✅ | Facility/client name |
| clientPhone | string | ✅ | Client contact phone |
| callDirection | string | ✅ | 'inbound' or 'outbound' |
| callDate | string | ✅ | Date in YYYY-MM-DD format |
| callTime | string | ✅ | Time in HH:MM format |
| callDuration | number | ✅ | Duration in seconds |
| callOutcome | string | ✅ | One of: interested, not_interested, follow_up_needed, no_answer, sale_closed |
| callType | string | ❌ | 'product_inquiry', 'service_inquiry', 'machine_inquiry', 'follow_up', 'general' (default: 'general') |
| nextAction | string | ❌ | Recommended action after call |
| followUpDate | string | ❌ | Follow-up date in YYYY-MM-DD format |
| callNotes | string | ❌ | Additional notes |
| year | number | ❌ | Year (auto-calculated if not provided) |
| month | number | ❌ | Month 1-12 (auto-calculated if not provided) |
| week | number | ❌ | Week number (auto-calculated if not provided) |
| **Telesales Fields** | | | |
| facilityName | string | ❌ | Facility name (defaults to clientName) |
| facilityLocation | string | ❌ | Facility location/city |
| contactPerson | object | ❌ | Contact person details (name, role, email, phone, department) |
| productInterest | string | ❌ | Product the client is interested in |
| expectedPurchaseDate | string | ❌ | Expected purchase date |
| machineModel | string | ❌ | Machine model being discussed |
| machineSerialNumber | string | ❌ | Machine serial number |
| serviceAccepted | boolean | ❌ | Whether service was accepted |
| serviceRequestType | string | ❌ | Type of service: maintenance, repair, installation, upgrade, other |

**Response:**

```json
{
  "success": true,
  "message": "Call log created successfully",
  "data": {
    "_id": "call-789",
    "clientName": "Aga Khan Hospital",
    "clientPhone": "+254-700-123456",
    "callDirection": "outbound",
    "callDate": "2026-03-12T00:00:00.000Z",
    "callTime": "14:30",
    "callDuration": 0,
    "callOutcome": "interested",
    "callType": "product_inquiry",
    "nextAction": "Product inquiry: Dialysis Machine",
    "followUpDate": "2026-04-15T00:00:00.000Z",
    "callNotes": "Client very interested in rental options",
    "year": 2026,
    "month": 3,
    "week": 2,
    "facilityName": "Aga Khan Hospital",
    "facilityLocation": "Nairobi",
    "contactPerson": {
      "name": "Dr. John Doe",
      "role": "Medical Director",
      "email": "john@agakhan.com",
      "phone": "+254-700-123456",
      "department": "Administration"
    },
    "createdBy": {
      "_id": "user-123",
      "firstName": "admin",
      "lastName": "user",
      "email": "admin@accord.com",
      "role": "admin"
    },
    "createdAt": "2026-03-12T14:30:45.000Z",
    "updatedAt": "2026-03-12T14:30:45.000Z"
  }
}
```

**Status Code:** 201 Created

---

### 2. Get Call History (GET)

**Endpoint:** `GET /api/call-logs`

**Authentication:** Required (Bearer Token)  
**Authorization:** Any authenticated user (users see only their calls, admins see all)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Results per page (default: 20) |
| facilityName | string | Filter by facility name (partial match) |
| clientName | string | Filter by client name (partial match) |
| callType | string | Filter by call type (product_inquiry, service_inquiry, etc.) |
| callOutcome | string | Filter by outcome (interested, not_interested, etc.) |
| callDirection | string | Filter by direction (inbound, outbound) |
| startDate | string | Start date in YYYY-MM-DD format |
| endDate | string | End date in YYYY-MM-DD format |
| search | string | Text search in client name and notes |
| year | number | Filter by year |
| month | number | Filter by month (1-12) |
| week | number | Filter by week number |
| serviceAccepted | boolean | Filter by service acceptance |

**Example Request:**

```
GET /api/call-logs?page=1&limit=20&facilityName=Hospital&callType=product_inquiry&startDate=2026-03-01&endDate=2026-03-12

Headers:
Authorization: Bearer YOUR_TOKEN
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "call-789",
      "clientName": "Aga Khan Hospital",
      "clientPhone": "+254-700-123456",
      "callDirection": "outbound",
      "callDate": "2026-03-12T00:00:00.000Z",
      "callTime": "14:30",
      "callDuration": 0,
      "callOutcome": "interested",
      "callType": "product_inquiry",
      "nextAction": "Product inquiry: Dialysis Machine",
      "followUpDate": "2026-04-15T00:00:00.000Z",
      "facilityName": "Aga Khan Hospital",
      "facilityLocation": "Nairobi",
      "contactPerson": {
        "name": "Dr. John Doe",
        "role": "Medical Director",
        "email": "john@agakhan.com",
        "phone": "+254-700-123456",
        "department": "Administration"
      },
      "createdBy": {
        "_id": "user-123",
        "firstName": "admin",
        "lastName": "user"
      },
      "createdAt": "2026-03-12T14:30:45.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "pages": 3,
    "limit": 20
  }
}
```

---

### 3. Get Telesales Call History (GET)

**Endpoint:** `GET /api/call-logs/telesales/history?facilityName=HospitalName`

**Authentication:** Required (Bearer Token)  
**Authorization:** Any authenticated user (users see only their calls, admins see all)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| facilityName | string | ✅ | Facility name to search for |
| page | number | ❌ | Page number (default: 1) |
| limit | number | ❌ | Results per page (default: 50) |

**Example Request:**

```
GET /api/call-logs/telesales/history?facilityName=Aga%20Khan%20Hospital&page=1&limit=50

Headers:
Authorization: Bearer YOUR_TOKEN
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "call-789",
      "clientName": "Aga Khan Hospital",
      "facilityName": "Aga Khan Hospital",
      "callDate": "2026-03-12T00:00:00.000Z",
      "callTime": "14:30",
      "callType": "product_inquiry",
      "callOutcome": "interested",
      "nextAction": "Product inquiry: Dialysis Machine",
      "createdBy": {
        "_id": "user-123",
        "firstName": "admin",
        "lastName": "user"
      },
      "createdAt": "2026-03-12T14:30:45.000Z"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "pages": 1,
    "limit": 50
  }
}
```

---

### 4. Get Telesales Summary Statistics (GET)

**Endpoint:** `GET /api/call-logs/telesales/summary`

**Authentication:** Required (Bearer Token)  
**Authorization:** Any authenticated user (users see only their data, admins see all)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| facilityName | string | Filter by facility name (optional) |
| startDate | string | Start date in YYYY-MM-DD format |
| endDate | string | End date in YYYY-MM-DD format |

**Example Request:**

```
GET /api/call-logs/telesales/summary?startDate=2026-03-01&endDate=2026-03-12

Headers:
Authorization: Bearer YOUR_TOKEN
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalCalls": 45,
    "totalDuration": 1800,
    "avgDuration": 40,
    "productInquiries": 15,
    "serviceInquiries": 10,
    "machineInquiries": 8,
    "followUps": 12,
    "interested": 25,
    "saleClosed": 5,
    "followUpNeeded": 8,
    "noAnswer": 4,
    "notInterested": 3,
    "conversionRate": "11.11",
    "interestRate": "66.67"
  }
}
```

**Metrics Explained:**

- **totalCalls**: Total number of calls recorded
- **totalDuration**: Combined duration of all calls in seconds
- **avgDuration**: Average call duration
- **productInquiries**: Number of product inquiry calls
- **serviceInquiries**: Number of service inquiry calls
- **machineInquiries**: Number of machine inquiry calls
- **followUps**: Number of follow-up calls
- **interested**: Calls with interested outcome
- **saleClosed**: Calls that resulted in closed sales
- **conversionRate**: Percentage of calls that resulted in sales
- **interestRate**: Percentage of calls where client showed interest

---

### 5. Get Call Statistics (GET)

**Endpoint:** `GET /api/call-logs/statistics`

**Authentication:** Required (Bearer Token)  
**Authorization:** Any authenticated user

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| year | number | Filter by year |
| month | number | Filter by month (1-12) |
| week | number | Filter by week number |
| userId | string | Filter by specific user (admin only) |

**Example Request:**

```
GET /api/call-logs/statistics?year=2026&month=3
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalCalls": 45,
    "totalDuration": 1800,
    "avgDuration": 40,
    "inboundCalls": 8,
    "outboundCalls": 37,
    "noAnswer": 4,
    "interested": 25,
    "followUpNeeded": 8,
    "notInterested": 3,
    "saleClosed": 5,
    "conversionRate": "11.11"
  }
}
```

---

### 6. Get Upcoming Follow-ups (GET)

**Endpoint:** `GET /api/call-logs/follow-ups`

**Authentication:** Required (Bearer Token)  
**Authorization:** Any authenticated user

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| days | number | Number of days to look ahead (default: 7) |

**Example Request:**

```
GET /api/call-logs/follow-ups?days=14
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "call-789",
      "clientName": "Aga Khan Hospital",
      "facilityName": "Aga Khan Hospital",
      "callDate": "2026-03-12T00:00:00.000Z",
      "followUpDate": "2026-03-20T00:00:00.000Z",
      "callNotes": "Client very interested",
      "createdBy": {
        "_id": "user-123",
        "firstName": "admin",
        "lastName": "user",
        "email": "admin@accord.com"
      }
    }
  ]
}
```

---

### 7. Get Call Log by ID (GET)

**Endpoint:** `GET /api/call-logs/:id`

**Authentication:** Required (Bearer Token)  
**Authorization:** Creator or admin/manager

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Call log ID |

**Example Request:**

```
GET /api/call-logs/call-789
```

**Response:** Returns single call log with full details

---

### 8. Update Call Log (PUT)

**Endpoint:** `PUT /api/call-logs/:id`

**Authentication:** Required (Bearer Token)  
**Authorization:** Creator or admin/manager

**Request Body:** Any updatable fields (see Create endpoint for field list)

**Example Request:**

```json
PUT /api/call-logs/call-789

{
  "callOutcome": "sale_closed",
  "callNotes": "Deal finalized, delivery scheduled for March 20",
  "followUpDate": null
}
```

---

### 9. Delete Call Log (DELETE)

**Endpoint:** `DELETE /api/call-logs/:id`

**Authentication:** Required (Bearer Token)  
**Authorization:** Creator or admin/manager

**Response:**

```json
{
  "success": true,
  "message": "Call log deleted successfully"
}
```

---

## Admin-Specific Endpoints

### Admin Get All Call Logs

**Endpoint:** `GET /api/admin/call-logs`

**Authentication:** Required (Bearer Token)  
**Authorization:** Admin or Manager only

**Features:**
- See call logs from all users
- Use all filters available
- Same parameters as `/api/call-logs`

---

## Implementation Changes

### 1. CallLog Model Updates

**New Fields Added:**

```javascript
// Telesales categorization
callType: 'product_inquiry' | 'service_inquiry' | 'machine_inquiry' | 'follow_up' | 'general'

// Facility information
facilityName: String
facilityLocation: String

// Contact person details
contactPerson: {
  name: String,
  role: String,
  email: String,
  phone: String,
  department: String
}

// Telesales specific fields
productInterest: String
expectedPurchaseDate: Date
machineModel: String
machineSerialNumber: String
serviceAccepted: Boolean
serviceRequestType: 'maintenance' | 'repair' | 'installation' | 'upgrade' | 'other'
```

**New Indexes:**

```javascript
{ facilityName: 1, callDate: -1 }
{ callType: 1, callDate: -1 }
```

---

### 2. Controller Enhancements

**Updated Functions:**

- `createCallLog()` - Now handles telesales-specific fields
- `getCallLogs()` - Enhanced with facilityName and callType filtering

**New Functions:**

- `getTelesalesCallHistory()` - Optimized for telesales module
- `getTelesalesSummary()` - Calculates telesales-specific metrics

---

### 3. Route Updates

**New Routes Added:**

```
GET /api/call-logs/telesales/history
GET /api/call-logs/telesales/summary
GET /api/admin/call-logs/telesales/history (admin only)
GET /api/admin/call-logs/telesales/summary (admin only)
```

---

## Usage Examples

### JavaScript (Fetch API)

```javascript
// Create a call log
const callData = {
  clientName: 'Nairobi Hospital',
  clientPhone: '+254-700-123456',
  callDirection: 'outbound',
  callDate: '2026-03-12',
  callTime: '14:30',
  callDuration: 0,
  callOutcome: 'interested',
  callType: 'product_inquiry',
  nextAction: 'Product inquiry: Dialysis',
  facilityName: 'Nairobi Hospital',
  facilityLocation: 'Nairobi',
  contactPerson: {
    name: 'Dr. John',
    role: 'Medical Director',
    phone: '+254-700-123456',
    email: 'john@nairobi-hospital.com'
  },
  productInterest: 'Dialysis Machine',
  callNotes: 'Very interested in pricing'
};

const response = await fetch('/api/call-logs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(callData)
});

const result = await response.json();
console.log('Call logged:', result.data._id);
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Create call log
const { data } = await apiClient.post('/call-logs', callData);

// Get call history for facility
const { data: history } = await apiClient.get('/call-logs/telesales/history', {
  params: {
    facilityName: 'Nairobi Hospital',
    page: 1,
    limit: 50
  }
});

// Get telesales summary
const { data: summary } = await apiClient.get('/call-logs/telesales/summary', {
  params: {
    startDate: '2026-03-01',
    endDate: '2026-03-31'
  }
});
```

### Python

```python
import requests
import json

TOKEN = "your_bearer_token"
BASE_URL = "http://localhost:5000/api"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Create call log
call_data = {
    "clientName": "Nairobi Hospital",
    "clientPhone": "+254-700-123456",
    "callDirection": "outbound",
    "callDate": "2026-03-12",
    "callTime": "14:30",
    "callDuration": 0,
    "callOutcome": "interested",
    "callType": "product_inquiry",
    "facilityName": "Nairobi Hospital"
}

response = requests.post(
    f"{BASE_URL}/call-logs",
    headers=headers,
    json=call_data
)

result = response.json()
print(f"Call created: {result['data']['_id']}")

# Get call history
response = requests.get(
    f"{BASE_URL}/call-logs/telesales/history",
    headers=headers,
    params={"facilityName": "Nairobi Hospital"}
)

history = response.json()
print(f"Found {len(history['data'])} calls for facility")
```

### cURL

```bash
# Create call log
curl -X POST http://localhost:5000/api/call-logs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Nairobi Hospital",
    "clientPhone": "+254-700-123456",
    "callDirection": "outbound",
    "callDate": "2026-03-12",
    "callTime": "14:30",
    "callDuration": 0,
    "callOutcome": "interested",
    "callType": "product_inquiry",
    "facilityName": "Nairobi Hospital"
  }'

# Get call history
curl -X GET "http://localhost:5000/api/call-logs/telesales/history?facilityName=Nairobi%20Hospital" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get telesales summary
curl -X GET "http://localhost:5000/api/call-logs/telesales/summary?startDate=2026-03-01&endDate=2026-03-12" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────┐
│      Telesales Component                     │
│  (Records call with all details)             │
└────────────────┬────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  POST /api/call-logs│
        │  (Create Call Log)   │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │   CallLog Model    │
        │  (Validate & Save)  │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │   MongoDB Storage  │
        │  (Persistent)      │
        └────────┬───────────┘
                 │
        ┌────────┴──────────┐
        │                   │
        ▼                   ▼
┌──────────────────┐ ┌──────────────────┐
│ GET /call-logs   │ │ GET /telesales/* │
│ (View History)   │ │ (Get Summary)    │
└──────────────────┘ └──────────────────┘
        │                   │
        └───────┬───────────┘
                ▼
        ┌───────────────────┐
        │ Telesales Module  │
        │  (Display Data)   │
        └───────────────────┘
```

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**Common Status Codes:**

- `400` - Missing required fields or invalid request
- `401` - Authentication required
- `403` - Authorization failed
- `404` - Call log not found
- `500` - Server error

---

## Database Schema

**CallLog Collection:**

```javascript
{
  _id: ObjectId,
  
  // Core call information
  clientName: String,
  clientPhone: String,
  callDirection: String ('inbound' | 'outbound'),
  callDate: Date,
  callTime: String,
  callDuration: Number,
  callOutcome: String,
  callType: String,
  
  // Facility & contact info
  facilityName: String,
  facilityLocation: String,
  contactPerson: {
    name: String,
    role: String,
    email: String,
    phone: String,
    department: String
  },
  
  // Follow-up info
  nextAction: String,
  followUpDate: Date,
  
  // Notes & categorization
  callNotes: String,
  tags: [String],
  
  // Telesales specific
  productInterest: String,
  expectedPurchaseDate: Date,
  machineModel: String,
  machineSerialNumber: String,
  serviceAccepted: Boolean,
  serviceRequestType: String,
  
  // Metadata
  year: Number,
  month: Number,
  week: Number,
  
  // References
  createdBy: ObjectId (ref: User),
  relatedLead: ObjectId (ref: Lead),
  relatedVisit: ObjectId (ref: Visit),
  
  // Status
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Migration Notes

### From Previous Version

If you're upgrading from a previous version:

1. **New fields are optional** - Existing call logs will work fine
2. **No data loss** - All previous data is preserved
3. **Backward compatible** - Old create/read operations still work
4. **Indexes added** - Performance improved for telesales queries

### Database Indexes

The following indexes are automatically created:

```javascript
{year: 1, month: 1, week: 1}
{callDate: -1}
{createdBy: 1, callDate: -1}
{clientPhone: 1, callDate: -1}
{facilityName: 1, callDate: -1}
{callOutcome: 1, followUpDate: 1}
{callType: 1, callDate: -1}
{clientName: 'text', callNotes: 'text'}
```

---

## Best Practices

### 1. Auto-populate Date/Time in Frontend

The telesales component should auto-capture the current date and time:

```javascript
const now = new Date();
const callDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
const callTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
```

### 2. Always Include Contact Details

When recording product or service inquiries, always include:

```javascript
{
  callType: 'product_inquiry',
  facilityName: ...,
  contactPerson: {
    name: ...,
    role: ...,
    phone: ...,
    email: ...,
    department: ...
  }
}
```

### 3. Use Call Types for Categorization

Always specify the `callType` for better filtering and analytics:

- `product_inquiry` - Client asking about products
- `service_inquiry` - Client requesting service
- `machine_inquiry` - Question about existing machines
- `follow_up` - Reminder/follow-up call
- `general` - Other types of calls

### 4. Track Service Requests

When accepting service inquiries:

```javascript
{
  callType: 'service_inquiry',
  serviceAccepted: true,
  serviceRequestType: 'maintenance',
  machineModel: 'Client existing machine model',
  nextAction: 'Service task created - ' + machineModel
}
```

### 5. Use Pagination for Large Result Sets

Always use pagination when fetching:

```javascript
GET /api/call-logs?page=1&limit=20&facilityName=Hospital
```

---

## Testing

### Test Create Call

```bash
curl -X POST http://localhost:5000/api/call-logs \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Test Hospital",
    "clientPhone": "+254-700-000000",
    "callDirection": "outbound",
    "callDate": "2026-03-12",
    "callTime": "14:30",
    "callDuration": 0,
    "callOutcome": "interested",
    "callType": "product_inquiry"
  }'
```

### Test Get History

```bash
curl "http://localhost:5000/api/call-logs/telesales/history?facilityName=Test%20Hospital" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Support & Troubleshooting

### Issue: Call not saved

**Solution:** Verify all required fields are provided:
- clientName, clientPhone, callDirection, callDate, callTime, callDuration, callOutcome

### Issue: No results in history

**Solution:** Check facility name matches exactly (case-insensitive search)

### Issue: Permission denied

**Solution:** Ensure users have 'admin' or 'manager' role for admin endpoints

---

## Summary

The Telesales API is now fully implemented with:

✅ Complete call logging with auto-save to database  
✅ Facility and contact information tracking  
✅ Call type categorization (product, service, machine, follow-up)  
✅ Comprehensive history retrieval with filtering  
✅ Telesales-specific summary statistics  
✅ Service request tracking and automation  
✅ Pagination and search capabilities  
✅ Full authorization and authentication  
✅ Performance optimized indexes  
✅ Backward compatible with existing data

**Status:** Production Ready - March 12, 2026
