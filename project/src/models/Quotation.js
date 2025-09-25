import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  sku: String,
  name: String,
  quantity: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
  details: String
});

const quotationSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  contact: {
    name: String,
    email: String,
    phone: String
  },
  items: [itemSchema],
  notes: String,
  total: { type: Number, default: 0 },
  attachments: [{ url: String, filename: String, mimeType: String }],
  meta: mongoose.Schema.Types.Mixed,
  status: { type: String, enum: ['requested','quoted','approved','rejected'], default: 'requested' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Quotation', quotationSchema);