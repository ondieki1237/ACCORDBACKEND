## ACCORD Backend — Project Analysis

This document summarizes the codebase structure, key components, model relationships, route→controller mappings, middleware, services, and noteworthy implementation details discovered during an initial deep review.

### Quick facts
- Location: `project/src` (main app entry `project/src/server.js`)
- Runtime: Node.js (ES modules, `type: "module"` in package.json)
- Frameworks/libraries: Express, Mongoose, Socket.IO, nodemailer, winston, node-cron

---

## Entry point and boot
- `project/src/server.js` — creates the Express app, attaches middleware, mounts routes, sets up Socket.IO, calls `connectDB()` and `initializeScheduledJobs()`, and starts the HTTP server.
- DB connection: `project/src/config/database.js` uses Mongoose to connect to `process.env.MONGODB_URI` and creates a few important indexes for collections (users, trails, visits, orders).

## Middleware and cross-cutting concerns
- Security & performance: `helmet`, `compression`, `cors`.
- Logging: `morgan` integrated with `project/src/utils/logger.js` (winston: console + files `logs/error.log` & `logs/combined.log`).
- Error handling: centralized `project/src/middleware/errorHandler.js` (maps Mongoose and JWT errors to HTTP responses).
- Authentication/authorization: `project/src/middleware/auth.js` — JWT-based `authenticate`, `authorize(...)` and `optionalAuth`.
- Validation: `project/src/middleware/validation.js` using `express-validator` with reusable validators (registration, login, visits, pagination, etc.).
- Rate limiting: `project/src/middleware/rateLimiters.js` — global (`generalLimiter`), per-user (`authUserLimiter`), and auth endpoint limiter.

## Services and background jobs
- Email service: `project/src/services/emailService.js` — nodemailer transporter and a handful of inline templates (welcome, resetPassword, dailyReport, quotation notifications).
- Scheduled jobs: `project/src/services/scheduledJobs.js` — node-cron jobs for daily reports, weekly summaries, monthly cleanup, follow-up reminders. Uses `User`, `Visit`, `Trail` models and `sendEmail`.
- Real-time: Socket.IO is attached to the HTTP server; `server.js` sets `app.set('io', io)` and controllers/routes emit events (e.g., `visits` route emits `visitUpdate`).

## Models and relations (high level)
The app uses Mongoose models under `project/src/models`. Important models and relationships:

- User (`User`)
  - Fields: employeeId, firstName, lastName, email, password, role (admin/manager/sales/engineer), region, territory, targets, refreshTokens, etc.
  - Used across the app as the primary actor (creator, assignees, engineers).

- Lead (`Lead`)
  - createdBy: ObjectId → `User` (required) — owner of the lead.
  - statusHistory[].changedBy: ObjectId → `User` — who changed status.
  - Text indexes on facilityName, location, contactPerson.name, equipmentOfInterest.name.

- Visit (`Visit`)
  - userId: ObjectId → `User` (required) — who performed the visit.
  - followUpActions.assignedTo: ObjectId → `User` — assign follow-up tasks.
  - followUpVisits: [ObjectId] → `FollowUpVisit` (references follow-up records).
  - Embedded sub-documents for client, contacts, existingEquipment, requestedEquipment.
  - Indexes: userId & date, client.type, visitOutcome.

- Machine (`Machine`)
  - metadata.createdBy: ObjectId → `User`.
  - lastServiceEngineer.engineerId: ObjectId → `User`.
  - Used by EngineeringService via `machineId` references.

- EngineeringService (`EngineeringService`)
  - userId: ObjectId → `User` — who created the service record.
  - machineId: ObjectId → `Machine` — optional, used to look up service history per machine.
  - engineerInCharge._id: ObjectId → `User` — assigned engineer.

- FollowUpVisit, Quotation, Order, Trail, Report, etc. — many refer to `User` and are used by analytics and scheduled jobs.

Relations summary:
- Users are central: referenced by Lead.createdBy, Visit.userId, FollowUp.assignedTo, Machine.metadata.createdBy, EngineeringService.userId/engineerInCharge.
- Machines and EngineeringService link via machineId -> Machine.
- Visits hold embedded client/contact/equipment info and link to users and follow-up records.

## Routes → Controllers mapping (examples)
- `project/src/routes/auth.js` — registration, login, token refresh, logout. Uses `User` model and `emailService`.
- `project/src/routes/leads.js` — CRUD operations for leads; uses `Lead` model directly inside routes.
- `project/src/routes/visits.js` — Create/list/update/delete visits; uses `Visit` model and emits Socket.IO events when visits are created.
- `project/src/routes/machines.js` — Machine CRUD and a `/ :id/services` path that delegates to `engineeringServiceController.getServicesByMachine`.
- `project/src/routes/...admin` — admin routes (inside `routes/admin/*`) typically wrap controller functions that operate with elevated permissions.

Controllers: complex business logic lives in `project/src/controllers/*` (e.g., `engineeringServiceController.js`, `adminAnalyticsController.js`) and use Mongoose pagination plugins and aggregation pipelines for analytics.

## Auth flow
- JWT-based tokens. `auth.js` generates access + refresh tokens. Refresh tokens are stored in `User.refreshTokens` subdocuments with 30-day expiration (via TTL index on createdAt).
- `authenticate` middleware extracts `Authorization: Bearer <token>` header and populates `req.user` with the user document (without sensitive fields).
- `authorize(...roles)` restricts access by role.

## Indexes & performance notes
- Database indexes are created on startup in `database.js`. Important indexes include unique user email & employeeId, visit/user date index, and text indexes on leads and machines.
- Several models use `mongoose-paginate-v2` for pagination (Lead, Visit, Machine, EngineeringService).

## Observations / potential risks / gaps
- Some route files perform a lot of inline validation and DB logic (not always separated into controllers/services). This is okay but could be refactored for testability.
- Email templates are inline HTML strings — acceptable for a small app, but moving to template files or a templating engine would help maintainability.
- Scheduled jobs perform DB operations and send emails; ensure a single instance runs jobs (watch out for multiple server instances running the cron jobs unless a distributed lock is used).
- Some validators reference path coordinates, but `client.location` was switched to a string; ensure validation rules match schema.

## How a typical request flows (example: create visit)
1. Client POST /api/visits with visit payload and Authorization header.
2. `server.js` has `app.use('/api/visits', visitRoutes)` which runs `authenticate` and `validateVisit` middleware.
3. Route handler constructs Visit with `userId: req.user._id`, computes derived fields, saves the document.
4. After save: controller/population step populates `userId` and the route emits a Socket.IO `visitUpdate` event.
5. Response is returned with the created visit (sensitive fields stripped via model methods if present).

## Next steps I can take (suggested)
1. Produce a visual ER diagram (PlantUML or Mermaid) of the main models and references.
2. Generate an OpenAPI (Swagger) spec from routes for API documentation.
3. Create a short developer README that documents environment variables required and how to run locally (DB, EMAIL_* envs, JWT secrets).
4. Run automated checks (npm install + `npm test` / lint) and list any failing items.

If you'd like, I can proceed with any of the above (pick one). I can also expand this document to include a per-file map with function-level summaries.

---

Generated: automatic analysis snapshot
