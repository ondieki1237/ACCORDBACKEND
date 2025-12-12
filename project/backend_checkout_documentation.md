# Backend Implementation Guide - M-Pesa Checkout for Consumables

This document outlines the backend implementation required to support the consumables checkout system with M-Pesa payment integration.

---

## Overview

The backend needs to handle:
1. Order creation and management
2. M-Pesa STK Push (Lipa Na M-Pesa Online) integration
3. Payment callback handling
4. Order status updates
5. Email notifications

**Backend API Base URL:** `https://app.codewithseth.co.ke/api`

---

## 1. Database Schema

### Orders Collection/Table

```javascript
{
  orderId: String,              // Unique order identifier (e.g., "ORD-1234567890")
  customerName: String,         // Customer's full name
  customerEmail: String,        // Customer's email address
  customerPhone: String,        // Formatted phone (254XXXXXXXXX)
  
  items: [
    {
      consumableId: ObjectId,   // Reference to consumable
      name: String,             // Product name (for historical record)
      quantity: Number,         // Quantity ordered
      price: Number             // Unit price at time of order
    }
  ],
  
  totalAmount: Number,          // Total order amount in KES
  paymentMethod: String,        // "mpesa"
  paymentStatus: String,        // "pending" | "completed" | "failed" | "cancelled"
  
  mpesaDetails: {
    CheckoutRequestID: String,  // M-Pesa checkout request ID
    MerchantRequestID: String,  // M-Pesa merchant request ID
    MpesaReceiptNumber: String, // M-Pesa transaction code (after success)
    TransactionDate: String,    // M-Pesa transaction date
    PhoneNumber: String,        // Phone number used for payment
  },
  
  orderStatus: String,          // "pending" | "processing" | "completed" | "cancelled"
  deliveryStatus: String,       // "pending" | "in_transit" | "delivered"
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## 2. API Endpoints to Implement

### 2.1 Create Order and Initiate M-Pesa Payment

**Endpoint:** `POST /api/orders`

**Description:** Creates a new order and initiates M-Pesa STK Push payment.

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

**Response (Success):**
```json
{
  "success": true,
  "message": "Order created successfully. Please complete payment on your phone.",
  "data": {
    "orderId": "ORD-1702389012345",
    "customerName": "John Doe",
    "totalAmount": 5500,
    "paymentStatus": "pending",
    "checkoutRequestID": "ws_CO_12345678901234567890"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Failed to initiate M-Pesa payment",
  "error": "Invalid phone number format"
}
```

**Implementation Steps:**

1. **Validate Request Data**
   ```javascript
   - Ensure all required fields are present
   - Validate phone number format (254XXXXXXXXX)
   - Validate email format
   - Ensure items array is not empty
   - Validate totalAmount matches sum of (quantity * price)
   ```

2. **Generate Unique Order ID**
   ```javascript
   const orderId = `ORD-${Date.now()}${Math.random().toString(36).substr(2, 9)}`
   ```

3. **Create Order in Database**
   ```javascript
   const order = await Order.create({
     orderId,
     customerName,
     customerEmail,
     customerPhone,
     items,
     totalAmount,
     paymentMethod: "mpesa",
     paymentStatus: "pending",
     orderStatus: "pending",
     deliveryStatus: "pending",
     createdAt: new Date(),
     updatedAt: new Date()
   })
   ```

4. **Initiate M-Pesa STK Push**
   - See section 3 below for M-Pesa integration

5. **Send Email Confirmation**
   - Send order confirmation email to customer
   - Include order ID and payment pending status

---

### 2.2 Get Order Details

**Endpoint:** `GET /api/orders/:orderId`

**Description:** Retrieves order details by order ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "ORD-1702389012345",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "254712345678",
    "items": [
      {
        "name": "Surgical Gloves",
        "quantity": 2,
        "price": 1500
      }
    ],
    "totalAmount": 5500,
    "paymentStatus": "completed",
    "orderStatus": "processing",
    "createdAt": "2024-12-12T10:30:00.000Z"
  }
}
```

**Implementation:**
```javascript
const order = await Order.findOne({ orderId: req.params.orderId })
if (!order) {
  return res.status(404).json({
    success: false,
    message: "Order not found"
  })
}
return res.json({ success: true, data: order })
```

---

### 2.3 Get Customer Orders

**Endpoint:** `GET /api/orders/customer/:email`

**Description:** Retrieves all orders for a specific customer.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "orderId": "ORD-1702389012345",
      "totalAmount": 5500,
      "paymentStatus": "completed",
      "orderStatus": "processing",
      "createdAt": "2024-12-12T10:30:00.000Z"
    }
  ]
}
```

---

### 2.4 M-Pesa Callback Handler

**Endpoint:** `POST /api/mpesa/callback`

**Description:** Receives M-Pesa payment status callbacks.

**Request Body (M-Pesa Success):**
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
            "Value": 20191219102115
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

**Implementation Steps:**

1. **Extract Callback Data**
   ```javascript
   const { MerchantRequestID, CheckoutRequestID, ResultCode, CallbackMetadata } = 
     req.body.Body.stkCallback
   ```

2. **Find Order by CheckoutRequestID**
   ```javascript
   const order = await Order.findOne({
     'mpesaDetails.CheckoutRequestID': CheckoutRequestID
   })
   ```

3. **Update Order Status Based on ResultCode**
   ```javascript
   if (ResultCode === 0) {
     // Payment successful
     const metadata = CallbackMetadata.Item
     const mpesaReceipt = metadata.find(item => item.Name === 'MpesaReceiptNumber').Value
     
     await Order.updateOne(
       { _id: order._id },
       {
         paymentStatus: 'completed',
         orderStatus: 'processing',
         'mpesaDetails.MpesaReceiptNumber': mpesaReceipt,
         'mpesaDetails.TransactionDate': new Date(),
         updatedAt: new Date()
       }
     )
     
     // Send payment confirmation email to customer
     sendPaymentConfirmationEmail(order)
     
     // Send payment confirmation to admin
     sendAdminPaymentNotification(order)
   } else {
     // Payment failed
     await Order.updateOne(
       { _id: order._id },
       {
         paymentStatus: 'failed',
         updatedAt: new Date()
       }
     )
   }
   ```

---

## 3. M-Pesa Integration (Lipa Na M-Pesa Online - STK Push)

### Prerequisites

1. **Safaricom Daraja API Credentials:**
   - Consumer Key
   - Consumer Secret
   - Business Short Code (Paybill or Till Number)
   - Passkey
   - Callback URL

2. **Environment Variables:**
   ```env
   MPESA_CONSUMER_KEY=your_consumer_key
   MPESA_CONSUMER_SECRET=your_consumer_secret
   MPESA_BUSINESS_SHORT_CODE=174379
   MPESA_PASSKEY=your_passkey
   MPESA_CALLBACK_URL=https://app.codewithseth.co.ke/api/mpesa/callback
   MPESA_ENVIRONMENT=sandbox  # or production
   ```

### Step 1: Generate Access Token

```javascript
async function generateAccessToken() {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64')
  
  const url = process.env.MPESA_ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Basic ${auth}`
    }
  })
  
  const data = await response.json()
  return data.access_token
}
```

### Step 2: Generate Password

```javascript
function generatePassword() {
  const timestamp = new Date().toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14)
  
  const password = Buffer.from(
    `${process.env.MPESA_BUSINESS_SHORT_CODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64')
  
  return { password, timestamp }
}
```

### Step 3: Initiate STK Push

```javascript
async function initiateSTKPush(phoneNumber, amount, orderId, accountReference) {
  const accessToken = await generateAccessToken()
  const { password, timestamp } = generatePassword()
  
  const url = process.env.MPESA_ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
  
  const payload = {
    BusinessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(amount), // Must be integer
    PartyA: phoneNumber, // Phone number sending money (254XXXXXXXXX)
    PartyB: process.env.MPESA_BUSINESS_SHORT_CODE,
    PhoneNumber: phoneNumber, // Phone number to receive prompt
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: accountReference || orderId,
    TransactionDesc: `Payment for Order ${orderId}`
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  
  const data = await response.json()
  
  if (data.ResponseCode === "0") {
    // STK Push sent successfully
    return {
      success: true,
      CheckoutRequestID: data.CheckoutRequestID,
      MerchantRequestID: data.MerchantRequestID,
      ResponseDescription: data.ResponseDescription
    }
  } else {
    throw new Error(data.errorMessage || 'Failed to initiate M-Pesa payment')
  }
}
```

### Step 4: Query Transaction Status (Optional)

For checking payment status manually:

```javascript
async function querySTKPushStatus(checkoutRequestID) {
  const accessToken = await generateAccessToken()
  const { password, timestamp } = generatePassword()
  
  const url = process.env.MPESA_ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
    : 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
  
  const payload = {
    BusinessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestID
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  
  return await response.json()
}
```

---

## 4. Complete Flow Integration

### Order Creation Handler (routes/orders.js)

```javascript
const express = require('express')
const router = express.Router()

router.post('/orders', async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, items, totalAmount, paymentMethod } = req.body
    
    // 1. Validate input
    if (!customerName || !customerEmail || !customerPhone || !items || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      })
    }
    
    // 2. Generate order ID
    const orderId = `ORD-${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    // 3. Create order in database
    const order = await Order.create({
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      deliveryStatus: 'pending',
      mpesaDetails: {},
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    // 4. Initiate M-Pesa STK Push
    const mpesaResponse = await initiateSTKPush(
      customerPhone,
      totalAmount,
      orderId,
      `AccordMedical-${orderId}`
    )
    
    // 5. Update order with M-Pesa details
    await Order.updateOne(
      { _id: order._id },
      {
        'mpesaDetails.CheckoutRequestID': mpesaResponse.CheckoutRequestID,
        'mpesaDetails.MerchantRequestID': mpesaResponse.MerchantRequestID,
        'mpesaDetails.PhoneNumber': customerPhone,
        updatedAt: new Date()
      }
    )
    
    // 6. Send order confirmation email to customer
    await sendOrderConfirmationEmail(order)
    
    // 7. Send order notification to admin
    await sendAdminOrderNotification(order)
    
    // 8. Return response
    res.status(201).json({
      success: true,
      message: 'Order created successfully. Please complete payment on your phone.',
      data: {
        orderId: order.orderId,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        checkoutRequestID: mpesaResponse.CheckoutRequestID
      }
    })
    
  } catch (error) {
    console.error('Order creation error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    })
  }
})

module.exports = router
```

---

## 5. Email Notifications

### Notification Flow

**When Order is Created:**
1. Customer receives order confirmation email
2. **Admin (sales@accordmedical.co.ke) receives new order notification** with:
   - Full customer details (name, email, phone)
   - Complete order breakdown
   - Payment status (pending)
   - Direct contact links (clickable email and phone)

**When Payment is Confirmed:**
1. Customer receives payment confirmation email
2. **Admin (sales@accordmedical.co.ke) receives payment confirmation** with:
   - M-Pesa receipt number
   - Customer contact details
   - Order ready for processing notification

**Why Admin Notifications:**
- Immediate awareness of new orders
- Quick access to customer contact information
- Streamlined order processing workflow
- No need to check dashboard constantly
- Can respond to customers quickly

### Email Templates Needed

1. **Order Confirmation Email (Customer)**
   - Sent immediately after order creation
   - To: Customer email
   - Subject: "Order Confirmation - Accord Medical Supplies"
   - Content: Order details, payment pending status

2. **New Order Notification Email (Admin)**
   - Sent immediately after order creation
   - To: sales@accordmedical.co.ke
   - Subject: "New Order Received - [ORDER_ID]"
   - Content: Full customer details, order items, payment status, contact information

3. **Payment Confirmation Email (Customer)**
   - Sent after successful M-Pesa payment
   - To: Customer email
   - Subject: "Payment Received - Order [ORDER_ID]"
   - Content: Payment receipt, order status, next steps

4. **Payment Confirmation Email (Admin)**
   - Sent after successful M-Pesa payment
   - To: sales@accordmedical.co.ke
   - Subject: "Payment Confirmed - Order [ORDER_ID]"
   - Content: M-Pesa receipt number, customer details, order ready for processing

5. **Order Processing Email (Customer)**
   - Sent when order starts processing
   - Subject: "Your Order is Being Processed"
   - Content: Estimated delivery timeline

### Email Service Integration

Use a service like:
- **Nodemailer** (SMTP)
- **SendGrid**
- **AWS SES**
- **Mailgun**

Example with Nodemailer:

```javascript
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

async function sendOrderConfirmationEmail(order) {
  const emailHtml = `
    <h1>Order Confirmation</h1>
    <p>Dear ${order.customerName},</p>
    <p>Thank you for your order!</p>
    <h2>Order Details</h2>
    <p><strong>Order ID:</strong> ${order.orderId}</p>
    <p><strong>Total Amount:</strong> KES ${order.totalAmount.toLocaleString()}</p>
    <h3>Items:</h3>
    <ul>
      ${order.items.map(item => `
        <li>${item.name} x ${item.quantity} - KES ${(item.price * item.quantity).toLocaleString()}</li>
      `).join('')}
    </ul>
    <p><strong>Payment Status:</strong> Pending - Please complete payment on your phone</p>
    <p>You'll receive another email once payment is confirmed.</p>
  `
  
  await transporter.sendMail({
    from: '"Accord Medical Supplies" <sales@accordmedical.co.ke>',
    to: order.customerEmail,
    subject: `Order Confirmation - ${order.orderId}`,
    html: emailHtml
  })
}

async function sendAdminOrderNotification(order) {
  const adminEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0096d9 0%, #00bcd4 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🎉 New Order Received!</h1>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #0096d9; margin-top: 0; border-bottom: 2px solid #0096d9; padding-bottom: 10px;">
            📋 Order Information
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; font-weight: bold; width: 40%;">Order ID:</td>
              <td style="padding: 10px; font-family: monospace; background: #f0f0f0;">${order.orderId}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold;">Order Date:</td>
              <td style="padding: 10px;">${new Date(order.createdAt).toLocaleString('en-KE')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold;">Payment Status:</td>
              <td style="padding: 10px;">
                <span style="background: #ffa500; color: white; padding: 5px 10px; border-radius: 5px; font-weight: bold;">
                  ${order.paymentStatus.toUpperCase()}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #0096d9; margin-top: 0; border-bottom: 2px solid #0096d9; padding-bottom: 10px;">
            👤 Customer Details
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; font-weight: bold; width: 40%;">Name:</td>
              <td style="padding: 10px;">${order.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold;">Email:</td>
              <td style="padding: 10px;">
                <a href="mailto:${order.customerEmail}" style="color: #0096d9;">${order.customerEmail}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold;">Phone:</td>
              <td style="padding: 10px;">
                <a href="tel:${order.customerPhone}" style="color: #0096d9;">${order.customerPhone}</a>
              </td>
            </tr>
          </table>
        </div>

        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #0096d9; margin-top: 0; border-bottom: 2px solid #0096d9; padding-bottom: 10px;">
            🛒 Order Items
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #0096d9; color: white;">
                <th style="padding: 12px; text-align: left;">Item</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Unit Price</th>
                <th style="padding: 12px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((item, index) => `
                <tr style="border-bottom: 1px solid #e0e0e0; ${index % 2 === 0 ? 'background: #f9f9f9;' : ''}">
                  <td style="padding: 12px;">${item.name}</td>
                  <td style="padding: 12px; text-align: center;">${item.quantity}</td>
                  <td style="padding: 12px; text-align: right;">KES ${item.price.toLocaleString()}</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold;">KES ${(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #0096d9; color: white; font-weight: bold;">
                <td colspan="3" style="padding: 15px; text-align: right; font-size: 16px;">TOTAL:</td>
                <td style="padding: 15px; text-align: right; font-size: 18px;">KES ${order.totalAmount.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #0096d9;">
          <h3 style="margin-top: 0; color: #0096d9;">⚡ Action Required:</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li style="margin: 8px 0;">Customer has been sent an M-Pesa payment prompt</li>
            <li style="margin: 8px 0;">You'll receive another notification when payment is confirmed</li>
            <li style="margin: 8px 0;">Contact customer at ${order.customerPhone} if needed</li>
          </ul>
        </div>
      </div>
      
      <div style="background: #333; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0;">Accord Medical Supplies Ltd | Sales Department</p>
        <p style="margin: 5px 0; font-size: 12px; color: #ccc;">Order notification system - Do not reply to this email</p>
      </div>
    </div>
  `
  
  await transporter.sendMail({
    from: '"Accord Medical System" <noreply@accordmedical.co.ke>',
    to: 'sales@accordmedical.co.ke',
    subject: `🆕 New Order - ${order.orderId} - KES ${order.totalAmount.toLocaleString()}`,
    html: adminEmailHtml,
    replyTo: order.customerEmail
  })
}

async function sendAdminPaymentNotification(order) {
  const adminPaymentHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #4caf50 0%, #8bc34a 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">✅ Payment Confirmed!</h1>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #4caf50; margin-top: 0; border-bottom: 2px solid #4caf50; padding-bottom: 10px;">
            💰 Payment Details
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; font-weight: bold; width: 40%;">Order ID:</td>
              <td style="padding: 10px; font-family: monospace;">${order.orderId}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold;">M-Pesa Receipt:</td>
              <td style="padding: 10px; font-family: monospace; background: #e8f5e9; font-weight: bold;">
                ${order.mpesaDetails.MpesaReceiptNumber || 'Pending'}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold;">Amount Paid:</td>
              <td style="padding: 10px; color: #4caf50; font-size: 18px; font-weight: bold;">
                KES ${order.totalAmount.toLocaleString()}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold;">Payment Time:</td>
              <td style="padding: 10px;">${new Date().toLocaleString('en-KE')}</td>
            </tr>
          </table>
        </div>

        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #4caf50; margin-top: 0; border-bottom: 2px solid #4caf50; padding-bottom: 10px;">
            📦 Ready for Processing
          </h2>
          <p style="margin: 15px 0;">Customer: <strong>${order.customerName}</strong></p>
          <p style="margin: 15px 0;">Phone: <a href="tel:${order.customerPhone}" style="color: #0096d9;">${order.customerPhone}</a></p>
          <p style="margin: 15px 0;">Email: <a href="mailto:${order.customerEmail}" style="color: #0096d9;">${order.customerEmail}</a></p>
        </div>

        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4caf50;">
          <h3 style="margin-top: 0; color: #4caf50;">✅ Next Steps:</h3>
          <ol style="margin: 10px 0; padding-left: 20px;">
            <li style="margin: 8px 0;">Process and prepare the order items</li>
            <li style="margin: 8px 0;">Contact customer to arrange delivery</li>
            <li style="margin: 8px 0;">Update order status in the system</li>
          </ol>
        </div>
      </div>
      
      <div style="background: #333; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0;">Accord Medical Supplies Ltd | Sales Department</p>
        <p style="margin: 5px 0; font-size: 12px; color: #ccc;">Payment notification system</p>
      </div>
    </div>
  `
  
  await transporter.sendMail({
    from: '"Accord Medical System" <noreply@accordmedical.co.ke>',
    to: 'sales@accordmedical.co.ke',
    subject: `✅ Payment Confirmed - ${order.orderId} - ${order.customerName}`,
    html: adminPaymentHtml,
    replyTo: order.customerEmail
  })
}
```

---

## 6. Security Considerations

1. **Validate M-Pesa Callback Origin**
   ```javascript
   // Verify callback is from Safaricom IPs
   const safaricomIPs = ['196.201.214.200', '196.201.214.206', '196.201.213.114']
   if (!safaricomIPs.includes(req.ip)) {
     return res.status(403).json({ success: false, message: 'Unauthorized' })
   }
   ```

2. **Use HTTPS Only**
   - Ensure all M-Pesa callbacks use HTTPS

3. **Validate Request Signatures**
   - Implement request signature validation if supported

4. **Rate Limiting**
   ```javascript
   // Prevent abuse
   const rateLimit = require('express-rate-limit')
   const orderLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5 // Max 5 orders per 15 minutes per IP
   })
   router.post('/orders', orderLimiter, orderHandler)
   ```

5. **Input Sanitization**
   ```javascript
   // Sanitize all user inputs
   const sanitize = require('mongo-sanitize')
   const cleanData = sanitize(req.body)
   ```

---

## 7. Error Handling

### Common Error Scenarios

1. **Invalid Phone Number**
   ```json
   { "success": false, "message": "Invalid phone number format" }
   ```

2. **Insufficient Funds**
   ```json
   { "success": false, "message": "Transaction failed - insufficient funds" }
   ```

3. **User Cancelled**
   ```json
   { "success": false, "message": "Payment cancelled by user" }
   ```

4. **Timeout**
   ```json
   { "success": false, "message": "Payment request timed out" }
   ```

5. **API Errors**
   ```json
   { "success": false, "message": "M-Pesa service unavailable" }
   ```

---

## 8. Testing

### Sandbox Testing

1. **Test Credentials:**
   - Use Safaricom Daraja Sandbox
   - Test Paybill: 174379
   - Test Phone: 254708374149

2. **Test Scenarios:**
   - Successful payment (PIN: Any 4 digits in sandbox)
   - Cancelled payment
   - Invalid phone number
   - Timeout

### Test Cases

```javascript
// 1. Create order with valid data
POST /api/orders
{
  "customerName": "Test User",
  "customerEmail": "test@example.com",
  "customerPhone": "254708374149",
  "items": [{ "consumableId": "xxx", "name": "Test Item", "quantity": 1, "price": 100 }],
  "totalAmount": 100,
  "paymentMethod": "mpesa"
}

