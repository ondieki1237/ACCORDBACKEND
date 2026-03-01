import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getMarketInsights, getProductInsights, getMarketSummary } from '../controllers/adminMarketInsightsController.js';

const router = express.Router();

// Only admin can access market insights
router.get('/visits', authenticate, authorize('admin'), getMarketInsights);
router.get('/products', authenticate, authorize('admin'), getProductInsights);
router.get('/summary', authenticate, authorize('admin'), getMarketSummary);

export default router;
