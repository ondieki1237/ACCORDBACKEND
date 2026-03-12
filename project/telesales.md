# Telesales Module - Complete Revamp Implementation

## Overview

The Telesales Module has been completely revamped to provide a comprehensive client management and interaction tracking system. Admins can now manage healthcare facility clients, track sales interactions, record call outcomes, and manage service requests directly from a unified interface.

**Current Date:** March 12, 2026  
**Component Path:** `/components/dashboard/telesales.tsx`  
**Status:** ✅ Production Ready

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [API Endpoints](#api-endpoints)
4. [Data Structures](#data-structures)
5. [Workflows](#workflows)
6. [Component Structure](#component-structure)
7. [Usage Guide](#usage-guide)
8. [Integration Points](#integration-points)

---

## Features

### 1. **Client Aggregation**
- Automatically fetches clients from **two data sources**:
  - Daily visits (facilities visited by sales team)
  - Machine installations (facilities with equipment)
- Deduplicates facilities with same name/location
- Combines contact information from both sources

### 2. **Client Management**
- View all aggregated clients in a clean list
- Search clients by facility name, location, or contact person
- Click any client to view detailed information
- Add new clients manually with complete facility details

### 3. **Call Recording**
- **4 Call Types:**
  - Product Inquiry
  - Service Inquiry
  - Machine Inquiry
  - Follow-up
- Auto-captures date and time of call
- Automatically records to call logs via API
- Different workflows for each call type

### 4. **Activity Timeline**
- Complete history of all facility interactions:
  - 📍 Visits (by sales team)
  - 📦 Installations (machine setup)
  - ☎️ Calls (recorded telesales interactions)
  - 🔧 Service requests (engineer-related)
- Chronologically sorted
- Timestamp for each activity

### 5. **Service Request Integration**
- When admin accepts a service inquiry:
  - Automatically creates call log record
  - Creates service task for engineers
  - Appears in Admin > Engineer Reports section
  - Includes facility name, machine model, contact details

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Telesales Dashboard                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─► Fetch Visits (API)
                              ├─► Fetch Machines (API)
                              │
                              ▼
                    ┌──────────────────────┐
                    │ Aggregate Clients    │
                    │ (Remove Duplicates)  │
                    └──────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            Client List View    Client Details View
                    │                   │
                    │                   ├─► Record Call
                    │                   │
                    │                   ├─► Call Now (Tel)
                    │                   │
                    │                   ├─► View Activity
                    │                   │
                    │                   ▼
                    │            Create Call Log (API)
                    │                   │
                    └───────────────────┴──► Query Cache Update
```

### Data Flow

```
Visit Data                Machine Data           Manual Additions
    │                          │                      │
    └──────────────────────────┼──────────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │ Client Aggregator│
                        │ (useMemo Hook)   │
                        └──────────────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
            Facility      Contact Info   Activity History
            Details       & Phone        (Chronological)
                 │             │             │
                 └─────────────┼─────────────┘
                               │
                               ▼
                      ┌────────────────────┐
                      │  Client Record     │
                      │ (Complete Profile) │
                      └────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
                Search/Filter        Display in UI
```

---

## API Endpoints

### 1. **Get Machines (Admin Only)**

**Endpoint:** `GET /api/admin/machines`  
**Authentication:** Required (Bearer Token)  
**Required Role:** admin or manager

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Results per page (default: 20) |
| facilityName | string | No | Filter by facility name |
| model | string | No | Filter by machine model |
| manufacturer | string | No | Filter by manufacturer |
| search | string | No | Text search across all fields |

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "machine-456",
        "model": "CT Scanner X-2500",
        "manufacturer": "Siemens",
        "facilityName": "Nairobi West Hospital",
        "facilityLocation": "Nairobi",
        "contactPersonName": "Dr. Sarah Kipchoge",
        "contactPersonRole": "Medical Director",
        "contactPersonPhone": "+254-722-654321",
        "installedDate": "2025-06-15"
      }
    ],
    "totalDocs": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**Usage in Telesales:**
```typescript
const { data: machinesData } = useQuery({
  queryKey: ["telesales-machines"],
  queryFn: async () => {
    const result = await apiService.getMachines(1, 1000)
    return result
  },
  staleTime: 5 * 60 * 1000,  // 5 minutes
})
```

---

### 2. **Get Visited Facilities (All Users)**

**Endpoint:** `GET /api/facilities/visited`  
**Authentication:** Required (Bearer Token)  
**Access Level:** Any authenticated user

**Query Parameters:**
```
page: number (optional, default: 1)
limit: number (optional, default: 20)
```

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "name": "City Hospital",
      "type": "hospital",
      "level": "Level 5",
      "location": "Nairobi",
      "visitCount": 12,
      "lastVisitDate": "2026-03-10T00:00:00.000Z",
      "firstVisitDate": "2025-12-01T00:00:00.000Z"
    }
  ],
  "count": 15
}
```

---

### 3. **Get All Visited Facilities - Admin View**

**Endpoint:** `GET /api/facilities/admin/all-visited`  
**Authentication:** Required (Bearer Token)  
**Required Role:** admin or manager

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Nairobi Hospital",
      "type": "hospital",
      "level": "Level 5",
      "location": "Nairobi",
      "visitCount": 12,
      "lastVisitDate": "2026-03-10T14:30:00.000Z",
      "firstVisitDate": "2025-12-01T09:15:00.000Z",
      "contactPerson": {
        "name": "Dr. James Mwangi",
        "role": "doctor",
        "phone": "+254722111222",
        "email": "james@nairobihospital.com",
        "department": "Radiology",
        "followUpRequired": true,
        "followUpDate": "2026-03-20T00:00:00.000Z",
        "priority": "high"
      },
      "allContacts": [
        {
          "name": "Dr. Alice Wanjiru",
          "role": "admin",
          "phone": "+254733222333",
          "email": "alice@nairobihospital.com",
          "department": "Administration"
        },
        {
          "name": "Dr. James Mwangi",
          "role": "doctor",
          "phone": "+254722111222",
          "email": "james@nairobihospital.com",
          "department": "Radiology"
        }
      ]
    }
  ],
  "count": 2
}
```

**Key Details:**
- **contactPerson**: Primary contact with follow-up tracking and priority
- **allContacts**: Complete list of all contacts at facility
- **followUpRequired**: Boolean flag for pending follow-ups
- **priority**: Lead priority (high, medium, low)

---

### 3. **Create Call Log**

**Endpoint:** `POST /api/call-logs`

**Request Payload:**
```typescript
{
  clientName: string;                              // Facility name
  clientPhone: string;                             // Contact phone
  callDirection: 'inbound' | 'outbound';           // Direction
  callDate: string;                                // ISO date (YYYY-MM-DD)
  callTime: string;                                // Time (HH:MM)
  callDuration: number;                            // In seconds
  callOutcome: 'interested' | 'follow_up_needed' 
            | 'not_interested' | 'no_answer' 
            | 'sale_closed';                        // Outcome type
  year: number;                                    // Year for filtering
  month: number;                                   // Month (1-12)
  week: number;                                    // Week number
  nextAction?: string;                             // Action details
  followUpDate?: string;                           // Expected follow-up date
  callNotes?: string;                              // Call notes
  tags?: string[];                                 // Optional tags
}
```

**Response Structure:**
```typescript
{
  success: boolean;
  data: {
    _id: string;                // Call log ID
    clientName: string;
    clientPhone: string;
    callDirection: string;
    callDate: string;
    callTime: string;
    callDuration: number;
    callOutcome: string;
    nextAction?: string;
    followUpDate?: string;
    callNotes?: string;
    createdBy: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    createdAt: string;          // Server timestamp
    updatedAt: string;
  }
}
```

**Usage in Telesales - Product Inquiry:**
```typescript
await apiService.createCallLog({
  clientName: selectedClient.facilityName,
  clientPhone: selectedClient.contactPerson?.phone || "",
  callDirection: 'outbound',
  callDate: "2026-03-12",         // Auto-captured
  callTime: "14:30",              // Auto-captured
  callDuration: 0,
  callOutcome: 'interested',
  year: 2026,
  month: 3,
  week: 2,
  nextAction: `Product inquiry: ${data.productInterest}`,
  followUpDate: data.expectedPurchaseDate,
  callNotes: data.notes,
})
```

**Usage in Telesales - Service Inquiry (Accepted):**
```typescript
await apiService.createCallLog({
  clientName: selectedClient.facilityName,
  clientPhone: selectedClient.contactPerson?.phone || "",
  callDirection: 'outbound',
  callDate: "2026-03-12",
  callTime: "14:30",
  callDuration: 0,
  callOutcome: 'interested',
  year: 2026,
  month: 3,
  week: 2,
  nextAction: `Service request created - ${data.machineModel}`,
  callNotes: data.notes,
})
```

---

## Data Structures

### Client Interface

```typescript
interface Client {
  id: string;                          // Unique identifier
  facilityName: string;                // Facility/client name
  location: string;                    // Geographic location
  machineInstalled: boolean;           // Whether equipment is present
  contactPerson?: {
    name: string;                      // Contact person name
    role: string;                      // Job role/title
    phone: string;                     // Phone number
  };
  lastActivity?: {
    type: 'visit' | 'installation' 
         | 'call' | 'service';        // Activity type
    date: string;                      // ISO datetime
    description: string;               // Activity description
  };
  activityHistory: Array<{             // All recorded activities
    type: 'visit' | 'installation' 
         | 'call' | 'service';
    date: string;
    description: string;
  }>;
  source: 'visit' | 'machine' | 'manual';  // Data origin
}
```

### Facility (Visited) Interface

```typescript
interface VisitedFacility {
  name: string;                        // Facility name
  type: string;                        // hospital, clinic, etc.
  level?: string;                      // Hospital level (e.g., Level 5)
  location: string;                    // Geographic location
  visitCount: number;                  // Total number of visits
  lastVisitDate: string;               // ISO datetime of last visit
  firstVisitDate: string;              // ISO datetime of first visit
}
```

### Facility Admin Interface

```typescript
interface FacilityAdmin extends VisitedFacility {
  contactPerson: {
    name: string;
    role: string;
    phone: string;
    email: string;
    department: string;
    notes?: string;
    followUpRequired?: boolean;
    followUpDate?: string;
    priority?: 'high' | 'medium' | 'low';
  };
  allContacts: Array<{
    name: string;
    role: string;
    phone: string;
    email: string;
    department: string;
    notes?: string;
  }>;
}
```

### Machine Interface

```typescript
interface Machine {
  _id: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  facilityName: string;                // Client facility
  facilityLocation: string;            // Client location
  facilityLevel?: string;
  contactPersonName: string;           // Primary contact
  contactPersonRole: string;
  contactPersonPhone: string;
  contactPersonEmail?: string;
  installedDate: string;               // Installation date
  purchaseDate?: string;
  warrantyExpiry?: string;
  lastServicedAt?: string;
  nextServiceDue?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}
```

### Call Record Interface

```typescript
interface CallRecord {
  clientId: string;                              // Client reference
  callType: 'product_inquiry' | 'service_inquiry' 
           | 'machine_inquiry' | 'follow_up';   // Call purpose
  outcome?: string;                              // Call result
  productInterest?: string;                      // For product inquiries
  expectedPurchaseDate?: string;                 // When buying
  machineModel?: string;                         // For service inquiries
  serviceAccepted?: boolean;                     // Service status
  notes?: string;                                // Additional notes
}
```

---

## Workflows

### Workflow 1: Client Discovery & Display

**Step 1: Data Fetching**
- Component mounts
- Two parallel API calls execute:
  - `GET /api/visits?page=1&limit=1000`
  - `GET /api/admin/machines?page=1&limit=1000`
- React Query caches with 5-minute stale time

**Step 2: Client Aggregation**
- `aggregateClients()` function merges data:
  1. Creates Map<string, Client> keyed by `facilityName-location`
  2. Iterates visits, creates Client entries
  3. Iterates machines, updates or creates Client entries
  4. Deduplicates by facility + location
  5. Merges contact info from both sources
  6. Sorts activity history by date (newest first)

**Step 3: Display & Search**
- `filteredClients` memo filters by search query
- Real-time string matching on:
  - Facility name
  - Location
  - Contact person name

---

### Workflow 2: Add New Client

**Dialog Flow:**
```
1. Admin clicks "Add New Client" button
2. Modal opens with form:
   - Facility Name (required)
   - Location (required)
   - Contact Person Name (required)
   - Contact Role (required)
   - Contact Phone (required)
   - Machine Installed (optional toggle)
3. Form validation checks all required fields
4. Admin clicks "Add Client" button
5. Mutation executes:
   - Creates new Client object in memory
   - Sets source as 'manual'
   - Adds activity: "Client added to system"
6. Toast notification shows success
7. Dialog closes
8. Query cache invalidates (refreshes list)
```

**Data Saved:**
```typescript
{
  id: `manual-${Date.now()}`,
  facilityName: form.facilityName,
  location: form.location,
  contactPerson: {
    name: form.contactPersonName,
    role: form.contactPersonRole,
    phone: form.contactPersonPhone,
  },
  machineInstalled: form.machineInstalled,
  activityHistory: [{
    type: 'call',
    date: new Date().toISOString(),
    description: 'Client added to system',
  }],
  source: 'manual',
}
```

---

### Workflow 3: Record Call - Product Inquiry

**User Journey:**
```
1. Admin clicks on a client card
2. Client details panel opens
3. Admin clicks "Record Call" button
4. Dialog opens with call type selection
5. Admin selects "Product Inquiry"
6. Form shows:
   - Product Interested In (required)
   - Expected Purchase Date (optional)
7. Admin fills in product name and date
8. Optionally adds notes
9. Clicks "Record Call"
10. System captures current date/time
11. Creates call log via API:
    - clientName: facility name
    - clientPhone: contact phone
    - callOutcome: 'interested'
    - nextAction: "Product inquiry: [product]"
    - followUpDate: [date if provided]
12. Toast success message
13. Activity timeline updates immediately
14. Dialog closes
```

**API Call Generated:**
```javascript
POST /api/call-logs
{
  clientName: "Aga Khan Hospital",
  clientPhone: "+254-700-123456",
  callDirection: "outbound",
  callDate: "2026-03-12",           // Auto from system
  callTime: "14:30",                // Auto from system
  callDuration: 0,
  callOutcome: "interested",
  year: 2026,
  month: 3,
  week: 2,
  nextAction: "Product inquiry: Dialysis Machine",
  followUpDate: "2026-04-15",
  callNotes: "Client very interested in rental options",
}
```

---

### Workflow 4: Record Call - Service Inquiry (Accepted)

**User Journey:**
```
1. Admin selects client and clicks "Record Call"
2. Dialog opens
3. Admin selects "Service Inquiry"
4. Form shows:
   - Machine Model (required)
   - Service Status toggle buttons
5. Admin enters machine model and clicks "Accepted"
6. Optionally adds notes
7. Clicks "Record Call"
8. System executes:
   a) Captures current date/time
   b) Creates call log (callOutcome: 'interested')
   c) nextAction includes service request marker
   d) Logs with message: "Service request created - [model]"
