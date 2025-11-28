import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

async function verifyAdmin() {
    try {
        console.log('Connecting to MongoDB...');
        // Mask the password in the log
        const uri = process.env.MONGODB_URI || '';
        const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
        console.log(`URI: ${maskedUri}`);

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const email = 'bellarinseth@gmail.com';
        const admin = await User.findOne({ email });

        if (admin) {
            console.log('FOUND ADMIN USER:');
            console.log(JSON.stringify(admin.toJSON(), null, 2));
        } else {
            console.log('ADMIN USER NOT FOUND with email:', email);

            // List all users to see what's there
            const allUsers = await User.find({}, 'email role firstName lastName');
            console.log(`Total users found: ${allUsers.length}`);
            if (allUsers.length > 0) {
                console.log('Existing users:', JSON.stringify(allUsers, null, 2));
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Error verifying admin:', err);
        process.exit(1);
    }
}

verifyAdmin();
