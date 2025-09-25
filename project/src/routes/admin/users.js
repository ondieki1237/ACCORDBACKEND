import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { listAdminUsers } from '../../controllers/adminUsersController.js';

const router = express.Router();

router.use(authenticate, authorize('admin'));

// GET /api/admin/users
router.get('/', listAdminUsers);

export default router;