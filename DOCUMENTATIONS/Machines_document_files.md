# Machines Document Files - API Summary

## Overview
This document describes the **Machine Documents** API for uploading and managing machine-related documentation.

The feature supports **two types of documents**:
- **File documents**: binary files uploaded from the dashboard and stored in **Google Drive** under the `ACCORD_MACHINES` folder (created if missing).
- **Link documents**: metadata-only records that store an external URL (no file upload).

For both types, metadata is stored in MongoDB in the `MachineDocument` collection.

## Authentication & Roles
- All endpoints require a valid **JWT Bearer token** in the `Authorization` header.
- **Listing & fetch**: any authenticated user.
- **Create (file or link) and delete**: `admin` only (enforced by `authorize('admin')` in the routes).

## Data Model (MachineDocument)

`MachineDocument` (`project/src/models/MachineDocument.js`) fields:
- `title` (string, required) – display name of the document.
- `type` (string, required) – one of:
  - `'file'` – Drive-backed uploaded file.
  - `'link'` – external URL-only document.
- `linkUrl` (string) – for:
  - file documents: Google Drive `webViewLink` for the uploaded file.
  - link documents: the external URL provided by the user.
- `driveFileId` (string) – Google Drive file ID (only for `type: 'file'`).
- `fileName` (string) – original filename for uploaded files.
- `mimeType` (string) – MIME type for uploaded files.
- `fileSize` (number) – size in bytes for uploaded files.
- `categoryId` (ObjectId → `DocumentCategory`) – optional document category.
- `manufacturerId` (ObjectId → `Manufacturer`) – optional manufacturer association.
- `uploadedBy` (ObjectId → `User`, required) – user who created the document.
- `folderId` (string) – Drive folder ID used for storage.
- `isActive` (boolean, default `true`) – soft-activation flag used by listing.

> **Note:** The controller keeps a legacy `machineId` filter for backward compatibility (`?machineId=...`), but the current schema does not define a `machineId` field. Do not rely on `machineId` for new integrations.

---

## Endpoints

### 1. Upload file document

**Endpoint:** `POST /api/machine-documents`  
**Auth:** `admin` only  
**Content-Type:** `multipart/form-data`

**Request fields:**
- `file` (file, required) – the file to upload.
- `title` (string, optional) – custom title; defaults to original `fileName` if omitted.
- `categoryId` (string, optional) – MongoDB ObjectId of a `DocumentCategory`.
- `manufacturerId` (string, optional) – MongoDB ObjectId of a `Manufacturer`.

**Behavior:**
- Uses Multer (`upload.single('file')`) via `conditionalUpload` for multipart requests.
- Ensures a Google Drive folder for machine docs via `ensureMachinesFolder()`:
  - If `GOOGLE_DRIVE_FOLDER_ID` is set, that folder ID is used directly.
  - Otherwise searches / creates a folder named `GOOGLE_DRIVE_FOLDER_NAME` (default: `ACCORD_MACHINES`).
- Streams the file to Google Drive and stores:
  - `driveFileId` and `linkUrl` (Drive `webViewLink`),
  - file metadata (name, size, mimeType),
  - link back to the uploader (`uploadedBy`).

**Success Response (201):**
- `{ success: true, data: <MachineDocument> }` where `data.type === 'file'`.

**Example (file upload):**

```bash
curl -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@./manual.pdf" \
  -F "title=Installation manual" \
  -F "categoryId=<DOCUMENT_CATEGORY_ID>" \
  -F "manufacturerId=<MANUFACTURER_ID>" \
  http://localhost:4500/api/machine-documents
```

---

### 2. Create link-only document

**Endpoint:** `POST /api/machine-documents/link`  
**Auth:** `admin` only  
**Content-Type:** `application/json` (preferred) or `multipart/form-data` **without** a `file`.

**Request body (JSON):**
```json
{
  "type": "link",
  "title": "Installation Manual (Vendor Site)",
  "linkUrl": "https://vendor.com/manuals/machine-123.pdf",
  "categoryId": "DOCUMENT_CATEGORY_ID_OPTIONAL",
  "manufacturerId": "MANUFACTURER_ID_OPTIONAL"
}
```

**Fields:**
- `type` (string, required) – must be `"link"` (used by controller to select link mode).
- `title` (string, required) – display name for the link.
- `linkUrl` (string, required) – external URL (e.g. vendor manual, SharePoint, etc.).
- `categoryId` (string, optional) – `DocumentCategory` id (validated if provided).
- `manufacturerId` (string, optional) – `Manufacturer` id (validated if provided).

