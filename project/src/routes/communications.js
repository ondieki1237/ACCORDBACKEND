import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authUserLimiter } from '../middleware/rateLimiters.js';
import {
  createMessage,
  getMyCommunications,
  getGroupMessages,
  getPersonalConversation,
  markAsRead,
  listUsers
} from '../controllers/communicationsController.js';

const router = express.Router();

// Apply auth middleware and per-user limiter to all communications endpoints
router.use(authenticate, authUserLimiter);

// Create message (group or personal)
router.post('/', createMessage);

// Get group feed (single global group)
router.get('/group', getGroupMessages);

// Get personal inbox (all personal messages involving the current user)
router.get('/my', getMyCommunications);

// Get one-to-one conversation with userId
router.get('/personal/:userId', getPersonalConversation);

// Mark message read
router.post('/:id/read', markAsRead);

// List users for UI display
router.get('/users', listUsers);

export default router;