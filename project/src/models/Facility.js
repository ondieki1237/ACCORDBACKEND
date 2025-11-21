
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const FacilitySchema = new mongoose.Schema({
  type: { type: String, default: 'Feature' },
  properties: { type: Object, required: true },
  geometry: { type: Object, required: true }
}, { timestamps: true });

// Text index for typeahead
FacilitySchema.index({ 'properties.name': 'text', 'properties.amenity': 'text', 'properties.healthcare': 'text' });
FacilitySchema.plugin(mongoosePaginate);

export default mongoose.model('Facility', FacilitySchema, 'facilities');
