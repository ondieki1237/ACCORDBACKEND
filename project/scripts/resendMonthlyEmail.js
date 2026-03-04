#!/usr/bin/env node

/**
 * Resend Monthly Email Reports
 * 
 * Usage:
 *   node scripts/resendMonthlyEmail.js              (resend last month)
 *   node scripts/resendMonthlyEmail.js --month 2     (resend February of current year)
 *   node scripts/resendMonthlyEmail.js --month 2 --year 2026  (resend February 2026)
 */

import 'dotenv/config';
import connectDB from '../src/config/database.js';
import User from '../src/models/User.js';
import Visit from '../src/models/Visit.js';
import Lead from '../src/models/Lead.js';
import logger from '../src/utils/logger.js';
import nodemailer from 'nodemailer';
import { generateMonthlySalesExcel, writeExcelFile } from '../src/utils/excelGenerator.js';
import fs from 'fs';
import path from 'path';

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Parse arguments
const args = process.argv.slice(2);
const now = new Date();

let month = now.getMonth();  // Default to previous month (0-11)
let year = now.getFullYear();

if (month === 0) {
  month = 11;
  year--;
} else {
  month--;
}

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--month' && args[i + 1]) {
    month = parseInt(args[i + 1]) - 1;
    i++;
  } else if (args[i] === '--year' && args[i + 1]) {
    year = parseInt(args[i + 1]);
    i++;
  }
}

const monthStart = new Date(year, month, 1);
monthStart.setHours(0, 0, 0, 0);
const monthEnd = new Date(year, month + 1, 1);
monthEnd.setHours(23, 59, 59, 999);

const monthLabel = monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

console.log('\n📧 Accord Medical - Resend Monthly Email');
console.log('='.repeat(50));
console.log(`📅 Target Period: ${monthLabel}`);
console.log(`📨 Resending to: Sales Team`);
console.log('='.repeat(50));

async function main() {
  try {
    // Connect to database
    console.log('\n🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    // Get all active sales users
    const salesUsers = await User.find({ role: 'sales', isActive: true })
      .select('firstName lastName email');

    console.log(`\n👥 Found ${salesUsers.length} sales users`);

    if (salesUsers.length === 0) {
      console.log('⚠️  No active sales users found.');
      process.exit(0);
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'monthly-sales');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Send email to each user
    let sentCount = 0;
    let failedCount = 0;
    const results = [];

    for (const user of salesUsers) {
      try {
        // Query user's data for the month
        const visits = await Visit.find({
          userId: user._id,
          date: { $gte: monthStart, $lte: monthEnd }
        }).lean();

        const leads = await Lead.find({
          createdBy: user._id,
          createdAt: { $gte: monthStart, $lte: monthEnd }
        }).lean();

        // Count unique clients
        const uniqueClients = Array.from(
          new Set(visits.map(v => v.client?.name).filter(Boolean))
        ).length;

        // Generate Excel file
        const userData = {
          user: user.toObject(),
          visits,
          leads
        };

        const workbook = generateMonthlySalesExcel({
          monthStart,
          monthEnd,
          userData
        });

        const filename = `${(user.email).toString().replace(/[@<>:\"/\\|?*\s]/g, '_')}-${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}.xlsx`;
        const filepath = path.join(uploadsDir, filename);

        writeExcelFile(workbook, filepath);

        // Generate email HTML
        const html = `
          <div style="font-family: Arial, sans-serif; max-width:600px;">
            <h2>Monthly Activity Summary</h2>
            <p>Hello ${user.firstName || ''},</p>
            <p>Please find your activity summary for <strong>${monthLabel}</strong>.</p>
            <ul>
              <li>Total Visits: <strong>${visits.length}</strong></li>
              <li>Total Leads: <strong>${leads.length}</strong></li>
              <li>Unique Clients Met: <strong>${uniqueClients}</strong></li>
            </ul>
            <p>Regards,<br/>ACCORD System</p>
          </div>
        `;

        // Send email with attachment
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'ACCORD Medical <accord@astermedsupplies.co.ke>',
          to: user.email,
          subject: `Monthly Activity Summary - ${monthLabel}`,
          html: html,
          attachments: [
            {
              filename: filename,
              path: filepath,
              contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
          ]
        });

        console.log(`✅ Sent to ${user.email} with Excel attachment`);
        sentCount++;
        results.push({ email: user.email, status: 'sent' });
      } catch (error) {
        console.log(`❌ Failed to send to ${user.email}: ${error.message}`);
        failedCount++;
        results.push({ email: user.email, status: 'failed', error: error.message });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Resend Summary:');
    console.log(`✅ Sent: ${sentCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log('='.repeat(50));

    if (failedCount > 0) {
      console.log('\n⚠️  Failed recipients:');
      results.filter(r => r.status === 'failed').forEach(r => {
        console.log(`  - ${r.email}: ${r.error}`);
      });
    }

    console.log('\n✅ Resend complete');

  } catch (error) {
    logger.error('Error in resend script:', error);
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
