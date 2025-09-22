import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // New fields for structured reports
  content: {
    type: Object, // { metadata: {...}, sections: [...] }
    required: true
  },
  isDraft: {
    type: Boolean,
    default: false
  },
  lastEdited: {
    type: Date,
    default: Date.now
  },
  // Legacy fields (for backward compatibility with old PDF uploads)
  fileName: String,
  fileUrl: String,
  filePublicId: String,
  weekStart: {
    type: Date,
    required: true
  },
  weekEnd: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: String,
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Report', reportSchema);