# Admin Reports API Documentation

This document describes the admin-facing API endpoints that return full report details (visits, quotations, planners, follow-ups) and statistics useful for review, PDF generation, and export.

Base path: `/api/admin/reports`

## Endpoints

### 1. List Reports (paginated)
**GET** `/api/admin/reports`

- **Query Parameters:**
  - `page` (number, default 1)
  - `limit` (number, default 20)
  - `status` (string)
  - `userId` (string)
  - `startDate` / `endDate` (ISO date strings for weekStart filter)
- **Auth:** Admin or Manager (JWT)
- **Response:** Paginated `Report.paginate` output (docs contain basic report metadata and populated user info)

### 2. Get Single Report with Full Details
**GET** `/api/admin/reports/:id`

- **Description:** Returns the report and aggregated details for the week:
  - `report` object (populated `userId` and `reviewedBy`)
  - `visits` array (all Visit docs for the user within weekStart..weekEnd)
  - `quotations` array (Request docs within the week)
  - `planners` array (Planner docs created in the same week)
  - `followUps` array (FollowUp docs created in the same week)
  - `statistics` object (visit and quotation summaries)
  - `meta` (totals, weekRange, sales rep info)
- **Auth:** Admin or Manager (JWT)
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "report": { /* Report document */ },
    "visits": [ /* Visit documents */ ],
    "quotations": [ /* Request documents */ ],
    "planners": [ /* Planner documents */ ],
    "followUps": [ /* FollowUp documents */ ],
    "statistics": { /* visit & quotation stats */ },
    "meta": { /* totals and sales rep info */ }
  }
}
```

### 3. Update Report (status/admin notes)
**PUT** `/api/admin/reports/:id`

- **Body:** `{ status?: string, adminNotes?: string }`
- **Allowed status values:** `pending`, `reviewed`, `approved`, `rejected`
- **Auth:** Admin or Manager
- **Response:** Updated report document

### 4. Bulk Fetch Reports (for PDF generation/export)
**POST** `/api/admin/reports/bulk`

- **Body:** `{ reportIds: ["id1","id2",...] }` (max 50)
- **Auth:** Admin or Manager
- **Response:** Array of objects for each report: `{ report, visits, quotations, planners, followUps, meta }`

### 5. Reports Summary Stats
**GET** `/api/admin/reports/stats/summary`

- **Query params:** `startDate`, `endDate`, `userId`
- **Auth:** Admin or Manager
- **Response:** Aggregated counts (totalReports, pending/reviewed/approved/rejected/draft)

## Frontend Integration Notes (Admin UI)

- Use the paginated list (`GET /api/admin/reports`) to populate the reports table. Each row should display: sales rep name, weekRange, status, submittedAt, totalVisits, totalQuotations.
- When opening a report detail view, call `GET /api/admin/reports/:id` and display sections:
  - Report metadata and sections (report.sections or report.content)
  - Visits table (date, facility, purpose, outcome, potential value)
  - Quotations table (createdAt, items, status, urgency, value)
  - Planners (week schedule)
  - Follow-ups (actions and assigned users)
  - Statistics panel with summary numbers (totals, outcomes breakdown)
- For bulk export to PDF: POST selected report IDs to `/bulk`, then generate combined PDF on frontend or pass to a server-side PDF generator.

## Example Admin React Flow
1. Fetch page 1 of reports:
```js
fetch('/api/admin/reports?page=1&limit=20', { headers: { Authorization: `Bearer ${token}` }})
  .then(r => r.json())
```
2. Open report details (id = 617...):
```js
fetch('/api/admin/reports/617...', { headers: { Authorization: `Bearer ${token}` }})
  .then(r => r.json()).then(res => setReport(res.data));
```
3. Update status to reviewed:
```js
fetch('/api/admin/reports/617...', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ status: 'reviewed', adminNotes: 'Looks good' })
});
```

## Security & Performance
- All admin endpoints require JWT auth and role checks (`admin` or `manager`).
- Bulk fetch is limited to 50 reports to prevent overload.
- For very large exports consider streaming results or background jobs (queue + worker) to generate PDFs and return a download link.

---

For more implementation details see `project/src/routes/admin/reports.js` and related controllers/models (`Report`, `Visit`, `Request`, `Planner`, `FollowUp`).
