#!/usr/bin/env node

/**
 * CLI Script to send monthly email reports to sales team
 * 
 * Usage:
 *   node scripts/sendMonthlyEmail.js              (sends current month)
 *   node scripts/sendMonthlyEmail.js --month 2     (sends February of current year)
 *   node scripts/sendMonthlyEmail.js --month 2 --year 2026  (sends February 2026)
 *   node scripts/sendMonthlyEmail.js --preview     (shows preview without sending)
 */

import 'dotenv/config';
import connectDB from '../src/config/database.js';
import monthlyEmailService from '../src/services/monthlyEmailService.js';
import logger from '../src/utils/logger.js';

// Parse command line arguments
const args = process.argv.slice(2);
const now = new Date();

let month = now.getMonth() + 1;  // Default to current month (1-12)
let year = now.getFullYear();     // Default to current year
let previewOnly = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--month' && args[i + 1]) {
    month = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--year' && args[i + 1]) {
    year = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--preview') {
    previewOnly = true;
  }
}

// Validation
if (month < 1 || month > 12) {
  console.error('❌ Month must be between 1 and 12');
  process.exit(1);
}

const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { 
  month: 'long', 
  year: 'numeric' 
});

console.log('\n🔄 Accord Medical System - Monthly Email Service');
console.log('='.repeat(50));
console.log(`📅 Target Period: ${monthName}`);
console.log(`📧 Mode: ${previewOnly ? 'PREVIEW ONLY' : 'SEND EMAILS'}`);
console.log('='.repeat(50));

async function main() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    if (previewOnly) {
      // Show preview only
      console.log('\n📊 Fetching month data...');
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      const [salesData, ordersData, leadsData, visitsData, topPerformers, salesTeam] = await Promise.all([
        monthlyEmailService.getSalesData(startDate, endDate),
        monthlyEmailService.getOrdersData(startDate, endDate),
        monthlyEmailService.getLeadsData(startDate, endDate),
        monthlyEmailService.getVisitsData(startDate, endDate),
        monthlyEmailService.getTopPerformers(startDate, endDate, 5),
        monthlyEmailService.getSalesTeamUsers()
      ]);

      console.log('\n📈 Monthly Metrics:');
      console.log('-'.repeat(50));
      console.log(`Sales: ${salesData.totalSales || 0} transactions | Revenue: KES ${(salesData.totalRevenue || 0).toLocaleString()}`);
      console.log(`Orders: ${ordersData.totalOrders || 0} | Completed: ${ordersData.completedOrders || 0} | Value: KES ${(ordersData.totalOrderValue || 0).toLocaleString()}`);
      console.log(`Leads: ${leadsData.totalLeads || 0} (Hot: ${leadsData.hotLeads || 0}, Warm: ${leadsData.warmLeads || 0}, Cold: ${leadsData.coldLeads || 0}, Converted: ${leadsData.convertedLeads || 0})`);
      console.log(`Visits: ${visitsData.totalVisits || 0} | Successful: ${visitsData.successfulVisits || 0}`);
      
      if (topPerformers.length > 0) {
        console.log('\n🏆 Top Performers:');
        topPerformers.forEach((performer, index) => {
          console.log(`  ${index + 1}. ${performer.name} - KES ${(performer.totalRevenue || 0).toLocaleString()} (${performer.totalSales} sales)`);
        });
      }

      console.log(`\n📬 Recipients: ${salesTeam.length} people`);
      if (salesTeam.length > 0) {
        console.log('Recipients:');
        salesTeam.forEach(user => {
          console.log(`  - ${user.fullName} (${user.email}) [${user.role}]`);
        });
      }

      console.log('\n✅ Preview complete. Use --send flag to actually send emails.');
    } else {
      // Send actual emails
      console.log('\n📧 Sending monthly emails...');
      const result = await monthlyEmailService.sendMonthlyEmail(month, year);

      if (!result.success) {
        console.error('❌ Failed to send emails:', result.error);
        process.exit(1);
      }

      console.log('\n✅ Monthly Email Campaign Complete!');
      console.log('-'.repeat(50));
      console.log(`📊 Data Points:`);
      console.log(`  Sales: ${result.dataPoints.totalSales}`);
      console.log(`  Revenue: KES ${(result.dataPoints.totalRevenue || 0).toLocaleString()}`);
      console.log(`  Orders: ${result.dataPoints.totalOrders}`);
      console.log(`  Leads: ${result.dataPoints.totalLeads}`);
      console.log(`  Visits: ${result.dataPoints.totalVisits}`);
      
      console.log(`\n📬 Delivery Status:`);
      console.log(`  Total Recipients: ${result.recipientsCount}`);
      console.log(`  ✅ Sent: ${result.sentCount}`);
      console.log(`  ❌ Failed: ${result.failedCount}`);

      if (result.failedCount > 0) {
        console.log('\n⚠️  Failed Recipients:');
        result.results
          .filter(r => r.status === 'failed')
          .forEach(r => {
            console.log(`  - ${r.email}: ${r.error}`);
          });
      }

      console.log('\n' + '='.repeat(50));
      console.log('💌 Monthly email campaign sent successfully!');
    }

  } catch (error) {
    logger.error('Error in monthly email script:', error);
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Run main function
main();
