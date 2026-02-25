import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { restrictToEmails, supervisorReviewPlanner, accountantReviewPlanner, getPlannerApproval } from '../controllers/plannerApprovalController.js';

const router = express.Router();

// Only supervisor can approve/disapprove
router.post('/supervisor/:plannerId', authenticate, restrictToEmails(['supervisor@accordmedical.co.ke']), supervisorReviewPlanner);

// Only accountant can review after supervisor approval
router.post('/accountant/:plannerId', authenticate, restrictToEmails(['accounts@accordmedical.co.ke']), accountantReviewPlanner);

// Get approval status for a planner (admin or owner)
router.get('/:plannerId', authenticate, getPlannerApproval);

export default router;
