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

## Seeding sample machines

A tiny seed script has been added at `project/seedMachines.js` to insert 200 synthetic Machine documents for testing.

Usage (from the repo root):

```bash
# Option A: pass MongoDB URI on the command line
node project/seedMachines.js "mongodb+srv://user:pass@cluster.example.com/dbname"

# Option B: set MONGODB_URI in your environment or add it to a .env file in the project and run
node project/seedMachines.js
```

Notes:
- The script accepts either an environment variable `MONGODB_URI` or a command-line argument.
- It will insert 200 machines with randomized fields (model, manufacturer, facility, dates).
- If you want a smaller or larger batch, edit the script (`for (let i = 1; i <= 200; i++)`) before running.

---

File locations (quick reference):

- Model: `project/src/models/Machine.js`
- Routes: `project/src/routes/machines.js`, `project/src/routes/admin/machines.js`
- Engineering service model: `project/src/models/EngineeringService.js` (now includes `machineId`)
- Engineering controller updated: `project/src/controllers/engineeringServiceController.js`

If you want, I can now:
- Add the `/api/machines/:id/services` endpoint and a controller method to fetch service history for a machine.
- Add import CSV endpoint for admins.
