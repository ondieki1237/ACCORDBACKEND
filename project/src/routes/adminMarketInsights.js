import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getMarketInsights, getProductInsights, getMarketSummary, exportMarketInsights } from '../controllers/adminMarketInsightsController.js';

const router = express.Router();

// Only admin can access market insights
router.get('/visits', authenticate, authorize('admin', 'supervisor'), getMarketInsights);
router.get('/products', authenticate, authorize('admin', 'supervisor'), getProductInsights);
router.get('/summary', authenticate, authorize('admin', 'supervisor'), getMarketSummary);
router.get('/export/visits', authenticate, authorize('admin', 'supervisor'), exportMarketInsights);

export default router;
