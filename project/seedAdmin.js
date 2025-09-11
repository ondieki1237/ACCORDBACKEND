import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const adminData = {
  employeeId: 'ADM001',
  firstName: 'Seth',
  lastName: 'Makori',
  email: 'bellarinseth@gmail.com',
  password: 'seth123qP1',
  role: 'admin',
  region: 'North',
  territory: 'B',
  department: 'management', // changed from 'admin' to 'management'
  isActive: true
};

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const existing = await User.findOne({ $or: [ { email: adminData.email }, { employeeId: adminData.employeeId } ] });
    if (existing) {
      console.log('Admin user already exists.');
      process.exit(0);
    }
    const admin = new User(adminData);
    await admin.save();
    console.log('Admin user created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
}

seedAdmin();
