#!/usr/bin/env node

/**
 * Seed an admin user to the database
 * Usage: node scripts/seedAdminUser.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  try {
    console.log('🌱 Seeding Admin User...\n');

    // Connect to database
    console.log('🔗 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // User data
    const userData = {
      firstName: 'Evance',
      lastName: 'Admin',
      email: 'operations@accordmedical.co.ke',
      password: '123456A',
      phone: '+254700000000',
      role: 'admin',
      employeeId: 'ADM-EVANCE-001',
      isActive: true
    };

    // Check if user already exists
    console.log('🔍 Checking if user already exists...');
    const existing = await User.findOne({
      $or: [
        { email: userData.email },
        { employeeId: userData.employeeId }
      ]
    });

    if (existing) {
      console.log('⚠️  User already exists:');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Employee ID: ${existing.employeeId}`);
      console.log(`   Role: ${existing.role}`);
      
      // Option to update if needed
      if (existing.role !== 'admin') {
        console.log('\n📝 Updating existing user to admin role...');
        existing.role = 'admin';
        await existing.save();
        console.log('✅ User role updated to admin');
      }
    } else {
      // Hash password
      console.log('🔐 Hashing password...');
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      userData.password = hashedPassword;

      // Create user
      console.log('👤 Creating admin user...');
      const user = new User(userData);
      await user.save();

      console.log('\n✅ Admin user created successfully!\n');
      console.log('━'.repeat(50));
      console.log('User Details:');
      console.log(`  Name: ${userData.firstName} ${userData.lastName}`);
      console.log(`  Email: ${userData.email}`);
      console.log(`  Password: ${process.argv[2] === '--show-password' ? userData.password : '***'}`);
      console.log(`  Role: ${userData.role}`);
      console.log(`  Employee ID: ${userData.employeeId}`);
      console.log(`  Status: ${userData.isActive ? 'Active' : 'Inactive'}`);
      console.log('━'.repeat(50));
      console.log('\n📧 You can now login with:');
      console.log(`   Email: ${userData.email}`);
      console.log(`   Password: 123456A`);
    }

  } catch (error) {
    console.error('❌ Error seeding user:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - user or email already exists');
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
