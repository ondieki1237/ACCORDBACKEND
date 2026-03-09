#!/usr/bin/env node

/**
 * Link user accounts to allow data access across account migrations
 * Usage: node scripts/linkUserAccounts.js <newUserId> <oldUserId> [reason] [notes]
 * 
 * Example:
 * node scripts/linkUserAccounts.js 69ae361a26f70ed0678f8e0e 6964ae881b37f2200e0fc7f9 account_migration "User migrated with new account"
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import Visit from '../src/models/Visit.js';
import Report from '../src/models/Report.js';
import Planner from '../src/models/Planner.js';
import Lead from '../src/models/Lead.js';
import UserLink from '../src/models/UserLink.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Missing required arguments');
  console.log('Usage: node scripts/linkUserAccounts.js <newUserId> <oldUserId> [reason] [notes]');
  console.log('');
  console.log('Reasons: account_migration, account_consolidation, duplicate_account, other');
  process.exit(1);
}

const newUserId = args[0];
const oldUserId = args[1];
const reason = args[2] || 'account_migration';
const notes = args[3] || '';

async function linkUserAccounts() {
  try {
    console.log('🔗 Linking user accounts...\n');

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Validating users...');
    const newUser = await User.findById(newUserId);
    if (!newUser) {
      console.error(`❌ New user not found: ${newUserId}`);
      process.exit(1);
    }
    console.log(`   ✓ New user: ${newUser.firstName} ${newUser.lastName} (${newUser.email})`);

    const oldUser = await User.findById(oldUserId);
    let oldUserInfo = '';
    
    if (oldUser) {
      console.log(`   ✓ Old user: ${oldUser.firstName} ${oldUser.lastName} (${oldUser.email})`);
      oldUserInfo = `${oldUser.firstName} ${oldUser.lastName} (${oldUser.email})`;
    } else {
      console.log(`   ⚠️  Old user account not found, checking for associated data...`);
      
      const visits = await Visit.countDocuments({ userId: oldUserId });
      const reports = await Report.countDocuments({ userId: oldUserId });
      const planners = await Planner.countDocuments({ userId: oldUserId });
      const leads = await Lead.countDocuments({ userId: oldUserId });
      
      const totalData = visits + reports + planners + leads;
      if (totalData > 0) {
        console.log(`   ✓ Found ${totalData} orphaned records (${visits} visits, ${reports} reports, ${planners} planners, ${leads} leads)`);
        oldUserInfo = `[Deleted Account] (${totalData} orphaned records)`;
      } else {
        console.log(`   ❌ Old user has no associated data`);
        process.exit(1);
      }
    }
    console.log();

    const existingLink = await UserLink.findOne({
      $or: [
        { newUserId, oldUserId },
        { newUserId: oldUserId, oldUserId: newUserId }
      ]
    });

    if (existingLink) {
      console.error('❌ Link already exists between these users');
      console.log(`   Existing link ID: ${existingLink._id}`);
      process.exit(1);
    }

    console.log('🔐 Creating account link...');
    const userLink = new UserLink({
      newUserId,
      oldUserId,
      reason,
      notes,
      isActive: true
    });

    await userLink.save();
    console.log('✅ Link created successfully!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Account Link Details');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Link ID:      ${userLink._id}`);
    console.log(`New User:     ${newUser.firstName} ${newUser.lastName}`);
    console.log(`Old User:     ${oldUserInfo}`);
    console.log(`Reason:       ${reason}`);
    console.log(`Notes:        ${notes || '(none)'}`);
    console.log(`Status:       Active`);
    console.log(`Created:      ${userLink.createdAt}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ The new user can now access all old user\'s data!');
    console.log(`   All visits, reports, planners, and leads from user ${oldUserId} will be accessible.\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error linking accounts:', error.message);
    process.exit(1);
  }
}

linkUserAccounts();
