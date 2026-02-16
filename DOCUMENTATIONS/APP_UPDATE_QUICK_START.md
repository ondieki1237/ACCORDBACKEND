# Internal App Update System - Quick Start

**Status:** ✅ Ready to use

---

## How It Works (Simple)

1. **App starts** → Calls `/api/app-updates/check`
2. **Server responds** → "Update available? Yes/No"
3. **If yes** → App gets update data
4. **App applies update** → Internally (no download needed)

That's it! No APK downloads required.

---

## API Endpoint

**Check for Update:**
```
POST /api/app-updates/check
Content-Type: application/json

{
  "role": "sales",           // Required
  "platform": "android",     // Required: android, ios, web
  "currentVersion": "1.0.0"  // Optional: current app version
}
```

**Response:**
```json
{
  "success": true,
  "updateAvailable": false
}
```

Or if update available:
```json
{
  "success": true,
  "updateAvailable": true,
  "update": {
    "version": "1.1.0",
    "releaseNotes": "Bug fixes",
    "internalUpdate": true,
    "updateMethod": "internal",
    "forced": false,
    "requiresRestart": true,
    "updateInstructions": "Restart app to apply updates"
  }
}
```

---

## Create an Update (Admin Only)

**Request:**
```bash
curl -X POST https://app.codewithseth.co.ke/api/app-updates \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.1.0",
    "platform": "android",
    "targetRoles": ["sales"],
    "releaseNotes": "Bug fixes",
    "updateMethod": "internal",
    "forced": false,
    "isActive": true,
    "requiresRestart": true
  }'
```

---

## Update Types

### Type 1: Simple Restart Required
```json
{
  "updateMethod": "internal",
  "bundledCode": null,
  "requiresRestart": true
}
```
App shows message, user restarts.

### Type 2: With Code Patch
```json
{
  "updateMethod": "internal",
  "bundledCode": "console.log('Updated!');",
  "requiresRestart": false
}
```
App applies code immediately.

### Type 3: Forced Update
```json
{
  "forced": true,
  "requiresRestart": true
}
```
User MUST update.

---

## Mobile App Code

### Simple Check (React Native)
```javascript
const checkForUpdate = async () => {
  const response = await fetch('https://app.codewithseth.co.ke/api/app-updates/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'sales',
      platform: 'android',
      currentVersion: '1.0.0'
    })
  });

  const data = await response.json();

  if (data.updateAvailable) {
    if (data.update.forced) {
      showBlockingModal(data.update);
    } else {
      showUpdatePrompt(data.update);
    }
  }
};

const showUpdatePrompt = (update) => {
  Alert.alert(
    'Update Available',
    update.releaseNotes,
    [
      { text: 'Later', onPress: () => {} },
      { text: 'Update Now', onPress: () => {
        if (update.requiresRestart) {
          Alert.alert('Restart', 'Please restart the app');
        }
      }}
    ]
  );
};
```

---

## What Changed

| Before | After |
|--------|-------|
| Had to download APK | No download needed |
| External URLs | Internal API |
| Slow updates | Fast updates |
| Complex setup | Simple setup |

---

## Admin API Endpoints

```
GET  /api/app-updates              List updates
POST /api/app-updates              Create update
GET  /api/app-updates/:id          Get update
PUT  /api/app-updates/:id          Edit update
DELETE /api/app-updates/:id        Delete update
```

All require: `authenticate` + `authorize('admin')`

---

## Test It Now

```bash
# Check for updates (public endpoint - no auth needed)
curl -X POST https://app.codewithseth.co.ke/api/app-updates/check \
  -H "Content-Type: application/json" \
  -d '{"role":"sales","platform":"android","currentVersion":"1.0.0"}'

# Should return:
# {"success":true,"updateAvailable":false}
# or
# {"success":true,"updateAvailable":true,"update":{...}}
```

---

## Key Points

✅ App updates happen **internally**  
✅ No **external downloads**  
✅ Updates are **controlled by admin**  
✅ App can **apply patches instantly**  
✅ Or **require app restart**  
✅ **Forced updates** can be mandated  
✅ **Backward compatible** with external URLs if needed  

---

## Files

- `APP_UPDATE_INTERNAL.md` - Complete guide
- `APP_UPDATE_IMPLEMENTATION.md` - What was implemented

---

**Ready to use!** Apps can now update internally without external downloads.
