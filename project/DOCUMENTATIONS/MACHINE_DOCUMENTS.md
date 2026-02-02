# Machine Documents — API & Implementation Summary

This document describes the new Machine Documents feature (file uploads + link records), the related models, and the complete backend API surface (categories, manufacturers, machine documents, and public sales listing). It includes method, path, auth requirements, sample requests and sample responses.

Overview
- Two document types:
  - file: binary uploaded to Google Drive (stored metadata + Drive file id)
  - link: URL record (title + linkUrl) used for externally hosted docs
- Admins manage documents and metadata (categories, manufacturers).
- Sales/read-only consumers use the public `GET /sales/documents` endpoint which returns active link records only.

Models (shape)
- DocumentCategory
  - _id: ObjectId
  - name: String (required, unique)
  - description: String (optional)
  - isActive: Boolean (default: true)
  - createdBy: ObjectId -> `User`
  - createdAt, updatedAt

- Manufacturer
  - _id: ObjectId
  - name: String (required, unique)
  - description: String (optional)
  - isActive: Boolean (default: true)
  - createdBy: ObjectId -> `User`
  - createdAt, updatedAt

- MachineDocument
  - _id: ObjectId
  - title: String (required)
  - type: 'file' | 'link' (required)
  - linkUrl: String (for link records or Drive webViewLink)
  - driveFileId: String (for file records)
  - fileName: String
  - mimeType: String
  - fileSize: Number
  - categoryId: ObjectId -> `DocumentCategory`
  - manufacturerId: ObjectId -> `Manufacturer`
  - uploadedBy: ObjectId -> `User` (required)
  - folderId: String (Drive folder id when applicable)
  - isActive: Boolean (default: true)
  - createdAt, updatedAt

API Reference
Base: `/api`

1) Document categories
- GET /api/document-categories
  - Auth: none (public)
  - Query: none
  - Response: 200 { success: true, data: [ { _id, name, description, isActive, createdAt } ] }
  - Example curl:
    ```bash
    curl http://localhost:4500/api/document-categories
    ```

- GET /api/document-categories/:id
  - Auth: none
  - Response: 200 { success: true, data: { _id, name, description, isActive } }

- POST /api/document-categories
  - Auth: Bearer token (admin)
  - Body: { name: string, description?: string }
  - Response: 201 { success: true, data: { _id, name, description, createdBy, createdAt } }
  - Example curl:
    ```bash
    curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
      -d '{"name":"Lab","description":"Lab docs"}' \
      http://localhost:4500/api/document-categories
    ```

2) Manufacturers
- GET /api/manufacturers
  - Auth: none
  - Response: 200 { success: true, data: [ { _id, name, description, isActive, createdAt } ] }

- GET /api/manufacturers/:id
  - Auth: none

- POST /api/manufacturers
  - Auth: Bearer token (admin)
  - Body: { name: string, description?: string }
  - Response: 201 { success: true, data: { _id, name, description, createdBy, createdAt } }

3) Machine Documents (admin write, authenticated read)
- GET /api/machine-documents
  - Auth: Bearer token (authenticated users)
  - Query params:
    - `type` (optional): 'file' or 'link'
    - `categoryId` (optional)
    - `manufacturerId` (optional)
    - `all=true` to include inactive documents
  - Response: 200 { success: true, data: [ MachineDocument ] }

- GET /api/machine-documents/:id
  - Auth: Bearer token (authenticated users)
  - Response: 200 { success: true, data: MachineDocument }

- POST /api/machine-documents
  - Auth: Bearer token (admin)
  - Accepts two modes:
    1. JSON link record
       - Content-Type: application/json
       - Body: { type: 'link', title: string, linkUrl: string, categoryId?: string, manufacturerId?: string }
    2. Multipart file upload
       - Content-Type: multipart/form-data
       - Fields: `file` (binary), optional `title`
  - Behavior:
    - Server uses a conditional middleware that only runs multer for multipart/form-data requests. JSON body posts are accepted without file.
    - For file uploads the server uploads to Google Drive (service account) and stores Drive file id + webViewLink in the document record.
  - Response: 201 { success: true, data: MachineDocument }
  - Example (JSON link):
    ```bash
    curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
      -d '{"type":"link","title":"Autoclave Manual","linkUrl":"https://drive.google.com/...","categoryId":"<catId>","manufacturerId":"<manId>"}' \
      http://localhost:4500/api/machine-documents
    ```
  - Example (file upload):
    ```bash
    curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
      -F "file=@/path/to/manual.pdf" -F "title=Manual" \
      http://localhost:4500/api/machine-documents
    ```