9. Service task created (appears in Engineer Reports)
10. Toast shows success
11. Activity updated with service record
12. Call log visible in activity timeline
```

**API Call Generated:**
```javascript
POST /api/call-logs
{
  clientName: "Nairobi West Hospital",
  clientPhone: "+254-722-654321",
  callDirection: "outbound",
  callDate: "2026-03-12",
  callTime: "15:45",
  callDuration: 0,
  callOutcome: "interested",
  year: 2026,
  month: 3,
  week: 2,
  nextAction: "Service request created - CT Scanner Model 500",
  callNotes: "Client requested maintenance visit ASAP",
}
```

**Engineer Task:** Service team sees this in their reports/tasks queue with:
- Facility name
- Machine model
- Contact person details
- Request date & time
- Status: Pending

---

### Workflow 5: Record Call - Service Inquiry (Declined)

**Difference:**
```
- Admin selects "Service Inquiry"
- Enters machine model
- Clicks "Declined" button
- No service task created
- Call log recorded with nextAction as note
- Appears in activity timeline for reference
```

---

### Workflow 6: View Activity Timeline

**When Client Panel Opens:**
```
1. Activity timeline displays automatically
2. Activities are sorted newest first
3. Color-coded by type:
   - 📍 Visit = Blue dot
   - 📦 Installation = Green dot
   - ☎️ Call = Purple dot
   - 🔧 Service = Orange dot
