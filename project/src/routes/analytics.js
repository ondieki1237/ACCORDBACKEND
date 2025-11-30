import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getAnalyticsStatus,
    getVisualizations,
    getRealtimeData,
    getDashboardData
} from '../controllers/analyticsController.js';

const router = express.Router();

router.use(authenticate);

router.get('/status', getAnalyticsStatus);
router.get('/visualizations', getVisualizations);
router.get('/live/realtime', getRealtimeData);
router.get('/live/dashboard', getDashboardData);

export default router;
