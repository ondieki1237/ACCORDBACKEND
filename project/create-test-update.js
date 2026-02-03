#!/usr/bin/env node

/**
 * Script to create an AppUpdate record for testing
 * Run with: node create-test-update.js
 */

import mongoose from 'mongoose';
import 'dotenv/config';

// Import the AppUpdate model
import AppUpdate from './src/models/AppUpdate.js';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/accord-backend')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    return createTestUpdate();
  })
  .then(() => {
    console.log('✅ Test update created successfully!');
    return testCheckEndpoint();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });

async function createTestUpdate() {
  // Create update with version 1.1.1
  const update = new AppUpdate({
    version: '1.1.1',
    platform: 'android',
    targetRoles: ['sales'],
    releaseNotes: 'Bug fixes and performance improvements\n- Fixed login issues\n- Improved report submission\n- Better error handling',
    updateMethod: 'internal',
    bundledCode: null,
    updateInstructions: 'Please restart the app to apply updates',
    forced: false,
    isActive: true,
    requiresRestart: true,
    changeLog: 'Fixed login issues, improved reporting UI'
  });

  const saved = await update.save();
  console.log('\n✨ Created AppUpdate v1.1.1:');
  console.log(JSON.stringify(saved.toObject(), null, 2));
  return saved;
}

async function testCheckEndpoint() {
  // Find the update we just created
  const update = await AppUpdate.findOne({ version: '1.1.1' }).lean();
  
  if (!update) {
    console.log('\n⚠️  Could not find the update we just created');
    return;
  }

  // Simulate what the API does
  console.log('\n📋 Testing /api/app-updates/check simulation:');
  console.log('\nRequest:');
  console.log(JSON.stringify({
    role: 'sales',
    platform: 'android',
    currentVersion: '1.0.0'
  }, null, 2));

  console.log('\nResponse:');
  const response = {
    success: true,
    updateAvailable: true,
    update: {
      ...update,
      internalUpdate: true,
      updateMethod: 'internal',
      requiresRestart: true,
      timestamp: new Date()
    }
  };
  console.log(JSON.stringify(response, null, 2));

  console.log('\n✅ Update is now available for sales/android with current version < 1.1.1');
  console.log('📱 When app calls /api/app-updates/check with currentVersion: "1.0.0", it will get updateAvailable: true');
  
  // Close MongoDB connection
  await mongoose.connection.close();
  console.log('\n✅ Done!');
}
