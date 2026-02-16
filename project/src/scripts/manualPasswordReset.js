
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import connectDB from '../config/database.js';
import { sendEmail } from '../services/emailService.js';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const resetPassword = async () => {
    try {
        const email = 'omenyalucy65@gmail.com';
        // Generate a secure random password or use a fixed one for initial login
        const newPassword = 'Accord' + Math.random().toString(36).slice(-6) + '!';

        // Patch MONGODB_URI to use specific database
        if (process.env.MONGODB_URI) {
            let uri = process.env.MONGODB_URI.replace('>', ''); // Remove typo
            // Remove any existing DB name if present (heuristic)
            // Atlas URI usually: mongodb+srv://host/dbname?options
            // If no dbname, it's mongodb+srv://host/?options or just host/

            const dbName = 'accord_backend'; // Target DB

            if (!uri.includes(dbName)) {
                // Naive insertion: find where to insert DB name
                // If has query params
                if (uri.includes('?')) {
                    const parts = uri.split('?');
                    if (parts[0].endsWith('/')) {
                        uri = parts[0] + dbName + '?' + parts[1];
                    } else {
                        uri = parts[0] + '/' + dbName + '?' + parts[1];
                    }
                } else {
                    if (uri.endsWith('/')) {
                        uri = uri + dbName;
                    } else {
                        uri = uri + '/' + dbName;
                    }
                }
            }
            process.env.MONGODB_URI = uri;
            console.log('Modified URI to connect to:', dbName);
        }

        console.log('Connecting to MongoDB...');
        await connectDB();
        console.log('Connected.');

        // List databases
        try {
            const admin = mongoose.connection.db.admin();
            const result = await admin.listDatabases();
            console.log('Databases:', result.databases);
        } catch (err) {
            console.error('Error listing databases:', err.message);
        }

        const user = await User.findOne({ email });

        if (!user) {
            console.error(`User with email ${email} not found.`);

            // Fuzzy search by name
            const potentialUsers = await User.find({
                $or: [
                    { firstName: { $regex: 'lucy', $options: 'i' } },
                    { lastName: { $regex: 'omenya', $options: 'i' } },
                    { email: { $regex: 'omenya', $options: 'i' } }
                ]
            });

            if (potentialUsers.length > 0) {
                console.log('Did you mean one of these users?');
                potentialUsers.forEach(u => console.log(`- ${u.firstName} ${u.lastName} (${u.email})`));
            } else {
                console.log('No users found matching "Lucy" or "Omenya".');
                const allUsers = await User.find().select('email firstName lastName');
                console.log('All users:', allUsers.map(u => `${u.firstName} ${u.lastName} <${u.email}>`));
            }
            process.exit(1);
        }

        console.log(`Found user: ${user.firstName} ${user.lastName}`);

        // Update password
        user.password = newPassword;
        user.mustChangePassword = true; // Force change on next login
        await user.save();
        console.log('Password updated in database.');

        // Send email
        console.log('Sending email...');
        const loginUrl = process.env.CLIENT_URL || 'https://app.codewithseth.co.ke';

        const emailHtml = `
      <h2>Password Reset</h2>
      <p>Hello ${user.firstName},</p>
      <p>Your password has been manually reset by the administrator.</p>
      <p><strong>Your new password is:</strong> ${newPassword}</p>
      <p>Please login at: <a href="${loginUrl}">${loginUrl}</a></p>
      <p>You will be asked to change this password required upon login.</p>
      <p>Best regards,<br>Accord Medical Team</p>
    `;

        await sendEmail({
            to: email,
            subject: 'Your New Password - Accord Medical',
            data: { rawHtml: emailHtml }
        });

        console.log(`Email sent successfully to ${email}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

resetPassword();
