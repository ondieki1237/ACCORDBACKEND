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

// Data retention period (60 days)
const RETENTION_DAYS = 60;

// Collections to sync
const COLLECTIONS_TO_SYNC = [
  'users',
  'visits',
  'reports',
  'leads',
  'quotations',
  'machines',
  'facilities',
  'orders',
  'consumables',
  'engineeringrequests',
  'engineeringservices',
  'calllogs',
  'appupdates',
  'manufacturers',
  'documentcategories',
  'machinedocuments'
];

// Convert MongoDB document to MySQL-safe format
function sanitizeForMySQL(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 19).replace('T', ' ');
  if (typeof value === 'object') {
    if (value._id) value._id = value._id.toString();
    return JSON.stringify(value);
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value;
}

// Create MySQL table schema from MongoDB documents
function inferMySQLSchema(collectionName, sampleDocs) {
  const fields = new Map();
  
  // Core fields for backup system
  fields.set('id', 'INT AUTO_INCREMENT PRIMARY KEY');
  fields.set('mongo_id', 'VARCHAR(24) UNIQUE');
  fields.set('is_deleted', 'TINYINT(1) DEFAULT 0');
  fields.set('deleted_at', 'DATETIME DEFAULT NULL');
  
  // Analyze sample documents to infer schema
  for (const doc of sampleDocs) {
    for (const [key, value] of Object.entries(doc)) {
      if (key === '_id') continue;
      if (fields.has(key)) continue;
      
      let fieldType = 'TEXT';
      if (typeof value === 'number') {
        fieldType = Number.isInteger(value) ? 'BIGINT' : 'DECIMAL(15,2)';
      } else if (typeof value === 'boolean') {
        fieldType = 'TINYINT(1)';
      } else if (value instanceof Date) {
        fieldType = 'DATETIME';
      } else if (typeof value === 'string') {
        if (value.length <= 255) fieldType = 'VARCHAR(255)';
        else if (value.length <= 65535) fieldType = 'TEXT';
        else fieldType = 'LONGTEXT';
      } else if (typeof value === 'object') {
        fieldType = 'JSON';
      }
      
      fields.set(key.replace(/\./g, '_'), fieldType);
    }
  }
  
  // Add common timestamp fields
  if (!fields.has('createdAt')) fields.set('createdAt', 'DATETIME');
  if (!fields.has('updatedAt')) fields.set('updatedAt', 'DATETIME');
  fields.set('synced_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
  
  return fields;
}

// Flatten nested objects
function flattenDocument(doc, prefix = '') {
  const result = {};
  
  for (const [key, value] of Object.entries(doc)) {
    const newKey = prefix ? `${prefix}_${key}` : key;
    
    if (key === '_id') {
      result.mongo_id = value.toString();
    } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(result, flattenDocument(value, newKey));
    } else {
      result[newKey.replace(/\./g, '_')] = sanitizeForMySQL(value);
    }
  }
  
  return result;
}

