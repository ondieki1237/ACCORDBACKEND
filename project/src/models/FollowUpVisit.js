import mongoose from 'mongoose';

const followUpVisitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', required: true, index: true },
  followUpDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Follow-up date cannot be in the future'
    }
  },
  reason: { type: String, required: true, trim: true, minlength: [10, 'Reason must be at least 10 characters'] },
  outcome: { type: String, required: true, trim: true, minlength: [10, 'Outcome must be at least 10 characters'] },
  needAnotherFollowUp: { type: Boolean, required: true },
  whyAnotherFollowUp: {
    type: String,
    trim: true,
    minlength: [10, 'Explanation must be at least 10 characters'],
    required: function() { return this.needAnotherFollowUp === true; }
  },
  whyNoMoreFollowUp: {
    type: String,
    trim: true,
    minlength: [10, 'Explanation must be at least 10 characters'],
    required: function() { return this.needAnotherFollowUp === false; }
  }
}, {
  timestamps: true
});

followUpVisitSchema.index({ userId: 1, followUpDate: -1 });
followUpVisitSchema.index({ needAnotherFollowUp: 1 });
followUpVisitSchema.index({ createdAt: -1 });

export default mongoose.model('FollowUpVisit', followUpVisitSchema);