// 2. Get order details
GET /api/orders/ORD-1234567890

// 3. Test callback
POST /api/mpesa/callback
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "test-123",
      "CheckoutRequestID": "ws_CO_test123",
      "ResultCode": 0,
      "ResultDesc": "Success"
    }
  }
}
```

---

## 9. Monitoring & Logging

### Important Logs to Capture

1. **Order Creation**
   ```javascript
   console.log(`Order created: ${orderId}, Customer: ${customerEmail}, Amount: ${totalAmount}`)
   ```

2. **M-Pesa Requests**
   ```javascript
   console.log(`M-Pesa STK Push initiated: ${checkoutRequestID}`)
   ```

3. **M-Pesa Callbacks**
   ```javascript
   console.log(`M-Pesa callback received: ${checkoutRequestID}, ResultCode: ${resultCode}`)
   ```

4. **Payment Status Changes**
   ```javascript
   console.log(`Payment status updated: ${orderId}, Status: ${paymentStatus}`)
   ```

---

## 13. Deployment Checklist

**Pre-Deployment:**
- [ ] Set up MongoDB/Database
- [ ] Configure M-Pesa API credentials
- [ ] Set up email service (SMTP/SendGrid)
- [ ] **Configure admin email: sales@accordmedical.co.ke**
- [ ] Configure environment variables
- [ ] Set up HTTPS/SSL certificate
- [ ] Configure callback URL in Daraja portal

**Testing Phase:**
- [ ] Test sandbox M-Pesa integration
- [ ] **Test admin notification emails (verify sales@accordmedical.co.ke receives them)**
- [ ] Test customer confirmation emails
- [ ] Test payment callback handling
- [ ] Test all error scenarios
- [ ] Verify email formatting on mobile devices

**Security:**
- [ ] Set up error monitoring (Sentry/LogRocket)
- [ ] Configure rate limiting
- [ ] Set up database backups
- [ ] Implement request validation
- [ ] Enable HTTPS only

**Production:**
- [ ] Test production M-Pesa credentials
- [ ] **Verify production admin emails work**
- [ ] Set up monitoring alerts
- [ ] Configure log retention
- [ ] Go live!

**Post-Launch:**
- [ ] Monitor admin email deliverability
- [ ] Check order processing workflow
- [ ] Gather feedback from sales team
- [ ] Monitor payment success rate

---

## 11. Admin Notification System (CRITICAL)

### Overview
Every order triggers automatic email notifications to **sales@accordmedical.co.ke** to ensure the sales team is immediately aware of new orders and can take quick action.

### What Admin Receives

#### 1. New Order Notification (Sent Immediately)
**Trigger:** When customer places order (before payment)

**Email Contains:**
```
Subject: 🆕 New Order - ORD-1702389012345 - KES 5,500

