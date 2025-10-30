import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const ResponseSchema = new mongoose.Schema({
  message: String,
  documentUrl: String,
  estimatedCost: Number,
  isAvailable: Boolean,
  price: Number,
  availableDate: Date,
  notes: String,
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  respondedAt: { type: Date, default: Date.now }
});

const RequestSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  hospital: { 
    type: String, 
    required: true 
  },
  location: { 
    type: String, 
    required: true 
  },
  equipmentRequired: { 
    type: String, 
    required: true 
  },
  urgency: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    required: true,
    index: true
  },
  contactName: { 
    type: String, 
    required: true 
  },
  contactEmail: { 
    type: String 
  },
  contactPhone: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'responded', 'completed', 'rejected'], 
    default: 'pending',
    index: true
  },
  responded: {
    type: Boolean,
    default: false,
    index: true
  },
  response: ResponseSchema
}, {
  timestamps: true
});

// Indexes for efficient queries
RequestSchema.index({ userId: 1, createdAt: -1 });
RequestSchema.index({ urgency: 1, status: 1 });
RequestSchema.index({ hospital: 'text', equipmentRequired: 'text' });

// Add pagination plugin
RequestSchema.plugin(mongoosePaginate);

export default mongoose.model('Request', RequestSchema, 'requests');