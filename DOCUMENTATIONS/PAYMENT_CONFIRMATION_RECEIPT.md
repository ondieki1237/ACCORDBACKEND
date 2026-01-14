# Payment Confirmation & Receipt Generation Implementation

## Overview
This document outlines the implementation of payment confirmation interface and receipt generation for the M-Pesa checkout system.

## Architecture

### Flow
1. **Customer submits order** → Backend creates order and initiates STK Push
2. **Customer enters M-Pesa PIN** → Payment processed by Safaricom
3. **M-Pesa sends callback** → Backend updates order status
4. **Frontend polls/listens** → Detects payment success
5. **Show confirmation page** → Display success message with order details
6. **Generate receipt** → PDF/HTML receipt with full transaction details

---

## Backend Implementation

### 1. Receipt Data Endpoint
**Endpoint:** `GET /api/orders/:orderId/receipt`
**Purpose:** Fetch formatted receipt data for a completed order

**Response:**
```json
{
  "success": true,
  "data": {
    "receiptNumber": "RCP-1234567890",
    "orderNumber": "ORD-1234567890",
    "orderDate": "2025-12-12T10:30:00Z",
    "paymentDate": "2025-12-12T10:32:15Z",
    "paymentStatus": "paid",
    "facility": {
      "name": "Nairobi Hospital",
      "type": "Hospital",
      "address": "123 Medical Way",
      "city": "Nairobi",
      "county": "Nairobi"
    },
    "primaryContact": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "254712345678",
      "jobTitle": "Procurement Officer"
    },
    "items": [
      {
        "name": "Surgical Gloves",
        "quantity": 100,
        "price": 50,
        "total": 5000
      }
    ],
    "summary": {
      "subtotal": 5000,
      "tax": 0,
      "total": 5000,
      "currency": "KES"
    },
    "payment": {
      "method": "M-Pesa",
      "mpesaReceiptNumber": "NLJ7RT61SV",
      "phoneNumber": "254712345678",
      "transactionDate": "2025-12-12T10:32:15Z"
    },
    "company": {
      "name": "Accord Medical",
      "email": "sales@accordmedical.co.ke",
      "phone": "+254 700 000000",
      "address": "Nairobi, Kenya"
    }
  }
}
```

### 2. PDF Receipt Generation Endpoint
**Endpoint:** `GET /api/orders/:orderId/receipt/pdf`
**Purpose:** Generate downloadable PDF receipt

**Implementation Options:**
- **Option A:** Use `pdfkit` or `puppeteer` for server-side PDF generation
- **Option B:** Return HTML template and use client-side PDF library
- **Option C:** Use external service like SendGrid or PDF API

### 3. Email Receipt Endpoint
**Endpoint:** `POST /api/orders/:orderId/receipt/email`
**Purpose:** Send receipt to customer email

---

## Frontend Implementation

### 1. Payment Status Polling
After order submission, poll the order status every 3-5 seconds until payment is confirmed.

```javascript
// Poll for payment status
const checkPaymentStatus = async (orderId) => {
  const response = await fetch(`/api/orders/${orderId}`)
  const data = await response.json()
  return data.data.paymentStatus
}

// Polling loop
const pollInterval = setInterval(async () => {
  const status = await checkPaymentStatus(orderId)
  if (status === 'paid') {
    clearInterval(pollInterval)
    showSuccessPage()
  } else if (status === 'cancelled' || status === 'failed') {
    clearInterval(pollInterval)
    showErrorPage()
  }
}, 5000) // Check every 5 seconds
```

### 2. Success Confirmation Page
**Route:** `/checkout/success?orderId=ORD-xxx`

**Components:**
- ✅ Success icon/animation
- Order number display
- Payment confirmation message
- Order summary (items, total)
- M-Pesa receipt number
- Download receipt button
- Email receipt button
- Continue shopping button

### 3. Receipt View Page
**Route:** `/receipt/:orderId`

**Features:**
- Professional receipt layout
- Company branding (logo, colors)
- All transaction details
- Print functionality
- Download as PDF
- Email to customer

---

## Database Schema Updates

### Order Model - Add Receipt Fields
```javascript
{
  receiptNumber: {
    type: String,
    unique: true,
    // Auto-generated: RCP-{timestamp}
  },
  receiptGenerated: {
    type: Boolean,
    default: false
  },
  receiptGeneratedAt: Date,
  receiptUrl: String, // If storing PDF in cloud
}
```

---

## Implementation Steps

### Phase 1: Backend Receipt Data (30 mins)
1. ✅ Add receipt number generation to Order model
2. ✅ Create GET /api/orders/:orderId/receipt endpoint
3. ✅ Format receipt data with all required fields
4. ✅ Add validation for paid orders only

### Phase 2: Frontend Success Page (45 mins)
1. ✅ Create success page component
2. ✅ Implement payment status polling
3. ✅ Display order confirmation details
4. ✅ Add animations and success indicators
5. ✅ Handle timeout scenarios (30-60 seconds max)

### Phase 3: Receipt Display (30 mins)
1. ✅ Create receipt template component
2. ✅ Style for print/PDF (clean, professional)
3. ✅ Add print functionality
4. ✅ Responsive design

### Phase 4: PDF Generation (Optional - 60 mins)
1. ✅ Install PDF library (puppeteer/pdfkit)
2. ✅ Create PDF template
3. ✅ Implement download endpoint
4. ✅ Test PDF output

### Phase 5: Email Receipt (30 mins)
1. ✅ Create email template
2. ✅ Implement send receipt endpoint
3. ✅ Attach PDF to email
4. ✅ Test email delivery

