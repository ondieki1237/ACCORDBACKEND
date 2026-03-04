import mongoose from 'mongoose';

// Email Session - Store encrypted email credentials
const emailSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  // Encrypted password - NEVER store plain text
  encryptedPassword: {
    type: String,
    required: true
  },
  imapServer: {
    type: String,
    default: () => process.env.EMAIL_IMAP_SERVER || 'mail.astermedsupplies.co.ke'
  },
  imapPort: {
    type: Number,
    default: () => parseInt(process.env.EMAIL_IMAP_PORT) || 993
  },
  // Cache of folders
  folders: [{
    name: String,
    displayName: String,
    unread: Number,
    total: Number
  }],
  lastSync: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  syncErrors: [{
    timestamp: Date,
    error: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

emailSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('EmailSession', emailSessionSchema);
