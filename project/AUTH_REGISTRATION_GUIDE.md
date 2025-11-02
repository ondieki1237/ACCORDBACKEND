# Authentication & Registration Guide

## Overview
The Accord Medical Backend now supports **two separate registration flows** with different role permissions:

1. **Public Registration** (`/api/auth/register`) - For Sales and Engineer roles only
2. **Admin Registration** (`/api/admin/users`) - For all roles including Admin and Manager

---

## 1. Public Registration (Sales & Engineer Only)

### Endpoint
```
POST /api/auth/register
```

### Access
- **Public** - No authentication required
- **Allowed Roles**: `sales`, `engineer`
- **Restricted Roles**: `admin`, `manager` (will return 403 error)

### Request Body
```json
{
  "employeeId": "EMP001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@accordmedical.co.ke",
  "password": "password123",
  "role": "sales",           // or "engineer"
  "region": "Nairobi",
  "territory": "CBD",         // Optional
  "department": ""            // Optional (can be empty)
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

### Response (Forbidden Role)
```json
{
  "success": false,
  "message": "Public registration only allows Sales and Engineer roles. Contact admin for other roles."
}
```

---

## 2. Admin Registration (All Roles)

### Endpoint
```
POST /api/admin/users
```

### Access
- **Admin Only** - Requires authentication with `admin` role
- **Allowed Roles**: `admin`, `manager`, `sales`, `engineer`
- **Header**: `Authorization: Bearer <admin-access-token>`

### Request Body
```json
{
  "employeeId": "EMP002",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@accordmedical.co.ke",
  "password": "securePass123",
  "role": "admin",           // Can be: admin, manager, sales, engineer
  "region": "Nairobi",
  "territory": "Westlands",  // Optional
  "department": "management", // Optional
  "phone": "+254712345678"   // Optional
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": { ... }
  }
}
```

### Response (Unauthorized)
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

---

## User Roles

| Role      | Description                     | Registration Method |
|-----------|---------------------------------|---------------------|
| `admin`   | Full system access              | Admin Dashboard     |
| `manager` | Team oversight & approvals      | Admin Dashboard     |
| `sales`   | Field sales representatives     | Public or Admin     |
| `engineer`| Technical/engineering staff     | Public or Admin     |

---

## Model Changes

### User Schema Updates
```javascript
role: {
  type: String,
  enum: ['admin', 'manager', 'sales', 'engineer'],  // Added 'engineer'
  default: 'sales'
}

department: {
  type: String,
  enum: ['sales', 'marketing', 'technical', 'management', 'engineering'],
  required: false  // Now optional
}
```

---

## Validation Rules

### Public Registration (`/api/auth/register`)
- ✅ Role must be `sales` or `engineer`
- ✅ Department is optional (can be empty string)
- ❌ Attempting to register as `admin` or `manager` returns 403 error

### Admin Registration (`/api/admin/users`)
- ✅ All roles allowed: `admin`, `manager`, `sales`, `engineer`
- ✅ Department is optional
- ✅ Requires admin authentication
- ✅ Sends welcome email to new user

---

## Example Test Scenarios

### Test 1: Public Registration as Sales
```bash
curl -X POST http://localhost:4500/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP101",
    "firstName": "Test",
    "lastName": "Sales",
    "email": "test.sales@accordmedical.co.ke",
    "password": "test123",
    "role": "sales",
    "region": "Nairobi"
  }'
```
**Expected**: ✅ Success with access tokens

### Test 2: Public Registration as Engineer
```bash
curl -X POST http://localhost:4500/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP102",
    "firstName": "Test",
    "lastName": "Engineer",
    "email": "test.engineer@accordmedical.co.ke",
    "password": "test123",
    "role": "engineer",
    "region": "Mombasa"
  }'
```
**Expected**: ✅ Success with access tokens

### Test 3: Public Registration as Admin (Should Fail)
```bash
curl -X POST http://localhost:4500/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP103",
    "firstName": "Test",
    "lastName": "Admin",
    "email": "test.admin@accordmedical.co.ke",
    "password": "test123",
    "role": "admin",
    "region": "Nairobi"
  }'
```
**Expected**: ❌ 403 Forbidden with message about contacting admin

### Test 4: Admin Creating Manager User
```bash
curl -X POST http://localhost:4500/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-access-token>" \
  -d '{
    "employeeId": "EMP104",
    "firstName": "Test",
    "lastName": "Manager",
    "email": "test.manager@accordmedical.co.ke",
    "password": "test123",
    "role": "manager",
    "region": "Kisumu",
    "department": "management"
  }'
```
**Expected**: ✅ Success (only if authenticated as admin)

---

## Migration Notes

### Existing Users
- All existing users remain unchanged
- Department field is now optional for new registrations
- Existing users with `department: 'sales'` continue to work normally

### Frontend Integration
1. **Public Registration Form**: Only show `sales` and `engineer` role options
2. **Admin Dashboard**: Show all roles (`admin`, `manager`, `sales`, `engineer`)
3. **Department Field**: Make optional or remove from public registration form

---

## Security Considerations

1. ✅ Public users cannot self-register as admin or manager
2. ✅ Admin endpoint requires authentication and authorization
3. ✅ Password minimum length: 6 characters
4. ✅ Email uniqueness enforced
5. ✅ Employee ID uniqueness enforced
6. ✅ Welcome emails sent to all new users

---

## Error Codes

| Code | Meaning                                    |
|------|--------------------------------------------|
| 201  | User created successfully                  |
| 400  | Validation error or duplicate user         |
| 401  | Unauthorized (missing/invalid token)       |
| 403  | Forbidden (trying to register invalid role)|
| 500  | Server error                               |

---

## Contact
For issues or questions about registration, contact the backend development team.

**Last Updated**: November 2, 2025
