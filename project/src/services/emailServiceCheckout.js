/**
 * Simplified Email Service for M-Pesa Checkout Orders
 * Handles both old and new order formats
 */
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper to safely extract order data
const getOrderData = (order) => {
  return {
    orderNumber: order.orderNumber,
    customerName: order.primaryContact?.name || 'Customer',
    customerEmail: order.primaryContact?.email,
    customerPhone: order.primaryContact?.phone,
    facilityName: order.facility?.name || 'N/A',
    jobTitle: order.primaryContact?.jobTitle || 'Staff',
    totalAmount: order.totalAmount || 0,
    items: (order.items || []).map(item => ({
      name: item.name || item.productName || 'Item',
      quantity: item.quantity || 0,
      price: item.price || item.unitPrice || 0
    })),
    createdAt: order.createdAt,
    mpesaReceipt: order.mpesaDetails?.mpesaReceiptNumber
  };
};

/**
 * Send Order Confirmation Email
 */
export const sendOrderConfirmationEmail = async (order) => {
  try {
    const data = getOrderData(order);

    if (!data.customerEmail) {
      logger.warn('No customer email for order:', order.orderNumber);
      return false;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0096d9, #00bcd4); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Order Confirmation</h1>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Dear <strong>${data.customerName}</strong>,</p>
            <p>Thank you for your order! We have received it and are waiting for payment confirmation.</p>

            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h2 style="color: #0096d9; margin-top: 0;">Order Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Order ID:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><code>${data.orderNumber}</code></td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date(data.createdAt).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Facility:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.facilityName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px;"><strong>Amount:</strong></td>
                  <td style="padding: 10px;"><strong style="color: #0096d9; font-size: 18px;">KES ${data.totalAmount.toLocaleString()}</strong></td>
                </tr>
              </table>
            </div>

            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h2 style="color: #0096d9; margin-top: 0;">Items (${data.items.length})</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #f0f0f0;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
                ${data.items.map((item, i) => `
                  <tr style="background: ${i % 2 === 0 ? 'white' : '#f9f9f9'};">
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">KES ${item.price.toLocaleString()}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">KES ${(item.quantity * item.price).toLocaleString()}</td>
                  </tr>
                `).join('')}
                <tr style="background: #0096d9; color: white; font-weight: bold;">
                  <td colspan="3" style="padding: 10px; text-align: right;">TOTAL:</td>
                  <td style="padding: 10px; text-align: right;">KES ${data.totalAmount.toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <div style="background: #e3f2fd; padding: 15px; border-left: 4px solid #0096d9; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #0096d9;">Next Steps:</h3>
              <ol>
                <li>You will receive an M-Pesa payment prompt on your phone</li>
                <li>Enter your M-Pesa PIN to confirm the payment</li>
                <li>We'll send a confirmation email once payment is successful</li>
              </ol>
            </div>

            <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              If you have questions, contact us at sales@accordmedical.co.ke
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: data.customerEmail,
      subject: `Order Confirmation - ${data.orderNumber}`,
      html
    });

    logger.info(`Order confirmation sent to ${data.customerEmail}`);
    return true;
  } catch (error) {
    logger.error('Order confirmation email error:', error.message);
    return false;
  }
};

/**
 * Send Admin Order Notification
 */
