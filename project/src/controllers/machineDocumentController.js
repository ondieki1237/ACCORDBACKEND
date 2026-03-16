import drive, { ensureMachinesFolder } from '../config/googleDrive.js';
import { getTeraBoxApp, isTeraBoxAvailable } from '../config/terabox.js';
import { uploadToTeraBox, deleteFromTeraBox } from '../utils/teraboxUpload.js';
import MachineDocument from '../models/MachineDocument.js';
import DocumentCategory from '../models/DocumentCategory.js';
import Manufacturer from '../models/Manufacturer.js';
import logger from '../utils/logger.js';
import { Readable } from 'stream';

let DRIVE_FOLDER = process.env.GOOGLE_DRIVE_FOLDER_ID || null;

// Create either a Drive-backed file document (multipart upload) or a link document (JSON body)
export const uploadMachineDocument = async (req, res) => {
  try {
    // If body.type === 'link' then create a link record without touching Drive or TeraBox
    if (req.body && req.body.type === 'link') {
      const { title, linkUrl, categoryId, manufacturerId, machineId } = req.body;
      
      if (!title || !linkUrl) {
        return res.status(400).json({ 
          success: false, 
          message: 'title and linkUrl are required for link documents' 
        });
      }

      try {
        // optional: validate category/manufacturer existence
        const category = categoryId ? await DocumentCategory.findById(categoryId) : null;
        const manufacturer = manufacturerId ? await Manufacturer.findById(manufacturerId) : null;

        const doc = new MachineDocument({
          title,
          type: 'link',
          linkUrl,
          ...(machineId && { machineId }),
          ...(category && { categoryId: category._id }),
          ...(manufacturer && { manufacturerId: manufacturer._id }),
          uploadedBy: req.user._id,
          storageProvider: 'none'
        });

        await doc.save();
        
        logger.info('Link document created successfully', {
          docId: doc._id,
          title,
          userId: req.user._id
        });

        return res.status(201).json({ 
          success: true, 
          message: 'Link document created',
          data: doc 
        });
      } catch (linkError) {
        logger.error('Link document creation error:', linkError);
        return res.status(400).json({ 
          success: false, 
          message: 'Failed to create link document',
          error: linkError.message 
        });
      }
    }

    // Otherwise expect a file upload
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const fileName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const fileBuffer = req.file.buffer;
    const fileSize = req.file.size;

    // Determine storage provider: TeraBox if available, otherwise Google Drive
    const useTeraBox = isTeraBoxAvailable();
    let uploadResult;
    let storageProvider;

    if (useTeraBox) {
      // Upload to TeraBox
      try {
        logger.info(`Uploading to TeraBox: ${fileName}`);
        uploadResult = await uploadToTeraBox(fileBuffer, fileName, mimeType);
        storageProvider = 'terabox';
        logger.info(`Successfully uploaded to TeraBox: ${fileName}`);
      } catch (teraBoxError) {
        logger.warn(`TeraBox upload failed, falling back to Google Drive: ${teraBoxError.message}`);
        // Fall back to Google Drive
        uploadResult = await uploadToGoogleDrive(fileName, mimeType, fileBuffer, DRIVE_FOLDER);
        storageProvider = 'google_drive';
      }
    } else {
      // Upload to Google Drive
      logger.info(`Uploading to Google Drive: ${fileName}`);
      uploadResult = await uploadToGoogleDrive(fileName, mimeType, fileBuffer, DRIVE_FOLDER);
      storageProvider = 'google_drive';
    }

    // Create document record with appropriate provider fields
    const doc = new MachineDocument({
      title: req.body.title || fileName,
      type: 'file',
      fileName,
      mimeType,
      fileSize,
      storageProvider,
      uploadedBy: req.user._id,
      
      // TeraBox fields
      ...(storageProvider === 'terabox' && {
        teraboxFileId: uploadResult.fileId,
        teraboxPath: uploadResult.uploadPath,
        teraboxContentMd5: uploadResult.contentMd5,
        teraboxUploadType: uploadResult.uploadType,
        linkUrl: uploadResult.uploadPath
      }),
      
      // Google Drive fields
      ...(storageProvider === 'google_drive' && {
        driveFileId: uploadResult.fileId,
        linkUrl: uploadResult.viewLink,
        folderId: uploadResult.folderId
      })
    });

    await doc.save();
    
    logger.info('Document uploaded successfully', {
      docId: doc._id,
      fileName,
      provider: storageProvider,
      userId: req.user._id
    });

    return res.status(201).json({ 
      success: true, 
      message: 'Document uploaded successfully',
      data: doc, 
      storageProvider 
    });
  } catch (error) {
    logger.error('Machine document upload error:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      userId: req.user?._id
    });
    return res.status(500).json({ 
      success: false, 
      message: 'Upload failed', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Helper function to upload file to Google Drive
 * @private
 */
const uploadToGoogleDrive = async (fileName, mimeType, fileBuffer, driveFolderId) => {
  try {
    if (!driveFolderId) {
      driveFolderId = await ensureMachinesFolder();
    }

    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);

    const fileMetadata = {
      name: fileName,
      parents: driveFolderId ? [driveFolderId] : undefined
    };

    const media = { mimeType, body: bufferStream };

    const response = await drive.files.create({ resource: fileMetadata, media, fields: 'id, webViewLink' });
    const fileId = response.data.id;
    const viewLink = response.data.webViewLink;

    return {
      fileId,
      viewLink,
      folderId: driveFolderId
    };
  } catch (error) {
    logger.error('Google Drive upload error:', error.message);
    throw new Error(`Google Drive upload failed: ${error.message}`);
  }
};

export const listMachineDocuments = async (req, res) => {
  try {
    const { machineId, type, all, storageProvider } = req.query;
    const query = {};
    if (type) query.type = type;
    if (!all) query.isActive = true;
    if (storageProvider) query.storageProvider = storageProvider;
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

    // Delete from appropriate storage provider
    if (doc.type === 'file') {
      if (doc.storageProvider === 'terabox' && doc.teraboxPath) {
        try {
          await deleteFromTeraBox(doc.teraboxPath);
          logger.info(`Deleted file from TeraBox: ${doc.teraboxPath}`);
        } catch (e) {
          logger.warn('Failed to delete file from TeraBox:', e.message);
        }
      } else if (doc.storageProvider === 'google_drive' && doc.driveFileId) {
        try {
          await drive.files.delete({ fileId: doc.driveFileId });
          logger.info(`Deleted file from Google Drive: ${doc.driveFileId}`);
        } catch (e) {
          logger.warn('Failed to delete file from Google Drive:', e.message);
        }
      }
    }

    await MachineDocument.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    logger.error('Delete machine document error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};