---

## Technical Stack

### Backend
- **PDF Generation:** `puppeteer` (headless Chrome) or `pdfkit`
- **Email Templates:** Existing emailService.js
- **File Storage:** Cloudinary or local storage

### Frontend
- **Polling:** `setInterval` with cleanup
- **Print:** `window.print()` with CSS @media print
- **PDF Client:** `jsPDF` or `html2pdf.js` (if client-side)
- **UI:** Success animations with Tailwind CSS

---

## Security Considerations

1. **Authorization:** Verify order belongs to customer before showing receipt
2. **Receipt Access:** 
   - Public link with secure token, OR
   - Require email verification, OR
   - Store in user session
3. **Data Privacy:** Mask sensitive info (partial phone, partial card)
4. **Rate Limiting:** Prevent receipt generation spam

---

## UI/UX Design

### Success Page Layout
```
┌─────────────────────────────────────┐
│  ✅ Payment Successful!             │
│                                     │
│  Order Number: ORD-1234567890       │
│  M-Pesa Receipt: NLJ7RT61SV         │
│                                     │
│  Order Summary:                     │
│  • Surgical Gloves x 100 - KES 5000 │
│  • Syringes x 50 - KES 2500         │
│                                     │
│  Total Paid: KES 7,500              │
│                                     │
│  [📄 Download Receipt]              │
│  [📧 Email Receipt]                 │
│  [🏠 Continue Shopping]             │
└─────────────────────────────────────┘
```

### Receipt Template Layout
```
┌─────────────────────────────────────┐
│  ACCORD MEDICAL                     │
│  Official Receipt                   │
│                                     │
│  Receipt #: RCP-1234567890          │
│  Order #: ORD-1234567890            │
│  Date: Dec 12, 2025                 │
│                                     │
│  Bill To:                           │
│  Nairobi Hospital                   │
│  John Doe                           │
│  john@example.com                   │
│                                     │
│  Items:                             │
│  Surgical Gloves      100  KES 5000 │
│  Syringes              50  KES 2500 │
│                       ───────────── │
│  Total:                   KES 7500  │
│                                     │
│  Payment Method: M-Pesa             │
│  Receipt: NLJ7RT61SV                │
│                                     │
│  Thank you for your business!       │
└─────────────────────────────────────┘
```

---

## Error Handling

### Scenarios
1. **Payment Timeout:** STK push sent but no response after 60 seconds
   - Show: "Payment pending. Check your M-Pesa messages."
   - Action: Allow user to check status later

2. **Payment Failed:** User cancelled or insufficient funds
   - Show: "Payment failed. Please try again."
   - Action: Return to checkout with retry option

3. **Network Error:** Can't fetch order status
   - Show: "Connection issue. Retrying..."
   - Action: Retry with exponential backoff

4. **Receipt Not Available:** Order unpaid
   - Show: "Receipt available after payment confirmation"
   - Action: Redirect to order status page

---

## Testing Checklist

### Backend
- [ ] Receipt endpoint returns correct data structure
- [ ] Only paid orders can generate receipts
- [ ] Receipt numbers are unique
- [ ] PDF generates correctly
- [ ] Email sends with attachment

### Frontend
- [ ] Status polling works correctly
- [ ] Success page displays all details
- [ ] Receipt page prints properly
- [ ] PDF downloads successfully
- [ ] Email receipt works
- [ ] Handle timeout gracefully
- [ ] Mobile responsive

---

## Future Enhancements

1. **WhatsApp Receipt:** Send via WhatsApp Business API
2. **SMS Receipt:** Send receipt link via SMS
3. **Receipt History:** Customer dashboard to view all receipts
4. **Invoice Generation:** For bulk orders
5. **Multi-currency:** Support USD, EUR
6. **Tax Calculation:** VAT/Tax breakdown
7. **Discount Codes:** Apply promo codes
8. **Delivery Tracking:** Link receipt to delivery status

---

## API Documentation

### Get Receipt Data
```
GET /api/orders/:orderId/receipt
Headers: None (public with order ID)
Response: 200 OK + receipt JSON
Errors: 404 (not found), 400 (not paid)
```

### Download PDF Receipt
```
GET /api/orders/:orderId/receipt/pdf
Response: PDF file download
Headers: Content-Type: application/pdf
```

### Email Receipt
```
POST /api/orders/:orderId/receipt/email
Body: { "email": "customer@example.com" }
Response: 200 OK + { "sent": true }
```

---

## Deployment Notes

1. Install dependencies: `npm install puppeteer pdfkit`
2. Update .env: Add RECEIPT_LOGO_URL, COMPANY_INFO
3. Test in sandbox first
4. Monitor PDF generation performance
5. Set up Cloudinary for PDF storage (optional)
6. Configure email templates

---

## Cost Considerations

- **PDF Generation:** Puppeteer requires Chrome (~300MB). Consider Lambda layer or Docker.
- **Storage:** Store PDFs in Cloudinary (free tier: 25GB)
- **Email:** SendGrid free tier: 100 emails/day
- **Server Load:** PDF generation is CPU-intensive. Use queue for high volume.

---

## Conclusion

This implementation provides a complete payment confirmation and receipt system that:
- ✅ Confirms successful payments to customers
- ✅ Generates professional receipts
- ✅ Supports multiple delivery methods (view, download, email)
- ✅ Enhances customer trust and professionalism
- ✅ Maintains transaction records

Total implementation time: **3-4 hours** for basic version, **6-8 hours** with PDF and email.
