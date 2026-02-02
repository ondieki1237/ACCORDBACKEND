# Backend changes required for ACCORD frontend features

This document lists backend endpoints, request/response contracts, headers, and server configuration required by the frontend changes in this repository. Implement these on your deployed backend (https://app.codewithseth.co.ke) so the mobile/web app works correctly in production.

## 1) Update endpoint for in-app APK updates
- Path: `GET /app/update`
- Purpose: Inform clients about a new APK and provide a download URL.
- Response (200):

```json
{
  "versionCode": 123,
  "versionName": "1.2.3",
  "apkUrl": "https://yourdomain.com/apk/app-release.apk",
  "forceUpdate": false,
  "changelog": "- Fixes and improvements"
}
```

- Requirements:
  - Serve the APK file at the `apkUrl` over HTTPS.
  - `apkUrl` must be accessible without authentication.
  - The server must support large file downloads and range requests (for resumable downloads).
  - Set `Content-Type: application/vnd.android.package-archive` and a sensible `Content-Disposition` if needed.
  - Use `Cache-Control: no-cache` or short TTL for the update endpoint (so clients get fresh info).

## 2) Visit CRUD and deletion
- Paths:
  - `GET /visits` (list, supports `page`, `limit`, `startDate`, `endDate`)
  - `POST /visits` (create visit)
  - `DELETE /visits/:id` (delete visit)

- Requirements:
  - `POST /visits` should accept the payload shape used by `lib/api.ts#createVisit` and return the created visit object or an error.
  - `DELETE /visits/:id` should return 200/204 on success and a descriptive JSON error on failure.

## 3) Reports / Sales deletion and PDF hosting
- Paths:
  - `GET /sales` / `GET /reports` (list)
  - `DELETE /sales/:id` (delete report)
  - Report PDF files should be hosted and their `pdfUrl` included in the report object.

- Requirements:
  - When the frontend calls delete, the server should validate permissions and return 200 on success.
  - `pdfUrl` should be a full HTTPS URL and accessible to authenticated users (or public if intended).

## 4) Consumables / Products API
- Paths (suggested):
  - `GET /consumables` (query params: `q`, `category`, `page`, `limit`, `sort`)
  - `GET /consumables/:id`

- Response shape:
  - Return paginated results with fields: `id`, `name`, `sku`, `price`, `unit`, `stock`, `category`, `description`.

## 5) Authentication and token refresh
- Paths:
  - `POST /auth/login` — returns `{ tokens: { accessToken, refreshToken }, user }`
  - `POST /auth/refresh` — accepts `{ refreshToken }`, returns new `{ tokens }`

- Requirements:
  - Backend should return `401` for expired access tokens.
  - When the `makeRequest` client sees `401`, it posts to `/auth/refresh`.
  - Optionally add an `X-New-Access-Token` header on responses when tokens are rotated. The frontend will read this header and update stored tokens if present.

## 6) XLSX / Export endpoints
- If exports are generated server-side, provide endpoints such as:
  - `GET /sales/export?format=xlsx&startDate=...&endDate=...` returning `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and the file stream.

## 7) CORS / Security
- Ensure CORS allows the frontend origin(s) (web and Android webview) for the needed endpoints.
- Use HTTPS everywhere.
- For APK hosting, use a domain with a valid TLS certificate.

## 8) Headers / Response conventions
- Successful responses should follow a JSON envelope like `{ success: true, data: ... }` or direct objects — the frontend handles either but expects a JSON body.
- Error responses should include `message` and optionally `errors` for field-level issues.

## 9) Performance / Hosting considerations for APKs
- Use a CDN or blob storage (S3, GCS) for serving APKs to handle bandwidth and resume capabilities.
- Set proper `Content-Length` and support `Accept-Ranges: bytes`.

## 10) Recommended server flags / env variables
- Ability to configure `VERSION_CODE`, `VERSION_NAME`, `APK_PATH`, `FORCE_UPDATE`, and `CHANGELOG` for the update endpoint.

## 11) Example minimal update server behavior
- The repository includes `scripts/update-server/server.js` as a reference. Production servers should implement the same contract but with secure hosting and CDN for the APK.

---
If you want, I can also generate OpenAPI (Swagger) specs for these endpoints, or scaffold server code (Node/FastAPI) that implements them. Tell me which endpoints you want scaffolded first and your preferred backend stack.
