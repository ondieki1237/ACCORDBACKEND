import drive, { ensureMachinesFolder } from '../config/googleDrive.js';
import MachineDocument from '../models/MachineDocument.js';
import DocumentCategory from '../models/DocumentCategory.js';
import Manufacturer from '../models/Manufacturer.js';
import logger from '../utils/logger.js';
import { Readable } from 'stream';

let DRIVE_FOLDER = process.env.GOOGLE_DRIVE_FOLDER_ID || null;

// Create either a Drive-backed file document (multipart upload) or a link document (JSON body)
export const uploadMachineDocument = async (req, res) => {
  try {
    // If body.type === 'link' then create a link record without touching Drive
    if (req.body && req.body.type === 'link') {
      const { title, linkUrl, categoryId, manufacturerId } = req.body;
      if (!title || !linkUrl) return res.status(400).json({ success: false, message: 'title and linkUrl are required for link documents' });

      // optional: validate category/manufacturer existence
      const category = categoryId ? await DocumentCategory.findById(categoryId) : null;
      const manufacturer = manufacturerId ? await Manufacturer.findById(manufacturerId) : null;

      const doc = new MachineDocument({
        title,
        type: 'link',
        linkUrl,
        categoryId: category ? category._id : undefined,
        manufacturerId: manufacturer ? manufacturer._id : undefined,
        uploadedBy: req.user._id
      });

      await doc.save();
      return res.status(201).json({ success: true, data: doc });
    }

    // Otherwise expect a file upload
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    if (!DRIVE_FOLDER) {
      DRIVE_FOLDER = await ensureMachinesFolder();
    }

    const fileName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const fileMetadata = {
      name: fileName,
      parents: DRIVE_FOLDER ? [DRIVE_FOLDER] : undefined
    };

    const media = { mimeType, body: bufferStream };

    const response = await drive.files.create({ resource: fileMetadata, media, fields: 'id, webViewLink' });
    const fileId = response.data.id;
    const viewLink = response.data.webViewLink;

    const doc = new MachineDocument({
      title: req.body.title || fileName,
      type: 'file',
      fileName,
      mimeType,
      fileSize: req.file.size,
      driveFileId: fileId,
      linkUrl: viewLink,
      folderId: DRIVE_FOLDER,
      uploadedBy: req.user._id
    });

    await doc.save();
    return res.status(201).json({ success: true, data: doc });
  } catch (error) {
    logger.error('Machine document upload error:', error && error.stack ? error.stack : error);
    return res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
};

export const listMachineDocuments = async (req, res) => {
  try {
    const { machineId, type, all } = req.query;
    const query = {};
    if (type) query.type = type;
    if (!all) query.isActive = true;
    // keep machineId compatibility (legacy field)
    if (machineId) query.machineId = machineId;

    const docs = await MachineDocument.find(query)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('categoryId', 'name')
      .populate('manufacturerId', 'name');
    return res.json({ success: true, data: docs });
  } catch (error) {
    logger.error('List machine documents error:', error);
    return res.status(500).json({ success: false, message: 'Failed to list documents' });
  }
};

export const getMachineDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await MachineDocument.findById(id)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('categoryId', 'name')
      .populate('manufacturerId', 'name');
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    return res.json({ success: true, data: doc });
  } catch (error) {
    logger.error('Get machine document error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch document' });
  }
};

export const deleteMachineDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await MachineDocument.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // permission: uploader or admin
    if (String(doc.uploadedBy) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // If it's a Drive file, attempt removal
    if (doc.type === 'file' && doc.driveFileId) {
      try {
        await drive.files.delete({ fileId: doc.driveFileId });
      } catch (e) {
        logger.warn('Failed to delete file from Drive:', e.message);
      }
    }

    await doc.remove();
    return res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    logger.error('Delete machine document error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};