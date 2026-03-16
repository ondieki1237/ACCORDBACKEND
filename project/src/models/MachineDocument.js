import mongoose from 'mongoose';

const machineDocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['file', 'link'], required: true },
  linkUrl: { type: String },
  
  // Google Drive fields (maintained for backward compatibility)
  driveFileId: { type: String },
  fileName: { type: String },
  mimeType: { type: String },
  fileSize: { type: Number },
  folderId: { type: String },
  
  // TeraBox fields (new)
  teraboxFileId: { type: String },
  teraboxPath: { type: String },
  teraboxContentMd5: { type: String },
  teraboxUploadType: { type: String, enum: ['chunked', 'rapid'] },
  
  // Storage provider indicator
  storageProvider: { type: String, enum: ['google_drive', 'terabox'], default: 'google_drive' },
  
  // Document metadata
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentCategory' },
  manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

machineDocumentSchema.index({ type: 1, isActive: 1 });
machineDocumentSchema.index({ storageProvider: 1 });
machineDocumentSchema.index({ uploadedBy: 1, createdAt: -1 });

export default mongoose.model('MachineDocument', machineDocumentSchema);