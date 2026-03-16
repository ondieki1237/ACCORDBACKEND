import mongoose from 'mongoose';

const machineUpdateAuditSchema = new mongoose.Schema({
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true,
    index: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  previousValues: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  changedFields: {
    type: [String],
    default: []
  },
  ipAddress: { type: String, trim: true },
  userAgent: { type: String, trim: true },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

machineUpdateAuditSchema.index({ machineId: 1, timestamp: -1 });
machineUpdateAuditSchema.index({ updatedBy: 1, timestamp: -1 });

export default mongoose.model('MachineUpdateAudit', machineUpdateAuditSchema);
