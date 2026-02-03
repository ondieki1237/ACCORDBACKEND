# App Update API — Summary

This document summarises the App Update API implemented in the backend and describes recommended workflows for publishing APKs so mobile apps can detect and download updates.

## Purpose
- Allow mobile apps (sales / engineer) to check whether a newer release exists for their role and platform.
- Allow admins to publish/activate/deactivate releases and provide a download URL (server `downloads/` or external storage).

## Key endpoints

- Public (app clients)
  - `POST /api/app-updates/check` (also available via `GET /api/app-updates/check`)
    - Request (JSON or query):
      - `role` (string) — `sales` or `engineer` (required)
      - `platform` (string) — `android`, `ios`, `web` (required)
      - `currentVersion` (string) — semver-style `1.2.3` (optional)
    - Response:
      - `{ success: true, updateAvailable: true|false, update?: {...} }`
    - Behaviour: returns the most recent active `AppUpdate` matching `platform` and `targetRoles` (or `all`). If `currentVersion` is provided the server compares versions and returns `updateAvailable: false` when the server version is not greater.

- Admin (protected by `authenticate` + `authorize('admin')`)
  - `POST /api/app-updates` — create release
  - `GET /api/app-updates` — list releases
  - `GET /api/app-updates/:id` — get release
  - `PUT /api/app-updates/:id` — update release
  - `DELETE /api/app-updates/:id` — delete release

## `AppUpdate` model (fields)
- `version` (string) — required, e.g. `1.3.0`
- `platform` (string) — `android|ios|web`
- `targetRoles` (array) — contains `sales`, `engineer`, or `all`
- `releaseNotes` (string)
- `downloadUrl` (string) — HTTPS URL that the client uses to download the APK/bundle
- `forced` (boolean) — if true the client should force-update
- `isActive` (boolean) — whether this release is visible to clients
- `createdBy` (ref) — optional admin user id

## Recommended hosting workflow (simple, reliable)
1. Copy APK into project `downloads/` folder (repo `project/downloads/`). The server exposes these files at `https://<your-host>/downloads/<file>`.
   - Example path: `project/downloads/app-release-1.3.0.apk` → URL: `https://api.yourdomain.com/downloads/app-release-1.3.0.apk`
2. Commit & deploy the server so the file is available on the running instance.
3. Create an `AppUpdate` record (admin API) with `downloadUrl` pointing to the public HTTPS downloads URL.

Example admin create (use admin JWT):

```bash
curl -X POST https://api.yourdomain.com/api/app-updates \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "version":"1.3.0",
    "platform":"android",
    "targetRoles":["sales"],
    "releaseNotes":"Bug fixes and improvements",
    "downloadUrl":"https://api.yourdomain.com/downloads/app-release-1.3.0.apk",
    "forced": false,
    "isActive": true
  }'
```

## Recommended CI / automation (optional)
- CI builds the APK, uploads to your artifact storage (preferred: S3/GCS or GitHub Releases), then calls the admin API to create the `AppUpdate` record with the artifact URL.
- Minimal GitHub Actions sketch (build -> upload to S3 -> call API): include AWS/GCS creds in CI secrets and `ADMIN_API_TOKEN` for a service account admin token.

## Notes & considerations
- Using `downloads/` in the repo is simple and works for small teams but keeps binaries in git history (not ideal long-term).
- Prefer HTTPS URLs and signed URLs when hosting in private buckets.
- The server's public `/app/update` convenience route remains available for single-value environment-driven update checks, but the `AppUpdate` model allows per-role and per-platform control.
- Admin dashboard changes that do not create/activate an `AppUpdate` record will not prompt the app to update — this is by design.
- Consider adding a checksum or signature field to `AppUpdate` for clients to verify downloads.

## How the client should check
- Client periodically (or at startup) POSTs to `/api/app-updates/check` with `role`, `platform`, and optional `currentVersion`.
- When `updateAvailable: true` the client should show release notes and provide the `downloadUrl`. If `forced: true` the client should block access until updated.

## Frontend handling and UX flow
This section describes recommended client-side behaviour (mobile/web) when handling updates, including popup UX, download progress, and success handling.

- Check strategy:
  - On app startup and periodically (e.g., daily) call `/api/app-updates/check` with `role`, `platform`, and `currentVersion`.
  - Also trigger a check after certain user actions if you want faster propagation.

- When `updateAvailable: true`:
  - If `forced: true`:
    - Show a blocking modal titled e.g. "Update Required" with the `releaseNotes` and a single primary button `Update Now`.
    - Disable app navigation until the update completes (or for web, redirect to the download URL and block use).
  - If not forced:
    - Show a dismissible modal or snackbar with `releaseNotes`, and two actions: `Update Now` and `Remind Me Later` (or `Skip`).
    - Do not repeatedly nag the user; respect a reminder interval (e.g., 24 hours) after `Remind Me Later`.

- Download & install flow (Android example):
  - When the user taps `Update Now`, download the APK from `downloadUrl` over HTTPS.
  - Show a progress indicator (percentage + transfer rate) while downloading.
  - On download completion, trigger the Android install prompt (intent to install APK). For Android 8+ ensure `REQUEST_INSTALL_PACKAGES` and proper file provider handling.
  - After the OS install completes, the app will restart. On next startup, verify the installed version matches the `AppUpdate.version` and show a brief success toast/modal: "Update installed successfully".

- Web app flow:
  - If `platform: web`, the client may redirect to `downloadUrl` or fetch the new bundle and prompt the user to reload.
  - Show a non-blocking notification: `New version available — Refresh to update`. If `forced`, auto-refresh the page.

- Success confirmation and reporting:
  - On successful install/startup (client sees its version >= `AppUpdate.version`) the client SHOULD record this event in analytics and optionally POST a confirmation to your backend (recommended endpoint `/api/app-updates/ack` — not implemented by default).
  - Reporting payload suggestion: `{ email?, userId?, platform, role, version, updateId, timestamp }`.
  - Use these acknowledgements to track rollout and detect failed installs.

- Edge cases and notes:
  - If `downloadUrl` points to a server `downloads/` file, ensure the file is accessible via HTTPS and the server responds with correct `Content-Type` and `Content-Length` headers for progress reporting.
  - Validate the downloaded binary (checksum or signature) before prompting install if possible.
  - For large teams, prefer using signed URLs (S3/GCS) to avoid exposing artifacts indefinitely.

---
Updated: frontend handling and success popup guidance added.

## Files added by server change
- Model: `project/src/models/AppUpdate.js`
- Controller: `project/src/controllers/appUpdateController.js`
- Routes: `project/src/routes/appUpdates.js` (mounted at `/api/app-updates`)
- Server mount: `project/src/server.js` now registers the routes.

---
File location: [project/summary_update_api.md](project/summary_update_api.md)
