# Mobile App Auto-Update API

## Overview
This API allows the Accord Medical mobile app to check for updates and download new versions automatically.

---

## Endpoints

### 1. Check for Updates

**Endpoint:** `GET /api/app/version`  
**Access:** Public (no authentication required)

**Query Parameters:**
```javascript
{
  platform: String,      // Required: 'android' or 'ios'
  currentVersion: String // Optional: Current app version (e.g., '1.0.0')
}
```

**Example Request:**
```bash
GET https://app.codewithseth.co.ke/api/app/version?platform=android&currentVersion=1.0.0
```

**Response:**
```javascript
{
  success: true,
  data: {
    version: "1.0.1",
    buildNumber: 2,
    downloadUrl: "https://app.codewithseth.co.ke/downloads/accord-medical-v1.0.1.apk",
    changelog: "Bug fixes and performance improvements",
    forceUpdate: false,
    updateAvailable: true,
    minSupportedVersion: "1.0.0"
  }
}
```

**Response Fields:**
- `version` - Latest app version available
- `buildNumber` - Build number of the latest version
- `downloadUrl` - Direct download URL for the APK/IPA file
- `changelog` - Description of changes in this version
- `forceUpdate` - If true, user MUST update to continue using the app
- `updateAvailable` - Whether an update is available for the current version
- `minSupportedVersion` - Oldest version that still works

---

### 2. Get Full Changelog

**Endpoint:** `GET /api/app/changelog`  
**Access:** Public

**Example Request:**
```bash
GET https://app.codewithseth.co.ke/api/app/changelog
```

**Response:**
```javascript
{
  success: true,
  data: {
    android: [
      {
        version: "1.0.1",
        buildNumber: 2,
        releaseDate: "2025-11-01",
        changes: [
          "Fixed location tracking bug",
          "Improved report submission",
          "Performance optimizations"
        ]
      },
      {
        version: "1.0.0",
        buildNumber: 1,
        releaseDate: "2025-10-30",
        changes: [
          "Initial release",
          "Visit tracking with location",
          "Report submission"
        ]
      }
    ],
    ios: [
      // ... iOS changelog
    ]
  }
}
```

---

## Frontend Implementation

### TypeScript AppUpdater Class

```typescript
// lib/app-updater.ts
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

interface UpdateInfo {
  version: string;
  downloadUrl: string;
  changelog: string;
  forceUpdate: boolean;
  updateAvailable: boolean;
}

export class AppUpdater {
  private static UPDATE_CHECK_URL = 'https://app.codewithseth.co.ke/api/app/version';
 
  static async checkForUpdates(): Promise<UpdateInfo | null> {
    if (!Capacitor.isNativePlatform()) return null;
   
    try {
      // Get current app version
      const appInfo = await App.getInfo();
      const currentVersion = appInfo.version;
      const platform = Capacitor.getPlatform(); // 'android' or 'ios'
     
      // Check backend for latest version
      const response = await fetch(
        `${this.UPDATE_CHECK_URL}?platform=${platform}&currentVersion=${currentVersion}`
      );
      const result = await response.json();
     
      if (result.success && result.data.updateAvailable) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Update check failed:', error);
      return null;
    }
  }
 
  static async downloadAndInstall(downloadUrl: string) {
    // Open download URL - Android will handle installation
    // For iOS, this opens the App Store
    window.open(downloadUrl, '_system');
  }
}
```

### React Hook Usage

```typescript
// hooks/useAppUpdater.ts
import { useEffect, useState } from 'react';
import { AppUpdater } from '@/lib/app-updater';

export function useAppUpdater() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkForUpdates = async () => {
    setChecking(true);
    try {
      const info = await AppUpdater.checkForUpdates();
      setUpdateInfo(info);
    } catch (error) {
      console.error('Update check error:', error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Check for updates on app launch
    checkForUpdates();
    
    // Check daily
    const interval = setInterval(checkForUpdates, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    updateInfo,
    checking,
    checkForUpdates,
    downloadAndInstall: AppUpdater.downloadAndInstall
  };
}
```

### UI Component

```tsx
// components/UpdateDialog.tsx
import { useAppUpdater } from '@/hooks/useAppUpdater';

export function UpdateDialog() {
  const { updateInfo, downloadAndInstall } = useAppUpdater();

  if (!updateInfo) return null;

  return (
    <Dialog open={!!updateInfo}>
      <DialogContent>
        <DialogTitle>
          {updateInfo.forceUpdate ? 'Update Required' : 'Update Available'}
        </DialogTitle>
        <DialogDescription>
          <p>Version {updateInfo.version} is now available.</p>
          <p className="mt-2">{updateInfo.changelog}</p>
        </DialogDescription>
        <DialogActions>
          {!updateInfo.forceUpdate && (
            <Button onClick={() => setUpdateInfo(null)}>Later</Button>
          )}
          <Button 
            onClick={() => downloadAndInstall(updateInfo.downloadUrl)}
            variant="primary"
          >
            {updateInfo.forceUpdate ? 'Update Now' : 'Download'}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Backend Configuration

### Update App Version

Edit `/src/routes/app.js`:

```javascript
const APP_VERSION_CONFIG = {
  android: {
    version: '1.0.1',              // New version number
    buildNumber: 2,                 // Increment build number
    downloadUrl: 'https://app.codewithseth.co.ke/downloads/accord-medical-v1.0.1.apk',
    changelog: 'Bug fixes and improvements',
    forceUpdate: false,             // Set true for mandatory updates
    minSupportedVersion: '1.0.0'    // Oldest version still supported
  }
};
```

### Upload New APK

1. Build and sign your APK
2. Name it: `accord-medical-v{version}.apk`
3. Upload to: `/project/downloads/`
4. Update version config in `app.js`
5. Restart server

---

## Version Comparison Logic

The backend compares versions using semantic versioning:

```
1.0.0 < 1.0.1 < 1.1.0 < 2.0.0
```

- **Major.Minor.Patch** format
- Compares each segment left to right
- Returns `updateAvailable: true` if backend version > current version

---

## Force Update Behavior

When `forceUpdate: true`:
1. App checks version on startup
2. If current < minSupportedVersion, shows mandatory update dialog
3. User cannot dismiss dialog
4. App functionality is blocked until update

Use for:
- Critical security patches
- Breaking API changes
- Major bugs affecting all users

---

## Testing

### Test Update Check
```bash
# No update available (latest version)
curl "https://app.codewithseth.co.ke/api/app/version?platform=android&currentVersion=1.0.0"

# Update available
curl "https://app.codewithseth.co.ke/api/app/version?platform=android&currentVersion=0.9.0"

# Get changelog
curl "https://app.codewithseth.co.ke/api/app/changelog"
```

---

## Security Considerations

1. **APK Signing**: Always use production signing key
2. **HTTPS Only**: Ensure downloads use HTTPS
3. **File Verification**: Users should verify APK signatures
4. **Rate Limiting**: Built-in rate limiting on `/api/` routes
5. **Version Validation**: Backend validates version format

---

## File Structure

```
project/
├── downloads/
│   ├── README.md
│   ├── accord-medical-v1.0.0.apk
│   └── accord-medical-v1.0.1.apk
└── src/
    └── routes/
        └── app.js
```

---

## API Status

✅ **Backend Ready**
✅ **Static File Serving** - `/downloads/` directory
✅ **Version Comparison Logic**
✅ **Platform Support** - Android & iOS
✅ **Force Update Support**
✅ **Changelog API**

🎉 **Your auto-update system is ready to use!**
