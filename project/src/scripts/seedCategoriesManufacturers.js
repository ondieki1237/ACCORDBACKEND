import connectDB from '../config/database.js';
import DocumentCategory from '../models/DocumentCategory.js';
import Manufacturer from '../models/Manufacturer.js';

const categories = [
  { name: 'Manuals', description: 'User and service manuals' },
  { name: 'Certificates', description: 'Compliance and calibration certificates' },
  { name: 'Photos', description: 'Machine and installation photos' }
];

const manufacturers = [
  { name: 'GE Healthcare', description: 'General Electric medical equipment' },
  { name: 'Philips', description: 'Philips medical devices' },
  { name: 'Siemens Healthineers', description: 'Siemens medical equipment' }
];

const seed = async () => {
  await connectDB();
  for (const cat of categories) {
    const exists = await DocumentCategory.findOne({ name: cat.name });
    if (!exists) await DocumentCategory.create(cat);
  }
  for (const mfr of manufacturers) {
    const exists = await Manufacturer.findOne({ name: mfr.name });
    if (!exists) await Manufacturer.create(mfr);
  }
  console.log('Seeded categories and manufacturers.');
  process.exit(0);
};

seed();
