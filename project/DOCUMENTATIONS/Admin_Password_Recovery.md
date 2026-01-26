# Admin Password Recovery

Purpose: Admins can trigger password recovery for any user. Two modes:

- `link` (default): sends a password-reset link to the user's email (10 minute expiry).
- `temp`: generates a temporary password, updates the user (hashed), clears refresh tokens, and emails the temporary password.

## Endpoint

POST /api/admin/users/:id/recover-password

## Auth

Requires an authenticated admin. Include header:

Authorization: Bearer <ADMIN_ACCESS_TOKEN>

## Request body (JSON)

Optional: `method` — `"link"` or `"temp"`. Omit or use `"link"` for reset link. Use `"temp"` to send a temporary password.

## Example

```bash
curl -X POST "https://api.example.com/api/admin/users/USER_ID/recover-password" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "method": "temp" }'
```

## Responses

- 200 OK { success: true, message: "Password reset link sent to user" }
- 200 OK { success: true, message: "Temporary password emailed to user" }

## Errors

- 400 Bad Request — invalid method
- 401 / 403 — missing or invalid admin auth
- 404 Not Found — user not found
- 500 Internal Server Error — email/send failure or other server error

## Notes for backend implementers

- If `method` is `link`: generate a time-limited secure token, save it (or store hashed), and email a reset link to the user's primary email. Token expiry: 10 minutes.
- If `method` is `temp`: generate a strong random temporary password, hash it and set as the user's password, clear any refresh tokens, persist changes, and email the temporary password to the user. Consider forcing password change on first login.
- Log actions for audit (admin who triggered, timestamp, method, target user id).
- Return clear error messages in JSON for non-2xx responses to help frontend surface to the admin UI.
