import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getMarketInsights, getProductInsights, getMarketSummary, exportMarketInsights } from '../controllers/adminMarketInsightsController.js';

const router = express.Router();

// Only admin can access market insights
router.get('/visits', authenticate, authorize('admin'), getMarketInsights);
router.get('/products', authenticate, authorize('admin'), getProductInsights);
router.get('/summary', authenticate, authorize('admin'), getMarketSummary);
router.get('/export/visits', authenticate, authorize('admin'), exportMarketInsights);

export default router;
