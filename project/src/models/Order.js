import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  consumableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consumable',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  specifications: String
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Primary Contact (Person placing the order)
  primaryContact: {
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      match: /^254\d{9}$/
    },
    jobTitle: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50
    }
  },
  
  // Facility Information
  facility: {
    name: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 150
    },
    type: {
      type: String,
      required: true,
      enum: [
        'Hospital',
        'Clinic',
        'Medical Center',
        'Laboratory',
        'Pharmacy',
        'Dispensary',
        'Health Center',
        'Private Practice',
        'Diagnostic Center',
        'Nursing Home'
      ]
    },
    address: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 200
    },
    city: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50
    },
    county: {
      type: String,
      required: true
    },
    postalCode: {
      type: String
    },
    GPS_coordinates: {
      latitude: {
        type: Number,
        min: -12,
        max: 5
      },
      longitude: {
        type: Number,
        min: 28,
        max: 42
      }
    }
  },
  
  // Alternative Contact
  alternativeContact: {
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      match: /^254\d{9}$/
    },
    relationship: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50
    }
  },
  
  // Delivery Information (removed as per request)
  
  // Order Items
  items: [orderItemSchema],
  
  // Payment Details
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'bank_transfer', 'cash', 'cheque', 'other'],
    default: 'mpesa',
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  // M-Pesa Details
  mpesaDetails: {
    checkoutRequestID: String,
    merchantRequestID: String,
    mpesaReceiptNumber: String,
    transactionDate: Date,
    phoneNumber: String,
    initiatedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  // Optional Fields removed as per request
  
  // Metadata
  currency: {
    type: String,
    default: 'KES'
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.orderNumber = `ORD-${date.getTime()}${random}`;
  }
  next();
});

export default mongoose.model('Order', orderSchema);