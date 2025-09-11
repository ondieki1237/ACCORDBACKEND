import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['doctor', 'nurse', 'lab_technician', 'pharmacist', 'administrator', 'procurement', 'other'],
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
});

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'needs_replacement'],
    default: 'good'
  },
  yearInstalled: {
    type: Number,
    min: 2000,
    max: new Date().getFullYear()
  },
  lastServiceDate: Date,
  warrantyExpiry: Date,
  notes: String
});

const equipmentRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  estimatedBudget: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'KES'
  },
  expectedPurchasePeriod: {
    type: String,
    required: true,
    trim: true
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  decisionMakers: [String],
  budgetApproved: {
    type: Boolean,
    default: false
  },
  expectations: {
    type: String,
    trim: true
  },
  specifications: {
    type: String,
    trim: true
  },
  competitorInfo: {
    type: String,
    trim: true
  }
});

const visitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  visitId: {
    type: String,
    unique: true,
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  duration: Number, // in minutes
  client: {
    type: {
      type: String,
      required: true,
      enum: ['hospital', 'clinic', 'dispensary', 'pharmacy', 'laboratory', 'other'],
      lowercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      trim: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number] // [longitude, latitude]
    },
    address: {
      type: String,
      trim: true
    },
    county: {
      type: String,
      trim: true
    },
    subCounty: {
      type: String,
      trim: true
    },
    ward: {
      type: String,
      trim: true
    },
    phone: String,
    email: String,
    website: String,
    registrationNumber: String,
    category: {
      type: String,
      enum: ['public', 'private', 'faith_based', 'ngo'],
      default: 'public'
    },
    bedCapacity: Number,
    staffCount: Number
  },
  contacts: [contactSchema],
  existingEquipment: [equipmentSchema],
  requestedEquipment: [equipmentRequestSchema],
  visitPurpose: {
    type: String,
    required: true,
    enum: ['routine_visit', 'follow_up', 'demo', 'service', 'complaint', 'order', 'other']
  },
  visitOutcome: {
    type: String,
    enum: ['successful', 'partial', 'no_access', 'rescheduled', 'cancelled'],
    default: 'successful'
  },
  totalPotentialValue: {
    type: Number,
    default: 0
  },
  competitorActivity: {
    type: String,
    trim: true
  },
  marketInsights: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  nextVisitDate: Date,
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimeType: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  photos: [{
    filename: String,
    description: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  isFollowUpRequired: {
    type: Boolean,
    default: false
  },
  followUpActions: [{
    action: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending'
    }
  }],
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});


// Create indexes
visitSchema.index({ 'client.location': '2dsphere' });
visitSchema.index({ userId: 1, date: -1 });
visitSchema.index({ 'client.type': 1 });
visitSchema.index({ visitOutcome: 1 });

// Add pagination plugin
visitSchema.plugin(mongoosePaginate);

// Pre-save middleware to generate visitId
visitSchema.pre('save', async function(next) {
  if (!this.visitId) {
    const date = new Date(this.date);
    const dateString = date.toISOString().slice(0, 10).replace(/-/g, '');
    const userIdShort = this.userId.toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4);
    this.visitId = `V${dateString}${userIdShort}${random}`.toUpperCase();
  }
  next();
});

visitSchema.plugin(mongoosePaginate);

export default mongoose.model('Visit', visitSchema);