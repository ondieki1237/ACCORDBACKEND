/**
 * Test script for weekly XML report generation
 * Run this manually to test the weekly report feature
 * 
 * Usage:
 *   node test-weekly-report.js
 */

import 'dotenv/config';
import User from './src/models/User.js';
import Visit from './src/models/Visit.js';
import Report from './src/models/Report.js';
import Lead from './src/models/Lead.js';
import logger from './src/utils/logger.js';
import { generateWeeklyReportExcel, writeExcelFile } from './src/utils/excelGenerator.js';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import connectDB from './src/config/database.js';

/**
 * Generate and send weekly XML report (TEST VERSION)
 */
const generateWeeklyXMLReport = async () => {
    try {
        logger.info('Starting weekly XML report generation (TEST MODE)...');

        // Calculate week range for LAST WEEK (Monday to Sunday)
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

        // Get last Sunday
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() - dayOfWeek); // Last Sunday
        weekEnd.setHours(23, 59, 59, 999);

        // Get last Monday
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() - 6); // Last Monday
        weekStart.setHours(0, 0, 0, 0);

        console.log('\n📅 Report Period:');
        console.log(`   From: ${weekStart.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} EAT`);
        console.log(`   To:   ${weekEnd.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} EAT\n`);

        // Get all active users (sales, engineers, managers)
        const users = await User.find({
            isActive: true,
            role: { $in: ['sales', 'engineer', 'manager'] }
        }).select('employeeId firstName lastName email role region territory');

        console.log(`👥 Found ${users.length} active users\n`);

        const usersData = [];

        // Collect data for each user
        for (const user of users) {
            console.log(`📊 Collecting data for: ${user.firstName} ${user.lastName} (${user.email})`);

            // Get visits for the week
            const visits = await Visit.find({
                userId: user._id,
                date: {
                    $gte: weekStart,
                    $lte: weekEnd
                }
            }).lean();

            // Get weekly reports
            const reports = await Report.find({
                userId: user._id,
                $or: [
                    {
                        weekStart: {
                            $gte: weekStart,
                            $lte: weekEnd
                        }
                    },
                    {
                        createdAt: {
                            $gte: weekStart,
                            $lte: weekEnd
                        }
                    }
                ]
            }).lean();

            // Get leads generated during the week
            const leads = await Lead.find({
                createdBy: user._id,
                createdAt: {
                    $gte: weekStart,
                    $lte: weekEnd
                }
            }).lean();

            console.log(`   ✓ Visits: ${visits.length}, Reports: ${reports.length}, Leads: ${leads.length}`);

            // Only include users who had activity during the week
            if (visits.length > 0 || reports.length > 0 || leads.length > 0) {
                usersData.push({
                    user: user.toObject(),
                    visits,
                    reports,
                    leads
                });
            }
        }

        console.log(`\n📈 Summary:`);
        console.log(`   Active users with data: ${usersData.length}`);
        console.log(`   Total visits: ${usersData.reduce((sum, u) => sum + u.visits.length, 0)}`);
        console.log(`   Total reports: ${usersData.reduce((sum, u) => sum + u.reports.length, 0)}`);
        console.log(`   Total leads: ${usersData.reduce((sum, u) => sum + u.leads.length, 0)}\n`);

        if (usersData.length === 0) {
            console.log('⚠️  No activity found for the week.');
            console.log('📧 Sending empty report anyway...\n');
            // Create empty data structure for XML
            usersData.push({
                user: {
                    employeeId: 'N/A',
                    firstName: 'No',
                    lastName: 'Activity',
                    email: 'N/A',
                    role: 'N/A',
                    region: 'N/A',
                    territory: 'N/A'
                },
                visits: [],
                reports: [],
                leads: []
            });
        }

        // Generate Excel
        console.log('🔧 Generating Excel file...');
        const excelData = {
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString(),
            usersData
        };

        const workbook = generateWeeklyReportExcel(excelData);

        // Save Excel to file
        const uploadsDir = path.join(process.cwd(), 'uploads', 'weekly-reports');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filename = `weekly-report-${weekStart.toISOString().split('T')[0]}-to-${weekEnd.toISOString().split('T')[0]}.xlsx`;
        const filepath = path.join(uploadsDir, filename);

        writeExcelFile(workbook, filepath);
        console.log(`✅ Excel report saved to: ${filepath}`);
        console.log(`   File size: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB\n`);

        // Send email with Excel attachment
        console.log('📧 Sending email...');
        const recipients = ['bellarinseth@gmail.com', 'reports@accordmedical.co.ke'];

        await sendWeeklyExcelEmail({
            recipients,
            filepath,
            filename,
            weekStart,
            weekEnd,
            totalUsers: usersData.length,
            totalVisits: usersData.reduce((sum, u) => sum + u.visits.length, 0),
            totalReports: usersData.reduce((sum, u) => sum + u.reports.length, 0),
            totalLeads: usersData.reduce((sum, u) => sum + u.leads.length, 0)
        });

        console.log('\n✅ Weekly Excel report sent successfully!');
        console.log(`   Recipients: ${recipients.join(', ')}\n`);

    } catch (error) {
        console.error('\n❌ Error generating weekly Excel report:', error);
        logger.error('Weekly Excel report generation error:', error);
    }
};