**Behavior:**
- Does **not** interact with Google Drive.
- Creates a `MachineDocument` with:
  - `type: 'link'`,
  - `linkUrl` as provided,
  - optional `categoryId` / `manufacturerId`,
  - `uploadedBy` from the authenticated user.

**Success Response (201):**
- `{ success: true, data: <MachineDocument> }` where `data.type === 'link'`.

> **Note:** Under the hood the same controller (`uploadMachineDocument`) is used for both `/` and `/link`:
> - If `req.body.type === 'link'` → link document.
> - Otherwise it expects a file upload.

---

### 3. List documents

**Endpoint:** `GET /api/machine-documents`  
**Auth:** any authenticated user

**Query parameters:**
- `type` (optional) – filter by `'file'` or `'link'`.
- `all` (optional, truthy) – if set (e.g. `all=true`), include documents where `isActive === false`.  
  Default: only `isActive === true`.
- `machineId` (optional, legacy) – kept only for backward compatibility; schema no longer defines this field.

**Behavior:**
- Returns documents matching the query, with:
  - `uploadedBy` populated (`firstName`, `lastName`, `email`),
  - `categoryId` populated (`name`),
  - `manufacturerId` populated (`name`).

**Success Response (200):**
- `{ success: true, data: [ <MachineDocument>, ... ] }`

---

### 4. Get single document

**Endpoint:** `GET /api/machine-documents/:id`  
**Auth:** any authenticated user

**Behavior:**
- Fetches a single `MachineDocument` by MongoDB `_id`.
- Populates `uploadedBy`, `categoryId`, and `manufacturerId` similar to listing.

**Responses:**
- `200` – `{ success: true, data: <MachineDocument> }`
- `404` – `{ success: false, message: 'Document not found' }`

---

### 5. Delete document

**Endpoint:** `DELETE /api/machine-documents/:id`  
**Auth:** `admin` only

**Behavior:**
- Route is protected by `authorize('admin')` in `routes/machineDocuments.js`.
- Loads the `MachineDocument`:
  - If not found → `404`.
- If `type === 'file'` and `driveFileId` present:
  - Attempts to delete the file from Google Drive via `drive.files.delete({ fileId })`.
  - Logs a warning if Drive deletion fails, but still removes the DB record.
- Removes the document from MongoDB.

**Success Response (200):**
- `{ success: true, message: 'Document deleted' }`

---

## Environment Variables
- `GOOGLE_APPLICATION_CREDENTIALS` — path to the service account JSON (example: `./project/kazihub-468305-1a197c2229be.json`).
- `GOOGLE_DRIVE_FOLDER_ID` — optional: use an existing Drive folder ID directly (skips name-based lookup/creation).
- `GOOGLE_DRIVE_FOLDER_NAME` — defaults to `ACCORD_MACHINES` and is created if `GOOGLE_DRIVE_FOLDER_ID` is not set.

See env entries in `project/.env`.

---

## Storage & Links
- **File documents:**
  - Stored in Google Drive under the configured machines folder.
  - `MachineDocument.type === 'file'`, `driveFileId` set, and `linkUrl` contains the Drive `webViewLink` for convenient viewing.
- **Link documents:**
  - `MachineDocument.type === 'link'`, `linkUrl` is the external URL you provided.
  - Do **not** create or manage any Drive file.

All documents are discoverable via `GET /api/machine-documents` with optional `type` filtering.

---

## Implementation Files
- Controller: `project/src/controllers/machineDocumentController.js`
- Routes: `project/src/routes/machineDocuments.js`
- Model: `project/src/models/MachineDocument.js`
- Drive client + folder helper: `project/src/config/googleDrive.js`
- Upload middleware (Multer): `project/src/middleware/upload.js`
- Route registration: `project/src/server.js`

---

## Notes & Recommendations
- The service account JSON (`kazihub-468305-1a197c2229be.json`) is listed in `.gitignore` — keep it secure and **never commit** it to source control.
- To make uploaded files publicly viewable, you can extend the controller to grant public read access after upload using Drive permissions APIs.
- Frontend can:
  - Upload file documents via `multipart/form-data`.
  - Create link documents via simple JSON POST to `/api/machine-documents/link` (with `type: 'link'`).
  - Filter by `type` to show only file docs or link docs in the UI.

---

## Troubleshooting
- **403 on create/delete:**
  - Ensure the JWT belongs to an `admin` user; listing/fetch is allowed for any authenticated user.
- **403 from Drive API:**
  - Ensure the service account has permission on the target folder, or set `GOOGLE_DRIVE_FOLDER_ID` to a folder shared with the service account.
- **Large files:**
  - Default Multer limits are around 50MB; adjust in `project/src/middleware/upload.js` if needed.
