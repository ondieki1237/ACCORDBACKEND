# M-Pesa Checkout API - Quick Start Guide

**Updated:** December 12, 2025  
**API Version:** 2.0  
**Status:** ✅ Production Ready

---

## 30-Second Overview

The M-Pesa checkout system now captures complete facility and contact information before initiating payment. Orders include hospital/clinic details, multiple contact persons, and delivery preferences.

**Key Change:** API base changed from `/api/checkout` → `/api/orders`

---

## 1. Create an Order (POST /api/orders)

This initiates the payment flow and sends STK Push to customer phone.

### Minimal Required Request

```javascript
fetch('https://app.codewithseth.co.ke/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    primaryContact: {
      name: 'Dr. John Doe',
      email: 'john@hospital.com',
      phone: '254712345678',        // MUST be 254XXXXXXXXX format
      jobTitle: 'Medical Director'
    },
    facility: {
      name: 'Nairobi Central Hospital',
      type: 'Hospital',             // See facility types below
      address: '123 Hospital Lane',
      city: 'Nairobi',
      county: 'Nairobi',
      postalCode: '00100'           // MUST be 5 digits
    },
    alternativeContact: {
      name: 'Jane Smith',
      email: 'jane@hospital.com',
      phone: '254734567890',        // MUST be 254XXXXXXXXX format
      relationship: 'Procurement Manager'
    },
    delivery: {
      location: '123 Hospital Lane, Building A'  // Where to deliver
    },
    items: [
      {
        consumableId: '507f1f77bcf86cd799439011',
        name: 'Surgical Gloves',
        quantity: 50,
        price: 1500
      }
    ],
    totalAmount: 75000,  // MUST = 50 × 1500
    paymentMethod: 'mpesa'
  })
})
.then(r => r.json())
.then(result => {
  if (result.success) {
    console.log('Order created:', result.data.orderId);
    console.log('Next:', result.data.nextSteps);
    // Customer will see M-Pesa prompt on phone
  } else {
    console.error('Error:', result.details);
  }
});
```

### Response

```json
{
  "success": true,
  "data": {
    "orderId": "ORD-1702389012345ABC",
    "facility": {
      "name": "Nairobi Central Hospital",
      "type": "Hospital",
      "location": "Nairobi, Nairobi"
    },
    "primaryContact": {
      "name": "Dr. John Doe",
      "phone": "254712345678"
    },
    "alternativeContact": {
      "name": "Jane Smith",
      "phone": "254734567890"
    },
    "totalAmount": 75000,
    "itemCount": 1,
    "paymentStatus": "pending",
    "checkoutRequestID": "ws_CO_123456789",
    "nextSteps": "M-Pesa STK prompt sent to Dr. John Doe. Contact Jane Smith if needed."
  }
}
```

---

## 2. Facility Types (Required)

Use one of these for `facility.type`:

- Hospital
- Clinic
- Medical Center
- Laboratory
- Pharmacy
- Dispensary
- Health Center
- Private Practice
- Diagnostic Center
- Nursing Home

---

## 3. Check Payment Status (GET /api/orders/status/:checkoutRequestID)

Poll this endpoint every 5 seconds to detect when payment succeeds.

```javascript
// Get checkoutRequestID from order creation response
const checkoutRequestID = 'ws_CO_123456789';

async function checkPayment() {
  const response = await fetch(
    `https://app.codewithseth.co.ke/api/orders/status/${checkoutRequestID}`
  );
  const result = await response.json();
  
  console.log('Payment Status:', result.paymentStatus);
  // 'pending' = still waiting
  // 'paid' = success! ✓
  // 'cancelled' = user cancelled
}

// Poll every 5 seconds
setInterval(checkPayment, 5000);
```

---

## 4. Get Order Details (GET /api/orders/:orderId)

Retrieve full order information anytime.

```javascript
const orderId = 'ORD-1702389012345ABC';

const response = await fetch(
  `https://app.codewithseth.co.ke/api/orders/${orderId}`
);
const result = await response.json();

