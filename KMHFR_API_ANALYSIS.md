# KMHFR API Implementation Review & Testing Guide

## Overview
Your backend has a KMHFR proxy layer that wraps the official Kenya Master Health Facility Registry API at `https://kmhfr.vercel.app/api`. This enables your application to access health facility data while adding local business logic.

---

## Implementation Status

### ✅ Well Implemented Endpoints

#### 1. **Health & Status Checks**
```
GET /api/health
GET /api/kmhfr/health
GET /api/kmhfr/status
```
- **Status:** ✅ Implemented
- **Purpose:** Basic connectivity checks
- **Notes:** Good for monitoring backend uptime

#### 2. **Facility Metadata**
```
GET /api/kmhfr/facilities/facility_types
GET /api/kmhfr/facilities/services
GET /api/kmhfr/facilities/infrastructure
```
- **Status:** ✅ Implemented
- **Purpose:** Get available facility types, services, and infrastructure types
- **Use Case:** Populate dropdowns in admin UI

#### 3. **Facility Details**
```
GET /api/kmhfr/facilities/:id/report?format=json|pdf
GET /api/kmhfr/facilities/:id/services
GET /api/kmhfr/facilities/:id/infrastructure
GET /api/kmhfr/facilities/:id/contacts
```
- **Status:** ✅ Implemented
- **Purpose:** Retrieve comprehensive facility information
- **Special Feature:** Report endpoint supports both JSON and PDF formats
- **Notes:** PDF is properly handled as binary response

#### 4. **Geographic/Administrative Data**
```
GET /api/kmhfr/common/counties
GET /api/kmhfr/common/wards?county=COUNTY_NAME
GET /api/kmhfr/common/constituencies?county=COUNTY_NAME
```
- **Status:** ✅ Implemented
- **Special Feature:** Counties endpoint has local fallback (countiesFallback) when KMHFR is down
- **Purpose:** Enable location-based filtering and search

#### 5. **Authentication**
```
POST /api/kmhfr/auth/login
```
- **Status:** ✅ Implemented (proxy)
- **Purpose:** Direct KMHFR authentication (if needed)

---

### ⚠️ Intentionally Disabled Endpoints

These endpoints are **commented out** to avoid conflicts with your local facilities API:

```
GET /api/kmhfr/facilities/search    (DISABLED)
GET /api/kmhfr/facilities           (DISABLED)
GET /api/kmhfr/facilities/:id       (DISABLED)
```

**Reason:** Your local `/api/facilities` endpoint provides superior functionality with authentication and business logic.

---

## Implementation Quality Assessment

### ✅ Strengths

1. **Error Handling**
   - All endpoints wrap axios calls in try-catch
   - Returns structured error responses
   - Graceful fallback for counties data

2. **Response Format Handling**
   - PDF responses properly set `Content-Type: application/pdf`
   - Binary data handled correctly with `responseType: 'arraybuffer'`
   - JSON responses are standard

3. **Configuration**
   - Base URL centralized as `KMHFR_BASE = 'https://kmhfr.vercel.app/api'`
   - Easy to switch to different KMHFR instance

4. **Query Parameters**
   - Proper URI parameter handling
   - Supports county filtering for wards/constituencies

### ⚠️ Potential Improvements

1. **Timeout Handling**
   - Only counties endpoint has explicit timeout (5000ms)
   - Recommend adding timeouts to all endpoints to prevent hanging requests

2. **Response Validation**
   - Counties fallback validates response shape
   - Other endpoints don't validate KMHFR response structure

3. **Rate Limiting**
   - No rate limiting implemented (could add Redis-based throttling)
   - KMHFR API may have rate limits

4. **Caching**
   - No caching for metadata endpoints (facility_types, services, infrastructure)
   - These rarely change and are good candidates for Redis caching

5. **Authentication**
   - KMHFR endpoints are not protected by your JWT auth
   - Consider adding `authenticate` middleware to sensitive endpoints

---

## Testing Guide

### Prerequisites
```bash
# 1. Ensure backend is running
node src/server.js

# 2. Get JWT token (for endpoints that need auth)
# POST to your login endpoint and capture token

# 3. Set Postman variables
# baseUrl = http://localhost:4500
# token = YOUR_JWT_TOKEN
```

---

## API Endpoints to Test

### 1. **Health Checks** (No Auth Required)
```bash
# Test backend connectivity
curl http://localhost:4500/api/health

# Test KMHFR proxy connectivity
curl http://localhost:4500/api/kmhfr/health
```

**Expected Response:**
```json
{ "status": "ok", "timestamp": "2026-03-19T..." }
```

---

### 2. **Metadata Endpoints** (No Auth Required)

#### Get All Counties
```bash
curl http://localhost:4500/api/kmhfr/common/counties
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "code": 1,
      "name": "Nairobi"
    },
    {
      "code": 2,
      "name": "Mombasa"
    }
    // ... more counties
  ]
}
```

#### Get Wards in a County
```bash
curl "http://localhost:4500/api/kmhfr/common/wards?county=Nairobi"
```

#### Get Constituencies
```bash
curl "http://localhost:4500/api/kmhfr/common/constituencies?county=Nairobi"
```

#### Get Facility Types
```bash
curl http://localhost:4500/api/kmhfr/facilities/facility_types
```

