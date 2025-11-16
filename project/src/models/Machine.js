import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const contactSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  role: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true }
});

const machineSchema = new mongoose.Schema({
  serialNumber: { type: String, trim: true, index: true },
  model: { type: String, trim: true, required: true },
  manufacturer: { type: String, trim: true },
  version: { type: String, trim: true },
  facility: {
    name: { type: String, trim: true },
    level: { type: String, trim: true },
    location: { type: String, trim: true }
  },
  contactPerson: contactSchema,
  installedDate: { type: Date },
  purchaseDate: { type: Date },
  warrantyExpiry: { type: Date },
  lastServicedAt: { type: Date },
  nextServiceDue: { type: Date },
  lastServiceEngineer: {
    engineerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, trim: true },
    notes: { type: String, trim: true }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'decommissioned', 'maintenance'],
    default: 'active'
  },
  metadata: {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

machineSchema.index({ 'facility.name': 'text', model: 'text', manufacturer: 'text', serialNumber: 'text' });
machineSchema.plugin(mongoosePaginate);

export default mongoose.model('Machine', machineSchema);
