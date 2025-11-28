import mongoose from 'mongoose';

const OtherChargeSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 }
}, { _id: false });

const EngineeringPricingSchema = new mongoose.Schema({
  engineerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activityType: { type: String, enum: ['installation', 'maintenance', 'service', 'previsit'], required: true },
  location: { type: String },
  facility: { type: String },
  machine: { type: String },
  fare: { type: Number, required: true, min: 0 },
  otherCharges: { type: [OtherChargeSchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Indexes to help common queries
EngineeringPricingSchema.index({ engineerId: 1, activityType: 1, createdAt: -1 });

export default mongoose.model('EngineeringPricing', EngineeringPricingSchema);