#### Get Available Services
```bash
curl http://localhost:4500/api/kmhfr/facilities/services
```

#### Get Infrastructure Types
```bash
curl http://localhost:4500/api/kmhfr/facilities/infrastructure
```

---

### 3. **Facility Details Endpoints**

You'll need a valid facility ID. First, search for a facility using your local API:

```bash
curl "http://localhost:4500/api/facilities?search=hospital&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Then use the `_id` from the response:

#### Get Facility Report (JSON)
```bash
curl "http://localhost:4500/api/kmhfr/facilities/FACILITY_ID/report?format=json"
```

#### Get Facility Report (PDF)
```bash
curl "http://localhost:4500/api/kmhfr/facilities/FACILITY_ID/report?format=pdf" \
  --output facility_report.pdf
```

#### Get Facility Services
```bash
curl http://localhost:4500/api/kmhfr/facilities/FACILITY_ID/services
```

#### Get Facility Infrastructure
```bash
curl http://localhost:4500/api/kmhfr/facilities/FACILITY_ID/infrastructure
```

#### Get Facility Contacts
```bash
curl http://localhost:4500/api/kmhfr/facilities/FACILITY_ID/contacts
```

---

## Using Postman Collection

Your project includes a Postman collection: `postman_kmhfr_local_collection.json`

### Import Steps:
1. Open Postman
2. Click **Import** → Select the JSON file
3. In the collection, set environment variable:
   - `baseUrl` = `http://localhost:4500`
   - `token` = Your JWT token
   - `facilityId` = A valid facility ID

### Test Execution:
- Run individual requests by clicking **Send**
- Run entire collection: Click **...** → **Run collection**

---

## Common Issues & Troubleshooting

### Issue 1: KMHFR Connection Fails
```
Error: "Failed to fetch facilities" 
```

**Causes:**
- KMHFR service is down
- Network connectivity issue
- Rate limiting

**Solution:**
```bash
# Test KMHFR directly
curl https://kmhfr.vercel.app/api/health
```

---

### Issue 2: Timeout Errors
```
Error: "ECONNABORTED" or request hangs
```

**Causes:**
- No timeout set on request
- KMHFR server slow
- Network latency

**Solution:**
- Increase timeout in kmhfr.js:
```javascript
const response = await axios.get(url, { timeout: 10000 }); // 10 seconds
```

---

### Issue 3: Invalid Facility ID
```
Error: "Facility not found"
```

**Solution:**
- Ensure facility ID is valid ObjectId format
- Check that facility exists in KMHFR database
- Use your local `/api/facilities` API to find valid IDs

---

## Performance Considerations

### Current Performance
- No caching → Repeated requests query KMHFR every time
- No rate limiting → Could hit API limits under high load

### Optimization Recommendations

#### 1. **Add Caching for Metadata**
```javascript
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour TTL

router.get('/common/counties', async (req, res) => {
  try {
    const cached = cache.get('counties');
    if (cached) return res.json(cached);
    
    const response = await axios.get(`${KMHFR_BASE}/common/counties/`);
    cache.set('counties', response.data);
    res.json(response.data);
  } catch (err) {
    // fallback logic
  }
});
```

#### 2. **Add Timeouts to All Endpoints**
```javascript
const config = { 
  timeout: 5000,  // 5 second timeout
  responseType: 'json'
};
const response = await axios.get(url, config);
```

#### 3. **Add Rate Limiting**
```javascript
import rateLimit from 'express-rate-limit';

const kmhfrLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

router.use(kmhfrLimiter);
```

---

## Production Checklist

- [ ] All KMHFR endpoints have 5-10 second timeouts
- [ ] Error responses are logged for debugging
- [ ] Metadata endpoints are cached
- [ ] Rate limiting is configured
- [ ] KMHFR base URL is in environment variables (not hardcoded)
- [ ] API key for KMHFR is stored in env (if required)
- [ ] All responses include proper error handling
- [ ] Postman tests are passing
- [ ] Load testing done (especially for metadata endpoints)

---

## Additional Resources

**Official KMHFR Documentation:**
- Base: https://kmhfr.vercel.app
- API: https://kmhfr.vercel.app/api

**Your Implementation Files:**
- Routes: `src/routes/kmhfr.js`
- Postman Collection: `postman_kmhfr_local_collection.json`
- Facilities API: `FACILITIES_API.md`

---

## Recommendations for Your ACCORD System

### Integration Points
1. **Admin Dashboard:** Use facility metadata to populate dropdowns
2. **Telesales Page:** Fetch facility info when adding new clients
3. **Reports:** Use facility reports for compliance documentation
4. **Analytics:** Aggregate facility data with ACCORD metrics

### Best Practices
1. Always use local facilities API (`/api/facilities`) for your primary queries
2. Use KMHFR proxy only for metadata and detailed reports
3. Cache frequently-accessed data (counties, services, facility types)
4. Implement proper error handling and user feedback

---

## Summary

**Overall Assessment: ✅ GOOD IMPLEMENTATION**

- Proper error handling
- Smart fallback mechanism for counties
- Good separation of local vs. proxy endpoints
- Well-structured endpoint organization

**Ready for Production:** Yes, with minor optimizations for caching and timeouts

---

