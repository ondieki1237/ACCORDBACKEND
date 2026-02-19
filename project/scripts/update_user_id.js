// Script to copy a user to a new _id in MongoDB
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const uri = process.env.MONGODB_URI.replace(/>$/, ''); // Remove trailing > if present
const dbName = uri.split('/').pop().split('?')[0] || 'accord_medical';

const OLD_ID = '6995c8781a706de48f1a7930';
const NEW_ID = '69661e60b5a681b7cf333cca';

async function run() {
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection('users');
    const user = await users.findOne({ _id: new ObjectId(OLD_ID) });
    if (!user) throw new Error('User not found');
    user._id = new ObjectId(NEW_ID);
    await users.insertOne(user);
    await users.deleteOne({ _id: new ObjectId(OLD_ID) });
    console.log('User _id updated successfully.');
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
