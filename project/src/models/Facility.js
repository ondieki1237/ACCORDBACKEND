import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, trim: true },
  county: { type: String, trim: true },
  level: { type: String, trim: true },
  location: { type: String, trim: true },
  address: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  latitude: { type: Number },
  longitude: { type: Number },
  meta: {
    source: { type: String, trim: true },
    importedAt: { type: Date }
  }
}, { timestamps: true });

facilitySchema.index({ name: 'text', location: 'text', county: 'text' });
facilitySchema.plugin(mongoosePaginate);

export default mongoose.model('Facility', facilitySchema);
