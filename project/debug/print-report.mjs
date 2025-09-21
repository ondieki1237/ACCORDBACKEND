import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import ReportImport from '../src/models/Report.js';
const Report = ReportImport.default || ReportImport;
const id = process.argv[2] || '68cf697b35e22bbf8dc85da1';

async function run(){
  if(!process.env.MONGODB_URI && !process.env.MONGODB_URI_LOCAL){
    console.error('MONGODB_URI not set in environment. Load .env or export MONGODB_URI.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const r = await Report.findById(id).lean();
  if(!r){ console.log('Report not found:', id); await mongoose.disconnect(); process.exit(); }
  console.log('filePublicId:', r.filePublicId);
  console.log('fileUrl (secure_url present):', Boolean(r.fileUrl));
  console.log('fileName:', r.fileName);
  await mongoose.disconnect();
  process.exit();
}
run().catch(e=>{ console.error(e); process.exit(1); });