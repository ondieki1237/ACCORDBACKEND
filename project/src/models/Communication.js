import mongoose from 'mongoose';

const communicationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['group', 'personal'],
    required: true
  },
  // personal messages will have explicit recipients
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: String,
  content: {
    type: String,
    required: true
  },
  attachments: [{
    url: String,
    filename: String,
    mimeType: String
  }],
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  meta: { type: mongoose.Schema.Types.Mixed } // free-form for UI tags, priority, etc.
}, { timestamps: true });

export default mongoose.model('Communication', communicationSchema);