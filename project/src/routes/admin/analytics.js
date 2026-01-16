import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { getSalesAnalytics, getTopProducts, getRepsLeaderboard, getFacilitiesLeaderboard, getRevenueSummary } from '../../controllers/adminAnalyticsController.js';

const router = express.Router();

router.use(authenticate, authorize('admin'));

// GET /api/admin/analytics/sales/:userId
router.get('/sales/:userId', getSalesAnalytics);

// Top products
router.get('/top-products', getTopProducts);

// Leaderboards
router.get('/leaderboard/reps', getRepsLeaderboard);
router.get('/leaderboard/facilities', getFacilitiesLeaderboard);

// Revenue summary
router.get('/revenue-summary', getRevenueSummary);

export default router;