#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import mongoose from 'mongoose';
import logger from '../project/src/utils/logger.js';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Please set MONGODB_URI in your environment before running this script.');
  process.exit(1);
}

// Look for the sample file in a few likely locations (repo-root or project/ cwd)
const candidatePaths = [
  path.resolve(process.cwd(), 'project/src/data/facilities.sample.json'),
  path.resolve(process.cwd(), 'project/scripts/facilities.sample.json'),
  path.resolve(process.cwd(), 'src/data/facilities.sample.json'),
  path.resolve(process.cwd(), 'scripts/facilities.sample.json'),
];

let file;
for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    file = p;
    break;
  }
}

if (!file) {
  console.error('Sample facilities file not found. Checked paths:', candidatePaths.join(', '));
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));


const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected!');
    console.log('Sample file:', file);
    console.log('Sample contains', Array.isArray(data) ? data.length : (data.features?.length || 0), 'facilities');
    const Facility = (await import('../project/src/models/Facility.js')).default;
    const res = await Facility.insertMany(data, { ordered: false });
    console.log(`Inserted ${res.length} facilities`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding facilities:', err);
    process.exit(1);
  }
};

run();
