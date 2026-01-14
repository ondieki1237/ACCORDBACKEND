# Admin API - Machines Management

**Version:** 1.0  
**Last Updated:** January 3, 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Bulk Create Machines](#bulk-create-machines)
3. [Create Machine](#create-machine)
4. [List Machines](#list-machines)
5. [Get Machine Details](#get-machine-details)
6. [Update Machine](#update-machine)
7. [Delete Machine](#delete-machine)
8. [Trigger Service Reports](#trigger-service-reports)
9. [Examples](#examples)

---

## Overview

Machines management endpoints allow admins to track medical equipment inventory across facilities, monitor service schedules, and manage equipment maintenance.

**Base Path**: `/api/admin/machines`  
**Required Role**: `admin` or `manager`  
**Authentication**: Required (Bearer Token)

---

## Bulk Create Machines

Create multiple machines in a single request (useful for initial data import).

### Endpoint

```http
POST /api/admin/machines/bulk
```

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request Body

```json
[
  {
    "model": "DX-5000",
    "manufacturer": "Siemens",
    "facility": {
      "name": "Nairobi General Hospital",
      "code": "NGH001",
      "location": "Nairobi CBD"
    },
    "serialNumber": "SN123456",
    "installationDate": "2024-03-15T00:00:00.000Z",
    "lastServiceDate": "2025-12-01T00:00:00.000Z",
    "nextServiceDueDate": "2026-06-01T00:00:00.000Z",
    "warrantyExpiryDate": "2027-03-15T00:00:00.000Z",
    "serviceFrequency": 6,
    "status": "active",
    "category": "imaging",
    "notes": "Digital X-Ray system with PACS integration"
  },
  {
    "model": "Voluson E10",
    "manufacturer": "GE Healthcare",
    "facility": {
      "name": "Kenyatta National Hospital",
      "code": "KNH001",
      "location": "Upper Hill, Nairobi"
    },
    "serialNumber": "GE789012",
    "installationDate": "2023-08-20T00:00:00.000Z",
    "lastServiceDate": "2025-11-15T00:00:00.000Z",
    "nextServiceDueDate": "2026-05-15T00:00:00.000Z",
    "serviceFrequency": 6,
    "status": "active",
    "category": "imaging"
  }
]
```

### Request Fields (per machine)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| model | string | Yes | Equipment model number |
| manufacturer | string | Yes | Manufacturer/brand name |
| facility.name | string | Yes | Facility name |
| facility.code | string | No | Facility code/ID |
| facility.location | string | No | Facility location |
| serialNumber | string | No | Equipment serial number (unique) |
| installationDate | string | No | Installation date (ISO format) |
| lastServiceDate | string | No | Last service date (ISO format) |
| nextServiceDueDate | string | No | Next service due date (ISO format) |
| warrantyExpiryDate | string | No | Warranty expiry date (ISO format) |
| serviceFrequency | number | No | Service frequency in months |
| status | string | No | active, inactive, decommissioned |
| category | string | No | Equipment category |
| notes | string | No | Additional notes |

### Response

**Success (201 Created)**

```json
{
  "success": true,
  "message": "2 machines created successfully",
  "data": {
    "count": 2,
    "machines": [
      {
        "_id": "mach123abc",
        "model": "DX-5000",
        "manufacturer": "Siemens",
        "facility": {
          "name": "Nairobi General Hospital",
          "code": "NGH001",
          "location": "Nairobi CBD"
        },
        "serialNumber": "SN123456",
        "status": "active",
        "metadata": {
          "createdBy": "admin123",
          "createdAt": "2026-01-06T10:00:00.000Z"
        }
      },
      {
        "_id": "mach456def",
        "model": "Voluson E10",
        "manufacturer": "GE Healthcare",
        /* ... */
      }
    ]
  }
}
```

**Partial Success (207 Multi-Status)**

```json
{
  "success": true,
  "message": "1 machines created, some failed due to duplicates",
  "data": {
    "count": 1,
    "error": "Duplicate machine detected (check serial numbers)",
    "details": [
      {
        "index": 1,
        "keyValue": { "serialNumber": "GE789012" },
        "message": "Duplicate serial number"
      }
    ]
  }
}
```

**Error Responses**

**400 Bad Request - Invalid Input**
```json
{
  "success": false,
  "error": "Request body must be an array of machines"
}
```

**400 Bad Request - Missing Fields**
```json
{
  "success": false,
  "error": "2 machine(s) missing required fields",
  "details": [
    {
      "index": 0,
      "missingFields": ["model", "manufacturer"]
    },
    {
      "index": 3,
      "missingFields": ["facility.name"]
    }
  ]
}
```

### Example Request

```bash
curl -X POST "https://app.codewithseth.co.ke/api/admin/machines/bulk" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "model": "DX-5000",
      "manufacturer": "Siemens",
      "facility": {
        "name": "Nairobi General Hospital",
        "code": "NGH001"
      },
      "serialNumber": "SN123456",
      "installationDate": "2024-03-15",
      "status": "active"
    }
  ]'
```

---

## Create Machine

Create a single machine record.

### Endpoint

```http
POST /api/admin/machines
```

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request Body

```json
{
  "model": "DX-5000",
  "manufacturer": "Siemens",
  "facility": {
    "name": "Nairobi General Hospital",
    "code": "NGH001",
    "location": "Nairobi CBD"
  },
  "serialNumber": "SN123456",
  "installationDate": "2024-03-15T00:00:00.000Z",
  "lastServiceDate": "2025-12-01T00:00:00.000Z",
  "nextServiceDueDate": "2026-06-01T00:00:00.000Z",
  "warrantyExpiryDate": "2027-03-15T00:00:00.000Z",
  "serviceFrequency": 6,
  "status": "active",
  "category": "imaging",
  "specifications": {
    "power": "220V",
    "dimensions": "150x120x180 cm",
    "weight": "250 kg"
  },
  "notes": "Digital X-Ray system with PACS integration. Maintenance contract active."
}
```

### Response

```json
{
  "success": true,
  "message": "Machine created",
  "data": {
    "_id": "mach123abc",
    "model": "DX-5000",
    "manufacturer": "Siemens",
    "facility": {
      "name": "Nairobi General Hospital",
      "code": "NGH001",
      "location": "Nairobi CBD"
    },
    "serialNumber": "SN123456",
    "installationDate": "2024-03-15T00:00:00.000Z",
    "status": "active",
    "category": "imaging",
    "metadata": {
      "createdBy": {
        "_id": "admin123",
        "firstName": "Super",
        "lastName": "Admin",
        "email": "info@accordmedical.co.ke"
      },
      "createdAt": "2026-01-06T10:00:00.000Z"
    },
    "createdAt": "2026-01-06T10:00:00.000Z",
    "updatedAt": "2026-01-06T10:00:00.000Z"
  }
}
```

### Example Request

```bash
curl -X POST "https://app.codewithseth.co.ke/api/admin/machines" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "DX-5000",
    "manufacturer": "Siemens",
    "facility": {
      "name": "Nairobi General Hospital",
      "code": "NGH001"
    },
    "serialNumber": "SN123456",
    "status": "active"
  }'
```

---

## List Machines

Retrieve paginated list of all machines with filtering and search.

### Endpoint

```http
GET /api/admin/machines
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
| facilityName | string | No | Filter by facility name (case-insensitive) |
| model | string | No | Filter by model (case-insensitive) |
| manufacturer | string | No | Filter by manufacturer (case-insensitive) |
| search | string | No | Text search across multiple fields |

### Response

```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "mach123abc",
        "model": "DX-5000",
        "manufacturer": "Siemens",
        "facility": {
          "name": "Nairobi General Hospital",
          "code": "NGH001",
          "location": "Nairobi CBD"
        },
        "serialNumber": "SN123456",
        "installationDate": "2024-03-15T00:00:00.000Z",
        "lastServiceDate": "2025-12-01T00:00:00.000Z",
        "nextServiceDueDate": "2026-06-01T00:00:00.000Z",
        "warrantyExpiryDate": "2027-03-15T00:00:00.000Z",
        "serviceFrequency": 6,
        "status": "active",
        "category": "imaging",
        "createdAt": "2026-01-06T10:00:00.000Z"
      }
    ],
    "totalDocs": 245,
    "limit": 20,
    "page": 1,
    "totalPages": 13,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Example Requests

```bash
# List all machines
curl -X GET "https://app.codewithseth.co.ke/api/admin/machines?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search by facility name
curl -X GET "https://app.codewithseth.co.ke/api/admin/machines?facilityName=Nairobi" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by manufacturer
curl -X GET "https://app.codewithseth.co.ke/api/admin/machines?manufacturer=Siemens" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Text search
curl -X GET "https://app.codewithseth.co.ke/api/admin/machines?search=X-Ray" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Get Machine Details

Retrieve comprehensive details for a single machine.

### Endpoint

```http
GET /api/admin/machines/:id
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Machine MongoDB ObjectId |

### Response

```json
{
  "success": true,
  "data": {
    "_id": "mach123abc",
    "model": "DX-5000",
    "manufacturer": "Siemens",
    "facility": {
      "name": "Nairobi General Hospital",
      "code": "NGH001",
      "location": "Nairobi CBD",
      "contact": {
        "name": "Dr. Jane Smith",
        "phone": "+254711222333",
        "email": "jane@ngh.co.ke"
      }
    },
    "serialNumber": "SN123456",
    "installationDate": "2024-03-15T00:00:00.000Z",
    "lastServiceDate": "2025-12-01T00:00:00.000Z",
    "nextServiceDueDate": "2026-06-01T00:00:00.000Z",
    "warrantyExpiryDate": "2027-03-15T00:00:00.000Z",
    "serviceFrequency": 6,
    "status": "active",
    "category": "imaging",
    "specifications": {
      "power": "220V",
      "dimensions": "150x120x180 cm",
      "weight": "250 kg",
      "features": ["PACS integration", "Digital detector", "Auto-exposure control"]
    },
    "serviceHistory": [
      {
        "date": "2025-12-01T00:00:00.000Z",
        "type": "preventive",
        "engineer": "John Mwangi",
        "notes": "Routine maintenance completed. All systems operational.",
        "nextServiceDate": "2026-06-01T00:00:00.000Z"
      },
      {
        "date": "2025-06-01T00:00:00.000Z",
        "type": "preventive",
        "engineer": "John Mwangi",
        "notes": "6-month service. Replaced filters."
      }
    ],
    "notes": "Digital X-Ray system with PACS integration. Maintenance contract active until March 2027.",
    "metadata": {
      "createdBy": {
        "_id": "admin123",
        "firstName": "Super",
        "lastName": "Admin",
        "email": "info@accordmedical.co.ke"
      },
      "createdAt": "2026-01-06T10:00:00.000Z"
    },
    "createdAt": "2026-01-06T10:00:00.000Z",
    "updatedAt": "2026-01-06T10:00:00.000Z"
  }
}
```

### Example Request

```bash
curl -X GET "https://app.codewithseth.co.ke/api/admin/machines/mach123abc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Update Machine

Update machine information including service dates and status.

### Endpoint

```http
PUT /api/admin/machines/:id
```

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Machine MongoDB ObjectId |

### Request Body

```json
{
  "lastServiceDate": "2026-01-05T00:00:00.000Z",
  "nextServiceDueDate": "2026-07-05T00:00:00.000Z",
  "status": "active",
  "notes": "Service completed. All systems operational."
}
```

### Response

```json
{
  "success": true,
  "message": "Machine updated",
  "data": {
    "_id": "mach123abc",
    "model": "DX-5000",
    "lastServiceDate": "2026-01-05T00:00:00.000Z",
    "nextServiceDueDate": "2026-07-05T00:00:00.000Z",
    "status": "active",
    "updatedAt": "2026-01-06T11:30:00.000Z"
  }
}
```

### Example Requests

```bash
# Update service dates
curl -X PUT "https://app.codewithseth.co.ke/api/admin/machines/mach123abc" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lastServiceDate": "2026-01-05",
    "nextServiceDueDate": "2026-07-05",
    "notes": "Service completed"
  }'

# Update status
curl -X PUT "https://app.codewithseth.co.ke/api/admin/machines/mach123abc" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive",
    "notes": "Equipment decommissioned due to replacement"
  }'
```

---

## Delete Machine

Delete a machine record (admin only).

### Endpoint

```http
DELETE /api/admin/machines/:id
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Machine MongoDB ObjectId |

### Response

```json
{
  "success": true,
  "message": "Machine deleted"
}
```

### Example Request

```bash
curl -X DELETE "https://app.codewithseth.co.ke/api/admin/machines/mach123abc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Trigger Service Reports

Manually trigger machine service due reports (email notifications for machines requiring service).

### Endpoint

```http
POST /api/admin/machines/reports/due
```

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| days | number | No | Days ahead to check (default: 5) |

### Request Body

```json
{
  "days": 7,
  "recipients": [
    "manager@accordmedical.co.ke",
    "engineer@accordmedical.co.ke"
  ]
}
```

### Response

```json
{
  "success": true,
  "message": "Report queued",
  "data": {
    "machineDueCount": 12,
    "reportGenerated": true,
    "emailsSent": 2
  }
}
```

### Example Request

```bash
# Trigger report for machines due in next 7 days
curl -X POST "https://app.codewithseth.co.ke/api/admin/machines/reports/due?days=7" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["manager@accordmedical.co.ke"]
  }'
```

---

## Machine Status Options

| Status | Description |
|--------|-------------|
| active | Machine is operational and in use |
| inactive | Machine is not currently in use |
| decommissioned | Machine has been retired/removed |
| under_maintenance | Machine is currently being serviced |

---

## Equipment Categories

- `imaging` - Imaging equipment (X-Ray, CT, MRI, Ultrasound)
- `laboratory` - Laboratory equipment
- `monitoring` - Patient monitoring systems
- `surgical` - Surgical equipment
- `diagnostic` - Diagnostic equipment
- `other` - Other equipment types

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

// Create single machine
async function createMachine(machineData) {
  const response = await api.post('/admin/machines', machineData);
  return response.data;
}

// Bulk create machines
async function bulkCreateMachines(machinesArray) {
  const response = await api.post('/admin/machines/bulk', machinesArray);
  return response.data;
}

// List machines
async function listMachines(filters = {}) {
  const response = await api.get('/admin/machines', { params: filters });
  return response.data;
}

// Get machine details
async function getMachine(machineId) {
  const response = await api.get(`/admin/machines/${machineId}`);
  return response.data;
}

// Update machine
async function updateMachine(machineId, updates) {
  const response = await api.put(`/admin/machines/${machineId}`, updates);
  return response.data;
}

// Trigger service reports
async function triggerServiceReports(days, recipients) {
  const response = await api.post('/admin/machines/reports/due', {
    days,
    recipients
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

# Create machine
def create_machine(machine_data):
    response = requests.post(
        f"{BASE_URL}/admin/machines",
        headers=headers,
        json=machine_data
    )
    return response.json()

# List machines
def list_machines(filters=None):
    params = {"page": 1, "limit": 20}
    if filters:
        params.update(filters)
    
    response = requests.get(
        f"{BASE_URL}/admin/machines",
        headers=headers,
        params=params
    )
    return response.json()

# Update machine
def update_machine(machine_id, updates):
    response = requests.put(
        f"{BASE_URL}/admin/machines/{machine_id}",
        headers=headers,
        json=updates
    )
    return response.json()

# Example: Update machine service date
machine_id = "mach123abc"
result = update_machine(machine_id, {
    "lastServiceDate": "2026-01-05",
    "nextServiceDueDate": "2026-07-05",
    "notes": "Routine maintenance completed"
})
print(f"Machine updated: {result['message']}")
```

---

## Best Practices

### Machine Management

1. **Regular Updates**: Update service dates promptly after maintenance
2. **Serial Numbers**: Always include unique serial numbers
3. **Service Tracking**: Maintain accurate service history records
4. **Warranty Monitoring**: Track warranty expiry dates
5. **Bulk Import**: Use bulk create for initial data setup

### Service Scheduling

1. **Advance Planning**: Set service reminders 7-14 days ahead
2. **Frequency Tracking**: Record service frequency in months
3. **Engineer Assignment**: Assign specific engineers to equipment
4. **Service Documentation**: Document all service activities
5. **Next Service Date**: Always update next service due date

### Data Quality

1. **Complete Records**: Fill all relevant fields
2. **Facility Details**: Include facility codes and locations
3. **Contact Information**: Maintain facility contact details
4. **Status Updates**: Keep equipment status current
5. **Specifications**: Document technical specifications

---

## Related Endpoints

- **Engineering Services**: `GET /api/engineering-services`
- **Service Reports**: `POST /api/engineering-services`
- **Analytics**: `GET /api/admin/analytics`

---

**[← Back to Leads](./ADMIN_API_06_LEADS.md)** | **[Back to Index](./ADMIN_API_DOCUMENTATION_INDEX.md)** | **[Next: Consumables →](./ADMIN_API_08_CONSUMABLES.md)**
