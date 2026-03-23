import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import 'dotenv/config';

/**
 * Verification Script - Compare MySQL vs MongoDB Users
 * Usage: node verify-migration.js
 */

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'accord'
};

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/accord';

const userSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'sales', 'engineer'] }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function verify() {
  let mysqlConnection;

  try {
    console.log('\n🔍 Starting migration verification...\n');

    // Connect to MySQL
    mysqlConnection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅ Connected to MySQL');
    const [mysqlUsers] = await mysqlConnection.execute('SELECT COUNT(*) as count FROM users');
    const mysqlCount = mysqlUsers[0].count;
    console.log(`   📊 MySQL users: ${mysqlCount}`);

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    const mongoCount = await User.countDocuments();
    console.log(`   📊 MongoDB users: ${mongoCount}`);

    // Role breakdown
    console.log('\n📋 Role Breakdown:');
    const [roleStats] = await mysqlConnection.execute('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    roleStats.forEach(stat => {
      console.log(`   ${stat.role}: ${stat.count}`);
    });

    // Check for special accounts
    console.log('\n🔑 Special Accounts:');
    const [supervisors] = await mysqlConnection.execute('SELECT * FROM users WHERE role = "supervisor" LIMIT 5');
    if (supervisors.length > 0) {
      console.log(`   Found ${supervisors.length} supervisor account(s):`);
      supervisors.forEach(u => {
        console.log(`      - ${u.first_name || u.firstName} ${u.last_name || u.lastName} (${u.email})`);
      });
    } else {
      console.log('   ℹ️  No supervisor accounts found');
    }

    // Sampling
    console.log('\n🔀 Sample Comparison (first 5 users):');
    const [sampleUsers] = await mysqlConnection.execute('SELECT * FROM users LIMIT 5');
    for (const mysqlUser of sampleUsers) {
      const email = mysqlUser.email;
      const mongoUser = await User.findOne({ email });
      const status = mongoUser ? '✅ Migrated' : '❌ Not migrated';
      console.log(`   ${status}: ${email}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ Verification Complete\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (mysqlConnection) await mysqlConnection.end();
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
  }
}

verify();
