#!/usr/bin/env node

/**
 * Sync MongoDB data to MySQL daily
 * This script exports all collections from MongoDB to MySQL
 * Should be run daily via cron or scheduled job
 * 
 * Usage: node scripts/syncMongoDBToMySQL.js
 */

import mongoose from 'mongoose';
import mysql from 'mysql2/promise';
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

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

let mysqlConnection;

// Helper function to convert MongoDB ObjectId to a numeric ID for MySQL
function objectIdToNumeric(objectId) {
  const idString = objectId.toString();
  // Convert first 15 hex characters to a number (fits safely in BIGINT)
  // BIGINT range: -9223372036854775808 to 9223372036854775807
  const numericId = parseInt(idString.slice(0, 15), 16);
  return numericId || Date.now();
}

async function connectMySQL() {
  mysqlConnection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT || 3306)
  });
}

async function createTablesIfNotExist() {
  console.log('📋 Creating MySQL tables if they don\'t exist...');

  // Users table
  await mysqlConnection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      phone VARCHAR(20),
      employee_id VARCHAR(100) UNIQUE,
      password VARCHAR(255),
      role VARCHAR(50),
      is_active BOOLEAN DEFAULT 1,
      region VARCHAR(255),
      territory VARCHAR(255),
      designation VARCHAR(255),
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      mongo_id VARCHAR(255) UNIQUE
    )
  `);

  // Visits table
  await mysqlConnection.execute(`
    CREATE TABLE IF NOT EXISTS visits (
      id BIGINT PRIMARY KEY,
      user_id BIGINT,
      visit_date DATETIME,
      client_name VARCHAR(255),
      client_type VARCHAR(100),
      location VARCHAR(255),
      purpose VARCHAR(100),
      outcome VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP,
      mongo_id VARCHAR(255) UNIQUE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Reports table
  await mysqlConnection.execute(`
    CREATE TABLE IF NOT EXISTS reports (
      id BIGINT PRIMARY KEY,
      user_id BIGINT,
      week_start DATETIME,
      week_end DATETIME,
      week_range VARCHAR(100),
      content LONGTEXT,
      status VARCHAR(50),
      is_draft BOOLEAN DEFAULT 0,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      mongo_id VARCHAR(255) UNIQUE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Planners table
  await mysqlConnection.execute(`
    CREATE TABLE IF NOT EXISTS planners (
      id BIGINT PRIMARY KEY,
      user_id BIGINT,
      week_created_at DATETIME,
      days JSON,
      notes TEXT,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      mongo_id VARCHAR(255) UNIQUE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Leads table
  await mysqlConnection.execute(`
    CREATE TABLE IF NOT EXISTS leads (
      id BIGINT PRIMARY KEY,
      user_id BIGINT,
      contact_name VARCHAR(255),
      contact_email VARCHAR(255),
      facility_name VARCHAR(255),
      location VARCHAR(255),
      status VARCHAR(50),
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      mongo_id VARCHAR(255) UNIQUE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('✅ Tables created/verified\n');
}

async function syncUsers() {
  console.log('👥 Syncing users...');
  const users = await User.find({}).lean();
  
  if (users.length === 0) {
    console.log('   No users to sync');
    return;
  }

  for (const user of users) {
    await mysqlConnection.execute(`
      INSERT INTO users (
        id, first_name, last_name, email, phone, employee_id, 
        password, role, is_active, region, territory, designation, 
        created_at, updated_at, mongo_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        first_name = VALUES(first_name),
        last_name = VALUES(last_name),
        phone = VALUES(phone),
        role = VALUES(role),
        is_active = VALUES(is_active),
        region = VALUES(region),
        territory = VALUES(territory),
        designation = VALUES(designation),
        updated_at = VALUES(updated_at)
    `, [
      objectIdToNumeric(user._id),
      user.firstName || '',
      user.lastName || '',
      user.email?.toLowerCase() || '',
      user.phone || '',
      user.employeeId || '',
      user.password || '',
      user.role || 'user',
      user.isActive ? 1 : 0,
      user.region || '',
      user.territory || '',
      user.designation || '',
      user.createdAt || new Date(),
      user.updatedAt || new Date(),
      user._id.toString()
    ]);
  }

  console.log(`✅ Synced ${users.length} users\n`);
}

async function syncVisits() {
  console.log('🏥 Syncing visits...');
  const visits = await Visit.find({}).populate('userId').lean();
  
  if (visits.length === 0) {
    console.log('   No visits to sync');
    return;
  }

  for (const visit of visits) {
    // Skip visits with no userId
    if (!visit.userId) {
      console.log(`⚠️  Skipping visit ${visit._id} - no user assigned`);
      continue;
    }

    const userId = typeof visit.userId === 'object' 
      ? objectIdToNumeric(visit.userId._id)
      : objectIdToNumeric(visit.userId);

    await mysqlConnection.execute(`
      INSERT INTO visits (
        id, user_id, visit_date, client_name, client_type, 
        location, purpose, outcome, notes, created_at, mongo_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        client_name = VALUES(client_name),
        outcome = VALUES(outcome),
        notes = VALUES(notes)
    `, [
      objectIdToNumeric(visit._id),
      userId,
      visit.date || new Date(),
      visit.client?.name || '',
      visit.client?.type || '',
      visit.client?.location || '',
      visit.visitPurpose || '',
      visit.visitOutcome || '',
      visit.notes || '',
      visit.createdAt || new Date(),
      visit._id.toString()
    ]);
  }

  console.log(`✅ Synced ${visits.length} visits\n`);
}

async function syncReports() {
  console.log('📊 Syncing reports...');
  const reports = await Report.find({}).lean();
  
  if (reports.length === 0) {
    console.log('   No reports to sync');
    return;
  }

  for (const report of reports) {
    // Skip reports with no userId
    if (!report.userId) {
      console.log(`⚠️  Skipping report ${report._id} - no user assigned`);
      continue;
    }

    await mysqlConnection.execute(`
      INSERT INTO reports (
        id, user_id, week_start, week_end, week_range, 
        content, status, is_draft, created_at, updated_at, mongo_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        content = VALUES(content),
        status = VALUES(status),
        is_draft = VALUES(is_draft),
        updated_at = VALUES(updated_at)
    `, [
      objectIdToNumeric(report._id),
      objectIdToNumeric(report.userId),
      report.weekStart || new Date(),
      report.weekEnd || new Date(),
      report.weekRange || '',
      JSON.stringify(report.content || report.sections || {}),
      report.status || 'pending',
      report.isDraft ? 1 : 0,
      report.createdAt || new Date(),
      report.updatedAt || new Date(),
      report._id.toString()
    ]);
  }

  console.log(`✅ Synced ${reports.length} reports\n`);
}

async function syncPlanners() {
  console.log('📅 Syncing planners...');
  const planners = await Planner.find({}).lean();
  
  if (planners.length === 0) {
    console.log('   No planners to sync');
    return;
  }

  let synced = 0;
  let skipped = 0;

  for (const planner of planners) {
    try {
      // Skip planners with no userId
      if (!planner.userId) {
        console.log(`⚠️  Skipping planner ${planner._id} - no user assigned`);
        skipped++;
        continue;
      }

      const userId = objectIdToNumeric(planner.userId);

      await mysqlConnection.execute(`
        INSERT INTO planners (
          id, user_id, week_created_at, days, notes, 
          created_at, updated_at, mongo_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          days = VALUES(days),
          notes = VALUES(notes),
          updated_at = VALUES(updated_at)
      `, [
        objectIdToNumeric(planner._id),
        userId,
        planner.weekCreatedAt || new Date(),
        JSON.stringify(planner.days || []),
        planner.notes || '',
        planner.createdAt || new Date(),
        planner.updatedAt || new Date(),
        planner._id.toString()
      ]);
      
      synced++;
    } catch (err) {
      console.log(`⚠️  Skipping planner ${planner._id} - ${err.message}`);
      skipped++;
    }
  }

  console.log(`✅ Synced ${synced} planners (${skipped} skipped)\n`);
}

async function syncLeads() {
  console.log('💼 Syncing leads...');
  const leads = await Lead.find({}).lean();
  
  if (leads.length === 0) {
    console.log('   No leads to sync');
    return;
  }

  let synced = 0;
  let skipped = 0;

  for (const lead of leads) {
    try {
      // Skip leads with no userId
      if (!lead.userId) {
        console.log(`⚠️  Skipping lead ${lead._id} - no user assigned`);
        skipped++;
        continue;
      }

      const userId = objectIdToNumeric(lead.userId);

      await mysqlConnection.execute(`
        INSERT INTO leads (
          id, user_id, contact_name, contact_email, facility_name, 
          location, status, created_at, updated_at, mongo_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          contact_name = VALUES(contact_name),
          contact_email = VALUES(contact_email),
          status = VALUES(status),
          updated_at = VALUES(updated_at)
      `, [
        objectIdToNumeric(lead._id),
        userId,
        lead.contactName || lead.name || '',
        lead.contactEmail || lead.email || '',
        lead.facilityName || '',
        lead.location || '',
        lead.status || 'new',
        lead.createdAt || new Date(),
        lead.updatedAt || new Date(),
        lead._id.toString()
      ]);
      
      synced++;
    } catch (err) {
      console.log(`⚠️  Skipping lead ${lead._id} - ${err.message}`);
      skipped++;
    }
  }

  console.log(`✅ Synced ${synced} leads (${skipped} skipped)\n`);
}

async function main() {
  try {
    console.log('🔄 MongoDB to MySQL Sync Starting...\n');
    console.log('━'.repeat(60));

    // Connect to databases
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔗 Connecting to MySQL...');
    await connectMySQL();
    console.log('✅ Connected to MySQL\n');

    // Create tables
    await createTablesIfNotExist();

    // Sync all collections
    await syncUsers();
    await syncVisits();
    await syncReports();
    await syncPlanners();
    await syncLeads();

    console.log('━'.repeat(60));
    console.log('✅ Sync completed successfully!');
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    await mysqlConnection?.end();
    process.exit(0);
  }
}

main();
