import mongoose from 'mongoose';

// Email Activity Log - Audit trail for email operations
const emailActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['inbox_viewed', 'email_read', 'email_sent', 'email_deleted', 'email_replied', 'search_performed', 'settings_updated'],
    required: true
  },
  emailSubject: {
    type: String,
    default: null
  },
  emailFrom: {
    type: String,
    default: null
  },
  recipient: {
    type: String,
    default: null
  },
  details: {
    type: Object,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
    expires: 7776000 // Auto-delete after 90 days
  }
});

// Index for common queries
emailActivitySchema.index({ userId: 1, timestamp: -1 });
emailActivitySchema.index({ action: 1, timestamp: -1 });

export default mongoose.model('EmailActivity', emailActivitySchema);
