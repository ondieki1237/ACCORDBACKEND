
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Visit from '../models/Visit.js';
import connectDB from '../config/database.js';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const transferVisits = async () => {
    try {
        const oldUserId = '696484101b37f2200e0fc2ab';
        const newUserId = '698d7a9cd467e634528bb4e7';

        // Patch MONGODB_URI to use specific database
        if (process.env.MONGODB_URI) {
            let uri = process.env.MONGODB_URI.replace('>', ''); // Remove typo
            const dbName = 'accord_medical'; // Target DB

            if (!uri.includes(dbName)) {
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

        // Verify databases to be sure
        try {
            const admin = mongoose.connection.db.admin();
            const result = await admin.listDatabases();
            console.log('Available Databases:', result.databases.map(db => db.name).join(', '));
            console.log('Current Database:', mongoose.connection.db.databaseName);
        } catch (e) {
            console.warn('Could not list databases:', e.message);
        }

        console.log(`Transferring visits from ${oldUserId} to ${newUserId}...`);

        const result = await Visit.updateMany(
            { userId: oldUserId },
            { $set: { userId: newUserId } }
        );

        console.log('Operation Result:', result);
        console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

transferVisits();
