import cron from 'node-cron';
import mysql from 'mysql2/promise';
import User from '../models/User.js';
import Visit from '../models/Visit.js';
import Trail from '../models/Trail.js';
import Report from '../models/Report.js';
import Lead from '../models/Lead.js';
import Planner from '../models/Planner.js';
import EngineeringService from '../models/EngineeringService.js';
import EngineeringRequest from '../models/EngineeringRequest.js';
import { sendEmail } from './emailService.js';
import logger from '../utils/logger.js';
import { sendMachinesDueReport } from './machineReports.js';
import { generateWeeklyReportExcel, writeExcelFile, generateMonthlySalesExcel } from '../utils/excelGenerator.js';
import fs from 'fs';
import path from 'path';

// Helper: send email with attachment using nodemailer
const sendEmailWithAttachment = async ({ to, subject, html, attachments = [] }) => {
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.default.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'ACCORD Medical <noreply@accordmedical.com>',
    to: Array.isArray(to) ? to.join(',') : to,
    subject,
    html,
    attachments
  };

  return transporter.sendMail(mailOptions);
};

// Helper function to convert MongoDB ObjectId to a numeric ID for MySQL
function objectIdToNumeric(objectId) {
  const idString = objectId.toString();
  // Convert first 15 hex characters to a number (fits safely in BIGINT)
  const numericId = parseInt(idString.slice(0, 15), 16);
  return numericId || Date.now();
}

