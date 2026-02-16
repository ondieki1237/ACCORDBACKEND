# Password Reset API Documentation

**Version:** 1.0  
**Last Updated:** February 16, 2026  
**Base URL:** `https://app.codewithseth.co.ke/api`

---

## Overview

This document specifies the API endpoints required for the password reset feature in the ACCORDFRONTEND application. The password reset flow consists of three steps:

1. **Request Reset:** User enters email, system sends 6-digit verification code
2. **Verify Code:** User enters code to verify ownership of email
3. **Reset Password:** User creates new password (4-8 characters)

---

## Endpoints

### 1. Request Password Reset

**Endpoint:** `POST /auth/password-reset/request`

**Description:** Initiates the password reset process by sending a 6-digit verification code to the user's email address.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address (must exist in database) |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Verification code sent to your email",
  "data": {
    "email": "user@example.com",
    "codeExpiresAt": "2026-02-16T09:40:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request** - Invalid email format
```json
{
  "success": false,
  "message": "Invalid email format",
  "error": "INVALID_EMAIL"
}
```

**404 Not Found** - Email not found in database
```json
{
  "success": false,
  "message": "No account found with this email address",
  "error": "EMAIL_NOT_FOUND"
}
```

**429 Too Many Requests** - Rate limiting (max 3 requests per 15 minutes per email)
```json
{
  "success": false,
  "message": "Too many reset requests. Please try again later.",
  "error": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

**Implementation Notes:**
- Generate a random 6-digit numeric code (000000-999999)
- Store code in database with expiration time (recommended: 10 minutes)
- Hash the code before storing (use bcrypt or similar)
- Send code via email to the user
- Implement rate limiting to prevent abuse
- Log all password reset requests for security auditing

---

### 2. Verify Reset Code

**Endpoint:** `POST /auth/password-reset/verify`

**Description:** Verifies that the user has entered the correct verification code sent to their email.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `code` | string | Yes | 6-digit verification code |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Code verified successfully",
  "data": {
    "email": "user@example.com",
    "verified": true
  }
}
```

**Error Responses:**

**400 Bad Request** - Invalid code format
```json
{
  "success": false,
  "message": "Code must be 6 digits",
  "error": "INVALID_CODE_FORMAT"
}
```

**401 Unauthorized** - Incorrect code
```json
{
  "success": false,
  "message": "Invalid verification code",
  "error": "INVALID_CODE"
}
```

**410 Gone** - Code expired
```json
{
  "success": false,
  "message": "Verification code has expired. Please request a new one.",
  "error": "CODE_EXPIRED"
}
```

**404 Not Found** - No pending reset request
```json
{
  "success": false,
  "message": "No password reset request found for this email",
  "error": "NO_RESET_REQUEST"
}
```

**Implementation Notes:**
- Compare submitted code with hashed code in database
- Check if code has expired
- Implement attempt limiting (max 5 attempts before code invalidation)
- Mark code as verified but don't delete it yet (needed for final reset step)
- Log verification attempts for security

---

### 3. Reset Password

**Endpoint:** `POST /auth/password-reset/reset`

**Description:** Resets the user's password after successful code verification.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "pass123"
}
```

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `code` | string | Yes | 6-digit verification code (must be verified) |
| `newPassword` | string | Yes | New password (4-8 characters) |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "email": "user@example.com",
    "passwordUpdated": true
  }
}
```

**Error Responses:**

**400 Bad Request** - Invalid password format
```json
{
  "success": false,
  "message": "Password must be between 4 and 8 characters",
  "error": "INVALID_PASSWORD_LENGTH"
}
```

**401 Unauthorized** - Code not verified or invalid
```json
{
  "success": false,
  "message": "Invalid or unverified code",
  "error": "INVALID_CODE"
}
```

**410 Gone** - Code expired
```json
{
  "success": false,
  "message": "Verification code has expired. Please start over.",
  "error": "CODE_EXPIRED"
}
```

**404 Not Found** - No pending reset request
```json
{
  "success": false,
  "message": "No password reset request found for this email",
  "error": "NO_RESET_REQUEST"
}
```

**Implementation Notes:**
- Verify that the code was previously verified in step 2
- Validate password length (4-8 characters as specified)
- Hash the new password using bcrypt (cost factor: 10-12)
- Update user's password in database
- Invalidate/delete the verification code after successful reset
- Optionally: Invalidate all existing user sessions/tokens
- Send confirmation email to user
- Log password reset completion for security

