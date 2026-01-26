# Admin Visits API

This document describes the Admin Visits API endpoints used by the Admin UI, including the per-user visits endpoint (`/admin/visits/user/{userId}`). Add this documentation to the backend project (e.g., in your `docs/` folder or as an OpenAPI YAML file) so developers can implement and test the endpoints.

---

## Overview

Base URL (example):

- Production: `https://your.backend.host/api`
- Local dev (as used in this project): `http://localhost:4500/api`

Authentication: All admin endpoints require a Bearer access token with admin privileges. Example header:

```
Authorization: Bearer <ACCESS_TOKEN>
```

Responses use JSON with a top-level `success` boolean where applicable and consistent `data`/`meta` structure for listing endpoints.

---

## Key Endpoints

### 1) GET /admin/visits/user/{userId}

- Purpose: Fetch visits for a single user (admin view) with optional filters and pagination. Used for generating per-user summaries.
- Method: GET
- Path parameters:
  - `userId` (string, required) — ID of the user whose visits are requested.
- Query parameters:
  - `page` (integer, optional, default 1)
  - `limit` (integer, optional, default 25)
  - `startDate` (string, optional, format `YYYY-MM-DD`) — filter visits >= startDate
  - `endDate` (string, optional, format `YYYY-MM-DD`) — filter visits <= endDate
  - `clientName` (string, optional) — partial-match client name
  - `contactName` (string, optional) — partial-match contact name
  - `outcome` (string, optional) — filter by visit outcome (e.g., `successful`, `follow-up`, `unsuccessful`)
  - `tag` (string, optional) — filter by tag
  - `sort` (string, optional) — example values: `date:asc`, `date:desc`

Success Response (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "607...",
      "userId": { "_id": "user123", "firstName": "Jane", "lastName": "Doe", "employeeId": "E123" },
      "client": { "name": "ACME Clinic", "location": "Nairobi" },
      "contacts": [{ "name": "Dr. A", "position": "MD", "phone": "+2547..." }],
      "visitOutcome": "successful",
      "date": "2026-01-03T09:30:00.000Z",
      "duration": 35,
      "totalPotentialValue": 15000,
      "notes": "Met with procurement",
      "tags": ["new", "priority"],
      "createdAt": "2026-01-03T10:00:00.000Z"
    }
  ],
  "meta": {
    "totalDocs": 123,
    "page": 1,
    "limit": 50,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

Error Responses:

- 400 Bad Request — invalid `userId` or invalid date format
- 401 Unauthorized — missing/invalid token
- 403 Forbidden — user lacks admin scope
- 404 Not Found — user not found (optional)
- 500 Internal Server Error — unexpected server error

Example curl:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4500/api/admin/visits/user/USER_ID?page=1&limit=10000&startDate=2026-01-01&endDate=2026-01-25"
```


---

### 2) GET /admin/visits

- Purpose: Admin-level visits listing supporting general filters (used by CSV export and global admin listing).
- Method: GET
- Query parameters (same as `getAdminVisits` in frontend `apiService`): `page`, `limit`, `startDate`, `endDate`, `clientName`, `contactName`, `outcome`, `tag`, `sort`, `userId`, `region`

Success: same structure as above, with `data` array and `meta`.


---

### 3) GET /admin/visits/summary

- Purpose: Return aggregated summary stats for admin (optional endpoint used in dashboards).
- Query params: `limit` optionally
- Response example:

```json
{
  "success": true,
  "data": {
    "totalVisits": 1234,
    "visitsByOutcome": { "successful": 700, "follow-up": 350, "unsuccessful": 184 }
  }
}
```

---

## Implementation Guidance (server-side)

Below are recommendations and example snippets for Node.js (+ Express/Mongo). Adjust for your stack.

1) Input validation
- Validate `userId` format (e.g., Mongo ObjectId or UUID)
- Validate `startDate`/`endDate` are ISO `YYYY-MM-DD` or parseable
- Enforce `limit` max (e.g., 10000) to avoid huge responses

2) Authorization
- Verify Bearer token and admin scope. On failure respond 401 or 403.

3) Query building (Mongo example)

Pseudocode (Mongo):

```js
const filter = { 'userId': ObjectId(userId) };
if (startDate || endDate) {
  filter.date = {};
  if (startDate) filter.date.$gte = new Date(startDate);
  if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
}
if (clientName) filter['client.name'] = { $regex: clientName, $options: 'i' };
if (contactName) filter['contacts.name'] = { $regex: contactName, $options: 'i' };
if (outcome) filter.visitOutcome = outcome;
if (tag) filter.tags = tag;

const cursor = db.collection('visits')
  .find(filter)
  .sort({ date: sortDirection })
  .skip((page - 1) * limit)
  .limit(limit);

const docs = await cursor.toArray();
const totalDocs = await db.collection('visits').countDocuments(filter);
```

4) SQL example (Postgres)

```sql
SELECT v.*, u.first_name, u.last_name
FROM visits v
JOIN users u ON u.id = v.user_id
WHERE v.user_id = $1
  AND v.date >= $2::date
  AND v.date <= $3::date
  AND (v.client_name ILIKE '%' || $4 || '%')
ORDER BY v.date DESC
LIMIT $5 OFFSET $6;
```

5) Aggregation for summary (server-side preferred)
- Use DB aggregation (group by outcome, count, sum durations, sum potential) to efficiently compute summary.

Example Mongo aggregation (sketch):
```js
const pipeline = [
  { $match: filter },
  { $group: {
      _id: '$visitOutcome',
      count: { $sum: 1 },
      totalDuration: { $sum: { $ifNull: ['$duration', 0] } },
      totalPotential: { $sum: { $ifNull: ['$totalPotentialValue', 0] } }
  }},
  // ...
];
```

6) Error handling
- Return consistent error shape: `{ success: false, message: 'Failed to fetch user visits' }` with appropriate `status` code.
- Log server error and include request context (userId, query) for debugging.

7) Performance
- Add DB indexes on `userId`, `date`, and `visitOutcome`.
- Enforce `limit` cap; consider streaming large exports (CSV generation) instead of returning huge JSON.


---

## Example Express route handler (Node.js + Mongo)

```js
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

router.get('/admin/visits/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!ObjectId.isValid(userId)) return res.status(400).json({ success: false, message: 'Invalid userId' });

    // auth middleware should have validated admin scope

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 25, 10000);
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const filter = { userId: new ObjectId(userId) };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (req.query.outcome) filter.visitOutcome = req.query.outcome;

    const col = req.app.locals.db.collection('visits');
    const cursor = col.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit);
    const docs = await cursor.toArray();
    const totalDocs = await col.countDocuments(filter);

    return res.json({ success: true, data: docs, meta: { totalDocs, page, limit, totalPages: Math.ceil(totalDocs/limit), hasNextPage: page*limit < totalDocs } });
  } catch (err) {
    console.error('GET /admin/visits/user/:userId', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch user visits' });
  }
});

