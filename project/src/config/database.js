import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    // Read and sanitize URI
    let uri = process.env.MONGODB_URI;
    if (typeof uri === 'string') uri = uri.trim();

    // If someone pasted the URI wrapped in angle brackets (<...>) or with stray chars, try to clean it
    if (uri && (/^<.*>$/.test(uri) || uri.includes('<') || uri.includes('>'))) {
      const cleaned = String(uri).replace(/^<|>$/g, '').trim();
      logger.warn('MONGODB_URI appears to contain angle brackets or unexpected characters; attempting to clean it.');
      uri = cleaned;
    }

    if (!uri || typeof uri !== 'string' || uri.trim() === '') {
      logger.error('MONGODB_URI is not set. Please set MONGODB_URI in your environment or .env file.');
      // Fail fast with a helpful message instead of passing undefined to mongoose
      process.exit(1);
    }

    // Provide a masked preview of the host for easier debugging (don't log credentials)
    try {
      const m = String(uri).match(/^mongodb(?:\+srv)?:\/\/([^/]+)/);
      let hostPreview = m ? m[1] : 'unknown';
      // mask credentials if present
      hostPreview = hostPreview.replace(/^[^@]+@/, '****@');
      logger.info(`Connecting to MongoDB host: ${hostPreview}`);
    } catch (e) {
      // ignore preview errors
    }

    const conn = await mongoose.connect(uri);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Create indexes for better performance
    await createIndexes();
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    // User indexes
    await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.collection('users').createIndex({ employeeId: 1 }, { unique: true });
    
    // Trail indexes
    await mongoose.connection.collection('trails').createIndex({ userId: 1, date: -1 });
    await mongoose.connection.collection('trails').createIndex({ 'path': '2dsphere' });
    
    // Visit indexes
    await mongoose.connection.collection('visits').createIndex({ userId: 1, date: -1 });
    // Removed 2dsphere index - client.location is now a string, not coordinates
    await mongoose.connection.collection('visits').createIndex({ 'client.type': 1 });
    
    // Order indexes
    await mongoose.connection.collection('orders').createIndex({ userId: 1, status: 1, createdAt: -1 });
    
    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
  }
};

export default connectDB;