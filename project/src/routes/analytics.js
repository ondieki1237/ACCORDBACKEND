import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  generateAnalytics,
  getAnalyticsStatus,
  getLatestReport,
  getVisualizations,
  getFile,
  getDashboard,
  cleanupOldReports
} from '../controllers/analyticsController.js';

const router = express.Router();

// All analytics routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/analytics/generate
 * @desc    Trigger analytics generation
 * @access  Admin/Manager only
 * @query   daysBack - Number of days to analyze (default: 30)
 */
router.post('/generate', authorize('admin', 'manager'), generateAnalytics);

/**
 * @route   GET /api/analytics/status
 * @desc    Get analytics generation status
 * @access  Private
 */
router.get('/status', getAnalyticsStatus);

/**
 * @route   GET /api/analytics/report/latest
 * @desc    Download latest Excel report
 * @access  Private
 */
router.get('/report/latest', getLatestReport);

/**
 * @route   GET /api/analytics/visualizations
 * @desc    Get list of all available visualizations
 * @access  Private
 */
router.get('/visualizations', getVisualizations);

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get latest interactive dashboard HTML
 * @access  Private
 */
router.get('/dashboard', getDashboard);

/**
 * @route   GET /api/analytics/files/:filename
 * @desc    Get specific analytics file (chart/report)
 * @access  Private
 */
router.get('/files/:filename', getFile);

/**
 * @route   DELETE /api/analytics/cleanup
 * @desc    Delete old reports
 * @access  Admin only
 * @query   daysOld - Files older than this will be deleted (default: 30)
 */
router.delete('/cleanup', authorize('admin'), cleanupOldReports);

export default router;
