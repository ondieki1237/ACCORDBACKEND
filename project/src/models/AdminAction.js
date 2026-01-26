import mongoose from 'mongoose';

const adminActionSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g., 'password_reset'
  method: { type: String }, // 'link' or 'temp'
  details: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('AdminAction', adminActionSchema);
