import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    location: {
      type: String,
      trim: true
    },
    contactPerson: {
      name: {
        type: String,
        required: true,
        trim: true
      },
      phone: {
        type: String,
        required: true,
        trim: true
      },
      role: {
        type: String,
        default: 'Contact',
        trim: true
      }
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active'
    },
    type: {
      type: String,
      enum: ['hospital', 'clinic', 'pharmacy', 'diagnostic_center', 'other'],
      default: 'clinic'
    },
    metadata: {
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },
  {
    timestamps: true
  }
);

// Index for faster lookups
clientSchema.index({ name: 1 });
clientSchema.index({ 'contactPerson.phone': 1 });
clientSchema.index({ location: 1 });

const Client = mongoose.model('Client', clientSchema);

export default Client;
