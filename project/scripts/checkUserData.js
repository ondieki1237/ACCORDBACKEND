#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import Visit from '../src/models/Visit.js';
import Report from '../src/models/Report.js';
import Planner from '../src/models/Planner.js';
import Lead from '../src/models/Lead.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const oldUserId = '6964ae881b37f2200e0fc7f9';
    const newUserId = '69ae361a26f70ed0678f8e0e';

    // Try to find the old user
    const oldUser = await User.findById(oldUserId);
    console.log('Old user found:', !!oldUser);
    if (oldUser) {
      console.log(`  Email: ${oldUser.email}`);
      console.log(`  Name: ${oldUser.firstName} ${oldUser.lastName}`);
    } else {
      console.log('  ❌ Old user does not exist in MongoDB');
    }

    // Find the new user
    const newUser = await User.findById(newUserId);
    console.log('\nNew user found:', !!newUser);
    if (newUser) {
      console.log(`  Email: ${newUser.email}`);
      console.log(`  Name: ${newUser.firstName} ${newUser.lastName}`);
    }

    // Check if there are any records for the old ID
    console.log('\nOld user data:');
    const oldVisits = await Visit.countDocuments({ userId: oldUserId });
    const oldReports = await Report.countDocuments({ userId: oldUserId });
    const oldPlanners = await Planner.countDocuments({ userId: oldUserId });
    const oldLeads = await Lead.countDocuments({ userId: oldUserId });

    console.log(`  Visits: ${oldVisits}`);
    console.log(`  Reports: ${oldReports}`);
    console.log(`  Planners: ${oldPlanners}`);
    console.log(`  Leads: ${oldLeads}`);

    if (oldVisits + oldReports + oldPlanners + oldLeads > 0) {
      console.log('\n✅ Old user has data that can be linked!');
    } else {
      console.log('\n⚠️  Old user has no associated data');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