Content:
- Order ID with timestamp
- Payment Status: PENDING
- Customer Name, Email, Phone (all clickable)
- Complete order items table with quantities and prices
- Total amount
- Action items:
  * Customer sent M-Pesa prompt
  * Wait for payment confirmation
  * Contact details ready if needed
```

**Purpose:**
- Sales team aware of incoming order
- Can prepare items while waiting for payment
- Can follow up if payment takes too long
- Customer contact readily available

#### 2. Payment Confirmation Notification
**Trigger:** When M-Pesa payment is successful

**Email Contains:**
```
Subject: ✅ Payment Confirmed - ORD-1702389012345 - John Doe

Content:
- M-Pesa Receipt Number
- Amount Paid
- Payment Timestamp
- Customer Contact Details
- Next Steps:
  * Process and prepare order
  * Contact customer for delivery
  * Update order status
```

**Purpose:**
- Immediate notification that order is paid
- Ready to process and fulfill
- Clear action items
- Customer expects quick follow-up

### Email Features

**Professional HTML Design:**
- Color-coded status badges
- Responsive tables
- Clear sections with icons
- Clickable contact information
- Professional branding

**Actionable Links:**
- Email links open mail client: `mailto:customer@email.com`
- Phone links open phone dialer: `tel:254712345678`
- Reply-To header set to customer email

**Smart Formatting:**
- Currency formatted with commas (KES 5,500)
- Dates in Kenya timezone
- Clear visual hierarchy
- Mobile-friendly design

### Implementation Requirements

**Required Email Service:**
```javascript
// Use any SMTP service or email API:
// - Nodemailer (recommended for SMTP)
// - SendGrid (API-based)
// - AWS SES (scalable)
// - Mailgun (developer-friendly)
```

**Email Configuration:**
```env
# .env file
SMTP_HOST=smtp.gmail.com           # Or your SMTP provider
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@accordmedical.co.ke
SMTP_PASS=your_email_password
ADMIN_EMAIL=sales@accordmedical.co.ke
```

**Critical Settings:**
```javascript
// Both functions MUST be called in order creation
await sendOrderConfirmationEmail(order)      // Customer notification
await sendAdminOrderNotification(order)      // ⚠️ ADMIN NOTIFICATION - CRITICAL

