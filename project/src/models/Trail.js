import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const trailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  endTime: {
    type: Date
  },
  path: {
    type: {
      type: String,
      enum: ['LineString'],
      default: 'LineString'
    },
    coordinates: {
      type: [[Number]], // Array of [longitude, latitude] pairs
      required: true,
      validate: {
        validator: function(coords) {
          return coords.length >= 2; // At least 2 points for a line
        },
        message: 'Trail must have at least 2 coordinate points'
      }
    }
  },
  totalDistance: {
    type: Number, // in kilometers
    default: 0
  },
  totalDuration: {
    type: Number, // in minutes
    default: 0
  },
  averageSpeed: {
    type: Number, // km/h
    default: 0
  },
  stops: [{
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number] // [longitude, latitude]
    },
    startTime: Date,
    endTime: Date,
    duration: Number, // minutes
    purpose: {
      type: String,
      enum: ['client_visit', 'lunch_break', 'fuel_stop', 'other'],
      default: 'other'
    },
    notes: String
  }],
  syncedAt: {
    type: Date,
    default: Date.now
  },
  deviceInfo: {
    platform: String,
    version: String,
    model: String
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
trailSchema.index({ path: '2dsphere' });
trailSchema.index({ userId: 1, date: -1 });

trailSchema.plugin(mongoosePaginate);

export default mongoose.model('Trail', trailSchema);