# M-Pesa Checkout API Documentation

Complete API documentation for the M-Pesa checkout system integrated with Accord Medical Supplies backend.

---

## Overview

The M-Pesa Checkout system allows customers to purchase consumables online with instant M-Pesa payment verification. All transactions are stored in the database with complete status tracking.

**API Base URL:** `https://app.codewithseth.co.ke/api/checkout`

**Payment Status:** 
- Successful payments → Email notifications sent to `sales@accordmedical.co.ke` and `bellarinseth@gmail.com`
- Failed payments → Logged in database
- All transactions stored in MongoDB with full details

---

## Endpoints

### 1. Create Order and Initiate M-Pesa Payment

**Endpoint:**
```
POST /api/checkout/checkout
```

**Description:** Creates a new order and initiates M-Pesa STK Push payment prompt on customer's phone.

**Authentication:** Not required (Public)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "254712345678",
  "items": [
    {
      "consumableId": "507f1f77bcf86cd799439011",
      "name": "Surgical Gloves",
      "quantity": 2,
      "price": 1500
    },
    {
      "consumableId": "507f1f77bcf86cd799439012",
      "name": "Face Masks",
      "quantity": 5,
      "price": 500
    }
  ],
  "totalAmount": 5500,
  "paymentMethod": "mpesa"
}
```

**Request Parameters Explanation:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customerName` | string | Yes | Full name of the customer |
| `customerEmail` | string | Yes | Valid email address for notifications |
| `customerPhone` | string | Yes | Phone in format 254XXXXXXXXX (11 digits) |
| `items` | array | Yes | Array of consumables being ordered |
| `items[].consumableId` | string | Yes | MongoDB ID of the consumable from `/api/consumables` |
| `items[].name` | string | Yes | Product name (for display) |
| `items[].quantity` | number | Yes | Quantity ordered (must be positive) |
| `items[].price` | number | Yes | Unit price in KES |
| `totalAmount` | number | Yes | Total order amount (sum of quantity × price for all items) |
| `paymentMethod` | string | No | "mpesa" (default) |

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Order created successfully. Please complete payment on your phone.",
  "data": {
    "orderId": "ORD-1702389012345ABC",
    "customerName": "John Doe",
    "totalAmount": 5500,
    "paymentStatus": "pending",
    "checkoutRequestID": "ws_CO_12345678901234567890"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Phone number must be in format 254XXXXXXXXX"
}
```

**Response (Error - 500):**
```json
{
  "success": false,
  "message": "Failed to initiate M-Pesa payment",
  "error": "Invalid credentials"
}
```

**What Happens After Request:**

1. ✅ Order created in MongoDB with status `pending`
2. ✅ M-Pesa STK Push sent to customer's phone
3. ✅ Order confirmation email sent to customer
4. ✅ **Admin notification email sent to:**
   - `sales@accordmedical.co.ke`
   - `bellarinseth@gmail.com`
5. ⏳ Waiting for customer to enter M-Pesa PIN
6. 📧 Payment callback received from Safaricom
7. ✅ Payment confirmed → Emails sent to admins
8. ✅ Order status updated to `processing`

**Database Entry Created:**
```javascript
{
  _id: ObjectId,
  orderNumber: "ORD-1702389012345ABC",
  client: {
    name: "John Doe",
    email: "john@example.com",
    phone: "254712345678"
  },
  items: [...],
  totalAmount: 5500,
  paymentMethod: "mpesa",
  paymentStatus: "pending",
  status: "pending",
  mpesaDetails: {
    checkoutRequestID: "ws_CO_...",
    merchantRequestID: "...",
    phoneNumber: "254712345678",
    initiatedAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

### 2. Get Order Details

**Endpoint:**
```
GET /api/checkout/:orderId
```

**Description:** Retrieve complete order details including payment status.

**Authentication:** Not required

**URL Parameters:**
```
orderId = "ORD-1702389012345ABC"
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "_id": "507f...",
    "orderNumber": "ORD-1702389012345ABC",
    "client": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "254712345678"
    },
    "items": [
      {
        "productName": "Surgical Gloves",
        "quantity": 2,
        "unitPrice": 1500,
        "totalPrice": 3000
      }
    ],
    "totalAmount": 5500,
    "paymentStatus": "pending",
    "paymentMethod": "mpesa",
    "status": "pending",
    "mpesaDetails": {
      "checkoutRequestID": "ws_CO_...",
      "mpesaReceiptNumber": null,
      "transactionDate": null,
      "phoneNumber": "254712345678"
    },
    "createdAt": "2024-12-12T10:30:00.000Z",
    "updatedAt": "2024-12-12T10:30:00.000Z"
  }
}
```

**Response (Not Found - 404):**
```json
{
  "success": false,
  "message": "Order not found"
}
```

---

### 3. Get Customer Orders

**Endpoint:**
```
GET /api/checkout/customer/:email
```

**Description:** Get all orders for a specific customer.

**Authentication:** Not required

**URL Parameters:**
```
email = "john@example.com"
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "orderNumber": "ORD-1702389012345ABC",
      "totalAmount": 5500,
      "paymentStatus": "paid",
      "status": "processing",
      "createdAt": "2024-12-12T10:30:00.000Z"
    }
  ]
}
```

---

### 4. Query Payment Status

**Endpoint:**
```
GET /api/checkout/status/:checkoutRequestID
```

**Description:** Check payment status for a specific checkout request.

**Authentication:** Not required

**URL Parameters:**
```
checkoutRequestID = "ws_CO_12345678901234567890"
```

**Response:**
```json
{
  "success": true,
  "orderNumber": "ORD-1702389012345ABC",
  "paymentStatus": "pending",
  "lastUpdated": "2024-12-12T10:35:00.000Z"
}
```

---

### 5. M-Pesa Callback Handler

**Endpoint:**
```
POST /api/checkout/mpesa/callback
```

**Description:** Receives payment status callbacks from Safaricom (called automatically by M-Pesa).

**Authentication:** Not required (Safaricom servers only)

**Called By:** Safaricom M-Pesa API when customer completes payment

**Callback Request Body (from M-Pesa):**
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "29115-34620561-1",
      "CheckoutRequestID": "ws_CO_191220191020363925",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {
            "Name": "Amount",
            "Value": 5500
          },
          {
            "Name": "MpesaReceiptNumber",
            "Value": "NLJ7RT61SV"
          },
          {
            "Name": "TransactionDate",
            "Value": 20241212103025
          },
          {
            "Name": "PhoneNumber",
            "Value": 254712345678
          }
        ]
      }
    }
  }
}
```

**Response (Automatic):**
```json
{
  "ResultCode": 0,
  "ResultDesc": "Payment received successfully"
}
```

**What Happens on Successful Payment (ResultCode = 0):**

1. ✅ Order `paymentStatus` updated to `paid`
2. ✅ Order `status` updated to `processing`
3. ✅ M-Pesa receipt number stored in database
4. ✅ Transaction date recorded
5. 📧 **Payment confirmation email sent to customer**
6. 📧 **Admin notification sent to:**
   - `sales@accordmedical.co.ke`
   - `bellarinseth@gmail.com`
   - Email includes M-Pesa receipt number and order details
7. 📊 Order ready for processing

**Database Updated:**
```javascript
{
  paymentStatus: "paid",
  status: "processing",
  mpesaDetails: {
    mpesaReceiptNumber: "NLJ7RT61SV",
    transactionDate: 2024-12-12T10:30:25.000Z
  }
}
```

**What Happens on Failed Payment (ResultCode ≠ 0):**

1. ❌ Order `paymentStatus` set to `cancelled`
2. ❌ Order `status` set to `cancelled`
3. 📝 Error logged with ResultDesc
4. 🔔 No email notifications sent
5. 💬 Order remains retrievable for customer to retry

---

### 6. Get All Orders (Admin)

**Endpoint:**
```
GET /api/checkout/admin/all?page=1&limit=20&status=pending&paymentStatus=paid
```

**Description:** Get all orders with filtering (Admin only).

**Authentication:** Required (Admin)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `status` | string | Filter by order status (pending/processing/delivered/cancelled) |
| `paymentStatus` | string | Filter by payment status (pending/paid/cancelled) |

**Response:**
```json
{
  "success": true,
  "count": 20,
  "pagination": {
    "total": 150,
    "page": 1,
    "pages": 8
  },
  "data": [...]
}
```

---

## Code Examples

### JavaScript (Fetch API)

```javascript
// 1. Create order and initiate M-Pesa payment
async function createOrder() {
  const order = {
    customerName: "John Doe",
    customerEmail: "john@example.com",
    customerPhone: "254712345678",
    items: [
      {
        consumableId: "507f1f77bcf86cd799439011",
        name: "Surgical Gloves",
        quantity: 2,
        price: 1500
      }
    ],
    totalAmount: 3000,
    paymentMethod: "mpesa"
  };

  try {
    const response = await fetch('https://app.codewithseth.co.ke/api/checkout/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(order)
    });

    const result = await response.json();

    if (result.success) {
      console.log('Order created:', result.data);
      console.log('Checkout Request ID:', result.data.checkoutRequestID);
      // Customer should see M-Pesa prompt on their phone
    } else {
      console.error('Order creation failed:', result.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// 2. Get order details
async function getOrder(orderId) {
  try {
    const response = await fetch(
      `https://app.codewithseth.co.ke/api/checkout/${orderId}`
    );
    const result = await response.json();

    if (result.success) {
      console.log('Order:', result.data);
      console.log('Payment Status:', result.data.paymentStatus);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// 3. Check payment status
async function checkPaymentStatus(checkoutRequestID) {
  try {
    const response = await fetch(
      `https://app.codewithseth.co.ke/api/checkout/status/${checkoutRequestID}`
    );
    const result = await response.json();

    if (result.success) {
      console.log('Status:', result.paymentStatus);
      // pending, paid, or cancelled
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

const API_BASE = 'https://app.codewithseth.co.ke/api/checkout';

// Create order
async function createOrder(orderData) {
  try {
    const { data } = await axios.post(`${API_BASE}/checkout`, orderData);
    return data;
  } catch (error) {
    console.error('Order creation error:', error.response?.data);
    throw error;
  }
}

// Get order
async function getOrder(orderId) {
  try {
    const { data } = await axios.get(`${API_BASE}/${orderId}`);
    return data;
  } catch (error) {
    console.error('Get order error:', error.response?.data);
    throw error;
  }
}

// Check status
async function checkStatus(checkoutRequestID) {
  try {
    const { data } = await axios.get(`${API_BASE}/status/${checkoutRequestID}`);
    return data;
  } catch (error) {
    console.error('Status check error:', error.response?.data);
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

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        'https://app.codewithseth.co.ke/api/checkout/checkout',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: 'John Doe',
            customerEmail: 'john@example.com',
            customerPhone: '254712345678',
            items: [
              {
                consumableId: '507f1f77bcf86cd799439011',
                name: 'Surgical Gloves',
                quantity: 2,
                price: 1500
              }
            ],
            totalAmount: 3000,
            paymentMethod: 'mpesa'
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        setOrderId(result.data.orderId);
        alert(`Order created! Check your phone for M-Pesa prompt.`);
        // Optionally poll for payment status
        pollPaymentStatus(result.data.checkoutRequestID);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('Error creating order');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = (checkoutRequestID) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `https://app.codewithseth.co.ke/api/checkout/status/${checkoutRequestID}`
        );
        const result = await response.json();

        if (result.paymentStatus === 'paid') {
          clearInterval(interval);
          alert('✅ Payment received! Your order is processing.');
        } else if (result.paymentStatus === 'cancelled') {
          clearInterval(interval);
          alert('❌ Payment cancelled. Please try again.');
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
    </form>
  );
}
```

---

## Error Codes & Messages

### Validation Errors (400)

| Message | Cause | Solution |
|---------|-------|----------|
| Missing required fields | Missing customerName, email, phone, items, or totalAmount | Include all required fields |
| Phone number must be in format 254XXXXXXXXX | Phone format incorrect | Format as 254 + 9 digits |
| Invalid email address | Email format incorrect | Use valid email format |
| Items array is required | No items in order | Add at least one item |
| Total amount mismatch | Sum of items ≠ totalAmount | Verify calculation |

### M-Pesa Errors (500)

| Message | Cause | Solution |
|---------|-------|----------|
| Failed to initiate M-Pesa payment | API credentials or network issue | Check .env M-Pesa settings |
| Invalid credentials | Consumer key/secret incorrect | Verify credentials in .env |
| Service unavailable | M-Pesa API down | Retry after a moment |

### Not Found (404)

| Message | Cause | Solution |
|---------|-------|----------|
| Order not found | Order ID doesn't exist | Check order ID format |

---

## Payment Statuses

| Status | Meaning | Next Action |
|--------|---------|------------|
| `pending` | Awaiting customer M-Pesa payment | Customer enters M-Pesa PIN |
| `paid` | M-Pesa payment confirmed | Order moves to processing |
| `cancelled` | Customer cancelled or payment failed | Customer can create new order |

---

## Order Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Order created, awaiting payment |
| `processing` | Payment received, preparing items |
| `delivered` | Order delivered to customer |
| `cancelled` | Order cancelled or payment failed |

---

## Email Notifications

### Customer Receives:
1. **Order Confirmation Email** (immediately after order creation)
   - Order ID and items
   - Total amount
   - Next steps for payment

2. **Payment Confirmation Email** (when payment successful)
   - M-Pesa receipt number
   - Confirmation of payment
   - Expected delivery timeline

### Admin Receives (to configured emails):

**sales@accordmedical.co.ke**
**bellarinseth@gmail.com**

1. **New Order Notification** (immediately after order creation)
   - Complete customer details (name, email, phone)
   - Order items and amount
   - Clickable links to contact customer

2. **Payment Confirmation Notification** (when payment successful)
   - M-Pesa receipt number
   - Order ready for processing
   - Action items for fulfillment

---

## Database Schema

### Orders Collection

```javascript
{
  _id: ObjectId,
  orderNumber: String,           // e.g., "ORD-1702389012345ABC"
  client: {
    id: ObjectId,               // Reference to facility/client
    name: String,               // Customer name
    email: String,              // Customer email
    phone: String,              // Customer phone (254XXXXXXXXX)
    type: String                // 'hospital', 'clinic', etc.
  },
  items: [
    {
      productId: ObjectId,
      productName: String,
      quantity: Number,
      unitPrice: Number,
      totalPrice: Number
    }
  ],
  totalAmount: Number,           // Total in KES
  paymentMethod: String,         // 'mpesa'
  paymentStatus: String,         // 'pending', 'paid', 'cancelled'
  status: String,                // 'pending', 'processing', 'delivered', 'cancelled'
  mpesaDetails: {
    checkoutRequestID: String,
    merchantRequestID: String,
    mpesaReceiptNumber: String,  // Set after successful payment
    transactionDate: Date,        // Set after successful payment
    phoneNumber: String,
    initiatedAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## Testing Checklist

### Test Create Order
- [ ] Valid request with all fields
- [ ] Invalid phone number format
- [ ] Missing required fields
- [ ] Amount mismatch
- [ ] Verify order created in database
- [ ] Verify customer received email
- [ ] Verify admin received email

### Test Payment Flow
- [ ] M-Pesa prompt appears on test phone
- [ ] Customer can enter PIN
- [ ] Payment callback received
- [ ] Database updated with receipt number
- [ ] Payment confirmation emails sent
- [ ] Order status changes to processing

### Test Failure Scenarios
- [ ] Customer cancels M-Pesa prompt
- [ ] Customer enters wrong PIN
- [ ] Timeout during payment
- [ ] Verify order marked as cancelled

---

## Environment Variables Required

```env
# M-Pesa Configuration (in .env)
MPESA_CONSUMER_KEY=P3AsJFMLRQ1YBfUW0izBhGFIUII5Q7TAouxWJhpXjCtsRoZ8
MPESA_CONSUMER_SECRET=ym2yQuCk97gaVKc0iZT3K0CECgtx8oQFyAQ36GIRFx9b7wY5W1xfs7AiGNzIqCTI
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd1a503b6e78e64204813acb8394076885535da0d7
MPESA_ENVIRONMENT=sandbox  # or production
MPESA_CALLBACK_URL=https://app.codewithseth.co.ke/api/mpesa/callback

# Email Configuration
EMAIL_HOST=mail.accordmedical.co.ke
EMAIL_PORT=465
EMAIL_USER=noreply@accordmedical.co.ke
EMAIL_PASS=your_secure_password
EMAIL_FROM=Accord Medical <sales@accordmedical.co.ke>
ORDER_NOTIFICATION_EMAILS=sales@accordmedical.co.ke,bellarinseth@gmail.com

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
```

---

## Troubleshooting

### Orders Not Appearing in Database
- Check MongoDB connection in .env
- Verify `ORDER_COLLECTION_NAME` exists
- Check server logs for create errors

### Emails Not Sending
- Verify EMAIL_HOST, PORT, USER, PASS in .env
- Check configured admin emails
- Review email service logs
- Test email service separately

### M-Pesa Not Initiating
- Verify credentials in .env
- Check MPESA_ENVIRONMENT setting (sandbox vs production)
- Ensure callback URL is correct and HTTPS
- Verify network connectivity

### Payments Not Being Recorded
- Check callback URL configuration in Daraja portal
- Verify M-Pesa callback route is accessible
- Review server logs for callback errors

---

## API Rate Limiting

Current rate limits:
- **Create Order:** 5 orders per 15 minutes per IP
- **Get Order:** 100 requests per 15 minutes per IP

---

## Version History

### v1.0.0 (Current - December 2024)
- ✅ M-Pesa STK Push integration
- ✅ Order creation and management
- ✅ Email notifications (customer + admin)
- ✅ Payment status tracking
- ✅ Database transaction storage
- ✅ Admin notification to sales@accordmedical.co.ke and bellarinseth@gmail.com

---

## Support

**Issues or Questions?**
- Check logs in `/logs/`
- Review .env configuration
- Test with cURL commands
- Contact: sales@accordmedical.co.ke

---

**Last Updated:** December 12, 2025
**Status:** Production Ready ✅
