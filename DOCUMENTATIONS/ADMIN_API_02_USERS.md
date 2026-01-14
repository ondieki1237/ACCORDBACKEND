# Admin API - User Management

**Version:** 1.0  
**Last Updated:** January 3, 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [List All Users](#list-all-users)
3. [Create User](#create-user)
4. [Delete User](#delete-user)
5. [User Roles](#user-roles)
6. [Examples](#examples)

---

## Overview

User management endpoints allow admins to create, view, and manage all system users across different roles (admin, manager, sales, engineer).

**Base Path**: `/api/admin/users`  
**Required Role**: `admin`  
**Authentication**: Required (Bearer Token)

---

## List All Users

Retrieve a list of all users in the system.

### Endpoint

```http
GET /api/admin/users
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
| role | string | No | Filter by role (admin, manager, sales, engineer) |
| region | string | No | Filter by region |
| isActive | boolean | No | Filter by active status |
| search | string | No | Search by name or email |

### Response

```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "67890abc",
        "employeeId": "ADMIN001",
        "firstName": "Super",
        "lastName": "Admin",
        "email": "info@accordmedical.co.ke",
        "role": "admin",
        "department": "management",
        "phone": "+254700000000",
        "region": "National",
        "territory": "All",
        "isActive": true,
        "profileImage": null,
        "lastLogin": "2026-01-03T08:30:00.000Z",
        "targets": {
          "monthly": {
            "visits": 0,
            "orders": 0,
            "revenue": 0
          },
          "quarterly": {
            "visits": 0,
            "orders": 0,
            "revenue": 0
          }
        },
        "createdAt": "2026-01-03T06:15:00.000Z",
        "updatedAt": "2026-01-03T08:30:00.000Z"
      },
      {
        "_id": "12345xyz",
        "employeeId": "SALES001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@accordmedical.co.ke",
        "role": "sales",
        "department": "sales",
        "phone": "+254712345678",
        "region": "Nairobi",
        "territory": "Central",
        "isActive": true,
        "profileImage": "https://res.cloudinary.com/...",
        "lastLogin": "2026-01-02T14:20:00.000Z",
        "targets": {
          "monthly": {
            "visits": 50,
            "orders": 10,
            "revenue": 500000
          },
          "quarterly": {
            "visits": 150,
            "orders": 30,
            "revenue": 1500000
          }
        },
        "createdAt": "2025-12-01T10:00:00.000Z",
        "updatedAt": "2026-01-02T14:20:00.000Z"
      }
    ],
    "totalDocs": 45,
    "limit": 20,
    "page": 1,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Example Request

```bash
# List all users
curl -X GET "https://app.codewithseth.co.ke/api/admin/users" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by role
curl -X GET "https://app.codewithseth.co.ke/api/admin/users?role=sales&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search users
curl -X GET "https://app.codewithseth.co.ke/api/admin/users?search=john" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Create User

Create a new user with any role (admin, manager, sales, engineer).

### Endpoint

```http
POST /api/admin/users
```

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request Body

```json
{
  "employeeId": "SALES005",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@accordmedical.co.ke",
  "password": "SecurePass123",
  "role": "sales",
  "department": "sales",
  "phone": "+254723456789",
  "region": "Mombasa",
  "territory": "Coast"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| employeeId | string | Yes | Unique employee identifier |
| firstName | string | Yes | User's first name |
| lastName | string | Yes | User's last name |
| email | string | Yes | Valid email address (unique) |
| password | string | Yes | Password (min 6 characters) |
| role | string | Yes | User role: admin, manager, sales, engineer |
| region | string | Yes | User's assigned region |
| department | string | No | Department: sales, marketing, technical, management, engineering |
| phone | string | No | Contact phone number |
| territory | string | No | Specific territory assignment |

### Response

**Success (201 Created)**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "newuser123",
    "employeeId": "SALES005",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@accordmedical.co.ke",
    "role": "sales",
    "department": "sales",
    "phone": "+254723456789",
    "region": "Mombasa",
    "territory": "Coast",
    "isActive": true,
    "targets": {
      "monthly": {
        "visits": 0,
        "orders": 0,
        "revenue": 0
      },
      "quarterly": {
        "visits": 0,
        "orders": 0,
        "revenue": 0
      }
    },
    "createdAt": "2026-01-03T10:45:00.000Z",
    "updatedAt": "2026-01-03T10:45:00.000Z"
  }
}
```

**Error Responses**

**400 Bad Request - Missing Fields**
```json
{
  "success": false,
  "message": "Missing required fields: employeeId, firstName, lastName, email, password, role, region"
}
```

**400 Bad Request - Invalid Role**
```json
{
  "success": false,
  "message": "Invalid role. Allowed roles: admin, manager, sales, engineer"
}
```

**400 Bad Request - Duplicate User**
```json
{
  "success": false,
  "message": "User with this email or employee ID already exists"
}
```

**400 Bad Request - Short Password**
```json
{
  "success": false,
  "message": "Password must be at least 6 characters"
}
```

### Example Request

```bash
curl -X POST "https://app.codewithseth.co.ke/api/admin/users" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "SALES005",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@accordmedical.co.ke",
    "password": "SecurePass123",
    "role": "sales",
    "department": "sales",
    "phone": "+254723456789",
    "region": "Mombasa",
    "territory": "Coast"
  }'
```

### Welcome Email

Upon successful user creation, a welcome email is automatically sent to the user's email address containing:
- Login credentials (email, not password)
- Employee ID
- Link to login page

---

## Delete User

Delete a user from the system (admin only).

### Endpoint

```http
DELETE /api/users/:id
```

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | User MongoDB ObjectId |

### Response

**Success (200 OK)**

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Responses**

**404 Not Found**
```json
{
  "success": false,
  "message": "User not found"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

### Example Request

```bash
curl -X DELETE "https://app.codewithseth.co.ke/api/users/67890abc123def456" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### ⚠️ Warning

- This action is **permanent** and cannot be undone
- All user data including visits, reports, and quotations will remain in the system but will be orphaned
- Consider deactivating users instead of deleting them (`isActive: false`)

---

## User Roles

### Role Definitions

#### Admin
```json
{
  "role": "admin",
  "permissions": [
    "full_system_access",
    "user_management",
    "delete_users",
    "system_configuration",
    "view_all_data",
    "approve_reports",
    "respond_to_quotations"
  ]
}
```

**Capabilities:**
- Create/delete users
- Access all admin endpoints
- System-wide data access
- Configuration changes

#### Manager
```json
{
  "role": "manager",
  "permissions": [
    "view_all_data",
    "approve_reports",
    "respond_to_quotations",
    "assign_engineers",
    "create_users",
    "analytics_access"
  ]
}
```

**Capabilities:**
- All admin functions except user deletion
- Approve/reject reports
- Assign engineering services
- View analytics

#### Sales
```json
{
  "role": "sales",
  "permissions": [
    "create_visits",
    "submit_reports",
    "create_quotation_requests",
    "manage_own_leads",
    "view_own_data"
  ]
}
```

**Capabilities:**
- Record field visits
- Submit weekly reports
- Request quotations
- Manage personal leads

#### Engineer
```json
{
  "role": "engineer",
  "permissions": [
    "view_assigned_services",
    "update_service_status",
    "view_machines",
    "create_service_pricing"
  ]
}
```

**Capabilities:**
- View assigned service tasks
- Update service status
- Access machine details
- Submit service reports

### Department Options

```javascript
[
  'sales',
  'marketing',
  'technical',
  'management',
  'engineering'
]
```

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

// List all users
async function listUsers() {
  const response = await api.get('/admin/users', {
    params: {
      page: 1,
      limit: 20,
      role: 'sales'
    }
  });
  return response.data;
}

// Create new user
async function createUser(userData) {
  const response = await api.post('/admin/users', {
    employeeId: 'SALES006',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.j@accordmedical.co.ke',
    password: 'SecurePass456',
    role: 'sales',
    region: 'Kisumu',
    phone: '+254734567890',
    department: 'sales',
    territory: 'Western'
  });
  return response.data;
}

// Delete user
async function deleteUser(userId) {
  const response = await api.delete(`/users/${userId}`);
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

# List users
def list_users(role=None):
    params = {"page": 1, "limit": 20}
    if role:
        params["role"] = role
    
    response = requests.get(
        f"{BASE_URL}/admin/users",
        headers=headers,
        params=params
    )
    return response.json()

# Create user
def create_user(user_data):
    response = requests.post(
        f"{BASE_URL}/admin/users",
        headers=headers,
        json=user_data
    )
    return response.json()

# Delete user
def delete_user(user_id):
    response = requests.delete(
        f"{BASE_URL}/users/{user_id}",
        headers=headers
    )
    return response.json()
```

---

## Best Practices

### Creating Users

1. **Use Strong Passwords**: Minimum 8 characters, include numbers and special characters
2. **Unique Employee IDs**: Follow a consistent naming scheme (e.g., SALES001, ENG001)
3. **Valid Email Addresses**: Use company domain emails
4. **Assign Appropriate Roles**: Choose the most restrictive role that meets user needs
5. **Set Regions/Territories**: Properly assign geographical areas for sales tracking

### Managing Users

1. **Deactivate Instead of Delete**: Set `isActive: false` to preserve data integrity
2. **Regular Audits**: Review user list periodically
3. **Monitor Last Login**: Identify inactive accounts
4. **Role Reviews**: Ensure users have appropriate access levels
5. **Update Contact Info**: Keep phone and email current

### Security

1. **Don't share admin credentials**
2. **Rotate passwords regularly**
3. **Log all user management actions**
4. **Review new user creations**
5. **Monitor for suspicious activity**

---

## Related Endpoints

- **Update User**: `PUT /api/users/:id` (See [Overview](./ADMIN_API_01_OVERVIEW.md))
- **Get User Profile**: `GET /api/users/:id`
- **Set User Targets**: `POST /api/sales/target`
- **View User Analytics**: `GET /api/admin/analytics/sales/:userId`

---

**[← Back to Index](./ADMIN_API_DOCUMENTATION_INDEX.md)** | **[Next: Reports Management →](./ADMIN_API_03_REPORTS.md)**
