import cron from 'node-cron';
import User from '../models/User.js';
import Visit from '../models/Visit.js';
import Trail from '../models/Trail.js';
import { sendEmail } from './emailService.js';
import logger from '../utils/logger.js';
import { sendMachinesDueReport } from './machineReports.js';

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