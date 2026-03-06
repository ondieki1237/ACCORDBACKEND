#!/usr/bin/env node

/**
 * Test script to send reminders to a single email address
 * 
 * Usage:
 *   node scripts/testSingleReminder.js report makoriseth1237@gmail.com
 *   node scripts/testSingleReminder.js planner makoriseth1237@gmail.com
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEmail } from '../src/services/emailService.js';
import logger from '../src/utils/logger.js';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function sendTestReportReminder(email, userName = 'Valued Team Member') {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
        <h2 style="color: #333;">📋 Weekly Report Reminder</h2>
        <p style="color: #555; font-size: 16px;">
          Hi <strong>${userName}</strong>,
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

  await sendEmail({
    to: email,
    subject: '📋 Weekly Report Reminder - TEST',
    template: 'custom',
    data: { rawHtml: html }
  });
}

async function sendTestPlannerReminder(email, userName = 'Valued Team Member') {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
        <h2 style="color: #333;">📅 Weekly Planner Reminder</h2>
        <p style="color: #555; font-size: 16px;">
          Hi <strong>${userName}</strong>,
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

  await sendEmail({
    to: email,
    subject: '📅 Weekly Planner Reminder - TEST',
    template: 'custom',
    data: { rawHtml: html }
  });
}

async function main() {
  const type = process.argv[2];
  const email = process.argv[3] || 'makoriseth1237@gmail.com';

  if (!type || !['report', 'planner'].includes(type)) {
    console.log('❌ Invalid arguments.');
    console.log('Usage:');
    console.log('  node scripts/testSingleReminder.js report [email]');
    console.log('  node scripts/testSingleReminder.js planner [email]');
    console.log('\nDefault email: makoriseth1237@gmail.com');
    process.exit(1);
  }

  try {
    console.log('📧 Sending Test Reminder...\n');

    // Connect to database
    console.log('🔗 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Get user name if possible
    let userName = 'Valued Team Member';
    try {
      const user = await User.findOne({ email: email });
      if (user) {
        userName = user.firstName || user.email;
      }
    } catch (err) {
      // User not found, use default
    }

    if (type === 'report') {
      console.log('📋 Sending Weekly Report Reminder...');
      console.log(`📧 To: ${email}`);
      console.log(`👤 Name: ${userName}`);
      await sendTestReportReminder(email, userName);
      console.log('✅ Weekly report reminder sent!\n');
    } else if (type === 'planner') {
      console.log('📅 Sending Weekly Planner Reminder...');
      console.log(`📧 To: ${email}`);
      console.log(`👤 Name: ${userName}`);
      await sendTestPlannerReminder(email, userName);
      console.log('✅ Weekly planner reminder sent!\n');
    }

    console.log('━'.repeat(50));
    console.log('✅ Test email sent successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   Type: ${type === 'report' ? 'Weekly Report Reminder' : 'Weekly Planner Reminder'}`);
    console.log('━'.repeat(50));
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
