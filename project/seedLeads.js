import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lead from './src/models/Lead.js';
import User from './src/models/User.js';

dotenv.config();

const facilities = ['Nairobi General', 'Kisumu County Hospital', 'Mombasa Central', 'Eldoret Referral', 'Nyeri Mission', 'Kisii District'];
const equipmentNames = ['XRay 5000', 'UltraScan 3', 'EchoPro X', 'MediFrame 200', 'ScanMaster 7', 'TheraPulse'];
const statuses = ['new', 'contacted', 'qualified', 'proposal-sent', 'negotiation'];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
  try {
    const mongoUri = process.argv[2] || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Usage: node project/seedLeads.js <MONGODB_URI> OR set MONGODB_URI in environment/.env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get an admin user to use as createdBy
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('No admin user found. Please seed an admin user first (node project/seedAdmin.js)');
      process.exit(1);
    }
    console.log('Using admin user as creator:', adminUser.email);

    const bulk = [];
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());

    for (let i = 1; i <= 50; i++) {
      const facility = randomFrom(facilities);
      const equipment = randomFrom(equipmentNames);
      const status = randomFrom(statuses);

      const lead = {
        facilityName: facility,
        facilityType: 'hospital',
        location: facility.split(' ')[0], // e.g. "Nairobi" from "Nairobi General"
        contactPerson: {
          name: `Contact Person ${i}`,
          role: 'Procurement Manager',
          phone: `+2547${Math.floor(10000000 + Math.random() * 89999999)}`,
          email: `contact${i}@${facility.replace(/\s+/g, '').toLowerCase()}.org`
        },
        facilityDetails: {
          hospitalLevel: `level-${Math.ceil(Math.random() * 6)}`,
          currentEquipment: 'Legacy system'
        },
        equipmentOfInterest: {
          name: equipment,
          category: 'Medical Imaging',
          quantity: Math.ceil(Math.random() * 3)
        },
        budget: {
          amount: `${(Math.random() * 5000000 + 500000).toFixed(0)}`,
          currency: 'KES'
        },
        timeline: {
          expectedPurchaseDate: randomDate(now, new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())),
          urgency: randomFrom(['low', 'medium', 'high'])
        },
        competitorAnalysis: 'Evaluating multiple vendors',
        additionalInfo: {
          painPoints: 'Need modern equipment with warranty',
          notes: `Lead generated for ${facility}`
        },
        leadSource: randomFrom(['field-visit', 'phone-call', 'email', 'referral']),
        leadStatus: status,
        createdBy: adminUser._id,
        createdAt: randomDate(sixMonthsAgo, now)
      };

      bulk.push(lead);
    }

    const result = await Lead.insertMany(bulk, { ordered: false });
    console.log(`Inserted ${result.length} leads`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding leads:', err);
    process.exit(1);
  }
}

seed();
