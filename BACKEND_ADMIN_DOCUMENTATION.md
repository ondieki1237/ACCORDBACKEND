# Admin API Documentation

This document outlines the API endpoints available for the Admin Dashboard. All endpoints are prefixed with `/api/admin` unless otherwise noted.

## Authentication
All admin endpoints require authentication and the `admin` (or sometimes `manager`) role.
Headers: `Authorization: Bearer <token>`

## Visits
Base URL: `/api/admin/visits`

### Get Daily Activities
- **URL**: `/daily/activities`
- **Method**: `GET`
- **Description**: Get daily visits activities for all sales team members.
- **Query Params**:
    - `date`: (Optional) Date to filter by (YYYY-MM-DD). Defaults to today.
    - `page`: Page number (default 1).
    - `limit`: Items per page (default 50).
    - `region`: Filter by region.
    - `userId`: Filter by specific user.
    - `outcome`: Filter by visit outcome.

### Get User Visits
- **URL**: `/user/:userId`
- **Method**: `GET`
- **Description**: Get paginated visits for a specific user.
- **Query Params**:
    - `page`, `limit`
    - `startDate`, `endDate`
    - `clientName`, `contactName`
    - `outcome`, `tag`
    - `sort`

### Get Visits Summary
- **URL**: `/summary`
- **Method**: `GET`
- **Description**: Get summary of visits per user (counts and last visit date).
- **Query Params**:
    - `limit`: Max number of users to return (default 50).

### Get Visit Detail
- **URL**: `/:id`
- **Method**: `GET`
- **Description**: Get full details of a single visit.

## Users
Base URL: `/api/admin/users`

### List Users
- **URL**: `/`
- **Method**: `GET`
- **Description**: List all users.

### Create User
- **URL**: `/`
- **Method**: `POST`
- **Description**: Create a new user (Admin, Manager, Sales, Engineer).
- **Body**:
    ```json
    {
      "employeeId": "EMP001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "password": "password123",
      "role": "sales",
      "region": "Nairobi",
      "territory": "Westlands", // Optional
      "department": "Sales", // Optional
      "phone": "+254..." // Optional
    }
    ```

## Leads
Base URL: `/api/admin/leads`

### List Leads
- **URL**: `/`
- **Method**: `GET`
- **Description**: List all leads with filters.
- **Query Params**:
    - `page`, `limit`
    - `facilityType`, `leadStatus`, `urgency`
    - `startDate`, `endDate`
    - `search`

### Get Lead Detail
- **URL**: `/:id`
- **Method**: `GET`
- **Description**: Get single lead details.

### Get Lead History
- **URL**: `/:id/history`
- **Method**: `GET`
- **Description**: Get status history timeline for a lead.

### Update Lead
- **URL**: `/:id`
- **Method**: `PUT`
- **Description**: Update lead details or status.
- **Body**: Any lead fields to update.

### Delete Lead
- **URL**: `/:id`
- **Method**: `DELETE`
- **Description**: Delete a lead.

### Diagnostic Endpoints
- `GET /check`: Comprehensive check of lead collection.
- `GET /count`: Count leads matching filters.
- `GET /raw`: Get raw lead documents (up to 100).

## Machines
Base URL: `/api/admin/machines`

### List Machines
- **URL**: `/`
- **Method**: `GET`
- **Description**: List machines with filters.
- **Query Params**: `page`, `limit`, `facilityName`, `model`, `manufacturer`, `search`.

### Create Machine
- **URL**: `/`
- **Method**: `POST`
- **Description**: Create a single machine.
- **Body**: Machine object.

### Bulk Create Machines
- **URL**: `/bulk`
- **Method**: `POST`
- **Description**: Create multiple machines.
- **Body**: Array of machine objects.

### Get Machine
- **URL**: `/:id`
- **Method**: `GET`
- **Description**: Get single machine details.

### Update Machine
- **URL**: `/:id`
- **Method**: `PUT`
- **Description**: Update machine.

### Delete Machine
- **URL**: `/:id`
- **Method**: `DELETE`
- **Description**: Delete machine.

### Trigger Due Report
- **URL**: `/reports/due`
- **Method**: `POST`
- **Description**: Trigger machines due for service report.
- **Query/Body**: `days` (default 5).

## Reports (Weekly Reports)
Base URL: `/api/admin/reports`

### List Reports
- **URL**: `/`
- **Method**: `GET`
- **Description**: List weekly reports.
- **Query Params**: `page`, `limit`, `status`, `userId`, `startDate`, `endDate`.

### Get Report Detail
- **URL**: `/:id`
- **Method**: `GET`
- **Description**: Get single report with full details (visits, quotations, stats).

### Update Report Status
- **URL**: `/:id`
- **Method**: `PUT`
- **Description**: Update report status (e.g., approve/reject) and add notes.
- **Body**:
    ```json
    {
      "status": "approved", // pending, reviewed, approved, rejected
      "adminNotes": "Good work"
    }
    ```

### Bulk Fetch Reports
- **URL**: `/bulk`
- **Method**: `POST`
- **Description**: Fetch multiple reports with details (for PDF generation).
- **Body**: `{ "reportIds": ["id1", "id2"] }`

### Get Stats Summary
- **URL**: `/stats/summary`
- **Method**: `GET`
- **Description**: Get statistics on reports (counts by status).

## Quotations
Base URL: `/api/admin/quotations`

### List Quotations
- **URL**: `/`
- **Method**: `GET`
- **Description**: List quotation requests.
- **Query Params**: `page`, `limit`, `status`, `urgency`, `userId`, `responded`, `startDate`, `endDate`, `search`.

### Get Quotation
- **URL**: `/:id`
- **Method**: `GET`
- **Description**: Get single quotation request.

### Respond to Quotation
- **URL**: `/:id/respond`
- **Method**: `PUT`
- **Description**: Send response to a quotation request.
- **Body**:
    ```json
    {
      "response": "Message to sales rep",
      "quotationDocument": "url_to_pdf",
      "price": 100000,
      "isAvailable": true,
      "notes": "Internal notes"
    }
    ```

### Update Quotation Status
- **URL**: `/:id`
- **Method**: `PUT`
- **Description**: Update status only.
- **Body**: `{ "status": "completed" }`

### Get Stats Summary
- **URL**: `/stats/summary`
- **Method**: `GET`
- **Description**: Get quotation statistics.

## Analytics
Base URL: `/api/admin/analytics`

### Sales Analytics
- **URL**: `/sales/:userId`
- **Method**: `GET`
- **Description**: Get sales analytics for a specific user.

## Planners
Base URL: `/api/admin/planners`

### List Planners
- **URL**: `/`
- **Method**: `GET`
- **Description**: Fetch all planners.

## Location
Base URL: `/api/admin/location`

### Get Location History
- **URL**: `/`
- **Method**: `GET`
- **Description**: Get location history for users.

## General Admin
Base URL: `/api/admin`

### Get Stats
- **URL**: `/stats`
- **Method**: `GET`
- **Description**: Get general admin dashboard statistics.

## Facilities
Base URL: `/api/facilities`

### Get Visited Facilities
- **URL**: `/visited`
- **Method**: `GET`
- **Description**: Get list of unique facilities visited by the authenticated user.
- **Access**: Private (authenticated users)
- **Response**: Array of facilities with visit counts and dates.