// Both functions MUST be called in payment callback
await sendPaymentConfirmationEmail(order)    // Customer notification
await sendAdminPaymentNotification(order)    // ⚠️ ADMIN NOTIFICATION - CRITICAL
```

### Testing Admin Notifications

**Test Checklist:**
1. [ ] Create test order
2. [ ] Verify admin receives "New Order" email at sales@accordmedical.co.ke
3. [ ] Check email formatting is correct
4. [ ] Verify customer details are clickable
5. [ ] Complete payment in sandbox
6. [ ] Verify admin receives "Payment Confirmed" email
7. [ ] Check M-Pesa receipt number is included
8. [ ] Verify reply-to is set to customer email

**Test Email Content:**
```javascript
// Test both notification emails
await sendAdminOrderNotification({
  orderId: 'TEST-123',
  customerName: 'Test Customer',
  customerEmail: 'test@example.com',
  customerPhone: '254712345678',
  items: [{ name: 'Test Item', quantity: 1, price: 1000 }],
  totalAmount: 1000,
  paymentStatus: 'pending',
  createdAt: new Date()
})

await sendAdminPaymentNotification({
  orderId: 'TEST-123',
  customerName: 'Test Customer',
  customerEmail: 'test@example.com',
  customerPhone: '254712345678',
  totalAmount: 1000,
  mpesaDetails: {
    MpesaReceiptNumber: 'TEST123ABC'
  }
})
```

### Troubleshooting

**If Admin Not Receiving Emails:**

1. **Check Email Service Configuration**
   ```javascript
   // Test SMTP connection
   await transporter.verify()
   console.log('SMTP connection successful')
   ```

2. **Verify Admin Email Address**
   ```javascript
   // Ensure correct email in code
   to: 'sales@accordmedical.co.ke'  // Double-check spelling
   ```

3. **Check Spam Folder**
   - Admin emails might be filtered
   - Add sender to whitelist
   - Check email provider settings

4. **Enable Email Logging**
   ```javascript
   console.log('Sending admin notification to:', process.env.ADMIN_EMAIL)
   console.log('Order ID:', order.orderId)
   console.log('Email sent successfully')
   ```

5. **Test with Personal Email First**
   ```javascript
   // Temporarily send to your email for testing
   to: 'your-personal@email.com'
   ```

### Email Delivery Best Practices

**Improve Deliverability:**
1. Use proper SPF and DKIM records
2. Use authenticated SMTP service
3. Set proper From address (noreply@accordmedical.co.ke)
4. Include text version of email (not just HTML)
5. Don't send from free email services (Gmail, Yahoo, etc.)

**Recommended Services:**
- **SendGrid:** Easy setup, good deliverability, free tier
- **AWS SES:** Very reliable, low cost, requires verification
- **Mailgun:** Developer-friendly API, good documentation

### Security & Privacy

**Customer Data Protection:**
- Admin emails contain sensitive customer information
- Ensure email connection uses TLS/SSL
- Don't log full email content
- Comply with data protection regulations

**Email Authentication:**
- Use SPF records to verify sender
- Implement DKIM signatures
- Set up DMARC policy

---

## 12. Additional Features (Optional)

1. **Order Status Tracking API**
   - Real-time order status updates
   - WebSocket/polling for payment status

2. **Admin Dashboard**
   - View all orders
   - Update order status
   - Refund management

3. **SMS Notifications**
   - Order confirmation SMS
   - Payment receipt SMS
   - Delivery updates SMS

4. **Invoice Generation**
   - PDF invoice generation
   - Email invoice to customer

---

## Support & Resources

- **Safaricom Daraja Documentation:** https://developer.safaricom.co.ke/
- **M-Pesa API Reference:** https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
- **Backend Contact:** Developer team at Accord Medical Supplies

---

## Quick Reference: Admin Notification Implementation

### Minimum Required Code

```javascript
// 1. In order creation route (POST /api/orders)
const order = await Order.create({ /* order data */ })
await sendOrderConfirmationEmail(order)       // Customer email
await sendAdminOrderNotification(order)       // ⚠️ Admin email - REQUIRED

