## Scheduled notification (important note)

Important: the scheduled notification logic (cron job + email sender) belongs in your backend repository, not in this frontend/admin repo. Do not add server-side notification code here. Instead, implement the scheduled job inside the backend where it can directly query the database and send mail reliably.
Recommended server-side contract / implementation notes (to be implemented in backend repo):
- Run a daily scheduled job (cron or scheduler) in the backend (e.g., `project/src/services/scheduledJobs.js`).
- Query the `Machine` collection for machines with `nextServiceDue` in the target range (e.g., date = today + N days). Use a date-range query to include timezone-safe comparisons and handle overdue entries.
- Build an HTML or CSV report containing: facility, model, serialNumber, manufacturer, installedDate, lastServicedAt, nextServiceDue, contact person (name/phone/email), and status.
- Send the report via the project's email delivery system (SMTP, SendGrid, SES, etc.) to `techsupport@accordmedical.co.ke` and other recipients as required.
Example Mongoose query (backend, pseudo):
```js
// Node / backend pseudo-code - implement in backend repo
const target = new Date();
const machines = await Machine.find({
  nextServiceDue: { $gte: start, $lte: end },
}).sort({ 'facility.name': 1, model: 1, serialNumber: 1 }).lean();
```
Why server-side?
- Direct DB queries are more efficient and scale better than fetching all machines through the HTTP API and filtering client-side.
- Backend scheduling runs independent of the admin UI and can use secure credentials and retries.
If you already placed an ad-hoc script in this repository, move it into the backend project or replace it with a backend implementation. Keep this frontend repo focused on the admin UI.
## Frontend: Machines page — "Due for service" button (requested UI change)
Add a clear UI affordance on the `Machines` admin page so admins can quickly view machines due for service and (optionally) trigger a backend report.
Location
- Frontend file (implementation hint): `components/dashboard/machines.tsx` (or the page component that renders the machines list). Do the work in the admin UI codebase only.
UX and behaviour
- Add a button in the Machines page header labeled: `Due for service` with a small dropdown or secondary controls for the timeframe options (e.g., `Next 5 days`, `Next 30 days`, `Overdue`).
- Default quick action: `Next 5 days`.
- Clicking the option toggles a filtered view of the machines list showing only machines whose `nextServiceDue` falls within the selected timeframe.
- Provide a small badge showing how many machines match the filter.
Design/controls
- Primary button: `Due for service ▾` (opens dropdown with options)
- Options: `Next 5 days`, `Next 7 days`, `Next 30 days`, `Overdue`
- Secondary action (optional): `Send report` (only visible when user is admin and backend exposes a POST endpoint to trigger sending the report). If backend does not expose such endpoint, the `Send report` button should be hidden or trigger an info tooltip: "This action requires a backend report endpoint."
Data contract (preferred)
- Preferred backend API: expose an endpoint that returns machines due in a date range so the UI can request only relevant rows. Example:
  - GET /api/machines/due?days=5
  - Response: { success: true, data: [ { _id, model, serialNumber, manufacturer, facility, contactPerson, installedDate, lastServicedAt, nextServiceDue, status }, ... ] }
- Alternative (if backend lacks the endpoint): request `GET /api/machines?limit=...` and filter client-side by `nextServiceDue` comparing date-only values. This is less efficient and not recommended at scale.
React Query & UI wiring
- Use React Query for caching and fetching. Suggested query key: `['machines', { filter: 'due', days }]`.
- Example pseudo-code (not applied to files here):
```ts
// pseudo-code for machines page
const [days, setDays] = useState(5);
const { data: due, isLoading } = useQuery(['machines', { filter: 'due', days }], () =>
  apiService.getMachinesDue({ days }) // prefer backend endpoint
);
// render a table/list showing `due` results
```
If no backend endpoint: fetch the regular machines list and client-filter `nextServiceDue` by date.
`Send report` action
- If you provide a backend endpoint to trigger the email (recommended):
  - POST /api/admin/machines/reports/due?days=5
  - Body: optional recipients/format
  - Response: { success: true, message: 'Report queued' }
