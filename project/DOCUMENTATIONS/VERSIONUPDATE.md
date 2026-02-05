📦 Over-the-Air (OTA) APK Update Documentation

Project: Accord App
Backend: https://app.codewithseth.co.ke
APK: app-debug.apk
Framework: Capacitor (Android)

1. Overview

This document describes how the Accord mobile application checks for updates and downloads a new APK securely over HTTPS using Capacitor and Android’s native installer.

⚠️ Important: Android apps cannot self-install APKs. The app must hand off the download to the Android system.

2. Update Flow Architecture
Mobile App
   │
   │ POST /api/app-updates/check
   │
   ▼
Backend API
   │
   │ Returns update metadata + HTTPS download URL
   │
   ▼
Mobile App
   │
   │ Browser.open(downloadUrl)
   │
   ▼
Android Download Manager
   │
   ▼
APK Installer Prompt

3. Backend Implementation
3.1 APK Location

The APK must exist in the backend project:

/backend
 ├─ downloads/
 │   └─ app-debug.apk
 └─ server.js

3.2 APK Download Endpoint

Route

GET /downloads/app-debug.apk


Implementation (Express.js)

import path from 'path';

app.get('/downloads/app-debug.apk', (req, res) => {
  const apkPath = path.join(process.cwd(), 'downloads', 'app-debug.apk');

  res.setHeader(
    'Content-Type',
    'application/vnd.android.package-archive'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="app-debug.apk"'
  );
  res.setHeader('Accept-Ranges', 'bytes');

  res.sendFile(apkPath);
});


✅ Supports Android range requests
✅ Works with Download Manager
✅ HTTPS trusted by Android

3.3 Update Check API

Route

POST /api/app-updates/check


Request Body

{
  "currentVersion": "1.0.2",
  "platform": "android"
}


Response Example

{
  "hasUpdate": true,
  "latestVersion": "1.0.3",
  "mandatory": false,
  "downloadUrl": "https://app.codewithseth.co.ke/downloads/app-debug.apk"
}


⚠️ Never return localhost or IP-based URLs

4. Frontend (Capacitor) Implementation
4.1 Update Check Request
const response = await fetch(
  'https://app.codewithseth.co.ke/api/app-updates/check',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentVersion: APP_VERSION,
      platform: 'android',
    }),
  }
);

const updateInfo = await response.json();

4.2 Triggering the APK Download (CRITICAL)

❌ Do NOT use

fetch(downloadUrl);
axios.get(downloadUrl);


Android will refuse to install.

✅ Correct Way (Required)
import { Browser } from '@capacitor/browser';

async function downloadAndInstall(downloadUrl: string) {
  await Browser.open({
    url: downloadUrl,
  });
}


This hands control to:

Android Browser

Android Download Manager

System APK installer

4.3 Complete Update Logic
if (updateInfo.hasUpdate) {
  await Browser.open({
    url: updateInfo.downloadUrl,
  });
}

5. Capacitor Configuration
capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.accord.app',
  appName: 'Accord',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

6. Android Configuration
6.1 Required Permissions

android/app/src/main/AndroidManifest.xml

<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />

6.2 User Permission

On Android 8+:

User must allow “Install unknown apps”

Android prompts automatically on first install attempt

7. Testing Checklist
Backend Test

Open in browser:

https://app.codewithseth.co.ke/downloads/app-debug.apk


✔ File downloads
✔ Installer opens

App Test

Open app

Trigger update check

Tap Update

Android download notification appears

Installer prompt opens

8. Common Failure Causes
Issue	Result
Using localhost	Network error
Using fetch()	Silent install failure
Missing headers	Download stalls
Invalid SSL	APK rejected
Wrong MIME type	Installer won’t open