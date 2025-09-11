import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

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
    await mongoose.connection.collection('visits').createIndex({ 'client.location': '2dsphere' });
    await mongoose.connection.collection('visits').createIndex({ 'client.type': 1 });
    
    // Order indexes
    await mongoose.connection.collection('orders').createIndex({ userId: 1, status: 1, createdAt: -1 });
    
    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
  }
};

export default connectDB;