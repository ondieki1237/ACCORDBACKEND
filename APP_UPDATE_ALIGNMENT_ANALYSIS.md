# App Update System Analysis - Alignment Check

**Date:** February 5, 2026  
**Status:** ✅ ALIGNED with minor field name differences

---

## Current Implementation vs. Frontend Requirements

### ✅ Endpoint: `/api/app/update` 
**Status:** ALREADY IMPLEMENTED

Current location: `src/server.js` (lines 115-137)

**Current Response Structure:**
```json
{
  "versionCode": 120,
  "versionName": "1.2.0",
  "apkUrl": "https://app.codewithseth.co.ke/downloads/app-release.apk",
  "forceUpdate": false,
  "changelog": "Bug fixes and improvements"
}
```

**Expected Response Structure (from summaryupdate.md):**
```json
{
  "version": "1.2.0",
  "downloadUrl": "https://app.codewithseth.co.ke/downloads/app-debug.apk",
  "releaseNotes": "Bug fixes and performance improvements"
}
```

---

## Issues Found & Resolution

### 🔴 Issue 1: Field Name Mismatch
| Current | Expected | Impact |
|---------|----------|--------|
| `versionName` | `version` | Frontend expects `version`, gets `versionName` |
| `apkUrl` | `downloadUrl` | Frontend expects `downloadUrl`, gets `apkUrl` |
| `changelog` | `releaseNotes` | Frontend expects `releaseNotes`, gets `changelog` |

**Solution:** Update response fields to match frontend expectations

### 🟡 Issue 2: Extra Fields Not Expected
| Field | Current | Expected | Action |
|-------|---------|----------|--------|
| `versionCode` | ✅ Present | ❌ Not expected | Remove or keep (frontend won't use) |
| `forceUpdate` | ✅ Present | ❌ Not expected | Remove or keep (frontend won't use) |

**Solution:** These fields won't break frontend, but response is bloated

### 🟢 Issue 3: APK Download Path
| Aspect | Status | Details |
|--------|--------|---------|
| `/downloads` route | ✅ Working | Serves static files correctly |
| Default APK path | ⚠️ Uses `app-release.apk` | summaryupdate.md expects `app-debug.apk` |
| Environment variable | ✅ Configurable | Uses `APK_PATH` env var |

**Solution:** Either update environment variable or keep current (configurable)

---

## Recommendations

### ✅ Backend Changes (IMPLEMENT)

**Option 1: Update Response Fields (Recommended)**
```javascript
// Change lines 131-136 in src/server.js
return res.json({
  version: versionName,           // Renamed from versionName
  downloadUrl: apkUrl,            // Renamed from apkUrl
  releaseNotes: changelog         // Renamed from changelog
  // Removed: versionCode, forceUpdate (not expected by frontend)
});
```

**Option 2: Keep Backward Compatibility**
```javascript
// Add new simplified response route alongside old one
app.get('/api/app/update', (req, res) => {
  // ... code ...
  return res.json({
    version: versionName,
    downloadUrl: apkUrl,
    releaseNotes: changelog
  });
});
```

### ⚠️ Frontend Issues to Note

1. **APK File Naming:** summaryupdate.md shows `app-debug.apk` but backend defaults to `app-release.apk`
   - **Action:** Frontend should request `/downloads/app-release.apk` OR
   - **Action:** Set `APK_PATH=/downloads/app-debug.apk` in environment variables

2. **Progress Tracking:** Frontend uses `ReadableStream` to track download progress
   - **Current:** `/downloads` route serves static files (no custom progress headers)
   - **Status:** ✅ Works fine - express.static supports `Content-Length` header automatically

3. **Content-Type Header:** Frontend expects `application/vnd.android.package-archive`
   - **Current:** express.static serves with correct MIME type automatically
   - **Status:** ✅ No action needed

---

## Files Affected

### Backend (Node.js)
- **File:** `src/server.js`
- **Lines:** 115-137 (the `/app/update` endpoint)
- **Changes Needed:** Rename response fields

### Frontend
- **Files:** `components/update/UpdateChecker.tsx`
- **Expected Response:** `version`, `downloadUrl`, `releaseNotes`
- **Status:** Check if frontend is using correct field names

---

## Implementation Plan

### Step 1: Update Backend Response (5 minutes)
```javascript
// src/server.js lines 131-136
return res.json({
  version: versionName,           // ✅ Frontend expects this
  downloadUrl: apkUrl,            // ✅ Frontend expects this
  releaseNotes: changelog         // ✅ Frontend expects this
});
```

### Step 2: Verify Downloads Folder
```bash
# Check if downloads folder exists
ls -la /home/seth/Documents/deployed/ACCORDBACKEND/downloads/

# Check for APK files
ls -la /home/seth/Documents/deployed/ACCORDBACKEND/downloads/*.apk
```

### Step 3: Set Environment Variables
```bash
# In your .env file:
APK_PATH=/downloads/app-debug.apk    # or app-release.apk
VERSION_NAME=1.2.0
CHANGELOG=Bug fixes and performance improvements
```

### Step 4: Test Endpoints
```bash
# Test the endpoint
curl https://app.codewithseth.co.ke/api/app/update

# Should return:
# {
#   "version": "1.2.0",
#   "downloadUrl": "https://app.codewithseth.co.ke/downloads/app-debug.apk",
#   "releaseNotes": "Bug fixes and performance improvements"
# }

# Test APK download
curl -I https://app.codewithseth.co.ke/downloads/app-debug.apk
# Should show: Content-Type: application/vnd.android.package-archive
```

---

## Summary

| Component | Status | Action |
|-----------|--------|--------|
| **Endpoint exists** | ✅ | No changes needed - `/api/app/update` already implemented |
| **Response structure** | ⚠️ | **IMPLEMENT:** Rename fields to match frontend expectations |
| **APK download route** | ✅ | No changes needed - `/downloads` works correctly |
| **Environment config** | ✅ | Verify APK_PATH, VERSION_NAME, CHANGELOG are set |
| **Frontend compatibility** | ⚠️ | **CHECK:** Verify frontend uses correct field names (version, downloadUrl, releaseNotes) |

---

## Next Steps

**Immediate (Backend):**
1. Update response fields in `/app/update` endpoint
2. Test endpoint returns correct field names
3. Verify APK file exists in `/downloads` folder
4. Commit changes

**Coordination (Frontend):**
1. Confirm frontend UpdateChecker.tsx is looking for: `version`, `downloadUrl`, `releaseNotes`
2. If using old field names: update frontend to use new names
3. Test end-to-end: app checks version → downloads APK → installs

---

**Status:** Ready for implementation ✅
