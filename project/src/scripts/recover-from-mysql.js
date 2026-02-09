import mongoose from 'mongoose';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// MySQL Configuration
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  database: process.env.MYSQL_DATABASE || 'accordm_application',
  user: process.env.MYSQL_USER || 'accordm_app_user',
  password: process.env.MYSQL_PASSWORD || 'CMs8uyc]XVb;',
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  charset: 'utf8mb4'
};

// Collection to MongoDB model mapping
const COLLECTION_MAP = {
  'users': 'User',
  'visits': 'Visit',
  'reports': 'Report',
  'leads': 'Lead',
  'quotations': 'Quotation',
  'machines': 'Machine',
  'facilities': 'Facility',
  'orders': 'Order',
  'consumables': 'Consumable',
  'engineeringrequests': 'EngineeringRequest',
  'engineeringservices': 'EngineeringService',
  'calllogs': 'CallLog',
  'appupdates': 'AppUpdate',
  'manufacturers': 'Manufacturer',
  'documentcategories': 'DocumentCategory',
  'machinedocuments': 'MachineDocument'
};

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function getConnection() {
  const mysqlConn = await mysql.createConnection(MYSQL_CONFIG);
  await mongoose.connect(process.env.MONGODB_URI);
  return { mysqlConn, mongoConn: mongoose.connection };
}

async function listDeleted(collectionName = null) {
  const { mysqlConn } = await getConnection();
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║              DELETED RECORDS (Recoverable)                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Get all tables with deleted records
    const [tables] = await mysqlConn.execute(
      `SELECT TABLE_NAME FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'mongo_%'`,
      [MYSQL_CONFIG.database]
    );
    
    let totalDeleted = 0;
    
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      const collection = tableName.replace('mongo_', '');
      
      if (collectionName && collection !== collectionName) continue;
      
      // Check if table has is_deleted column
      const [columns] = await mysqlConn.execute(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'is_deleted'`,
        [MYSQL_CONFIG.database, tableName]
      );
      
      if (columns.length === 0) continue;
      
      const [deleted] = await mysqlConn.execute(
        `SELECT mongo_id, deleted_at, 
                DATEDIFF(DATE_ADD(deleted_at, INTERVAL 60 DAY), NOW()) as days_remaining
         FROM ${tableName} 
         WHERE is_deleted = 1 
         ORDER BY deleted_at DESC`
      );
      
      if (deleted.length > 0) {
        console.log(`📦 ${collection.toUpperCase()} (${deleted.length} deleted)`);
        console.log('─'.repeat(60));
        
        for (const record of deleted) {
          const deletedDate = new Date(record.deleted_at).toLocaleDateString();
          console.log(`   ID: ${record.mongo_id}`);
          console.log(`   Deleted: ${deletedDate} | Days to recover: ${record.days_remaining}`);
          console.log('');
        }
        
        totalDeleted += deleted.length;
      }
    }
    
    if (totalDeleted === 0) {
      console.log('✅ No deleted records found.');
    } else {
      console.log('─'.repeat(60));
      console.log(`Total recoverable records: ${totalDeleted}`);
    }
    
  } finally {
    await mysqlConn.end();
    await mongoose.disconnect();
  }
}

async function recoverRecord(collectionName, mongoId) {
  const { mysqlConn, mongoConn } = await getConnection();
  const tableName = `mongo_${collectionName}`;
  
  console.log(`\n🔄 Recovering ${mongoId} from ${collectionName}...\n`);
  
  try {
    // Get the deleted record from MySQL
    const [records] = await mysqlConn.execute(
      `SELECT * FROM ${tableName} WHERE mongo_id = ? AND is_deleted = 1`,
      [mongoId]
    );
    
    if (records.length === 0) {
      console.log('❌ Record not found or not deleted.');
      return false;
    }
    
    const record = records[0];
    
    // Convert MySQL record back to MongoDB document format
    const mongoDoc = {};
    
    for (const [key, value] of Object.entries(record)) {
      // Skip MySQL-specific fields
      if (['id', 'mongo_id', 'is_deleted', 'deleted_at', 'synced_at'].includes(key)) continue;
      
      // Try to parse JSON fields
      if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
        try {
          mongoDoc[key] = JSON.parse(value);
        } catch {
          mongoDoc[key] = value;
        }
      } else {
        mongoDoc[key] = value;
      }
    }
    
    // Set the original _id
    mongoDoc._id = new mongoose.Types.ObjectId(mongoId);
    
    // Insert back into MongoDB
    const collection = mongoConn.db.collection(collectionName);
    
    // Check if document already exists
    const existing = await collection.findOne({ _id: mongoDoc._id });
    if (existing) {
      console.log('⚠️  Record already exists in MongoDB. Skipping...');
      return false;
    }
    
    await collection.insertOne(mongoDoc);
    
    // Mark as recovered in MySQL
    await mysqlConn.execute(
      `UPDATE ${tableName} SET is_deleted = 0, deleted_at = NULL WHERE mongo_id = ?`,
      [mongoId]
    );
    
    // Log recovery
    await mysqlConn.execute(
      `INSERT INTO recovery_log (collection_name, mongo_id, status) VALUES (?, ?, 'recovered')`,
      [collectionName, mongoId]
    );
    
    console.log('✅ Record recovered successfully!');
    console.log(`   Collection: ${collectionName}`);
    console.log(`   MongoDB ID: ${mongoId}`);
    
    return true;
    
  } catch (err) {
    console.error('❌ Recovery failed:', err.message);
    return false;
  } finally {
    await mysqlConn.end();
    await mongoose.disconnect();
  }
}

async function recoverAll(collectionName) {
  const { mysqlConn } = await getConnection();
  const tableName = `mongo_${collectionName}`;
  
  console.log(`\n🔄 Recovering all deleted records from ${collectionName}...\n`);
  
  try {
    const [deleted] = await mysqlConn.execute(
      `SELECT mongo_id FROM ${tableName} WHERE is_deleted = 1`
    );
    
    if (deleted.length === 0) {
      console.log('✅ No deleted records to recover.');
      return;
    }
    
    console.log(`Found ${deleted.length} records to recover.\n`);
    
    await mysqlConn.end();
    await mongoose.disconnect();
    
    let recovered = 0;
    let failed = 0;
    
    for (const record of deleted) {
      const success = await recoverRecord(collectionName, record.mongo_id);
      if (success) recovered++;
      else failed++;
    }
    
    console.log('\n─'.repeat(60));
    console.log(`Recovery complete: ${recovered} recovered, ${failed} failed`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    await mysqlConn.end();
    await mongoose.disconnect();
  }
}

async function showStats() {
  const { mysqlConn } = await getConnection();
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    BACKUP STATISTICS                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Get backup history
    const [backups] = await mysqlConn.execute(
      `SELECT * FROM backup_metadata ORDER BY backup_date DESC LIMIT 10`
    );
    
    console.log('📊 Recent Backups:');
    console.log('─'.repeat(60));
    
    for (const backup of backups) {
      const date = new Date(backup.backup_date).toLocaleString();
      console.log(`   ${date} - ${backup.status}`);
      console.log(`   Collections: ${backup.collections_synced}, Docs: ${backup.total_documents}, Deleted: ${backup.total_deleted || 0}`);
      console.log('');
    }
    
    // Get collection stats
    console.log('\n📦 Collection Statistics:');
    console.log('─'.repeat(60));
    
    const [tables] = await mysqlConn.execute(
      `SELECT TABLE_NAME FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'mongo_%'`,
      [MYSQL_CONFIG.database]
    );
    
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      
      // Check if has is_deleted column
      const [columns] = await mysqlConn.execute(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'is_deleted'`,
        [MYSQL_CONFIG.database, tableName]
      );
      
      let query = `SELECT COUNT(*) as total FROM ${tableName}`;
      if (columns.length > 0) {
        query = `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_deleted = 0 THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) as deleted
        FROM ${tableName}`;
      }
      
      const [stats] = await mysqlConn.execute(query);
      const stat = stats[0];
      
      const collection = tableName.replace('mongo_', '');
      if (columns.length > 0) {
        console.log(`   ${collection}: ${stat.active} active, ${stat.deleted} deleted (${stat.total} total)`);
      } else {
        console.log(`   ${collection}: ${stat.total} records`);
      }
    }
    
    // Recovery log
    const [recoveries] = await mysqlConn.execute(
      `SELECT COUNT(*) as total FROM recovery_log`
    );
    
    console.log(`\n📋 Total recoveries performed: ${recoveries[0].total}`);
    
  } finally {
    await mysqlConn.end();
    await mongoose.disconnect();
  }
}

function showHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           MySQL Backup Recovery Tool                          ║
╚══════════════════════════════════════════════════════════════╝

Usage: node recover-from-mysql.js <command> [options]

Commands:
  list [collection]           List all deleted records
  recover <collection> <id>   Recover a specific record by MongoDB ID
  recover-all <collection>    Recover all deleted records in a collection
  stats                       Show backup statistics
  help                        Show this help message

Collections:
  users, visits, reports, leads, quotations, machines,
  facilities, orders, consumables, engineeringrequests,
  engineeringservices, calllogs, appupdates, manufacturers,
  documentcategories, machinedocuments

Examples:
  node recover-from-mysql.js list
  node recover-from-mysql.js list users
  node recover-from-mysql.js recover users 507f1f77bcf86cd799439011
  node recover-from-mysql.js recover-all visits
  node recover-from-mysql.js stats
`);
}

// Main execution
async function main() {
  try {
    switch (command) {
      case 'list':
        await listDeleted(args[1]);
        break;
        
      case 'recover':
        if (!args[1] || !args[2]) {
          console.log('❌ Usage: node recover-from-mysql.js recover <collection> <mongo_id>');
          process.exit(1);
        }
        await recoverRecord(args[1], args[2]);
        break;
        
      case 'recover-all':
        if (!args[1]) {
          console.log('❌ Usage: node recover-from-mysql.js recover-all <collection>');
          process.exit(1);
        }
        await recoverAll(args[1]);
        break;
        
      case 'stats':
        await showStats();
        break;
        
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
