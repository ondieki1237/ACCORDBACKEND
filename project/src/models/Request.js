import mongoose from 'mongoose';

const RequestSchema = new mongoose.Schema({
  hospital: { type: String, required: true },
  location: { type: String, required: true },
  equipmentRequired: { type: String, required: true },
  urgency: { type: String, enum: ['low', 'medium', 'high'], required: true },
  contactName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // <-- Add this
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Request', RequestSchema, 'requests');