# App Update System - Internal Updates (No External Download)

**Updated:** February 3, 2026  
**Status:** ✅ Implemented

---

## Overview

The app now uses an **internal update mechanism** where the app receives update data directly from the API and applies changes internally, without requiring external file downloads. This is better for mobile apps as it:

- ✅ Updates happen instantly without downloading APKs
- ✅ No external dependencies or download URLs needed
- ✅ App applies patches internally
- ✅ Reduced bandwidth and faster updates
- ✅ Better control and security

---

## How It Works

### 1. App Checks for Updates

**Request (from mobile app):**
```bash
POST /api/app-updates/check
{
  "role": "sales",           # Required: 'sales' or 'engineer'
  "platform": "android",     # Required: 'android', 'ios', or 'web'
  "currentVersion": "1.0.0"  # Optional: current app version
}
```

**Response (from server):**
```json
{
  "success": true,
  "updateAvailable": true,
  "update": {
    "_id": "507f1f77bcf86cd799439011",
    "version": "1.1.0",
    "platform": "android",
    "targetRoles": ["sales"],
    "releaseNotes": "Bug fixes and new features",
    
    "internalUpdate": true,
    "updateMethod": "internal",
    "bundledCode": null,
    "updateInstructions": "Please restart the app to apply updates",
    
    "forced": false,
    "isActive": true,
    "requiresRestart": true,
    "timestamp": "2026-02-03T12:00:00Z",
    
    // Fallback (if needed)
    "downloadUrl": null
  }
}
```

### 2. App Applies Update

The app receives the update data and:

```javascript
// Pseudocode for app side
if (response.update.updateAvailable) {
  if (response.update.internalUpdate) {
    // Apply internal update
    if (response.update.updateMethod === 'internal') {
      // Option 1: Just restart the app
      if (response.update.requiresRestart) {
        showMessage("Restart app to apply updates");
        // App will load new version on restart
      }
      
      // Option 2: Apply bundled code if provided
      if (response.update.bundledCode) {
        applyJavaScriptPatch(response.update.bundledCode);
      }
    }
  } else if (response.update.downloadUrl) {
    // Fallback: Download external APK if needed
    downloadAndInstall(response.update.downloadUrl);
  }
  
  if (response.update.forced) {
    // Blocking modal - user must update
    showBlockingUpdateModal(response.update);
  }
}
```

---

## Creating/Managing Updates

### Admin: Create a New Internal Update

**Request:**
```bash
curl -X POST https://app.codewithseth.co.ke/api/app-updates \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.1.0",
    "platform": "android",
    "targetRoles": ["sales"],
    "releaseNotes": "- Bug fixes\n- Performance improvements",
    
    "updateMethod": "internal",
    "bundledCode": null,
    "updateInstructions": "Restart the app to apply updates",
    
    "forced": false,
    "isActive": true,
    "requiresRestart": true,
    "changeLog": "Fixed login issue, improved reporting UI"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "version": "1.1.0",
    // ... update details
  }
}
```

### Admin: Create an Update with Bundled Code

```bash
curl -X POST https://app.codewithseth.co.ke/api/app-updates \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.1.1",
    "platform": "android",
    "targetRoles": ["sales"],
    "releaseNotes": "Quick patch for reporting",
    
    "updateMethod": "internal",
    "bundledCode": "function applyPatch() { /* patch code here */ }",
    "updateInstructions": "Update will be applied automatically",
    
    "forced": false,
    "isActive": true,
    "requiresRestart": false,
    "compatibleVersions": ["1.0.0", "1.1.0"]
  }'
```

---

## Update Strategies

### Strategy 1: Internal Update (App Restart Required)

Best for: Major features, UI changes, security updates

```json
{
  "updateMethod": "internal",
  "bundledCode": null,
  "requiresRestart": true,
  "forced": false,
  "updateInstructions": "Restart the app to apply updates"
}
```

**App behavior:**
- Shows notification
- User restarts app
- App loads new version from server
- Update applied

### Strategy 2: Internal Update (With Bundled Code)

