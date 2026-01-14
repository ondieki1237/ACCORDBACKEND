# PDF Catalog Routes Integration Guide

## Overview
This guide shows how to optionally integrate the PDF catalog API routes into your existing Express server (if you want HTTP endpoints).

**Important:** This is completely optional. The CLI tool works standalone without any changes to your backend.

---

## Step 1: Locate Your Server File

Find your main server file:
```bash
# Usually one of these:
- /project/src/server.js
- /project/src/app.js
- /project/index.js
```

---

## Step 2: Add the Routes Import

At the top of your server file, add:

```javascript
import catalogRoutes from './routes/catalogs.js';
```

Example in context:
```javascript
import express from 'express';
import cors from 'cors';
// ... other imports ...
import catalogRoutes from './routes/catalogs.js';  // ← Add this line

const app = express();
```

---

## Step 3: Register the Routes

Add the routes to your Express app. Choose the appropriate location:

### Option A: Public Routes (Recommended)
Add after your other public routes:

```javascript
// Public API routes
app.use('/api/machines', machinesRouter);
app.use('/api/catalogs', catalogRoutes);  // ← Add this line
app.use('/api/reports', reportsRouter);
// ... other routes ...
```

### Option B: Protected Routes
If you want to require authentication for all catalog endpoints:

```javascript
// Protected API routes (require auth)
app.use('/api/admin', authenticate, adminRouter);
app.use('/api/catalogs', authenticate, catalogRoutes);  // ← Add this line
```

---

## Step 4: Complete Example

Here's what a typical section of your server.js might look like:

```javascript
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { authenticate } from './middleware/authMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import route modules
import machinesRouter from './routes/machines.js';
import reportsRouter from './routes/reports.js';
import usersRouter from './routes/users.js';
import catalogRoutes from './routes/catalogs.js';  // ← Add this

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/machines', machinesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/users', authenticate, usersRouter);
app.use('/api/catalogs', catalogRoutes);  // ← Add this (can be protected or public)

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Step 5: Make Authentication Optional (Advanced)

If you want some endpoints to require auth and others not:

```javascript
// In server.js - create a protected router
import { Router } from 'express';
import { authenticate } from './middleware/authMiddleware.js';
import catalogRoutes from './routes/catalogs.js';

const protectedCatalogRoutes = Router();

// Require auth for generation endpoints
protectedCatalogRoutes.post('/generate', authenticate, catalogRoutes);
protectedCatalogRoutes.post('/generate-data', authenticate, catalogRoutes);
protectedCatalogRoutes.get('/list', authenticate, catalogRoutes);
protectedCatalogRoutes.delete('/:filename', authenticate, catalogRoutes);

// Allow public download
protectedCatalogRoutes.get('/:filename', catalogRoutes);

app.use('/api/catalogs', protectedCatalogRoutes);
```

---

## Step 6: Test the Integration

After adding the routes:

```bash
# 1. Restart your server
npm run dev
# or
npm start

# 2. Test an endpoint with curl
curl -X POST http://localhost:5000/api/catalogs/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apiUrl": "http://localhost:5000/api/machines",
    "company": "ACCORD Medical"
  }'

# 3. Or import the Postman collection
# File: postman_pdf_catalog_collection.json
```

---

## Step 7: Verify Installation

Check that routes are accessible:

```bash
# List all catalogs (if no auth required)
curl http://localhost:5000/api/catalogs/list

# Or with auth
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/catalogs/list
```

---

## Troubleshooting

### Issue: "Cannot find module './routes/catalogs.js'"

**Solution:** Make sure the file exists:
```bash
ls -la src/routes/catalogs.js
```

If not, the file may not have been created. Check the main implementation guide.

### Issue: "SyntaxError: Unexpected token..."

**Solution:** Make sure you're using ES6 import syntax:
```javascript
// ✅ Correct
import catalogRoutes from './routes/catalogs.js';

// ❌ Wrong (CommonJS)
const catalogRoutes = require('./routes/catalogs.js');
```

### Issue: Endpoints return 404

**Solution:** Check the route is registered:
```bash
# Search for catalogRoutes in server.js
grep -n "catalogRoutes" src/server.js
```

Should return something like:
```
15: import catalogRoutes from './routes/catalogs.js';
45: app.use('/api/catalogs', catalogRoutes);
```

### Issue: Authentication errors

**Solution:** Make sure you're including the Bearer token:
```bash
# ✅ Correct
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:5000/api/catalogs/generate

# ❌ Missing token
curl http://localhost:5000/api/catalogs/generate
```

---

## API Endpoints

After integration, you'll have these endpoints:

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/catalogs/generate` | Yes | Generate PDF from API |
| POST | `/api/catalogs/generate-data` | Yes | Generate PDF from data |
| GET | `/api/catalogs/list` | Yes | List all catalogs |
| GET | `/api/catalogs/:filename` | No | Download PDF |
| DELETE | `/api/catalogs/:filename` | Admin | Delete PDF |

---

## Alternative: No Integration Needed

Remember: **You don't need to do any of this.**

The CLI tool works standalone:
```bash
node scripts/pdf-generator.js --api=http://localhost:5000/api/machines
```

Only add routes if you want HTTP endpoints for your admin panel or frontend.

---

## Rolling Back

If you want to remove the routes later:

### Step 1: Remove the import
```javascript
// Delete this line
import catalogRoutes from './routes/catalogs.js';
```

### Step 2: Remove the route registration
```javascript
// Delete this line
app.use('/api/catalogs', catalogRoutes);
```

### Step 3: Restart server
```bash
npm run dev
```

That's it - endpoints will be gone, backend unchanged.

---

## Summary

- ✅ Add one import line
- ✅ Add one app.use() line
- ✅ Restart server
- ✅ Done!

No changes to existing code, no disruption to other routes.

---

*Optional Integration Guide - PDF Catalog Generator*
