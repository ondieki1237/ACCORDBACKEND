# Sunday Changes - Multiple Contacts for Visits

## Overview
We have updated the "New Client Visit" form to support adding multiple contact persons for a single visit. Previously, only a single contact could be recorded.

## Frontend Changes
### `components/visits/create-visit-form.tsx`
- **State Update**: The `formData` state now includes a `contacts` array instead of individual `contactName`, `contactRole`, etc. fields.
- **State Update**: The `formData` state now includes a `productsOfInterest` array for tracking multiple items of interest.
- **UI Update**: 
    - Replaced the single "Contact Person" card with a "People Met" section.
    - Added "Items of Interest" section with dynamic add/remove functionality.
    - Added "Add Person" and "Add Item" buttons to dynamically add more entries.
    - Added "Remove" button to remove entries (except when there is only one).
    - **Removed**: The "Start Time" input field has been removed. The system now defaults the time to 09:00:00 when creating the visit date timestamp.
### `components/visits/visit-list.tsx` & `components/visits/visit-detail.tsx`
- **UI Update**: Removed the time display from the visit list cards and the visit detail view.
- **Logic**: 
    - `addContact`, `removeContact`, `updateContact`, `addProduct`, `removeProduct`, and `updateProduct` helper functions were added.
    - The `handleSubmit` function was updated to filter out empty contacts and products, sending them in the API payload.
    - **Draft Saving**: Implemented auto-saving of form data to local storage (`visitFormDraft`). Drafts are restored on load and cleared on successful submission or cancellation.
    - **Offline Support**: Enhanced error handling to catch network failures. If offline, visits are saved to `pendingVisits` and automatically synced when the connection is restored.

## Backend API Requirements
The backend API endpoint for creating visits (`POST /api/visits`) needs to accept a `contacts` array and a `productsOfInterest` array in the request body.

### JSON Payload Structure
```json
{
  "date": "2023-10-27T09:00:00.000Z",
  "startTime": "2023-10-27T09:00:00.000Z",
  "client": {
    "name": "Nairobi Hospital",
    "type": "hospital",
    "level": "5",
    "location": "Nairobi"
  },
  "visitPurpose": "sales",
  "visitOutcome": "successful",
  "contacts": [
    {
      "name": "Dr. Jane Doe",
      "role": "doctor",
      "phone": "+254712345678",
      "email": "jane@example.com"
    },
    {
      "name": "John Smith",
      "role": "admin",
      "phone": "+254787654321",
      "email": "john@example.com"
    }
  ],
  "productsOfInterest": [
    {
      "name": "Ultrasound Machine",
      "notes": "Interested in portable model"
    },
    {
      "name": "ECG Monitor",
      "notes": ""
    }
  ],
  "isFollowUpRequired": false,
  "notes": "Met with both the head doctor and the admin."
}
```

### Notes
- The `contacts` array is optional but if provided, it should contain objects with `name` (required), `role` (required), `phone`, and `email`.
- The `productsOfInterest` array is optional but if provided, it should contain objects with `name` (required) and `notes`.
- The previous fields `contactName`, `contactRole`, `contactPhone`, and `contactEmail` are no longer sent in the root of the payload.

## Admin Dashboard
The Admin Dashboard needs to be updated to reflect the changes in the data structure.

### Visit Detail View
- **Contacts Display**: 
    - Replace the single contact display with a list or table of "People Met".
    - Show `name`, `role`, `phone`, and `email` for each contact.
- **Products of Interest**:
    - Add a new section to display "Products of Interest".
    - Show `name` and `notes` for each product.
- **Time Display**:
    - Remove the specific start time display if it is no longer relevant/accurate, or ensure it reflects the default 09:00:00 correctly without confusing the user.

### Visit List Table
- **Contacts Column**:
    - Update the "Contact" column to handle multiple contacts.
    - Suggestion: Display the first contact's name and a count of others (e.g., "Dr. Jane Doe + 1 other").
- **Search/Filter**:
    - Ensure the search functionality works for *any* of the contact names (Backend already supports this).
