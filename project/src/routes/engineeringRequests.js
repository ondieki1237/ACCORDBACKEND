import express from 'express';
import { createEngineeringRequest } from '../controllers/engineeringRequestController.js';

const router = express.Router();

// Public endpoint to submit engineering request (no auth)
router.post('/', createEngineeringRequest);

export default router;
