import express from 'express';
import { createConsumable, updateConsumable, deleteConsumable, getAdminConsumables } from '../../controllers/consumableController.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = express.Router();

// All routes require admin/manager privileges
router.use(authenticate, authorize('admin', 'manager'));

router.get('/', getAdminConsumables);
router.post('/', createConsumable);
router.put('/:id', updateConsumable);
router.delete('/:id', deleteConsumable);

export default router;
