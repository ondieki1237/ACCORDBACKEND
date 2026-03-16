#!/usr/bin/env node

/**
 * User Deletion Audit & Recovery Tool
 * Diagnoses why users disappeared and helps recover them
 * Usage: node scripts/userAuditAndRecovery.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../src/models/User.js';
import UserDeletionAudit from '../src/models/UserDeletionAudit.js';
import Visit from '../src/models/Visit.js';
import Report from '../src/models/Report.js';
import Lead from '../src/models/Lead.js';
import Planner from '../src/models/Planner.js';

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ====================================
    // 1. SHOW DELETION AUDIT ENTRIES
    // ====================================
    console.log('📋 USER DELETION AUDIT LOG\n');
    console.log('═'.repeat(80));

    const deletionAudits = await UserDeletionAudit.find()
      .sort({ deletedAt: -1 })
      .limit(20)
      .lean();

    if (deletionAudits.length === 0) {
      console.log('✅ No user deletions found in audit log - your users are safe!\n');
    } else {
      console.log(`Found ${deletionAudits.length} user deletion records:\n`);
      
      for (const audit of deletionAudits) {
        console.log(`Deletion ID: ${audit._id}`);
        console.log(`  User: ${audit.deletedUserName} (${audit.deletedUserEmail}) - Role: ${audit.deletedUserRole}`);
        console.log(`  Deleted By: ${audit.deletedByEmail} (Role: ${audit.deletedByRole})`);
        console.log(`  Date: ${new Date(audit.deletedAt).toLocaleString()}`);
        console.log(`  Reason: ${audit.reason}`);
        console.log(`  Method: ${audit.method}`);
        console.log(`  IP Address: ${audit.ipAddress}`);
        console.log(`  Related Data Preserved: ${audit.userDataPreserved ? '✅ Yes' : '❌ No'}`);
        console.log(`  Notes: ${audit.notes}`);
        console.log('─'.repeat(80));
      }
    }

    // ====================================
    // 2. CHECK FOR ORPHANED DATA
    // ====================================
    console.log('\n🔍 CHECKING FOR ORPHANED USER DATA\n');
    console.log('═'.repeat(80));

    // Get all user IDs from deletions
    const deletedUserIds = deletionAudits.map(a => a.deletedUserId);

    if (deletedUserIds.length > 0) {
      const orphanedVisits = await Visit.countDocuments({ userId: { $in: deletedUserIds } });
      const orphanedReports = await Report.countDocuments({ userId: { $in: deletedUserIds } });
      const orphanedLeads = await Lead.countDocuments({ createdBy: { $in: deletedUserIds } });
      const orphanedPlanners = await Planner.countDocuments({ userId: { $in: deletedUserIds } });

      const totalOrphaned = orphanedVisits + orphanedReports + orphanedLeads + orphanedPlanners;

      console.log(`Found ${totalOrphaned} orphaned records from deleted users:`);
      console.log(`  Visits: ${orphanedVisits}`);
      console.log(`  Reports: ${orphanedReports}`);
      console.log(`  Leads: ${orphanedLeads}`);
      console.log(`  Planners: ${orphanedPlanners}`);

      if (totalOrphaned > 0) {
        console.log(`\n⚠️  To recover this data, deleted users need to be restored or data reassigned.\n`);
      }
    }

    // ====================================
    // 3. CHECK USER COUNT TRENDS
    // ====================================
    console.log('\n📊 USER COUNT ANALYSIS\n');
    console.log('═'.repeat(80));

    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    console.log(`Current Users: ${totalUsers}`);
    console.log(`  Active: ${activeUsers}`);
    console.log(`  Inactive: ${inactiveUsers}`);
    console.log(`\nTotal Deletions Recorded: ${deletedUserIds.length}`);

    // ====================================
    // 4. RECOVERY OPTIONS
    // ====================================
    console.log('\n🔧 RECOVERY OPTIONS\n');
    console.log('═'.repeat(80));

    console.log(`1. RESTORE FROM MySQL BACKUP`);
    console.log(`   - Check MySQL for users in mongo_users table`);
    console.log(`   - Users marked with is_deleted = 1 can be recovered`);
    console.log(`   - Retention period: 60 days\n`);

    console.log(`2. RESTORE FROM UserDeletionAudit`);
    console.log(`   - All deletion details are logged`);
    console.log(`   - Delete ID: Can be used to identify what was lost`);
    console.log(`   - Related data connections preserved\n`);

    console.log(`3. EXPORT ORPHANED DATA`);
    console.log(`   - Visits, Reports, Leads, Planners can be exported`);
    console.log(`   - Can be reassigned to existing or restored users\n`);

    console.log(`4. INVESTIGATE CAUSE`);
    console.log(`   - Check who deleted users (deletedBy)`);
    console.log(`   - Review IP addresses for suspicious activity`);
    console.log(`   - Check deletion reasons and times\n`);

    // ====================================
    // 5. SUSPICIOUS ACTIVITY CHECK
    // ====================================
    console.log('\n⚠️  SUSPICIOUS ACTIVITY DETECTION\n');
    console.log('═'.repeat(80));

    // Check for bulk deletions
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deletesByAdmin = await UserDeletionAudit.aggregate([
      { $match: { deletedAt: { $gte: last24h } } },
      { $group: { _id: '$deletedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    if (deletesByAdmin.length > 0) {
      console.log('Deletions in Last 24 Hours:\n');
      for (const admin of deletesByAdmin) {
        const adminUser = await User.findById(admin._id).select('email');
        console.log(`  ${adminUser?.email || 'Unknown'}: ${admin.count} deletion(s)`);
        
        if (admin.count > 3) {
          console.log(`     ⚠️  ALERT: Unusual number of deletions!`);
        }
      }
    } else {
      console.log('✅ No deletions in the last 24 hours\n');
    }

    // ====================================
    // 6. GENERATE RECOVERY REPORT
    // ====================================
    console.log('\n📄 RECOVERY RECOMMENDATION\n');
    console.log('═'.repeat(80));

    if (deletedUserIds.length === 0) {
      console.log('✅ No deleted users found - nothing to recover!');
    } else {
      console.log(`\nTo recover the ${deletedUserIds.length} deleted users:\n`);
      console.log(`1. Query MySQL: SELECT * FROM mongo_users WHERE mongo_id IN (${deletedUserIds.map(id => `'${id}'`).join(', ')})`);
      console.log(`2. Restore these users to MongoDB`);
      console.log(`3. Update their is_deleted flag in both databases`);
      console.log(`4. Reconnect orphaned data (visits, reports, leads, planners)`);
      console.log(`5. Notify affected users of the restoration`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('Audit complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
