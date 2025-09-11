import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['diagnostic', 'laboratory', 'imaging', 'surgical', 'monitoring', 'consumables', 'reagents', 'other']
  },
  subcategory: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  specifications: [{
    name: String,
    value: String,
    unit: String
  }],
  price: {
    listPrice: {
      type: Number,
      required: true,
      min: 0
    },
    dealerPrice: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'KES'
    }
  },
  inventory: {
    sku: {
      type: String,
      unique: true,
      required: true
    },
    stockLevel: {
      type: Number,
      default: 0,
      min: 0
    },
    minimumStock: {
      type: Number,
      default: 0,
      min: 0
    },
    reorderPoint: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  supplier: {
    name: String,
    contact: String,
    email: String,
    leadTime: Number // in days
  },
  warranty: {
    duration: Number, // in months
    terms: String
  },
  images: [{
    filename: String,
    path: String,
    description: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  documents: [{
    name: String,
    filename: String,
    path: String,
    type: {
      type: String,
      enum: ['brochure', 'manual', 'certificate', 'datasheet', 'other']
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  targetMarkets: [{
    type: String,
    enum: ['hospital', 'clinic', 'dispensary', 'pharmacy', 'laboratory']
  }]
}, {
  timestamps: true
});

// Create text index for search
productSchema.index({
  name: 'text',
  model: 'text',
  brand: 'text',
  description: 'text',
  tags: 'text'
});

export default mongoose.model('Product', productSchema);