/**
 * Send weekly Excel report via email
 */
const sendWeeklyExcelEmail = async ({ recipients, filepath, filename, weekStart, weekEnd, totalUsers, totalVisits, totalReports, totalLeads }) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: Number(process.env.EMAIL_PORT) === 465,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const weekStartFormatted = new Date(weekStart).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const weekEndFormatted = new Date(weekEnd).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Weekly Activity Report (TEST)</h2>
        <p>Hello,</p>
        <p>Please find attached the weekly activity report for <strong>${weekStartFormatted}</strong> to <strong>${weekEndFormatted}</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #34495e;">Report Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0;"><strong>Week Period:</strong></td>
              <td style="padding: 8px 0;">${weekStartFormatted} - ${weekEndFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Active Users:</strong></td>
              <td style="padding: 8px 0;">${totalUsers}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Total Visits:</strong></td>
              <td style="padding: 8px 0;">${totalVisits}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Weekly Reports Submitted:</strong></td>
              <td style="padding: 8px 0;">${totalReports}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Leads Generated:</strong></td>
              <td style="padding: 8px 0;">${totalLeads}</td>
            </tr>
          </table>
        </div>

        <p>The attached Excel file contains 8 detailed sheets:</p>
        <ul>
          <li><strong>Summary</strong> - Week overview and statistics</li>
          <li><strong>Users</strong> - All active users with activity counts</li>
          <li><strong>Visits</strong> - Complete visit details</li>
          <li><strong>Visit Contacts</strong> - All contacts met during visits</li>
          <li><strong>Equipment</strong> - Existing and requested equipment</li>
          <li><strong>Weekly Reports</strong> - Submitted reports overview</li>
          <li><strong>Report Sections</strong> - Detailed report content</li>
          <li><strong>Leads</strong> - All leads generated with full details</li>
        </ul>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <strong>⚠️ TEST EMAIL</strong><br>
          This is a test email sent manually for verification purposes.
        </div>

        <p style="margin-top: 30px; color: #7f8c8d; font-size: 12px;">
          This is a test of the automated report system.<br>
          Production reports will be generated every Saturday at 9:00 AM EAT.<br>
          Generated at: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} EAT
        </p>

        <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
        <p style="color: #95a5a6; font-size: 12px;">
          ACCORD Medical - Field Sales Tracking System<br>
          <a href="https://app.codewithseth.co.ke" style="color: #3498db;">app.codewithseth.co.ke</a>
        </p>
      </div>
    `;

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'ACCORD Medical <noreply@accordmedical.com>',
            to: recipients.join(', '),
            subject: `[TEST] Weekly Activity Report - ${weekStartFormatted} to ${weekEndFormatted}`,
            html: htmlContent,
            attachments: [
                {
                    filename: filename,
                    path: filepath,
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log(`   ✓ Email sent to: ${recipients.join(', ')}`);

    } catch (error) {
        console.error('   ✗ Error sending email:', error.message);
        throw error;
    }
};

// Main execution
(async () => {
    console.log('\n🚀 Weekly XML Report Test Script');
    console.log('═══════════════════════════════════════\n');

    try {
        // Connect to database
        console.log('🔌 Connecting to database...');
        await connectDB();
        console.log('✅ Database connected\n');

        // Generate and send report
        await generateWeeklyXMLReport();

        console.log('═══════════════════════════════════════');
        console.log('✅ Test completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
})();
