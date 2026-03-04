# Password Reset Troubleshooting Guide

## What I've Fixed

✅ **Improved password handling:**
- Added `.trim()` to login password validation
- Added `.trim()` to password reset validation  
- Added explicit trim in reset endpoint: `String(req.body.newPassword).trim()`
- Better logging to show exactly where login fails

✅ **Enhanced debugging:**
- New detailed logging in login endpoint
- Shows if user is found or not
- Shows if password matches or not

## How to Debug Your Issue

### Step 1: Check Server Logs

When you try to login, check the server logs for these messages:

```
info: Login attempt for email: your-email@example.com
info: Password comparison for your-email@example.com: MATCH  (or NO MATCH)
```

If you see:
- **"User not found"** → Email doesn't match what was reset
- **"NO MATCH"** → Password entered doesn't match what was set
- **"MATCH"** → Should work, but something else is wrong

### Step 2: Run the Debug Script

To check what password is actually stored in the database:

```bash
cd /home/seth/Documents/code/ACCORDBACKEND/project
node scripts/debugPasswordReset.js your-email@example.com
```

This will:
- Show if user exists
- Show when password was last changed
- Test several common passwords
- Tell you if the hash looks valid

### Step 3: Check Your Input

**Make sure:**
- ✅ Email is exactly right (case doesn't matter, but spelling does)
- ✅ Password has NO spaces at start or end
- ✅ Password is between 4-8 characters
- ✅ You're using the exact password you set during reset

### Step 4: Complete Password Reset Flow

To do a fresh reset with the test script:

```bash
cd /home/seth/Documents/code/ACCORDBACKEND/project
node scripts/testPasswordReset.js your-email@example.com12345
```

This will:
1. Request a reset code
2. Ask you to enter the code from email
3. Verify the code
4. Reset the password
5. **Test login** to confirm it works

## Common Issues & Solutions

### "Invalid email or password" on login after successful reset

**Likely cause:** The password you entered during reset doesn't match what you're typing on login.

**Solution:**
```bash
# 1. Run reset again, note the exact password you use
node scripts/testPasswordReset.js your-email@example.com

# 2. When asked for the code, get it from your email

# 3. The script will test if login works at the end
# If it fails, your password might have spaces or special characters
```

### Code expires before you can reset

**Cause:** Codes last 10 minutes after request

**Solution:** If it expires, request a new reset code immediately

### Too many reset requests

**Cause:** Rate limit - max 3 requests per email every 15 minutes

**Solution:** Wait 15 minutes between reset requests

## What the Flow Should Look Like

```
1. Request Reset
   POST /api/auth/password-reset/request
   → Sends 6-digit code to email

2. Verify Code  
   POST /api/auth/password-reset/verify
   → Confirms you have the code

3. Reset Password
   POST /api/auth/password-reset/reset
   → Sets new password (hashed automatically)
   → Should log "User password successfully updated"

4. Login
   POST /api/auth/login
   → Compare hashed password with provided password
   → Should work if everything above passed
```

## Next Steps

1. **Check the server logs** - What does it say about your login attempt?
2. **Run the debug script** - See what password is stored
3. **Try the test script** - Does the end-to-end flow work?

Once you provide the debug output, I can tell you exactly what's wrong!
