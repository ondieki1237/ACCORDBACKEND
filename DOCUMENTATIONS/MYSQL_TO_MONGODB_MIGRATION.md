# MySQL to MongoDB User Migration Guide

## Overview

This guide provides comprehensive instructions for migrating user data from your MySQL database to MongoDB. The migration process is automated, includes error handling, and provides verification capabilities.

## Prerequisites

### 1. Dependencies

Ensure these packages are installed:

```bash
npm install mysql2/promise bcryptjs mongoose dotenv
```

### 2. MySQL Access

You need:
- MySQL connection string (host, user, password, database)
- Access to the `users` table
- Read permissions on the users table

### 3. MongoDB Access

You need:
- MongoDB connection URI
- Write permissions to create/update users collection

### 4. Environment Variables

Create a `.env` file in your project root:

```env
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=accord

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/accord
```

## MySQL Schema Requirements

The script supports flexible MySQL schemas. Common column names it maps:

| MySQL Column | MongoDB Field | Notes |
|---|---|---|
| `employee_id` or `id` | `employeeId` | Auto-generated if missing |
| `first_name` or `firstName` | `firstName` | Required |
| `last_name` or `lastName` | `lastName` | Required |
| `email` | `email` | Must be unique |
| `password` | `password` | Auto-hashed if not already bcrypt |
| `role` | `role` | Admin, Manager, Sales, Engineer |
| `department` | `department` | Optional |
| `phone` or `phone_number` | `phone` | Optional |
| `region` | `region` | Optional |
| `territory` | `territory` | Optional |
| `is_active` | `isActive` | Boolean, defaults to true |
| `must_change_password` | `mustChangePassword` | Boolean for first login |
| `profile_image` | `profileImage` | Optional |
| `last_password_change_at` | `lastPasswordChangeAt` | Timestamp |
| `last_login` | `lastLogin` | Timestamp |

## Migration Process

### Step 1: Inspect MySQL Users Table

Before migration, check your MySQL users table structure:

```bash
# Connect to MySQL
mysql -h localhost -u root -p accord

# View table structure
DESCRIBE users;

# Count users
SELECT COUNT(*) FROM users;

# View sample users
SELECT * FROM users LIMIT 5;

# Check for supervisor account
SELECT * FROM users WHERE role = 'supervisor';
```

### Step 2: Run Migration

Execute the migration script:

```bash
node migrate-users-mysql-to-mongo.js
```

**Expected Output:**
```
🚀 MySQL to MongoDB User Migration Tool
═══════════════════════════════════════════════════════════

Configuration:
  MySQL Host:     localhost
  MySQL DB:       accord
  MongoDB:        mongodb://localhost:27017...

✅ Connected to MongoDB
📋 Fetching users from MySQL...
📊 Found 25 users to migrate

✅ [4%] Migrated: John Doe (john@accord.com)
✅ [8%] Migrated: Jane Smith (jane@accord.com)
⏭️  Skipping ronald@accord.com (already exists in MongoDB)
...

═══════════════════════════════════════════════════════════
✅ MIGRATION COMPLETE
═══════════════════════════════════════════════════════════

📊 Results:
   ✅ Successfully migrated: 23
   ❌ Errors: 0
   📈 Total processed: 25

🔍 Verifying in MongoDB...
   📊 Total users in MongoDB: 48
```

### Step 3: Verify Migration

Run the verification script:

```bash
node verify-migration.js
```

**Expected Output:**
```
🔍 Starting migration verification...

✅ Connected to MySQL
   📊 MySQL users: 25
✅ Connected to MongoDB
   📊 MongoDB users: 48

📋 Role Breakdown:
   admin: 2
   manager: 5
   sales: 15
   engineer: 3

🔑 Special Accounts:
   Found 1 supervisor account(s):
      - Ronald Manager (ronald@accord.com)

🔀 Sample Comparison (first 5 users):
   ✅ Migrated: john@accord.com
   ✅ Migrated: jane@accord.com
   ✅ Migrated: ronald@accord.com
```

## Advanced Options

### Dry Run (Preview without changes)

```bash
node migrate-users-mysql-to-mongo.js --dry-run
```

### Get Help

```bash
node migrate-users-mysql-to-mongo.js --help
```

## Handling Special Cases

### 1. Ronald (Supervisor Account)

If you need to ensure ronald is the supervisor:

```bash
# In MongoDB shell
db.users.updateOne(
  {email: "ronald@accord.com"},
  {$set: {role: "supervisor", isActive: true, mustChangePassword: false}}
)
```

### 2. Password Reset Required

To force users to change password on next login:

```bash
# In MongoDB shell
db.users.updateMany(
  {},
  {$set: {mustChangePassword: true}}
)
```

### 3. Merge with Existing Users

The script automatically skips users that already exist:
- ✅ By email (primary check)
- ✅ By employeeId (secondary check)

To override and replace existing users, manually delete them first:

```bash
# In MongoDB shell
db.users.deleteOne({email: "duplicateemail@accord.com"})
```

## Troubleshooting

### Error: "Cannot find module 'mysql2'"

```bash
npm install mysql2
```

### Error: "Connection refused"

