import 'dotenv/config';
import connectDB from '../config/database.js';
import AdminAction from '../models/AdminAction.js';

const run = async () => {
  await connectDB();
  const docs = await AdminAction.find().sort({ createdAt: -1 }).limit(10);
  console.log(JSON.stringify(docs, null, 2));
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
