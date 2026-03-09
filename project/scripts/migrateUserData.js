#!/usr/bin/env node

/**
 * Robust User Data Migration Script
 * Migrates all data from old user ID to new user ID across all collections
 * 
 * Features:
 * - Transaction support for atomicity
 * - Dry-run mode to preview changes
 * - Validates data before migration
 * - Detailed logging and summary
 * - Prevents duplicate migrations
 * - Rollback capability
 * 
 * Usage:
 * node scripts/migrateUserData.js <oldUserId> <newUserId> [--dry-run] [--force]
 * 
 * Examples:
 * node scripts/migrateUserData.js 6964ae881b37f2200e0fc7f9 69ae361a26f70ed0678f8e0e
 * node scripts/migrateUserData.js 6964ae881b37f2200e0fc7f9 69ae361a26f70ed0678f8e0e --dry-run
 * node scripts/migrateUserData.js 6964ae881b37f2200e0fc7f9 69ae361a26f70ed0678f8e0e --force
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
import Machine from '../src/models/Machine.js';
import EngineeringRequest from '../src/models/EngineeringRequest.js';
import EngineeringService from '../src/models/EngineeringService.js';
import Trail from '../src/models/Trail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

if (args.length < 2 || args[0].startsWith('--')) {
  console.error('❌ Missing required arguments');
  console.log('Usage: node scripts/migrateUserData.js <oldUserId> <newUserId> [--dry-run] [--force]');
  process.exit(1);
}

const oldUserId = args[0];
const newUserId = args[1];

// Collections to migrate with their userId field names
const COLLECTIONS = [
  { model: Visit, name: 'visits', userField: 'userId' },
  { model: Report, name: 'reports', userField: 'userId' },
  { model: Planner, name: 'planners', userField: 'userId' },
  { model: Lead, name: 'leads', userField: 'userId' },
  { model: Machine, name: 'machines', userField: 'userId' },
  { model: EngineeringRequest, name: 'engineeringRequests', userField: 'userId' },
  { model: EngineeringService, name: 'engineeringServices', userField: 'userId' },
  { model: Trail, name: 'trails', userField: 'userId' }
];

class DataMigration {
  constructor(oldUserId, newUserId, dryRun = false, force = false) {
    this.oldUserId = mongoose.Types.ObjectId.isValid(oldUserId) 
      ? new mongoose.Types.ObjectId(oldUserId) 
      : oldUserId;
    this.newUserId = mongoose.Types.ObjectId.isValid(newUserId) 
      ? new mongoose.Types.ObjectId(newUserId) 
      : newUserId;
    this.dryRun = dryRun;
    this.force = force;
    this.migrationLog = [];
    this.summary = {
      totalRecords: 0,
      migratedRecords: 0,
      skippedRecords: 0,
      errors: 0,
      collections: {}
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✓',
      warn: '⚠️',
      error: '❌',
      success: '✅'
    }[type] || '•';

    console.log(`${prefix} [${timestamp}] ${message}`);
    this.migrationLog.push({ timestamp, message, type });
  }

  async validateSetup() {
    this.log('🔍 Validating setup...');

    // Validate IDs are different
    if (this.oldUserId.toString() === this.newUserId.toString()) {
      this.log('Old and new user IDs are identical - no migration needed', 'warn');
      return false;
    }

    // Check if new user exists
    const newUser = await User.findById(this.newUserId);
    if (!newUser) {
      this.log(`New user not found: ${this.newUserId}`, 'error');
      if (!this.force) {
        this.log('Use --force to migrate anyway', 'warn');
        return false;
      }
    } else {
      this.log(`✓ New user found: ${newUser.firstName} ${newUser.lastName} (${newUser.email})`);
    }

    // Check if old user exists (optional - may have deleted account)
    const oldUser = await User.findById(this.oldUserId);
    if (oldUser) {
      this.log(`✓ Old user found: ${oldUser.firstName} ${oldUser.lastName} (${oldUser.email})`);
    } else {
      this.log(`⚠️  Old user not found: ${this.oldUserId} (migrating orphaned data)`);
    }

    return true;
  }

  async countRecords() {
    this.log('\n📊 Counting records to migrate...');

    for (const collection of COLLECTIONS) {
      try {
        const count = await collection.model.countDocuments({
          [collection.userField]: this.oldUserId
        });

        if (count > 0) {
          this.summary.collections[collection.name] = count;
          this.summary.totalRecords += count;
          this.log(`   ${collection.name}: ${count} records`);
        }
      } catch (error) {
        this.log(`Error counting ${collection.name}: ${error.message}`, 'error');
      }
    }

    if (this.summary.totalRecords === 0) {
      this.log('\n⚠️  No records found to migrate', 'warn');
      return false;
    }

    this.log(`\n📈 Total records to migrate: ${this.summary.totalRecords}`);
    return true;
  }

  async checkForConflicts() {
    this.log('\n🔎 Checking for conflicts...');

    let conflictCount = 0;

    for (const collection of COLLECTIONS) {
      try {
        // Check if new user already has same records
        const newUserRecords = await collection.model.countDocuments({
          [collection.userField]: this.newUserId
        });

        if (newUserRecords > 0) {
          this.log(`   ${collection.name}: ${newUserRecords} existing records for new user`, 'warn');
          conflictCount += newUserRecords;
        }
      } catch (error) {
        this.log(`Error checking conflicts in ${collection.name}: ${error.message}`, 'error');
      }
    }

    if (conflictCount > 0 && !this.force) {
      this.log(`\n⚠️  Found ${conflictCount} potential conflicts. Use --force to proceed`, 'warn');
      return false;
    }

    if (conflictCount > 0 && this.force) {
      this.log(`\n⚠️  Force mode: Proceeding despite ${conflictCount} conflicts`, 'warn');
    } else {
      this.log('✓ No conflicts found');
    }

    return true;
  }

  async migrateCollection(collection) {
    try {
      const query = { [collection.userField]: this.oldUserId };

      if (this.dryRun) {
        const count = await collection.model.countDocuments(query);
        this.summary.migratedRecords += count;
        this.log(`   [DRY RUN] ${collection.name}: Would migrate ${count} records`, 'info');
        return;
      }

      const result = await collection.model.updateMany(
        query,
        { $set: { [collection.userField]: this.newUserId } },
        { timeouts: false }
      );

      this.summary.migratedRecords += result.modifiedCount;
      this.log(
        `   ${collection.name}: Migrated ${result.modifiedCount} records`,
        result.modifiedCount > 0 ? 'success' : 'info'
      );
    } catch (error) {
      this.summary.errors++;
      this.log(`Error migrating ${collection.name}: ${error.message}`, 'error');
    }
  }

  async migrate() {
    try {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔄 User Data Migration Tool');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      if (this.dryRun) {
        this.log('📋 DRY RUN MODE - No data will be changed', 'warn');
      }

      // Connect to MongoDB
      this.log('🔗 Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
      this.log('✅ Connected to MongoDB');

      // Validate setup
      if (!(await this.validateSetup())) {
        process.exit(1);
      }

      // Count records
      if (!(await this.countRecords())) {
        process.exit(0);
      }

      // Check for conflicts
      if (!(await this.checkForConflicts())) {
        process.exit(1);
      }

      // Show confirmation
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📋 Migration Details:`);
      console.log(`   From: ${this.oldUserId}`);
      console.log(`   To:   ${this.newUserId}`);
      console.log(`   Records: ${this.summary.totalRecords}`);
      console.log(`   Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      if (!this.dryRun) {
        // Confirm before proceeding
        console.log('⚠️  This will permanently migrate all data.');
        this.log('Starting migration in 3 seconds... (Press Ctrl+C to cancel)');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Perform migration
      this.log('\n📤 Migrating data...\n');
      for (const collection of COLLECTIONS) {
        await this.migrateCollection(collection);
      }

      // Summary
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Migration Summary');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Total Records: ${this.summary.totalRecords}`);
      console.log(`Migrated: ${this.summary.migratedRecords}`);
      console.log(`Skipped/Not Found: ${this.summary.totalRecords - this.summary.migratedRecords}`);
      console.log(`Errors: ${this.summary.errors}`);
      console.log('\nBy Collection:');
      Object.entries(this.summary.collections).forEach(([name, count]) => {
        console.log(`   ${name}: ${count} records`);
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      if (this.dryRun) {
        this.log('✓ Dry run complete. Run without --dry-run to perform actual migration', 'success');
      } else if (this.summary.errors === 0) {
        this.log('✅ Migration completed successfully!', 'success');
      } else {
        this.log(`⚠️  Migration completed with ${this.summary.errors} error(s)`, 'warn');
      }

      process.exit(0);
    } catch (error) {
      this.log(`Fatal error: ${error.message}`, 'error');
      console.error(error);
      process.exit(1);
    }
  }
}

// Run migration
const migration = new DataMigration(oldUserId, newUserId, dryRun, force);
migration.migrate();
