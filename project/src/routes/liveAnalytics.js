/**
 * Live Analytics Routes
 * Provides real-time analytics data from Python Flask API
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getLiveSummary,
  getLiveConversion,
  getLiveRegional,
  getLiveTopPerformers,
  getLivePredictions,
  getLiveDashboard,
  getRealtimeStats,
  getLiveChart,
  getUsersActivity,
  checkPythonHealth
} from '../controllers/liveAnalyticsController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/analytics/live/health
 * @desc    Check Python analytics service health
 * @access  Private (Admin, Manager)
 */
router.get('/health', authorize(['admin', 'manager']), checkPythonHealth);

/**
 * @route   GET /api/analytics/live/summary
 * @desc    Get live sales summary
 * @query   daysBack (default: 30)
 * @access  Private (Admin, Manager)
 */
router.get('/summary', authorize(['admin', 'manager']), getLiveSummary);

/**
 * @route   GET /api/analytics/live/conversion
 * @desc    Get live conversion funnel data
 * @query   daysBack (default: 30)
 * @access  Private (Admin, Manager)
 */
router.get('/conversion', authorize(['admin', 'manager']), getLiveConversion);

/**
 * @route   GET /api/analytics/live/regional
 * @desc    Get live regional performance
 * @query   daysBack (default: 30)
 * @access  Private (Admin, Manager)
 */
router.get('/regional', authorize(['admin', 'manager']), getLiveRegional);

/**
 * @route   GET /api/analytics/live/top-performers
 * @desc    Get live top performers
 * @query   daysBack (default: 30), topN (default: 10)
 * @access  Private (Admin, Manager)
 */
router.get('/top-performers', authorize(['admin', 'manager']), getLiveTopPerformers);

/**
 * @route   GET /api/analytics/live/predictions
 * @desc    Get predictive analytics (forecasts, churn, opportunities)
 * @query   daysBack (default: 90)
 * @access  Private (Admin, Manager)
 */
router.get('/predictions', authorize(['admin', 'manager']), getLivePredictions);

/**
 * @route   GET /api/analytics/live/dashboard
 * @desc    Get complete live dashboard data
 * @query   daysBack (default: 30)
 * @access  Private (Admin, Manager)
 */
router.get('/dashboard', authorize(['admin', 'manager']), getLiveDashboard);

/**
 * @route   GET /api/analytics/live/realtime
 * @desc    Get real-time statistics (today's data)
 * @access  Private (Admin, Manager)
 */
router.get('/realtime', authorize(['admin', 'manager']), getRealtimeStats);

/**
 * @route   GET /api/analytics/live/chart/:chartType
 * @desc    Get live chart image
 * @param   chartType - performance, heatmap, funnel, trends
 * @query   daysBack (default: 30)
 * @access  Private (Admin, Manager)
 */
router.get('/chart/:chartType', authorize(['admin', 'manager']), getLiveChart);

/**
 * @route   GET /api/analytics/live/users-activity
 * @desc    Get live user activity data
 * @query   daysBack (default: 7)
 * @access  Private (Admin, Manager)
 */
router.get('/users-activity', authorize(['admin', 'manager']), getUsersActivity);

export default router;
