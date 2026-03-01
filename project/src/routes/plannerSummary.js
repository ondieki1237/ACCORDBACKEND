import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { restrictToEmails } from '../controllers/plannerApprovalController.js';
import { plannersSummary, plannersSummaryExcel } from '../controllers/plannerSummaryController.js';

const router = express.Router();

// Only accountant can access planners summary
router.get('/summary', authenticate, restrictToEmails(['accounts@accordmedical.co.ke']), plannersSummary);
router.get('/summary/excel', authenticate, restrictToEmails(['accounts@accordmedical.co.ke']), plannersSummaryExcel);

export default router;