4. Each shows:
   - Icon/color indicator
   - Activity description
   - Full timestamp (date + time)
5. Timeline connects activities vertically
6. No data state: "No activity recorded yet"
```

---

## Component Structure

### Main Component: `TelessalesRevamp`

**Location:** `/components/dashboard/telesales.tsx`

**State Variables:**
```typescript
// UI State
const [selectedClient, setSelectedClient] = useState<Client | null>(null)
const [isAddClientDialog, setIsAddClientDialog] = useState(false)
const [isCallRecordingDialog, setIsCallRecordingDialog] = useState(false)
const [searchQuery, setSearchQuery] = useState("")

// Form States
const [addClientForm, setAddClientForm] = useState({
  facilityName: "",
  location: "",
  contactPersonName: "",
  contactPersonRole: "",
  contactPersonPhone: "",
  machineInstalled: false,
})

const [callRecordingForm, setCallRecordingForm] = useState({
  callType: "product_inquiry",
  productInterest: "",
  expectedPurchaseDate: "",
  machineModel: "",
  serviceAccepted: undefined,
  notes: "",
})
```

**Key Hooks:**

```typescript
// Data fetching queries
const { data: visitsData } = useQuery({
  queryKey: ["telesales-visits"],
  queryFn: () => apiService.getVisits(1, 1000),
  staleTime: 5 * 60 * 1000,
})

