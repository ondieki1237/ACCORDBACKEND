#!/usr/bin/env node

/**
 * Complete Password Reset & Login Test
 * Full end-to-end verification
 */

import 'dotenv/config';
import connectDB from '../src/config/database.js';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

async function test() {
  try {
    await connectDB();
    
    // Get the first user from database
    const user = await User.findOne({ isActive: true });
    
    if (!user) {
      console.error('❌ No active users found in database');
      process.exit(1);
    }

    console.log('\n🔐 Detailed Password Hash Verification');
    console.log('=====================================\n');
    console.log(`User Email: ${user.email}`);
    console.log(`User ID: ${user._id}`);
    console.log(`Password Field Type: ${typeof user.password}`);
    console.log(`Password Field Exists: ${!!user.password}`);
    console.log(`Password Length: ${user.password.length}`);
    console.log(`Password Starts with $2: ${user.password.startsWith('$2')}`);
    console.log(`Password Starts with $2a/$2b: ${user.password.startsWith('$2a') || user.password.startsWith('$2b')}`);

    // Test with a few passwords
    const testPasswords = ['password', 'test123', 'Accord123!', '123456', 'admin'];
    
    console.log('\n🧪 Testing Password Comparisons');
    console.log('================================');
    
    let foundMatch = false;
    for (const pwd of testPasswords) {
      try {
        const match = await bcrypt.compare(pwd, user.password);
        if (match) {
          console.log(`✅ FOUND MATCH: "${pwd}"`);
          foundMatch = true;
          break;
        }
      } catch (err) {
        console.log(`❌ Error comparing "${pwd}": ${err.message}`);
      }
    }

    if (!foundMatch) {
      console.log('\n⚠️ No match found with common passwords');
      console.log('The password hash appears to be correct but no common password matched.');
      console.log('\n💡 Troubleshooting steps:');
      console.log('1. Make sure you entered the exact password during reset');
      console.log('2. Check for spaces at start/end of password');
      console.log('3. Password is case-sensitive');
      console.log('4. Run password reset again with a simple password like: "test1234"');
    } else {
      console.log('\n✅ Password verification successful!');
      console.log('Your account should now work with password reset.');
    }

    process.exit(foundMatch ? 0 : 1);
    
  } catch (error) {
    console.error('Test error:', error.message);
    process.exit(1);
  }
}

test();
