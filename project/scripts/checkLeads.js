import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lead from '../src/models/Lead.js';

dotenv.config({ path: './.env' });

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.argv[2];
    if (!mongoUri) {
      console.error('MONGODB_URI not provided. Set in .env or pass as arg.');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const total = await Lead.countDocuments({});
    console.log('Total leads in DB:', total);

    const sample = await Lead.find({}).limit(5).sort({ createdAt: -1 }).lean();
    console.log('Sample leads (max 5):');
    sample.forEach((s, i) => {
      console.log(`---- Lead ${i + 1} ----`);
      console.log('id:', s._id.toString());
      console.log('facilityName:', s.facilityName);
      console.log('leadStatus:', s.leadStatus);
      console.log('createdBy:', s.createdBy);
      console.log('createdAt:', s.createdAt);
      console.log('contactPerson:', s.contactPerson && s.contactPerson.name);
    });

    // Group counts by createdBy (show top 10)
    const byCreator = await Lead.aggregate([
      { $group: { _id: '$createdBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    console.log('Top creators (createdBy -> count):');
    console.log(byCreator);

    // Counts by leadStatus
    const byStatus = await Lead.aggregate([
      { $group: { _id: '$leadStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('Counts by leadStatus:');
    console.log(byStatus);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error checking leads:', err);
    process.exit(1);
  }
}

run();
