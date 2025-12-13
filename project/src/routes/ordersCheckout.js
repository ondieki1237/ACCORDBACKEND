import express from 'express';
import {
  createOrderCheckout,
  getOrderDetails,
  getCustomerOrders,
  mpesaCallback,
  queryPaymentStatus,
  getAllOrders,
  getOrderReceipt,
  debugSTKPushTest,
  debugTestNumbers
} from '../controllers/ordersCheckoutController.js';

const router = express.Router();

/**
 * PUBLIC ROUTES
 */

// Create order and initiate M-Pesa payment
router.post('/', createOrderCheckout);

// Get order details
router.get('/:orderId', getOrderDetails);

// Get order receipt
router.get('/:orderId/receipt', getOrderReceipt);

// Get customer orders by email
router.get('/customer/:email', getCustomerOrders);

// Query payment status
router.get('/status/:checkoutRequestID', queryPaymentStatus);

/**
 * M-PESA CALLBACK
 */

// M-Pesa callback handler (called by Safaricom)
router.post('/mpesa/callback', mpesaCallback);

/**
 * DEBUG ROUTES (Sandbox Testing Only - Remove in Production!)
 */

// Debug: Test STK push directly
router.post('/debug/stk-push-test', debugSTKPushTest);

// Debug: List available test numbers
router.get('/debug/test-numbers', debugTestNumbers);

/**
 * ADMIN ROUTES
 */

// Get all orders (Admin)
router.get('/admin/all', getAllOrders);

export default router;