if (result.success) {
  console.log(result.data);
  // Contains: primaryContact, facility, alternativeContact, delivery, items
}
```

---

## 5. Get Customer Orders (GET /api/orders/customer/:email)

Get all orders for a customer (searches both primary + alternative contacts).

```javascript
const email = 'john@hospital.com';

const response = await fetch(
  `https://app.codewithseth.co.ke/api/orders/customer/${email}`
);
const result = await response.json();

console.log(`Found ${result.count} orders`);
result.data.forEach(order => {
  console.log(order.orderNumber, order.paymentStatus);
});
```

---

## Validation Rules

### ✅ Valid Examples

```javascript
// Phone Format
phone: '254712345678'   // ✓ Correct
phone: '254734567890'   // ✓ Correct

// Email Format
email: 'john@hospital.com'        // ✓
email: 'user+system@example.co.ke' // ✓

// Postal Code
postalCode: '00100'  // ✓ Exactly 5 digits
postalCode: '40400'  // ✓

// Amount
items: [
  { quantity: 50, price: 1500 },  // 50 × 1500 = 75,000
  { quantity: 10, price: 5000 }   // 10 × 5000 = 50,000
]
totalAmount: 125000  // ✓ Correct: 75,000 + 50,000
```

### ❌ Invalid Examples

```javascript
// Phone Format - ERRORS
phone: '0712345678'           // ❌ Missing 254
phone: '+254712345678'        // ❌ Has plus sign
phone: '254-712-345-678'      // ❌ Has hyphens

// Postal Code - ERRORS
postalCode: '001'             // ❌ Too short (needs 5)
postalCode: '001-00'          // ❌ Has hyphen

// Amount Mismatch - ERROR
items: [{ quantity: 50, price: 1500 }]  // 75,000
totalAmount: 100000  // ❌ Error! Should be 75,000
```

---

## Error Examples

### Missing Field

```json
{
  "success": false,
  "message": "Validation error",
  "details": "primaryContact.name is required"
}
```

### Invalid Phone

```json
{
  "success": false,
  "message": "Validation error",
  "details": "primaryContact.phone must be in format 254XXXXXXXXX"
}
```

### Amount Mismatch

```json
{
  "success": false,
  "message": "Validation error",
  "details": "Total amount mismatch. Expected 75000, got 100000"
}
```

---

## Email Notifications

### Who Gets Emails?

**Customer Receives:**
1. Order confirmation (when order created)
2. Payment confirmation (when payment successful)

**Admin Team Receives:**
1. New order alert (to: sales@accordmedical.co.ke, bellarinseth@gmail.com)
2. Payment confirmed (to: sales@accordmedical.co.ke, bellarinseth@gmail.com)

---

## Complete Request Example

```javascript
const orderData = {
  // Primary Contact (Person placing order)
  primaryContact: {
    name: 'Dr. James Okonkwo',
    email: 'james@medicenter.co.ke',
    phone: '254712345678',
    jobTitle: 'Medical Director'
  },
  
  // Facility Information
  facility: {
    name: 'Medicenter Hospital Nairobi',
    registrationNumber: 'MOH/2024/5432',    // Optional
    type: 'Hospital',
    address: 'Plot 456, Health Park Road',
    city: 'Nairobi',
    county: 'Nairobi',
    postalCode: '00200',
    GPS_coordinates: {                      // Optional
      latitude: -1.3202,
      longitude: 36.8000
    }
  },
  
  // Alternative Contact (Backup person)
  alternativeContact: {
    name: 'Margaret Kipchoge',
    email: 'margaret@medicenter.co.ke',
    phone: '254734567890',
    relationship: 'Procurement Manager'
  },
  
  // Delivery Information
  delivery: {
    location: 'Plot 456, Warehouse Building B',
    instructions: 'Call Samuel at 0723456789 upon arrival',  // Optional
    preferredDate: '2024-12-22',                             // Optional
    preferredTime: '09:00-14:00'                             // Optional
  },
  
  // Items to Order
  items: [
    {
      consumableId: '507f1f77bcf86cd799439011',
      name: 'Surgical Gloves',
      quantity: 50,
      price: 1500,
      specifications: 'Sterile, Size M, Latex-free'  // Optional
    },
    {
      consumableId: '507f1f77bcf86cd799439012',
      name: 'N95 Face Masks',
      quantity: 10,
      price: 5000
    }
  ],
  
  // Order Totals & Payment
  totalAmount: 100000,  // 50×1500 + 10×5000
  paymentMethod: 'mpesa',
  
  // Optional Fields
  purchaseOrderNumber: 'PO-2024-DEC-001',
  billingEmail: 'finance@medicenter.co.ke',
  notes: 'Emergency order for ICU expansion'
};
```

---

## Test with cURL

```bash
# Create Order
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
      "address": "123 Test St",
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
    "delivery": {"location": "123 Test St"},
    "items": [{
      "consumableId": "507f1f77bcf86cd799439011",
      "name": "Test",
      "quantity": 1,
      "price": 1000
    }],
    "totalAmount": 1000,
    "paymentMethod": "mpesa"
  }' | jq