const { data: machinesData } = useQuery({
  queryKey: ["telesales-machines"],
  queryFn: () => apiService.getMachines(1, 1000),
  staleTime: 5 * 60 * 1000,
})

// Mutations
const addClientMutation = useMutation({...})
const recordCallMutation = useMutation({...})
```

**Render Functions:**

| Function | Purpose | Renders |
|----------|---------|---------|
| `renderClientList()` | Display all clients with search | Card grid or empty state |
| `renderClientDetails()` | Show full client profile | Facility details, actions, timeline |
| `main return` | Conditional routing | List or detail view |

---

## Usage Guide

### For Administrators

#### Accessing Telesales
1. Navigate to Dashboard → Telesales
2. Permission check: Admin access required
3. Page loads with all aggregated clients

#### Viewing Clients
1. **See all clients** - Page displays by default
2. **Search clients** - Type in search box (facility, location, or contact name)
3. **Click a client** - Opens detailed view

#### Adding New Client
1. Click "Add New Client" button (top right)
2. Fill all required fields:
   - Facility name (hospital, clinic, etc.)
   - Location (city/address)
   - Contact person name
   - Contact role (e.g., Facilities Manager)
   - Contact phone number
3. Optional: Check "Machine Installed" if applicable
4. Click "Add Client" - Success toast confirms

#### Recording a Call
1. Click any client card to open details
2. Click "Record Call" button
3. Select call type:
   - **Product Inquiry** → Fill product name & purchase date
   - **Service Inquiry** → Fill machine model & accept/decline
   - **Machine Inquiry** → Fill machine details
   - **Follow Up** → Just add optional notes
4. Add optional call notes
5. Click "Record Call"
6. Success notification shows
7. Activity timeline updates automatically

#### Calling Directly
1. Open client details
2. Click "Call Now" button
3. Automatically opens phone app with contact number
4. After call, click "Record Call" to log details

#### Viewing Activity History
1. Open client details panel
2. Scroll to "Recent Activity" section
3. See chronological timeline of:
   - Previous visits
   - Machine installations
   - Call records
   - Service requests

#### Quick Actions
- **Refresh Data** - Click refresh icon (top right)
- **Call Now** - Direct dial from client details
- **Record Multiple Calls** - Can record multiple calls per client

---

## Integration Points

### With Machines Module
- **Data Source:** `/api/admin/machines` endpoint
- **Frequency:** Every 5 minutes (cached)
- **Data Used:** Facility name, location, contacts, model, installed date
- **Filtering:** By facility name, model, or manufacturer
- **Requires Role:** Admin or Manager
- **Status:** ✅ Active

### With Visited Facilities (User Level)
- **Data Source:** `/api/facilities/visited` endpoint
- **Frequency:** Every 5 minutes (cached)
- **Data Used:** Facility name, type, level, location, visit count, visit dates
- **Access Level:** Any authenticated user
- **Status:** ✅ Active

### With Visited Facilities (Admin View)
- **Data Source:** `/api/facilities/admin/all-visited` endpoint
- **Frequency:** Every 5 minutes (cached)
- **Data Used:** Complete facility info, primary contact with follow-up tracking, all contacts, priority levels
- **Filtering:** Follow-up required, priority levels
- **Requires Role:** Admin or Manager
- **Status:** ✅ Ready

### With Call Logs / Telesales API
- **Endpoint:** `/api/call-logs` (POST)
- **Frequency:** As calls are recorded
- **Data Created:** Call records for all interactions
- **Status:** ✅ Active

### With Engineer Reports
- **Trigger:** Service inquiry accepted
- **Data Passed:** Facility name, machine model, contact, date/time
- **Location:** Service requests appear in Admin → Engineer Reports
- **Status:** ✅ Ready

---

## Technical Details

### Performance Optimizations

1. **React Query Caching**
   ```typescript
   staleTime: 5 * 60 * 1000  // 5 minutes before refetch
   gcTime: 0                 // Don't garbage collect (default behavior)
   ```

2. **Memoization**
   ```typescript
   const allClients = useMemo(() => aggregateClients(), [visitsData, machinesData])
   const filteredClients = useMemo(() => {...}, [allClients, searchQuery])
   ```
   - Prevents unnecessary re-aggregation
   - Only recalculates on data changes

3. **Deduplication**
   - Uses `Map<facilityName-location, Client>` for efficient lookup
   - O(n) time complexity for aggregation
   - Handles data from both sources seamlessly

### Error Handling

```typescript
// Toast notifications for user feedback
toast({
  title: "Error",
  description: error.message || "Failed to record call",
  variant: "destructive",
})

