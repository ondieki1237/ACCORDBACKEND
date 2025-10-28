import mongoose from 'mongoose';

const daySchema = new mongoose.Schema({
  day: { type: String },
  date: { type: Date },
  place: { type: String },
  means: { type: String },
  allowance: { type: String },
  prospects: { type: String }
}, { _id: false });

const plannerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  weekCreatedAt: { type: Date, required: true, index: true },
  days: { type: [daySchema], default: [] },
  notes: { type: String }
}, {
  timestamps: true
});

export default mongoose.model('Planner', plannerSchema);
