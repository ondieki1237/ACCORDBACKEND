import mongoose from 'mongoose';

const UserLinkSchema = new mongoose.Schema(
  {
    newUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
      description: 'The current/new user account'
    },
    oldUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      description: 'The old/previous user account ObjectId (may not exist as User doc if migrated)'
    },
    reason: {
      type: String,
      enum: ['account_migration', 'account_consolidation', 'duplicate_account', 'other'],
      default: 'account_migration',
      description: 'Reason for linking accounts'
    },
    linkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      description: 'Admin who created the link'
    },
    notes: {
      type: String,
      description: 'Additional notes about the link'
    },
    isActive: {
      type: Boolean,
      default: true,
      description: 'Whether this link is active'
    }
  },
  {
    timestamps: true,
    collection: 'user_links'
  }
);

// Index for finding links by old user
UserLinkSchema.index({ oldUserId: 1 });

// Index for finding links by new user
UserLinkSchema.index({ newUserId: 1 });

// Compound index for efficient lookups
UserLinkSchema.index({ newUserId: 1, isActive: 1 });
UserLinkSchema.index({ oldUserId: 1, isActive: 1 });

export default mongoose.model('UserLink', UserLinkSchema);
