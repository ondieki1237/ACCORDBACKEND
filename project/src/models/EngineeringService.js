import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const engineeringServiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  facility: {
    name: { type: String, required: true, trim: true },
    location: { type: String, trim: true }
  },
  serviceType: {
    type: String,
    enum: ['installation', 'maintenance', 'service', 'repair', 'inspection', 'other'],
    required: true,
    default: 'maintenance',
  },
  machineDetails: { type: String, trim: true },
  // Link to an existing machine (if this service is for an installed machine)
  machineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Machine' },
  conditionBefore: { type: String, trim: true },
  conditionAfter: { type: String, trim: true },
  otherPersonnel: [{ type: String }],
  nextServiceDate: Date,
  engineerInCharge: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: { type: String, trim: true },
    phone: { type: String, trim: true }
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  scheduledDate: Date,
  notes: { type: String, trim: true },
  syncedAt: Date,
  metadata: {
    ip: String,
    userAgent: String,
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: Date
  }
}, {
  timestamps: true
});

engineeringServiceSchema.plugin(mongoosePaginate);

export default mongoose.model('EngineeringService', engineeringServiceSchema);
