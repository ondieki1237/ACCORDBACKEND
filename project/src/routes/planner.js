import express from 'express';
import { optionalAuth, authenticate } from '../middleware/auth.js';
import { createPlanner, getMyPlanners } from '../controllers/plannerController.js';

const router = express.Router();

// Create planner for authenticated or unauthenticated clients.
// If a valid JWT is sent the planner will be associated with that user.
// Otherwise the client must supply a valid `userId` in the body (ObjectId) to associate the planner.
router.post('/', optionalAuth, createPlanner);

// Get planners for authenticated user
router.get('/', authenticate, getMyPlanners);

// Alias route for frontend compatibility
router.get('/my', authenticate, getMyPlanners);

export default router;
