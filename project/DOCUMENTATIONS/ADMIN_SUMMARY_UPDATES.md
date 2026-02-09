# Admin Dashboard Backend Updates Summary

**Version:** 1.2.4  
**Last Updated:** February 9, 2026

---

## 📋 Table of Contents

1. [Visit Purpose Types](#1-visit-purpose-types)
2. [Visit Outcome Types](#2-visit-outcome-types)
3. [Visit Validation Improvements](#3-visit-validation-improvements)
4. [App Update System (OTA)](#4-app-update-system-ota)
5. [API Reference](#5-api-reference)

---

## 1. Visit Purpose Types

### New Visit Purposes Added

The following visit purposes have been added to support expanded sales workflows:

| Purpose | Value | Description |
|---------|-------|-------------|
| Telesales | `telesales` | Remote sales calls/activities |
| Quotation Follow-up | `quotation_followup` | Following up on sent quotations |
| Company Introduction | `company_introduction` | Introducing company to new prospects |
| Debt Collection | `debt_collection` | Following up on outstanding payments |

### Complete List of Visit Purposes

```javascript
[
  'demo',                    // Product demonstration
  'followup',               // General follow-up visit
  'installation',           // Equipment installation
  'maintenance',            // Maintenance/service visit
  'consultation',           // Consulting visit
  'sales',                  // Sales pitch/meeting
  'complaint',              // Handling complaints
  'other',                  // Other purposes
  'telesales',              // NEW: Remote sales
  'quotation_followup',     // NEW: Quote follow-up
  'company_introduction',   // NEW: Company intro
  'debt_collection'         // NEW: Payment collection
]
```

### Affected Files
- `src/models/Visit.js` - Schema enum updated
- `src/middleware/validation.js` - Validation rules updated

---

## 2. Visit Outcome Types

### Available Visit Outcomes

| Outcome | Value | Icon Suggestion |
|---------|-------|-----------------|
| Successful | `successful` | ✅ |
| Pending | `pending` | ⏳ |
| Follow-up Required | `followup_required` | 🔁 |
| No Interest | `no_interest` | 🚫 |
| No Access | `no_access` | 🔒 |

### Note
`no_access` is available in the backend but may not be in all frontend implementations. Consider adding it to admin dashboard dropdowns.

---

## 3. Visit Validation Improvements

### Empty String Handling

The backend now properly handles empty strings in visit forms:

#### For Visit Updates (PUT /api/visits/:id)
- **visitOutcome**: Empty string → preserves existing value
- **visitPurpose**: Empty string → preserves existing value
- **client.level**: Empty string → preserves existing value
- **client.type**: Empty string → preserves existing value

#### Client Object Merging
When editing a visit, the backend now intelligently merges the client object instead of replacing it entirely. This prevents data loss when only updating specific fields.

**Before (problematic):**
```javascript
// Sending partial update would lose other fields
{ client: { name: "New Name" } }
// Result: client.type and client.level would be lost
```

**After (fixed):**
```javascript
// Partial updates preserve existing fields
{ client: { name: "New Name" } }
// Result: client.type and client.level are preserved
```

---

## 4. App Update System (OTA)

### Check for Updates Endpoint

**GET** `/api/app-updates/check`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| currentVersion | string | Yes | Current app version (e.g., "1.2.3") |
| platform | string | Yes | "android" or "ios" |
| role | string | No | User role (default: "sales") |

**Response:**
```json
{
  "success": true,
  "hasUpdate": true,
  "latestVersion": "1.2.4",
  "mandatory": false,
  "downloadUrl": "https://app.codewithseth.co.ke/downloads/app-debug.apk",
  "releaseNotes": "Bug fixes and performance improvements"
}
```

### APK Download Endpoint

**GET** `/downloads/app-debug.apk`

Returns the APK file with proper Android headers:
- `Content-Type: application/vnd.android.package-archive`
- `Content-Disposition: attachment; filename="app-debug.apk"`
- `Accept-Ranges: bytes`

### Version Management

**Current Version:** 1.2.4

To update the version:
```bash
cd /home/seth/Documents/deployed/ACCORDBACKEND/project
# Update .env and package.json, then sync
sed -i 's/VERSION_NAME=X.X.X/VERSION_NAME=Y.Y.Y/' .env
sed -i 's/"version": "X.X.X"/"version": "Y.Y.Y"/' package.json
node src/scripts/sync-version-update.js
```

---

## 5. API Reference

### Visits API

#### Create Visit
**POST** `/api/visits`

**Required Fields:**
```json
{
  "date": "2026-02-09",
  "startTime": "2026-02-09T09:00:00.000Z",
  "client": {
    "name": "Hospital Name",
    "type": "hospital",  // hospital|clinic|pharmacy|lab|imaging_center|other
    "location": "Nairobi, Kenya"
  },
  "visitPurpose": "sales"  // See full list above
}
```

**Optional Fields:**
```json
{
  "endTime": "2026-02-09T10:00:00.000Z",
  "client": {
    "level": "4"  // 1|2|3|4|5|6|not_applicable
  },
  "visitOutcome": "successful",
  "contacts": [...],
  "productsOfInterest": [...],
  "requestedEquipment": [...],
  "notes": "Additional notes",
  "customData": "Custom JSON string"
}
```

#### Update Visit
**PUT** `/api/visits/:id`

- Partial updates supported
- Empty strings for enum fields are ignored (preserves existing)
- Client object is merged, not replaced

#### Get Visits
**GET** `/api/visits`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 1000) |
| startDate | date | Filter by start date |
| endDate | date | Filter by end date |
| userId | ObjectId | Filter by user |
| clientType | string | Filter by client type |
| visitOutcome | string | Filter by outcome |
| region | string | Filter by region |
| search | string | Search in client name |

---

## 📊 Admin Dashboard Integration Notes

### Visit Analytics
When building visit analytics, consider grouping by:
- **Visit Purpose**: Include new purposes in pie charts/reports
- **Visit Outcome**: Track success rates
- **Facility Level**: Hospital tier analysis

### Filters
Update any dropdown filters to include:
- New visit purposes (telesales, quotation_followup, company_introduction, debt_collection)
- All visit outcomes including `no_access`

### Reports
For sales reports, consider:
- Telesales vs in-person visit comparisons
- Quotation follow-up success rates
- Debt collection visit effectiveness

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.2.4 | 2026-02-09 | Pending visits clear button support, validation fixes |
| 1.2.3 | 2026-02-07 | Visit edit validation improvements |
| 1.2.2 | 2026-02-05 | Added new visit purposes, OTA update system |
| 1.2.1 | 2026-02-04 | App update API fixes |
| 1.2.0 | 2026-02-03 | Initial OTA implementation |

---

## 📞 Support

For backend issues or API questions, check:
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`
- Health check: `GET /api/health`
