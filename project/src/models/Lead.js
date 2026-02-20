import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const leadSchema = new mongoose.Schema({
  facilityName: { type: String, required: true, trim: true },
  facilityType: { type: String, trim: true },
  location: { type: String, required: true, trim: true },


  contactPerson: {
    name: { type: String, required: true, trim: true },
    role: { type: String, trim: true },
    phone: { type: String, trim: true }
  },

  hospitalLevel: { type: String, trim: true },

  equipmentName: { type: String, required: true, trim: true },

  budget: { type: String, trim: true }, // e.g. 'KSH 10000'

  expectedPurchaseDate: { type: Date },

  competitorAnalysis: { type: String, trim: true }, // (Optional)

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
  // History of status changes so we can track timeline of the conversation
  statusHistory: [{
    from: { type: String, trim: true },
    to: { type: String, trim: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, trim: true }
  }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
}, {
  timestamps: true
});

// Indexes recommended by docs
leadSchema.index({ createdBy: 1, leadStatus: 1, createdAt: -1 });
leadSchema.index({ facilityName: 'text', location: 'text', 'contactPerson.name': 'text', 'equipmentOfInterest.name': 'text' });

leadSchema.plugin(mongoosePaginate);

export default mongoose.model('Lead', leadSchema);
