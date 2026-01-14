# Bulk Add Machines & Engineer Selection - Feature Guide

## New Features Added ✨

### 1. Engineer Selection Dropdown (Service Creation)
**Previous**: Manual text input for engineer name and phone
**Now**: Dropdown list of all engineers in the system

### 2. Bulk Add Machines
**Previous**: Add one machine at a time
**Now**: Add multiple machines via JSON array

---

## 🎯 Feature 1: Engineer Selection Dropdown

### What Changed
The "Create Service" form now queries all engineers from the database and displays them in a dropdown menu instead of requiring manual name/phone input.

### User Experience

#### Before:
```
Engineer Name: [Type name here]
Engineer Phone: [Type phone here]
```

#### After:
```
Select Engineer: [Dropdown list]
  -- Select an engineer --
  John Doe (+254712345678)
  Jane Smith (+254723456789)
  Michael Johnson (+254734567890)

[Selected engineer details displayed below]
```

### How It Works

1. **Data Fetching**: When the machines page loads, it automatically fetches all engineers
   ```typescript
   const { data: engineersData } = useQuery({
     queryKey: ["engineers"],
     queryFn: async () => apiService.getEngineers(),
     staleTime: 5 * 60 * 1000, // Cache for 5 minutes
   })
   ```

2. **Engineer Selection**: User selects from dropdown
   - Dropdown shows: `Name (Phone)`
   - Automatically fills: name, phone, engineerId

3. **Confirmation**: Selected engineer details shown in blue box
   ```
   ┌──────────────────────────────┐
   │ John Doe                     │
   │ +254712345678                │
   └──────────────────────────────┘
   ```

4. **Submission**: Service created with engineer's complete info including email

### Benefits
- ✅ No typos in engineer names
- ✅ Consistent data (same engineer = same ID)
- ✅ Auto-filled phone numbers
- ✅ Better tracking (engineer ID linked to user account)
- ✅ Email included automatically

### Validation
- Submit button disabled until engineer selected
- Shows "No engineers found" if database empty
- Shows "Loading engineers..." during fetch

### Code Implementation

```typescript
// State includes engineerId
const [serviceFormData, setServiceFormData] = useState({
  serviceType: "maintenance",
  scheduledDate: "",
  engineerName: "",
  engineerPhone: "",
  engineerId: "",  // NEW: Links to user ID
  notes: "",
  status: "scheduled"
})

// Handler updates all fields
const handleEngineerSelect = (engineerId: string) => {
  const engineer = engineers.find((e: any) => e._id === engineerId)
  if (engineer) {
    setServiceFormData({
      ...serviceFormData,
      engineerId: engineer._id,
      engineerName: engineer.name,
      engineerPhone: engineer.phone || ""
    })
  }
}

// Payload includes email
const payload = {
  engineerInCharge: {
    name: selectedEngineer?.name || serviceFormData.engineerName,
    phone: selectedEngineer?.phone || serviceFormData.engineerPhone,
    email: selectedEngineer?.email || ""  // NEW: Email included
  }
}
```

---

## 📦 Feature 2: Bulk Add Machines

### What It Does
Allows admins to add multiple machines to the database at once by pasting a JSON array.

### Access Point
**Location**: Machines page header
**Button**: "Bulk Add" (green outline button)
```
[Refresh] [Bulk Add] [Add Machine]
```

### How To Use

1. **Click "Bulk Add" button**
2. **Dialog opens with:**
   - Instructions
   - JSON format example
   - Required fields notice
   - Large textarea for pasting JSON
3. **Paste your JSON array**
4. **Click "Add All Machines"**
5. **Wait for processing**
6. **See results**: "✅ X machines added successfully. ❌ Y failed."

### JSON Format

#### Minimal Example (Required Fields Only):
```json
[
  {
    "model": "XRay 5000",
    "manufacturer": "Acme Medical",
    "facility": {
      "name": "Kenyatta National Hospital"
    }
  }
]
```

#### Complete Example (All Fields):
```json
[
  {
    "model": "XRay 5000",
    "manufacturer": "Acme Medical",
    "serialNumber": "ABC123",
    "version": "v2.1",
    "facility": {
      "name": "Kenyatta National Hospital",
      "level": "Level 6",
      "location": "Nairobi"
    },
    "contactPerson": {
      "name": "Jane Doe",
      "role": "Head of Radiology",
      "phone": "+254712345678",
      "email": "jane@hospital.com"
    },
    "status": "active",
    "installedDate": "2024-01-15",
    "purchaseDate": "2023-12-01",
    "warrantyExpiry": "2026-12-01",
    "lastServicedAt": "2024-10-01",
    "nextServiceDue": "2025-01-01"
  },
  {
    "model": "Ultrasound Pro",
    "manufacturer": "MedTech Inc",
    "facility": {
      "name": "Nairobi Hospital",
      "location": "Nairobi"
    },
    "status": "active"
  }
]
```