module.exports = router;
```


---

## OpenAPI 3.0 (YAML) — minimal spec

Save as `openapi-admin-visits.yaml` in your backend project to integrate with Swagger/OpenAPI tools.

```yaml
openapi: 3.0.1
info:
  title: Admin Visits API
  version: 1.0.0
  description: Admin endpoints for visits and per-user visit retrieval
servers:
  - url: https://your.backend.host/api
paths:
  /admin/visits/user/{userId}:
    get:
      summary: Get visits for a single user (admin)
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 25
        - name: startDate
          in: query
          schema:
            type: string
            format: date
        - name: endDate
          in: query
          schema:
            type: string
            format: date
        - name: outcome
          in: query
          schema:
            type: string
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
        '400':
          description: Bad Request
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '500':
          description: Internal Server Error
      security:
        - bearerAuth: []
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

---

## Troubleshooting / Debugging Tips

- If you get 500 responses:
  - Check server logs for the exception stack trace and query used.
  - Verify `userId` parsing and DB connection.
  - Run the DB query directly (e.g., via mongo shell or pgcli) with the same filters to confirm data shape.
  - Ensure `limit` isn't so large it causes memory exhaustion; prefer stream-based CSV generation.

- If the endpoint exists but returns an empty list:
  - Confirm `userId` matches the stored `userId` type (ObjectId vs string).
  - Verify `startDate`/`endDate` timezone handling; use UTC-normalized comparisons.

---

If you want, I can also:
- Produce a fully typed OpenAPI JSON/YAML file including request/response schemas for `Visit` and `User` and add example payloads.
- Add server-side sample implementations for Postgres (Knex/pg) or Sequelize/TypeORM.

File created: [docs/ADMIN_VISITS_API.md](docs/ADMIN_VISITS_API.md)