- The UI should call this endpoint and show a success toast or error message based on response.
Edge cases and tests
- Timezones: compare only date components (server should treat `nextServiceDue` in facility/local timezone or normalize to UTC; UI should show dates in the user's timezone)
- Overdue: include machines where `nextServiceDue` < today (for the `Overdue` filter)
- Pagination: when using a backend endpoint, the server should paginate results and the UI should support pagination for large result sets.
Manual test checklist for the UI change
1. Log in as Admin and navigate to Dashboard → Machines.
2. Verify the `Due for service` button appears in header (visible to admins & managers as required).
3. Click `Due for service` → choose `Next 5 days`.
  - Expected: list filters to only machines due in 5 days and badge shows count.
4. Choose `Overdue`.
  - Expected: list shows machines with `nextServiceDue` in the past.
5. If backend exposes `POST /api/admin/machines/reports/due`, click `Send report`.
  - Expected: confirmation toast and backend report queued / email sent.
Developer notes
- Prefer calling a backend endpoint that performs date filtering and returns only matching machines. This minimizes data transfer and scales to large inventories.
- Keep the UI logic simple: treat the filter as a selector for a single query key so React Query caching is straightforward.
- Add unit tests for the filter logic (date selection -> query key -> data displayed) and an integration test to validate the `Send report` flow (mock backend).
If you want, I can provide a small PR patch (only frontend changes) that implements the `Due for service` button and client wiring in `components/dashboard/machines.tsx` (using the project's `apiService` and React Query). I will not add backend/server code here.

---

## Frontend change implemented (2025-11-20)

I implemented the requested frontend change in `components/dashboard/machines.tsx` to add a "Due for service" control and optional "Send report" action. Summary:

- UI: a select to choose timeframe (Next 5 days / 7 / 30 / Overdue) and a "Due for service" toggle button in the Machines header. When enabled the machines list switches to the due-only view and shows a badge with the count.
- Data: the UI prefers a backend filter and calls `GET /admin/machines?startDate=...&endDate=...` via `apiService.getMachines(...)` to fetch machines due on the selected day range. If that endpoint is not available, the UI falls back to client-side filtering of the existing machines list.
- Send report: admin-only `Send report` button calls a new API helper `apiService.triggerMachinesDueReport(days)` which POSTs to `/admin/machines/reports/due?days=...` (backend must implement this endpoint to actually send email reports).
- React Query: new query key `['machines','due', days]` is used so results are cached per timeframe.

Files changed/added in this repo (frontend only):

- `components/dashboard/machines.tsx` — added due-filter UI, React Query wiring, and Send report action (admin-only).
- `lib/api.ts` — added `triggerMachinesDueReport(days, recipients?)` helper so the frontend can request the backend to generate/send the report.

How to test the frontend change

1. Start the app and log in as an admin.
2. Open Dashboard → Machines. In the header choose timeframe (e.g., Next 5 days) and click the `Due for service` button.
  - Expected: the list filters to machines due in that timeframe and a badge shows the matched count.
3. As admin, click `Send report` to request the backend to email the report.
  - Expected: UI shows a success toast if the backend accepted the request. The backend must implement `/admin/machines/reports/due` to actually send email.

Note: This change is frontend-only. The backend must implement the POST `/admin/machines/reports/due` endpoint and a server-side scheduled job (recommended) to send emails to `techsupport@accordmedical.co.ke` as described earlier in this document.
# Machines (Installed Equipment) — Backend Implementation & API

This document summarizes the backend implementation added to support a Machines database for engineers and the admin panel. It describes the data model, REST APIs, how machines link to engineering services, validation, and recommended frontend behavior for the engineers app and the admin website.

## What was implemented

- Model: `project/src/models/Machine.js` — stores installed equipment and metadata (manufacturer, model, version, serial, facility, contact person, install/purchase dates, last/next service dates, last service engineer and notes).
- Routes (engineer-facing): `project/src/routes/machines.js` — endpoints for create, list, get, update and (admin-only) delete machines.
- Routes (admin): `project/src/routes/admin/machines.js` — admin/manager-only endpoints to manage machines with same CRUD operations.
- EngineeringService integration:
  - `project/src/models/EngineeringService.js` now has a `machineId` field (ref `Machine`).
  - Controller (`project/src/controllers/engineeringServiceController.js`) accepts `machineId` on create and populates `machineId` in service list and service-by-id endpoints.
- Server wiring: routes mounted in `project/src/server.js`:
  - `/api/machines` and `/api/admin/machines` are available.

## Machine Model (fields)

Key fields in `Machine` (Mongoose):

- serialNumber: string (indexed)
- model: string (required)
- manufacturer: string
- version: string
- facility: { name, level, location }
- contactPerson: { name, role, phone, email }
- installedDate: Date
- purchaseDate: Date
- warrantyExpiry: Date
- lastServicedAt: Date
- nextServiceDue: Date
- lastServiceEngineer: { engineerId (ref User), name, notes }
- status: enum [active|inactive|decommissioned|maintenance]
- metadata.createdBy / createdAt

Indexes: text index on facility name, model, manufacturer and serialNumber for quick search; pagination plugin added.

File: `project/src/models/Machine.js` (see code for full schema and indexes).

## REST API

Base (engineers): `/api/machines`

- POST /api/machines
  - Create a machine record (authenticated). Engineers or admins can create.
  - Body (JSON):
    ```json
    {
      "serialNumber": "SN-12345",
      "model": "XRay 5000",
      "manufacturer": "Acme Med",
      "version": "v2",
      "facility": { "name": "Nairobi General", "level": "level-5", "location": "Nairobi" },
      "contactPerson": { "name": "Dr. Jane", "phone": "+2547...", "email": "jane@ngh.co.ke" },
      "installedDate": "2025-06-10",
      "lastServicedAt": "2025-11-01",
      "nextServiceDue": "2026-05-01"
    }
    ```

- GET /api/machines
  - List machines (paginated). Query params: page, limit, facilityName, model, manufacturer, search

- GET /api/machines/:id
  - Get single machine (authenticated)

- GET /api/machines/:id/services
  - Get service history for a machine (paginated). Authentication required.
  - Available to admin/manager (view all), engineers (see services assigned to them) and sales (see services they created).
  - Query params: page, limit, startDate, endDate
  - Example: GET /api/machines/64f7a2c9e3b1c8d5f6e9a1b2/services?page=1&limit=20

- PUT /api/machines/:id
  - Update machine (authenticated). Admins/managers can update all; engineers can update fields via app as allowed.

- DELETE /api/machines/:id
  - Delete (admin only) — remove machine record

Admin base: `/api/admin/machines`

- All endpoints similar to above but restricted to `admin` / `manager` roles and may return additional metadata.

Responses follow the project pattern: { success: true/false, message?, data? }

## Engineering Services integration

- `EngineeringService` now supports linking to an installed machine via `machineId` (ObjectId -> `Machine`).
- When creating or assigning a service you can send `machineId` in the service payload. Example POST to create a service with a machine:

  POST /api/engineering-services
  ```json
  {
    "facility": { "name": "Nairobi General", "location": "Nairobi" },
    "serviceType": "installation",
    "machineId": "64f7a2c9e3b1c8d5f6e9a1b2",
    "scheduledDate": "2025-11-20",
    "notes": "Installation of XRay 5000 at radiology"
  }
  ```

- When a service includes `machineId`:
  - The service document stores the `machineId` reference.
  - Service GET/list endpoints populate `machineId` so UI can show model, serial and facility details inline.
  - When assigning a service (`PUT /api/engineering-services/:id/assign`) the UI should allow selecting a machine (if applicable) and pass `machineId`.

## Frontend behavior / Engineers app

- Machine registry UI (Engineers):
  - List/search machines (typeahead) using GET `/api/machines?search=...`.
  - Create machine form to capture fields above (serial, model, manufacturer, facility, contact, installedDate, nextServiceDue, etc.).
  - Machine detail view shows installed date, service history (from engineering services), lastServiceEngineer and notes.

- Service allocation workflow:
  - When creating or allocating a service/installation, provide a machine picker (typeahead or modal) that queries `/api/machines` and returns a selectable list.
  - Selected `machineId` should be included in the service create or assign payload.
  - After assignment, the service details view shows machine info populated via the `machineId` reference.

- Service -> Machine linkage uses `machineId` so engineers can quickly view equipment history and previous service notes when on-site.

## Admin website behavior

- Admins can manage machines via `/api/admin/machines` (CRUD). Recommended admin features:
  - Bulk import/export (CSV) of machines and installed inventory.
  - Facility-level machine reporting and upcoming maintenance reminders for `nextServiceDue`.
  - Machine timeline: show a list of engineering services (filter `EngineeringService` by `machineId`) so admins can see past service records and engineers' comments.

## Validation & business rules

- Required fields: `model` and `facility.name` are recommended for meaningful records. `serialNumber` is strongly recommended for tracking.
- Dates should be ISO strings; server validates via Mongoose schema.
- `machineId` provided to engineering service must be a valid ObjectId and an existing Machine; controller validates before saving.

## Indexes & performance

- Text index across `facility.name`, `model`, `manufacturer`, and `serialNumber` for fast search.
- Machine model includes pagination using `mongoose-paginate-v2`.

## Notifications and scheduled jobs (recommendation)

- Use `node-cron` scheduled jobs (existing in `project/src/services/scheduledJobs.js`) to:
  - Send reminders for machines with `nextServiceDue` approaching.
  - Generate weekly/monthly maintenance reports for admins.

## Migration & data notes

- Existing engineering service records without `machineId` remain unchanged. Optionally write a migration to:
  - Create `Machine` records for known installed equipment and populate `machineId` on service records.
- When decommissioning machines, set `status: 'decommissioned'` instead of deleting (audit trail).

## Example cURL requests

- Create machine
```bash
curl -X POST https://api.example.com/api/machines \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "model":"XRay 5000", "manufacturer":"Acme Med", "facility": { "name":"Nairobi General" }, "installedDate":"2025-06-10" }'
```

- Create service for a machine (engineer/admin creates service)
```bash
curl -X POST https://api.example.com/api/engineering-services \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "facility": { "name":"Nairobi General" }, "serviceType":"maintenance", "machineId":"<MACHINE_ID>", "scheduledDate":"2025-11-20" }'
```

## Next steps / recommendations

1. Frontend: implement a typeahead machine picker component for the engineers app and admin panel.
2. The machine service history endpoint is implemented: GET `/api/machines/:id/services` (returns paginated `EngineeringService` records filtered by `machineId`).
3. Add CSV import/export for admin bulk operations.
4. Add scheduled reminder emails/push notifications using existing `scheduledJobs` code.
5. Add tests (Jest + Supertest) for machine CRUD and service creation with `machineId` validation.

---

## Changes implemented (frontend + UX) — 2025-11-20

I implemented the requested UX and data-refresh improvements so that:

- When an engineering service is updated (for example, its status is set to `completed`), the machine's service history UI is refreshed automatically so the completed service appears in the machine history without a manual page reload.
- Admins can now edit machine details (including `nextServiceDue`, `lastServicedAt`, contact person and other metadata) from the admin Machines UI.

Summary of concrete code changes

- components/dashboard/engineer-reports.tsx
  - Added use of React Query's QueryClient to invalidate caches after service updates (bulk assign/update). After a PUT to `/api/engineering-services/:id` the component now:
    - Attempts to parse the updated service returned by the backend. If the updated object contains `machineId`, it explicitly invalidates the `["machine-services", machineId]` cache so any open machine history dialogs update.
    - Also invalidates general `["machine-services"]` and `["machines"]` caches as a fallback to ensure UI consistency.
  - This guarantees that when a service status transitions to `completed` (or any other state), the Machines UI will pick up the changes.

- components/dashboard/machines.tsx
  - Added an Admin "Edit Machine" flow:
    - New Edit button on the Machine Details dialog (visible to admins). Clicking it opens a prefilled Edit Machine dialog.
    - Admins can edit: model, manufacturer, serial number, version, facility (name/level/location), contact person (name/role/phone/email), status, installedDate, purchaseDate, warrantyExpiry, lastServicedAt and nextServiceDue.
    - Submits updates via existing `PUT /api/admin/machines/:id` (via `apiService.updateMachine`) and invalidates the `machines` cache on success.
  - The Machines list already contained `getMachineServices` and `createEngineeringService` calls; those continue to invalidate caches. The new Edit workflow reuses the existing `updateMachineMutation`.

Files modified

- components/dashboard/engineer-reports.tsx — add QueryClient invalidation after service updates
- components/dashboard/machines.tsx — add edit dialog + admin edit button + prefill logic

Behavioral notes / rationale

- Why invalidate queries?
  - The backend stores services with a `machineId` link. When a service is updated (status => completed), the service document is the source of truth. The frontend must refresh any cached queries that materialize those services under a machine. React Query invalidation is a light-weight, reliable approach to force fresh reads without changing the backend.

- Which caches we invalidate
  - We invalidate the per-machine cache key `["machine-services", machineId]` when we know the machine id returned from the backend update response. As a fallback we also invalidate `["machine-services"]` and `["machines"]` to cover cases where the updated response doesn't include `machineId` or the shape is different.

How to test (manual)

1. Start the app (dev build) and log in as an admin and/or engineer.
2. Open the Machines page (Dashboard → Machines). Open a machine and click "View Service History" to see current services.
3. In the Engineer Duties & Services page, find a service linked to the machine and update its status to `completed` (either via an Edit action or bulk assign flow that sets status to `completed`).
4. When the update completes, the machine history dialog (if open) should auto-refresh and show the updated/completed service entry without a full page reload. If you close and re-open the machine history it should also show the completed service.
5. As admin, open a machine's details and click "Edit Machine". Change `Next Service Due` and click "Save Changes" — confirm the update by re-opening details and by checking the machines list (it will be refetched).

Developer notes & edge cases

- The engineer-reports component uses direct fetch() calls (not all places use react-query). To maintain correctness we invalidate react-query caches from those direct-update flows. This is a pragmatic approach while keeping the existing fetch-based code.
- If your backend's PUT /api/engineering-services/:id does not return the updated service object (or doesn't include `machineId` in the response), the code falls back to invalidating broader caches; however, for best performance and precision it's recommended that the backend returns the updated service object including `machineId` when updating.
- If you want real-time updates (no polling/invalidation) consider adding a websocket/real-time channel (Socket.IO or Pusher) to broadcast service updated events and have machines & services subscribe to those events.

Follow-ups I can do next (pick one):

1. Convert service update flows to use React Query mutations everywhere so cache management is centralized and automatic.
2. Add a small audit/logging entry when admins change machine fields (who/when/what changed) and surface that audit in the machine detail (recommended for compliance). This requires backend support to persist a change log for each machine.
3. Add unit/integration tests for the new edit UI and the cache invalidation flows (react-query test utilities + msw to mock API responses).

If you'd like, I can also push the small tests and add an `AUDIT.md` entry or wire the UI to show the last change author + timestamp in the machine detail.

---

File locations (quick reference):

- Model: `project/src/models/Machine.js`
- Routes: `project/src/routes/machines.js`, `project/src/routes/admin/machines.js`
- Engineering service model: `project/src/models/EngineeringService.js` (now includes `machineId`)
- Engineering controller updated: `project/src/controllers/engineeringServiceController.js`

If you want, I can now:
- Add the `/api/machines/:id/services` endpoint and a controller method to fetch service history for a machine.
- Add import CSV endpoint for admins.

---

## Scheduled notification script — added (2025-11-20)

I added a small notification script to support automated reminders for machines whose `nextServiceDue` date is approaching. This is a lightweight Node script that can be run via cron (or a task runner) and will send an email to `techsupport@accordmedical.co.ke` with a detailed list of machines due in N days (default 5).

Files added/changed

- `scripts/notifyUpcomingServices.js` — Node script that:
  - Fetches machines from `GET /api/machines` (requests a large page and filters client-side for machines with `nextServiceDue` exactly N days ahead).
  - Sorts results by facility, model and serialNumber and builds an HTML table with details: facility, model, serial, manufacturer, installedDate, lastServicedAt, nextServiceDue, contact person and status.
  - Sends an email using SMTP via `nodemailer` to `EMAIL_TO` (defaults to `techsupport@accordmedical.co.ke`).

- `.env.example` — example env variables for configuration (copy to `.env` and fill real credentials).

- `package.json` — small addition: a script entry `notify-services` is added to run the notifier locally (see below) and `nodemailer` is added to dependencies.

Configuration

1. Create a `.env` at the repo root (do not commit credentials). Copy and edit the provided `.env.example`. Important variables:

  - API_BASE_URL - base URL for your API (default: https://app.codewithseth.co.ke/api)
  - API_TOKEN - optional bearer token if your `/api/machines` endpoint requires auth
  - SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS - SMTP server credentials used to send email
  - EMAIL_FROM - from address for the email (default: no-reply@accordmedical.co.ke)
  - EMAIL_TO - recipient address (default: techsupport@accordmedical.co.ke)
  - DAYS_AHEAD - number of days ahead to check (default: 5)

Usage (manual)

1. Install dependencies (make sure `nodemailer` is installed):

  npm install

2. Test locally:

  node scripts/notifyUpcomingServices.js

  The script supports loading `.env` automatically (it uses `dotenv` if available). If your Node runtime is <18 and doesn't expose global `fetch`, either upgrade Node or add a fetch polyfill (e.g., `node-fetch`) and set it as a global.

3. Cron example (runs daily at 08:00):

  0 8 * * * cd /path/to/ADMINACCORD && /usr/bin/node scripts/notifyUpcomingServices.js >> /var/log/accord/notify.log 2>&1

Behavior notes and caveats

- The script filters client-side for `nextServiceDue` exactly N days in the future. It requests a large page size to reduce API calls; if you have many machines you may prefer a backend endpoint that accepts start/end date filters (recommended).
- For best precision and scale, I recommend adding a backend scheduled job (server-side) that queries the DB directly and sends emails. The provided script is a stop-gap that runs independently and requires valid SMTP credentials.
- Security: do NOT commit real credentials to version control. Use a secrets manager or environment variables on your server/CI.

Follow-ups (I can implement)

1. Add a server-side scheduled job in the backend (e.g., `project/src/services/scheduledJobs.js`) that queries the DB for `nextServiceDue` in a range and sends emails; this is preferred for reliability and avoids fetching all machines from the public API.
2. Add an option to include past due machines (overdue) and/or a summary CSV attachment in the email.
3. Add retries and monitoring/alerts for the notifier (e.g., push to Slack on failure).

