import mongoose from 'mongoose';

const ResponseSchema = new mongoose.Schema({
  isAvailable: Boolean,
  price: Number,
  availableDate: Date,
  notes: String,
  respondedAt: { type: Date, default: Date.now },
  responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const RequestSchema = new mongoose.Schema({
  hospital: { type: String, required: true },
  location: { type: String, required: true },
  equipmentRequired: { type: String, required: true },
  urgency: { type: String, enum: ['low', 'medium', 'high'], required: true },
  contactName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  response: ResponseSchema,
  status: { type: String, enum: ['pending', 'responded'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Request', RequestSchema, 'requests');