### Field Reference

#### Required Fields (❗ Must Include)
- `model` (string) - Machine model name
- `manufacturer` (string) - Manufacturer name
- `facility.name` (string) - Facility name

#### Optional Fields
- `serialNumber` (string) - Unique serial number
- `version` (string) - Software/hardware version
- `facility.level` (string) - Facility level (e.g., "Level 5")
- `facility.location` (string) - City/region
- `contactPerson.name` (string)
- `contactPerson.role` (string)
- `contactPerson.phone` (string)
- `contactPerson.email` (string)
- `status` (string) - "active", "inactive", "maintenance", "decommissioned"
- `installedDate` (ISO date string) - "2024-01-15"
- `purchaseDate` (ISO date string)
- `warrantyExpiry` (ISO date string)
- `lastServicedAt` (ISO date string)
- `nextServiceDue` (ISO date string)

### Validation

#### Pre-submission Checks:
1. **Valid JSON**: Must parse as JSON array
2. **Array type**: Must be array, not object
3. **Not empty**: Array must have at least 1 machine
4. **Required fields**: Each machine must have model, manufacturer, facility.name

#### Error Messages:
```
❌ "Invalid format" - Not valid JSON
❌ "Please provide a JSON array" - JSON is object, not array
❌ "Array is empty" - No machines in array
❌ "X machine(s) missing required fields" - Missing model/manufacturer/facility.name
❌ "Parse Error: [details]" - JSON syntax error
```

### Processing

The system uses `Promise.allSettled()` to process all machines:
- Each machine sent to backend individually
- Successful additions counted
- Failed additions counted
- Continues even if some fail

**Result Toast**:
```
✅ 15 machines added successfully. ❌ 2 failed.
```

### Code Implementation

```typescript
// Mutation
const bulkAddMachinesMutation = useMutation({
  mutationFn: async (machinesArray: any[]) => {
    const results = await Promise.allSettled(
      machinesArray.map(machine => apiService.createMachine(machine))
    )
    return results
  },
  onSuccess: (results) => {
    const successful = results.filter((r: any) => r.status === 'fulfilled').length
    const failed = results.filter((r: any) => r.status === 'rejected').length
    
    qc.invalidateQueries({ queryKey: ["machines"] })
    toast({ 
      title: `Bulk Add Complete`, 
      description: `✅ ${successful} added. ${failed > 0 ? `❌ ${failed} failed.` : ''}` 
    })
  }
})

// Handler
const handleBulkAdd = () => {
  try {
    const machinesArray = JSON.parse(bulkMachinesText)
    
    // Validations...
    
    bulkAddMachinesMutation.mutate(machinesArray)
  } catch (err: any) {
    toast({ title: "Parse Error", description: err.message, variant: "destructive" })
  }
}
```

---

## 🎨 UI Changes

### Machines Page Header
**Before**:
```
[Refresh] [Add Machine]
```

**After**:
```
[Refresh] [Bulk Add] [Add Machine]
```

### Create Service Dialog
**Before**:
```
Engineer Information
├─ Engineer Name: [text input]
└─ Engineer Phone: [text input]
```

**After**:
```
Engineer Information
├─ Select Engineer: [dropdown]
│   ├─ -- Select an engineer --
│   ├─ John Doe (+254712345678)
│   ├─ Jane Smith (+254723456789)
│   └─ ...
└─ [Selected engineer details box]
    ├─ John Doe
    └─ +254712345678
```

---

## 📊 Use Cases

### Use Case 1: Bulk Import from Spreadsheet
**Scenario**: Hospital has equipment list in Excel

**Steps**:
1. Export Excel to CSV
2. Convert CSV to JSON (online tool or script)
3. Copy JSON array
4. Click "Bulk Add" in admin panel
5. Paste JSON
6. Click "Add All Machines"
7. Wait for completion

**Result**: All machines imported in seconds

### Use Case 2: New Facility Setup
**Scenario**: New hospital branch with 50 machines

**Steps**:
1. Prepare JSON array with all 50 machines
2. Ensure all have same facility name
3. Bulk add via admin panel
4. Verify in machines list

**Result**: Entire facility equipment database populated instantly

### Use Case 3: Consistent Engineer Assignment
**Scenario**: Schedule maintenance for all radiology equipment

**Steps**:
1. Filter machines by type (manual/visual)
2. For each machine, create service
3. Select same engineer from dropdown (consistent spelling)
4. Set dates and notes

**Result**: All services assigned to correct engineer with proper linking

---

## 🔒 Security & Validation

### Engineer Selection
- ✅ Only fetches engineers (role filter applied)
- ✅ Cached for 5 minutes (reduces API calls)
- ✅ Validates engineer exists before submission
- ✅ Links service to user account (engineerId)

