#!/usr/bin/env node

/**
 * Seed engineering services to database
 * Updates engineer IDs and seeds data to MongoDB
 */

import 'dotenv/config';
import connectDB from '../src/config/database.js';
import EngineeringService from '../src/models/EngineeringService.js';
import fs from 'fs';
import logger from '../src/utils/logger.js';

// Engineer ID mappings
const engineerMapping = {
  '691c275382964eefbe215b39': '69981a994800494f726890b1', // willimon Tirop
  '691c061382964eefbe21548b': '69a7e284a93fe2dc953d6da7', // JAMES ODWOR
  '6977128ba2f90381cce5eb03': '69a7e284a93fe2dc953d6da7', // James Odwor
  '696f238f7688f3b154304107': '69981a994800494f726890b1'  // Willimon Tirop
};

console.log('\n🔧 Engineering Services Database Seeder');
console.log('='.repeat(50));

async function main() {
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    // Read data file
    console.log('\n📂 Reading data file...');
    const dataPath = new URL('../../dataeng.json', import.meta.url).pathname;
    const rawData = fs.readFileSync(dataPath, 'utf8');
    let data = JSON.parse(rawData);

    console.log(`✅ Loaded ${data.length} engineering service records`);

    // Update engineer IDs
    console.log('\n🔄 Updating engineer IDs...');
    data = data.map(service => {
      if (service.engineerInCharge && service.engineerInCharge._id) {
        const oldId = service.engineerInCharge._id.$oid;
        const newId = engineerMapping[oldId];
        if (newId) {
          console.log(`  ✓ ${service.engineerInCharge.name}: ${oldId} → ${newId}`);
          service.engineerInCharge._id.$oid = newId;
        }
      }
      return service;
    });

    // Convert data format for MongoDB
    const formattedData = data.map(doc => ({
      userId: doc.userId?.$oid,
      date: doc.date?.$date ? new Date(doc.date.$date) : new Date(),
      facility: doc.facility,
      serviceType: doc.serviceType,
      machineDetails: doc.machineDetails,
      machineId: doc.machineId?.$oid,
      conditionBefore: doc.conditionBefore,
      conditionAfter: doc.conditionAfter,
      otherPersonnel: doc.otherPersonnel || [],
      engineerInCharge: doc.engineerInCharge ? {
        _id: doc.engineerInCharge._id?.$oid,
        name: doc.engineerInCharge.name,
        phone: doc.engineerInCharge.phone || ''
      } : {},
      status: doc.status,
      scheduledDate: doc.scheduledDate?.$date ? new Date(doc.scheduledDate.$date) : null,
      notes: doc.notes,
      nextServiceDate: doc.nextServiceDate?.$date ? new Date(doc.nextServiceDate.$date) : null,
      syncedAt: doc.syncedAt?.$date ? new Date(doc.syncedAt.$date) : new Date(),
      metadata: doc.metadata || {},
      createdAt: doc.createdAt?.$date ? new Date(doc.createdAt.$date) : new Date(),
      updatedAt: doc.updatedAt?.$date ? new Date(doc.updatedAt.$date) : new Date()
    }));

    // Clear existing data (optional - comment out if you want to keep existing)
    console.log('\n🗑️  Clearing existing engineering services...');
    const deleteResult = await EngineeringService.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing records`);

    // Seed data
    console.log('\n📝 Seeding data to database...');
    const result = await EngineeringService.insertMany(formattedData);
    console.log(`✅ Inserted ${result.length} engineering service records`);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Seed Summary:');
    console.log(`Total records: ${formattedData.length}`);
    console.log(`Engineer: Willimon Tirop (ID: 69981a994800494f726890b1)`);
    console.log(`Engineer: James Odwor (ID: 69a7e284a93fe2dc953d6da7)`);
    console.log('='.repeat(50));
    console.log('✅ Seeding complete!');

  } catch (error) {
    logger.error('Error in seeding script:', error);
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
