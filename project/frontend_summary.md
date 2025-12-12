# Frontend Checkout Documentation - Complete Guide

**Version:** 2.1  
**Updated:** December 12, 2025  
**Status:** ✅ Production Ready  
**For:** Frontend developers building the checkout form and integration

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [API Overview](#api-overview)
3. [Complete API Endpoints](#complete-api-endpoints)
4. [Field Reference](#field-reference)
5. [Request Structure](#request-structure)
6. [Response Examples](#response-examples)
7. [Code Examples](#code-examples)
8. [Validation Rules](#validation-rules)
9. [Error Handling](#error-handling)
10. [Testing Guide](#testing-guide)
11. [Implementation Checklist](#implementation-checklist)

---

## Quick Start

### API Base URL
```
https://app.codewithseth.co.ke/api
```

### Environment Variables (Already Set)
```env
# M-Pesa
MPESA_CONSUMER_KEY=P3AsJFMLRQ1YBfUW0izBhGFIUII5Q7TAouxWJhpXjCtsRoZ8
MPESA_CONSUMER_SECRET=ym2yQuCk97gaVKc0iZT3K0CECgtx8oQFyAQ36GIRFx9b7wY5W1xfs7AiGNzIqCTI
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd1a503b6e78e64204813acb8394076885535da0d7
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://app.codewithseth.co.ke/api/orders/mpesa/callback

# Email Notifications
ORDER_NOTIFICATION_EMAILS=sales@accordmedical.co.ke,bellarinseth@gmail.com
```

### Fastest Test (cURL)
```bash
curl -X POST https://app.codewithseth.co.ke/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "primaryContact": {
      "name": "Dr. John Doe",
      "email": "john@hospital.com",
      "phone": "254712345678",
      "jobTitle": "Medical Director"
    },
    "facility": {
      "name": "Nairobi Central Hospital",
      "type": "Hospital",
      "address": "123 Hospital Lane",
      "city": "Nairobi",
      "county": "Nairobi",
      "postalCode": "00100"
    },
    "alternativeContact": {
      "name": "Jane Smith",
      "email": "jane@hospital.com",
      "phone": "254734567890",
      "relationship": "Manager"
    },
    "delivery": {
      "location": "123 Hospital Lane, Building A"
    },
    "items": [{
      "consumableId": "507f1f77bcf86cd799439011",
      "name": "Surgical Gloves",
      "quantity": 2,
      "price": 1500
    }],
    "totalAmount": 3000,
    "paymentMethod": "mpesa"
  }' | jq
```

---

## API Overview

The M-Pesa Checkout system allows customers to purchase consumables with instant M-Pesa payment verification. All transactions are stored in the database with complete status tracking.

**Key Features:**
- ✅ STK Push payment (M-Pesa)
- ✅ Complete facility information capture
- ✅ Primary and alternative contacts
- ✅ Delivery location and instructions
- ✅ Real-time payment status updates
- ✅ Email notifications (customer + admin)
- ✅ Order history retrieval

**Payment Status:** 
- Successful payments → Email notifications sent to `sales@accordmedical.co.ke` and `bellarinseth@gmail.com`
- Failed payments → Logged in database
- All transactions stored with full details

---

## Complete API Endpoints

### 1. Create Order and Initiate M-Pesa Payment

**Endpoint:**
```
POST /api/orders
```

**Description:** Creates a new order and initiates M-Pesa STK Push payment prompt.

**Authentication:** Not required (Public)

**Response Code:** 201 (Success) or 400/500 (Error)

---

### 2. Get Order Details

**Endpoint:**
```
GET /api/orders/:orderId
```

**Description:** Retrieve complete order details including payment status.

**Authentication:** Not required

**Example:**
```bash
curl https://app.codewithseth.co.ke/api/orders/ORD-1702389012345ABC
```

---

### 3. Get Customer Orders

**Endpoint:**
```
GET /api/orders/customer/:email
```

**Description:** Get all orders for a specific customer by email.

**Example:**
```bash
curl https://app.codewithseth.co.ke/api/orders/customer/john@example.com
```

---

### 4. Check Payment Status

**Endpoint:**
```
GET /api/orders/status/:checkoutRequestID
```

**Description:** Check real-time payment status for a checkout request.

**Example:**
```bash
curl https://app.codewithseth.co.ke/api/orders/status/ws_CO_12345678
```

---

### 5. M-Pesa Callback Handler

**Endpoint:**
```
POST /api/orders/mpesa/callback
```

**Description:** Receives M-Pesa payment status callbacks (automatic, called by Safaricom).

**Called By:** Safaricom M-Pesa API (automatic)

---

### 6. Admin Get All Orders

**Endpoint:**
```
GET /api/orders/admin/all?page=1&limit=20&status=pending&paymentStatus=paid
```

**Description:** Get all orders with filtering (Admin only).

---

## Field Reference

### PRIMARY CONTACT (Required)

The person placing the order and receiving M-Pesa payment prompt.

| Field | Type | Required | Format | Example |
|-------|------|----------|--------|---------|
| `name` | string | ✅ Yes | 3-100 chars | "Dr. John Doe" |
| `email` | string | ✅ Yes | Valid email | "john@hospital.com" |
| `phone` | string | ✅ Yes | 254XXXXXXXXX | "254712345678" |
| `jobTitle` | string | ✅ Yes | 3-50 chars | "Medical Director" |

---

### FACILITY INFORMATION (Required)

Complete details about the hospital, clinic, lab, or pharmacy.

| Field | Type | Required | Format | Example |
|-------|------|----------|--------|---------|
| `name` | string | ✅ Yes | 5-150 chars | "Nairobi Central Hospital" |
| `registrationNumber` | string | ❌ No | Alphanumeric | "MOH/2024/001" |
| `type` | string | ✅ Yes | Enum | "Hospital" |
| `address` | string | ✅ Yes | 10-200 chars | "123 Hospital Lane" |
| `city` | string | ✅ Yes | 2-50 chars | "Nairobi" |
| `county` | string | ✅ Yes | Valid county | "Nairobi" |
| `postalCode` | string | ✅ Yes | 5 digits | "00100" |
| `GPS_coordinates.latitude` | number | ❌ No | -12 to 5 | -1.2921 |
| `GPS_coordinates.longitude` | number | ❌ No | 28 to 42 | 36.8219 |

**Facility Types:** Hospital, Clinic, Medical Center, Laboratory, Pharmacy, Dispensary, Health Center, Private Practice, Diagnostic Center, Nursing Home

---

### ALTERNATIVE CONTACT (Required)

Backup contact person when primary is unavailable.

| Field | Type | Required | Format | Example |
|-------|------|----------|--------|---------|
| `name` | string | ✅ Yes | 3-100 chars | "Jane Smith" |
| `email` | string | ✅ Yes | Valid email | "jane@hospital.com" |
| `phone` | string | ✅ Yes | 254XXXXXXXXX | "254734567890" |
| `relationship` | string | ✅ Yes | 3-50 chars | "Procurement Manager" |

---

### DELIVERY INFORMATION (Required)

Specific delivery location and preferences.

| Field | Type | Required | Format | Example |
|-------|------|----------|--------|---------|
| `location` | string | ✅ Yes | 10-300 chars | "123 Hospital Lane, Building B" |
| `instructions` | string | ❌ No | 0-500 chars | "Use loading dock at rear" |
| `preferredDate` | string | ❌ No | YYYY-MM-DD | "2024-12-20" |
| `preferredTime` | string | ❌ No | HH:MM-HH:MM | "08:00-12:00" |

---

### ORDER ITEMS (Required)

Products being ordered.

| Field | Type | Required | Format | Example |
|-------|------|----------|--------|---------|
| `consumableId` | string | ✅ Yes | MongoDB ID | "507f1f77bcf86cd799439011" |
| `name` | string | ✅ Yes | 1-200 chars | "Surgical Gloves" |
| `quantity` | number | ✅ Yes | Positive int | 50 |
| `price` | number | ✅ Yes | Positive number | 1500 |
| `specifications` | string | ❌ No | 0-200 chars | "Sterile, Size M, Latex-free" |

---

### PAYMENT & OPTIONAL (Required/Optional)

| Field | Type | Required | Format | Example |
|-------|------|----------|--------|---------|
| `totalAmount` | number | ✅ Yes | Sum of items | 5500 |
| `paymentMethod` | string | ✅ Yes | "mpesa" | "mpesa" |
| `purchaseOrderNumber` | string | ❌ No | 0-50 chars | "PO-2024-001" |
| `billingEmail` | string | ❌ No | Valid email | "accounting@hospital.com" |
| `notes` | string | ❌ No | 0-1000 chars | "Urgent for ICU" |

---

## Request Structure

### Complete Request Example

```json
{
  "primaryContact": {
    "name": "Dr. James Okonkwo",
    "email": "james@medicenter.co.ke",
    "phone": "254712345678",
    "jobTitle": "Medical Director"
  },
  
  "facility": {
    "name": "Medicenter Hospital Nairobi",
    "registrationNumber": "MOH/2024/5432",
    "type": "Hospital",
    "address": "Plot 456, Health Park Road",
    "city": "Nairobi",
    "county": "Nairobi",
    "postalCode": "00200",
    "GPS_coordinates": {
      "latitude": -1.3202,
      "longitude": 36.8000
    }
  },
  
  "alternativeContact": {
    "name": "Margaret Kipchoge",
    "email": "margaret@medicenter.co.ke",
    "phone": "254734567890",
    "relationship": "Procurement Manager"
  },
  
  "delivery": {
    "location": "Plot 456, Warehouse Building B",
    "instructions": "Call Samuel at 0723456789 upon arrival",
    "preferredDate": "2024-12-22",
    "preferredTime": "09:00-14:00"
  },
  
  "items": [
    {
      "consumableId": "507f1f77bcf86cd799439011",
      "name": "Surgical Gloves",
      "quantity": 50,
      "price": 1500,
      "specifications": "Sterile, Size M, Latex-free"
    },
    {
      "consumableId": "507f1f77bcf86cd799439012",
      "name": "N95 Face Masks",
      "quantity": 10,
      "price": 5000,
      "specifications": "N95 rated, FDA approved"
    }
  ],
  
  "totalAmount": 100000,
  "paymentMethod": "mpesa",
  "purchaseOrderNumber": "PO-2024-DEC-001",
  "billingEmail": "finance@medicenter.co.ke",
  "notes": "Emergency order for ICU expansion"
}
```

---

## Response Examples

### Success Response (201)

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "ORD-1702389012345",
    "facility": {
      "name": "Medicenter Hospital Nairobi",
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

### Error Response (400)

```json
{
  "success": false,
  "message": "Validation error",
  "details": "primaryContact.phone must be in format 254XXXXXXXXX"
}
```

### Error Response (500)

```json
{
  "success": false,
  "message": "Failed to create order",
  "error": "Invalid credentials or database error"
}
```

### Get Order Response

```json
{
  "success": true,
  "data": {
    "_id": "507f...",
    "orderNumber": "ORD-1702389012345",
    "primaryContact": {
      "name": "Dr. James Okonkwo",
      "email": "james@medicenter.co.ke",
      "phone": "254712345678"
    },
    "facility": {
      "name": "Medicenter Hospital Nairobi",
      "address": "Plot 456, Health Park Road",
      "city": "Nairobi",
      "county": "Nairobi",
      "postalCode": "00200"
    },
    "items": [
      {
        "productName": "Surgical Gloves",
        "quantity": 50,
        "unitPrice": 1500
      }
    ],
    "totalAmount": 100000,
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "createdAt": "2024-12-12T10:30:00.000Z"
  }
}
```

---

## Code Examples

### JavaScript (Fetch API)

```javascript
// Create order
async function createOrder(orderData) {
  try {
    const response = await fetch('https://app.codewithseth.co.ke/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('Order created:', result.data.orderId);
      console.log('Checkout ID:', result.data.checkoutRequestID);
      // Customer sees M-Pesa prompt on their phone
    } else {
      console.error('Error:', result.details);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Check payment status
async function checkPaymentStatus(checkoutRequestID) {
  try {
    const response = await fetch(
      `https://app.codewithseth.co.ke/api/orders/status/${checkoutRequestID}`
    );
    const result = await response.json();

    if (result.success) {
      console.log('Payment Status:', result.paymentStatus);
      // pending, paid, or cancelled
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Get order details
async function getOrder(orderId) {
  try {
    const response = await fetch(
      `https://app.codewithseth.co.ke/api/orders/${orderId}`
    );
    const result = await response.json();

    if (result.success) {
      console.log('Order:', result.data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

const API_BASE = 'https://app.codewithseth.co.ke/api/orders';

// Create order
async function createOrder(orderData) {
  try {
    const { data } = await axios.post(`${API_BASE}`, orderData);
    return data;
  } catch (error) {
    console.error('Error:', error.response?.data);
    throw error;
  }
}

// Get order
async function getOrder(orderId) {
  try {
    const { data } = await axios.get(`${API_BASE}/${orderId}`);
    return data;
  } catch (error) {
    console.error('Error:', error.response?.data);
    throw error;
  }
}

// Check payment status
async function checkStatus(checkoutRequestID) {
  try {
    const { data } = await axios.get(`${API_BASE}/status/${checkoutRequestID}`);
    return data;
  } catch (error) {
    console.error('Error:', error.response?.data);
    throw error;
  }
}
```

### React Component

```jsx
import React, { useState } from 'react';

export function CheckoutForm() {
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState(null);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://app.codewithseth.co.ke/api/orders',
        {
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
              relationship: 'Manager'
            },
            delivery: {
              location: '123 Hospital Lane, Building A'
            },
            items: [{
              consumableId: '507f1f77bcf86cd799439011',
              name: 'Surgical Gloves',
              quantity: 2,
              price: 1500
            }],
            totalAmount: 3000,
            paymentMethod: 'mpesa'
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        setOrderId(result.data.orderId);
        alert(`Order created! Check your phone for M-Pesa prompt.`);
        // Poll for payment status
        pollPaymentStatus(result.data.checkoutRequestID);
      } else {
        setError(result.details || 'Order creation failed');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = (checkoutRequestID) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `https://app.codewithseth.co.ke/api/orders/status/${checkoutRequestID}`
        );
        const result = await response.json();

        if (result.paymentStatus === 'paid') {
          clearInterval(interval);
          alert('✅ Payment received!');
        } else if (result.paymentStatus === 'cancelled') {
          clearInterval(interval);
          alert('❌ Payment cancelled. Try again.');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds
  };

  return (
    <form onSubmit={handleCheckout}>
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Checkout with M-Pesa'}
      </button>
      {orderId && <p>Order: {orderId}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
```

---

## Validation Rules

### Phone Number Format

```
Format: 254XXXXXXXXX (exactly 11 digits)

Valid Examples:
- 254712345678
- 254734567890
- 254708374149

Invalid Examples:
- +254712345678 (has plus sign)
- 0712345678 (missing country code)
- 254-712-345-678 (has hyphens)
```

### Email Format

```
Valid Examples:
- user@hospital.co.ke
- john.doe@example.com
- accounting+hospital@example.com

Invalid Examples:
- john@hospital (no domain)
- @hospital.co.ke (no username)
- john@hospital (incomplete)
```

### Postal Code Format

```
Format: 5 digits exactly

Valid Examples:
- 00100
- 00200
- 40400

Invalid Examples:
- 001 (too short)
- 001-00 (has hyphen)
```

### Date Format (ISO 8601)

```
Format: YYYY-MM-DD

Valid Examples:
- 2024-12-20
- 2024-01-15
- 2025-06-30

Invalid Examples:
- 20/12/2024 (wrong format)
- December 20, 2024 (spelled out)
```

### Time Format

```
Format: HH:MM-HH:MM (24-hour)

Valid Examples:
- 08:00-12:00
- 14:30-16:45
- 09:00-17:00

Invalid Examples:
- 2:00 PM-4:00 PM (12-hour)
- 8-12 (no minutes)
```

### Amount Validation

```
Requirement: totalAmount must equal sum of (quantity × price)

Example:
Item 1: 50 × 1500 = 75,000
Item 2: 10 × 5000 = 50,000
Total = 75,000 + 50,000 = 125,000 KES

If you send totalAmount: 100,000 → Error: Amount mismatch
```

---

## Error Handling

### Common Error Responses

| Error | Status | Details | Solution |
|-------|--------|---------|----------|
| Missing required field | 400 | "primaryContact.name is required" | Include all required fields |
| Invalid phone | 400 | "phone must be 254XXXXXXXXX" | Format as 254 + 9 digits |
| Invalid email | 400 | "Invalid email address" | Use valid email format |
| Amount mismatch | 400 | "totalAmount doesn't match items" | Verify calculation |
| Invalid facility type | 400 | "facility.type must be one of..." | Use allowed facility type |
| M-Pesa error | 500 | "Failed to initiate M-Pesa payment" | Check credentials, try again |
| Order not found | 404 | "Order not found" | Verify order ID |

### Handling Errors in Code

```javascript
try {
  const response = await fetch('https://app.codewithseth.co.ke/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });

  const result = await response.json();

  if (!result.success) {
    // Handle specific errors
    console.error('Error:', result.details || result.message);
    
    // Show user-friendly message
    if (result.message.includes('phone')) {
      alert('Please enter phone in format 254712345678');
    } else if (result.message.includes('Amount')) {
      alert('Order total does not match items');
    } else {
      alert('Error creating order. Please try again.');
    }
  }
} catch (error) {
  console.error('Network error:', error);
  alert('Network error. Check your connection.');
}
```

---

## Testing Guide

### Test 1: Create Valid Order

```bash
curl -X POST https://app.codewithseth.co.ke/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "primaryContact": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "254712345678",
      "jobTitle": "Manager"
    },
    "facility": {
      "name": "Test Hospital",
      "type": "Hospital",
      "address": "123 Test Street",
      "city": "Nairobi",
      "county": "Nairobi",
      "postalCode": "00100"
    },
    "alternativeContact": {
      "name": "Backup",
      "email": "backup@example.com",
      "phone": "254734567890",
      "relationship": "Assistant"
    },
    "delivery": {
      "location": "123 Test Street, Building A"
    },
    "items": [{
      "consumableId": "507f1f77bcf86cd799439011",
      "name": "Test Item",
      "quantity": 1,
      "price": 1000
    }],
    "totalAmount": 1000,
    "paymentMethod": "mpesa"
  }' | jq
```

Expected: 201 Status, Order created

### Test 2: Invalid Phone Format

```bash
curl -X POST https://app.codewithseth.co.ke/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "primaryContact": {
      "name": "Test",
      "email": "test@example.com",
      "phone": "0712345678",
      "jobTitle": "Manager"
    },
    ...
  }' | jq
```

Expected: 400 Status, "phone must be in format 254XXXXXXXXX"

### Test 3: Get Order Details

```bash
curl https://app.codewithseth.co.ke/api/orders/ORD-1702389012345ABC | jq
```

Expected: 200 Status, Order details

### Test 4: Check Payment Status

```bash
curl https://app.codewithseth.co.ke/api/orders/status/ws_CO_12345678 | jq
```

Expected: 200 Status, Payment status (pending/paid/cancelled)

### Test 5: Get Customer Orders

```bash
curl https://app.codewithseth.co.ke/api/orders/customer/john@example.com | jq
```

Expected: 200 Status, Array of orders

---

## Implementation Checklist

### Form Fields to Create

**Primary Contact Section**
- ✅ Name input (text, 3-100 chars)
- ✅ Email input (email format)
- ✅ Phone input (format: 254XXXXXXXXX)
- ✅ Job Title input (text)

**Facility Section**
- ✅ Facility name input (text)
- ✅ Facility type dropdown (Hospital, Clinic, etc.)
- ✅ Address input (text)
- ✅ City input (text)
- ✅ County dropdown (all Kenyan counties)
- ✅ Postal code input (5 digits)
- ✅ MOH registration (optional text)
- ✅ GPS coordinates (optional - latitude/longitude)

**Alternative Contact Section**
- ✅ Name input (text)
- ✅ Email input (email format)
- ✅ Phone input (format: 254XXXXXXXXX)
- ✅ Relationship dropdown (Manager, Supervisor, etc.)

**Delivery Section**
- ✅ Delivery location input (text)
- ✅ Delivery instructions (optional textarea)
- ✅ Preferred date (optional date picker, future dates only)
- ✅ Preferred time (optional time input, HH:MM-HH:MM format)

**Order Items Section**
- ✅ Display cart items
- ✅ Show consumableId, name, quantity, price
- ✅ Allow entering specifications (optional)

**Payment Section**
- ✅ Display total amount
- ✅ PO number input (optional)
- ✅ Billing email input (optional)
- ✅ Notes textarea (optional)

### Validation Before Submission

- ✅ All required fields filled
- ✅ Phone format validation (254XXXXXXXXX)
- ✅ Email format validation
- ✅ Postal code is 5 digits
- ✅ Facility type is from allowed list
- ✅ County is valid Kenyan county
- ✅ Total amount matches sum of items
- ✅ Items array not empty
- ✅ Date is not in the past (if provided)
- ✅ Time format HH:MM-HH:MM (if provided)

### After Order Creation

- ✅ Display success message with Order ID
- ✅ Show next steps (M-Pesa prompt incoming)
- ✅ Display order details to user
- ✅ Start polling for payment status
- ✅ Handle success (payment confirmed)
- ✅ Handle failure (payment cancelled)
- ✅ Display error messages clearly

### Testing

- ✅ Test valid order creation
- ✅ Test invalid phone format
- ✅ Test missing required fields
- ✅ Test amount mismatch
- ✅ Test order retrieval
- ✅ Test payment status polling
- ✅ Test error scenarios
- ✅ Test form validation

---

## Admin Notifications

**When:** Order is created and payment confirmed  
**Recipients:** sales@accordmedical.co.ke, bellarinseth@gmail.com

**Email includes:**
- ✅ Order ID and timestamp
- ✅ Facility name, type, address
- ✅ City, county, postal code
- ✅ Primary contact with clickable links
- ✅ Alternative contact information
- ✅ Delivery location and instructions
- ✅ All items with quantities and specifications
- ✅ Total amount
- ✅ Purchase order number
- ✅ Special notes

---

## Troubleshooting

### Issue: "Phone number must be in format 254XXXXXXXXX"
**Solution:** Format phone as exactly 254 + 9 digits
```
Wrong: 0712345678, +254712345678, 254-712-345-678
Right: 254712345678
```

### Issue: "Invalid email address"
**Solution:** Use valid email format
```
Wrong: john@, @example.com
Right: john@example.com
```

### Issue: "Total amount mismatch"
**Solution:** Ensure total = sum of (quantity × price)
```
Item 1: 2 × 1500 = 3000
Item 2: 5 × 500 = 2500
Total must be: 5500
```

### Issue: "Failed to initiate M-Pesa payment"
**Solutions:**
1. Check internet connection
2. Verify all required fields are filled
3. Try again in a few moments
4. Check phone is valid Kenyan number

### Issue: "Order not found"
**Solution:** Verify the order ID is correct
```
Format: ORD-XXXXXXXXX
Example: ORD-1702389012345ABC
```

---

## Performance & Limits

- **Order Creation:** ~2-3 seconds
- **Payment Status Check:** <1 second
- **Get Order Details:** <500ms
- **Email Sending:** ~2-5 seconds (async)
- **Rate Limit:** 5 orders per 15 minutes per IP

---

## Next Steps

1. **Frontend:** Build checkout form with all fields
2. **Testing:** Use cURL examples to test endpoints
3. **Integration:** Implement payment status polling
4. **Validation:** Add form validation as per rules
5. **Error Handling:** Implement error messaging
6. **Deployment:** Deploy to production with HTTPS

---

**Last Updated:** December 12, 2025  
**Status:** ✅ Production Ready  
**For:** Frontend developers implementing M-Pesa checkout  
**Questions?** Refer to BACKEND_CHECKOUT_IMPLEMENTATION.md for backend spec
