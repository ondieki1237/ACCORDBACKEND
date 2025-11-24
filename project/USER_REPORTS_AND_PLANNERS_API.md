# User Reports & Planners API Documentation

This document describes the API endpoints for users to fetch their own submitted weekly reports and planners.

---

## Weekly Reports (User)

### 1. Get My Weekly Reports
**GET** `/api/reports/my`

- **Description:** Returns all weekly reports submitted by the authenticated user.
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "weekStart": "2025-11-17",
      "weekEnd": "2025-11-23",
      "weekRange": "17/11/2025 - 23/11/2025",
      "sections": [ ... ],
      "content": { ... },
      "isDraft": false,
      "status": "pending",
      "createdAt": "2025-11-23T17:30:00.000Z",
      ...
    }
  ]
}
```
- **Auth:** Requires user authentication (JWT Bearer token).

---

## Weekly Planners (User)

### 2. Get My Weekly Planners
**GET** `/api/planner`

- **Description:** Returns all planners created by the authenticated user.
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "userId": "...",
      "weekCreatedAt": "2025-11-17",
      "days": [
        { "day": "Monday", "tasks": [ ... ] },
        ...
      ],
      ...
    }
  ],
  "meta": { "page": 1, "limit": 20, "totalDocs": 10 }
}
```
- **Auth:** Requires user authentication (JWT Bearer token).

---

## Example Usage

### Fetch my weekly reports
```js
fetch('/api/reports/my', { headers: { Authorization: 'Bearer ...' } })
  .then(res => res.json());
```

### Fetch my planners
```js
fetch('/api/planner', { headers: { Authorization: 'Bearer ...' } })
  .then(res => res.json());
```

---

For more details, see:
- `src/routes/reports.js`
- `src/routes/planner.js`
- `src/controllers/plannerController.js`