---

## Database Schema Recommendations

### Password Reset Tokens Table

```sql
CREATE TABLE password_reset_tokens (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email (email),
  INDEX idx_expires_at (expires_at)
);
```

**Fields:**
- `id`: Unique identifier for the reset token
- `user_id`: Reference to the user requesting reset
- `email`: User's email (for quick lookup)
- `code_hash`: Hashed verification code
- `verified`: Whether code has been verified (step 2)
- `attempts`: Number of verification attempts
- `created_at`: When the reset was requested
- `expires_at`: When the code expires (created_at + 10 minutes)
- `used_at`: When the password was actually reset (NULL until step 3)

---

## Security Considerations

### 1. Rate Limiting
- **Request Reset:** Max 3 requests per email per 15 minutes
- **Verify Code:** Max 5 attempts per code before invalidation
- **Reset Password:** Max 3 attempts per 15 minutes

### 2. Code Expiration
- Verification codes should expire after 10 minutes
- Expired codes cannot be used for verification or password reset

### 3. Code Generation
- Use cryptographically secure random number generator
- Generate 6-digit codes (000000-999999)
- Hash codes before storing in database

### 4. Password Hashing
- Use bcrypt with cost factor 10-12
- Never store passwords in plain text
- Never log passwords

### 5. Email Security
- Use authenticated SMTP server
- Include warning about phishing in email template
- Don't include clickable links (code-only approach is safer)

### 6. Audit Logging
- Log all password reset requests
- Log all verification attempts (success and failure)
- Log all password changes
- Include IP address and user agent in logs

### 7. Session Management
- Optionally invalidate all existing sessions when password is reset
- Force re-login after password change

---

## Email Template

### Subject: ACCORD Password Reset Code

```
Hello,

You requested to reset your password for your ACCORD account.

Your verification code is: **123456**

This code will expire in 10 minutes.

If you didn't request this password reset, please ignore this email and your password will remain unchanged.

For security reasons, never share this code with anyone.

Best regards,
ACCORD Team
```

---

## Testing Checklist

### Functional Testing
- [ ] Request reset with valid email
- [ ] Request reset with invalid email
- [ ] Request reset with non-existent email
- [ ] Verify code with correct code
- [ ] Verify code with incorrect code
- [ ] Verify code after expiration
- [ ] Reset password with valid code
- [ ] Reset password with invalid code
- [ ] Reset password with expired code
- [ ] Password validation (< 4 characters)
- [ ] Password validation (> 8 characters)
- [ ] Password validation (4-8 characters)

### Security Testing
- [ ] Rate limiting on request reset
- [ ] Rate limiting on verify code
- [ ] Code expiration enforcement
- [ ] Maximum verification attempts
- [ ] Code cannot be reused after successful reset
- [ ] SQL injection prevention
- [ ] XSS prevention in error messages

### Email Testing
- [ ] Email delivery
- [ ] Email formatting
- [ ] Code display in email
- [ ] Email delivery time (< 1 minute)

---

## Implementation Priority

1. **High Priority:**
   - Basic endpoint implementation
   - Code generation and storage
   - Email sending
   - Password update logic

2. **Medium Priority:**
   - Rate limiting
   - Attempt limiting
   - Audit logging

3. **Low Priority (Can be added later):**
   - Session invalidation
   - Advanced email templates
   - SMS backup option

---

## Frontend Integration

The frontend has already been implemented with the following API calls:

```typescript
// lib/api.ts
async requestPasswordReset(email: string): Promise<any> {
  return this.makeRequest("/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

async verifyResetCode(email: string, code: string): Promise<any> {
  return this.makeRequest("/auth/password-reset/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  })
}

async resetPassword(email: string, code: string, newPassword: string): Promise<any> {
  return this.makeRequest("/auth/password-reset/reset", {
    method: "POST",
    body: JSON.stringify({ email, code, newPassword }),
  })
}
```

---

## Notes

> [!WARNING]
> The password length requirement (4-8 characters) is less secure than industry standards. Consider implementing additional validation (uppercase, lowercase, numbers, special characters) in production.

> [!IMPORTANT]
> Ensure all endpoints are protected against common vulnerabilities (SQL injection, XSS, CSRF, etc.)

> [!NOTE]
> Consider implementing additional security measures such as CAPTCHA for the request reset endpoint to prevent automated abuse.

---

**End of Documentation**
