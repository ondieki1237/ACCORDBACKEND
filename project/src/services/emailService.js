import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendEmail = async ({ to, subject, template, data }) => {
  try {
    let html = '';

    // Support passing raw HTML in data.rawHtml (caller-built html)
    if (data && data.rawHtml) {
      html = data.rawHtml;
    }


    // Simple email templates
    if (!html) switch (template) {
      case 'welcome':
        html = `
          <h2>Welcome to Accord Medical!</h2>
          <p>Hello ${data.firstName},</p>
          <p>Your account has been created successfully.</p>
          <p><strong>Employee ID:</strong> ${data.employeeId}</p>
          <p>You can now login at: <a href="${data.loginUrl}">${data.loginUrl}</a></p>
          <p>Best regards,<br>Accord Medical Team</p>
        `;
        break;
        
      case 'resetPassword':
        html = `
          <h2>Password Reset Request</h2>
          <p>Hello ${data.firstName},</p>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <p><a href="${data.resetUrl}">Reset Password</a></p>
          <p>This link will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>Accord Medical Team</p>
        `;
        break;
        
      case 'dailyReport':
        html = `
          <h2>Daily Activity Report</h2>
          <p>Hello ${data.firstName},</p>
          <p>Here's your daily activity summary for ${data.date}:</p>
          <ul>
            <li>Total Visits: ${data.totalVisits}</li>
            <li>Successful Visits: ${data.successfulVisits}</li>
            <li>Total Contacts: ${data.totalContacts}</li>
            <li>Distance Traveled: ${data.totalDistance} km</li>
          </ul>
          <p>Keep up the great work!</p>
          <p>Best regards,<br>Accord Medical Team</p>
        `;
        break;
        
      case 'newReport':
        html = `
          <h2>New Weekly Report Submitted</h2>
          <p>Hello Admin,</p>
          <p>A new weekly report has been submitted:</p>
          <ul>
            <li><strong>From:</strong> ${data.author}</li>
            <li><strong>Week:</strong> ${data.weekRange}</li>
            <li><strong>Submitted:</strong> ${new Date(data.submittedAt).toLocaleString()}</li>
          </ul>
          <p><a href="${data.reportUrl}">View Report</a></p>
          ${data.pdfUrl ? `<p><a href="${data.pdfUrl}">Download PDF</a></p>` : ''}
          <p>Best regards,<br>Accord Medical System</p>
        `;
        break;
        
      case 'newQuotation':
        html = `
          <h2>New Quotation Request</h2>
          <p>Hello Admin,</p>
          <p>A new quotation request has been submitted:</p>
          <ul>
            <li><strong>Hospital:</strong> ${data.hospital}</li>
            <li><strong>Location:</strong> ${data.location}</li>
            <li><strong>Equipment:</strong> ${data.equipmentRequired}</li>
            <li><strong>Urgency:</strong> <span style="color: ${data.urgency === 'high' ? 'red' : data.urgency === 'medium' ? 'orange' : 'green'}">${data.urgency ? data.urgency.toUpperCase() : 'MEDIUM'}</span></li>
            <li><strong>Contact:</strong> ${data.contactName} (${data.contactPhone})</li>
            <li><strong>Requested by:</strong> ${data.requesterName}</li>
          </ul>
          <p><a href="${data.quotationUrl}">Respond to Request</a></p>
          <p>Best regards,<br>Accord Medical System</p>
        `;
        break;
        
      case 'quotationResponse':
        html = `
          <h2>Quotation Response</h2>
          <p>Hello ${data.firstName},</p>
          <p>The quotation request for <strong>${data.hospital}</strong> has been responded to:</p>
          <ul>
            <li><strong>Equipment:</strong> ${data.equipment}</li>
            ${data.estimatedCost ? `<li><strong>Estimated Cost:</strong> KES ${data.estimatedCost.toLocaleString()}</li>` : ''}
            ${data.response ? `<li><strong>Response:</strong> ${data.response}</li>` : ''}
          </ul>
          ${data.documentUrl ? `<p><a href="${data.documentUrl}">Download Quotation Document</a></p>` : ''}
          <p>Best regards,<br>Accord Medical Team</p>
        `;
        break;
      default:
        html = '<p>Default email template</p>';
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}`);
    return result;
  } catch (error) {
    logger.error('Email sending error:', error);
    throw error;
  }
};

/**
 * Send Order Confirmation Email to Customer
 */
export const sendOrderConfirmationEmail = async (order, customerEmail) => {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 700px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #0096d9 0%, #00bcd4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .section { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; }
          .section h2 { color: #0096d9; border-bottom: 2px solid #0096d9; padding-bottom: 10px; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          table th { background: #0096d9; color: white; padding: 12px; text-align: left; }
          table td { padding: 10px; border-bottom: 1px solid #e0e0e0; }
          table tr:nth-child(even) { background: #f0f0f0; }
          .total { background: #0096d9; color: white; font-weight: bold; font-size: 16px; }
          .badge { display: inline-block; padding: 8px 15px; border-radius: 20px; margin: 5px 0; }
          .badge-pending { background: #ffa500; color: white; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
          </div>
          
          <div class="content">
            <div class="section">
              <p>Dear <strong>${order.client.name}</strong>,</p>
              <p>Thank you for your order! We have received your order and it is now awaiting payment.</p>
            </div>

            <div class="section">
              <h2>Order Details</h2>
              <table>
                <tr>
                  <td><strong>Order ID:</strong></td>
                  <td><code>${order.orderNumber}</code></td>
                </tr>
                <tr>
                  <td><strong>Order Date:</strong></td>
                  <td>${new Date(order.createdAt).toLocaleString('en-KE')}</td>
                </tr>
                <tr>
                  <td><strong>Total Amount:</strong></td>
                  <td><strong>KES ${order.totalAmount.toLocaleString()}</strong></td>
                </tr>
                <tr>
                  <td><strong>Payment Status:</strong></td>
                  <td><span class="badge badge-pending">PENDING PAYMENT</span></td>
                </tr>
              </table>
            </div>

            <div class="section">
              <h2>Order Items</h2>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map(item => `
                    <tr>
                      <td>${item.productName}</td>
                      <td style="text-align: center;">${item.quantity}</td>
                      <td style="text-align: right;">KES ${item.unitPrice.toLocaleString()}</td>
                      <td style="text-align: right;">KES ${item.totalPrice.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                  <tr class="total">
                    <td colspan="3" style="text-align: right;">TOTAL:</td>
                    <td style="text-align: right;">KES ${order.totalAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="section" style="background: #e3f2fd; border-left: 4px solid #0096d9;">
              <h3 style="margin-top: 0; color: #0096d9;">Next Steps</h3>
              <ol>
                <li>An M-Pesa payment prompt should appear on your phone</li>
                <li>Enter your M-Pesa PIN to confirm payment</li>
                <li>You will receive a confirmation email once payment is successful</li>
              </ol>
            </div>

            <div class="section">
              <h3>Need Help?</h3>
              <p>If you have any questions about your order, please contact us:</p>
              <p><strong>Email:</strong> sales@accordmedical.co.ke</p>
            </div>
          </div>

          <div class="footer">
            <p>Accord Medical Supplies Ltd</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: customerEmail,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: emailHtml
    });

    logger.info(`Order confirmation email sent to: ${customerEmail}`);
    return true;
  } catch (error) {
    logger.error('Send order confirmation email error:', error);
    throw error;
  }
};

