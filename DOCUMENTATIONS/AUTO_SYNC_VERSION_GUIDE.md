# Auto-Sync Version Update System

**Automatically trigger app updates when you bump the backend version in package.json**

---

## How It Works

When you change the version in `package.json`, you can automatically create an AppUpdate record that notifies all mobile apps that an update is available.

```json
{
  "version": "1.1.2"
}
```

→ **App Update Created:** Version 1.1.2 will notify apps with older versions

---

## 2 Ways to Trigger Auto-Sync

### Option 1: Node Script (Recommended for CI/CD)

Run during deployment:

```bash
# Default: creates update for android/sales
node src/scripts/sync-version-update.js

# Specify platform
node src/scripts/sync-version-update.js ios

# Specify platform and role
node src/scripts/sync-version-update.js android admin

# Force create even if version exists
node src/scripts/sync-version-update.js android sales --force
```

**Output:**
```
📦 Version Sync Script
============================================================
📄 Package.json version: 1.1.2
📱 Target platform: android
👤 Target role: sales
🔄 Force create: NO

🔗 Connecting to MongoDB...
✅ Connected to MongoDB

✅ AppUpdate Created Successfully!
============================================================
Version: 1.1.2
Platform: android
Target Roles: sales
Active: true
ID: 67a8b9c0d1e2f3g4h5i6j7k8
Created At: 2026-02-03T12:34:56.789Z
============================================================

📢 Apps will be notified on next update check
   Endpoint: POST /api/app-updates/check
   Apps with version < 1.1.2 will see this update
```

---

### Option 2: API Endpoint (Recommended for Manual Testing)

**Endpoint:** `POST /api/app-updates/sync-version`

**Requires:** Admin JWT Token

**Request:**
```bash
curl -X POST https://app.codewithseth.co.ke/api/app-updates/sync-version \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "android",
    "role": "sales",
    "force": false
  }'
```

**Response (New Update Created):**
```json
{
  "success": true,
  "message": "AppUpdate created for version 1.1.2",
  "isNew": true,
  "data": {
    "_id": "67a8b9c0d1e2f3g4h5i6j7k8",
    "version": "1.1.2",
    "platform": "android",
    "targetRoles": ["sales"],
    "releaseNotes": "Automatic deployment update\n\nVersion: 1.1.2\n...",
    "updateMethod": "internal",
    "isActive": true,
    "requiresRestart": true,
    "createdAt": "2026-02-03T12:34:56.789Z"
  }
}
```

**Response (Update Already Exists):**
```json
{
  "success": true,
  "message": "Update already exists",
  "isNew": false,
  "data": {
    "_id": "67a8b9c0d1e2f3g4h5i6j7k8",
    "version": "1.1.2",
    "isActive": true
  }
}
```

---

## Integration with Deployment

### Add to Your Deploy Script

**In `deploy-to-production.sh`:**

```bash
#!/bin/bash

# ... your existing deployment steps ...

# Deploy new backend version
npm install
npm run build

# Sync version to app updates
echo "🔄 Syncing app update version..."
node src/scripts/sync-version-update.js android sales

# Restart server
systemctl restart accord-backend

echo "✅ Deployment complete with app update triggered"
```

### Add to GitHub Actions / CI-CD

```yaml
- name: Sync app version
  run: node src/scripts/sync-version-update.js android sales
  env:
    MONGODB_URI: ${{ secrets.MONGODB_URI }}
```

---

## What Happens When Sync Runs

1. **Reads** `package.json` version
2. **Checks** if AppUpdate already exists for that version
3. **If exists:** Activates it (no duplicate)
4. **If new:** Creates AppUpdate record with:
   - Version from package.json
   - Update method: internal
   - Target platform & role
   - isActive: true
   - Release notes with timestamp

5. **Notifies:** Mobile apps see update on next `/api/app-updates/check` call

---

## Typical Deployment Workflow

```
1. Developer bumps version in package.json
   └─ "version": "1.1.2"

2. Deploy to production
   └─ npm install && npm run start

3. Run sync script
   └─ node src/scripts/sync-version-update.js

4. AppUpdate created in MongoDB
   └─ Version 1.1.2 is now active

5. Mobile apps check for updates
   └─ Apps with version < 1.1.2 get notification
   └─ Apps trigger update flow
```

---

## Manual Testing

### Test After Bumping Version

1. **Bump version in package.json:**
```json
{
  "version": "1.1.3"
}
```

2. **Run sync script:**
```bash
node src/scripts/sync-version-update.js android sales
```

3. **Verify update created:**
```bash
curl -X GET https://app.codewithseth.co.ke/api/app-updates \
  -H "Authorization: Bearer <ADMIN_JWT>"
```

4. **Test app update check:**
```bash
curl -X POST https://app.codewithseth.co.ke/api/app-updates/check \
  -H "Content-Type: application/json" \
  -d '{
    "role": "sales",
    "platform": "android",
    "currentVersion": "1.1.2"
  }'
```

Expected response:
```json
{
  "success": true,
  "updateAvailable": true,
  "update": {
    "version": "1.1.3",
    "platform": "android",
    "updateMethod": "internal",
    ...
  }
}
```

---

## FAQ

**Q: What if I run sync twice with same version?**  
A: Second run won't create duplicate. It will just activate the existing update.

**Q: Can I create updates for multiple platforms?**  
A: Yes! Run the script for each platform:
```bash
node src/scripts/sync-version-update.js android sales
node src/scripts/sync-version-update.js ios sales
```

**Q: What if version format is wrong?**  
A: Script will still create update. Semantic version comparison handles any format.

**Q: Can I force create duplicate?**  
A: Yes, use `--force` flag:
```bash
node src/scripts/sync-version-update.js android sales --force
```

**Q: When do apps see the update?**  
A: On their next call to `/api/app-updates/check` endpoint.

---

## Files Modified

- `src/scripts/sync-version-update.js` - **NEW** - Sync script
- `src/controllers/appUpdateController.js` - Added syncVersionUpdate() method
- `src/routes/appUpdates.js` - Added POST /sync-version endpoint

---

## Quick Commands

```bash
# Create android sales update from package.json version
node src/scripts/sync-version-update.js android sales

# Create ios admin update
node src/scripts/sync-version-update.js ios admin

# Create multiple platforms
node src/scripts/sync-version-update.js android sales && \
node src/scripts/sync-version-update.js ios sales

# Via API (requires admin token)
curl -X POST https://app.codewithseth.co.ke/api/app-updates/sync-version \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"platform": "android", "role": "sales"}'
```

---

**✅ Now when you bump the version, apps automatically get notified!**
