import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://accord1:Rkx5j3IwOXe0S8j0@cluster0.vn6ne8w.mongodb.net/accord_medical';

async function dropIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const indexes = await mongoose.connection.collection('visits').getIndexes();
    console.log('\n📋 Current indexes:', Object.keys(indexes));
    
    // Try to drop the problematic geo index
    try {
      await mongoose.connection.collection('visits').dropIndex('client.location_2dsphere');
      console.log('\n✅ Successfully dropped client.location_2dsphere index');
    } catch (err) {
      if (err.code === 27 || err.message.includes('index not found')) {
        console.log('\nℹ️  Index client.location_2dsphere does not exist (already dropped)');
      } else {
        console.error('\n❌ Error dropping index:', err.message);
      }
    }
    
    const newIndexes = await mongoose.connection.collection('visits').getIndexes();
    console.log('\n📋 Remaining indexes:', Object.keys(newIndexes));
    console.log('\n✅ Done!');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dropIndex();
