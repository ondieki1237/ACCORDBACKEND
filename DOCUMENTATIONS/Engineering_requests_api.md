# Engineering Requests API

This document describes the client-facing and admin APIs for submitting and managing engineering requests (service, repair, site survey, training).

## Summary
- Public endpoint: submit requests without authentication (for clients visiting site)
- Admin endpoints: list, view, assign, update status, delete (authentication required)

## Client-side (Public)
### Endpoint
- `POST /api/engineering-requests`

### Request Body (application/json)
```json
{
  "requestType": "service|repair|site_survey|training",
  "facility": { "name": "Facility Name", "location": "City, Address" },
  "contact": { "name": "Contact Name", "role": "Procurement Officer", "phone": "+2547...", "email": "optional@org.com" },
  "machine": { "name": "X-Ray Model 2000", "model": "2000-A", "serialNumber": "SN12345" },
  "expectedDate": "2026-02-15",    
  "notes": "Any extra info"
}
```

### Response
- `201 Created` on success
```json
{ "success": true, "message": "Request submitted", "data": { "id": "603c...", "status": "pending" } }
```

### Errors
- `400` - missing required fields
- `500` - server error

## Admin-side (Requires `Authorization: Bearer <token>` and role `admin|manager`)

### List requests
- `GET /api/admin/engineering-requests?status=&requestType=&search=&page=&limit=`

### Get single
- `GET /api/admin/engineering-requests/:id`

### Assign engineer
- `PUT /api/admin/engineering-requests/:id/assign`
- Body: `{ "engineerId": "<userId>" }`

### Update status
- `PUT /api/admin/engineering-requests/:id/status`
- Body: `{ "status": "assigned|in_progress|completed|cancelled|pending" }`

### Delete
- `DELETE /api/admin/engineering-requests/:id`

### Notes for Admin UI
- Show createdAt, contact info, facility details, machine info, current status, assigned engineer
- Allow quick assignment to engineers (list users with role `engineer` via `/api/admin/users`)
- Trigger notifications/email when a request is assigned (optional enhancement)

## Implementation files
- Model: `project/src/models/EngineeringRequest.js`
- Public route: `project/src/routes/engineeringRequests.js`
- Admin routes: `project/src/routes/admin/engineeringRequests.js`
- Controller: `project/src/controllers/engineeringRequestController.js`

## Security & Validation
- Public creation deliberately accepts minimal data and returns only an id & status.
- Admin endpoints require authentication and role-based authorization.

---

If you want, I can add:
- Email notifications on assignment
- Frontend form component example
- Postman collection entries