/**
 * Send Admin Order Notification
 */
export const sendAdminOrderNotification = async (order, customerName, customerEmail, customerPhone) => {
  try {
    const adminEmails = process.env.ORDER_NOTIFICATION_EMAILS?.split(',').map(e => e.trim()) || [];
    
    if (adminEmails.length === 0) {
      logger.warn('No admin emails configured for order notifications');
      return;
    }

    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 700px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #0096d9 0%, #00bcd4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .section { background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; }
          .section h2 { color: #0096d9; margin-top: 0; border-bottom: 2px solid #0096d9; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; }
          table tr td { padding: 10px; border-bottom: 1px solid #e0e0e0; }
          table tr td:first-child { font-weight: bold; width: 40%; }
          table thead tr { background: #0096d9; color: white; }
          table thead tr td { padding: 12px; }
          .total { background: #0096d9; color: white; font-weight: bold; padding: 15px; }
          a { color: #0096d9; text-decoration: none; }
          .alert-box { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .alert-box h3 { margin-top: 0; color: #4caf50; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🆕 New Order Received!</h1>
          </div>
          
          <div class="content">
            <div class="section">
              <h2>📋 Order Information</h2>
              <table>
                <tr>
                  <td>Order ID:</td>
                  <td><code>${order.orderNumber}</code></td>
                </tr>
                <tr>
                  <td>Order Date:</td>
                  <td>${new Date(order.createdAt).toLocaleString('en-KE')}</td>
                </tr>
                <tr>
                  <td>Total Amount:</td>
                  <td><strong style="color: #0096d9;">KES ${order.totalAmount.toLocaleString()}</strong></td>
                </tr>
                <tr>
                  <td>Payment Status:</td>
                  <td><span style="background: #ffa500; color: white; padding: 5px 10px; border-radius: 5px; font-weight: bold;">PENDING</span></td>
                </tr>
              </table>
            </div>

            <div class="section">
              <h2>👤 Customer Details</h2>
              <table>
                <tr>
                  <td>Name:</td>
                  <td>${customerName}</td>
                </tr>
                <tr>
                  <td>Email:</td>
                  <td><a href="mailto:${customerEmail}">${customerEmail}</a></td>
                </tr>
                <tr>
                  <td>Phone:</td>
                  <td><a href="tel:${customerPhone}">${customerPhone}</a></td>
                </tr>
              </table>
            </div>

            <div class="section">
              <h2>🛒 Order Items</h2>
              <table>
                <thead>
                  <tr>
                    <td>Item</td>
                    <td style="text-align: center;">Qty</td>
                    <td style="text-align: right;">Unit Price</td>
                    <td style="text-align: right;">Subtotal</td>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map((item, index) => `
                    <tr style="background: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                      <td>${item.productName}</td>
                      <td style="text-align: center;">${item.quantity}</td>
                      <td style="text-align: right;">KES ${item.unitPrice.toLocaleString()}</td>
                      <td style="text-align: right;">KES ${item.totalPrice.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                  <tr class="total">
                    <td colspan="3" style="text-align: right;">TOTAL:</td>
                    <td style="text-align: right;">KES ${order.totalAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="alert-box">
              <h3>⚡ Action Required</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Customer has been sent an M-Pesa payment prompt</li>
                <li>Waiting for payment confirmation</li>
                <li>Contact customer at <a href="tel:${customerPhone}">${customerPhone}</a> if needed</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>Accord Medical Supplies Ltd | Sales Management System</p>
            <p>Order notification system - Automated message</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: adminEmails.join(','),
      subject: `🆕 New Order - ${order.orderNumber} - KES ${order.totalAmount.toLocaleString()}`,
      html: adminEmailHtml,
      replyTo: customerEmail
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Admin order notification sent to: ${adminEmails.join(', ')}`);
    return true;
  } catch (error) {
    logger.error('Send admin order notification error:', error);
    throw error;
  }
};

/**
 * Send Payment Confirmation Email to Customer
 */
export const sendPaymentConfirmationEmail = async (order) => {
  try {
    const customerEmail = order.client.email;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 700px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #4caf50 0%, #8bc34a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .section { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; }
          .section h2 { color: #4caf50; border-bottom: 2px solid #4caf50; padding-bottom: 10px; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          table th { background: #4caf50; color: white; padding: 12px; text-align: left; }
          table td { padding: 10px; border-bottom: 1px solid #e0e0e0; }
          table tr:nth-child(even) { background: #f0f0f0; }
          .receipt-box { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .receipt-code { background: white; padding: 10px; font-family: monospace; font-weight: bold; margin: 5px 0; border: 1px dashed #4caf50; border-radius: 5px; }
          .badge-success { background: #4caf50; color: white; padding: 8px 15px; border-radius: 20px; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Received!</h1>
          </div>
          
          <div class="content">
            <div class="section">
              <p>Dear <strong>${order.client.name}</strong>,</p>
              <p>Thank you for your payment! Your order has been confirmed and is being prepared for delivery.</p>
            </div>

            <div class="section">
              <h2>💰 Payment Details</h2>
              <table>
                <tr>
                  <td><strong>Order ID:</strong></td>
                  <td>${order.orderNumber}</td>
                </tr>
                <tr>
                  <td><strong>Amount Paid:</strong></td>
                  <td><strong style="color: #4caf50; font-size: 18px;">KES ${order.totalAmount.toLocaleString()}</strong></td>
                </tr>
                <tr>
                  <td><strong>M-Pesa Receipt:</strong></td>
                  <td><code>${order.mpesaDetails?.mpesaReceiptNumber || 'Processing'}</code></td>
                </tr>
                <tr>
                  <td><strong>Payment Date:</strong></td>
                  <td>${new Date(order.mpesaDetails?.transactionDate || Date.now()).toLocaleString('en-KE')}</td>
                </tr>
              </table>
            </div>

            <div class="receipt-box">
              <h3 style="margin-top: 0; color: #4caf50;">✓ Payment Confirmed</h3>
              <p>Your payment has been successfully received and verified.</p>
              <p><strong>Receipt Number:</strong></p>
              <div class="receipt-code">${order.mpesaDetails?.mpesaReceiptNumber || order.orderNumber}</div>
            </div>

            <div class="section">
              <h2>📦 Order Summary</h2>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map(item => `
                    <tr>
                      <td>${item.productName}</td>
                      <td style="text-align: center;">${item.quantity}</td>
                      <td style="text-align: right;">KES ${item.unitPrice.toLocaleString()}</td>
                      <td style="text-align: right;">KES ${item.totalPrice.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="section" style="background: #e8f5e9; border-left: 4px solid #4caf50;">
              <h3 style="margin-top: 0; color: #4caf50;">What Happens Next?</h3>
              <ol>
                <li><strong>Order Processing:</strong> Your order is now being prepared</li>
                <li><strong>Delivery Coordination:</strong> We will contact you to arrange delivery</li>
                <li><strong>Delivery Updates:</strong> You'll receive SMS/Email updates on your shipment</li>
              </ol>
            </div>

            <div class="section">
              <h3>Questions?</h3>
              <p>If you have any questions about your order:</p>
              <p><strong>Email:</strong> sales@accordmedical.co.ke</p>
              <p><strong>Phone:</strong> Contact our support team</p>
            </div>
          </div>

          <div class="footer">
            <p>Accord Medical Supplies Ltd</p>
            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: customerEmail,
      subject: `Payment Received - Order ${order.orderNumber}`,
      html: emailHtml
    });

    logger.info(`Payment confirmation email sent to: ${customerEmail}`);
    return true;
  } catch (error) {
    logger.error('Send payment confirmation email error:', error);
    throw error;
  }
};

/**
 * Send Admin Payment Notification
 */
export const sendAdminPaymentNotification = async (order) => {
  try {
    const adminEmails = process.env.ORDER_NOTIFICATION_EMAILS?.split(',').map(e => e.trim()) || [];
    
    if (adminEmails.length === 0) {
      logger.warn('No admin emails configured for payment notifications');
      return;
    }

    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 700px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #4caf50 0%, #8bc34a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .section { background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; }
          .section h2 { color: #4caf50; margin-top: 0; border-bottom: 2px solid #4caf50; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; }
          table tr td { padding: 10px; border-bottom: 1px solid #e0e0e0; }
          table tr td:first-child { font-weight: bold; width: 40%; }
          table thead tr { background: #4caf50; color: white; }
          table thead tr td { padding: 12px; }
          table tr:nth-child(even) { background: #f9f9f9; }
          .total { background: #4caf50; color: white; font-weight: bold; padding: 15px; }
          a { color: #0096d9; text-decoration: none; }
          .alert-box { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .alert-box h3 { margin-top: 0; color: #4caf50; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Confirmed!</h1>
          </div>
          
          <div class="content">
            <div class="section">
              <h2>💰 Payment Details</h2>
              <table>
                <tr>
                  <td>Order ID:</td>
                  <td><code>${order.orderNumber}</code></td>
                </tr>
                <tr>
                  <td>M-Pesa Receipt:</td>
                  <td><code style="background: #e8f5e9; padding: 5px; border-radius: 3px;">${order.mpesaDetails?.mpesaReceiptNumber || 'Pending'}</code></td>
                </tr>
                <tr>
                  <td>Amount Paid:</td>
                  <td><strong style="color: #4caf50; font-size: 16px;">KES ${order.totalAmount.toLocaleString()}</strong></td>
                </tr>
                <tr>
                  <td>Payment Time:</td>
                  <td>${new Date(order.mpesaDetails?.transactionDate || Date.now()).toLocaleString('en-KE')}</td>
                </tr>
              </table>
            </div>

            <div class="section">
              <h2>👤 Customer Information</h2>
              <table>
                <tr>
                  <td>Name:</td>
                  <td>${order.client.name}</td>
                </tr>
                <tr>
                  <td>Email:</td>
                  <td><a href="mailto:${order.client.email}">${order.client.email}</a></td>
                </tr>
                <tr>
                  <td>Phone:</td>
                  <td><a href="tel:${order.client.phone}">${order.client.phone}</a></td>
                </tr>
              </table>
            </div>

            <div class="section">
              <h2>📦 Order Items (${order.items.length})</h2>
              <table>
                <thead>
                  <tr>
                    <td>Item</td>
                    <td style="text-align: center;">Qty</td>
                    <td style="text-align: right;">Unit Price</td>
                    <td style="text-align: right;">Subtotal</td>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map((item, index) => `
                    <tr style="background: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                      <td>${item.productName}</td>
                      <td style="text-align: center;">${item.quantity}</td>
                      <td style="text-align: right;">KES ${item.unitPrice.toLocaleString()}</td>
                      <td style="text-align: right;">KES ${item.totalPrice.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                  <tr class="total">
                    <td colspan="3" style="text-align: right;">TOTAL:</td>
                    <td style="text-align: right;">KES ${order.totalAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="alert-box">
              <h3>🚀 Ready for Processing</h3>
              <ol>
                <li>Start preparing the ordered items</li>
                <li>Contact customer to arrange delivery at <a href="tel:${order.client.phone}">${order.client.phone}</a></li>
                <li>Update order status in system to "processing"</li>
                <li>Schedule delivery and send customer tracking information</li>
              </ol>
            </div>
          </div>

          <div class="footer">
            <p>Accord Medical Supplies Ltd | Sales Management System</p>
            <p>Payment notification - Action required</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: adminEmails.join(','),
      subject: `✅ Payment Confirmed - ${order.orderNumber} - ${order.client.name}`,
      html: adminEmailHtml,
      replyTo: order.client.email
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Admin payment notification sent to: ${adminEmails.join(', ')}`);
    return true;
  } catch (error) {
    logger.error('Send admin payment notification error:', error);
    throw error;
  }
};