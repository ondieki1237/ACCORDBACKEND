#!/usr/bin/env node

/**
 * Restore deleted user from MySQL backup to MongoDB
 * Usage: node scripts/restoreUserFromMySQL.js <userId>
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

async function restoreUser(userIdOrEmail) {
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

    // Find user in MySQL (by ID or email)
    const [rows] = await mysqlConnection.execute(
      'SELECT * FROM users WHERE id = ? OR email = ?',
      [userIdOrEmail, userIdOrEmail]
    );

    if (rows.length === 0) {
      logger.error(`User not found in MySQL: ${userIdOrEmail}`);
      process.exit(1);
    }

    const mysqlUser = rows[0];
    logger.info(`Found user in MySQL:`, {
      id: mysqlUser.id,
      email: mysqlUser.email,
      firstName: mysqlUser.first_name,
      mongo_id: mysqlUser.mongo_id
    });

    // Check if user already exists in MongoDB
    const existingUser = await User.findById(mysqlUser.mongo_id);
    if (existingUser) {
      logger.warn(`User already exists in MongoDB with ID: ${mysqlUser.mongo_id}`);
      logger.info('Skipping restoration');
      await mysqlConnection.end();
      process.exit(0);
    }

    // Create user document in MongoDB
    const userDoc = new User({
      _id: mongoose.Types.ObjectId.createFromHexString(mysqlUser.mongo_id),
      employeeId: mysqlUser.employee_id,
      firstName: mysqlUser.first_name,
      lastName: mysqlUser.last_name,
      email: mysqlUser.email.toLowerCase(),
      password: mysqlUser.password, // Already hashed from MySQL
      role: mysqlUser.role,
      phone: mysqlUser.phone || '',
      region: mysqlUser.region,
      territory: mysqlUser.territory || '',
      isActive: Boolean(mysqlUser.is_active),
      createdAt: new Date(mysqlUser.created_at),
      updatedAt: new Date(mysqlUser.updated_at)
    });

    await userDoc.save();

    logger.info('✅ User restored successfully!');
    logger.info('Restored user details:', {
      id: userDoc._id,
      email: userDoc.email,
      firstName: userDoc.firstName,
      lastName: userDoc.lastName,
      role: userDoc.role,
      createdAt: userDoc.createdAt
    });

    await mysqlConnection.end();
    process.exit(0);
  } catch (error) {
    logger.error('Error restoring user:', error);
    process.exit(1);
  }
}

// Get user ID or email from command line
const userIdentifier = process.argv[2];
if (!userIdentifier) {
  logger.error('Usage: node scripts/restoreUserFromMySQL.js <userId or email>');
  logger.error('Example: node scripts/restoreUserFromMySQL.js lucy');
  logger.error('Example: node scripts/restoreUserFromMySQL.js omenyalucy65@gmail.com');
  process.exit(1);
}

restoreUser(userIdentifier);
