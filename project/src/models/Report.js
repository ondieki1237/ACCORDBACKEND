import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },          // Cloudinary URL
  filePublicId: { type: String },                     // Cloudinary public_id
  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNotes: { type: String }
});

export default mongoose.model('Report', ReportSchema, 'reports');