#!/usr/bin/env node

/**
 * Migrate user from MySQL to MongoDB
 * Usage: node scripts/migrateUserFromMySQL.js <email>
 */

import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function getUserFromMySQL(email) {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT || 3306)
  });

  try {
    // Query for user
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log(`❌ User not found in MySQL: ${email}`);
      return null;
    }

    const mysqlUser = users[0];
    console.log('✅ Found user in MySQL:');
    console.log(`   Name: ${mysqlUser.first_name} ${mysqlUser.last_name}`);
    console.log(`   Email: ${mysqlUser.email}`);
    console.log(`   Role: ${mysqlUser.role}`);

    return mysqlUser;
  } finally {
    await connection.end();
  }
}

async function migrateUserToMongoDB(mysqlUser) {
  try {
    // Check if user already exists in MongoDB
    const existing = await User.findOne({ email: mysqlUser.email });
    
    if (existing) {
      console.log('\n⚠️  User already exists in MongoDB!');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Name: ${existing.firstName} ${existing.lastName}`);
      return existing;
    }

    // Create MongoDB user object from MySQL data
    const mongoUser = new User({
      firstName: mysqlUser.first_name || 'User',
      lastName: mysqlUser.last_name || '',
      email: mysqlUser.email.toLowerCase(),
      phone: mysqlUser.phone || '',
      employeeId: mysqlUser.employee_id || `EMP-${Date.now()}`,
      password: mysqlUser.password || 'DefaultPass123!', // Use existing hash or set default
      role: mapRole(mysqlUser.role || 'user'),
      isActive: mysqlUser.is_active !== false && mysqlUser.status !== 'inactive',
      // Additional fields from MySQL
      region: mysqlUser.region || '',
      territory: mysqlUser.territory || '',
      designation: mysqlUser.designation || '',
      createdAt: mysqlUser.created_at || new Date(),
      updatedAt: mysqlUser.updated_at || new Date()
    });

    // Save to MongoDB
    await mongoUser.save();
    
    console.log('\n✅ User migrated successfully to MongoDB!');
    console.log(`   ID: ${mongoUser._id}`);
    console.log(`   Email: ${mongoUser.email}`);
    console.log(`   Name: ${mongoUser.firstName} ${mongoUser.lastName}`);
    console.log(`   Role: ${mongoUser.role}`);
    console.log(`   Status: ${mongoUser.isActive ? 'Active' : 'Inactive'}`);

    return mongoUser;
  } catch (error) {
    console.error('❌ Error migrating user to MongoDB:', error.message);
    throw error;
  }
}

function mapRole(mysqlRole) {
  // Map MySQL role names to MongoDB role names
  const roleMap = {
    'admin': 'admin',
    'manager': 'manager',
    'sales': 'sales',
    'engineer': 'engineer',
    'user': 'user',
    'sales_rep': 'sales',
    'field_officer': 'sales'
  };

  return roleMap[mysqlRole?.toLowerCase()] || 'user';
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log('❌ Please provide email as argument');
    console.log('Usage: node scripts/migrateUserFromMySQL.js <email>');
    console.log('Example: node scripts/migrateUserFromMySQL.js mburuenock13@gmail.com');
    process.exit(1);
  }

  try {
    console.log('🔄 Starting user migration from MySQL to MongoDB...\n');
    console.log('━'.repeat(60));

    // Get user from MySQL
    console.log(`📂 Connecting to MySQL...`);
    const mysqlUser = await getUserFromMySQL(email);
    
    if (!mysqlUser) {
      process.exit(1);
    }

    console.log('\n🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Migrate to MongoDB
    console.log('\n📝 Migrating user to MongoDB...');
    const mongodbUser = await migrateUserToMongoDB(mysqlUser);

    console.log('\n' + '━'.repeat(60));
    console.log('✅ Migration completed successfully!');
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
