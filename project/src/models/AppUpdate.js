import mongoose from 'mongoose';

const AppUpdateSchema = new mongoose.Schema({
  version: { type: String, required: true },
  platform: { type: String, enum: ['android','ios','web'], default: 'android' },
  targetRoles: [{ type: String, enum: ['sales','engineer','all'], required: true }],
  releaseNotes: { type: String },
  
  // Download mechanism (external)
  downloadUrl: { type: String },
  
  // Internal update mechanism
  updateMethod: { 
    type: String, 
    enum: ['internal', 'external'], 
    default: 'internal' // Default to internal updates (no external download)
  },
  bundledCode: { type: String }, // Optional: JavaScript patches/updates
  updateInstructions: { type: String, default: 'Please restart the app to apply updates' },
  
  // Update control
  forced: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  requiresRestart: { type: Boolean, default: true },
  
  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changeLog: { type: String }, // Detailed change log
  compatibleVersions: [String] // Versions this update is compatible with
}, { timestamps: true });

export default mongoose.model('AppUpdate', AppUpdateSchema);
