import express from 'express';
import {
  setupEmailSession,
  getInbox,
  getEmail,
  sendEmail,
  replyEmail,
  markEmailRead,
  deleteEmail,
  searchEmails,
  getFolders,
  getEmailStats
} from '../controllers/emailController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All email routes require authentication
router.use(authenticate);

/**
 * Email Configuration
 */
router.post('/setup', setupEmailSession);

/**
 * Email List & Detail
 */
router.get('/inbox', getInbox);
router.get('/email/:uid', getEmail);

/**
 * Email Actions
 */
router.post('/send', sendEmail);
router.post('/reply/:uid', replyEmail);
router.put('/email/:uid/read', markEmailRead);
router.delete('/email/:uid', deleteEmail);

/**
 * Email Organization
 */
router.get('/search', searchEmails);
router.get('/folders', getFolders);

/**
 * Email Statistics
 */
router.get('/stats', getEmailStats);

export default router;