// Try-catch in mutations
onError: (error: any) => {
  toast({...})
}
```

### Authentication & Permissions

```typescript
const currentUser = authService.getCurrentUserSync()
const isAdmin = hasAdminAccess(currentUser)

// If not admin, render permission denied message
if (!isAdmin) {
  return <Card className="border-red-200 bg-red-50">...</Card>
}
```

---

## Future Enhancements

### Planned Features
- [ ] Bulk call import (CSV)
- [ ] Call recording/transcription
- [ ] Email notifications for follow-ups
- [ ] WhatsApp integration for calling
- [ ] Service request status tracking
- [ ] Call duration manual entry
- [ ] Call recording with audio attachment
- [ ] Advanced analytics dashboard

### Potential Improvements
- [ ] Pagination for large client lists (currently loads all)
- [ ] Export clients to Excel/PDF
- [ ] Bulk actions (email multiple clients, etc.)
- [ ] Activity filtering/sorting
- [ ] Follow-up reminders
- [ ] Sentiment analysis on call notes
- [ ] Lead scoring

---

## Troubleshooting

### Issue: Clients not showing

**Solution:**
- Ensure visits and machines tables have data
- Check network tab for API errors
- Verify user has admin permissions
- Try clicking refresh button

### Issue: Call not recording

**Solution:**
- Verify client has phone number
- Check browser console for errors
- Ensure required fields are filled
- Verify API endpoint accessibility

### Issue: Activity timeline empty

**Solution:**
- Timeline only shows after aggregation
- Visit/machine data may still be loading
- Refresh page to retry

### Issue: Can't add client manually

**Solution:**
- Ensure all required fields filled
- Check "Add Client" button is enabled
- Verify admin permissions
- Look for validation error messages

---

## Code Example: Using the API Directly

### Fetching Clients with API

```typescript
// Fetch all clients (combination of visits and machines)
const response1 = await apiService.getVisits(1, 1000)
const response2 = await apiService.getMachines(1, 1000)

