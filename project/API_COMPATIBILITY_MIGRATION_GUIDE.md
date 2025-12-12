# API Compatibility & Migration Guide

**For:** Frontend & Integration Teams  
**Date:** December 12, 2025  
**Importance:** CRITICAL - Breaking changes from previous version

---

## Overview

The M-Pesa checkout system has been completely restructured to match the frontend specification document (`frontend_summary.md`). This guide helps you migrate from the old API to the new one.

---

## Breaking Changes Summary

| Aspect | Old | New | Impact |
|--------|-----|-----|--------|
| **Base URL** | `/api/checkout` | `/api/orders` | All endpoints changed |
| **Create Endpoint** | `POST /api/checkout/checkout` | `POST /api/orders` | Simpler path |
| **Request Structure** | Simple fields | Nested objects | Complete redesign |
| **Response Format** | Minimal data | Rich facility data | More information |
| **Database Schema** | Client-based | Facility-based | New queries needed |

---

## Old API (DEPRECATED) ❌

### Request Structure
```javascript
POST /api/checkout/checkout
{
  customerName: "string",
  customerEmail: "string",
  customerPhone: "string",
  items: [],
  totalAmount: number,
  paymentMethod: "mpesa"
}
```

### What Happened
- Only captured customer name, email, phone
- No facility information
- No alternative contact
- No delivery details
- Simple item structure

---

## New API (ACTIVE) ✅

### Request Structure
```javascript
POST /api/orders
{
  primaryContact: {
    name: "string",           // Customer placing order
    email: "string",          // Will receive order confirmation
    phone: "254XXXXXXXXX",    // Must be M-Pesa enabled
    jobTitle: "string"        // Their role (e.g., "Medical Director")
  },
  
  facility: {
    name: "string",           // Hospital, clinic, lab name
    registrationNumber: "string", // Optional: MOH registration
    type: "Hospital|Clinic|...", // Must be from enum
    address: "string",        // Street address
    city: "string",           // Nairobi, Mombasa, etc.
    county: "string",         // Kenyan county
    postalCode: "00000",      // Exactly 5 digits
    GPS_coordinates: {        // Optional
      latitude: number,       // -12 to 5
      longitude: number       // 28 to 42
    }
  },
  
  alternativeContact: {
    name: "string",           // Backup person
    email: "string",          // Will receive order confirmation
    phone: "254XXXXXXXXX",    // Backup contact number
    relationship: "string"    // "Procurement Manager", etc.
  },
  
  delivery: {
    location: "string",       // Exact delivery address
    instructions: "string",   // Optional: Special instructions
    preferredDate: "YYYY-MM-DD", // Optional: When to deliver
    preferredTime: "HH:MM-HH:MM"  // Optional: Time window
  },
  
  items: [
    {
      consumableId: "507f...", // MongoDB ID
      name: "string",         // Product name
      quantity: number,       // How many
      price: number,          // Unit price
      specifications: "string" // Optional: Size, color, etc.
    }
  ],
  
  totalAmount: number,        // Must = sum(quantity × price)
  paymentMethod: "mpesa",     // Required
  purchaseOrderNumber: "string", // Optional: PO number
  billingEmail: "string",     // Optional: For invoices
  notes: "string"             // Optional: Special notes
}
```

---

## Endpoint Migration Map

### Create Order

**OLD:**
```bash
POST /api/checkout/checkout
```

**NEW:**
```bash
POST /api/orders
```

**Migration:** Completely new request structure (see above)

---

### Get Order Details

**OLD:**
```bash
GET /api/checkout/ORD-123
```

**NEW:**
```bash
GET /api/orders/ORD-123
```

**Response:** Now includes facility and contact information

---

### Get Customer Orders

**OLD:**
```bash
GET /api/checkout/customer/john@example.com
```

**NEW:**
```bash
GET /api/orders/customer/john@example.com
```

**Improvement:** Searches both primary and alternative contact emails

---

### Check Payment Status

**OLD:**
```bash
GET /api/checkout/status/ws_CO_123
```

**NEW:**
```bash
GET /api/orders/status/ws_CO_123
```

**Same endpoint path structure**