// Weekly summaries (admin email + excel attachment)
export const generateWeeklySummaries = async () => {
  try {
    // Previous week: Monday - Sunday
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - dayOfWeek);
    weekEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const adminUsers = await User.find({ role: { $in: ['admin', 'manager'] }, isActive: true }).select('email firstName');
    const adminEmails = adminUsers.map(u => u.email);
    // Add requested admins
    const extraAdmins = ['g.nato@accordmedical.co.ke', 'b.maingi@accordmedical.co.ke'];
    const recipients = Array.from(new Set([...adminEmails, ...extraAdmins]));

    // Aggregate weekly stats
    const weeklyStats = await Visit.aggregate([
      { $match: { date: { $gte: weekStart, $lte: weekEnd } } },
      { $group: {
        _id: null,
        totalVisits: { $sum: 1 },
        totalContacts: { $sum: { $size: '$contacts' } },
        totalPotentialValue: { $sum: { $ifNull: ['$totalPotentialValue', 0] } },
        uniqueClients: { $addToSet: '$client.name' }
      } }
    ]);

    const stats = (weeklyStats && weeklyStats[0]) || { totalVisits: 0, totalContacts: 0, totalPotentialValue: 0, uniqueClients: [] };

    // Generate full weekly Excel but do not send (return file path)
    const excelResult = await generateWeeklyExcelReport({ weekStart, weekEnd, sendEmail: false });

    const weekStartFormatted = weekStart.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const weekEndFormatted = weekEnd.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width:600px;">
        <h2>Weekly Summary</h2>
        <p>Here is the activity summary for <strong>${weekStartFormatted}</strong> to <strong>${weekEndFormatted}</strong>.</p>
        <ul>
          <li><strong>Total Visits:</strong> ${stats.totalVisits || 0}</li>
          <li><strong>Total Contacts:</strong> ${stats.totalContacts || 0}</li>
          <li><strong>Total Potential Value:</strong> KES ${Number(stats.totalPotentialValue || 0).toLocaleString()}</li>
          <li><strong>Unique Clients:</strong> ${Array.isArray(stats.uniqueClients) ? stats.uniqueClients.length : 0}</li>
        </ul>
        <p>View the admin dashboard: <a href="https://adminaccord.vercel.app/dashboard">Admin Dashboard</a></p>
        <p>Regards,<br/>ACCORD System</p>
      </div>
    `;

    // Attach generated excel if available
    const attachments = [];
    if (excelResult && excelResult.filepath) attachments.push({ filename: excelResult.filename, path: excelResult.filepath, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    await sendEmailWithAttachment({ to: recipients, subject: `Weekly Activity Summary - ${weekStartFormatted} to ${weekEndFormatted}`, html, attachments });
    logger.info('Weekly summary email sent to admins');

    // Also send engineer-specific summary separately
    await generateEngineerSummaries(weekStart, weekEnd, recipients, excelResult);
  } catch (error) {
    logger.error('Weekly summary generation error:', error);
  }
};

// Engineers-only summary (installations, maintenance/services, requests — not sales metrics)
export const generateEngineerSummaries = async (weekStart, weekEnd, recipients = [], excelResult = null) => {
  try {
    const engineers = await User.find({ role: 'engineer', isActive: true }).select('firstName lastName email');
    const dateRange = { $gte: weekStart, $lte: weekEnd };
    const rows = [];
    for (const eng of engineers) {
      const [visitsCount, installationVisits, maintenanceVisits, installationServices, maintenanceServices, requestsCount, reportsCount] = await Promise.all([
        Visit.countDocuments({ userId: eng._id, date: dateRange }),
        Visit.countDocuments({ userId: eng._id, date: dateRange, visitPurpose: 'installation' }),
        Visit.countDocuments({ userId: eng._id, date: dateRange, visitPurpose: 'maintenance' }),
        EngineeringService.countDocuments({
          date: dateRange,
          serviceType: 'installation',
          $or: [{ userId: eng._id }, { 'engineerInCharge._id': eng._id }]
        }),
        EngineeringService.countDocuments({
          date: dateRange,
          serviceType: { $in: ['maintenance', 'service', 'repair', 'inspection'] },
          $or: [{ userId: eng._id }, { 'engineerInCharge._id': eng._id }]
        }),
        EngineeringRequest.countDocuments({ assignedEngineer: eng._id, createdAt: dateRange }),
        Report.countDocuments({ userId: eng._id, createdAt: dateRange })
      ]);
      const installations = installationVisits + installationServices;
      const maintenanceAndServices = maintenanceVisits + maintenanceServices;
      rows.push({
        name: `${eng.firstName} ${eng.lastName}`,
        email: eng.email,
        visits: visitsCount,
        installations,
        maintenanceAndServices,
        requests: requestsCount,
        reports: reportsCount
      });
    }

    const weekStartFormatted = weekStart.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const weekEndFormatted = weekEnd.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let html = `<div style="font-family: Arial, sans-serif; max-width:700px;"><h2>Engineers Weekly Summary</h2><p>Period: <strong>${weekStartFormatted}</strong> to <strong>${weekEndFormatted}</strong></p><p>Summary of site visits, installations, maintenance &amp; services, and engineering requests.</p>`;
    if (rows.length === 0) html += '<p>No engineer activity this week.</p>';
    else {
      html += '<table style="width:100%;border-collapse:collapse;"><tr><th>Name</th><th>Email</th><th>Visits</th><th>Installations</th><th>Maintenance &amp; services</th><th>Requests</th><th>Reports</th></tr>';
      for (const r of rows) {
        html += `<tr><td>${r.name}</td><td>${r.email}</td><td>${r.visits}</td><td>${r.installations}</td><td>${r.maintenanceAndServices}</td><td>${r.requests}</td><td>${r.reports}</td></tr>`;
      }
      html += '</table>';
    }
    html += `<p>Admin Dashboard: <a href="https://adminaccord.vercel.app/dashboard">Open</a></p></div>`;

    const attachments = [];
    if (excelResult && excelResult.filepath) attachments.push({ filename: excelResult.filename, path: excelResult.filepath, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Send to same recipients but mark subject as engineers summary
    await sendEmailWithAttachment({ to: recipients, subject: `Engineers Weekly Summary - ${weekStartFormatted} to ${weekEndFormatted}`, html, attachments });
    logger.info('Engineers weekly summary sent');
  } catch (err) {
    logger.error('Engineers summary error:', err);
  }
};

/**
 * Send weekly report reminders to sales team members who haven't submitted
 * Runs every Friday at 5 PM (EAT)
 */
export const sendWeeklyReportReminders = async () => {
  try {
    logger.info('Starting weekly report reminder job');

    // Get current week (Monday to Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 5 = Friday
    
    // Calculate week start (Monday) and end (Sunday)
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + (6 - dayOfWeek)); // Sunday of current week
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6); // Monday of current week
    weekStart.setHours(0, 0, 0, 0);

    logger.info(`Checking for weekly reports from ${weekStart.toDateString()} to ${weekEnd.toDateString()}`);

    // Get all active non-admin users
    const users = await User.find({
      isActive: true,
      role: { $nin: ['admin'] } // Exclude admins
    }).select('_id email firstName lastName');

    if (!users.length) {
      logger.info('No active non-admin users found');
      return;
    }

    logger.info(`Found ${users.length} active non-admin users`);

    // Check each user for submitted reports
    const usersWithoutReports = [];

    for (const user of users) {
      const existingReport = await Report.findOne({
        userId: user._id,
        weekStart: { $gte: weekStart, $lte: weekEnd },
        isDraft: false // Only count submitted reports
      });

      if (!existingReport) {
        usersWithoutReports.push(user);
      }
    }

    logger.info(`${usersWithoutReports.length} users haven't submitted weekly reports`);

    // Send reminders to users without reports
    for (const user of usersWithoutReports) {
      try {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
              <h2 style="color: #333;">📋 Weekly Report Reminder</h2>
              <p style="color: #555; font-size: 16px;">
                Hi <strong>${user.firstName}</strong>,
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
          to: user.email,
          subject: '📋 Weekly Report Reminder - Please Submit Today',
          template: 'custom',
          data: { rawHtml: html }
        });

        logger.info(`Weekly report reminder sent to ${user.email}`);
      } catch (err) {
        logger.error(`Error sending weekly report reminder to ${user.email}:`, err);
      }
    }

    logger.info('Weekly report reminder job completed');
  } catch (error) {
    logger.error('Error in sendWeeklyReportReminders:', error);
  }
};

