# Machine Edit & Update API Documentation

## Overview
This document outlines the comprehensive API endpoints for editing, updating, and tracking machine details in the Accord Medical system.

---

## Endpoints

### 1. Update Single Machine
**Edit and save a machine's details with automatic audit trail tracking**

#### Method & Route
```
PUT /api/machines/{machineId}
```

#### Authentication
- ✅ Required: Bearer Token (JWT)
- Accessible to: All authenticated users

#### Request Parameters
- **Path Parameter**: 
  - `machineId` (ObjectId): The MongoDB ID of the machine to update

#### Request Body
Send any machine fields you want to update:

```json
{
  "serialNumber": "SN-2026-001",
  "model": "X-Ray Model 5000",
  "manufacturer": "Siemens",
  "version": "5.2.1",
  "facility": {
    "name": "Kenyatta National Hospital",
    "level": "Tertiary",
    "location": "Nairobi CBD"
  },
  "contactPerson": {
    "name": "John Doe",
    "role": "Facility Manager",
    "phone": "+254712345678",
    "email": "john@example.com"
  },
  "installedDate": "2025-03-15",
  "purchaseDate": "2024-12-01",
  "warrantyExpiry": "2027-12-01",
  "lastServicedAt": "2026-02-15",
  "nextServiceDue": "2026-05-15",
  "status": "active"
}
```

#### Response (Success - 200 OK)
```json
{
  "success": true,
  "message": "Machine updated successfully. 3 field(s) changed.",
  "data": {
    "machine": {
      "_id": "63f8a1b2c3d4e5f6g7h8i9j0",
      "serialNumber": "SN-2026-001",
      "model": "X-Ray Model 5000",
      "manufacturer": "Siemens",
      "status": "active",
      "createdAt": "2026-01-10T09:30:00Z",
      "updatedAt": "2026-03-16T10:15:00Z"
    },
    "audit": {
      "changedFields": ["model", "manufacturer", "status"],
      "changedCount": 3,
      "timestamp": "2026-03-16T10:15:00Z"
    }
  }
}
```

#### Response (Error Cases)

**Invalid Machine ID (400)**
```json
{
  "success": false,
  "message": "Invalid machine ID format"
}
```

**Machine Not Found (404)**
```json
{
  "success": false,
  "message": "Machine not found"
}
```

**Validation Error (400)**
```json
{
  "success": false,
  "message": "Validation error",
  "details": ["Model name cannot be empty"]
}
```

#### Example cURL
```bash
curl -X PUT http://localhost:4500/api/machines/63f8a1b2c3d4e5f6g7h8i9j0 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "X-Ray Model 5000",
    "status": "maintenance"
  }'
```

#### Example JavaScript (Fetch)
```javascript
const machineId = '63f8a1b2c3d4e5f6g7h8i9j0';
const token = localStorage.getItem('accessToken');

const response = await fetch(`/api/machines/${machineId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: "X-Ray Model 5000",
    warrantyExpiry: "2027-12-01",
    status: "active"
  })
});

const result = await response.json();
if (result.success) {
  console.log('Machine updated:', result.data.machine);
  console.log('Changed fields:', result.data.audit.changedFields);
}
```

---

### 2. Get Machine Update History
**View the complete audit trail of all changes made to a machine**

#### Method & Route
```
GET /api/machines/{machineId}/history
```

#### Authentication
- ✅ Required: Bearer Token (JWT)
- Accessible to: All authenticated users

#### Query Parameters
- `page` (integer, default: 1): Page number for pagination
- `limit` (integer, default: 20): Number of records per page

#### Request Example
```
GET /api/machines/63f8a1b2c3d4e5f6g7h8i9j0/history?page=1&limit=10
```

#### Response (Success - 200 OK)
```json
{
  "success": true,
  "data": {
    "machineId": "63f8a1b2c3d4e5f6g7h8i9j0",
    "machineModel": "X-Ray Model 5000",
    "totalUpdates": 5,
    "page": 1,
    "limit": 10,
    "pages": 1,
    "history": [
      {
        "_id": "664f8a1b2c3d4e5f6g7h8i9j1",
        "machineId": "63f8a1b2c3d4e5f6g7h8i9j0",
        "updatedBy": {
          "_id": "62a1b2c3d4e5f6g7h8i9j012",
          "firstName": "Seth",
          "lastName": "Kariuki",
          "email": "seth@example.com",
          "role": "admin"
        },
        "previousValues": {
          "status": "active"
        },
        "newValues": {
          "status": "maintenance"
        },
        "changedFields": ["status"],
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "timestamp": "2026-03-16T10:15:00Z"
      }
    ]
  }
}
```

#### Example cURL
```bash
curl -X GET "http://localhost:4500/api/machines/63f8a1b2c3d4e5f6g7h8i9j0/history?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 3. Bulk Update Machines
**Update multiple machines in a single request with audit trail for each**

