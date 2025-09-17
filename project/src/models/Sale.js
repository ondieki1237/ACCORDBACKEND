import mongoose from 'mongoose';

const SaleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  equipment: { type: String, required: true },
  price: { type: Number, required: true },
  target: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Sale', SaleSchema);