/**
 * Send weekly planner reminders to sales team members who haven't filled their planners
 * Runs every Sunday at 5 PM (EAT)
 */
export const sendWeeklyPlannerReminders = async () => {
  try {
    logger.info('Starting weekly planner reminder job');

    // Get current week's Monday for planner matching
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday
    
    // Calculate this week's Monday
    const weekMonday = new Date(today);
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to get Monday
    weekMonday.setDate(today.getDate() + diff);
    weekMonday.setHours(0, 0, 0, 0);

    // Sunday of current week
    const weekSunday = new Date(weekMonday);
    weekSunday.setDate(weekMonday.getDate() + 6);
    weekSunday.setHours(23, 59, 59, 999);

    logger.info(`Checking for weekly planners from ${weekMonday.toDateString()} to ${weekSunday.toDateString()}`);

    // Get all active non-admin users
    const users = await User.find({
      isActive: true,
      role: { $nin: ['admin'] } // Exclude admins
    }).select('_id email firstName lastName');

    if (!users.length) {
      logger.info('No active non-admin users found');
      return;
    }

    logger.info(`Found ${users.length} active non-admin users`);

    // Check each user for submitted planners
    const usersWithoutPlanners = [];

    for (const user of users) {
      const existingPlanner = await Planner.findOne({
        userId: user._id,
        weekCreatedAt: { $gte: weekMonday, $lte: weekSunday }
      });

      if (!existingPlanner) {
        usersWithoutPlanners.push(user);
      }
    }

    logger.info(`${usersWithoutPlanners.length} users haven't filled their weekly planners`);

    // Send reminders to users without planners
    for (const user of usersWithoutPlanners) {
      try {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
              <h2 style="color: #333;">📅 Weekly Planner Reminder</h2>
              <p style="color: #555; font-size: 16px;">
                Hi <strong>${user.firstName}</strong>,
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
          to: user.email,
          subject: '📅 Weekly Planner Reminder - Please Fill Your Planner',
          template: 'custom',
          data: { rawHtml: html }
        });

        logger.info(`Weekly planner reminder sent to ${user.email}`);
      } catch (err) {
        logger.error(`Error sending weekly planner reminder to ${user.email}:`, err);
      }
    }

    logger.info('Weekly planner reminder job completed');
  } catch (error) {
    logger.error('Error in sendWeeklyPlannerReminders:', error);
  }
};

/**
 * Sync all MongoDB data to MySQL daily
 * Exports users, visits, reports, planners, and leads
 * Runs every day at 2 AM
 */
