import mongoose from 'mongoose';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
  
  // Always have _id and mongo_id
  fields.set('id', 'INT AUTO_INCREMENT PRIMARY KEY');
  fields.set('mongo_id', 'VARCHAR(24) UNIQUE');
  
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
  fields.set('synced_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
  
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
      // Flatten nested objects one level
      Object.assign(result, flattenDocument(value, newKey));
    } else {
      result[newKey.replace(/\./g, '_')] = sanitizeForMySQL(value);
    }
  }
  
  return result;
}

async function syncCollection(mongoDb, mysqlConn, collectionName) {
  console.log(`\n📦 Syncing collection: ${collectionName}`);
  
  try {
    // Get all documents from MongoDB
    const docs = await mongoDb.collection(collectionName).find({}).toArray();
    console.log(`   Found ${docs.length} documents`);
    
    if (docs.length === 0) {
      console.log(`   ⏭️  Skipping empty collection`);
      return { collection: collectionName, synced: 0, skipped: true };
    }
    
    // Infer schema from sample documents
    const sampleSize = Math.min(100, docs.length);
    const sampleDocs = docs.slice(0, sampleSize);
    const schema = inferMySQLSchema(collectionName, sampleDocs);
    
    // Create/recreate table
    const tableName = `mongo_${collectionName}`;
    
    // Drop existing table
    await mysqlConn.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
    
    // Create table
    const columns = Array.from(schema.entries())
      .map(([name, type]) => `\`${name}\` ${type}`)
      .join(',\n  ');
    
    const createTableSQL = `CREATE TABLE \`${tableName}\` (\n  ${columns}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
    
    await mysqlConn.execute(createTableSQL);
    console.log(`   ✅ Created table: ${tableName}`);
    
    // Insert documents in batches
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      
      for (const doc of batch) {
        const flatDoc = flattenDocument(doc);
        
        // Get columns that exist in both schema and document
        const docColumns = Object.keys(flatDoc).filter(k => schema.has(k) || k === 'mongo_id');
        const values = docColumns.map(k => flatDoc[k]);
        
        if (docColumns.length > 0) {
          const placeholders = docColumns.map(() => '?').join(', ');
          const columnNames = docColumns.map(c => `\`${c}\``).join(', ');
          
          try {
            await mysqlConn.execute(
              `INSERT INTO \`${tableName}\` (${columnNames}) VALUES (${placeholders})`,
              values
            );
            inserted++;
          } catch (insertErr) {
            // Skip duplicate or invalid records
            if (!insertErr.message.includes('Duplicate')) {
              console.error(`   ⚠️  Insert error for doc ${doc._id}: ${insertErr.message}`);
            }
          }
        }
      }
      
      process.stdout.write(`\r   📥 Inserted ${inserted}/${docs.length} documents`);
    }
    
    console.log(`\n   ✅ Synced ${inserted} documents to ${tableName}`);
    return { collection: collectionName, synced: inserted, total: docs.length };
    
  } catch (err) {
    console.error(`   ❌ Error syncing ${collectionName}: ${err.message}`);
    return { collection: collectionName, error: err.message };
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        MongoDB → MySQL Daily Backup Sync                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
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
        status VARCHAR(50) DEFAULT 'running',
        error_message TEXT,
        completed_at DATETIME
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
    
    for (const collection of COLLECTIONS_TO_SYNC) {
      const result = await syncCollection(mongoConn.db, mysqlConn, collection);
      results.push(result);
      if (result.synced) totalDocs += result.synced;
    }
    
    // Update backup metadata
    await mysqlConn.execute(
      'UPDATE backup_metadata SET status = ?, collections_synced = ?, total_documents = ?, completed_at = NOW() WHERE id = ?',
      ['completed', results.filter(r => !r.error).length, totalDocs, backupId]
    );
    
    // Print summary
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                      SYNC SUMMARY                             ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`Collections synced: ${results.filter(r => !r.error && !r.skipped).length}`);
    console.log(`Collections skipped: ${results.filter(r => r.skipped).length}`);
    console.log(`Collections failed: ${results.filter(r => r.error).length}`);
    console.log(`Total documents: ${totalDocs}`);
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
