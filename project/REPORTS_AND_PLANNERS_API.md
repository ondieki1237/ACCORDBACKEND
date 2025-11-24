# Reports and Planners API Documentation

This document describes the API endpoints for viewing submitted weekly reports and planners in the Accord Medical backend.

---

## Weekly Reports API

### 1. List All Submitted Reports (Admin/Manager)
**GET** `/api/admin/reports`

- Returns all submitted weekly reports, supports filtering and pagination.
- **Query Parameters:**
  - `page` (number, optional): Page number (default: 1)
  - `limit` (number, optional): Results per page (default: 20)
  - `status` (string, optional): Filter by report status (`pending`, `reviewed`, etc.)
  - `userId` (string, optional): Filter by user
  - `startDate`, `endDate` (ISO date, optional): Filter by week start range
- **Response:**
```json
{
  "success": true,
  "data": {
    "docs": [ /* array of report objects */ ],
    "totalDocs": 100,
    "limit": 20,
    "page": 1,
    "totalPages": 5
  }
}
```
- **Auth:** Requires admin/manager authentication.

### 2. Get Single Report (Details)
**GET** `/api/admin/reports/:id`

- Returns full details for a single report, including visits and quotations for the week.
- **Response:**
```json
{
  "success": true,
  "data": {
    "report": { /* report fields */ },
    "visits": [ /* visit records */ ],
    "quotations": [ /* quotation records */ ],
    "meta": { /* summary stats, week range, sales rep info */ }
  }
}
```
- **Auth:** Requires admin/manager authentication.

### 3. User's Own Reports
**GET** `/api/reports/my`

- Returns all reports submitted by the current user.
- **Response:**
```json
{
  "success": true,
  "data": [ /* array of report objects */ ]
}
```
- **Auth:** Requires user authentication.

---

## Planners API

### 1. List All Planners (Admin)
**GET** `/api/admin/planners`

- Returns all planners, supports pagination and optional filters.
- **Query Parameters:**
  - `page` (number, optional): Page number
  - `limit` (number, optional): Results per page
  - `userId` (string, optional): Filter by user
- **Response:**
```json
{
  "success": true,
  "data": [ /* array of planner objects */ ],
  "meta": { "page": 1, "limit": 20, "totalDocs": 100 }
}
```
- **Auth:** Requires admin authentication.

### 2. User's Own Planners
**GET** `/api/planner`

- Returns planners for the current user.
- **Response:**
```json
{
  "success": true,
  "data": [ /* array of planner objects */ ],
  "meta": { "page": 1, "limit": 20, "totalDocs": 10 }
}
```
- **Auth:** Requires user authentication.

---

## Example Usage

### Fetch all submitted reports (admin)
```js
fetch('/api/admin/reports?page=1&limit=20', { headers: { Authorization: 'Bearer ...' } })
  .then(res => res.json());
```

### Fetch planners (admin)
```js
fetch('/api/admin/planners?page=1&limit=20', { headers: { Authorization: 'Bearer ...' } })
  .then(res => res.json());
```

---

For more details, see:
- `src/routes/reports.js`
- `src/routes/admin/reports.js`
- `src/routes/planner.js`
- `src/routes/admin/planners.js`
