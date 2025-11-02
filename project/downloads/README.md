# App Downloads Directory

This directory stores the APK/IPA files for mobile app distribution.

## File Naming Convention

Use this format for APK files:
```
accord-medical-v{version}.apk
```

Example:
```
accord-medical-v1.0.0.apk
accord-medical-v1.0.1.apk
accord-medical-v1.1.0.apk
```

## Updating App Version

1. Place the new APK file in this directory
2. Update the version info in `/src/routes/app.js`:

```javascript
const APP_VERSION_CONFIG = {
  android: {
    version: '1.0.1',  // Update this
    buildNumber: 2,     // Increment this
    downloadUrl: 'https://app.codewithseth.co.ke/downloads/accord-medical-v1.0.1.apk',  // Update URL
    changelog: 'Bug fixes and improvements',  // Update changelog
    forceUpdate: false,  // Set to true if users MUST update
    minSupportedVersion: '1.0.0'  // Oldest version that still works
  }
};
```

## Force Update

Set `forceUpdate: true` when:
- Critical security patch
- Breaking API changes
- Major bug that affects all users

The app will prevent users with older versions from using the app until they update.

## Access

Files in this directory are served at:
- `https://app.codewithseth.co.ke/downloads/accord-medical-v1.0.0.apk`

## Security Note

- Keep this directory size manageable (delete old versions periodically)
- Only upload production-ready, signed APKs
- Verify APK integrity before uploading
