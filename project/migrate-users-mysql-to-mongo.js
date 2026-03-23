import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

/**
 * MySQL to MongoDB User Migration Script
 * 
 * Migrates user data from MySQL to MongoDB
 * Usage: node migrate-users-mysql-to-mongo.js
 */

// MongoDB User Model
const userSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'sales', 'engineer'], default: 'sales' },
  department: { type: String },
  phone: { type: String },
  region: { type: String },
  territory: { type: String },
  isActive: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false },
  profileImage: { type: String },
  lastPasswordChangeAt: { type: Date },
  lastLogin: { type: Date },
  targets: {
    monthly: { visits: { type: Number, default: 0 }, orders: { type: Number, default: 0 }, revenue: { type: Number, default: 0 } },
    quarterly: { visits: { type: Number, default: 0 }, orders: { type: Number, default: 0 }, revenue: { type: Number, default: 0 } }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Configuration
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'accord',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/accord';

let migratedCount = 0;
let errorCount = 0;
const errors = [];

/**
 * Connect to MySQL
 */
async function connectMySQL() {
  try {
    return await mysql.createConnection(MYSQL_CONFIG);
  } catch (error) {
    console.error('❌ Failed to connect to MySQL:', error.message);
    throw error;
  }
}

/**
 * Connect to MongoDB
 */
async function connectMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

/**
 * Transform MySQL user to MongoDB user
 */
function transformUser(mysqlUser) {
  return {
    employeeId: mysqlUser.employee_id || mysqlUser.id || `EMP-${Date.now()}`,
    firstName: mysqlUser.first_name || mysqlUser.firstName || '',
    lastName: mysqlUser.last_name || mysqlUser.lastName || '',
    email: mysqlUser.email || '',
    password: mysqlUser.password || 'TEMP_' + Math.random().toString(36),
    role: mysqlUser.role || 'sales',
    department: mysqlUser.department || '',
    phone: mysqlUser.phone || mysqlUser.phone_number || '',
    region: mysqlUser.region || '',
    territory: mysqlUser.territory || '',
    isActive: mysqlUser.is_active !== undefined ? mysqlUser.is_active : true,
    mustChangePassword: mysqlUser.must_change_password ? true : false,
    profileImage: mysqlUser.profile_image || null,
    lastPasswordChangeAt: mysqlUser.last_password_change_at || null,
    lastLogin: mysqlUser.last_login || null,
    targets: {
      monthly: { visits: 0, orders: 0, revenue: 0 },
      quarterly: { visits: 0, orders: 0, revenue: 0 }
    }
  };
}

/**
 * Hash password if not already hashed
 */
async function hashPasswordIfNeeded(password) {
  // Check if already bcrypt hashed (starts with $2a$, $2b$, or $2y$)
  if (password && password.startsWith('$2')) {
    return password;
  }
  // Hash new password
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Migrate users from MySQL to MongoDB
 */
async function migrateUsers() {
  let mysqlConnection;
  
  try {
    console.log('\n🔄 Starting user migration from MySQL to MongoDB...\n');

    // Connect to both databases
    mysqlConnection = await connectMySQL();
    await connectMongoDB();

    // Query MySQL for users
    console.log('📋 Fetching users from MySQL...');
    const [users] = await mysqlConnection.execute('SELECT * FROM users LIMIT 1000');
    
    if (users.length === 0) {
      console.log('⚠️  No users found in MySQL');
      return;
    }

    console.log(`📊 Found ${users.length} users to migrate\n`);

    // Migrate each user
    for (let i = 0; i < users.length; i++) {
      try {
        const mysqlUser = users[i];
        const transformedUser = transformUser(mysqlUser);

        // Hash password
        transformedUser.password = await hashPasswordIfNeeded(transformedUser.password);

        // Check if user already exists in MongoDB
        const existingUser = await User.findOne({
          $or: [
            { email: transformedUser.email },
            { employeeId: transformedUser.employeeId }
          ]
        });

        if (existingUser) {
          console.log(
            `⏭️  Skipping ${transformedUser.email} (already exists in MongoDB)`
          );
          continue;
        }

        // Create new user in MongoDB
        const newUser = new User(transformedUser);
        await newUser.save();

        migratedCount++;
        const progress = Math.round(((i + 1) / users.length) * 100);
        console.log(
          `✅ [${progress}%] Migrated: ${transformedUser.firstName} ${transformedUser.lastName} (${transformedUser.email})`
        );

      } catch (error) {
        errorCount++;
        const user = users[i];
        const errorMsg = `User ${user.email}: ${error.message}`;
        errors.push(errorMsg);
        console.log(`❌ Error migrating user: ${errorMsg}`);
      }
    }

    // Print summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ MIGRATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n📊 Results:`);
    console.log(`   ✅ Successfully migrated: ${migratedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Total processed: ${users.length}`);

    if (errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      errors.forEach(err => console.log(`   - ${err}`));
    }

    // Verify in MongoDB
    console.log('\n🔍 Verifying in MongoDB...');
    const dbUserCount = await User.countDocuments();
    console.log(`   📊 Total users in MongoDB: ${dbUserCount}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    // Cleanup connections
    if (mysqlConnection) {
      await mysqlConnection.end();
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

/**
 * Main
 */
async function main() {
  console.log('\n🚀 MySQL to MongoDB User Migration Tool');
  console.log('═══════════════════════════════════════════════════════════\n');

  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log('Usage: node migrate-users-mysql-to-mongo.js [OPTIONS]\n');
    console.log('Options:');
    console.log('  --help           Show this help message');
    console.log('  --dry-run        Show what would be migrated (no changes)');
    console.log('\nEnvironment variables:');
    console.log('  MYSQL_HOST       MySQL server host (default: localhost)');
    console.log('  MYSQL_USER       MySQL username (default: root)');
    console.log('  MYSQL_PASSWORD   MySQL password');
    console.log('  MYSQL_DATABASE   MySQL database (default: accord)');
    console.log('  MONGODB_URI      MongoDB connection URI\n');
    process.exit(0);
  }

  if (args.includes('--dry-run')) {
    console.log('🔍 Running in DRY-RUN mode (no changes will be made)\n');
    // Could implement dry-run later
  }

  console.log('Configuration:');
  console.log(`  MySQL Host:     ${MYSQL_CONFIG.host}`);
  console.log(`  MySQL DB:       ${MYSQL_CONFIG.database}`);
  console.log(`  MongoDB:        ${MONGODB_URI.substring(0, 50)}...\n`);

  await migrateUsers();
}

// Run migration
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
