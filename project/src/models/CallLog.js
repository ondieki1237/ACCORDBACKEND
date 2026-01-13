import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const callLogSchema = new mongoose.Schema({
  // Client Information
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  clientPhone: {
    type: String,
    required: [true, 'Client phone number is required'],
    trim: true
  },
  
  // Call Details
  callDirection: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: [true, 'Call direction is required']
  },
  callDate: {
    type: Date,
    required: [true, 'Call date is required'],
    index: true
  },
  callTime: {
    type: String,
    required: [true, 'Call time is required'],
    trim: true
  },
  callDuration: {
    type: Number, // in minutes
    required: [true, 'Call duration is required'],
    min: 0
  },
  
  // Call Outcome
  callOutcome: {
    type: String,
    enum: ['no_answer', 'interested', 'follow_up_needed', 'not_interested', 'sale_closed'],
    required: [true, 'Call outcome is required'],
    index: true
  },
  
  // Follow-up Information
  nextAction: {
    type: String,
    trim: true,
    default: null
  },
  followUpDate: {
    type: Date,
    default: null,
    index: true
  },
  
  // Call Summary
  callNotes: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Metadata for organization
  year: {
    type: Number,
    index: true
  },
  month: {
    type: Number,
    index: true
  },
  week: {
    type: Number,
    index: true
  },
  
  // User who created the log
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Tags for additional categorization
  tags: [{
    type: String,
    trim: true
  }],
  
  // Related records (optional)
  relatedLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    default: null
  },
  relatedVisit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    default: null
  },
  
  // Status tracking
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
callLogSchema.index({ year: 1, month: 1, week: 1 });
callLogSchema.index({ callDate: -1 });
callLogSchema.index({ createdBy: 1, callDate: -1 });
callLogSchema.index({ clientPhone: 1, callDate: -1 });
callLogSchema.index({ callOutcome: 1, followUpDate: 1 });

// Text index for searching
callLogSchema.index({ clientName: 'text', callNotes: 'text' });

// Plugin for pagination
callLogSchema.plugin(mongoosePaginate);

// Helper method to get week number
callLogSchema.statics.getWeekNumber = function(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// Pre-save hook to automatically set year, month, week
callLogSchema.pre('save', function(next) {
  if (this.isModified('callDate') || this.isNew) {
    const date = new Date(this.callDate);
    this.year = date.getFullYear();
    this.month = date.getMonth() + 1; // 1-12
    this.week = this.constructor.getWeekNumber(date);
  }
  next();
});

// Virtual for formatted call outcome
callLogSchema.virtual('callOutcomeFormatted').get(function() {
  const outcomes = {
    'no_answer': 'No Answer',
    'interested': 'Interested',
    'follow_up_needed': 'Follow-up Needed',
    'not_interested': 'Not Interested',
    'sale_closed': 'Sale Closed'
  };
  return outcomes[this.callOutcome] || this.callOutcome;
});

// Virtual for formatted call direction
callLogSchema.virtual('callDirectionFormatted').get(function() {
  return this.callDirection === 'inbound' ? 'Inbound' : 'Outbound';
});

// Ensure virtuals are included in JSON
callLogSchema.set('toJSON', { virtuals: true });
callLogSchema.set('toObject', { virtuals: true });

const CallLog = mongoose.model('CallLog', callLogSchema);

export default CallLog;
