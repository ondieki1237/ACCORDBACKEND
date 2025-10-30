import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Date fields
  weekStart: {
    type: Date,
    required: true,
    index: true
  },
  weekEnd: {
    type: Date,
    required: true
  },
  weekRange: {
    type: String
    // Example: "06/10/2025 - 12/10/2025"
  },
  
  // ✨ NEW: Sections-based content (root level as per report.md)
  sections: [{
    id: {
      type: String,
      required: true
      // Common values: 'summary', 'visits', 'quotations', 'leads', 'challenges', 'nextWeek'
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    }
  }],
  
  // LEGACY: Old nested content structure (for backward compatibility)
  content: {
    metadata: {
      author: String,
      submittedAt: Date,
      weekRange: String
    },
    sections: [{
      id: String,
      title: String,
      content: String
    }]
  },
  
  isDraft: {
    type: Boolean,
    default: false,
    index: true
  },
  lastEdited: {
    type: Date,
    default: Date.now
  },
  
  // PDF storage
  fileName: String,
  fileUrl: String,
  filePublicId: String,
  pdfUrl: String,
  filePath: String,
  
  // Legacy fields for backward compatibility
  report: String,
  weeklySummary: String,
  visits: [{
    hospital: String,
    clientName: String,
    purpose: String,
    outcome: String,
    notes: String
  }],
  quotations: [{
    clientName: String,
    equipment: String,
    amount: Number,
    status: String
  }],
  newLeads: [{
    name: String,
    interest: String,
    notes: String
  }],
  challenges: String,
  nextWeekPlan: String,
  
  // Status and admin review
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  adminNotes: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
reportSchema.index({ userId: 1, weekStart: -1 });
reportSchema.index({ status: 1, createdAt: -1 });

// Add pagination plugin
reportSchema.plugin(mongoosePaginate);

export default mongoose.model('Report', reportSchema);