# Get Order
curl https://app.codewithseth.co.ke/api/orders/ORD-1702389012345 | jq

# Check Payment Status
curl https://app.codewithseth.co.ke/api/orders/status/ws_CO_123 | jq

# Get Customer Orders
curl https://app.codewithseth.co.ke/api/orders/customer/test@example.com | jq
```

---

## Order Statuses

### Payment Status
- `pending` - Waiting for payment
- `paid` - Payment received ✓
- `cancelled` - Payment failed or cancelled

### Order Status
- `pending` - Order created, payment in progress
- `processing` - Payment received, being prepared
- `shipped` - On the way
- `delivered` - Completed
- `cancelled` - Order cancelled

---

## M-Pesa Payment Flow

```
1. User clicks "Checkout with M-Pesa"
        ↓
2. Frontend sends POST /api/orders with all order data
        ↓
3. Backend validates all fields
        ↓
4. Backend creates order in database
        ↓
5. Backend initiates M-Pesa STK Push
        ↓
6. Customer's phone receives M-Pesa prompt
        ↓
7. Customer enters M-Pesa PIN
        ↓
8. Payment processed by Safaricom
        ↓
9. Callback received by backend
        ↓
10. Order marked as "paid"
        ↓
11. Payment confirmation emails sent
        ↓
12. Admin sees order in dashboard
```

---

## Troubleshooting

### "Phone number must be in format 254XXXXXXXXX"
→ Format phone as exactly 254 + 9 digits
→ Don't include spaces, hyphens, or +254

### "Total amount mismatch"
→ Add up all items: (quantity × price) for each
→ Make sure that total equals totalAmount

### "facility.postalCode must be exactly 5 digits"
→ Postal code must be 5 digits, no spaces or hyphens
→ Example: 00100, 40400, 50100

### "Invalid email address"
→ Use standard email format: username@domain.com
→ Don't include spaces or special characters

### Order not found
→ Check order ID format: ORD-XXXXXXXXX
→ Make sure you're using the exact ID from creation response

---

## Performance Tips

- Poll payment status every 5 seconds (not more frequently)
- Cache order data client-side to reduce API calls
- Show order details immediately after creation
- Display loading state while polling for payment
- Clear polling when payment status changes

---

## Security Notes

- Phone numbers MUST be valid Kenyan M-Pesa numbers
- All amounts validated server-side
- All input sanitized and validated
- M-Pesa credentials stored securely in .env
- Email addresses verified before sending
- HTTPS required (no HTTP)

---

## Support Resources

- 📄 **frontend_summary.md** - Complete frontend spec
- 📄 **BACKEND_UPDATES_SUMMARY.md** - Backend technical details
- 📄 **API_COMPATIBILITY_MIGRATION_GUIDE.md** - Migration from old API
- 🎯 **MPESA_CHECKOUT_QUICK_REFERENCE.md** - Quick reference

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 12 | Initial implementation |
| 2.0 | Dec 12 | Complete restructure per frontend spec |

---

**Last Updated:** December 12, 2025  
**Status:** ✅ Production Ready  
**Environment:** Sandbox (use production credentials for live)
