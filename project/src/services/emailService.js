import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT), // <-- Ensure this is a number
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendEmail = async ({ to, subject, template, data }) => {
  try {
    let html = '';

    // Simple email templates
    switch (template) {
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