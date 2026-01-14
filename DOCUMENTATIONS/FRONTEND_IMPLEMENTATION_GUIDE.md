# Frontend Implementation Guide - Payment Confirmation & Receipt

## Quick Start

### 1. Payment Success Page Component

Create: `app/checkout/success/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Download, Mail, Home, Loader2 } from 'lucide-react'

interface OrderData {
  orderNumber: string
  facility: { name: string; city: string; county: string }
  primaryContact: { name: string; email: string; phone: string }
  totalAmount: number
  itemCount: number
  paymentStatus: string
  mpesaDetails?: { mpesaReceiptNumber?: string }
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')
  
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [polling, setPolling] = useState(true)

  // Poll for payment confirmation
  useEffect(() => {
    if (!orderId) {
      setError('Order ID not found')
      setLoading(false)
      return
    }

    let pollCount = 0
    const maxPolls = 20 // 20 * 5 seconds = 100 seconds max

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`https://app.codewithseth.co.ke/api/orders/${orderId}`)
        const data = await response.json()

        if (data.success) {
          setOrder(data.data)
          
          // If payment is confirmed, stop polling
          if (data.data.paymentStatus === 'paid') {
            setPolling(false)
            setLoading(false)
          } else if (data.data.paymentStatus === 'cancelled' || data.data.paymentStatus === 'failed') {
            setPolling(false)
            setLoading(false)
            setError('Payment was not completed')
          }
        }
      } catch (err) {
        console.error('Error checking payment status:', err)
      }

      pollCount++
      if (pollCount >= maxPolls) {
        setPolling(false)
        setLoading(false)
        setError('Payment confirmation timeout. Please check your M-Pesa messages.')
      }
    }

    // Initial check
    checkPaymentStatus()

    // Poll every 5 seconds
    const interval = setInterval(() => {
      if (polling && pollCount < maxPolls) {
        checkPaymentStatus()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [orderId, polling])

  const downloadReceipt = () => {
    window.open(`/receipt/${orderId}`, '_blank')
  }

  const emailReceipt = async () => {
    // TODO: Implement email receipt
    alert('Receipt will be sent to your email')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Confirming your payment...</h2>
          <p className="text-gray-600 mt-2">Please wait while we verify your M-Pesa payment</p>
          <p className="text-sm text-gray-500 mt-4">This may take up to 60 seconds</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Issue</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/checkout')}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Thank you for your order. Your payment has been confirmed.
          </p>

          {/* Order Details */}
          <div className="border-t border-b border-gray-200 py-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-semibold text-gray-900">{order.orderNumber}</p>
              </div>
              {order.mpesaDetails?.mpesaReceiptNumber && (
                <div>
                  <p className="text-sm text-gray-600">M-Pesa Receipt</p>
                  <p className="font-semibold text-gray-900">{order.mpesaDetails.mpesaReceiptNumber}</p>
                </div>
              )}
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Facility</p>
              <p className="font-semibold text-gray-900">{order.facility.name}</p>
              <p className="text-sm text-gray-600">{order.facility.city}, {order.facility.county}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Contact Person</p>
              <p className="font-semibold text-gray-900">{order.primaryContact.name}</p>
              <p className="text-sm text-gray-600">{order.primaryContact.email}</p>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Amount</span>
                <span className="text-2xl font-bold text-green-600">
                  KES {order.totalAmount.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 text-right mt-1">
                {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={downloadReceipt}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              <Download className="w-5 h-5" />
              View & Download Receipt
            </button>

            <button
              onClick={emailReceipt}
              className="w-full flex items-center justify-center gap-2 bg-white border-2 border-green-600 text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition"
            >
              <Mail className="w-5 h-5" />
              Email Receipt
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              <Home className="w-5 h-5" />
              Continue Shopping
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <p className="text-sm text-blue-800">
            📧 A confirmation email has been sent to <strong>{order.primaryContact.email}</strong>
          </p>
          <p className="text-xs text-blue-600 mt-2">
            If you have any questions, contact us at sales@accordmedical.co.ke
          </p>
        </div>
      </div>
    </div>
  )
}
```

### 2. Receipt View Page

Create: `app/receipt/[orderId]/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Printer } from 'lucide-react'

interface ReceiptData {
  receiptNumber: string
  orderNumber: string
  orderDate: string
  paymentDate: string
  facility: any
  primaryContact: any
  items: Array<{ name: string; quantity: number; price: number; total: number }>
  summary: { subtotal: number; tax: number; total: number; currency: string }
  payment: any
  company: any
}

export default function ReceiptPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string

  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReceipt()
  }, [orderId])

  const fetchReceipt = async () => {
    try {
      const response = await fetch(`https://app.codewithseth.co.ke/api/orders/${orderId}/receipt`)
      const data = await response.json()

      if (data.success) {
        setReceipt(data.data)
      } else {
        setError(data.message || 'Failed to load receipt')
      }
    } catch (err) {
      setError('Failed to load receipt')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // TODO: Implement PDF download
    handlePrint()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading receipt...</p>
        </div>
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Receipt Not Available</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Action Bar - Hidden when printing */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Receipt */}
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 print:shadow-none print:p-12">
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{receipt.company.name}</h1>
          <p className="text-gray-600">{receipt.company.address}</p>
          <p className="text-gray-600">{receipt.company.email} • {receipt.company.phone}</p>
          <h2 className="text-2xl font-semibold text-green-600 mt-4">OFFICIAL RECEIPT</h2>
        </div>

        {/* Receipt & Order Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-sm text-gray-600 mb-1">Receipt Number</p>
            <p className="text-lg font-bold text-gray-900">{receipt.receiptNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Order Number</p>
            <p className="text-lg font-bold text-gray-900">{receipt.orderNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Order Date</p>
            <p className="font-semibold text-gray-900">
              {new Date(receipt.orderDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Payment Date</p>
            <p className="font-semibold text-gray-900">
              {new Date(receipt.paymentDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
          <p className="font-semibold text-gray-900">{receipt.facility.name}</p>
          <p className="text-gray-700">{receipt.facility.type}</p>
          <p className="text-gray-700">{receipt.facility.address}</p>
          <p className="text-gray-700">{receipt.facility.city}, {receipt.facility.county}</p>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="font-semibold text-gray-900">{receipt.primaryContact.name}</p>
            <p className="text-gray-700">{receipt.primaryContact.jobTitle}</p>
            <p className="text-gray-700">{receipt.primaryContact.email}</p>
            <p className="text-gray-700">{receipt.primaryContact.phone}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Item</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Qty</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Price</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {receipt.items.map((item, index) => (
                <tr key={index}>
                  <td className="py-4 px-4 text-gray-900">{item.name}</td>
                  <td className="py-4 px-4 text-center text-gray-900">{item.quantity}</td>
                  <td className="py-4 px-4 text-right text-gray-900">
                    {receipt.summary.currency} {item.price.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-gray-900">
                    {receipt.summary.currency} {item.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 border-t border-gray-200">
              <span className="text-gray-700">Subtotal:</span>
              <span className="font-semibold text-gray-900">
                {receipt.summary.currency} {receipt.summary.subtotal.toLocaleString()}
              </span>
            </div>
            {receipt.summary.tax > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Tax:</span>
                <span className="font-semibold text-gray-900">
                  {receipt.summary.currency} {receipt.summary.tax.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-gray-900">
              <span className="text-lg font-bold text-gray-900">Total:</span>
              <span className="text-lg font-bold text-green-600">
                {receipt.summary.currency} {receipt.summary.total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="p-6 bg-green-50 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-semibold text-gray-900">{receipt.payment.method}</p>
            </div>
            {receipt.payment.mpesaReceiptNumber && (
              <div>
                <p className="text-sm text-gray-600">M-Pesa Receipt</p>
                <p className="font-semibold text-gray-900">{receipt.payment.mpesaReceiptNumber}</p>
              </div>
            )}
            {receipt.payment.phoneNumber && (
              <div>
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="font-semibold text-gray-900">{receipt.payment.phoneNumber}</p>
              </div>
            )}
            {receipt.payment.transactionDate && (
              <div>
                <p className="text-sm text-gray-600">Transaction Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(receipt.payment.transactionDate).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-lg font-semibold text-gray-900 mb-2">Thank you for your business!</p>
          <p className="text-sm text-gray-600">
            For any inquiries, please contact us at {receipt.company.email}
          </p>
          <p className="text-xs text-gray-500 mt-4">
            This is a computer-generated receipt and does not require a signature.
          </p>
        </div>
      </div>
    </div>
  )
}
```

### 3. Update Checkout Page to Redirect on Success

Update your checkout submit handler:

```typescript
const handleCheckout = async () => {
  // ... existing checkout code ...
  
  const response = await fetch('https://app.codewithseth.co.ke/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderPayload)
  })
  
  const data = await response.json()
  
  if (data.success) {
    // Redirect to success page with order ID
    router.push(`/checkout/success?orderId=${data.data.orderId}`)
  }
}
```

### 4. Add Print Styles

Add to your global CSS or create `app/globals.css`:

```css
@media print {
  /* Hide navigation, buttons, etc */
  .print\\:hidden {
    display: none !important;
  }
  
  /* Remove shadows and backgrounds for printing */
  .print\\:shadow-none {
    box-shadow: none !important;
  }
  
  /* Adjust padding for print */
  .print\\:p-12 {
    padding: 3rem !important;
  }
  
  /* Ensure page breaks properly */
  @page {
    margin: 1cm;
  }
  
  /* Prevent page breaks inside elements */
  .print\\:break-inside-avoid {
    break-inside: avoid;
  }
}
```

## API Endpoints Used

1. **GET /api/orders/:orderId** - Fetch order details and status
2. **GET /api/orders/:orderId/receipt** - Fetch receipt data
3. **(Future) GET /api/orders/:orderId/receipt/pdf** - Download PDF

## Testing Checklist

- [ ] Success page loads after checkout
- [ ] Payment status polling works
- [ ] Success message displays correctly
- [ ] Receipt page shows all order details
- [ ] Print functionality works
- [ ] Back button works
- [ ] Mobile responsive
- [ ] Loading states display
- [ ] Error states handled

## Next Steps

1. Deploy backend with new receipt endpoint
2. Create frontend pages as shown above
3. Test full flow: Checkout → Payment → Success → Receipt
4. Add PDF generation (optional)
5. Add email receipt functionality (optional)

