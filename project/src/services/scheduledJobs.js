import cron from 'node-cron';
import User from '../models/User.js';
import Visit from '../models/Visit.js';
import Trail from '../models/Trail.js';
import Report from '../models/Report.js';
import Lead from '../models/Lead.js';
import { sendEmail } from './emailService.js';
import logger from '../utils/logger.js';
import { sendMachinesDueReport } from './machineReports.js';
import { generateWeeklyReportExcel, writeExcelFile } from '../utils/excelGenerator.js';
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

// Engineers-only summary
export const generateEngineerSummaries = async (weekStart, weekEnd, recipients = [], excelResult = null) => {
  try {
    const engineers = await User.find({ role: 'engineer', isActive: true }).select('firstName lastName email');
    const rows = [];
    for (const eng of engineers) {
      const visitsCount = await Visit.countDocuments({ userId: eng._id, date: { $gte: weekStart, $lte: weekEnd } });
      const reportsCount = await Report.countDocuments({ userId: eng._id, createdAt: { $gte: weekStart, $lte: weekEnd } });
      const leadsCount = await Lead.countDocuments({ createdBy: eng._id, createdAt: { $gte: weekStart, $lte: weekEnd } });
      rows.push({ name: `${eng.firstName} ${eng.lastName}`, email: eng.email, visits: visitsCount, reports: reportsCount, leads: leadsCount });
    }

    const weekStartFormatted = weekStart.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const weekEndFormatted = weekEnd.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let html = `<div style="font-family: Arial, sans-serif; max-width:600px;"><h2>Engineers Weekly Summary</h2><p>Period: <strong>${weekStartFormatted}</strong> to <strong>${weekEndFormatted}</strong></p>`;
    if (rows.length === 0) html += '<p>No engineer activity this week.</p>';
    else {
      html += '<table style="width:100%;border-collapse:collapse;"><tr><th>Name</th><th>Email</th><th>Visits</th><th>Reports</th><th>Leads</th></tr>';
      for (const r of rows) {
        html += `<tr><td>${r.name}</td><td>${r.email}</td><td>${r.visits}</td><td>${r.reports}</td><td>${r.leads}</td></tr>`;
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