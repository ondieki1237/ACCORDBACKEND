import mongoose from 'mongoose';

const machineDocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['file', 'link'], required: true },
  linkUrl: { type: String },
  driveFileId: { type: String },
  fileName: { type: String },
  mimeType: { type: String },
  fileSize: { type: Number },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentCategory' },
  manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  folderId: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

machineDocumentSchema.index({ type: 1, isActive: 1 });

export default mongoose.model('MachineDocument', machineDocumentSchema);