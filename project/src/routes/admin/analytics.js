import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { getSalesAnalytics } from '../../controllers/adminAnalyticsController.js';

const router = express.Router();

router.use(authenticate, authorize('admin'));

// GET /api/admin/analytics/sales/:userId
router.get('/sales/:userId', getSalesAnalytics);

export default router;