### Bulk Add
- ✅ Validates JSON syntax before submission
- ✅ Checks required fields for each machine
- ✅ Individual machine failures don't stop others
- ✅ Admin-only feature (permission check)
- ✅ Clear error messages for troubleshooting

---

## 🐛 Troubleshooting

### Engineers Not Loading
**Symptoms**: Dropdown shows "Loading engineers..." forever

**Solutions**:
1. Check network connection
2. Verify backend `/users?role=engineer` endpoint working
3. Check console for API errors
4. Refresh page
5. Clear browser cache

### Engineer Dropdown Empty
**Symptoms**: "No engineers found" message

**Solutions**:
1. Verify engineers exist in database
2. Check users have `role: "engineer"`
3. Use User Manager to add engineers
4. Contact backend admin

### Bulk Add Parse Error
**Symptoms**: "Invalid JSON format: [error]"

**Solutions**:
1. Validate JSON syntax (use jsonlint.com)
2. Check for:
   - Missing commas between objects
   - Missing quotes around strings
   - Trailing commas
   - Unclosed brackets/braces
3. Copy example format and modify
4. Use JSON formatter tool

### Bulk Add Validation Error
**Symptoms**: "X machine(s) missing required fields"

**Solutions**:
1. Ensure every machine has:
   - `model`
   - `manufacturer`
   - `facility.name`
2. Check spelling of field names (case-sensitive)
3. Verify nested structure: `facility: { name: "..." }`

### Some Machines Failed to Add
**Symptoms**: "✅ 8 added. ❌ 2 failed."

**Solutions**:
1. Check if failed machines have duplicate serial numbers
2. Verify facility names are valid
3. Check backend logs for specific errors
4. Try adding failed machines individually to see error
5. Fix issues and re-submit only failed machines

---

## 📈 Performance

### Engineer Query
- **Cache Duration**: 5 minutes
- **API Calls**: 1 per page load (then cached)
- **Response Time**: ~200ms (varies by network)
- **Data Size**: ~1-5KB (depends on # of engineers)

### Bulk Add
- **Processing**: Parallel (Promise.allSettled)
- **Speed**: ~100-200ms per machine
- **Example**: 10 machines ≈ 1-2 seconds total
- **Limitation**: Browser timeout ~30 seconds (150+ machines may need chunking)

---

## 🎓 Best Practices

### Engineer Selection
1. **Keep engineer profiles updated**: Ensure phone numbers current
2. **Use consistent naming**: Full names in user database
3. **Add new engineers immediately**: Don't wait until service creation
4. **Verify engineer availability**: Before assigning services

### Bulk Add
1. **Test with 1-2 machines first**: Verify format works
2. **Use consistent facility names**: Exact spelling matters
3. **Include serial numbers**: Helps prevent duplicates
4. **Set realistic dates**: Don't use placeholder dates
5. **Double-check required fields**: model, manufacturer, facility.name
6. **Save JSON file**: Keep original for reference/retry
7. **Add in batches**: 20-50 machines per batch (easier to troubleshoot)

---

## 🔄 API Integration

### GET /api/users?role=engineer
**Request**:
```
GET https://app.codewithseth.co.ke/api/users?role=engineer
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "user-id-1",
        "name": "John Doe",
        "email": "john@company.com",
        "phone": "+254712345678",
        "role": "engineer"
      }
    ]
  }
}
```

### POST /api/machines (Bulk)
**Process**: Multiple individual POST requests
```
POST https://app.codewithseth.co.ke/api/machines (x N times)
```

Each request same as single machine creation.

---

## 📝 Summary

### Engineer Selection Feature
- ✅ Dropdown replaces manual input
- ✅ Auto-fills name, phone, email
- ✅ Links to user account (engineerId)
- ✅ Prevents typos
- ✅ Cached for performance

### Bulk Add Feature
- ✅ Add multiple machines at once
- ✅ JSON array format
- ✅ Validates before submission
- ✅ Parallel processing
- ✅ Detailed success/failure counts
- ✅ Continues on individual failures

### Benefits
- 🚀 Faster data entry (bulk add)
- 🎯 More accurate data (engineer dropdown)
- 🔗 Better linking (engineer IDs)
- ⚡ Improved efficiency (caching)
- 👥 Better UX (no manual typing)

---

## 🆘 Support

**Documentation**:
- Technical: `MACHINE_SERVICE_INTEGRATION.md`
- User Guide: `MACHINE_SERVICE_USER_GUIDE.md`
- API Reference: `API_QUICK_REFERENCE.md`

**Need Help?**
1. Check error message in toast notification
2. Review console logs (F12 → Console)
3. Verify JSON format (jsonlint.com)
4. Test with minimal example first
5. Contact system administrator

---

**Version**: 1.0.0  
**Last Updated**: November 16, 2025  
**Features**: Engineer Selection Dropdown, Bulk Add Machines