export const syncMongoDBToMySQL = async () => {
  let connection;
  try {
    logger.info('Starting MongoDB to MySQL sync');

    // Connect to MySQL
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: Number(process.env.MYSQL_PORT || 3306)
    });

    logger.info('Connected to MySQL for sync');

    // Sync users
    const users = await User.find({}).lean();
    for (const user of users) {
      await connection.execute(`
        INSERT INTO users (id, first_name, last_name, email, phone, employee_id, password, role, is_active, region, territory, designation, created_at, updated_at, mongo_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          first_name = VALUES(first_name), last_name = VALUES(last_name), phone = VALUES(phone), 
          role = VALUES(role), is_active = VALUES(is_active), region = VALUES(region), 
          territory = VALUES(territory), designation = VALUES(designation), updated_at = VALUES(updated_at)
      `, [
        objectIdToNumeric(user._id),
        user.firstName || '', user.lastName || '', user.email?.toLowerCase() || '', user.phone || '',
        user.employeeId || '', user.password || '', user.role || 'user', user.isActive ? 1 : 0,
        user.region || '', user.territory || '', user.designation || '',
        user.createdAt || new Date(), user.updatedAt || new Date(), user._id.toString()
      ]);
    }
    logger.info(`Synced ${users.length} users to MySQL`);

    // Sync visits
    const visits = await Visit.find({}).lean();
    for (const visit of visits) {
      if (!visit.userId) continue;
      const userId = objectIdToNumeric(visit.userId);
      await connection.execute(`
        INSERT INTO visits (id, user_id, visit_date, client_name, client_type, location, purpose, outcome, notes, created_at, mongo_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          client_name = VALUES(client_name), outcome = VALUES(outcome), notes = VALUES(notes)
      `, [
        objectIdToNumeric(visit._id), userId, visit.date || new Date(),
        visit.client?.name || '', visit.client?.type || '', visit.client?.location || '',
        visit.visitPurpose || '', visit.visitOutcome || '', visit.notes || '',
        visit.createdAt || new Date(), visit._id.toString()
      ]);
    }
    logger.info(`Synced ${visits.length} visits to MySQL`);

    // Sync reports
    const reports = await Report.find({}).lean();
    for (const report of reports) {
      if (!report.userId) continue;
      const userId = objectIdToNumeric(report.userId);
      await connection.execute(`
        INSERT INTO reports (id, user_id, week_start, week_end, week_range, content, status, is_draft, created_at, updated_at, mongo_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          content = VALUES(content), status = VALUES(status), is_draft = VALUES(is_draft), updated_at = VALUES(updated_at)
      `, [
        objectIdToNumeric(report._id), userId,
        report.weekStart || new Date(), report.weekEnd || new Date(), report.weekRange || '',
        JSON.stringify(report.content || report.sections || {}), report.status || 'pending',
        report.isDraft ? 1 : 0, report.createdAt || new Date(), report.updatedAt || new Date(),
        report._id.toString()
      ]);
    }
    logger.info(`Synced ${reports.length} reports to MySQL`);

    // Sync planners
    const planners = await Planner.find({}).lean();
    for (const planner of planners) {
      if (!planner.userId) continue;
      const userId = objectIdToNumeric(planner.userId);
      await connection.execute(`
        INSERT INTO planners (id, user_id, week_created_at, days, notes, created_at, updated_at, mongo_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          days = VALUES(days), notes = VALUES(notes), updated_at = VALUES(updated_at)
      `, [
        objectIdToNumeric(planner._id), userId,
        planner.weekCreatedAt || new Date(), JSON.stringify(planner.days || []),
        planner.notes || '', planner.createdAt || new Date(),
        planner.updatedAt || new Date(), planner._id.toString()
      ]);
    }
    logger.info(`Synced ${planners.length} planners to MySQL`);

    // Sync leads
    const leads = await Lead.find({}).lean();
    for (const lead of leads) {
      if (!lead.userId) continue;
      const userId = objectIdToNumeric(lead.userId);
      await connection.execute(`
        INSERT INTO leads (id, user_id, contact_name, contact_email, facility_name, location, status, created_at, updated_at, mongo_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          contact_name = VALUES(contact_name), contact_email = VALUES(contact_email), status = VALUES(status), updated_at = VALUES(updated_at)
      `, [
        objectIdToNumeric(lead._id), userId,
        lead.contactName || lead.name || '', lead.contactEmail || lead.email || '',
        lead.facilityName || '', lead.location || '', lead.status || 'new',
        lead.createdAt || new Date(), lead.updatedAt || new Date(), lead._id.toString()
      ]);
    }
    logger.info(`Synced ${leads.length} leads to MySQL`);

    logger.info('MongoDB to MySQL sync completed successfully');
  } catch (error) {
    logger.error('Error syncing MongoDB to MySQL:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

export const initializeScheduledJobs = () => {
  // Daily report at 6 PM
  cron.schedule('0 18 * * *', async () => {
    logger.info('Running daily report job');
    try {
      if (typeof generateDailyReports === 'function') await generateDailyReports();
    } catch (err) { logger.error('Daily report job error:', err); }
  });

  // Weekly summary on Monday at 9 AM
  cron.schedule('0 9 * * 1', async () => {
    logger.info('Running weekly summary job');
    try { await generateWeeklySummaries(); } catch (err) { logger.error('Weekly summary job error:', err); }
  });

  // Clean up old data monthly
  cron.schedule('0 2 1 * *', async () => {
    logger.info('Running monthly cleanup job');
    try { await cleanupOldData(); } catch (err) { logger.error('Monthly cleanup job error:', err); }
  });

  // Send follow-up reminders at 10 AM daily
  cron.schedule('0 10 * * *', async () => {
    logger.info('Running follow-up reminders job');
    try { await sendFollowUpReminders(); } catch (err) { logger.error('Follow-up reminders job error:', err); }
  });

  // Send machine due reminders at 09:00 daily (default 5 days ahead)
  cron.schedule('0 9 * * *', async () => {
    try {
      const days = process.env.MACHINE_REMINDER_DAYS ? Number(process.env.MACHINE_REMINDER_DAYS) : 5;
      const recipients = process.env.MACHINE_REMINDER_RECIPIENTS ? process.env.MACHINE_REMINDER_RECIPIENTS.split(',') : [];
      logger.info(`Running machine due reminders job for next ${days} day(s)`);
      if (typeof sendMachinesDueReport === 'function') {
        await sendMachinesDueReport(days, recipients);
      }
    } catch (err) {
      logger.error('Machine due reminder job error:', err);
    }
  });

  // Monthly sales summaries: run on day 2 of every month at 00:00 (midnight)
  cron.schedule('0 0 2 * *', async () => {
    logger.info('Running monthly sales summaries job');
    try {
      await generateMonthlySalesSummaries();
    } catch (err) {
      logger.error('Monthly sales summaries job error:', err);
    }
  });

  // Weekly report reminders: Every Friday at 5 PM EAT (17:00)
  cron.schedule('0 17 * * 5', async () => {
    logger.info('Running weekly report reminder job');
    try {
      await sendWeeklyReportReminders();
    } catch (err) {
      logger.error('Weekly report reminder job error:', err);
    }
  });

  // Weekly planner reminders: Every Sunday at 5 PM EAT (17:00)
  cron.schedule('0 17 * * 0', async () => {
    logger.info('Running weekly planner reminder job');
    try {
      await sendWeeklyPlannerReminders();
    } catch (err) {
      logger.error('Weekly planner reminder job error:', err);
    }
  });

  // MongoDB to MySQL sync: Every day at 2 AM (02:00)
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running MongoDB to MySQL sync job');
    try {
      await syncMongoDBToMySQL();
    } catch (err) {
      logger.error('MongoDB to MySQL sync job error:', err);
    }
  });
};

