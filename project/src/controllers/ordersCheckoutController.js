import Order from '../models/Order.js';
import logger from '../utils/logger.js';
import { 
  generateAccessToken, 
  initiateSTKPush, 
  querySTKPushStatus 
} from '../services/mpesaService.js';
import { 
  sendOrderConfirmationEmail, 
  sendAdminOrderNotification,
  sendPaymentConfirmationEmail,
  sendAdminPaymentNotification
} from '../services/emailService.js';

/**
 * Create order and initiate M-Pesa STK Push payment
 * @route POST /api/orders/checkout
 * @access Public
 */
export const createOrderCheckout = async (req, res) => {
  try {
    const { 
      customerName, 
      customerEmail, 
      customerPhone, 
      items, 
      totalAmount, 
      paymentMethod = 'mpesa'
    } = req.body;

    // Validation
    if (!customerName || !customerEmail || !customerPhone || !items || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customerName, customerEmail, customerPhone, items, totalAmount'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required and must have at least one item'
      });
    }

    // Validate phone number format (254XXXXXXXXX)
    const phoneRegex = /^254\d{9}$/;
    if (!phoneRegex.test(customerPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be in format 254XXXXXXXXX'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    // Verify totalAmount matches sum of items
    const calculatedTotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);

    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Total amount mismatch. Expected ${calculatedTotal}, got ${totalAmount}`
      });
    }

    // Generate unique order ID
    const orderId = `ORD-${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order in database
    const orderData = {
      orderNumber: orderId,
      client: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        type: 'other'
      },
      items: items.map(item => ({
        productId: item.consumableId || item.productId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.quantity * item.price
      })),
      subtotal: totalAmount,
      totalAmount: totalAmount,
      paymentMethod: paymentMethod,
      paymentStatus: 'pending',
      status: 'pending',
      currency: 'KES'
    };

    const order = await Order.create(orderData);

    logger.info(`Order created: ${order._id}, Order Number: ${orderId}, Amount: ${totalAmount}`);

    // Initiate M-Pesa STK Push
    let mpesaResponse;
    try {
      mpesaResponse = await initiateSTKPush(
        customerPhone,
        Math.round(totalAmount),
        orderId,
        `AccordMedical-${orderId}`
      );

      // Update order with M-Pesa details
      await Order.updateOne(
        { _id: order._id },
        {
          'mpesaDetails.checkoutRequestID': mpesaResponse.CheckoutRequestID,
          'mpesaDetails.merchantRequestID': mpesaResponse.MerchantRequestID,
          'mpesaDetails.phoneNumber': customerPhone
        }
      );

      logger.info(`M-Pesa STK Push initiated: ${mpesaResponse.CheckoutRequestID}`);
    } catch (mpesaError) {
      logger.error('M-Pesa initiation error:', mpesaError);
      // Don't fail the order creation, but log the error
      return res.status(500).json({
        success: false,
        message: 'Failed to initiate M-Pesa payment',
        error: mpesaError.message
      });
    }

    // Send order confirmation email to customer
    try {
      await sendOrderConfirmationEmail(order, customerEmail);
      logger.info(`Order confirmation email sent to: ${customerEmail}`);
    } catch (emailError) {
      logger.error('Customer email error:', emailError);
    }

    // Send order notification to admin
    try {
      await sendAdminOrderNotification(order, customerName, customerEmail, customerPhone);
      logger.info('Admin order notification sent');
    } catch (adminEmailError) {
      logger.error('Admin email error:', adminEmailError);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully. Please complete payment on your phone.',
      data: {
        orderId: order.orderNumber,
        customerName: customerName,
        totalAmount: totalAmount,
        paymentStatus: order.paymentStatus,
        checkoutRequestID: mpesaResponse.CheckoutRequestID
      }
    });

  } catch (error) {
    logger.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get order details by order ID
 * @route GET /api/orders/:orderId
 * @access Public
 */
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderNumber: orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    logger.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details'
    });
  }
};

/**
 * Get customer orders by email
 * @route GET /api/orders/customer/:email
 * @access Public
 */
export const getCustomerOrders = async (req, res) => {
  try {
    const { email } = req.params;

    const orders = await Order.find({ 'client.email': email }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    logger.error('Get customer orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer orders'
    });
  }
};

/**
 * M-Pesa Callback Handler
 * @route POST /api/mpesa/callback
 * @access Private (M-Pesa Safaricom)
 */