// 2. In M-Pesa callback route (POST /api/mpesa/callback)
if (ResultCode === 0) {
  await Order.updateOne({ /* payment success */ })
  await sendPaymentConfirmationEmail(order)    // Customer email
  await sendAdminPaymentNotification(order)    // ⚠️ Admin email - REQUIRED
}
```

### Environment Variables Required

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@accordmedical.co.ke
SMTP_PASS=your_secure_password
ADMIN_EMAIL=sales@accordmedical.co.ke

# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://app.codewithseth.co.ke/api/mpesa/callback
MPESA_ENVIRONMENT=production
```

### Email Recipients Summary

| Email Type | Recipient | When Sent | Purpose |
|------------|-----------|-----------|---------|
| Order Confirmation | Customer | Order created | Confirm order received |
| New Order Notification | **sales@accordmedical.co.ke** | Order created | Alert admin of new order |
| Payment Confirmation | Customer | Payment successful | Confirm payment received |
| Payment Notification | **sales@accordmedical.co.ke** | Payment successful | Alert admin to process order |

### API Response to Frontend

```javascript
// Success response
{
  "success": true,
  "message": "Order created successfully. Please complete payment on your phone.",
  "data": {
    "orderId": "ORD-1702389012345",
    "customerName": "John Doe",
    "totalAmount": 5500,
    "paymentStatus": "pending",
    "checkoutRequestID": "ws_CO_12345678901234567890"
  }
}

// Note: Admin notification happens in background
// Frontend doesn't need to know about it
// If email fails, log error but don't fail the order
```