export const generateMonthlySalesSummaries = async () => {
  try {
    // Previous month range
    const now = new Date();
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(firstOfThisMonth.getTime() - 1);
    monthEnd.setHours(23,59,59,999);
    const monthStart = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), 1);
    monthStart.setHours(0,0,0,0);

    const monthLabel = monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

    // Get all active sales users
    const salesUsers = await User.find({ role: 'sales', isActive: true }).select('firstName lastName email employeeId');

    const uploadsDir = path.join(process.cwd(), 'uploads', 'monthly-sales');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    for (const user of salesUsers) {
      try {
        const visits = await Visit.find({ userId: user._id, date: { $gte: monthStart, $lte: monthEnd } }).lean();
        const leads = await Lead.find({ createdBy: user._id, createdAt: { $gte: monthStart, $lte: monthEnd } }).lean();

        const userData = { user: user.toObject(), visits, leads };

        // Generate workbook
        const workbook = generateMonthlySalesExcel({ monthStart, monthEnd, userData });

        const filename = `${(user.email || user.employeeId || user._id).toString().replace(/[@<>:\"/\\|?*\s]/g, '_')}-${monthStart.getFullYear()}-${String(monthStart.getMonth()+1).padStart(2,'0')}.xlsx`;
        const filepath = path.join(uploadsDir, filename);
        writeExcelFile(workbook, filepath);

        // Build email
        const html = `
          <div style="font-family: Arial, sans-serif; max-width:600px;">
            <h2>Monthly Activity Summary</h2>
            <p>Hello ${user.firstName || ''},</p>
            <p>Please find attached your activity summary for <strong>${monthLabel}</strong>.</p>
            <ul>
              <li>Total Visits: <strong>${visits.length}</strong></li>
              <li>Total Leads: <strong>${leads.length}</strong></li>
              <li>Unique Clients Met: <strong>${Array.from(new Set(visits.map(v => v.client?.name).filter(Boolean))).length}</strong></li>
            </ul>
            <p>Please login and review your activities in the app.</p>
            <p>Regards,<br/>ACCORD System</p>
          </div>
        `;

        await sendEmailWithAttachment({ to: user.email, subject: `Monthly Activity Summary - ${monthLabel}`, html, attachments: [{ filename, path: filepath, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }] });
        logger.info(`Monthly summary sent to ${user.email}`);
      } catch (innerErr) {
        logger.error(`Failed to generate/send monthly summary for ${user.email}:`, innerErr);
      }
    }
  } catch (error) {
    logger.error('generateMonthlySalesSummaries error:', error);
  }
};