- POST /api/machine-documents/link
  - Auth: Bearer token (admin)
  - Convenience endpoint used by the frontend; accepts JSON or FormData (FormData without file). Internally it calls the same controller as the generic POST.
  - Body JSON: { type:'link', title, linkUrl, categoryId?, manufacturerId? }

- PUT /api/machine-documents/:id
  - Auth: Bearer token (admin)
  - Body: fields to update (title, categoryId, manufacturerId, isActive)

- DELETE /api/machine-documents/:id
  - Auth: Bearer token (admin)
  - Behavior: If document is a Drive file, the server will attempt to delete the Drive file (best-effort) and then remove the DB record.

4) Sales (public read-only)
- GET /api/sales/documents
  - Auth: none (public)
  - Returns: active link records only (minimal fields)
  - Sample response: 200 { success: true, data: [ { _id, title, linkUrl, category: { _id, name }, manufacturer: { _id, name } } ] }
  - Also mounted at `/sales/documents` for frontend convenience.

Responses & Errors
- Successful creation returns 201 and the created resource in `{ success: true, data: ... }`.
- Validation errors return 400 with `{ success: false, message: '...' }`.
- Unauthorized access returns 401; insufficient permissions return 403.

Implementation notes
- Google Drive
  - The server uses a service account and the `googleapis` client to upload files. Set `GOOGLE_APPLICATION_CREDENTIALS` to the service account JSON path and `GOOGLE_DRIVE_FOLDER_ID` optionally to an existing folder id.
  - For file records the server stores `driveFileId` and `linkUrl` (webViewLink). Optionally set file permissions to `anyoneWithLink` if intended to be publicly accessible.

- Multer / Content-Type handling
  - The server uses a `conditionalUpload` middleware that only applies multer when `Content-Type` includes `multipart/form-data`. This allows the same endpoint to accept JSON link posts and multipart file uploads without requiring a `file` field for links.

- Security
  - Only admin users may create/update/delete categories, manufacturers and documents.
  - The public `/api/sales/documents` endpoint exposes only minimal link metadata and category/manufacturer names.

Client integration examples
- Fetch categories (used for the inline create/select control):
  ```js
  // lib/api.ts
  export const getDocumentCategories = () => fetch('/api/document-categories').then(r => r.json());
  export const createDocumentCategory = (payload, token) => fetch('/api/document-categories', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json());
  ```

- Create link (frontend using fetch JSON):
  ```js
  fetch('/api/machine-documents/link', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ type:'link', title, linkUrl, categoryId, manufacturerId }) })
  ```

- Create link (frontend using FormData):
  ```js
  const fd = new FormData();
  fd.append('type','link');
  fd.append('title', title);
  fd.append('linkUrl', linkUrl);
  // categoryId/manufacturerId optional
  fetch('/api/machine-documents/link', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
  ```

Testing checklist
- Verify `GET /api/document-categories` returns seeded/default categories.
- As admin:
  - Create a category and a manufacturer.
  - POST a link document (JSON) → 201 and appears in GET /api/machine-documents.
  - POST a link document using FormData (no file) → 201.
  - POST a file upload (multipart, `file`) → 201 and Drive metadata present in DB.
  - DELETE a file record → DB removed and Drive deletion attempted.
- As non-admin:
  - Confirm read endpoints work but POST/PUT/DELETE return 403.

Notes / Troubleshooting
- If frontends see `400 No file uploaded` when creating a link, ensure:
  - If using JSON: `Content-Type` must be `application/json`, and body must include `type: 'link'` and `linkUrl`.
  - If using FormData: do not set `Content-Type` manually (the browser will set the multipart boundary). The server's `conditionalUpload` will detect `multipart/form-data` and parse form fields into `req.body` so the link creation will proceed even if no `file` field is present.

Change log
- 2026-02-02: Added link-based documents, categories, manufacturers, admin-protected CRUD, public sales listing, and conditional upload middleware to accept JSON/FormData.

If you want I can also:
- Add sample Express controllers and Mongoose model snippets into `project/src/examples/` for quick copy-paste.
- Add request/response schemas (OpenAPI) for automated client generation.