---

### M-Pesa Callback

**OLD:**
```bash
POST /api/checkout/mpesa/callback
```

**NEW:**
```bash
POST /api/orders/mpesa/callback
```

**Same:** Safaricom still sends to this endpoint

---

### Admin Get All Orders

**OLD:**
```bash
GET /api/checkout/admin/all
```

**NEW:**
```bash
GET /api/orders/admin/all
```

**Improved:** Can filter by `orderStatus` instead of just `status`

---

## Validation Rule Changes

### Phone Number

**OLD:** Flexible format allowed  
**NEW:** Must be exactly 254XXXXXXXXX (11 digits)

```
Valid: 254712345678
Valid: 254734567890

Invalid: 0712345678 (missing 254)
Invalid: +254712345678 (has plus sign)
Invalid: 254-712-345-678 (has hyphens)
```

### Email

**OLD:** Basic validation  
**NEW:** Stricter validation

```
Valid: john@hospital.com
Valid: user+hospital@example.co.ke

Invalid: john@
Invalid: @hospital.com
```

### Postal Code

**OLD:** Not validated  
**NEW:** Must be exactly 5 digits

```
Valid: 00100, 40400, 50100

Invalid: 001 (too short)
Invalid: 001-00 (has hyphen)
```

### Amount Verification

**OLD:** Not enforced  
**NEW:** totalAmount MUST equal sum of (quantity × price)

```
✅ Correct:
  Item 1: 50 × 1500 = 75,000
  Item 2: 10 × 5000 = 50,000
  Total: 125,000 ✓

❌ Wrong:
  Item 1: 50 × 1500 = 75,000
  Item 2: 10 × 5000 = 50,000
  Total: 100,000 ✗ Error!
```

---

## Response Format Changes

### Success Response

**OLD:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "ORD-1234",
    "totalAmount": 5000,
    "paymentStatus": "pending",
    "checkoutRequestID": "ws_CO_123"
  }
}
```

**NEW:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "ORD-1702389012345",
    "facility": {
      "name": "Medicenter Hospital",
      "type": "Hospital",
      "location": "Nairobi, Nairobi"
    },
    "primaryContact": {
      "name": "Dr. James Okonkwo",
      "phone": "254712345678"
    },
    "alternativeContact": {
      "name": "Margaret Kipchoge",
      "phone": "254734567890"
    },
    "delivery": {
      "location": "Plot 456, Warehouse Building B",
      "preferredDate": "2024-12-22"
    },
    "totalAmount": 100000,
    "itemCount": 2,
    "paymentStatus": "pending",
    "checkoutRequestID": "ws_CO_12345678901234567890",
    "nextSteps": "M-Pesa STK prompt sent to Dr. James. Contact Margaret if needed."
  }
}
```

---

### Error Response

**OLD:**
```json
{
  "success": false,
  "message": "Phone number must be in format 254XXXXXXXXX"
}
```

**NEW:**
```json
{
  "success": false,
  "message": "Validation error",
  "details": "primaryContact.phone must be in format 254XXXXXXXXX"
}
```

**Improvement:** More structured error with field information

---

## Frontend Form Migration

### Old Form Fields
```
- Customer Name
- Customer Email
- Customer Phone
- Items (in cart)
- Total Amount
```

### New Form Fields Required

**Primary Contact Section**
- Name (text)
- Email (email)
- Phone (254XXXXXXXXX format)
- Job Title (text)

**Facility Section**
- Facility Name (text)
- Facility Type (dropdown)
- Address (text)
- City (text)
- County (dropdown)
- Postal Code (5 digits)
- Registration Number (optional)
- GPS Coordinates (optional)

**Alternative Contact Section**
- Name (text)
- Email (email)
- Phone (254XXXXXXXXX format)
- Relationship (text/dropdown)

**Delivery Section**
- Location (text)
- Instructions (textarea, optional)
- Preferred Date (date picker, optional)
- Preferred Time (time range, optional)

**Order Items**
- From shopping cart
- Can add specifications per item

**Additional Fields**
- Purchase Order Number (optional)
- Billing Email (optional)
- Notes (textarea, optional)

---