### Testing Endpoint (Optional - For Development)

Create a test endpoint to verify admin emails work:

```javascript
// routes/test.js
router.post('/test/admin-notification', async (req, res) => {
  try {
    const testOrder = {
      orderId: req.body.orderId || 'TEST-' + Date.now(),
      customerName: req.body.customerName || 'Test Customer',
      customerEmail: req.body.customerEmail || 'test@example.com',
      customerPhone: req.body.customerPhone || '254712345678',
      items: req.body.items || [
        { name: 'Test Surgical Gloves', quantity: 2, price: 1500 },
        { name: 'Test Face Masks', quantity: 5, price: 500 }
      ],
      totalAmount: req.body.totalAmount || 5500,
      paymentStatus: 'pending',
      createdAt: new Date()
    }

    // Send admin notification
    await sendAdminOrderNotification(testOrder)

    res.json({
      success: true,
      message: 'Test admin notification sent successfully',
      sentTo: 'sales@accordmedical.co.ke',
      orderId: testOrder.orderId
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message
    })
  }
})
```

### Testing Command

```bash
# Send test admin notification
curl -X POST http://localhost:5000/api/test/admin-notification \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-123",
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "customerPhone": "254712345678",
    "items": [{"name": "Test Item", "quantity": 1, "price": 1000}],
    "totalAmount": 1000
  }'

# Expected: Email received at sales@accordmedical.co.ke within 5 seconds
```

### Remove Test Endpoint in Production

```javascript
// Only enable in development
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testRoutes)
}
```

---

**Last Updated:** December 12, 2025  
**Version:** 2.0  
**Admin Notification:** IMPLEMENTED ✅
