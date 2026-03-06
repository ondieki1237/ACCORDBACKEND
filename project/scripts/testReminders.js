#!/usr/bin/env node

/**
 * Test script for weekly reminders
 * 
 * Usage:
 *   node scripts/testReminders.js report   - Test weekly report reminders
 *   node scripts/testReminders.js planner  - Test weekly planner reminders
 *   node scripts/testReminders.js both     - Test both reminders
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendWeeklyReportReminders, sendWeeklyPlannerReminders } from '../src/services/scheduledJobs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const testType = process.argv[2] || 'both';

  if (!['report', 'planner', 'both'].includes(testType)) {
    console.log('❌ Invalid argument. Use: report, planner, or both');
    process.exit(1);
  }

  try {
    console.log('📧 Testing Weekly Reminders...\n');

    // Connect to database
    console.log('🔗 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    if (testType === 'report' || testType === 'both') {
      console.log('📋 Testing Weekly Report Reminders...');
      console.log('━'.repeat(50));
      try {
        await sendWeeklyReportReminders();
        console.log('✅ Weekly report reminders sent successfully\n');
      } catch (error) {
        console.error('❌ Error sending weekly report reminders:', error.message);
      }
    }

    if (testType === 'planner' || testType === 'both') {
      console.log('📅 Testing Weekly Planner Reminders...');
      console.log('━'.repeat(50));
      try {
        await sendWeeklyPlannerReminders();
        console.log('✅ Weekly planner reminders sent successfully\n');
      } catch (error) {
        console.error('❌ Error sending weekly planner reminders:', error.message);
      }
    }

    console.log('━'.repeat(50));
    console.log('✅ Test completed!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