- ✅ Check MySQL is running: `systemctl status mysql`
- ✅ Verify host/port in `.env`
- ✅ Test connection: `mysql -h localhost -u root -p`

### Error: "MongoDB connection failed"

- ✅ Check MongoDB is running: `systemctl status mongod`
- ✅ Verify URI format in `.env`
- ✅ Test connection: `mongosh "mongodb://localhost:27017/accord"`

### Error: "Duplicate key error"

The script should handle this, but if you see errors:
- Check `.env` has correct MONGODB_URI pointing to test database
- Or drop users collection: `db.users.drop()`

### Partial Migration

If migration stopped halfway:
1. Run verification to see what was migrated
2. Delete partial users from MongoDB if needed
3. Fix the issue and re-run migration

The script will skip already-migrated users automatically.

## Post-Migration Steps

### 1. Update Frontend Configuration

If frontend connects to a different database config, update it to MongoDB:

```javascript
// Example frontend config
const API_CONFIG = {
  users_db: 'mongodb', // Changed from 'mysql'
  connection_string: process.env.MONGODB_URI
};
```

### 2. Test User Login

```bash
# Test with a migrated user
curl -X POST http://localhost:4500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ronald@accord.com",
    "password": "your_password"
  }'
```

### 3. Backup Original MySQL Data

Keep MySQL data as backup (don't delete):

```bash
mysqldump -h localhost -u root -p accord users > users_backup.sql
```

### 4. Update Application Code

Ensure all database connections in your Node.js app are using MongoDB:

```javascript
// src/server.js - Verify these are present
import mongoose from 'mongoose';
import User from './models/User.js';

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI);
```

## Data Transformation Details

### Password Handling

- ✅ **Already hashed** (starts with `$2`): Copied as-is
- ✅ **Plain text**: Auto-hashed with bcrypt (10 rounds)
- ✅ **Missing**: Generates temporary password

### Field Mapping

```javascript
{
  // Mapped from MySQL
  employeeId: mysql.employee_id || mysql.id,
  firstName: mysql.first_name || mysql.firstName,
  lastName: mysql.last_name || mysql.lastName,
  email: mysql.email,
  password: hashed_password,
  role: mysql.role || 'sales',
  
  // Preserved from MySQL
  department: mysql.department,
  phone: mysql.phone || mysql.phone_number,
  region: mysql.region,
  territory: mysql.territory,
  isActive: mysql.is_active !== undefined ? mysql.is_active : true,
  mustChangePassword: mysql.must_change_password || false,
  profileImage: mysql.profile_image,
  lastPasswordChangeAt: mysql.last_password_change_at,
  lastLogin: mysql.last_login,
  
  // MongoDB defaults
  targets: {
    monthly: {visits: 0, orders: 0, revenue: 0},
    quarterly: {visits: 0, orders: 0, revenue: 0}
  },
  refreshTokens: [], // Empty initially
  createdAt: now(),
  updatedAt: now()
}
```

## Migration Checklist

- [ ] Install dependencies: `npm install mysql2/promise bcryptjs mongoose dotenv`
- [ ] Create `.env` with MySQL and MongoDB credentials
- [ ] Verify MySQL users table exists and is accessible
- [ ] Test database connections locally
- [ ] Review MySQL schema: `DESCRIBE users;`
- [ ] Run migration: `node migrate-users-mysql-to-mongo.js`
- [ ] Check results in migration output
- [ ] Run verification: `node verify-migration.js`
- [ ] Test user login with migrated account
- [ ] Backup MySQL data: `mysqldump ... > backup.sql`
- [ ] Update application code if needed
- [ ] Test full application workflow
- [ ] Keep MySQL backup for audit trail

## Support Matrix

| Feature | Status | Notes |
|---|---|---|
| User migration | ✅ Full | All user fields migrated |
| Password hashing | ✅ Automatic | bcrypt with salt rounds=10 |
| Duplicate detection | ✅ Email+ID | Skips already-migrated users |
| Error handling | ✅ Comprehensive | Logs errors, continues migration |
| Verification | ✅ Detailed | Compares counts, samples, roles |
| Rollback | ⚠️ Manual | Requires database edits |
| Supervisor account | ✅ Special handling | ronald account preserved |
| Timestamps | ✅ Preserved | createdAt, updatedAt set |

## Migration Statistics

After successful migration, you should see:

```
📊 Results:
   ✅ Successfully migrated: [count]  # Users added to MongoDB
   ❌ Errors: [count]                 # Failed users (if any)
   📈 Total processed: [count]        # Total from MySQL
```

**Success Rate:** (Successfully migrated / Total processed) × 100%

Performance: ~100-200 users per second depending on hardware.

## Next Steps

Once users are successfully migrated to MongoDB:

1. **Monitor application** for any user-related errors
2. **Run automated tests** on authentication endpoints
3. **Test all user roles** (admin, manager, sales, engineer)
4. **Verify report generation** if users have team associations
5. **Audit user activities** if needed
6. **Archive MySQL data** (keep as backup, don't delete)

## Contact

For issues or questions about the migration:
- Check `.env` configuration
- Review MySQL table structure
- Check MongoDB connection
- Review migration logs
- Run verification script

---

**Last Updated:** March 19, 2026
**Version:** 1.0
**Status:** Production Ready