const cleanupOldData = async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 12); // Keep 12 months of data

    // Archive old trails
    const oldTrails = await Trail.countDocuments({ createdAt: { $lt: cutoffDate } });
    if (oldTrails > 0) {
      // In production, you might want to archive to a separate collection
      logger.info(`Found ${oldTrails} old trails to archive`);
    }

    logger.info('Monthly cleanup completed');
  } catch (error) {
    logger.error('Monthly cleanup error:', error);
  }
};

const sendFollowUpReminders = async () => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const visitsWithDueFollowUps = await Visit.find({
      isFollowUpRequired: true,
      'followUpActions.dueDate': { $lte: today },
      'followUpActions.status': 'pending'
    }).populate('userId', 'firstName lastName email')
      .populate('followUpActions.assignedTo', 'firstName lastName email');

    for (const visit of visitsWithDueFollowUps) {
      const dueActions = visit.followUpActions.filter(
        action => action.status === 'pending' && action.dueDate <= today
      );

      for (const action of dueActions) {
        const assignee = action.assignedTo;
        if (assignee && assignee.email) {
          logger.info(`Sending follow-up reminder to ${assignee.email}`);
          // Send reminder email
        }
      }
    }
  } catch (error) {
    logger.error('Follow-up reminder error:', error);
  }
};

/**
 * Generate and send weekly Excel report
 * Runs every Sunday at 8 AM EAT
 */
export const generateWeeklyExcelReport = async () => {
  try {
    logger.info('Starting weekly Excel report generation...');

    // Calculate week range (Monday to Sunday of previous week)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

    // Get last Monday
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - dayOfWeek); // Last Sunday
    weekEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6); // Last Monday
    weekStart.setHours(0, 0, 0, 0);

    logger.info(`Generating report for week: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);

    // Get all active users (sales, engineers, managers)
    const users = await User.find({
      isActive: true,
      role: { $in: ['sales', 'engineer', 'manager'] }
    }).select('employeeId firstName lastName email role region territory');

    const usersData = [];

    // Collect data for each user
    for (const user of users) {
      logger.info(`Collecting data for user: ${user.firstName} ${user.lastName}`);

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

    if (usersData.length === 0) {
      logger.info('No activity found for the week. Sending empty report anyway.');
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
    logger.info(`Excel report saved to: ${filepath}`);

    // Send email with Excel attachment
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

    logger.info('Weekly Excel report sent successfully');

    // Optional: Clean up old Excel files (keep last 12 weeks)
    cleanupOldExcelReports(uploadsDir);

  } catch (error) {
    logger.error('Weekly Excel report generation error:', error);
  }
};

/**
 * Send weekly Excel report via email
 */
const sendWeeklyExcelEmail = async ({ recipients, filepath, filename, weekStart, weekEnd, totalUsers, totalVisits, totalReports, totalLeads }) => {
  try {
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.default.createTransport({
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
        <h2 style="color: #2c3e50;">Weekly Activity Report</h2>
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
          This is an automated report generated every Sunday at 8:00 AM EAT.<br>
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
      subject: `Weekly Activity Report - ${weekStartFormatted} to ${weekEndFormatted}`,
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
    logger.info(`Weekly Excel report email sent to: ${recipients.join(', ')}`);

  } catch (error) {
    logger.error('Error sending weekly Excel email:', error);
    throw error;
  }
};

/**
 * Clean up old Excel report files (keep last 12 weeks)
 */
const cleanupOldExcelReports = (uploadsDir) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const excelFiles = files.filter(f => f.endsWith('.xlsx')).sort().reverse();

    // Keep only the last 12 reports
    if (excelFiles.length > 12) {
      const filesToDelete = excelFiles.slice(12);
      filesToDelete.forEach(file => {
        const filepath = path.join(uploadsDir, file);
        fs.unlinkSync(filepath);
        logger.info(`Deleted old Excel report: ${file}`);
      });
    }
  } catch (error) {
    logger.error('Error cleaning up old Excel reports:', error);
  }
};