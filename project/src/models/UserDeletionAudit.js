import mongoose from 'mongoose';

const userDeletionAuditSchema = new mongoose.Schema({
  deletedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deletedUserEmail: { type: String, required: true },
  deletedUserName: { type: String, required: true },
  deletedUserRole: { type: String, required: true },
  deletedAt: { type: Date, default: Date.now, index: true },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deletedByEmail: { type: String, required: true },
  deletedByRole: { type: String, required: true },
  reason: { type: String, required: true },
  method: { type: String, enum: ['api', 'script', 'migration', 'manual', 'unknown'], default: 'unknown' },
  endpoint: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  lastLogin: { type: Date },
  userDataPreserved: {
    type: Boolean,
    default: false,
    description: 'Whether user data (visits, reports, leads, etc.) was preserved'
  },
  recoveryAvailable: {
    type: Boolean,
    default: true,
    description: 'Whether user can be restored from backup'
  },
  backupLocation: { type: String },
  notes: { type: String }
}, { timestamps: true });

// Index for efficient audit queries
userDeletionAuditSchema.index({ deletedAt: -1 });
userDeletionAuditSchema.index({ deletedBy: 1, deletedAt: -1 });
userDeletionAuditSchema.index({ deletedUserRole: 1 });

export default mongoose.model('UserDeletionAudit', userDeletionAuditSchema);
