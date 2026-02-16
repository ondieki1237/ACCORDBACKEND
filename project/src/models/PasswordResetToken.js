import mongoose from 'mongoose';

const passwordResetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  codeHash: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  usedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// TTL: remove expired tokens after 24h (optional cleanup)
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export default mongoose.model('PasswordResetToken', passwordResetTokenSchema);
