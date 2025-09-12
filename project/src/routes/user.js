import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAllUsers,
  getUserProfile,
  deleteUser
} from '../controllers/userController.js';

const router = express.Router();

// List all users (admin only)
router.get('/', authenticate, authorize('admin'), getAllUsers);

// Get user profile by ID (admin or self)
router.get('/:id', authenticate, getUserProfile);

// Delete user by ID (admin only)
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

export default router;