## Code Migration Examples

### JavaScript/Fetch - Creating an Order

**OLD CODE:**
```javascript
const response = await fetch('https://app.codewithseth.co.ke/api/checkout/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '254712345678',
    items: [{ name: 'Gloves', quantity: 50, price: 1500 }],
    totalAmount: 75000,
    paymentMethod: 'mpesa'
  })
});
```

**NEW CODE:**
```javascript
const response = await fetch('https://app.codewithseth.co.ke/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    primaryContact: {
      name: 'Dr. John Doe',
      email: 'john@hospital.com',
      phone: '254712345678',
      jobTitle: 'Medical Director'
    },
    facility: {
      name: 'Nairobi Central Hospital',
      type: 'Hospital',
      address: '123 Hospital Lane',
      city: 'Nairobi',
      county: 'Nairobi',
      postalCode: '00100'
    },
    alternativeContact: {
      name: 'Jane Smith',
      email: 'jane@hospital.com',
      phone: '254734567890',
      relationship: 'Procurement Manager'
    },
    delivery: {
      location: '123 Hospital Lane, Building A'
    },
    items: [
      {
        consumableId: '507f1f77bcf86cd799439011',
        name: 'Surgical Gloves',
        quantity: 50,
        price: 1500
      }
    ],
    totalAmount: 75000,
    paymentMethod: 'mpesa'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Order ID:', result.data.orderId);
  console.log('Next steps:', result.data.nextSteps);
}
```

---

## Database Query Changes

### Find Orders by Customer

**OLD:**
```javascript
// Search single email
db.orders.find({ 'client.email': 'john@example.com' })
```

**NEW:**
```javascript
// Search primary or alternative contact email
db.orders.find({
  $or: [
    { 'primaryContact.email': 'john@example.com' },
    { 'alternativeContact.email': 'john@example.com' }
  ]
})
```

---

### Find Orders by Facility

**NEW - Not available in old:**
```javascript
db.orders.find({ 'facility.name': 'Nairobi Central Hospital' })
db.orders.find({ 'facility.county': 'Nairobi' })
db.orders.find({ 'facility.type': 'Hospital' })
```

---

### Find Paid Orders by County

**NEW - Analytics example:**
```javascript
db.orders.find({
  paymentStatus: 'paid',
  'facility.county': 'Nairobi'
}).count()
```

---

## Testing Checklist

### Before Going Live

- [ ] Update frontend form to collect all new fields
- [ ] Update form validation to match backend rules
- [ ] Test phone format validation (254XXXXXXXXX)
- [ ] Test postal code validation (5 digits)
- [ ] Test email validation on both contacts
- [ ] Test amount mismatch detection
- [ ] Test required field validation
- [ ] Test facility type dropdown
- [ ] Verify order creation returns correct structure
- [ ] Test GET /api/orders/:orderId endpoint
- [ ] Test customer orders retrieval with new email logic
- [ ] Test M-Pesa callback still works
- [ ] Verify admin receives 2 emails (sales@ and bellarinseth@)
- [ ] Test payment confirmation emails
- [ ] Verify database stores all facility information
- [ ] Test order filtering by facility type
- [ ] Test delivery information is saved

---

## Timeline

- **Today (Dec 12):** Backend updated ✅
- **Next:** Frontend update to use new endpoints
- **After:** Sandbox testing with M-Pesa
- **Finally:** Production deployment

---

## Support & Questions

For issues or clarifications:
1. Refer to **frontend_summary.md** for complete specifications
2. Check **BACKEND_UPDATES_SUMMARY.md** for technical details
3. Review code examples in this document
4. Test with cURL examples before integrating

---

## Quick Reference Links

- 📄 **frontend_summary.md** - Frontend developer spec (PRIMARY)
- 📄 **BACKEND_UPDATES_SUMMARY.md** - Backend implementation details
- 📄 **MPESA_CHECKOUT_API.md** - Old API docs (DEPRECATED)
- 📄 **API_COMPATIBILITY_MIGRATION_GUIDE.md** - This file

---

**Document Version:** 1.0  
**Last Updated:** December 12, 2025  
**Status:** ✅ Final & Approved
