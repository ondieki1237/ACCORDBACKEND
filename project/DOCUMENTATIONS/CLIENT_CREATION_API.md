# Client Creation API Documentation

## Overview

This document describes the two methods for creating new clients in the ACCORD system:
1. **Creating a Client WITHOUT Machine** - Simple client registration
2. **Creating a Client WITH Machine** - Client registration + Machine installation

---

## Method 1: Create Client WITHOUT Machine

Use this when you're registering a new facility/client that doesn't have a machine installed yet.

### Endpoint
```
POST /api/admin/clients/
```

### Authentication
- **Required**: Bearer Token (JWT)
- **Role Required**: `admin` or `manager`

### Request Headers
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Request Body

**Option A: Nested Structure (Recommended)**
```json
{
  "facility": {
    "name": "Nairobi Clinic",
    "location": "Nairobi"
  },
  "contactPerson": {
    "name": "Dr. Jane Smith",
    "phone": "+254712345678",
    "role": "Medical Director"
  }
}
```

**Option B: Flat Structure**
```json
{
  "facilityName": "Nairobi Clinic",
  "location": "Nairobi",
  "contactPerson": "Dr. Jane Smith",
  "phoneNumber": "+254712345678",
  "role": "Medical Director"
}
```

### Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `facility.name` or `facilityName` | string | ✅ Yes | Name of the facility/client |
| `facility.location` or `location` | string | ⚪ No | City/region where facility is located |
| `contactPerson.name` or `contactPerson` | string | ✅ Yes | Full name of contact person |
| `contactPerson.phone` or `phoneNumber` | string | ✅ Yes | Phone number of contact person |
| `contactPerson.role` or `role` | string | ⚪ No | Role of contact person (default: "Contact") |

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Nairobi Clinic",
    "location": "Nairobi",
    "contactPerson": {
      "name": "Dr. Jane Smith",
      "phone": "+254712345678",
      "role": "Medical Director"
    },
    "status": "active",
    "type": "clinic",
    "metadata": {
      "createdBy": "507f1f77bcf86cd799439012"
    },
    "createdAt": "2026-03-17T10:30:00Z",
    "updatedAt": "2026-03-17T10:30:00Z"
  }
}
```

### Error Responses

**400 - Missing Required Field**
```json
{
  "success": false,
  "message": "Client name is required"
}
```

**400 - Duplicate Client Name**
```json
{
  "success": false,
  "message": "Client with this name already exists",
  "field": "name"
}
```

**400 - Validation Error**
```json
{
  "success": false,
  "message": "Validation error",
  "details": ["error message 1", "error message 2"]
}
```

**500 - Server Error**
```json
{
  "success": false,
  "message": "Failed to create client",
  "error": "Internal server error details"
}
```

### Database Storage

**Collection**: `clients`

**Sample Document**:
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "Nairobi Clinic",
  "location": "Nairobi",
  "contactPerson": {
    "name": "Dr. Jane Smith",
    "phone": "+254712345678",
    "role": "Medical Director"
  },
  "status": "active",
  "type": "clinic",
  "metadata": {
    "createdBy": ObjectId("507f1f77bcf86cd799439012")
  },
  "createdAt": ISODate("2026-03-17T10:30:00Z"),
  "updatedAt": ISODate("2026-03-17T10:30:00Z")
}
```

---

## Method 2: Create Client WITH Machine

Use this when registering a new facility/client AND installing a machine at the same time.

### Endpoint
```
POST /api/admin/machines/
```

### Authentication
- **Required**: Bearer Token (JWT)
- **Role Required**: `admin` or `manager`

### Request Headers
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Request Body

**Option A: Nested Structure (Recommended)**
```json
{
  "facility": {
    "name": "Kenyatta National Hospital",
    "location": "Nairobi"
  },
  "contactPerson": {
    "name": "Dr. John Njoroge",
    "phone": "+254712345678",
    "role": "Facility Manager"
  },
  "machineInstalled": true,
  "machineName": "X-Ray Model 5000",
  "serialNumber": "SN-2026-001",
  "manufacturer": "Siemens"
}
```

**Option B: Flat Structure**
```json
{
  "facilityName": "Kenyatta National Hospital",
  "location": "Nairobi",
  "contactPerson": "Dr. John Njoroge",
  "phoneNumber": "+254712345678",
  "role": "Facility Manager",
  "machineInstalled": true,
  "machineName": "X-Ray Model 5000",
  "serialNumber": "SN-2026-001",
  "manufacturer": "Siemens"
}
```

### Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `facility.name` or `facilityName` | string | ✅ Yes | Name of the facility |
| `facility.location` or `location` | string | ⚪ No | City/region where facility is located |
| `contactPerson.name` or `contactPerson` | string | ✅ Yes | Full name of contact person |
| `contactPerson.phone` or `phoneNumber` | string | ✅ Yes | Phone number of contact person |
| `contactPerson.role` or `role` | string | ⚪ No | Role of contact person |
| `machineInstalled` | boolean | ✅ Yes | Must be `true` to create machine |
| `machineName` | string | ✅ Yes (if machineInstalled=true) | Model/name of the machine |
| `serialNumber` | string | ✅ Yes (if machineInstalled=true) | Serial number of machine |
| `manufacturer` | string | ⚪ No | Manufacturer of the machine |

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Machine installed successfully",
  "data": {
    "client": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Kenyatta National Hospital",
      "location": "Nairobi",
      "contactPerson": {
        "name": "Dr. John Njoroge",
        "phone": "+254712345678",
        "role": "Facility Manager"
      },
      "status": "active",
      "type": "clinic",
      "createdAt": "2026-03-17T10:30:00Z"
    },
    "machine": {
      "_id": "507f1f77bcf86cd799439013",
      "serialNumber": "SN-2026-001",
      "model": "X-Ray Model 5000",
      "manufacturer": "Siemens",
      "facility": {
        "name": "Kenyatta National Hospital",
        "location": "Nairobi"
      },
      "contactPerson": {
        "name": "Dr. John Njoroge",
        "phone": "+254712345678",
        "role": "Facility Manager"
      },
      "status": "active",
      "createdAt": "2026-03-17T10:30:00Z"
    }
  }
}
```

### Error Responses

**400 - Missing Required Field**
```json
{
  "success": false,
  "message": "Machine name is required when machine is installed"
}
```

**400 - Missing Serial Number**
```json
{
  "success": false,
  "message": "Serial number is required when machine is installed"
}
```

**500 - Server Error**
```json
{
  "success": false,
  "message": "Failed to install machine",
  "error": "Internal server error details"
}
```

### Database Storage

**Collections**: Both `clients` AND `machines`

**Client Document** (in `clients` collection):
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "Kenyatta National Hospital",
  "location": "Nairobi",
  "contactPerson": {
    "name": "Dr. John Njoroge",
    "phone": "+254712345678",
    "role": "Facility Manager"
  },
  "status": "active",
  "type": "clinic",
  "metadata": {
    "createdBy": ObjectId("507f1f77bcf86cd799439012")
  },
  "createdAt": ISODate("2026-03-17T10:30:00Z"),
  "updatedAt": ISODate("2026-03-17T10:30:00Z")
}
```

