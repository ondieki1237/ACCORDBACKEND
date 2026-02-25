import mongoose from 'mongoose';

const plannerApprovalSchema = new mongoose.Schema({
  plannerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Planner', required: true, index: true },
  status: { type: String, enum: ['pending', 'approved', 'disapproved'], default: 'pending' },
  supervisor: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    comment: String,
    date: Date
  },
  accountant: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    comment: String,
    date: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('PlannerApproval', plannerApprovalSchema);
