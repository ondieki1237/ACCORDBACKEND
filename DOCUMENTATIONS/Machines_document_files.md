# Machines Document Files - API Summary

## Overview
This document summarizes the new "Machine Documents" API for uploading and managing machine-related documentation in Google Drive.
Files are uploaded from the dashboard, stored in Google Drive under the `ACCORD_MACHINES` folder (created if missing), and metadata recorded in MongoDB.

## Authentication
- All endpoints require a valid JWT Bearer token in the `Authorization` header.

## Endpoints
- POST `/api/machine-documents`
  - Description: Upload a single file (multipart/form-data).
  - Body: `file` (file), optional `machineId` (string), optional `notes` (string).
  - Response: 201 with saved `MachineDocument` metadata.

- GET `/api/machine-documents`
  - Description: List uploaded documents. Accepts optional query `machineId` to filter.
  - Response: 200 with array of documents.

- GET `/api/machine-documents/:id`
  - Description: Get metadata for a single document.

- DELETE `/api/machine-documents/:id`
  - Description: Delete a document (removes DB record and attempts to delete file from Drive).
  - Permissions: uploader or `admin`/`manager` only.

## Example curl (upload)

```bash
curl -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@./manual.pdf" \
  -F "machineId=603c..." \
  -F "notes=Installation manual" \
  https://your-api.example.com/api/machine-documents
```

## Environment Variables
- `GOOGLE_APPLICATION_CREDENTIALS` — path to the service account JSON (example: `./project/kazihub-468305-1a197c2229be.json`).
- `GOOGLE_DRIVE_FOLDER_ID` — optional: use an existing Drive folder ID directly.
- `GOOGLE_DRIVE_FOLDER_NAME` — defaults to `ACCORD_MACHINES` and will be created if `GOOGLE_DRIVE_FOLDER_ID` is not set.

See example env entries in: [project/.env.example](project/.env.example).

## Storage & Links
- Files are uploaded to Google Drive and saved into the folder specified by the env config.
- Metadata is saved in the `MachineDocument` collection.

Implementation files
- Controller: [project/src/controllers/machineDocumentController.js](project/src/controllers/machineDocumentController.js)
- Routes: [project/src/routes/machineDocuments.js](project/src/routes/machineDocuments.js)
- Model: [project/src/models/MachineDocument.js](project/src/models/MachineDocument.js)
- Drive client + folder helper: [project/src/config/googleDrive.js](project/src/config/googleDrive.js)
- Upload middleware (Multer): [project/src/middleware/upload.js](project/src/middleware/upload.js)
- Route registration: [project/src/server.js](project/src/server.js)

## Notes & Recommendations
- The service account JSON (`kazihub-468305-1a197c2229be.json`) is listed in `project/.gitignore` — keep it secure and do not commit to source control.
- If you want uploaded files to be publicly viewable, enable `drive.permissions.create` for reader/anyone in the controller (currently commented).
- Consider adding frontend UI for browsing and attaching machine docs to Machine records.

## Troubleshooting
- 403 on upload/delete: ensure the JWT belongs to an authenticated user; delete requires uploader or admin/manager.
- 403 from Drive API: ensure the service account has access to the target folder or set `GOOGLE_DRIVE_FOLDER_ID` to a folder shared with the service account.
- Large files: default limit is 50MB; adjust `project/src/middleware/upload.js` if needed.

---

If you'd like, I can add a Postman collection entry or a minimal React component to upload and list machine documents in the admin UI.