#### Method & Route
```
PUT /api/machines
```

#### Authentication
- ✅ Required: Bearer Token (JWT)
- Accessible to: All authenticated users

#### Request Body
```json
{
  "machines": [
    {
      "id": "63f8a1b2c3d4e5f6g7h8i9j0",
      "status": "maintenance",
      "nextServiceDue": "2026-06-01"
    },
    {
      "id": "63f8a1b2c3d4e5f6g7h8i9j1",
      "status": "active",
      "lastServicedAt": "2026-03-16"
    },
    {
      "id": "63f8a1b2c3d4e5f6g7h8i9j2",
      "warrantyExpiry": "2028-01-15"
    }
  ]
}
```

#### Response (Success - 200 OK)
```json
{
  "success": true,
  "message": "3 machine(s) updated successfully",
  "data": {
    "updated": 3,
    "failed": 0,
    "results": [
      {
        "id": "63f8a1b2c3d4e5f6g7h8i9j0",
        "success": true,
        "changedFields": ["status", "nextServiceDue"]
      },
      {
        "id": "63f8a1b2c3d4e5f6g7h8i9j1",
        "success": true,
        "changedFields": ["status", "lastServicedAt"]
      },
      {
        "id": "63f8a1b2c3d4e5f6g7h8i9j2",
        "success": true,
        "changedFields": ["warrantyExpiry"]
      }
    ],
    "errors": []
  }
}
```

#### Response (Partial Success with Errors)
```json
{
  "success": true,
  "message": "2 machine(s) updated successfully",
  "data": {
    "updated": 2,
    "failed": 1,
    "results": [
      {
        "id": "63f8a1b2c3d4e5f6g7h8i9j0",
        "success": true,
        "changedFields": ["status"]
      },
      {
        "id": "63f8a1b2c3d4e5f6g7h8i9j1",
        "success": true,
        "changedFields": ["nextServiceDue"]
      }
    ],
    "errors": [
      {
        "id": "invalid-id",
        "error": "Invalid machine ID format"
      }
    ]
  }
}
```

#### Example JavaScript (Fetch)
```javascript
const token = localStorage.getItem('accessToken');

const updates = [
  {
    id: '63f8a1b2c3d4e5f6g7h8i9j0',
    status: 'maintenance',
    nextServiceDue: '2026-06-01'
  },
  {
    id: '63f8a1b2c3d4e5f6g7h8i9j1',
    status: 'active'
  }
];

const response = await fetch('/api/machines', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ machines: updates })
});

const result = await response.json();
console.log(`Updated: ${result.data.updated}, Failed: ${result.data.failed}`);
```

---

### 4. Admin: Update Single Machine
**Admin/Manager endpoint to update machine with enhanced audit tracking**

#### Method & Route
```
PUT /api/admin/machines/{machineId}
```

#### Authentication
- ✅ Required: Bearer Token (JWT)
- ✅ Role Required: `admin` or `manager`

#### Features (Same as User Endpoint)
- Automatic audit trail tracking
- Field-level change logging
- IP address and user-agent tracking
- Validation and error handling

#### Request & Response
Same as the "Update Single Machine" endpoint above.

---

### 5. Admin: Get Machine Update History
**Admin/Manager endpoint to view machine update history**

#### Method & Route
```
GET /api/admin/machines/{machineId}/history
```

#### Authentication
- ✅ Required: Bearer Token (JWT)
- ✅ Role Required: `admin` or `manager`

#### Features
- Complete audit trail with user information
- Pagination support
- IP and user-agent tracking

#### Request & Response
Same as "Get Machine Update History" endpoint above.

---

### 6. Admin: Bulk Update Machines
**Admin/Manager endpoint for bulk machine updates**

#### Method & Route
```
PUT /api/admin/machines
```

#### Authentication
- ✅ Required: Bearer Token (JWT)
- ✅ Role Required: `admin` or `manager`

#### Features
- Update multiple machines simultaneously
- Individual error handling
- Complete audit trail for each update

#### Request & Response
Same as "Bulk Update Machines" endpoint above.

---

## Key Features

### ✅ Audit Trail Tracking
Every update is logged with:
- **User**: Who made the update (ID, name, email)
- **Timestamp**: When the update was made
- **Changed Fields**: Which fields were modified
- **Previous Values**: The old data
- **New Values**: The updated data
- **IP Address**: Where the request came from
- **User-Agent**: Browser/client information

