# Daraja STK Push Sandbox Troubleshooting Guide

## Problem: First STK Push Works, Second Fails (No Prompt Sent)

This is **100% expected behavior** in Daraja sandbox. Here's exactly what's happening and how to fix it.

---

## Why This Happens

### 1. Phone Number Gets "Locked" After First Push

When Safaricom sends an STK push to a number, it **reserves that number** until:
- ✅ User enters PIN (transaction completes)
- ⏱️ Timeout expires (usually 60-120 seconds)
- ❌ User declines prompt

If you send another STK push **before** one of these happens, Safaricom rejects it with:
- `"Unable to lock subscriber"`
- `"Request cancelled by user"` (even if user didn't cancel)

### 2. Sandbox is STRICT

Production Daraja is more forgiving. Sandbox enforces limits strictly to catch bugs early.

### 3. Different numbers = Different locks

Each phone number has its own "lock". So:
- Number A locked ❌
- Number B available ✅
- Number C available ✅

---

## ✅ Solutions

### Solution 1: Use Different Test Numbers (RECOMMENDED)

**For each new test, use a different phone number:**

| Number | Status | Use When |
|--------|--------|----------|
| `254708374149` | First attempt | Initial test |
| `254712345678` | When 149 locked | Second test |
| `254799012345` | When 678 locked | Third test |
| `254701234567` | When 345 locked | Fourth test |

**How to test:**

1. **Get available test numbers:**
   ```
   GET https://app.codewithseth.co.ke/api/orders/debug/test-numbers
   ```

2. **Test STK with each number (in order):**
   ```
   POST https://app.codewithseth.co.ke/api/orders/debug/stk-push-test
   Body:
   {
     "phoneNumber": "254708374149",
     "amount": 1
   }
   ```

3. **If you get "Unable to lock subscriber":**
   - ✅ That number is locked
   - ✅ Try the next number
   - ✅ Or wait 1-2 minutes and try again

### Solution 2: Wait Before Retrying

After each STK push attempt:
- ⏱️ **Wait 1-2 minutes minimum**
- ⏱️ Then retry the **same number**

Timeline:
```
T=0:00   First STK push to 254708374149 ✅ Sent
T=1:30   Retry to 254708374149 ❌ "Unable to lock"
T=2:10   Retry to 254708374149 ❌ Still locked
T=3:00   Retry to 254708374149 ✅ Works (lock expired)
```

### Solution 3: Use Your Own Number (In Sandbox)

**Only works if:**
1. `MPESA_USE_TEST_PHONE=false` is set on server
2. You're in sandbox environment
3. You restart the server after setting env var

**Steps:**

1. SSH to your server
2. Edit `.env`:
   ```
   MPESA_USE_TEST_PHONE=false
   ```
3. Restart Node:
   ```bash
   pm2 restart server_name
   ```
4. Test with your phone:
   ```
   POST https://app.codewithseth.co.ke/api/orders/debug/stk-push-test
   Body:
   {
     "phoneNumber": "254YOUR_ACTUAL_PHONE_HERE",
     "amount": 1
   }
   ```
5. ✅ You should receive STK prompt on your phone

---

## 🔍 How to Debug Exactly What Failed

When you get an error, check the **exact response** from Daraja.

### Example 1: Success Response
```json
{
  "success": true,
  "message": "STK push test initiated",
  "data": {
    "success": true,
    "CheckoutRequestID": "ws_CO_12345678...",
    "MerchantRequestID": "abc123...",
    "ResponseDescription": "Success. Request accepted for processing"
  }
}
```
✅ **This means STK was sent to phone**

### Example 2: Locked Number Response
```json
{
  "success": false,
  "message": "STK push test failed",
  "error": "Unable to lock subscriber"
}
```
❌ **Number is locked. Use different number or wait.**

### Example 3: Invalid Credentials Response
```json
{
  "success": false,
  "message": "STK push test failed",
  "error": "Invalid access token"
}
```
❌ **Check MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET in .env**

### Example 4: Wrong Passkey Response
```json
{
  "success": false,
  "message": "STK push test failed",
  "error": "Wrong credentials"
}
```
❌ **Check MPESA_PASSKEY in .env**

---

## Testing Checklist (Step-by-Step)

### Phase 1: Validate Environment (5 mins)
- [ ] Check logs for: "M-Pesa access token generated successfully"
- [ ] Check logs for: "Initiating STK Push - URL: https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
- [ ] Verify environment variables are set:
  ```bash
  echo $MPESA_CONSUMER_KEY
  echo $MPESA_BUSINESS_SHORT_CODE
  echo $MPESA_ENVIRONMENT
  ```

### Phase 2: Test STK Push Debug Endpoint (10 mins)
- [ ] **Step 1:** Call `GET /api/orders/debug/test-numbers`
  - Copy the first test number
- [ ] **Step 2:** Call `POST /api/orders/debug/stk-push-test`
  - Use first test number
  - Amount: `1`
  - Expected: `CheckoutRequestID` in response
- [ ] **Step 3:** Check server logs
  - Look for: `"Using phone number: 254708374149..."`
  - Look for: `"STK Push initiated successfully: {CheckoutRequestID}"`
  - If error, paste the exact error message

### Phase 3: Test Complete Order Flow (10 mins)
- [ ] **Step 1:** Call `POST /api/orders` with full order data
  - Use same test number
  - Expected: Order created, STK initiated
- [ ] **Step 2:** Check your phone
  - Do you see M-Pesa STK prompt?
  - If YES ✅ → Continue to payment
  - If NO ❌ → Try different number
- [ ] **Step 3:** If you complete payment
  - Call `GET /api/orders/{orderId}` 
  - Expected: `paymentStatus: "paid"`
  - Expected: `mpesaDetails` with receipt number

### Phase 4: Receipt Verification (5 mins)
- [ ] **Step 1:** Call `GET /api/orders/{orderId}/receipt`
  - Expected: `receiptNumber`, all order details
- [ ] **Step 2:** Verify all fields present
  - primaryContact, facility, items, totalAmount, mpesaDetails

---

## Server-Side Logs to Check

SSH to server and watch logs:

```bash
pm2 logs app
```

**Look for these patterns:**

✅ **Success:**
```
M-Pesa access token generated successfully
Initiating STK Push
Using phone number: 254708374149
STK Push initiated successfully: ws_CO_12345...
```

❌ **Failure:**
```
STK Push failed: Unable to lock subscriber
STK Push failed: Wrong credentials
Initiate STK Push error response: { errorCode: "500.001.1001" }
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Unable to lock subscriber` | Number locked in sandbox | Use different test number or wait 2 min |
| `Wrong credentials` | Incorrect passkey/consumer secret | Verify MPESA_PASSKEY in .env |
| `Invalid access token` | Expired or invalid consumer key/secret | Verify MPESA_CONSUMER_KEY/SECRET in .env |
| `Connection refused` | Can't reach Daraja API | Check MPESA_ENVIRONMENT=sandbox |
| `Empty response` | Callback URL issue | Verify MPESA_CALLBACK_URL is publicly reachable |
| `No STK prompt on phone` | MPESA_USE_TEST_PHONE still true | Set MPESA_USE_TEST_PHONE=false in .env and restart |

---

## Quick Testing Script

Use this Postman collection:

**File:** `DARAJA_STK_DEBUG_POSTMAN.json`

**Steps:**

1. Import the collection into Postman
2. Set `baseUrl` to `https://app.codewithseth.co.ke`
3. Run requests in order:
   - `Get Available Test Numbers`
   - `Test STK Push - Default`
   - `Check Order Status` (if got CheckoutRequestID)
   - `Get Receipt` (if payment completed)

---

## What NOT to Do ❌

- ❌ **Don't spam the same number** - Wait 1-2 minutes between retries
- ❌ **Don't use production credentials in sandbox** - They won't work
- ❌ **Don't hardcode phone numbers** - Rotate test numbers
- ❌ **Don't ignore lock errors** - They're expected and recoverable
- ❌ **Don't skip the callback handler** - It must return 200 OK

---

## What TO Do ✅

- ✅ **Use rotation of test numbers** - 4+ different numbers available
- ✅ **Wait between retries** - 1-2 minutes is safe
- ✅ **Check logs for exact errors** - They tell you what's wrong
- ✅ **Return 200 OK from callback** - Always, even on error
- ✅ **Test with debug endpoints first** - Before full orders

---

## Next Steps After Confirming It Works

Once you successfully:
1. ✅ Send STK push
2. ✅ Receive M-Pesa prompt on phone
3. ✅ Complete payment on phone
4. ✅ Receive callback
5. ✅ See `paymentStatus: "paid"` in order
6. ✅ Generate receipt

**Then:**
- Move credentials to production Daraja app
- Update MPESA_ENVIRONMENT=production
- Update all MPESA_* env variables to production values
- Test again with real customer

---

## Questions? Debug Endpoints Available

All these endpoints return detailed logs:

```
GET  /api/orders/debug/test-numbers        → List all test numbers
POST /api/orders/debug/stk-push-test       → Test STK without creating order
GET  /api/orders/:orderId                  → Check order status
GET  /api/orders/:orderId/receipt          → Get receipt data
POST /api/orders                            → Create order + trigger STK
```

**Remove these debug endpoints before production deployment!**

