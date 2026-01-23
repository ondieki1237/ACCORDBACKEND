# Google Drive File Upload Integration

This document explains how to integrate **Google Drive file uploads** into an **existing Node.js + MongoDB backend**. Files uploaded from your application dashboard will be securely stored in Google Drive using a **Service Account**.

---

## 1. Architecture Overview

**Flow**:

Frontend (Dashboard) → Backend (Node.js API) → Google Drive

**Why this approach?**
- Secure (no Google credentials exposed to frontend)
- Centralized folder control
- Easy auditing & metadata storage in MongoDB

---

## 2. Prerequisites

Before proceeding, ensure you have:

- Node.js backend (Express / NestJS / Fastify)
- MongoDB (local or Atlas)
- Google Cloud Project
- Google Drive API enabled
- Service Account JSON key downloaded
- A Google Drive folder shared with the Service Account (Editor access)

---

## 3. Required Dependencies

Install the required packages:

```bash
npm install googleapis multer dotenv
```

Optional (recommended):
```bash
npm install uuid
```

---

## 4. Environment Configuration

Create or update your `.env` file:

```env
GOOGLE_APPLICATION_CREDENTIALS=./config/service-account.json
GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id_here
```

⚠️ Add the JSON file to `.gitignore`

```gitignore
service-account.json
```

---

## 5. Google Drive Client Setup

Create a helper file: `config/googleDrive.js`

```js
const { google } = require('googleapis');
const path = require('path');

const auth = new google.auth.GoogleAuth({
  keyFile: path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const driveService = google.drive({
  version: 'v3',
  auth,
});

module.exports = driveService;
```

---

## 6. File Upload Middleware (Multer)

Create `middleware/upload.js`

```js
const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Invalid file type'));
  }
});

module.exports = upload;
```

---

## 7. Upload Controller Logic

Create `controllers/uploadController.js`

```js
const driveService = require('../config/googleDrive');
const { Readable } = require('stream');

const uploadToDrive = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileMetadata = {
      name: req.file.originalname,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const media = {
      mimeType: req.file.mimetype,
      body: bufferStream,
    };

    const response = await driveService.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, webViewLink'
    });

    return res.status(201).json({
      fileId: response.data.id,
      viewLink: response.data.webViewLink,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Upload failed' });
  }
};

module.exports = { uploadToDrive };
```

---

## 8. API Route

Create `routes/uploadRoutes.js`

```js
const express = require('express');
const upload = require('../middleware/upload');
const { uploadToDrive } = require('../controllers/uploadController');

const router = express.Router();

router.post('/upload', upload.single('file'), uploadToDrive);

module.exports = router;
```

Register the route in `app.js` or `server.js`:

```js
app.use('/api', require('./routes/uploadRoutes'));
```

---

## 9. MongoDB Metadata Storage (Optional but Recommended)

### Example Schema

```js
const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileName: String,
  fileType: String,
  driveFileId: String,
  driveLink: String,
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', FileSchema);
```

Store metadata after successful upload.

---

## 10. Folder Organization Strategy (Recommended)

You may dynamically create folders per:
- User ID
- Application ID
- Date (YYYY/MM)

This improves manageability and access control.

---

## 11. Security Best Practices

- Never expose Service Account credentials to frontend
- Restrict file types and sizes
- Authenticate users before upload
- Log upload activity
- Use private Drive folders where required

---

## 12. Common Errors & Fixes

| Error | Cause | Fix |
|------|------|-----|
| 403 Permission denied | Folder not shared | Share folder with service account |
| Invalid credentials | Wrong JSON path | Check env variable |
| File too large | Multer limit | Increase fileSize limit |

---

## 13. Production Notes

- Store JSON securely (Vault, Secrets Manager)
- Enable request logging
- Add retry logic for large uploads
- Monitor Google API quotas

---

## 14. Result

After this setup:
- Files uploaded from dashboard go directly to Google Drive
- Backend remains secure and scalable
- MongoDB tracks uploaded documents

---

**Status: Production-ready**