async function syncCollection(mongoDb, mysqlConn, collectionName) {
  console.log(`\n📦 Syncing collection: ${collectionName}`);
  const tableName = `mongo_${collectionName}`;
  
  try {
    // Get all documents from MongoDB
    const mongoDocs = await mongoDb.collection(collectionName).find({}).toArray();
    console.log(`   Found ${mongoDocs.length} documents in MongoDB`);
    
    // Get current MongoDB IDs
    const mongoIds = new Set(mongoDocs.map(doc => doc._id.toString()));
    
    // Check if table exists
    const [tables] = await mysqlConn.execute(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [MYSQL_CONFIG.database, tableName]
    );
    
    const tableExists = tables.length > 0;
    
    if (mongoDocs.length === 0 && !tableExists) {
      console.log(`   ⏭️  Skipping empty collection (no table exists)`);
      return { collection: collectionName, synced: 0, deleted: 0, skipped: true };
    }
    
    // If table exists, handle deletions first
    let deletedCount = 0;
    if (tableExists) {
      // Get all active (non-deleted) MySQL records
      const [mysqlRecords] = await mysqlConn.execute(
        `SELECT mongo_id FROM ${tableName} WHERE is_deleted = 0`
      );
      
      // Find records that exist in MySQL but not in MongoDB (deleted from MongoDB)
      for (const record of mysqlRecords) {
        if (!mongoIds.has(record.mongo_id)) {
          // Mark as deleted (soft delete)
          await mysqlConn.execute(
            `UPDATE ${tableName} SET is_deleted = 1, deleted_at = NOW() WHERE mongo_id = ?`,
            [record.mongo_id]
          );
          deletedCount++;
        }
      }
      
      if (deletedCount > 0) {
        console.log(`   🗑️  Marked ${deletedCount} records as deleted (recoverable for ${RETENTION_DAYS} days)`);
      }
      
      // Purge records deleted more than RETENTION_DAYS ago
      const [purgeResult] = await mysqlConn.execute(
        `DELETE FROM ${tableName} WHERE is_deleted = 1 AND deleted_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [RETENTION_DAYS]
      );
      
      if (purgeResult.affectedRows > 0) {
        console.log(`   🧹 Purged ${purgeResult.affectedRows} records older than ${RETENTION_DAYS} days`);
      }
    }
    
    if (mongoDocs.length === 0) {
      return { collection: collectionName, synced: 0, deleted: deletedCount, skipped: false };
    }
    
    // Infer schema from sample documents
    const sampleSize = Math.min(100, mongoDocs.length);
    const sampleDocs = mongoDocs.slice(0, sampleSize);
    const schema = inferMySQLSchema(collectionName, sampleDocs);
    
    // Create or update table
    if (!tableExists) {
      const columnDefs = Array.from(schema.entries())
        .map(([name, type]) => `\`${name}\` ${type}`)
        .join(',\n  ');
      
      const createSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${columnDefs}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;
      await mysqlConn.execute(createSQL);
      console.log(`   ✅ Created table: ${tableName}`);
    } else {
      // Add any missing columns
      const [existingColumns] = await mysqlConn.execute(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [MYSQL_CONFIG.database, tableName]
      );
      const existingColumnNames = new Set(existingColumns.map(c => c.COLUMN_NAME));
      
      for (const [colName, colType] of schema.entries()) {
        if (!existingColumnNames.has(colName) && colName !== 'id') {
          try {
            await mysqlConn.execute(`ALTER TABLE ${tableName} ADD COLUMN \`${colName}\` ${colType}`);
          } catch (e) {
            // Column might already exist with different case
          }
        }
      }
      
      // Ensure is_deleted and deleted_at columns exist
      if (!existingColumnNames.has('is_deleted')) {
        await mysqlConn.execute(`ALTER TABLE ${tableName} ADD COLUMN is_deleted TINYINT(1) DEFAULT 0`);
      }
      if (!existingColumnNames.has('deleted_at')) {
        await mysqlConn.execute(`ALTER TABLE ${tableName} ADD COLUMN deleted_at DATETIME DEFAULT NULL`);
      }
    }
    
    // Insert/Update documents using UPSERT
    let insertedCount = 0;
    let updatedCount = 0;
    const batchSize = 100;
    
    for (let i = 0; i < mongoDocs.length; i += batchSize) {
      const batch = mongoDocs.slice(i, i + batchSize);
      
      for (const doc of batch) {
        const flatDoc = flattenDocument(doc);
        flatDoc.is_deleted = 0;
        flatDoc.deleted_at = null;
        
        const columns = Object.keys(flatDoc).filter(k => schema.has(k) || k === 'is_deleted' || k === 'deleted_at');
        const values = columns.map(k => flatDoc[k]);
        const placeholders = columns.map(() => '?').join(', ');
        const updateClauses = columns
          .filter(k => k !== 'id' && k !== 'mongo_id')
          .map(k => `\`${k}\` = VALUES(\`${k}\`)`)
          .join(', ');
        
        const sql = `INSERT INTO ${tableName} (\`${columns.join('`, `')}\`) 
                     VALUES (${placeholders})
                     ON DUPLICATE KEY UPDATE ${updateClauses}`;
        
        try {
          const [result] = await mysqlConn.execute(sql, values);
          if (result.affectedRows === 1) {
            insertedCount++;
          } else if (result.affectedRows === 2) {
            updatedCount++;
          }
        } catch (err) {
          // Log but continue
          if (!err.message.includes('Duplicate entry')) {
            // Silently skip constraint errors
          }
        }
      }
      
      process.stdout.write(`\r   📥 Processed ${Math.min(i + batchSize, mongoDocs.length)}/${mongoDocs.length} documents`);
    }
    
    console.log(`\n   ✅ Inserted: ${insertedCount}, Updated: ${updatedCount}, Soft-deleted: ${deletedCount}`);
    
    return { 
      collection: collectionName, 
      synced: insertedCount + updatedCount,
      inserted: insertedCount,
      updated: updatedCount,
      deleted: deletedCount
    };
    
  } catch (err) {
    console.error(`\n   ❌ Error syncing ${collectionName}: ${err.message}`);
    return { collection: collectionName, error: err.message };
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     MongoDB → MySQL Backup Sync (with Recovery Support)      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`Retention period: ${RETENTION_DAYS} days\n`);
  
  let mongoConn = null;
  let mysqlConn = null;
  
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    mongoConn = mongoose.connection;
    console.log('✅ Connected to MongoDB\n');
    
    // Connect to MySQL
    console.log('🔗 Connecting to MySQL...');
    mysqlConn = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅ Connected to MySQL\n');
    
    // Create backup metadata table
    await mysqlConn.execute(`
      CREATE TABLE IF NOT EXISTS backup_metadata (
        id INT AUTO_INCREMENT PRIMARY KEY,
        backup_date DATETIME NOT NULL,
        collections_synced INT DEFAULT 0,
        total_documents INT DEFAULT 0,
        total_deleted INT DEFAULT 0,
        total_purged INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'running',
        error_message TEXT,
        completed_at DATETIME
      )
    `);
    
    // Create recovery log table
    await mysqlConn.execute(`
      CREATE TABLE IF NOT EXISTS recovery_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        collection_name VARCHAR(100) NOT NULL,
        mongo_id VARCHAR(24) NOT NULL,
        recovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        recovered_by VARCHAR(255),
        status VARCHAR(50) DEFAULT 'recovered'
      )
    `);
    
    // Start backup record
    const [metaResult] = await mysqlConn.execute(
      'INSERT INTO backup_metadata (backup_date, status) VALUES (NOW(), ?)',
      ['running']
    );
    const backupId = metaResult.insertId;
    
    // Sync each collection
    const results = [];
    let totalDocs = 0;
    let totalDeleted = 0;
    
    for (const collection of COLLECTIONS_TO_SYNC) {
      const result = await syncCollection(mongoConn.db, mysqlConn, collection);
      results.push(result);
      if (result.synced) totalDocs += result.synced;
      if (result.deleted) totalDeleted += result.deleted;
    }
    
    // Update backup metadata
    await mysqlConn.execute(
      'UPDATE backup_metadata SET status = ?, collections_synced = ?, total_documents = ?, total_deleted = ?, completed_at = NOW() WHERE id = ?',
      ['completed', results.filter(r => !r.error).length, totalDocs, totalDeleted, backupId]
    );
    
    // Print summary
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                      SYNC SUMMARY                             ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`Collections synced: ${results.filter(r => !r.error && !r.skipped).length}`);
    console.log(`Collections skipped: ${results.filter(r => r.skipped).length}`);
    console.log(`Collections failed: ${results.filter(r => r.error).length}`);
    console.log(`Total documents synced: ${totalDocs}`);
    console.log(`Total soft-deleted (recoverable): ${totalDeleted}`);
    console.log(`Retention period: ${RETENTION_DAYS} days`);
    console.log(`Completed at: ${new Date().toISOString()}`);
    
    // Log any errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.log('\n⚠️  Errors:');
      errors.forEach(e => console.log(`   - ${e.collection}: ${e.error}`));
    }
    
  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    console.error('Full error:', err);
    
    if (mysqlConn) {
      try {
        await mysqlConn.execute(
          'UPDATE backup_metadata SET status = ?, error_message = ?, completed_at = NOW() WHERE status = ?',
          ['failed', err.message, 'running']
        );
      } catch (updateErr) {
        // Ignore update errors during fatal error
      }
    }
    
    process.exit(1);
  } finally {
    if (mongoConn) await mongoose.disconnect();
    if (mysqlConn) await mysqlConn.end();
    console.log('\n🔌 Connections closed');
  }
}

main();
