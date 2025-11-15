import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const leadSchema = new mongoose.Schema({
  facilityName: { type: String, required: true, trim: true },
  facilityType: { type: String, trim: true },
  location: { type: String, required: true, trim: true },

  contactPerson: {
    name: { type: String, required: true, trim: true },
    role: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true }
  },

  facilityDetails: {
    hospitalLevel: { type: String, trim: true },
    currentEquipment: { type: String, trim: true }
  },

  equipmentOfInterest: {
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    quantity: { type: Number, default: 1, min: 1 }
  },

  budget: {
    amount: { type: String, trim: true },
    currency: { type: String, default: 'KES', trim: true }
  },

  timeline: {
    expectedPurchaseDate: { type: Date },
    urgency: { type: String, trim: true }
  },

  competitorAnalysis: { type: String, trim: true },

  additionalInfo: {
    painPoints: { type: String, trim: true },
    notes: { type: String, trim: true }
  },

  leadSource: {
    type: String,
    enum: ['field-visit', 'phone-call', 'email', 'referral', 'event', 'website', 'other'],
    default: 'field-visit'
  },

  leadStatus: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal-sent', 'negotiation', 'won', 'lost'],
    default: 'new'
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
}, {
  timestamps: true
});

// Indexes recommended by docs
leadSchema.index({ createdBy: 1, leadStatus: 1, createdAt: -1 });
leadSchema.index({ facilityName: 'text', location: 'text', 'contactPerson.name': 'text', 'equipmentOfInterest.name': 'text' });

leadSchema.plugin(mongoosePaginate);

export default mongoose.model('Lead', leadSchema);
