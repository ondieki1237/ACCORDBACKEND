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

export const initializeScheduledJobs = () => {
  // Daily report at 6 PM
  cron.schedule('0 18 * * *', async () => {
    logger.info('Running daily report job');
    await generateDailyReports();
  });

  // Weekly summary on Monday at 9 AM
  cron.schedule('0 9 * * 1', async () => {
    logger.info('Running weekly summary job');
    await generateWeeklySummaries();
  });

  // Clean up old data monthly
  cron.schedule('0 2 1 * *', async () => {
    logger.info('Running monthly cleanup job');
    await cleanupOldData();
  });

  // Send follow-up reminders at 10 AM daily
  cron.schedule('0 10 * * *', async () => {
    logger.info('Running follow-up reminders job');
    await sendFollowUpReminders();
  });

  // Send machine due reminders at 09:00 daily (default 5 days ahead)
  cron.schedule('0 9 * * *', async () => {
    try {
      const days = process.env.MACHINE_REMINDER_DAYS ? Number(process.env.MACHINE_REMINDER_DAYS) : 5;
      logger.info(`Running machine due reminders job for next ${days} day(s)`);
      const recipients = process.env.MACHINE_REMINDER_RECIPIENTS ? process.env.MACHINE_REMINDER_RECIPIENTS.split(',') : [];
      await sendMachinesDueReport({ days, recipients });
    } catch (err) {
      logger.error('Machine reminders job error:', err);
    }
  });

  // Weekly Excel Report - Every Saturday at 8 AM EAT (5 AM UTC)
  // EAT is UTC+3, so 8 AM EAT = 5 AM UTC
  cron.schedule('0 5 * * 6', async () => {
    logger.info('Running weekly Excel report generation job (Saturday)');
    await generateWeeklyExcelReport();
  }, {
    timezone: 'Africa/Nairobi' // East Africa Time
  });

  // Weekly Excel Report - Every Sunday at 8 AM EAT (5 AM UTC)
  // EAT is UTC+3, so 8 AM EAT = 5 AM UTC
  cron.schedule('0 5 * * 0', async () => {
    logger.info('Running weekly Excel report generation job (Sunday)');
    await generateWeeklyExcelReport();
  }, {
    timezone: 'Africa/Nairobi' // East Africa Time
  });

  logger.info('Scheduled jobs initialized');
};

const generateDailyReports = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const salesUsers = await User.find({ role: 'sales', isActive: true });

    for (const user of salesUsers) {
      const [visits, trails] = await Promise.all([
        Visit.find({
          userId: user._id,
          date: { $gte: today }
        }),
        Trail.find({
          userId: user._id,
          date: { $gte: today }
        })
      ]);

      const totalVisits = visits.length;
      const successfulVisits = visits.filter(v => v.visitOutcome === 'successful').length;
      const totalContacts = visits.reduce((sum, visit) => sum + visit.contacts.length, 0);
      const totalDistance = trails.reduce((sum, trail) => sum + trail.totalDistance, 0);

      if (totalVisits > 0) {
        await sendEmail({
          to: user.email,
          subject: `Daily Activity Report - ${today.toDateString()}`,
          template: 'dailyReport',
          data: {
            firstName: user.firstName,
            date: today.toDateString(),
            totalVisits,
            successfulVisits,
            totalContacts,
            totalDistance: totalDistance.toFixed(2)
          }
        });
      }
    }
  } catch (error) {
    logger.error('Daily report generation error:', error);
  }
};

export const generateWeeklySummaries = async () => {
  try {
    // Calculate previous week range: Monday - Sunday of the week that just ended
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday ...

    // weekEnd = last Sunday
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - dayOfWeek);
    weekEnd.setHours(23, 59, 59, 999);

    // weekStart = previous Monday
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const adminUsers = await User.find({ role: { $in: ['admin', 'manager'] }, isActive: true });

    const weeklyStats = await Visit.aggregate([
      {
        $match: {
          date: { $gte: weekStart, $lte: weekEnd }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $group: {
          _id: null,
          totalVisits: { $sum: 1 },
          totalContacts: { $sum: { $size: '$contacts' } },
          totalPotentialValue: { $sum: '$totalPotentialValue' },
          uniqueClients: { $addToSet: '$client.name' }
        }
      }
    ]);

    const stats = (weeklyStats && weeklyStats[0]) || { totalVisits: 0, totalContacts: 0, totalPotentialValue: 0, uniqueClients: [] };

    const weekStartFormatted = weekStart.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const weekEndFormatted = weekEnd.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Send a brief HTML summary email to each admin
    for (const admin of adminUsers) {
      try {
        logger.info(`Sending weekly summary to ${admin.email}`);
        const html = `
          <div style="font-family: Arial, sans-serif; max-width:600px;">
            <h2>Weekly Summary</h2>
            <p>Dear ${admin.firstName || 'Admin'},</p>
            <p>Here is the activity summary for <strong>${weekStartFormatted}</strong> to <strong>${weekEndFormatted}</strong>:</p>
            <ul>
              <li><strong>Total Visits:</strong> ${stats.totalVisits || 0}</li>
              <li><strong>Total Contacts:</strong> ${stats.totalContacts || 0}</li>
              <li><strong>Total Potential Value:</strong> KES ${Number(stats.totalPotentialValue || 0).toLocaleString()}</li>
              <li><strong>Unique Clients:</strong> ${Array.isArray(stats.uniqueClients) ? stats.uniqueClients.length : 0}</li>
            </ul>
            <p>View the full weekly report in the admin dashboard.</p>
            <p>Regards,<br/>ACCORD System</p>
          </div>
        `;

        await sendEmail({
          to: admin.email,
          subject: `Weekly Activity Summary - ${weekStartFormatted} to ${weekEndFormatted}`,
          data: { rawHtml: html }
        });
      } catch (err) {
        logger.error(`Failed to send weekly summary to ${admin.email}:`, err);
      }
    }
  } catch (error) {
    logger.error('Weekly summary generation error:', error);
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