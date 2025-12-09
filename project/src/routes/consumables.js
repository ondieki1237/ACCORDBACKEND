import express from 'express';
import { getConsumables, getConsumableById } from '../controllers/consumableController.js';

const router = express.Router();

router.get('/', getConsumables);
router.get('/:id', getConsumableById);

export default router;
