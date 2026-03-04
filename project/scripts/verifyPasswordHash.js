#!/usr/bin/env node

/**
 * Quick Password Reset + Login Test
 * Tests that password reset ACTUALLY works by logging in after reset
 */

import 'dotenv/config';
import connectDB from '../src/config/database.js';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

const testEmail = process.argv[2] || 'test@example.com';
const testPassword = process.argv[3] || 'test1234';

async function test() {
  try {
    await connectDB();
    console.log('\n🔐 Password Reset Verification Test');
    console.log('===================================\n');

    // Find user
    const user = await User.findOne({ email: testEmail.toLowerCase() });
    if (!user) {
      console.error(`❌ User not found: ${testEmail}`);
      process.exit(1);
    }

    console.log(`✅ User found: ${user.email}`);
    console.log(`📅 Last password change: ${user.lastPasswordChangeAt || 'Never'}`);

    // Test current stored password
    console.log('\n🧪 Testing Password Comparison');
    console.log('==============================');

    const match = await user.comparePassword(testPassword);
    console.log(`Trying password: "${testPassword}"`);
    console.log(`Hash in database: ${user.password.substring(0, 30)}...`);
    console.log(`Hash length: ${user.password.length}`);
    console.log(`Match result: ${match ? '✅ YES' : '❌ NO'}`);

    if (match) {
      console.log('\n✅ SUCCESS! Password is correctly stored and can be verified');
      console.log('You should be able to login now.');
    } else {
      console.log('\n❌ FAILURE! Password does not match');
      console.log('\nDebugging info:');
      console.log(`- Email stored: ${user.email}`);
      console.log(`- Password field exists: ${user.password ? 'Yes' : 'No'}`);
      console.log(`- Password is hashed (starts with $2): ${user.password.startsWith('$2') ? 'Yes' : 'No'}`);
      console.log(`- Try logging in again with the password you just set`);
    }

    process.exit(match ? 0 : 1);

  } catch (error) {
    console.error('Test error:', error.message);
    process.exit(1);
  }
}

test();