export const mpesaCallback = async (req, res) => {
  try {
    const { Body } = req.body;
    
    if (!Body || !Body.stkCallback) {
      logger.error('Invalid M-Pesa callback format');
      return res.json({
        ResultCode: 1,
        ResultDesc: 'Invalid callback format'
      });
    }

    const { 
      MerchantRequestID, 
      CheckoutRequestID, 
      ResultCode, 
      ResultDesc,
      CallbackMetadata 
    } = Body.stkCallback;

    logger.info(`M-Pesa Callback received: CheckoutRequestID=${CheckoutRequestID}, ResultCode=${ResultCode}`);

    // Find order by CheckoutRequestID
    const order = await Order.findOne({
      'mpesaDetails.checkoutRequestID': CheckoutRequestID
    });

    if (!order) {
      logger.error(`Order not found for CheckoutRequestID: ${CheckoutRequestID}`);
      return res.json({
        ResultCode: 1,
        ResultDesc: 'Order not found'
      });
    }

    if (ResultCode === 0) {
      // Payment successful
      logger.info(`Payment successful for Order: ${order.orderNumber}`);

      // Extract callback metadata
      const metadata = CallbackMetadata?.Item || [];
      const mpesaReceipt = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = metadata.find(item => item.Name === 'TransactionDate')?.Value;
      const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;
      const amount = metadata.find(item => item.Name === 'Amount')?.Value;

      // Update order with payment details
      await Order.updateOne(
        { _id: order._id },
        {
          paymentStatus: 'paid',
          status: 'processing',
          'mpesaDetails.mpesaReceiptNumber': mpesaReceipt,
          'mpesaDetails.transactionDate': new Date(transactionDate?.toString().slice(0, 14)),
          'mpesaDetails.phoneNumber': phoneNumber,
          updatedAt: new Date()
        }
      );

      logger.info(`Order updated with M-Pesa receipt: ${mpesaReceipt}`);

      // Fetch updated order
      const updatedOrder = await Order.findById(order._id);

      // Send payment confirmation email to customer
      try {
        await sendPaymentConfirmationEmail(updatedOrder);
        logger.info(`Payment confirmation email sent to customer`);
      } catch (emailError) {
        logger.error('Customer payment confirmation email error:', emailError);
      }

      // Send admin payment notification
      try {
        await sendAdminPaymentNotification(updatedOrder);
        logger.info('Admin payment notification sent');
      } catch (adminEmailError) {
        logger.error('Admin payment confirmation email error:', adminEmailError);
      }

      return res.json({
        ResultCode: 0,
        ResultDesc: 'Payment received successfully'
      });

    } else {
      // Payment failed or cancelled
      logger.warn(`Payment failed for Order: ${order.orderNumber}, ResultCode: ${ResultCode}, Desc: ${ResultDesc}`);

      // Update order status to failed
      await Order.updateOne(
        { _id: order._id },
        {
          paymentStatus: 'cancelled',
          status: 'cancelled',
          updatedAt: new Date()
        }
      );

      logger.info(`Order marked as failed: ${order.orderNumber}`);

      return res.json({
        ResultCode: 0,
        ResultDesc: 'Callback received and processed'
      });
    }

  } catch (error) {
    logger.error('M-Pesa callback error:', error);
    return res.json({
      ResultCode: 1,
      ResultDesc: 'Error processing callback'
    });
  }
};

/**
 * Query payment status (for polling)
 * @route GET /api/orders/status/:checkoutRequestID
 * @access Public
 */
export const queryPaymentStatus = async (req, res) => {
  try {
    const { checkoutRequestID } = req.params;

    const order = await Order.findOne({
      'mpesaDetails.checkoutRequestID': checkoutRequestID
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    // Try to query M-Pesa status
    try {
      const mpesaStatus = await querySTKPushStatus(checkoutRequestID);
      
      res.json({
        success: true,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        mpesaStatus: mpesaStatus,
        lastUpdated: order.updatedAt
      });
    } catch (mpesaError) {
      logger.warn('M-Pesa status query error:', mpesaError);
      
      // Return order status from database if M-Pesa query fails
      res.json({
        success: true,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        lastUpdated: order.updatedAt
      });
    }

  } catch (error) {
    logger.error('Query payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to query payment status'
    });
  }
};

/**
 * Get all orders (Admin)
 * @route GET /api/admin/orders
 * @access Private (Admin)
 */
export const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, paymentStatus } = req.query;

    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      count: orders.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: orders
    });

  } catch (error) {
    logger.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};
