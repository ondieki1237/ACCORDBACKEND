## In-App Update API (endpoint for APK updates)

Purpose
- Provide a minimal JSON endpoint that mobile apps can poll to check whether a new APK is available and download it.

Endpoint
- GET /app/update

Response (200)
```json
{
  "versionCode": 12,
  "versionName": "1.2.0",
  "apkUrl": "https://app.codewithseth.co.ke/apk/app-release.apk",
  "forceUpdate": false,
  "changelog": "Bug fixes and performance improvements"
}
```

Behavior & Requirements
- Serve over HTTPS from your deployed domain `app.codewithseth.co.ke`.
- `apkUrl` must be a publicly reachable HTTPS URL (or reachable by authenticated users if you prefer). For reliability use a CDN or object storage (S3/GCS) and enable `Accept-Ranges` for resumable downloads.
- `versionCode` is an integer (Android `versionCode`) and must increase for new releases. The app compares this to its own build number.
- `forceUpdate` when true disables user's ability to postpone the update in the app UI.
- Keep the endpoint cache TTL short (Cache-Control: no-cache or a few minutes) so clients get fresh info.

Security
- The endpoint itself is public and does not require auth (so the app can check before login). If you must restrict access, host the APK on a protected path and return a signed short-lived URL.

Implementation examples

- Minimal Express snippet (Node.js) — drop into your existing Express app:

```js
app.get('/app/update', (req, res) => {
  const response = {
    versionCode: Number(process.env.VERSION_CODE || 2),
    versionName: process.env.VERSION_NAME || '0.0.2',
    apkUrl: process.env.APK_URL || 'https://app.codewithseth.co.ke/apk/app-release.apk',
    forceUpdate: process.env.FORCE_UPDATE === 'true',
    changelog: process.env.CHANGELOG || 'Minor fixes',
  }
  res.set('Cache-Control', 'no-cache')
  res.json(response)
})
```

- Minimal FastAPI (Python) example:

```py
from fastapi import FastAPI
import os

app = FastAPI()

@app.get('/app/update')
def get_update():
    return {
        'versionCode': int(os.getenv('VERSION_CODE', '2')),
        'versionName': os.getenv('VERSION_NAME', '0.0.2'),
        'apkUrl': os.getenv('APK_URL', 'https://app.codewithseth.co.ke/apk/app-release.apk'),
        'forceUpdate': os.getenv('FORCE_UPDATE', 'false').lower() == 'true',
        'changelog': os.getenv('CHANGELOG', 'Minor fixes'),
    }
```

Deployment recommendations
- Host the APK on a CDN or object storage for speed and reliability.
- Provide a versioning pipeline (CI) that increments `VERSION_CODE` and uploads the APK and updates env vars or a small JSON file.
- Consider hosting the endpoint and APK under `https://app.codewithseth.co.ke/app/update` and `https://app.codewithseth.co.ke/apk/app-release.apk`.

Client integration
- The frontend mobile app provided in this repository already checks `NEXT_PUBLIC_UPDATE_URL` or defaults to `https://app.codewithseth.co.ke/app/update`.
- To override, set `NEXT_PUBLIC_UPDATE_URL` in your Next.js environment for the built app.

If you want, I can:
- Provide a Dockerfile and a small container image to run this endpoint.
- Add an automated CI step to bump `VERSION_CODE` and publish the APK + endpoint update.