// Merge data in your component
const clients = aggregateClients(response1.data, response2.data)
```

### Creating a Call Log

```typescript
const callLog = await apiService.createCallLog({
  clientName: "Hospital Name",
  clientPhone: "+254-700-123456",
  callDirection: "outbound",
  callDate: "2026-03-12",
  callTime: "14:30",
  callDuration: 0,
  callOutcome: "interested",
  year: 2026,
  month: 3,
  week: 2,
  nextAction: "Product interest noted",
  callNotes: "Client interested in bulk order",
})

console.log("Call logged:", callLog.data?._id)
```

---

## API Response Examples

### Get Machines Response

```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "machine-456",
        "model": "CT Scanner X-2500",
        "manufacturer": "Siemens",
        "facilityName": "Nairobi West Hospital",
        "facilityLocation": "Nairobi",
        "contactPersonName": "Dr. Sarah Kipchoge",
        "contactPersonRole": "Medical Director",
        "contactPersonPhone": "+254-722-654321",
        "installedDate": "2025-06-15",
        "status": "active"
      }
    ],
    "totalDocs": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Get Visited Facilities Response

```json
{
  "success": true,
  "data": [
    {
      "name": "City Hospital",
      "type": "hospital",
      "level": "Level 5",
      "location": "Nairobi",
      "visitCount": 12,
      "lastVisitDate": "2026-03-10T00:00:00.000Z",
      "firstVisitDate": "2025-12-01T00:00:00.000Z"
    }
  ],
  "count": 15
}
```

