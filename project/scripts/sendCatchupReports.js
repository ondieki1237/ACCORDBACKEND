#!/usr/bin/env node

/**
 * Manual script to send weekly Excel reports for catch-up
 * This will send reports for both the current week and previous week
 * 
 * Usage: node scripts/sendCatchupReports.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import Visit from '../src/models/Visit.js';
import Report from '../src/models/Report.js';
import Lead from '../src/models/Lead.js';
import { generateWeeklyReportExcel, writeExcelFile } from '../src/utils/excelGenerator.js';
import logger from '../src/utils/logger.js';
import fs from 'fs';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Generate report for a specific week
 */
async function generateReportForWeek(weekStart, weekEnd, weekLabel) {
    try {
        console.log(`\n=== Generating ${weekLabel} Report ===`);
        console.log(`Week: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);

        // Get all active users
        const users = await User.find({
            isActive: true,
            role: { $in: ['sales', 'engineer', 'manager'] }
        }).select('employeeId firstName lastName email role region territory');

        const usersData = [];

        // Collect data for each user
        for (const user of users) {
            const visits = await Visit.find({
                userId: user._id,
                date: {
                    $gte: weekStart,
                    $lte: weekEnd
                }
            }).lean();

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

            const leads = await Lead.find({
                createdBy: user._id,
                createdAt: {
                    $gte: weekStart,
                    $lte: weekEnd
                }
            }).lean();

            if (visits.length > 0 || reports.length > 0 || leads.length > 0) {
                usersData.push({
                    user: user.toObject(),
                    visits,
                    reports,
                    leads
                });
            }
        }

        if (usersData.length === 0) {
            console.log('No activity found for this week. Including empty report.');
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
        console.log(`✓ Excel report saved to: ${filepath}`);

        return {
            filepath,
            filename,
            weekStart,
            weekEnd,
            totalUsers: usersData.length,
            totalVisits: usersData.reduce((sum, u) => sum + u.visits.length, 0),
            totalReports: usersData.reduce((sum, u) => sum + u.reports.length, 0),
            totalLeads: usersData.reduce((sum, u) => sum + u.leads.length, 0)
        };
    } catch (error) {
        console.error(`Error generating ${weekLabel} report:`, error);
        throw error;
    }
}

/**
 * Send email with Excel attachment
 */
async function sendWeeklyExcelEmail({ recipients, filepath, filename, weekStart, weekEnd, totalUsers, totalVisits, totalReports, totalLeads, weekLabel }) {
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
        <h2 style="color: #2c3e50;">${weekLabel} - Weekly Activity Report</h2>
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

        <p>The attached Excel file contains complete details across multiple sheets including:</p>
        <ul>
          <li>Summary - Overview of weekly activity</li>
          <li>Users - User information (Employee ID, Name, Email, Role, Region)</li>
          <li>Visits - Daily visits with client details and outcomes</li>
          <li>Visit Contacts - Contact persons met during visits</li>
          <li>Equipment - Existing and requested equipment information</li>
          <li>Weekly Reports - Submitted weekly reports</li>
          <li>Report Sections - Detailed report content</li>
          <li>Leads - Leads generated with full details</li>
        </ul>

        <p style="margin-top: 30px; color: #7f8c8d; font-size: 12px;">
          This is a catch-up report sent manually.<br>
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
            subject: `${weekLabel} - Weekly Activity Report - ${weekStartFormatted} to ${weekEndFormatted}`,
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
        console.log(`✓ Email sent to: ${recipients.join(', ')}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

/**
 * Main function
 */
async function main() {
    try {
        console.log('=== Weekly Report Catch-up Script ===\n');

        // Connect to database
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to database\n');

        const recipients = ['bellarinseth@gmail.com', 'reports@accordmedical.co.ke'];
        console.log(`Recipients: ${recipients.join(', ')}\n`);

        // Calculate this week (current week ending today - Sunday)
        const today = new Date();
        const currentWeekEnd = new Date(today);
        currentWeekEnd.setHours(23, 59, 59, 999);

        const currentWeekStart = new Date(currentWeekEnd);
        currentWeekStart.setDate(currentWeekEnd.getDate() - 6); // Last Monday
        currentWeekStart.setHours(0, 0, 0, 0);

        // Calculate last week
        const lastWeekEnd = new Date(currentWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1); // Last Sunday
        lastWeekEnd.setHours(23, 59, 59, 999);

        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 6); // Previous Monday
        lastWeekStart.setHours(0, 0, 0, 0);

        // Generate and send last week's report
        console.log('\n--- Processing Last Week ---');
        const lastWeekReport = await generateReportForWeek(lastWeekStart, lastWeekEnd, 'Last Week');
        await sendWeeklyExcelEmail({
            ...lastWeekReport,
            recipients,
            weekLabel: 'CATCH-UP: Last Week'
        });

        // Generate and send current week's report
        console.log('\n--- Processing Current Week ---');
        const currentWeekReport = await generateReportForWeek(currentWeekStart, currentWeekEnd, 'Current Week');
        await sendWeeklyExcelEmail({
            ...currentWeekReport,
            recipients,
            weekLabel: 'Current Week'
        });

        console.log('\n=== All reports sent successfully! ===\n');

    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database');
    }
}

// Run the script
main();
