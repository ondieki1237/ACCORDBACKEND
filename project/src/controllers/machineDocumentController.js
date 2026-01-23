import drive from '../config/googleDrive.js';
import MachineDocument from '../models/MachineDocument.js';
import logger from '../utils/logger.js';
import { Readable } from 'stream';

// DRIVE_FOLDER will be resolved at runtime; ensureMachinesFolder will create/find folder
let DRIVE_FOLDER = process.env.GOOGLE_DRIVE_FOLDER_ID || null;
import { ensureMachinesFolder } from '../config/googleDrive.js';

export const uploadMachineDocument = async (req, res) => {
  try {
    // Lazily ensure folder exists if not set
    if (!DRIVE_FOLDER) {
      DRIVE_FOLDER = await ensureMachinesFolder();
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Prepare file metadata
    const fileName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const fileMetadata = {
      name: fileName,
      parents: DRIVE_FOLDER ? [DRIVE_FOLDER] : undefined
    };

    const media = {
      mimeType,
      body: bufferStream
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, webViewLink'
    });

    const fileId = response.data.id;
    const viewLink = response.data.webViewLink;

    // Optionally, set public sharing for quick access (commented out by default)
    // await drive.permissions.create({ fileId, requestBody: { role: 'reader', type: 'anyone' } });

    // Store metadata in MongoDB
    const doc = new MachineDocument({
      machineId: req.body.machineId || null,
      uploadedBy: req.user._id,
      fileName,
      mimeType,
      size: req.file.size,
      driveFileId: fileId,
      driveViewLink: viewLink,
      folderId: DRIVE_FOLDER,
      notes: req.body.notes || ''
    });

    await doc.save();

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    logger.error('Machine document upload error:', error && error.stack ? error.stack : error);
    res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
};

export const listMachineDocuments = async (req, res) => {
  try {
    const { machineId } = req.query;
    const query = {};
    if (machineId) query.machineId = machineId;

    const docs = await MachineDocument.find(query).populate('uploadedBy', 'firstName lastName email');
    res.json({ success: true, data: docs });
  } catch (error) {
    logger.error('List machine documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to list documents' });
  }
};

export const getMachineDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await MachineDocument.findById(id).populate('uploadedBy', 'firstName lastName email');
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    logger.error('Get machine document error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch document' });
  }
};

export const deleteMachineDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await MachineDocument.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // permission: uploader, admin, manager
    if (String(doc.uploadedBy) !== String(req.user._id) && !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Remove from Drive
    try {
      await drive.files.delete({ fileId: doc.driveFileId });
    } catch (e) {
      logger.warn('Failed to delete file from Drive:', e.message);
    }

    await doc.remove();
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    logger.error('Delete machine document error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};