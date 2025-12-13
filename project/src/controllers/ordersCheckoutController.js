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
} from '../services/emailServiceCheckout.js';

/**
 * Create order and initiate M-Pesa STK Push payment
 * @route POST /api/orders
 * @access Public
 */
export const createOrderCheckout = async (req, res) => {
  try {
    const { 
      orderNumber,
      primaryContact, 
      facility,
      alternativeContact,
      items, 
      totalAmount, 
      paymentMethod = 'mpesa'
    } = req.body;

    // Validation - Required fields
    if (!primaryContact || !facility || !alternativeContact || !items || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: 'Missing required fields: primaryContact, facility, alternativeContact, items, totalAmount'
      });
    }

    // Validate primary contact
    if (!primaryContact.name || !primaryContact.email || !primaryContact.phone || !primaryContact.jobTitle) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: 'primaryContact must include: name, email, phone, jobTitle'
      });
    }

    // Validate facility
    if (!facility.name || !facility.type || !facility.address || !facility.city || !facility.county) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: 'facility must include: name, type, address, city, county'
      });
    }

    // Validate alternative contact
    if (!alternativeContact.name || !alternativeContact.email || !alternativeContact.phone || !alternativeContact.relationship) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: 'alternativeContact must include: name, email, phone, relationship'
      });
    }

    // Delivery removed

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: 'Items array is required and must have at least one item'
      });
    }

    // Validate phone number format (254XXXXXXXXX)
    const phoneRegex = /^254\d{9}$/;
    if (!phoneRegex.test(primaryContact.phone)) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: 'primaryContact.phone must be in format 254XXXXXXXXX'
      });
    }

    if (!phoneRegex.test(alternativeContact.phone)) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: 'alternativeContact.phone must be in format 254XXXXXXXXX'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(primaryContact.email)) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: 'primaryContact.email is invalid'
      });
    }

    if (!emailRegex.test(alternativeContact.email)) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: 'alternativeContact.email is invalid'
      });
    }

    // Validate postal code format (5 digits)
    // Postal code optional now

    // Verify totalAmount matches sum of items
    const calculatedTotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);

    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: `Total amount mismatch. Expected ${calculatedTotal}, got ${totalAmount}`
      });
    }

    // Ensure order number exists (prefer client-provided, fallback to server-generated)
    const generatedOrderNumber = orderNumber || `ORD-${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create order in database
    const orderData = {
      orderNumber: generatedOrderNumber,
      primaryContact: {
        name: primaryContact.name,
        email: primaryContact.email,
        phone: primaryContact.phone,
        jobTitle: primaryContact.jobTitle
      },
      facility: {
        name: facility.name,
        type: facility.type,
        address: facility.address,
        city: facility.city,
        county: facility.county,
        postalCode: facility.postalCode,
        GPS_coordinates: facility.GPS_coordinates
      },
      alternativeContact: {
        name: alternativeContact.name,
        email: alternativeContact.email,
        phone: alternativeContact.phone,
        relationship: alternativeContact.relationship
      },
      // delivery removed
      items: items.map(item => ({
        consumableId: item.consumableId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        specifications: item.specifications
      })),
      totalAmount: totalAmount,
      paymentMethod: paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      currency: 'KES'
    };

    const order = await Order.create(orderData);

    logger.info(`Order created: ${order._id}, Order Number: ${order.orderNumber}, Amount: ${totalAmount}`);

    // Initiate M-Pesa STK Push
    let mpesaResponse;
    try {
      mpesaResponse = await initiateSTKPush(
        primaryContact.phone,
        Math.round(totalAmount),
        order.orderNumber,
        `AccordMedical-${order.orderNumber}`
      );

      // Update order with M-Pesa details
      await Order.updateOne(
        { _id: order._id },
        {
          'mpesaDetails.checkoutRequestID': mpesaResponse.CheckoutRequestID,
          'mpesaDetails.merchantRequestID': mpesaResponse.MerchantRequestID,
          'mpesaDetails.phoneNumber': primaryContact.phone
        }
      );

      logger.info(`M-Pesa STK Push initiated: ${mpesaResponse.CheckoutRequestID}`);
    } catch (mpesaError) {
      logger.error('M-Pesa initiation error:', mpesaError);
      return res.status(500).json({
        success: false,
        message: 'Failed to initiate M-Pesa payment',
        error: mpesaError.message
      });
    }

    // Send order confirmation email to customer
    try {
      await sendOrderConfirmationEmail(order);
      logger.info(`Order confirmation email sent to: ${primaryContact.email}`);
    } catch (emailError) {
      logger.error('Customer email error:', emailError);
    }

    // Send order notification to admin
    try {
      await sendAdminOrderNotification(order);
      logger.info('Admin order notification sent');
    } catch (adminEmailError) {
      logger.error('Admin email error:', adminEmailError);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.orderNumber,
        facility: {
          name: facility.name,
          type: facility.type,
          location: `${facility.city}, ${facility.county}`
        },
        primaryContact: {
          name: primaryContact.name,
          phone: primaryContact.phone
        },
        alternativeContact: {
          name: alternativeContact.name,
          phone: alternativeContact.phone
        },
        // delivery removed from response
        totalAmount: totalAmount,
        itemCount: items.length,
        paymentStatus: order.paymentStatus,
        checkoutRequestID: mpesaResponse.CheckoutRequestID,
        nextSteps: `M-Pesa STK prompt sent to ${primaryContact.name}. Contact ${alternativeContact.name} if needed.`
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
      data: {
        _id: order._id,
        orderNumber: order.orderNumber,
        primaryContact: order.primaryContact,
        facility: order.facility,
        alternativeContact: order.alternativeContact,
        delivery: order.delivery,
        items: order.items,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
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

    const orders = await Order.find({ 
      $or: [
        { 'primaryContact.email': email },
        { 'alternativeContact.email': email }
      ]
    }).sort({ createdAt: -1 });

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
 * @route POST /api/orders/mpesa/callback
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
          orderStatus: 'processing',
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
          orderStatus: 'cancelled',
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
 * @route GET /api/orders/admin/all
 * @access Private (Admin)
 */
export const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, paymentStatus } = req.query;

    const query = {};
    if (status) query.orderStatus = status;
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

/**
 * Get receipt data for an order
 * @route GET /api/orders/:orderId/receipt
 * @access Public
 */
export const getOrderReceipt = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderNumber: orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only allow receipt for paid orders
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Receipt is only available for paid orders',
        paymentStatus: order.paymentStatus
      });
    }

    // Generate receipt number if not exists
    if (!order.receiptNumber) {
      order.receiptNumber = `RCP-${Date.now()}${Math.floor(Math.random() * 1000)}`;
      order.receiptGenerated = true;
      order.receiptGeneratedAt = new Date();
      await order.save();
    }

    // Format receipt data
    const receiptData = {
      receiptNumber: order.receiptNumber,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      paymentDate: order.mpesaDetails?.transactionDate || order.updatedAt,
      paymentStatus: order.paymentStatus,
      
      facility: {
        name: order.facility.name,
        type: order.facility.type,
        address: order.facility.address,
        city: order.facility.city,
        county: order.facility.county,
        postalCode: order.facility.postalCode
      },
      
      primaryContact: {
        name: order.primaryContact.name,
        email: order.primaryContact.email,
        phone: order.primaryContact.phone,
        jobTitle: order.primaryContact.jobTitle
      },
      
      alternativeContact: {
        name: order.alternativeContact.name,
        email: order.alternativeContact.email,
        phone: order.alternativeContact.phone,
        relationship: order.alternativeContact.relationship
      },
      
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
        specifications: item.specifications
      })),
      
      summary: {
        subtotal: order.totalAmount,
        tax: 0,
        total: order.totalAmount,
        currency: order.currency
      },
      
      payment: {
        method: order.paymentMethod === 'mpesa' ? 'M-Pesa' : order.paymentMethod,
        mpesaReceiptNumber: order.mpesaDetails?.mpesaReceiptNumber,
        phoneNumber: order.mpesaDetails?.phoneNumber,
        transactionDate: order.mpesaDetails?.transactionDate
      },
      
      company: {
        name: 'Accord Medical',
        email: 'sales@accordmedical.co.ke',
        phone: '+254 700 000000',
        address: 'Nairobi, Kenya',
        website: 'www.accordmedical.co.ke'
      }
    };

    res.json({
      success: true,
      data: receiptData
    });

  } catch (error) {
    logger.error('Get order receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch receipt'
    });
  }
};

/**
 * Debug: Test STK Push directly (Sandbox only)
 * @route POST /api/orders/debug/stk-push-test
 * @access Public (Debug only - remove in production)
 */
export const debugSTKPushTest = async (req, res) => {
  try {
    const { phoneNumber, amount = 1 } = req.body;

    // Validate phone format
    const phoneRegex = /^254\d{9}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Must be format: 254XXXXXXXXX'
      });
    }

    logger.info(`=== DEBUG STK PUSH TEST ===`);
    logger.info(`Phone: ${phoneNumber}, Amount: ${amount}`);

    // Attempt STK push
    const mpesaResponse = await initiateSTKPush(
      phoneNumber,
      amount,
      `DEBUG-${Date.now()}`,
      `Debug-${Date.now()}`
    );

    logger.info(`STK Push test response:`, JSON.stringify(mpesaResponse, null, 2));

    res.json({
      success: true,
      message: 'STK push test initiated',
      data: mpesaResponse
    });

  } catch (error) {
    logger.error('Debug STK push test error:', error.message);
    res.status(500).json({
      success: false,
      message: 'STK push test failed',
      error: error.message,
      hint: 'If "Unable to lock subscriber", wait 1-2 minutes and try again with same number, or use different test number'
    });
  }
};

/**
 * Debug: List available Daraja test numbers
 * @route GET /api/orders/debug/test-numbers
 * @access Public (Debug only)
 */
export const debugTestNumbers = async (req, res) => {
  const testNumbers = [
    { number: '254708374149', name: 'Default Sandbox Test', status: 'Try first' },
    { number: '254712345678', name: 'Alternative Test 1', status: 'Use if 149 locked' },
    { number: '254799012345', name: 'Alternative Test 2', status: 'Use if others locked' },
    { number: '254701234567', name: 'Alternative Test 3', status: 'Rotate for testing' }
  ];

  res.json({
    success: true,
    message: 'Available Daraja sandbox test numbers (rotate if getting "Unable to lock subscriber")',
    testNumbers: testNumbers,
    tip: 'If a number gets locked, wait 1-2 minutes or try a different number'
  });
};