Best for: Small patches, bug fixes that don't require restart

```json
{
  "updateMethod": "internal",
  "bundledCode": "function patchReportingBug() { /* fix code */ }",
  "requiresRestart": false,
  "forced": false,
  "updateInstructions": "Update applied automatically"
}
```

**App behavior:**
- Receives bundled JavaScript code
- Executes it immediately
- No restart needed
- Changes apply instantly

### Strategy 3: Forced Update

Best for: Critical security patches

```json
{
  "updateMethod": "internal",
  "bundledCode": null,
  "requiresRestart": true,
  "forced": true,
  "updateInstructions": "This update is required for security reasons"
}
```

**App behavior:**
- Shows blocking modal
- User cannot bypass update
- App must be updated to continue

### Strategy 4: Fallback to External Download

Best for: When internal updates aren't available

```json
{
  "updateMethod": "external",
  "downloadUrl": "https://app.codewithseth.co.ke/downloads/app-release-1.1.0.apk",
  "requiresRestart": true,
  "forced": false
}
```

---

## API Endpoints

### Public Endpoints

#### Check for Update
```
POST /api/app-updates/check
GET /api/app-updates/check
```

**Required Parameters:**
- `role` (string): `sales` or `engineer`
- `platform` (string): `android`, `ios`, or `web`
- `currentVersion` (string, optional): Current app version

**Response:**
```json
{
  "success": true,
  "updateAvailable": true/false,
  "update": { /* update details if available */ }
}
```

---

### Admin Endpoints (Protected)

#### List All Updates
```
GET /api/app-updates
```

#### Get Specific Update
```
GET /api/app-updates/:id
```

#### Create New Update
```
POST /api/app-updates
Body: { version, platform, targetRoles, releaseNotes, updateMethod, ... }
```

#### Update an Update
```
PUT /api/app-updates/:id
Body: { version, releaseNotes, isActive, ... }
```

#### Delete Update
```
DELETE /api/app-updates/:id
```

---

## Response Format

### Update Available
```json
{
  "success": true,
  "updateAvailable": true,
  "update": {
    "_id": "507f1f77bcf86cd799439011",
    "version": "1.1.0",
    "platform": "android",
    "targetRoles": ["sales"],
    "releaseNotes": "New features and bug fixes",
    
    "internalUpdate": true,
    "updateMethod": "internal",
    "bundledCode": null,
    "updateInstructions": "Restart the app to apply updates",
    
    "forced": false,
    "isActive": true,
    "requiresRestart": true,
    
    "createdAt": "2026-02-03T10:00:00Z",
    "timestamp": "2026-02-03T12:00:00Z"
  }
}
```

### No Update Available
```json
{
  "success": true,
  "updateAvailable": false
}
```

### Error
```json
{
  "success": false,
  "message": "role and platform are required"
}
```

---

## Mobile App Implementation

### React Native Example

```javascript
import React, { useEffect, useState } from 'react';
import { Alert, AppState } from 'react-native';

const AppUpdateCheck = () => {
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    // Check for updates when app starts
    checkForUpdate();

    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextAppState) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground, check for updates
      await checkForUpdate();
    }
    setAppState(nextAppState);
  };

  const checkForUpdate = async () => {
    try {
      const response = await fetch('https://app.codewithseth.co.ke/api/app-updates/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: userRole, // 'sales' or 'engineer'
          platform: Platform.OS, // 'android' or 'ios'
          currentVersion: APP_VERSION // '1.0.0'
        })
      });

      const data = await response.json();

      if (data.success && data.updateAvailable) {
        const update = data.update;

        if (update.forced) {
          // Blocking modal
          showBlockingUpdateModal(update);
        } else {
          // Optional update - can dismiss
          showUpdatePrompt(update);
        }
      }
    } catch (error) {
      console.error('Update check failed:', error);
    }
  };

  const showUpdatePrompt = (update) => {
    Alert.alert(
      'Update Available',
      `Version ${update.version} is available.\n\n${update.releaseNotes}`,
      [
        {
          text: 'Remind Later',
          onPress: () => {
            // Remind in 24 hours
            scheduleReminder(24 * 60);
          }
        },
        {
          text: 'Update Now',
          onPress: async () => {
            if (update.internalUpdate) {
              if (update.requiresRestart) {
                Alert.alert('Restart Required', 'Please restart the app to apply updates.');
                // App will load new version on next launch
              } else if (update.bundledCode) {
                // Apply JavaScript patch
                applyPatch(update.bundledCode);
              }
            }
          },
          style: 'default'
        }
      ]
    );
  };

  const showBlockingUpdateModal = (update) => {
    Alert.alert(
      'Update Required',
      `${update.updateInstructions}\n\nVersion: ${update.version}`,
      [
        {
          text: 'Update Now',
          onPress: () => {
            if (update.internalUpdate && update.requiresRestart) {
              Alert.alert('Restart Required', 'Please restart the app to apply this critical update.');
            }
          }
        }
      ],
      { cancelable: false }
    );
  };

  return null; // Component just handles updates, renders nothing
};

export default AppUpdateCheck;
```

