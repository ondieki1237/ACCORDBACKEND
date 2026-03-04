#!/usr/bin/env node

/**
 * Password Reset Debug Script
 * Directly tests password hashing and comparison
 * Usage: node scripts/debugPasswordReset.js <email>
 */

import 'dotenv/config';
import connectDB from '../src/config/database.js';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/debugPasswordReset.js <email>');
  console.log('Example: node scripts/debugPasswordReset.js makoriseth1237@gmail.com');
  process.exit(1);
}

async function debug() {
  try {
    await connectDB();
    
    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }
    
    console.log('\n🔍 User Found');
    console.log('==============');
    console.log(`Email: ${user.email}`);
    console.log(`User ID: ${user._id}`);
    console.log(`Password hash stored: ${user.password.substring(0, 20)}...`);
    console.log(`Password hash length: ${user.password.length}`);
    console.log(`Is active: ${user.isActive}`);
    console.log(`Last password change: ${user.lastPasswordChangeAt}`);
    
    // Test password comparison
    const testPasswords = ['test1234', 'pass1234', 'password', '12345678'];
    
    console.log('\n🔐 Testing Password Comparison');
    console.log('==============================');
    
    for (const testPass of testPasswords) {
      try {
        const match = await bcrypt.compare(testPass, user.password);
        console.log(`Password "${testPass}": ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
      } catch (err) {
        console.error(`Error comparing "${testPass}": ${err.message}`);
      }
    }
    
    // Alternative: Ask user for password to test
    console.log('\n💡 Hint: What password did you use when resetting?');
    console.log('The password must match exactly (case-sensitive, including spaces)');
    
    process.exit(0);
    
  } catch (error) {
    console.error('Debug error:', error.message);
    process.exit(1);
  }
}

debug();
