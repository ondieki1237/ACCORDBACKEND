import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true }
});

const machineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  model: { type: String, trim: true },
  serialNumber: { type: String, trim: true }
});

const engineeringRequestSchema = new mongoose.Schema({
  requestType: { type: String, required: true, enum: ['service', 'repair', 'site_survey', 'training'] },
  facility: {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true }
  },
  contact: contactSchema,
  machine: machineSchema,
  expectedDate: { type: Date },
  notes: { type: String, trim: true },
  status: { type: String, enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
  assignedEngineer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

engineeringRequestSchema.index({ requestType: 1, status: 1, 'facility.name': 'text', 'contact.name': 'text' });

export default mongoose.model('EngineeringRequest', engineeringRequestSchema);
