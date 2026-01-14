# JWT Token Improvements - Implementation Guide

## Current Configuration

**Before (Old values)**:
```env
JWT_EXPIRE=7d          # Access token: 7 days
JWT_REFRESH_EXPIRE=30d # Refresh token: 30 days
```

**After (New values)**:
```env
JWT_EXPIRE=30d         # Access token: 30 days  
JWT_REFRESH_EXPIRE=365d # Refresh token: 1 year
```

---

## Solution 1: Longer Token Lifetimes ✅ (IMPLEMENTED)

### What Changed
- **Access Token**: 7 days → 30 days
- **Refresh Token**: 30 days → 365 days (1 year)

### Benefits
✅ Users stay logged in for 30 days without any action needed  
✅ Even after 30 days, refresh token valid for 1 year  
✅ Minimal changes required  
✅ Already implemented in `.env`

### Security Notes
⚠️ Longer tokens = longer exposure if stolen  
✅ Refresh tokens are stored server-side (can be revoked)  
✅ Still expires eventually (not "never expire")

---

## Solution 2: Auto-Refresh Middleware ✅ (CREATED)

### File Added
`project/src/middleware/autoRefresh.js`

### What It Does
- Checks if access token is close to expiring (< 20% lifetime remaining)
- Automatically issues a new token in response header
- Frontend can detect and use new token seamlessly
- No user interaction required

### How to Enable

#### Option A: Enable Globally (All Routes)
Add to `server.js` after authentication routes:

```javascript
import { autoRefresh } from './middleware/autoRefresh.js';

// Add AFTER all route imports but BEFORE route usage
app.use(autoRefresh); // Enable for all routes

// Then define routes as normal
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// ... rest of routes
```

#### Option B: Enable Per-Route
Add to specific route files:

```javascript
import { autoRefresh } from '../middleware/autoRefresh.js';

// Apply to specific routes
router.get('/profile', authenticate, autoRefresh, getUserProfile);
router.put('/profile', authenticate, autoRefresh, updateProfile);
```

### Frontend Integration
Frontend should check for new token in response headers:

```typescript
// In your API service (lib/api.ts)
const response = await fetch(url, options);

// Check for auto-refreshed token
const newToken = response.headers.get('X-New-Access-Token');
if (newToken) {
  // Update stored token
  localStorage.setItem('token', newToken);
  console.log('Token auto-refreshed');
}

return response.json();
```

---

## Solution 3: Remember Me / Long-Lived Sessions

### Option A: Add "Remember Me" Checkbox
Modify login endpoint to support optional long-lived tokens:

```javascript
// In auth.js login route
router.post('/login', validateLogin, async (req, res) => {
  const { email, password, rememberMe } = req.body;
  
  // Use different expiry based on remember me
  const accessExpire = rememberMe ? '90d' : '30d';
  const refreshExpire = rememberMe ? '730d' : '365d'; // 2 years vs 1 year
  
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: accessExpire
  });
  
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: refreshExpire
  });
  
  // ... rest of login logic
});
```

### Option B: Session Tokens (No Expiry)
Create special "session tokens" stored in database:

```javascript
// New SessionToken model
const sessionTokenSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  deviceInfo: { type: String },
  lastUsed: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Login with session token
router.post('/login-session', async (req, res) => {
  // ... validate user
  
  const sessionToken = crypto.randomBytes(64).toString('hex');
  
  await SessionToken.create({
    userId: user._id,
    token: sessionToken,
    deviceInfo: req.headers['user-agent']
  });
  
  res.json({
    success: true,
    data: {
      sessionToken, // No expiry, validated against DB
      user
    }
  });
});

// Middleware to verify session tokens
export const authenticateSession = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  const session = await SessionToken.findOne({ token });
  if (!session) {
    return res.status(401).json({ message: 'Invalid session' });
  }
  
  // Update last used
  session.lastUsed = new Date();
  await session.save();
  
  req.user = await User.findById(session.userId);
  next();
};
```

---

## Solution 4: Sliding Window Tokens

Keep current expiry but extend it on each request:

```javascript
// Add to autoRefresh.js or create new middleware
export const slidingWindow = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next();
    
    const decoded = jwt.decode(token);
    if (!decoded) return next();
    
    // Always issue new token with full lifetime
    const newToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    res.setHeader('X-New-Access-Token', newToken);
    next();
  } catch (error) {
    next();
  }
};
```

