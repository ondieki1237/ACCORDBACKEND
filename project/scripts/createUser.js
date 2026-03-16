import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import logger from '../src/utils/logger.js';

const createUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // User data
    const userData = {
      employeeId: `TELE-${Date.now() % 10000}`, // Generate unique employee ID
      firstName: 'Leah',
      lastName: 'Nganga',
      email: 'telesales@accordmedical.co.ke',
      password: 'telesales@2026',
      role: 'admin',
      department: 'sales',
      region: 'National',
      phone: '',
      isActive: true
    };

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: userData.email }
      ]
    });

    if (existingUser) {
      console.log('❌ User with this email already exists');
      console.log('Existing user:', {
        id: existingUser._id,
        name: `${existingUser.firstName} ${existingUser.lastName}`,
        email: existingUser.email,
        role: existingUser.role
      });
      await mongoose.connection.close();
      process.exit(1);
    }

    // Create new user
    const newUser = new User(userData);
    await newUser.save();

    console.log('✅ User created successfully!');
    console.log('\n📋 User Details:');
    console.log('─'.repeat(50));
    console.log(`Name: ${newUser.firstName} ${newUser.lastName}`);
    console.log(`Email: ${newUser.email}`);
    console.log(`Role: ${newUser.role}`);
    console.log(`User ID: ${newUser._id}`);
    console.log(`Active: ${newUser.isActive}`);
    console.log(`Created: ${newUser.createdAt}`);
    console.log('─'.repeat(50));

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(field => {
        console.error(`  - ${field}: ${error.errors[field].message}`);
      });
    }
    await mongoose.connection.close();
    process.exit(1);
  }
};

createUser();