---

## Best Practices

### ✅ DO:

1. **Use internal updates by default** - No external downloads needed
2. **Set forced=true for security patches** - Critical updates must be applied
3. **Include release notes** - Tell users what changed
4. **Test before activating** - Set isActive=false initially
5. **Version correctly** - Use semantic versioning (1.0.0)
6. **Set requiresRestart appropriately** - true for most updates
7. **Provide clear instructions** - Users should understand what's happening
8. **Monitor rollout** - Check logs for update adoption

### ❌ DON'T:

1. Don't use external downloads unless necessary
2. Don't force updates too often
3. Don't skip release notes
4. Don't activate updates without testing
5. Don't use inconsistent versioning

---

## Database Model

```javascript
{
  version: String,              // e.g., "1.1.0"
  platform: String,             // 'android', 'ios', 'web'
  targetRoles: [String],        // ['sales'], ['engineer'], or ['all']
  
  releaseNotes: String,         // What changed
  changeLog: String,            // Detailed changelog
  
  updateMethod: String,         // 'internal' or 'external'
  bundledCode: String,          // Optional JavaScript patches
  updateInstructions: String,   // Instructions for user
  
  downloadUrl: String,          // Fallback URL if needed
  compatibleVersions: [String], // Versions this update works with
  
  forced: Boolean,              // User must update
  isActive: Boolean,            // Is this update visible
  requiresRestart: Boolean,     // App needs to restart
  
  createdBy: ObjectId,          // Admin who created it
  createdAt: Date,
  updatedAt: Date
}
```

---

## Testing

### Using Postman

```bash
# Check for update
POST https://app.codewithseth.co.ke/api/app-updates/check
Content-Type: application/json

{
  "role": "sales",
  "platform": "android",
  "currentVersion": "1.0.0"
}
```

### Using curl

```bash
curl -X POST https://app.codewithseth.co.ke/api/app-updates/check \
  -H "Content-Type: application/json" \
  -d '{
    "role": "sales",
    "platform": "android",
    "currentVersion": "1.0.0"
  }'
```

---

## Troubleshooting

### App doesn't check for updates
- Verify role and platform are sent correctly
- Check network connectivity
- Review server logs

### Update not showing
- Ensure isActive=true
- Check targetRoles includes user's role
- Verify platform matches

### Downloads route not found
- The downloads endpoint is now static file serving
- Place APK files in `/project/downloads/`
- Access at `https://app.codewithseth.co.ke/downloads/filename`

---

## Files Modified

- ✅ `src/models/AppUpdate.js` - Enhanced schema with internal update fields
- ✅ `src/controllers/appUpdateController.js` - Updated checkForUpdate with internal mechanism
- ✅ `src/server.js` - Fixed downloads route with absolute path

---

## Status

✅ **Internal update system implemented**  
✅ **No external downloads required**  
✅ **App can update internally without APK downloads**  
✅ **Backward compatible with external downloads if needed**  

You can now create app updates that the app will apply internally!