### Get Admin Visited Facilities Response

```json
{
  "success": true,
  "data": [
    {
      "name": "Nairobi Hospital",
      "type": "hospital",
      "level": "Level 5",
      "location": "Nairobi",
      "visitCount": 12,
      "lastVisitDate": "2026-03-10T14:30:00.000Z",
      "firstVisitDate": "2025-12-01T09:15:00.000Z",
      "contactPerson": {
        "name": "Dr. James Mwangi",
        "role": "doctor",
        "phone": "+254722111222",
        "email": "james@nairobihospital.com",
        "department": "Radiology",
        "followUpRequired": true,
        "followUpDate": "2026-03-20T00:00:00.000Z",
        "priority": "high"
      },
      "allContacts": [
        {
          "name": "Dr. Alice Wanjiru",
          "role": "admin",
          "phone": "+254733222333",
          "email": "alice@nairobihospital.com",
          "department": "Administration"
        },
        {
          "name": "Dr. James Mwangi",
          "role": "doctor",
          "phone": "+254722111222",
          "email": "james@nairobihospital.com",
          "department": "Radiology"
        }
      ]
    }
  ],
  "count": 2
}
```

### Create Call Log Response

```json
{
  "success": true,
  "data": {
    "_id": "call-789",
    "clientName": "Aga Khan Hospital",
    "clientPhone": "+254-700-123456",
    "callDirection": "outbound",
    "callDate": "2026-03-12",
    "callTime": "14:30",
    "callDuration": 0,
    "callOutcome": "interested",
    "nextAction": "Product inquiry: Dialysis Machine",
    "followUpDate": "2026-04-15",
    "callNotes": "Very interested in pricing options",
    "year": 2026,
    "month": 3,
    "week": 2,
    "createdBy": {
      "_id": "user-123",
      "firstName": "Admin",
      "lastName": "User"
    },
    "createdAt": "2026-03-12T14:30:45Z",
    "updatedAt": "2026-03-12T14:30:45Z"
  }
}
```

---

## Summary

The revamped Telesales Module provides a complete solution for managing healthcare facility clients and sales interactions. It seamlessly integrates with existing visit and machine data while providing powerful call recording and service request management capabilities.

**Key Metrics:**
- ✅ 3 API endpoints integrated
- ✅ 4 call type workflows
- ✅ Real-time client aggregation
- ✅ Complete activity tracking
- ✅ Service request automation
- ✅ Admin-only access control

**Current Status:** Production Ready (March 12, 2026)
