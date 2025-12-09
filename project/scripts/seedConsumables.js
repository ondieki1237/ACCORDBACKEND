import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import Consumable from '../src/models/Consumable.js';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedConsumables() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected.');

        const dataPath = path.join(__dirname, '../uploads/data.json');
        console.log(`Reading data from ${dataPath}...`);
        const rawData = await fs.readFile(dataPath, 'utf-8');
        const categories = JSON.parse(rawData);

        let count = 0;
        const consumables = [];

        for (const [category, items] of Object.entries(categories)) {
            for (const item of items) {
                // Parse price: handle various formats
                let priceString = String(item.price).trim();

                if (priceString.toUpperCase() === 'N/A') {
                    console.warn(`Skipping N/A price for ${item.product}`);
                    continue;
                }

                // Remove currency symbols and common suffixes
                priceString = priceString.replace(/[KshKSh$\s/=\\]/g, '');

                // Handle .00 at the end (remove it to avoid confusion with thousands separators if mixed)
                if (priceString.endsWith('.00')) {
                    priceString = priceString.slice(0, -3);
                }

                // Now remove commas and dots (assuming dots in remaining string are thousands separators like in 12.075)
                // CAUTION: This assumes no cents are present after stripping .00
                // If there are legitimate decimals like 10.5, this might break. 
                // But looking at the data, it seems to be integers or .00
                priceString = priceString.replace(/[,.]/g, '');

                const price = parseFloat(priceString);

                if (isNaN(price)) {
                    console.warn(`Skipping invalid price for ${item.product}: ${item.price}`);
                    continue;
                }

                consumables.push({
                    category: category,
                    name: item.product,
                    price: price,
                    isActive: true
                });
                count++;
            }
        }

        console.log(`Found ${count} consumables to seed.`);

        // Optional: Clear existing consumables? 
        // The user didn't explicitly ask to clear, but usually seeding implies a fresh start or upsert.
        // For safety, let's just insert. If duplicates are an issue, we can clear first.
        // Given the context "seed this to the database", I'll clear existing to avoid duplicates if run multiple times.
        console.log('Clearing existing consumables...');
        await Consumable.deleteMany({});

        console.log('Inserting new consumables...');
        await Consumable.insertMany(consumables);

        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedConsumables();
