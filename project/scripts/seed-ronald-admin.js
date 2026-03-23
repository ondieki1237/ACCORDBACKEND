#!/usr/bin/env node

/**
 * Seed Admin User - Ronald
 * Creates or updates admin user: ronald (supervisor@accordmedical.co.ke)
 * Usage: node scripts/seed-ronald-admin.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function seedRonald() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const userData = {
      employeeId: 'RONALD001',
      firstName: 'Ronald',
      lastName: 'Supervisor',
      email: 'supervisor@accordmedical.co.ke',
      password: 'Accord2026!',
      role: 'admin',
      department: 'management',
      phone: '+254700000000',
      region: 'National',
      territory: 'Head Office',
      isActive: true,
      mustChangePassword: false
    };

    // DO NOT hash password here - let Mongoose pre-save hook handle it
    // If you hash it here, Mongoose will hash it AGAIN, causing double-hashing

    // Check if user exists
    const existingUser = await User.findOne({ email: userData.email });

    if (existingUser) {
      // Update existing user
      await User.findByIdAndUpdate(existingUser._id, userData, { new: true });
      console.log('✓ Updated existing admin user: ronald');
      console.log(`  Email: ${userData.email}`);
      console.log(`  Role: ${userData.role}`);
    } else {
      // Create new user
      const newUser = await User.create(userData);
      console.log('✓ Created new admin user: ronald');
      console.log(`  ID: ${newUser._id}`);
      console.log(`  Email: ${userData.email}`);
      console.log(`  Role: ${userData.role}`);
    }

    console.log('\n✅ Seeding complete!');
    console.log('\nLogin credentials:');
    console.log(`  Email: supervisor@accordmedical.co.ke`);
    console.log(`  Password: Accord2026!`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    if (error.code === 11000) {
      console.error('  Duplicate key error - user may already exist');
    }
    process.exit(1);
  }
}

seedRonald();
