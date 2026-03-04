#!/usr/bin/env node

/**
 * Password Reset Flow Test Script
 * Tests all three steps of password reset with logging
 * Usage: node scripts/testPasswordReset.js <email> <newPassword>
 */

import axios from 'axios';
import readline from 'readline';

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => {
  rl.question(prompt, resolve);
});

async function testPasswordReset() {
  try {
    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (!email || !newPassword) {
      console.log('Usage: node scripts/testPasswordReset.js <email> <newPassword>');
      console.log('Example: node scripts/testPasswordReset.js test@example.com Pass1234');
      process.exit(1);
    }

    console.log('\n🔐 Password Reset Flow Test');
    console.log('============================\n');

    // Step 1: Request Reset
    console.log('📧 Step 1: Requesting password reset...');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    
    let resetResponse;
    try {
      resetResponse = await axios.post(`${BASE_URL}/auth/password-reset/request`, {
        email: email.toLowerCase()
      });
      console.log(`   ✅ Reset requested successfully`);
      console.log(`   Response:`, JSON.stringify(resetResponse.data, null, 2));
    } catch (err) {
      console.error(`   ❌ Failed to request reset:`, err.response?.data || err.message);
      process.exit(1);
    }

    // Ask user for code
    const code = await question('\n🔢 Enter the 6-digit code from your email: ');

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      console.error('❌ Code must be 6 digits');
      process.exit(1);
    }

    // Step 2: Verify Code
    console.log('\n✔️ Step 2: Verifying code...');
    console.log(`   Email: ${email}`);
    console.log(`   Code: ${code}`);

    let verifyResponse;
    try {
      verifyResponse = await axios.post(`${BASE_URL}/auth/password-reset/verify`, {
        email: email.toLowerCase(),
        code: code
      });
      console.log(`   ✅ Code verified successfully`);
      console.log(`   Response:`, JSON.stringify(verifyResponse.data, null, 2));
    } catch (err) {
      console.error(`   ❌ Failed to verify code:`, err.response?.data || err.message);
      process.exit(1);
    }

    // Step 3: Reset Password
    console.log('\n🔐 Step 3: Resetting password...');
    console.log(`   Email: ${email}`);
    console.log(`   New Password: ${newPassword}`);

    let resetPasswordResponse;
    try {
      resetPasswordResponse = await axios.post(`${BASE_URL}/auth/password-reset/reset`, {
        email: email.toLowerCase(),
        code: code,
        newPassword: newPassword
      });
      console.log(`   ✅ Password reset successfully`);
      console.log(`   Response:`, JSON.stringify(resetPasswordResponse.data, null, 2));
    } catch (err) {
      console.error(`   ❌ Failed to reset password:`, err.response?.data || err.message);
      process.exit(1);
    }

    // Step 4: Try to login with new password
    console.log('\n🔑 Step 4: Testing login with new password...');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);

    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: email.toLowerCase(),
        password: newPassword
      });
      console.log(`   ✅ Login successful with new password!`);
      console.log(`   User ID: ${loginResponse.data.data?.user?._id || 'N/A'}`);
      console.log(`   Token received: ${loginResponse.data.data?.tokens?.accessToken ? 'Yes' : 'No'}`);
    } catch (err) {
      console.error(`   ❌ Failed to login with new password:`, err.response?.data || err.message);
      console.error('\n⚠️  The password reset may not have been saved properly.');
      process.exit(1);
    }

    console.log('\n✅ Password reset flow completed successfully!\n');
    rl.close();

  } catch (error) {
    console.error('Test error:', error.message);
    process.exit(1);
  }
}

testPasswordReset();
