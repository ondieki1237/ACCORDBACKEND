import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// User Schema (inline to avoid import issues)
const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'sales', 'engineer'],
    default: 'sales'
  },
  department: {
    type: String,
    enum: ['sales', 'marketing', 'technical', 'management', 'engineering'],
    required: false
  },
  phone: {
    type: String,
    trim: true
  },
  region: {
    type: String,
    required: true,
    trim: true
  },
  territory: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileImage: {
    type: String
  },
  lastLogin: {
    type: Date
  },
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '30d'
    }
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  targets: {
    monthly: {
      visits: { type: Number, default: 0 },
      orders: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 }
    },
    quarterly: {
      visits: { type: Number, default: 0 },
      orders: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'info@accordmedical.co.ke' });
    
    if (existingUser) {
      console.log('⚠️  User with email info@accordmedical.co.ke already exists');
      console.log('Updating existing user to super admin...');
      
      // Update existing user
      existingUser.role = 'admin';
      existingUser.department = 'management';
      existingUser.isActive = true;
      existingUser.password = '12345678'; // Will be hashed by pre-save hook
      
      await existingUser.save();
      console.log('✅ User updated successfully!');
      console.log('📧 Email: info@accordmedical.co.ke');
      console.log('🔑 Password: 12345678');
      console.log('👤 Role: admin (Super Admin)');
      console.log('🆔 Employee ID:', existingUser.employeeId);
    } else {
      // Create new super admin
      const superAdmin = new User({
        employeeId: 'ADMIN001',
        firstName: 'Super',
        lastName: 'Admin',
        email: 'info@accordmedical.co.ke',
        password: '12345678', // Will be hashed by pre-save hook
        role: 'admin',
        department: 'management',
        phone: '+254700000000',
        region: 'National',
        territory: 'All',
        isActive: true
      });

      await superAdmin.save();
      
      console.log('\n✅ Super Admin created successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email: info@accordmedical.co.ke');
      console.log('🔑 Password: 12345678');
      console.log('👤 Role: admin (Super Admin)');
      console.log('🆔 Employee ID: ADMIN001');
      console.log('📱 Phone: +254700000000');
      console.log('🌍 Region: National');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
}

// Run the function
createSuperAdmin();