### ✅ Comprehensive Validation
- Required fields cannot be set to empty strings
- Invalid MongoDB ObjectIds are rejected
- Validation errors are clearly described
- Serial number uniqueness is enforced

### ✅ No Accidental Overwrites
- Only changed fields are logged as updates
- System metadata (timestamps, creator) cannot be updated via API
- Clear feedback on what actually changed

### ✅ Bulk Operations
- Update multiple machines in one request
- Individual error handling
- Detailed response showing success/failure for each machine

---

## Update Tracking Example

When you edit a machine's details through the API:

1. **System captures the current state** of the machine
2. **User provides new values** via PUT request
3. **System compares old vs new** and identifies changes
4. **Database is updated** with new values
5. **Audit trail is recorded** with:
   - What changed (field names)
   - Old values
   - New values
   - Who made the change
   - When it was changed
   - Where the request came from

Later, you can use the `/history` endpoint to see the complete audit trail for compliance and debugging.

---

## Machine Fields Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serialNumber` | String | No | Unique machine serial number |
| `model` | String | Yes | Machine model name |
| `manufacturer` | String | Yes | Manufacturer name |
| `version` | String | No | Software/firmware version |
| `facility.name` | String | Yes | Facility where machine is located |
| `facility.level` | String | No | Hospital level (Primary, Secondary, Tertiary) |
| `facility.location` | String | No | Geographic location |
| `contactPerson.name` | String | No | Contact person name |
| `contactPerson.role` | String | No | Contact person's role |
| `contactPerson.phone` | String | No | Contact phone number |
| `contactPerson.email` | String | No | Contact email address |
| `installedDate` | Date | No | When machine was installed |
| `purchaseDate` | Date | No | When machine was purchased |
| `warrantyExpiry` | Date | No | Warranty expiration date |
| `lastServicedAt` | Date | No | Last service date |
| `nextServiceDue` | Date | No | Next scheduled service date |
| `status` | String | No | Machine status: `active`, `inactive`, `decommissioned`, `maintenance` |

---

## Status Codes Reference

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Update successful |
| 400 | Bad Request | Invalid input, validation error, empty required field |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions (role-based) |
| 404 | Not Found | Machine not found |
| 500 | Server Error | Database or system error |

---

## Frontend Implementation Example

### React Component for Editing Machines

```javascript
import { useState } from 'react';

export function EditMachineForm({ machineId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    model: '',
    manufacturer: '',
    status: 'active',
    nextServiceDue: '',
    warrantyExpiry: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/machines/${machineId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        console.log(`Updated ${result.data.audit.changedCount} field(s)`);
        onSuccess(result.data.machine);
      } else {
        setError(result.message || 'Update failed');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="model"
        value={formData.model}
        onChange={handleChange}
        placeholder="Machine Model"
      />
      <input
        type="text"
        name="manufacturer"
        value={formData.manufacturer}
        onChange={handleChange}
        placeholder="Manufacturer"
      />
      <select
        name="status"
        value={formData.status}
        onChange={handleChange}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="maintenance">Maintenance</option>
        <option value="decommissioned">Decommissioned</option>
      </select>
      <input
        type="date"
        name="nextServiceDue"
        value={formData.nextServiceDue}
        onChange={handleChange}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

---

## Testing the API

### Using Postman

1. **Set up Bearer Token**:
   - Go to `Authorization` tab
   - Type: Bearer Token
   - Paste your JWT token

2. **Test Update Endpoint**:
   - Method: PUT
   - URL: `http://localhost:4500/api/machines/{machineId}`
   - Body (JSON):
     ```json
     {
       "status": "maintenance",
       "nextServiceDue": "2026-06-01"
     }
     ```

3. **Check Update History**:
   - Method: GET
   - URL: `http://localhost:4500/api/machines/{machineId}/history`

---

## Troubleshooting

### "Invalid machine ID format"
- Ensure the machine ID is a valid MongoDB ObjectId (24 hex characters)
- Example valid ID: `63f8a1b2c3d4e5f6g7h8i9j0`

### "Machine not found"
- Verify the machine ID exists in the database
- Check if you're using the correct database

### "Unauthorized - Invalid token"
- Token may be expired (refresh it using `/api/auth/refresh`)
- Ensure token is correctly formatted in header

### Validation errors
- Check that required fields are not empty strings
- Verify data types (dates should be ISO format: YYYY-MM-DD)

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Updates are atomic at the individual machine level
- Audit logs are permanent and cannot be deleted
- Only changed fields are included in the response audit data
- Bulk updates continue even if individual machines fail
