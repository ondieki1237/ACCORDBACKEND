# ACCORD App Update System

**Date:** February 5, 2026  
**Status:** Frontend Complete | Backend Implementation Required

---

## Overview

The ACCORD mobile app checks for updates from the backend server and downloads/installs new APK versions directly within the app.

---

## Update Flow

```
┌─────────────────┐     GET /api/app/update      ┌─────────────────┐
│   ACCORD App    │ ─────────────────────────────▶│    Backend      │
│   (Frontend)    │                               │    Server       │
└────────┬────────┘                               └────────┬────────┘
         │                                                 │
         │◀────────── JSON: version, downloadUrl ──────────│
         │                                                 │
    ┌────▼────┐                                            │
    │ Compare │                                            │
    │ versions│                                            │
    └────┬────┘                                            │
         │                                                 │
    (if new version)                                       │
         │                                                 │
         │         GET /downloads/app-debug.apk           │
         │────────────────────────────────────────────────▶│
         │                                                 │
         │◀──────────── APK Binary Stream ─────────────────│
         │                                                 │
    ┌────▼────┐                                            
    │ Download│                                            
    │ & Save  │                                            
    └────┬────┘                                            
         │                                                 
    ┌────▼────┐                                            
    │ Install │                                            
    │   APK   │                                            
    └─────────┘                                            
```

---

## Backend API Requirements

### 1. Version Check Endpoint

**Endpoint:** `GET /api/app/update`

**Response:**
```json
{
  "version": "1.2.0",
  "downloadUrl": "https://app.codewithseth.co.ke/downloads/app-debug.apk",
  "releaseNotes": "Bug fixes and performance improvements"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | ✅ | Semantic version (e.g., "1.2.0") |
| `downloadUrl` | string | ✅ | Full URL to download the APK |
| `releaseNotes` | string | ❌ | Optional changelog text |

### 2. APK Download Endpoint

**Endpoint:** `GET /downloads/app-debug.apk`

**Requirements:**
- Serve the APK file with proper headers
- Support `Content-Length` header (required for progress tracking)
- Content-Type: `application/vnd.android.package-archive`

**Example Response Headers:**
```
Content-Type: application/vnd.android.package-archive
Content-Length: 15728640
Content-Disposition: attachment; filename="app-debug.apk"
```

---

## Frontend Implementation

### Components

| File | Purpose |
|------|---------|
| `components/update/UpdateChecker.tsx` | Main update UI component |
| `android/.../AppUpdaterPlugin.java` | Native APK installer plugin |

### Update Check Trigger

- Runs on app startup (inside `MobileLayout`)
- Compares backend version with `APP_VERSION` constant
- Shows update dialog if new version available

### Download Process

1. Fetch APK with progress tracking via `ReadableStream`
2. Save to device cache using `@capacitor/filesystem`
3. Trigger native Android installer via custom plugin

### Version Tracking

- `localStorage` stores the last applied version
- Prevents re-prompting after user dismisses or installs update

---

## Backend Implementation Guide

### Node.js/Express Example

```javascript
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Current app version - update this when releasing new APK
const CURRENT_VERSION = '1.2.0';

// Version check endpoint
app.get('/api/app/update', (req, res) => {
  res.json({
    version: CURRENT_VERSION,
    downloadUrl: 'https://app.codewithseth.co.ke/downloads/app-debug.apk',
    releaseNotes: 'Latest improvements and bug fixes'
  });
});

// APK download endpoint
app.get('/downloads/app-debug.apk', (req, res) => {
  const apkPath = path.join(__dirname, 'releases', 'app-debug.apk');
  
  const stat = fs.statSync(apkPath);
  
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Disposition', 'attachment; filename="app-debug.apk"');
  
  fs.createReadStream(apkPath).pipe(res);
});
```

### Directory Structure

```
backend/
├── releases/
│   └── app-debug.apk    ← Place new APK here
├── server.js
└── ...
```

---

## Deployment Checklist

### Backend
- [ ] Create `/api/app/update` endpoint
- [ ] Serve APK at `/downloads/app-debug.apk`
- [ ] Include `Content-Length` header for progress tracking
- [ ] Update version number when releasing new APK

### Release Process
1. Build new APK: `./build-apk.sh`
2. Upload APK to backend `/releases/` folder
3. Update `CURRENT_VERSION` in backend
4. Users will see update prompt on next app launch

---

## Android Permissions

The app requests these permissions for APK installation:

```xml
<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
```

On Android 8+, users must grant "Install from unknown sources" permission for the app.

---

## Testing

1. Set backend version higher than app's `APP_VERSION`
2. Launch app → Update dialog appears
3. Tap "Update Now" → Download progress shows
4. After download → Android installer opens
5. Install completes → App restarts with new version
