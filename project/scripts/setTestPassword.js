#!/usr/bin/env node

/**
 * Direct Password Set Test
 * Sets a user's password to a known value and tests login
 */

import 'dotenv/config';
import connectDB from '../src/config/database.js';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const testPassword = 'test1234';

async function test() {
  try {
    await connectDB();
    
    // Get a user
    const user = await User.findOne({ isActive: true });
    
    if (!user) {
      console.error('❌ No active users found');
      process.exit(1);
    }

    console.log('\n🔐 Direct Password Set Test');
    console.log('===========================\n');
    console.log(`Setting password for: ${user.email}`);
    console.log(`Test password: ${testPassword}\n`);

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testPassword, salt);
    
    console.log(`Generated hash: ${hashedPassword.substring(0, 30)}...`);

    // Update directly in MongoDB
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    const result = await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} document(s)\n`);

    // Verify it was saved
    const updatedUser = await User.findById(user._id);
    console.log(`Verification - Password in DB: ${updatedUser.password.substring(0, 30)}...\n`);

    // Test comparison
    const match = await bcrypt.compare(testPassword, updatedUser.password);
    console.log(`Password match test: ${match ? '✅ YES' : '❌ NO'}\n`);

    if (match) {
      console.log(`✅ SUCCESS!\n`);
      console.log(`You can now login with:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${testPassword}\n`);
      console.log(`Try this curl command:`);
      console.log(`curl -X POST http://localhost:4500/api/auth/login \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{"email":"${user.email}","password":"${testPassword}"}'`);
    } else {
      console.log('❌ Password comparison failed');
    }

    process.exit(match ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test();
