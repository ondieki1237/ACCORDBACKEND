#!/usr/bin/env node

/**
 * Direct test script to send reminders without database connection
 * 
 * Usage:
 *   node scripts/sendTestReminder.js report makoriseth1237@gmail.com
 *   node scripts/sendTestReminder.js planner makoriseth1237@gmail.com
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendTestReportReminder(email) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
        <h2 style="color: #333;">📋 Weekly Report Reminder</h2>
        <p style="color: #555; font-size: 16px;">
          Hi <strong>Sales Team Member</strong>,
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          It's Friday and you have not recorded your <strong>weekly report</strong> yet. 
          Kindly submit your weekly report today before end of business.
        </p>
        <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; border-radius: 3px;">
          <p style="color: #1565c0; margin: 0;"><strong>⏰ Quick Reminder:</strong></p>
          <p style="color: #1565c0; margin: 5px 0 0 0;">Week: Monday - Sunday</p>
          <p style="color: #1565c0; margin: 5px 0 0 0;">Deadline: End of today</p>
        </div>
        <p style="color: #555; font-size: 14px;">
          Please access the app and submit your report with details of:
        </p>
        <ul style="color: #555; font-size: 14px;">
          <li>Visits made and outcomes</li>
          <li>Quotations generated</li>
          <li>New leads captured</li>
          <li>Challenges faced</li>
          <li>Plans for next week</li>
        </ul>
        <p style="color: #555; font-size: 14px; margin-top: 20px;">
          Thank you for your diligence in keeping the team updated.
        </p>
        <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
        <p style="color: #95a5a6; font-size: 12px;">
          ACCORD Medical - Field Sales Tracking System<br>
          <a href="https://app.codewithseth.co.ke" style="color: #3498db;">app.codewithseth.co.ke</a>
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'ACCORD Medical <noreply@accordmedical.com>',
    to: email,
    subject: '📋 Weekly Report Reminder - Please Submit Today',
    html
  };

  return transporter.sendMail(mailOptions);
}

async function sendTestPlannerReminder(email) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
        <h2 style="color: #333;">📅 Weekly Planner Reminder</h2>
        <p style="color: #555; font-size: 16px;">
          Hi <strong>Sales Team Member</strong>,
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          It's Sunday evening and you have not filled your <strong>weekly planner</strong> yet. 
          Kindly complete your planner now to plan your week ahead.
        </p>
        <div style="background-color: #f3e5f5; padding: 15px; border-left: 4px solid #9c27b0; margin: 20px 0; border-radius: 3px;">
          <p style="color: #6a1b9a; margin: 0;"><strong>⏰ Important:</strong></p>
          <p style="color: #6a1b9a; margin: 5px 0 0 0;">Fill your planner for the coming week</p>
          <p style="color: #6a1b9a; margin: 5px 0 0 0;">This helps us track your activities and plan resources</p>
        </div>
        <p style="color: #555; font-size: 14px;">
          Your weekly planner should include:
        </p>
        <ul style="color: #555; font-size: 14px;">
          <li>Daily locations and travel plans</li>
          <li>Scheduled visits and meetings</li>
          <li>Expected prospects and outcomes</li>
          <li>Travel allowance estimates</li>
          <li>Transportation arrangements</li>
        </ul>
        <p style="color: #555; font-size: 14px; margin-top: 20px;">
          Planning ahead ensures smooth operations and better resource allocation.
        </p>
        <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
        <p style="color: #95a5a6; font-size: 12px;">
          ACCORD Medical - Field Sales Tracking System<br>
          <a href="https://app.codewithseth.co.ke" style="color: #3498db;">app.codewithseth.co.ke</a>
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'ACCORD Medical <noreply@accordmedical.com>',
    to: email,
    subject: '📅 Weekly Planner Reminder - Please Fill Your Planner',
    html
  };

  return transporter.sendMail(mailOptions);
}

async function main() {
  const type = process.argv[2];
  const email = process.argv[3] || 'makoriseth1237@gmail.com';

  if (!type || !['report', 'planner'].includes(type)) {
    console.log('❌ Invalid arguments.');
    console.log('Usage:');
    console.log('  node scripts/sendTestReminder.js report [email]');
    console.log('  node scripts/sendTestReminder.js planner [email]');
    console.log('\nDefault email: makoriseth1237@gmail.com');
    process.exit(1);
  }

  try {
    console.log('📧 Sending Test Reminder...\n');
    console.log('━'.repeat(50));

    if (type === 'report') {
      console.log('📋 Weekly Report Reminder');
    } else {
      console.log('📅 Weekly Planner Reminder');
    }
    console.log(`📧 To: ${email}`);
    console.log('━'.repeat(50));

    if (type === 'report') {
      await sendTestReportReminder(email);
    } else if (type === 'planner') {
      await sendTestPlannerReminder(email);
    }

    console.log('\n✅ Test email sent successfully!');
    console.log(`   Recipient: ${email}`);
    console.log(`   Type: ${type === 'report' ? 'Weekly Report Reminder' : 'Weekly Planner Reminder'}`);
    console.log('━'.repeat(50));
  } catch (error) {
    console.error('\n❌ Error sending email:', error.message);
    if (error.response) {
      console.error('   SMTP Response:', error.response);
    }
    process.exit(1);
  }
}

main();
