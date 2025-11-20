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