import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config({ path: './project/.env' });

async function seedAccountant() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const userData = {
    employeeId: 'ACC-ACCT-001',
    firstName: 'Savy',
    lastName: 'Syengo',
    email: 'savy.syengo@accordmedical.co.ke',
    password: 'Accountant@2026', // Temporary password, should be changed on first login
    role: 'admin', // Also an accountant, but role must be in enum
    department: 'management',
    phone: '',
    region: 'Nairobi',
    territory: '',
    isActive: true,
    mustChangePassword: true
  };

  // Check if user already exists
  const exists = await User.findOne({ email: userData.email });
  if (exists) {
    console.log('User already exists:', userData.email);
    await mongoose.disconnect();
    return;
  }

  const user = new User(userData);
  await user.save();
  console.log('Seeded accountant user:', user.email);
  await mongoose.disconnect();
}

seedAccountant().catch(err => {
  console.error('Error seeding accountant user:', err);
  process.exit(1);
});
