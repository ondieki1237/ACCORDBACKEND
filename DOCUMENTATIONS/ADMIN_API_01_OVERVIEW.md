# Admin API - Overview & Authentication

**Version:** 1.0  
**Last Updated:** January 3, 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Authorization](#authorization)
4. [Common Patterns](#common-patterns)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Testing](#testing)

---

## Overview

The Accord Medical Admin API provides comprehensive administrative functionality for managing users, monitoring sales activities, processing quotations, tracking engineering services, and analyzing system performance.

### Base Information

- **Base URL**: `https://app.codewithseth.co.ke`
- **Protocol**: HTTPS only
- **Format**: JSON
- **Authentication**: JWT Bearer Token
- **API Version**: v1 (implicit in path)

### Key Features

✅ User management (all roles)  
✅ Sales reports review & approval  
✅ Quotation processing & response  
✅ Visit tracking & analytics  
✅ Lead pipeline management  
✅ Machine registry & maintenance  
✅ Engineering service assignment  
✅ Real-time analytics & dashboards  
✅ Order management & tracking  

---

## Authentication

### Login Flow

#### 1. Login Request

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "info@accordmedical.co.ke",
  "password": "12345678"
}
```

#### 2. Login Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "67890abc",
      "firstName": "Super",
      "lastName": "Admin",
      "email": "info@accordmedical.co.ke",
      "role": "admin",
      "employeeId": "ADMIN001"
    }
  }
}
```

#### 3. Using Access Token

Include the access token in all subsequent requests:

```http
GET /api/admin/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Management

| Token Type | Lifetime | Purpose | Storage |
|------------|----------|---------|---------|
| Access Token | 15 minutes | API authentication | Memory/localStorage |
| Refresh Token | 30 days | Generate new access token | Secure storage |

### Refreshing Tokens

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token_here"
  }
}
```

---

## Authorization

### Role Hierarchy

```
admin (Super Admin)
  ├── Full system access
  ├── User management (create, delete)
  ├── All data access
  └── System configuration

manager
  ├── All admin functions EXCEPT user deletion
  ├── Approve/reject reports
  ├── Assign services
  └── View all analytics

sales
  ├── Own visits/reports only
  ├── Create quotation requests
  ├── View own leads
  └── No admin access

engineer
  ├── Assigned services only
  ├── Update service status
  ├── View machine details
  └── No admin access
```

### Role-Based Access Control (RBAC)

#### Admin Only
```javascript
// These endpoints require ONLY admin role
authorize('admin')

Examples:
- DELETE /api/users/:id
- DELETE /api/admin/machines/:id
- POST /api/admin/users
```

#### Admin or Manager
```javascript
// These endpoints accept both roles
authorize('admin', 'manager')

Examples:
- GET /api/admin/reports
- PUT /api/admin/reports/:id
- POST /api/admin/machines/bulk
```

### Middleware Flow

```
Request → authenticate() → authorize(roles) → Controller → Response
```

1. **authenticate**: Verifies JWT token, extracts user
2. **authorize**: Checks user role against required roles
3. **Controller**: Executes business logic

---

## Common Patterns

### Pagination

Most list endpoints support pagination:

```http
GET /api/admin/reports?page=1&limit=20
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "docs": [...],
    "totalDocs": 150,
    "limit": 20,
    "page": 1,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null
  }
}
```

### Filtering

```http
GET /api/admin/quotations?status=pending&urgency=high
```

**Common Filters:**
- `status` - Filter by status field
- `startDate` / `endDate` - Date range filtering
- `userId` - Filter by user ID
- `search` - Text search across multiple fields

### Sorting

Most endpoints sort by `createdAt` descending (newest first):

```javascript
.sort({ createdAt: -1 })
```

Custom sorting available on some endpoints via query parameter.

### Population

Related data is automatically populated:

```json
{
  "userId": {
    "_id": "123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }
}
```

Fields populated:
- `userId` → User details
- `createdBy` → User details
- `reviewedBy` → User details
- `response.respondedBy` → User details

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/PUT request |
| 201 | Created | Successful POST request |
| 400 | Bad Request | Validation error, missing fields |
| 401 | Unauthorized | No token or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal server error |

### Common Error Scenarios

#### 1. Missing Authentication

```json
{
  "success": false,
  "message": "Access token is required"
}
```

#### 2. Invalid Token

```json
{
  "success": false,
  "message": "Invalid token"
}
```

#### 3. Insufficient Permissions

```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

#### 4. Validation Error

```json
{
  "success": false,
  "message": "Missing required fields: employeeId, firstName, lastName"
}
```

#### 5. Resource Not Found

```json
{
  "success": false,
  "message": "Report not found"
}
```

---

## Rate Limiting

### Current Limits

- **Global Rate Limit**: 100 requests per 15 minutes per IP
- **Applies to**: All `/api/*` endpoints
- **Headers Returned**:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1704300000
  ```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

**Status Code**: 429 Too Many Requests

### Best Practices

1. **Cache responses** when possible
2. **Batch operations** (use bulk endpoints)
3. **Monitor headers** to avoid hitting limits
4. **Implement exponential backoff** for retries

---

## Testing

### Test Admin Account

```
Email: info@accordmedical.co.ke
Password: 12345678
Role: admin
Employee ID: ADMIN001
```

### Testing Tools

#### Using cURL

```bash
# 1. Login
curl -X POST https://app.codewithseth.co.ke/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"info@accordmedical.co.ke","password":"12345678"}'

# 2. Use token
TOKEN="your_access_token_here"

curl -X GET https://app.codewithseth.co.ke/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

#### Using Postman

1. Create new request
2. Set Authorization → Bearer Token
3. Paste access token
4. Send request

#### Using JavaScript/Axios

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://app.codewithseth.co.ke/api',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Make requests
const users = await api.get('/admin/users');
```

### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2026-01-03T10:30:00.000Z",
  "uptime": 86400,
  "environment": "production"
}
```

---

## Security Best Practices

### For Developers

1. **Never commit tokens** to version control
2. **Use HTTPS only** in production
3. **Implement token refresh logic**
4. **Clear tokens on logout**
5. **Validate all inputs** on frontend
6. **Handle errors gracefully**

### For Admins

1. **Use strong passwords** (minimum 6 characters, recommend 12+)
2. **Don't share credentials**
3. **Logout when finished**
4. **Monitor user activity**
5. **Regular password rotation**

---

## Next Steps

Choose a functional area to explore:

- **[User Management](./ADMIN_API_02_USERS.md)** - Create and manage users
- **[Reports Management](./ADMIN_API_03_REPORTS.md)** - Review sales reports
- **[Quotations Management](./ADMIN_API_04_QUOTATIONS.md)** - Process quote requests
- **[Analytics](./ADMIN_API_10_ANALYTICS.md)** - View system analytics

---

**[← Back to Index](./ADMIN_API_DOCUMENTATION_INDEX.md)**
