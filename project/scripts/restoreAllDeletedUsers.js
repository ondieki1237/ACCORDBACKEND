#!/usr/bin/env node

/**
 * Batch restore all deleted users from MySQL backup to MongoDB
 * Shows list of deletions and allows restoring specific users
 */

import mongoose from 'mongoose';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import logger from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function listDeletedUsersAndRestore() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Connect to MySQL
    const mysqlConnection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: Number(process.env.MYSQL_PORT || 3306)
    });

    logger.info('Connected to MySQL');

    // Get all users from MySQL
    const [mysqlUsers] = await mysqlConnection.execute('SELECT * FROM users');
    logger.info(`Found ${mysqlUsers.length} users in MySQL backup`);

    // Get all users from MongoDB
    const mongoUsers = await User.find().lean();
    const mongoIds = new Set(mongoUsers.map(u => u._id.toString()));

    // Find users in MySQL that are NOT in MongoDB (deleted users)
    const deletedUsers = mysqlUsers.filter(u => !mongoIds.has(u.mongo_id));

    if (deletedUsers.length === 0) {
      logger.info('✅ No deleted users found - all users are in sync!');
      await mysqlConnection.end();
      process.exit(0);
    }

    logger.info(`\n📋 Found ${deletedUsers.length} deleted users in MySQL backup:\n`);
    console.log('----------------------------');
    deletedUsers.forEach((u, idx) => {
      console.log(`${idx + 1}. ${u.first_name} ${u.last_name}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Deleted since: ${u.updated_at}`);
      console.log('');
    });
    console.log('----------------------------\n');

    // Restore all deleted users
    logger.info(`🔄 Restoring ${deletedUsers.length} users...\n`);

    let restored = 0;
    let skipped = 0;

    for (const mysqlUser of deletedUsers) {
      try {
        // Create user document in MongoDB
        const userDoc = new User({
          _id: mongoose.Types.ObjectId.createFromHexString(mysqlUser.mongo_id),
          employeeId: mysqlUser.employee_id,
          firstName: mysqlUser.first_name,
          lastName: mysqlUser.last_name,
          email: mysqlUser.email.toLowerCase(),
          password: mysqlUser.password, // Already hashed
          role: mysqlUser.role,
          phone: mysqlUser.phone || '',
          region: mysqlUser.region,
          territory: mysqlUser.territory || '',
          isActive: Boolean(mysqlUser.is_active),
          createdAt: new Date(mysqlUser.created_at),
          updatedAt: new Date(mysqlUser.updated_at)
        });

        await userDoc.save();
        restored++;
        logger.info(`✅ Restored: ${mysqlUser.first_name} ${mysqlUser.last_name} (${mysqlUser.email})`);
      } catch (error) {
        if (error.code === 11000) {
          skipped++;
          logger.warn(`⏭️  Skipped: ${mysqlUser.first_name} ${mysqlUser.last_name} - already exists`);
        } else {
          logger.error(`❌ Failed to restore ${mysqlUser.email}:`, error.message);
        }
      }
    }

    logger.info(`\n📊 Restoration Summary:`);
    logger.info(`   ✅ Restored: ${restored} users`);
    logger.info(`   ⏭️  Skipped: ${skipped} users (already in MongoDB)`);
    logger.info(`   📅 Total processed: ${restored + skipped} users\n`);

    await mysqlConnection.end();
    process.exit(0);
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

listDeletedUsersAndRestore();
