import mongoose from 'mongoose';

const machineDocumentSchema = new mongoose.Schema({
  machineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Machine', required: false },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  mimeType: { type: String },
  size: { type: Number },
  driveFileId: { type: String, required: true },
  driveViewLink: { type: String },
  driveDownloadLink: { type: String },
  folderId: { type: String },
  notes: { type: String },
}, { timestamps: true });

export default mongoose.model('MachineDocument', machineDocumentSchema);