This resets the 30-day timer on every API call, so active users never expire.

---

## Comparison Table

| Solution | User Experience | Security | Complexity |
|----------|----------------|----------|------------|
| **Longer Tokens (Implemented)** | ✅ Great - 30 days | ⚠️ Medium | ✅ Easy |
| **Auto-Refresh (Created)** | ✅ Excellent - Seamless | ✅ Good | ⚠️ Medium |
| **Remember Me** | ✅ Great - User choice | ✅ Good | ⚠️ Medium |
| **Session Tokens** | ✅ Perfect - Never expires | ⚠️ Lower | ❌ Complex |
| **Sliding Window** | ✅ Perfect - Active = logged in | ✅ Good | ⚠️ Medium |

---

## Recommended Implementation Plan

### Phase 1: Current (Immediate) ✅
- [x] Increase token lifetimes (30d access, 365d refresh)
- [x] Create auto-refresh middleware

### Phase 2: Enable Auto-Refresh (5 minutes)
1. Add `autoRefresh` to server.js (global) or specific routes
2. Update frontend to detect `X-New-Access-Token` header
3. Test token refresh flow

### Phase 3: Optional Enhancements (Future)
- [ ] Add "Remember Me" option to login
- [ ] Implement sliding window for active users
- [ ] Add session management UI (view/revoke active sessions)

---

## Testing

### Test Current Setup (No Code Changes Needed)
1. Login and get access token
2. Wait 30 days (or change JWT_EXPIRE to 1m for testing)
3. Access token expires
4. Use refresh token endpoint to get new access token
5. Should work for 365 days

### Test Auto-Refresh (After Enabling)
1. Login and get access token
2. Make API calls periodically
3. Check response headers for `X-New-Access-Token`
4. When token is close to expiry, new token issued automatically
5. Frontend uses new token seamlessly

---

## Security Best Practices

### Do This ✅
- Store refresh tokens in database (already done)
- Use HTTPS in production
- Set strong JWT secrets (change default values in .env)
- Implement token rotation (already done)
- Log token usage for auditing

### Don't Do This ❌
- Don't set JWT_EXPIRE to "never" or "9999d"
- Don't share tokens between users
- Don't store tokens in URL parameters
- Don't skip HTTPS in production

---

## Quick Start (Enable Auto-Refresh Now)

### 1. Update server.js
Add this line after line 73 (after CORS setup, before routes):

```javascript
import { autoRefresh } from './middleware/autoRefresh.js';

// ... existing middleware
app.use(cors());
app.options("*", cors());

// Add auto-refresh (NEW LINE)
app.use(autoRefresh);

// Socket.IO setup
app.set('io', io);
```

### 2. Update Frontend (lib/api.ts or equivalent)
```typescript
async function apiCall(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  
  // Check for refreshed token
  const newToken = response.headers.get('X-New-Access-Token');
  if (newToken) {
    localStorage.setItem('token', newToken);
    console.log('✅ Token auto-refreshed');
  }
  
  return response.json();
}
```

### 3. Test
```bash
# Start server
npm run dev

# Login via API or frontend
# Make API calls
# Watch logs for "Auto-refreshed access token" message
# Check browser console for "✅ Token auto-refreshed"
```

---

## Environment Variables

### Current (Production)
```env
JWT_EXPIRE=30d
JWT_REFRESH_EXPIRE=365d
JWT_SECRET=your-super-secret-jwt-key-here  # CHANGE THIS
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here  # CHANGE THIS
```

### Testing (Short-Lived Tokens)
```env
JWT_EXPIRE=2m          # 2 minutes (test expiry)
JWT_REFRESH_EXPIRE=5m  # 5 minutes (test refresh)
```

---

## Summary

✅ **What's Done**:
- Token lifetimes increased (30d access, 365d refresh)
- Auto-refresh middleware created
- Documentation complete

🔄 **Next Steps**:
1. Enable auto-refresh in server.js (1 line)
2. Update frontend to use new tokens (5 lines)
3. Test and verify

🎯 **Result**: Users stay logged in for 30 days, auto-refresh extends seamlessly, refresh token valid for 1 year.

**No more "token expired" complaints!** 🎉
