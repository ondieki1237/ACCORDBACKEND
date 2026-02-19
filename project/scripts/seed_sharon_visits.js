// Script to seed visits for Sharon in MongoDB
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '../project/.env' });

const uri = process.env.MONGODB_URI.replace(/>$/, ''); // Remove trailing > if present
const dbName = uri.split('/').pop().split('?')[0] || 'accord_medical';

import visits from '../../accord_medical.visits.json' assert { type: 'json' };

// Set the correct userId for all visits
const correctUserId = '6995c8781a706de48f1a7930';
visits.forEach(visit => {
  if (visit.userId && visit.userId.$oid) {
    visit.userId.$oid = correctUserId;
  }
});

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('visits');
    // Insert all visits
    for (const visit of visits) {
      // Convert $oid and $date fields to ObjectId and Date
      visit._id = new ObjectId(visit._id.$oid);
      visit.userId = new ObjectId(visit.userId.$oid);
      visit.date = new Date(visit.date.$date);
      visit.startTime = new Date(visit.startTime.$date);
      visit.syncedAt = new Date(visit.syncedAt.$date);
      visit.createdAt = new Date(visit.createdAt.$date);
      visit.updatedAt = new Date(visit.updatedAt.$date);
      if (visit.contacts) {
        for (const c of visit.contacts) {
          if (c._id) c._id = new ObjectId(c._id.$oid);
        }
      }
      if (visit.productsOfInterest) {
        for (const p of visit.productsOfInterest) {
          if (p._id) p._id = new ObjectId(p._id.$oid);
        }
      }
      if (visit.requestedEquipment) {
        for (const r of visit.requestedEquipment) {
          if (r._id) r._id = new ObjectId(r._id.$oid);
        }
      }
      await collection.updateOne({ _id: visit._id }, { $set: visit }, { upsert: true });
    }
    console.log('Visits seeded for Sharon.');
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
