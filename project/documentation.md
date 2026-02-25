# Planner Review System Documentation

This document outlines the architecture, workflow, and recent fixes applied to the Planner Review System in the ACCORD backend.

## 1. System Overview
The Planner Review System is designed to allow supervisors and accountants to review weekly route planners submitted by field personnel (e.g., sales representatives and engineers). 

The review process follows a sequential flow:
1. **Submission**: A user submits a planner. Its initial state does not have an approval record (implicitly *pending*).
2. **Supervisor Review**: A supervisor reviews the planner, and can either **approve** or **disapprove** with comments.
3. **Accountant Review**: After supervisor approval, an accountant reviews the financial aspects (e.g., transport allowances) and applies their own approval/disapproval.

The state of a planner's approval is stored in a dedicated `PlannerApproval` MongoDB collection, leaving the core `Planner` collection focused on the schedule itself.

## 2. API Endpoints

The planner approval logic is handled in `src/routes/plannerApproval.js` and `src/controllers/plannerApprovalController.js`. 

### Supervisor Review
*   **Method:** `POST /api/planner-approval/supervisor/:plannerId`
*   **Access:** Restricted to `supervisor@accordmedical.co.ke`
*   **Payload:** `{ "status": "approved" | "disapproved", "comment": "String" }`
*   **Action:** Creates or updates a `PlannerApproval` document, setting the supervisor's status, name, email, and comments.

### Accountant Review
*   **Method:** `POST /api/planner-approval/accountant/:plannerId`
*   **Access:** Restricted to `accounts@accordmedical.co.ke`
*   **Payload:** `{ "status": "approved" | "disapproved", "comment": "String", "allowance": Number }`
*   **Action:** Updates the existing `PlannerApproval` document with the accountant's review. Requires the supervisor to have approved it first.

### Fetch Status
*   **Method:** `GET /api/planner-approval/:plannerId`
*   **Action:** Retrieves the standalone approval document for a specific planner.

## 3. The Retrieval & Frontend Syncing Mechanism

To ensure the frontend displays the correct approval state for all planners on the dashboard (and keeps state upon a page refresh), the admin planner fetch endpoints embed the approval data directly into the planner response.

*   **File:** `src/controllers/plannerController.js`
*   **Endpoints:** `GET /api/admin/planners` and `GET /api/admin/planners/:id` (used by Supervisors and Admins on the frontend).

**How it works:**
1. The backend retrieves the paginated list of `Planner` documents.
2. It extracts an array of the `_id`s for those planners.
3. It queries the `PlannerApproval` collection using `$in` to find all corresponding approval documents.
4. It maps over the planners, attaching the retrieved approval document as an `approval` property. If no approval exists, `approval: null` is returned.

## 4. Recent Fixes & Improvements
During testing, two major bugs preventing the planner approval flow from working were identified and resolved:

### A. Missing Body Parser for Approval Routes
*   **Bug:** The supervisor and accountant POST routes were returning a `Missing request body` error perfectly valid JSON payloads were sent.
*   **Cause:** In `src/server.js`, the `plannerApprovalRoutes` were mounted *before* any global `express.json()` body parser was invoked for that routing path.
*   **Fix:** Specifically injected `express.json()` and `express.urlencoded({ extended: true })` middleware precisely at the mount point for `/api/planner-approval` in `server.js`.

### B. Frontend Losing Approval State on Refresh
*   **Bug:** When the supervisor approved a planner, it showed as approved temporarily on the frontend, but refreshing the page reverted it to "pending."
*   **Cause:** The `GET /api/admin/planners` queries were only returning the `Planner` schema data. The `PlannerApproval` collection was being entirely ignored, meaning the frontend was not being told whether a planner had been reviewed.
*   **Fix:** Updated `adminGetAllPlanners` and `adminGetPlannerById` in `src/controllers/plannerController.js` to automatically fetch the linked `PlannerApproval` document and inject it into the returned payload as the `approval` object.

This ensures robust and synchronous viewing of planner reviews across the application.
