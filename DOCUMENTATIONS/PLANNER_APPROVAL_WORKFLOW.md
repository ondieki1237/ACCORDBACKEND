# Planner Approval Workflow Backend Summary

## Overview
This backend extension implements a two-step planner approval workflow:
- **Supervisor** reviews planners, can approve/disapprove and comment.
- **Accountant** reviews only approved planners, can comment.
- Only specific emails can access each approval step.

## Key Features
- **PlannerApproval Schema**: Tracks approval status, supervisor/accountant actions, and comments.
- **Role-based Route Restriction**: Only supervisor@accordmedical.co.ke and accounts@accordmedical.co.ke can access their respective endpoints.
- **API Endpoints**:
  - `POST /api/planner-approval/supervisor/:plannerId` — Supervisor approves/disapproves with comment.
  - `POST /api/planner-approval/accountant/:plannerId` — Accountant reviews/approves with comment (only after supervisor approval).
  - `GET /api/planner-approval/:plannerId` — Get approval status for a planner.

## Workflow
1. **User submits planner** (existing flow).
2. **Supervisor reviews**:
   - Approves: status set to 'approved', planner moves to accountant.
   - Disapproves: status set to 'disapproved', planner does not proceed.
3. **Accountant reviews** (only if approved):
   - Can add comment and finalize accountant review.

## Security
- **Route restriction**: Only the specified emails can access supervisor/accountant endpoints.
- **JWT authentication** required for all approval actions.

## Files Added/Modified
- `src/models/PlannerApproval.js` — New schema for approval workflow.
- `src/controllers/plannerApprovalController.js` — Handles approval logic and restrictions.
- `src/routes/plannerApproval.js` — API routes for approval actions.
- **Server registration**: Add `app.use('/api/planner-approval', plannerApprovalRoutes);` to your Express app.

## Example Usage
- Supervisor approves:
  ```http
  POST /api/planner-approval/supervisor/PLANNER_ID
  Authorization: Bearer <token>
  Body: { "status": "approved", "comment": "Looks good" }
  ```
- Accountant reviews:
  ```http
  POST /api/planner-approval/accountant/PLANNER_ID
  Authorization: Bearer <token>
  Body: { "comment": "Funds available" }
  ```
- Get approval status:
  ```http
  GET /api/planner-approval/PLANNER_ID
  Authorization: Bearer <token>
  ```

## Notes
- Only planners approved by the supervisor are visible to the accountant.
- All actions are logged with user, comment, and timestamp.
- Extendable for more roles or steps if needed.
