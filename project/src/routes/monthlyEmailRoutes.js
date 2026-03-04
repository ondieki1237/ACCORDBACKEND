import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import monthlyEmailService from '../services/monthlyEmailService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Send monthly email report to all sales team
 * POST /api/admin/send-monthly-email
 * 
 * Query params:
 * - month: number (1-12), default: current month
 * - year: number, default: current year
 * 
 * Requires: Admin role
 */
router.post('/send-monthly-email', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { month, year } = req.query;
    
    // Use current date if not provided
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth();
    const targetYear = year ? parseInt(year) : now.getFullYear();

    // Validation
    if (targetMonth < 1 || targetMonth > 12) {
      return res.status(400).json({
        success: false,
        message: 'Month must be between 1 and 12'
      });
    }

    logger.info(`Admin ${req.user.email} triggered monthly email sending for ${targetMonth}/${targetYear}`);

    // Send monthly email
    const result = await monthlyEmailService.sendMonthlyEmail(targetMonth, targetYear);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send monthly emails',
        error: result.error
      });
    }

    res.json({
      success: true,
      message: `Monthly email sent successfully`,
      data: {
        month: result.month,
        recipientsCount: result.recipientsCount,
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        dataPoints: result.dataPoints,
        details: result.results
      }
    });
  } catch (error) {
    logger.error('Error in send-monthly-email endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send monthly emails',
      error: error.message
    });
  }
});

/**
 * Preview monthly email (without sending)
 * GET /api/admin/preview-monthly-email
 * 
 * Query params:
 * - month: number (1-12), default: current month
 * - year: number, default: current year
 * 
 * Requires: Admin role
 */
router.get('/preview-monthly-email', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { month, year } = req.query;

    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth();
    const targetYear = year ? parseInt(year) : now.getFullYear();

    // Calculate date range
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 1);

    // Fetch data
    const [salesData, ordersData, leadsData, visitsData, topPerformers, salesTeam] = await Promise.all([
      monthlyEmailService.getSalesData(startDate, endDate),
      monthlyEmailService.getOrdersData(startDate, endDate),
      monthlyEmailService.getLeadsData(startDate, endDate),
      monthlyEmailService.getVisitsData(startDate, endDate),
      monthlyEmailService.getTopPerformers(startDate, endDate),
      monthlyEmailService.getSalesTeamUsers()
    ]);

    const monthName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Generate preview data
    const preview = {
      month: monthName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      metrics: {
        sales: salesData,
        orders: ordersData,
        leads: leadsData,
        visits: visitsData
      },
      topPerformers: topPerformers.map(p => ({
        name: p.name,
        revenue: p.totalRevenue,
        salesCount: p.totalSales
      })),
      recipients: salesTeam.map(u => ({
        name: u.fullName,
        email: u.email,
        role: u.role
      }))
    };

    res.json({
      success: true,
      data: preview
    });
  } catch (error) {
    logger.error('Error in preview-monthly-email endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview monthly email',
      error: error.message
    });
  }
});

export default router;
