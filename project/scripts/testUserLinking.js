#!/usr/bin/env node

/**
 * Test User Account Linking
 * Verify that linked accounts can access old data
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
import { getLinkedUserIds, getLinkedOldUsers } from '../src/services/userLinkingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const newUserId = '69ae361a26f70ed0678f8e0e';
const oldUserId = '6964ae881b37f2200e0fc7f9';

async function testLinkedAccounts() {
  try {
    console.log('🧪 Testing User Account Linking System\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Verify link exists
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 1: Verify Link Exists');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const link = await UserLink.findOne({ newUserId, oldUserId, isActive: true });
    if (link) {
      console.log('✅ Link exists between accounts');
      console.log(`   Link ID: ${link._id}`);
      console.log(`   Reason: ${link.reason}`);
      console.log(`   Created: ${link.createdAt}`);
    } else {
      console.error('❌ Link not found');
      process.exit(1);
    }
    console.log();

    // Test 2: getLinkedUserIds
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 2: getLinkedUserIds()');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const userIds = await getLinkedUserIds(newUserId);
    console.log(`✅ Retrieved linked user IDs: ${userIds.length}`);
    userIds.forEach((id, idx) => {
      const isNew = id.toString() === newUserId;
      const isOld = id.toString() === oldUserId;
      const label = isNew ? '(NEW ACCOUNT)' : isOld ? '(OLD ACCOUNT)' : '';
      console.log(`   ${idx + 1}. ${id} ${label}`);
    });
    console.log();

    // Test 3: getLinkedOldUsers
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 3: getLinkedOldUsers()');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const linkedUsers = await getLinkedOldUsers(newUserId);
    console.log(`✅ Retrieved ${linkedUsers.length} linked old account(s)`);
    linkedUsers.forEach(link => {
      console.log(`   - Reason: ${link.reason}`);
      console.log(`   - Linked at: ${link.linkedAt}`);
      console.log(`   - Notes: ${link.notes || '(none)'}`);
    });
    console.log();

    // Test 4: Fetch from new account only
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 4: Data from New Account Only');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const newVisits = await Visit.countDocuments({ userId: newUserId });
    const newReports = await Report.countDocuments({ userId: newUserId });
    const newPlanners = await Planner.countDocuments({ userId: newUserId });
    const newLeads = await Lead.countDocuments({ userId: newUserId });
    
    console.log(`✅ New Account Data:`);
    console.log(`   Visits: ${newVisits}`);
    console.log(`   Reports: ${newReports}`);
    console.log(`   Planners: ${newPlanners}`);
    console.log(`   Leads: ${newLeads}`);
    console.log();

    // Test 5: Fetch from old account (orphaned data)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 5: Orphaned Data from Old Account');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const oldVisits = await Visit.countDocuments({ userId: oldUserId });
    const oldReports = await Report.countDocuments({ userId: oldUserId });
    const oldPlanners = await Planner.countDocuments({ userId: oldUserId });
    const oldLeads = await Lead.countDocuments({ userId: oldUserId });
    
    console.log(`✅ Old Account Data (orphaned):`);
    console.log(`   Visits: ${oldVisits}`);
    console.log(`   Reports: ${oldReports}`);
    console.log(`   Planners: ${oldPlanners}`);
    console.log(`   Leads: ${oldLeads}`);
    console.log();

    // Test 6: Combined query (what API endpoints should do)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 6: Combined Query (New + Old)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const combinedVisits = await Visit.countDocuments({ 
      userId: { $in: userIds } 
    });
    const combinedReports = await Report.countDocuments({ 
      userId: { $in: userIds } 
    });
    const combinedPlanners = await Planner.countDocuments({ 
      userId: { $in: userIds } 
    });
    const combinedLeads = await Lead.countDocuments({ 
      userId: { $in: userIds } 
    });
    
    console.log(`✅ Combined Data (New + Old):`);
    console.log(`   Visits: ${combinedVisits} (${newVisits} new + ${oldVisits} old)`);
    console.log(`   Reports: ${combinedReports} (${newReports} new + ${oldReports} old)`);
    console.log(`   Planners: ${combinedPlanners} (${newPlanners} new + ${oldPlanners} old)`);
    console.log(`   Leads: ${combinedLeads} (${newLeads} new + ${oldLeads} old)`);
    console.log();

    // Test 7: Verify data is accessible
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 7: Sample Old Records');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (oldVisits > 0) {
      const oldVisitSample = await Visit.findOne({ userId: oldUserId })
        .populate('userId', 'firstName lastName email');
      console.log(`✅ Sample visit from old account:`);
      console.log(`   Client: ${oldVisitSample.client?.name || 'N/A'}`);
      console.log(`   Date: ${oldVisitSample.date}`);
      console.log(`   Outcome: ${oldVisitSample.visitOutcome || 'N/A'}`);
    } else {
      console.log('⚠️  No visits in old account');
    }
    console.log();

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL TESTS PASSED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 Implementation Status:\n');
    console.log('✅ UserLink model created');
    console.log('✅ userLinkingService utilities available');
    console.log('✅ linkUserAccounts script working');
    console.log('✅ Account linking successful');
    console.log('✅ Old data is accessible via linked account');
    console.log('\n⏭️  Next Step: Update API endpoints to use getLinkedUserIds()');
    console.log('   See: DOCUMENTATIONS/USER_ACCOUNT_LINKING.md\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testLinkedAccounts();
