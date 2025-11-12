import mongoose from 'mongoose';

const FollowUpSchema = new mongoose.Schema({
  visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', required: true },
  date: { type: Date, required: true },
  contactPerson: {
    name: { type: String, required: true, trim: true },
    role: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true }
  },
  outcome: { 
    type: String, 
    enum: ['deal_sealed', 'in_progress', 'deal_failed'], 
    required: true 
  },
  
  // If deal sealed
  winningPoint: { 
    type: String, 
    trim: true,
    // Required when outcome is 'deal_sealed'
  },
  
  // If in progress
  progressExplanation: { 
    type: String, 
    trim: true,
    // Required when outcome is 'in_progress'
  },
  improvements: { 
    type: String, 
    trim: true 
  },
  
  // If deal failed
  failureReasons: { 
    type: String, 
    trim: true,
    // Required when outcome is 'deal_failed'
  },
  downsides: { 
    type: String, 
    trim: true 
  },
  
  // General notes
  notes: { type: String, trim: true },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

// Add index for efficient queries
FollowUpSchema.index({ visitId: 1, createdAt: -1 });
FollowUpSchema.index({ createdBy: 1, createdAt: -1 });
FollowUpSchema.index({ outcome: 1 });

export default mongoose.model('FollowUp', FollowUpSchema, 'followups');