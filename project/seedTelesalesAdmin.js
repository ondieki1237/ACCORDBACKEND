import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

// Explicitly load .env from src if not found in root
import path from 'path';
import fs from 'fs';
const envPathSrc = path.resolve('./project/src/.env');
if (fs.existsSync(envPathSrc)) {
  dotenv.config({ path: envPathSrc });
} else {
  dotenv.config();
}

const telesalesData = {
  employeeId: 'ADM_TELESALES',
  firstName: 'Telesales',
  lastName: 'Admin',
  email: 'telesales@accordmedical.co.ke',
  password: 'telesales2026!',
  role: 'admin',
  region: 'National',
  territory: 'All',
  department: 'management',
  isActive: true
};

async function seedTelesalesAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const existing = await User.findOne({ $or: [ { email: telesalesData.email }, { employeeId: telesalesData.employeeId } ] });
    if (existing) {
      console.log('Telesales admin user already exists.');
      process.exit(0);
    }
    const user = new User(telesalesData);
    await user.save();
    console.log('Telesales admin user created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding telesales admin:', err);
    process.exit(1);
  }
}

seedTelesalesAdmin();