export const sendAdminOrderNotification = async (order) => {
  try {
    const data = getOrderData(order);
    const adminEmails = (process.env.ORDER_NOTIFICATION_EMAILS || '').split(',').map(e => e.trim()).filter(e => e);

    if (adminEmails.length === 0) {
      logger.warn('No admin emails configured');
      return false;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          <div style="background: #ff6b6b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">🆕 NEW ORDER RECEIVED</h1>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ff6b6b;">
              <h2 style="margin-top: 0; color: #ff6b6b;">Order: ${data.orderNumber}</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px;"><strong>Amount:</strong></td>
                  <td style="padding: 8px; color: #ff6b6b; font-weight: bold; font-size: 16px;">KES ${data.totalAmount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px;"><strong>Customer:</strong></td>
                  <td style="padding: 8px;">${data.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px;"><strong>Phone:</strong></td>
                  <td style="padding: 8px;">${data.customerPhone}</td>
                </tr>
                <tr>
                  <td style="padding: 8px;"><strong>Facility:</strong></td>
                  <td style="padding: 8px;">${data.facilityName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px;"><strong>Items:</strong></td>
                  <td style="padding: 8px;">${data.items.length} item(s)</td>
                </tr>
              </table>
            </div>

            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3 style="margin-top: 0;">Items:</h3>
              <ul style="padding-left: 20px;">
                ${data.items.map(item => `<li>${item.name} x ${item.quantity} = KES ${(item.quantity * item.price).toLocaleString()}</li>`).join('')}
              </ul>
            </div>

            <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0;"><strong>⚡ Action:</strong> Waiting for customer payment. STK push sent to ${data.customerPhone}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: adminEmails.join(','),
      subject: `[NEW ORDER] ${data.orderNumber} - KES ${data.totalAmount.toLocaleString()}`,
      html,
      replyTo: data.customerEmail
    });

    logger.info(`Admin notification sent to ${adminEmails.join(', ')}`);
    return true;
  } catch (error) {
    logger.error('Admin notification error:', error.message);
    return false;
  }
};

/**
 * Send Payment Confirmation Email
 */
export const sendPaymentConfirmationEmail = async (order) => {
  try {
    const data = getOrderData(order);

    if (!data.customerEmail) {
      logger.warn('No customer email for payment confirmation');
      return false;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4caf50, #8bc34a); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">✅ PAYMENT SUCCESSFUL</h1>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Dear <strong>${data.customerName}</strong>,</p>
            <p>Your payment has been confirmed! Your order is now being processed.</p>

            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #4caf50;">
              <h2 style="margin-top: 0; color: #4caf50;">Payment Confirmed</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Order ID:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Amount Paid:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; color: #4caf50; font-weight: bold; font-size: 16px;">KES ${data.totalAmount.toLocaleString()}</td>
                </tr>
                ${data.mpesaReceipt ? `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>M-Pesa Receipt:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><code>${data.mpesaReceipt}</code></td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div style="background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #4caf50;">What Happens Next:</h3>
              <ol>
                <li>Your order is being prepared</li>
                <li>We'll contact you to arrange delivery</li>
                <li>You'll receive tracking updates via SMS/Email</li>
              </ol>
            </div>

            <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              Thank you for choosing Accord Medical. For support: sales@accordmedical.co.ke
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: data.customerEmail,
      subject: `Payment Confirmed - Order ${data.orderNumber}`,
      html
    });

    logger.info(`Payment confirmation sent to ${data.customerEmail}`);
    return true;
  } catch (error) {
    logger.error('Payment confirmation email error:', error.message);
    return false;
  }
};

/**
 * Send Admin Payment Notification
 */
export const sendAdminPaymentNotification = async (order) => {
  try {
    const data = getOrderData(order);
    const adminEmails = (process.env.ORDER_NOTIFICATION_EMAILS || '').split(',').map(e => e.trim()).filter(e => e);

    if (adminEmails.length === 0) return false;

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          <div style="background: #4caf50; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">✅ PAYMENT RECEIVED</h1>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #4caf50;">
              <h2 style="margin-top: 0; color: #4caf50;">Order: ${data.orderNumber}</h2>
              <p><strong>Status:</strong> ✅ PAID - Ready for Processing</p>
              <p><strong>Amount:</strong> KES ${data.totalAmount.toLocaleString()}</p>
              <p><strong>Customer:</strong> ${data.customerName}</p>
              <p><strong>Phone:</strong> ${data.customerPhone}</p>
            </div>

            <div style="background: #e8f5e9; padding: 15px; border-radius: 4px;">
              <p><strong>📦 Next Step:</strong> Start preparing and organizing the shipment. Contact customer to arrange delivery.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: adminEmails.join(','),
      subject: `✅ PAID - ${data.orderNumber} - Ready for Processing`,
      html,
      replyTo: data.customerEmail
    });

    logger.info(`Admin payment notification sent`);
    return true;
  } catch (error) {
    logger.error('Admin payment notification error:', error.message);
    return false;
  }
};