**Machine Document** (in `machines` collection):
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "serialNumber": "SN-2026-001",
  "model": "X-Ray Model 5000",
  "manufacturer": "Siemens",
  "facility": {
    "name": "Kenyatta National Hospital",
    "location": "Nairobi"
  },
  "contactPerson": {
    "name": "Dr. John Njoroge",
    "phone": "+254712345678",
    "role": "Facility Manager"
  },
  "status": "active",
  "metadata": {
    "createdBy": ObjectId("507f1f77bcf86cd799439012")
  },
  "createdAt": ISODate("2026-03-17T10:30:00Z"),
  "updatedAt": ISODate("2026-03-17T10:30:00Z")
}
```

---

## Comparison Table

| Feature | Without Machine | With Machine |
|---------|-----------------|--------------|
| **Endpoint** | `POST /api/admin/clients/` | `POST /api/admin/machines/` |
| **Creates Client** | ✅ Yes | ✅ Yes |
| **Creates Machine** | ❌ No | ✅ Yes |
| **Database Collections** | `clients` | `clients` + `machines` |
| **Use Case** | Future prospects, contacts only | Ready-to-use installations |
| **Machine Fields Required** | N/A | machineName, serialNumber |

---

## Complete Examples

### Example 1: Create Client WITHOUT Machine

**Request:**
```bash
curl -X POST http://localhost:4500/api/admin/clients/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "facility": {
      "name": "Hope Pharmacy",
      "location": "Mombasa"
    },
    "contactPerson": {
      "name": "Ahmed Hassan",
      "phone": "+254712111111",
      "role": "Owner"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Hope Pharmacy",
    "location": "Mombasa",
    "contactPerson": {
      "name": "Ahmed Hassan",
      "phone": "+254712111111",
      "role": "Owner"
    },
    "status": "active",
    "type": "clinic",
    "createdAt": "2026-03-17T11:00:00Z"
  }
}
```

---

### Example 2: Create Client WITH Machine

**Request:**
```bash
curl -X POST http://localhost:4500/api/admin/machines/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "facility": {
      "name": "Aga Khan Hospital",
      "location": "Nairobi"
    },
    "contactPerson": {
      "name": "Dr. Sarah Ochieng",
      "phone": "+254723456789",
      "role": "Radiology Director"
    },
    "machineInstalled": true,
    "machineName": "Ultrasound Scanner Pro",
    "serialNumber": "US-2026-0042",
    "manufacturer": "GE Healthcare"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Machine installed successfully",
  "data": {
    "client": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Aga Khan Hospital",
      "location": "Nairobi",
      "contactPerson": {
        "name": "Dr. Sarah Ochieng",
        "phone": "+254723456789",
        "role": "Radiology Director"
      },
      "status": "active",
      "createdAt": "2026-03-17T11:15:00Z"
    },
    "machine": {
      "_id": "507f1f77bcf86cd799439016",
      "serialNumber": "US-2026-0042",
      "model": "Ultrasound Scanner Pro",
      "manufacturer": "GE Healthcare",
      "status": "active",
      "createdAt": "2026-03-17T11:15:00Z"
    }
  }
}
```

---

## Decision Guide

### Choosing the Right Endpoint

**Use `/api/admin/clients/` when:**
- ✅ Registering a new facility/prospect without equipment
- ✅ Building customer contact list
- ✅ Planning for future installations
- ✅ Managing facility information only

**Use `/api/admin/machines/` when:**
- ✅ Installing a machine at a new facility
- ✅ Both client and equipment need to be recorded
- ✅ Creating complete installation record
- ✅ Setting up machine for service tracking

---

## Client Management Endpoints

Once a client is created via `/api/admin/clients/`, you can manage it with these endpoints:

### Get All Clients
```
GET /api/admin/clients/?page=1&limit=20&search=clinic&status=active
```

### Get Single Client
```
GET /api/admin/clients/{CLIENT_ID}
```

### Update Client
```
PUT /api/admin/clients/{CLIENT_ID}
```

**Request Body:**
```json
{
  "name": "New Name",
  "location": "New Location",
  "contactPerson": {
    "name": "New Contact",
    "phone": "+254712345678",
    "role": "New Role"
  },
  "status": "active"
}
```

### Delete Client
```
DELETE /api/admin/clients/{CLIENT_ID}
```

---

## Best Practices

1. **Always validate phone numbers** before submission
2. **Use unique facility names** to avoid duplicates
3. **Provide complete contact information** for follow-up
4. **For machines, include accurate serial numbers** for warranty tracking
5. **Use appropriate role/type** for better categorization
6. **Make sure manufacturer is correct** for machine records

---

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Client name is required" | Missing facility name | Check that `facility.name` or `facilityName` is provided |
| "Phone number is required" | Missing contact phone | Check that `contactPerson.phone` or `phoneNumber` is provided |
| "Client with this name already exists" | Duplicate name | Use a different facility name or update existing client |
| "Machine name is required" | Missing machine name when installing | Include `machineName` field if `machineInstalled=true` |
| "Serial number is required" | Missing serial number for machine | Include `serialNumber` field if `machineInstalled=true` |
| "Invalid authentication" | Missing/invalid JWT token | Ensure valid Bearer token in Authorization header |
| "Unauthorized" | Insufficient permissions | Ensure user has `admin` or `manager` role |

---

## Implementation Notes

- Both endpoints support flexible payload structures (flat or nested)
- Client names are unique within the system
- All phone numbers are stored as provided (no formatting applied)
- Timestamps are automatically managed by the system
- User ID is automatically captured from JWT token

---

## Integration Examples

### JavaScript/Node.js
```javascript
// Create client without machine
const createClientWithoutMachine = async (clientData, token) => {
  const response = await fetch('http://localhost:4500/api/admin/clients/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      facility: clientData.facility,
      contactPerson: clientData.contactPerson
    })
  });
  return response.json();
};

// Create client with machine
const createClientWithMachine = async (clientData, machineData, token) => {
  const response = await fetch('http://localhost:4500/api/admin/machines/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      facility: clientData.facility,
      contactPerson: clientData.contactPerson,
      machineInstalled: true,
      machineName: machineData.name,
      serialNumber: machineData.serialNumber,
      manufacturer: machineData.manufacturer
    })
  });
  return response.json();
};
```

### Python
```python
import requests

def create_client_without_machine(client_data, token):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    payload = {
        'facility': client_data['facility'],
        'contactPerson': client_data['contactPerson']
    }
    response = requests.post(
        'http://localhost:4500/api/admin/clients/',
        json=payload,
        headers=headers
    )
    return response.json()

def create_client_with_machine(client_data, machine_data, token):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    payload = {
        'facility': client_data['facility'],
        'contactPerson': client_data['contactPerson'],
        'machineInstalled': True,
        'machineName': machine_data['name'],
        'serialNumber': machine_data['serial_number'],
        'manufacturer': machine_data['manufacturer']
    }
    response = requests.post(
        'http://localhost:4500/api/admin/machines/',
        json=payload,
        headers=headers
    )
    return response.json()
```

---

## Support & Questions

For additional support or questions about these APIs, refer to:
- [Admin API Documentation](./ADMIN_API_COMPLETE_SUMMARY.md)
- [Machine Installation API](./MACHINE_INSTALLATION_API.md)
- [Backend API Documentation](./BACKEND_API_DOCUMENTATION.md)
