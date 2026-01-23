import express from 'express';
import upload from '../middleware/upload.js';
import { authenticate } from '../middleware/auth.js';
import { uploadMachineDocument, listMachineDocuments, getMachineDocument, deleteMachineDocument } from '../controllers/machineDocumentController.js';

const router = express.Router();

router.use(authenticate);

// Upload a machine document (multipart/form-data)
router.post('/', upload.single('file'), uploadMachineDocument);

// List documents (optionally by machineId)
router.get('/', listMachineDocuments);

// Get document metadata
router.get('/:id', getMachineDocument);

// Delete document
router.delete('/:id', deleteMachineDocument);

export default router;