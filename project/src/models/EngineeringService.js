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
  },
  facility: {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
  },
  serviceType: {
    type: String,
    enum: ['installation', 'maintenance', 'repair', 'inspection', 'other'],
    default: 'maintenance',
  },
  machineDetails: { type: String, trim: true },
  conditionBefore: { type: String, trim: true },
  conditionAfter: { type: String, trim: true },
  otherPersonnel: { type: String, trim: true },
  nextServiceDate: Date,
  engineerInCharge: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  status: {
    type: String,
    enum: ['recorded', 'scheduled', 'completed', 'cancelled'],
    default: 'recorded',
  },
  syncedAt: Date,
  metadata: {
    ip: String,
    userAgent: String,
  }
}, {
  timestamps: true
});

engineeringServiceSchema.plugin(mongoosePaginate);

export default mongoose.model('EngineeringService', engineeringServiceSchema);
