import mongoose from 'mongoose';

const locationPointSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: { type: Number },
  timestamp: { type: Date, required: true },
  speed: { type: Number },
  heading: { type: Number },
  altitude: { type: Number }
}, { _id: false });

const deviceInfoSchema = new mongoose.Schema({
  userAgent: { type: String },
  platform: { type: String },
  timestamp: { type: Date }
}, { _id: false });

const locationTrackSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  locations: { 
    type: [locationPointSchema], 
    default: [] 
  },
  deviceInfo: { 
    type: deviceInfoSchema 
  },
  syncedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Index for efficient queries by user and date range
locationTrackSchema.index({ userId: 1, syncedAt: -1 });
locationTrackSchema.index({ 'locations.timestamp': 1 });

export default mongoose.model('LocationTrack', locationTrackSchema);
