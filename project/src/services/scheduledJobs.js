import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { existsSync } from 'fs';
import User from '../models/User.js';
import Visit from '../models/Visit.js';
import Trail from '../models/Trail.js';
import { sendEmail } from './emailService.js';
import logger from '../utils/logger.js';

const execAsync = promisify(exec);

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

  // Generate analytics every Monday at 8 AM
  cron.schedule('0 8 * * 1', async () => {
    logger.info('Running weekly analytics generation');
    await generateWeeklyAnalytics();
  });

  // Generate analytics on 1st of month at 7 AM
  cron.schedule('0 7 1 * *', async () => {
    logger.info('Running monthly analytics generation');
    await generateMonthlyAnalytics();
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

const generateWeeklySummaries = async () => {
  try {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const adminUsers = await User.find({ role: { $in: ['admin', 'manager'] }, isActive: true });

    const weeklyStats = await Visit.aggregate([
      {
        $match: {
          date: { $gte: weekStart }
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

    for (const admin of adminUsers) {
      // Send weekly summary email to admins
      logger.info(`Sending weekly summary to ${admin.email}`);
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
 * Generate weekly analytics (last 7 days)
 */
const generateWeeklyAnalytics = async () => {
  try {
    logger.info('Starting weekly analytics generation...');
    const analyticsPath = path.join(process.cwd(), '..', 'analytics');
    const pythonPath = path.join(analyticsPath, 'venv', 'bin', 'python');
    const scriptPath = path.join(analyticsPath, 'main.py');

    // Check if Python environment exists
    if (!existsSync(pythonPath)) {
      logger.warn('Python environment not found. Skipping analytics generation.');
      return;
    }

    // Run analytics for last 7 days
    const { stdout, stderr } = await execAsync(
      `cd ${analyticsPath} && ${pythonPath} ${scriptPath} 7`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    if (stderr) {
      logger.warn('Analytics stderr:', stderr);
    }

    logger.info('Weekly analytics generated successfully');
  } catch (error) {
    logger.error('Weekly analytics generation error:', error);
  }
};

/**
 * Generate monthly analytics (last 30 days)
 */
const generateMonthlyAnalytics = async () => {
  try {
    logger.info('Starting monthly analytics generation...');
    const analyticsPath = path.join(process.cwd(), '..', 'analytics');
    const pythonPath = path.join(analyticsPath, 'venv', 'bin', 'python');
    const scriptPath = path.join(analyticsPath, 'main.py');

    // Check if Python environment exists
    if (!existsSync(pythonPath)) {
      logger.warn('Python environment not found. Skipping analytics generation.');
      return;
    }

    // Run analytics for last 30 days
    const { stdout, stderr } = await execAsync(
      `cd ${analyticsPath} && ${pythonPath} ${scriptPath} 30`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    if (stderr) {
      logger.warn('Analytics stderr:', stderr);
    }

    logger.info('Monthly analytics generated successfully');

    // Send email to admins
    const adminUsers = await User.find({ role: { $in: ['admin', 'manager'] }, isActive: true });
    for (const admin of adminUsers) {
      try {
        await sendEmail({
          to: admin.email,
          subject: 'Monthly Analytics Report Available',
          html: `
            <h2>Monthly Analytics Report</h2>
            <p>Hello ${admin.firstName},</p>
            <p>The monthly analytics report has been generated.</p>
            <p><a href="${process.env.CLIENT_URL}/analytics">View Analytics Dashboard</a></p>
            <p>Best regards,<br>ACCORD Medical Team</p>
          `
        });
      } catch (emailError) {
        logger.error(`Failed to send analytics email to ${admin.email}:`, emailError);
      }
    }
  } catch (error) {
    logger.error('Monthly analytics generation error:', error);
  }
};
