import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Machine from './src/models/Machine.js';

dotenv.config();

const manufacturers = ['Acme Med', 'MedEquip', 'HealthTech', 'Radiant Instruments', 'BioScan', 'Sterling Medical'];
const models = ['XRay 5000', 'UltraScan 3', 'EchoPro X', 'MediFrame 200', 'ScanMaster 7', 'TheraPulse'];
const versions = ['v1', 'v2', 'v3', 'v4'];
const facilities = ['Nairobi General', 'Kisumu County Hospital', 'Mombasa Central', 'Eldoret Referral', 'Nyeri Mission', 'Kisii District'];
const locations = ['Nairobi', 'Kisumu', 'Mombasa', 'Eldoret', 'Nyeri', 'Kisii'];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function makeSerial(i) {
  const t = Date.now().toString(36).toUpperCase();
  return `SN-${t}-${i}`;
}

async function seed() {
  try {
    const mongoUri = process.argv[2] || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Usage: node project/seedMachines.js <MONGODB_URI> OR set MONGODB_URI in environment/.env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const bulk = [];
    const now = new Date();
    const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());

    for (let i = 1; i <= 200; i++) {
      const manufacturer = randomFrom(manufacturers);
      const model = randomFrom(models);
      const version = randomFrom(versions);
      const facilityName = randomFrom(facilities);
      const location = locations[facilities.indexOf(facilityName)] || randomFrom(locations);

      const installedDate = randomDate(threeYearsAgo, now);
      const lastServicedAt = randomDate(installedDate, now);
      const nextServiceDue = new Date(lastServicedAt.getTime());
      nextServiceDue.setMonth(nextServiceDue.getMonth() + 6 + Math.floor(Math.random() * 12));

      const machine = {
        serialNumber: makeSerial(i),
        model,
        manufacturer,
        version,
        facility: {
          name: facilityName,
          level: `level-${Math.ceil(Math.random() * 6)}`,
          location
        },
        contactPerson: {
          name: `Contact ${i}`,
          role: 'Biomedical Engineer',
          phone: `+2547${Math.floor(10000000 + Math.random() * 89999999)}`,
          email: `contact${i}@${facilityName.replace(/\s+/g, '').toLowerCase()}.org`
        },
        installedDate,
        purchaseDate: new Date(installedDate.getTime() - (1000 * 60 * 60 * 24 * (30 * (1 + Math.floor(Math.random() * 12))))),
        warrantyExpiry: new Date(installedDate.getTime() + (1000 * 60 * 60 * 24 * (365 * (1 + Math.floor(Math.random() * 3))))),
        lastServicedAt,
        nextServiceDue,
        status: Math.random() < 0.95 ? 'active' : (Math.random() < 0.5 ? 'maintenance' : 'inactive')
      };

      bulk.push(machine);
    }

    const result = await Machine.insertMany(bulk, { ordered: false });
    console.log(`Inserted ${result.length} machines`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding machines:', err);
    process.exit(1);
  }
}

seed();
