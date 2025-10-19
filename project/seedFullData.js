/**
 * Comprehensive Data Seeder for ACCORD Medical
 * Generates realistic dummy data for 25 users with complete records
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import User from './src/models/User.js';
import Visit from './src/models/Visit.js';
import Order from './src/models/Order.js';
import Trail from './src/models/Trail.js';
import Quotation from './src/models/Quotation.js';
import Product from './src/models/Product.js';
import Communication from './src/models/Communication.js';
import Report from './src/models/Report.js';
import EngineeringService from './src/models/EngineeringService.js';
import Sale from './src/models/Sale.js';
import FollowUp from './src/models/FollowUp.js';

// Utility functions
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const randomElement = (arr) => arr[randomInt(0, arr.length - 1)];

// Data arrays
const regions = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Kiambu', 'Machakos'];
const counties = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Uasin Gishu', 'Kiambu', 'Machakos', 'Kajiado'];
const facilityTypes = ['Hospital', 'Clinic', 'Health Center', 'Dispensary', 'Medical Center'];
const facilityNames = [
  'Kenyatta National Hospital', 'Aga Khan Hospital', 'Nairobi Hospital', 'MP Shah Hospital',
  'Gertrude Children Hospital', 'Mater Hospital', 'Avenue Healthcare', 'Karen Hospital',
  'Coptic Hospital', 'Chiromo Hospital', 'Coast General Hospital', 'Jaramogi Oginga Odinga Hospital',
  'Nakuru Level 5 Hospital', 'Moi Teaching Hospital', 'Thika Level 5 Hospital',
  'Machakos Level 5 Hospital', 'Kiambu Level 5 Hospital', 'Kisii Teaching Hospital',
  'Embu Level 5 Hospital', 'Nyeri County Hospital'
];

const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Mary', 'James', 'Patricia', 
  'Robert', 'Jennifer', 'William', 'Linda', 'Richard', 'Elizabeth', 'Joseph', 'Susan',
  'Thomas', 'Jessica', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Margaret', 'Matthew'];

const lastNames = ['Kamau', 'Wanjiku', 'Omondi', 'Achieng', 'Kipchoge', 'Chebet', 'Mwangi', 
  'Njeri', 'Otieno', 'Auma', 'Kariuki', 'Wambui', 'Kiplagat', 'Jepkoech', 'Mutua',
  'Mumbua', 'Ng\'ang\'a', 'Nyambura', 'Kibet', 'Cherono', 'Okoth', 'Adhiambo', 'Korir', 'Jepkemei', 'Mutiso'];

const productCategories = ['Medical Equipment', 'Surgical Instruments', 'Diagnostic Tools', 
  'Laboratory Equipment', 'Patient Care Equipment', 'Imaging Equipment'];

const products = [
  { name: 'Patient Monitor', model: 'PM-5000', brand: 'Philips', category: 'monitoring', price: 150000, description: 'Multi-parameter patient monitoring system' },
  { name: 'Ultrasound Machine', model: 'US-7000', brand: 'GE Healthcare', category: 'imaging', price: 450000, description: 'Portable ultrasound with color Doppler' },
  { name: 'X-Ray Machine', model: 'XR-3000', brand: 'Siemens', category: 'imaging', price: 850000, description: 'Digital radiography system' },
  { name: 'ECG Machine', model: 'ECG-1200', brand: 'Schiller', category: 'diagnostic', price: 120000, description: '12-lead electrocardiograph' },
  { name: 'Surgical Table', model: 'ST-800', brand: 'Stryker', category: 'surgical', price: 280000, description: 'Hydraulic operating table' },
  { name: 'Anesthesia Machine', model: 'AM-6000', brand: 'Mindray', category: 'surgical', price: 650000, description: 'Comprehensive anesthesia workstation' },
  { name: 'Autoclave Sterilizer', model: 'AC-500', brand: 'Tuttnauer', category: 'surgical', price: 180000, description: 'High-pressure steam sterilizer' },
  { name: 'Defibrillator', model: 'AED-200', brand: 'Zoll', category: 'monitoring', price: 220000, description: 'Automated external defibrillator' },
  { name: 'Infusion Pump', model: 'IP-400', brand: 'Baxter', category: 'monitoring', price: 95000, description: 'Programmable IV infusion pump' },
  { name: 'Ventilator', model: 'V-5000', brand: 'Dräger', category: 'monitoring', price: 780000, description: 'ICU ventilator with advanced modes' },
  { name: 'Blood Pressure Monitor', model: 'BPM-100', brand: 'Omron', category: 'diagnostic', price: 25000, description: 'Digital BP monitor' },
  { name: 'Pulse Oximeter', model: 'POX-50', brand: 'Masimo', category: 'diagnostic', price: 15000, description: 'Fingertip pulse oximeter' },
  { name: 'Surgical Light', model: 'SL-2000', brand: 'Trumpf', category: 'surgical', price: 320000, description: 'LED surgical lighting system' },
  { name: 'Hospital Bed', model: 'HB-300', brand: 'Hill-Rom', category: 'other', price: 85000, description: 'Electric adjustable hospital bed' },
  { name: 'Centrifuge', model: 'CF-3000', brand: 'Eppendorf', category: 'laboratory', price: 145000, description: 'Laboratory centrifuge machine' }
];

const visitOutcomes = ['successful', 'pending', 'unsuccessful'];
const visitPurposes = ['Product Demonstration', 'Follow-up Visit', 'New Client Meeting', 'Service Call', 'Equipment Installation'];
const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const paymentStatuses = ['paid', 'pending', 'partial', 'overdue'];
const communicationTypes = ['email', 'phone', 'sms', 'in-person'];

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearData = async () => {
  console.log('\n🗑️  Clearing existing data...');
  
  // Drop the geospatial index if it exists
  try {
    await Visit.collection.dropIndex('client.location_2dsphere');
    console.log('✅ Dropped geospatial index');
  } catch (error) {
    // Index doesn't exist, ignore
  }
  
  await Promise.all([
    User.deleteMany({ role: { $in: ['sales', 'manager'] } }),
    Visit.deleteMany({}),
    Order.deleteMany({}),
    Trail.deleteMany({}),
    Quotation.deleteMany({}),
    Product.deleteMany({}),
    Communication.deleteMany({}),
    Report.deleteMany({}),
    EngineeringService.deleteMany({}),
    Sale.deleteMany({}),
    FollowUp.deleteMany({})
  ]);
  console.log('✅ Existing data cleared');
};

// Create products
const createProducts = async () => {
  console.log('\n📦 Creating products...');
  const createdProducts = await Product.insertMany(
    products.map((p, index) => ({
      name: p.name,
      model: p.model,
      brand: p.brand,
      category: p.category,
      description: p.description,
      price: {
        listPrice: p.price,
        dealerPrice: Math.round(p.price * 0.9), // 10% dealer discount
        currency: 'KES'
      },
      inventory: {
        sku: `SKU-${p.model}-${String(index + 1).padStart(3, '0')}`,
        stockLevel: randomInt(10, 100),
        minimumStock: randomInt(5, 15),
        reorderPoint: randomInt(8, 20)
      },
      supplier: {
        name: randomElement(['Supplier A', 'Supplier B', 'Supplier C']),
        contact: `+254${randomInt(700000000, 799999999)}`,
        leadTime: randomInt(7, 30)
      },
      warranty: {
        duration: randomInt(12, 36),
        terms: 'Standard manufacturer warranty'
      },
      isActive: true,
      tags: [p.category, p.brand.toLowerCase()],
      targetMarkets: randomElement([
        ['hospital', 'clinic'],
        ['hospital'],
        ['clinic', 'dispensary'],
        ['laboratory']
      ])
    }))
  );
  console.log(`✅ Created ${createdProducts.length} products`);
  return createdProducts;
};

// Create users
const createUsers = async () => {
  console.log('\n👥 Creating 25 users...');
  const users = [];
  const hashedPassword = await bcrypt.hash('password123', 10);

  for (let i = 0; i < 25; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i > 0 ? i : ''}@accord.com`;
    const phone = `+254${randomInt(700000000, 799999999)}`;
    const region = randomElement(regions);
    const role = i < 5 ? 'manager' : 'sales'; // 5 managers, 20 sales
    const department = role === 'manager' ? 'management' : 'sales'; // lowercase to match enum

    users.push({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role,
      region,
      employeeId: `EMP${String(i + 1).padStart(4, '0')}`,
      department,
      territory: region,
      isActive: true,
      targets: {
        monthly: {
          visits: randomInt(20, 40),
          orders: randomInt(5, 15),
          revenue: randomInt(500000, 2000000)
        },
        quarterly: {
          visits: randomInt(60, 120),
          orders: randomInt(15, 45),
          revenue: randomInt(1500000, 6000000)
        }
      }
    });
  }

  const createdUsers = await User.insertMany(users);
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
};

// Create visits
const createVisits = async (users) => {
  console.log('\n🚶 Creating visits...');
  const visits = [];
  const now = new Date();
  const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
  let visitCounter = 1;

  const visitPurposeOptions = ['routine_visit', 'follow_up', 'demo', 'service', 'complaint', 'order', 'other'];
  const visitOutcomeOptions = ['successful', 'partial', 'no_access', 'rescheduled', 'cancelled'];
  const clientTypes = ['hospital', 'clinic', 'dispensary', 'pharmacy', 'laboratory'];

  for (const user of users) {
    const numVisits = randomInt(5, 15);
    
    for (let i = 0; i < numVisits; i++) {
      const visitDate = randomDate(startDate, now);
      const startTime = new Date(visitDate.getTime() + randomInt(8, 10) * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + randomInt(30, 180) * 60 * 1000);
      const duration = Math.round((endTime - startTime) / (60 * 1000)); // minutes
      const outcome = randomElement(visitOutcomeOptions);
      const facility = randomElement(facilityNames);
      
      visits.push({
        userId: user._id,
        visitId: `V${String(visitCounter++).padStart(6, '0')}`,
        date: visitDate,
        startTime,
        endTime,
        duration,
        client: {
          name: facility,
          type: randomElement(clientTypes),
          location: `${randomElement(counties)}, ${user.region}`
        },
        contacts: [{
          name: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
          role: randomElement(['doctor', 'nurse', 'pharmacist', 'administrator', 'procurement']),
          phone: `+254${randomInt(700000000, 799999999)}`,
          followUpRequired: outcome !== 'successful',
          priority: outcome === 'successful' ? 'low' : 'medium'
        }],
        visitPurpose: randomElement(visitPurposeOptions),
        visitOutcome: outcome,
        totalPotentialValue: outcome === 'successful' ? randomInt(100000, 1000000) : 0,
        notes: `Visit to ${facility}. ${outcome === 'successful' ? 'Successful meeting with procurement team.' : outcome === 'partial' ? 'Partial success, follow-up required.' : 'Client unavailable or meeting rescheduled.'}`,
        nextVisitDate: outcome !== 'successful' ? new Date(visitDate.getTime() + randomInt(3, 14) * 24 * 60 * 60 * 1000) : undefined,
        status: 'completed'
      });
    }
  }

  const createdVisits = await Visit.insertMany(visits);
  console.log(`✅ Created ${createdVisits.length} visits`);
  return createdVisits;
};

// Create quotations
const createQuotations = async (users, visits, productsData) => {
  console.log('\n📄 Creating quotations...');
  const quotations = [];
  
  // Create quotations for successful visits (60% chance)
  const successfulVisits = visits.filter(v => v.visitOutcome === 'successful');
  
  for (const visit of successfulVisits) {
    if (Math.random() < 0.6) {
      const numProducts = randomInt(1, 5);
      const items = [];

      for (let i = 0; i < numProducts; i++) {
        const product = randomElement(productsData);
        const quantity = randomInt(1, 5);
        const unitPrice = product.price.listPrice;

        items.push({
          productId: product._id,
          productName: product.name,
          quantity,
          unitPrice
        });
      }

      const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const contact = visit.contacts && visit.contacts.length > 0 ? visit.contacts[0] : null;
      
      quotations.push({
        requester: visit.userId,
        contact: contact ? {
          name: contact.name,
          email: contact.email,
          phone: contact.phone
        } : {
          name: 'Contact Person',
          phone: `+254${randomInt(700000000, 799999999)}`
        },
        items: items.map(item => ({
          sku: `SKU-${randomInt(1000, 9999)}`,
          name: item.productName,
          quantity: item.quantity,
          price: item.unitPrice,
          details: `${item.productName} as per specification`
        })),
        total: totalAmount * 1.16, // Include 16% VAT
        notes: 'Quotation for medical equipment as discussed.',
        status: randomElement(['requested', 'quoted', 'approved', 'rejected']),
        assignedTo: visit.userId
      });
    }
  }

  const createdQuotations = await Quotation.insertMany(quotations);
  console.log(`✅ Created ${createdQuotations.length} quotations`);
  return createdQuotations;
};

// Create orders
const createOrders = async (quotations, visits) => {
  console.log('\n🛒 Creating orders...');
  const orders = [];
  
  // Convert approved quotations to orders (70% chance)
  const approvedQuotations = quotations.filter(q => 
    ['approved', 'quoted'].includes(q.status)
  );

  for (const quotation of approvedQuotations) {
    if (Math.random() < 0.7) {
      // Find the visit from the quotation's requester to get client info
      const visit = visits.find(v => v.userId.equals(quotation.requester));
      if (!visit) continue;
      
      const orderDate = new Date(quotation.createdAt.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000);
      const subtotal = quotation.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const taxAmount = subtotal * 0.16;
      const totalAmount = subtotal + taxAmount;
      
      orders.push({
        orderNumber: `ORD-${Date.now()}-${randomInt(1000, 9999)}`,
        userId: quotation.requester,
        visitId: visit._id,
        client: {
          name: visit.client.name,
          type: visit.client.type,
          location: {
            type: 'Point',
            coordinates: [randomFloat(36.5, 37.0), randomFloat(-1.5, -1.0)]
          }
        },
        items: quotation.items.map(item => ({
          productId: item.productId || new mongoose.Types.ObjectId(),
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          discount: 0,
          totalPrice: item.price * item.quantity
        })),
        subtotal,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        currency: 'KES',
        status: randomElement(['draft', 'submitted', 'approved', 'processing', 'shipped', 'delivered', 'cancelled']),
        paymentStatus: randomElement(['pending', 'partial', 'paid', 'overdue']),
        paymentTerms: randomElement(['cash', 'net_30', 'net_60']),
        deliveryAddress: `${visit.client.name}, ${visit.client.location}, Kenya`,
        expectedDeliveryDate: new Date(orderDate.getTime() + randomInt(7, 21) * 24 * 60 * 60 * 1000),
        notes: 'Order processed successfully.',
        orderDate
      });
    }
  }

  const createdOrders = await Order.insertMany(orders);
  console.log(`✅ Created ${createdOrders.length} orders`);
  return createdOrders;
};

// Create trails
const createTrails = async (users) => {
  console.log('\n📍 Creating location trails...');
  const trails = [];
  const now = new Date();
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

  for (const user of users) {
    const numTrails = randomInt(5, 10); // Fewer trails but proper paths
    
    for (let i = 0; i < numTrails; i++) {
      const trailDate = randomDate(startDate, now);
      const startTime = new Date(trailDate.getTime() + randomInt(8, 10) * 60 * 60 * 1000);
      const duration = randomInt(30, 180); // 30min to 3hr
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
      
      // Generate a path with multiple coordinate points
      const numPoints = randomInt(5, 15);
      const coordinates = [];
      let baseLng = parseFloat(randomFloat(36.5, 37.0));
      let baseLat = parseFloat(randomFloat(-1.5, -1.0));
      
      for (let p = 0; p < numPoints; p++) {
        // Small incremental changes to simulate movement
        baseLng = parseFloat((baseLng + parseFloat(randomFloat(-0.01, 0.01))).toFixed(6));
        baseLat = parseFloat((baseLat + parseFloat(randomFloat(-0.01, 0.01))).toFixed(6));
        coordinates.push([baseLng, baseLat]);
      }
      
      trails.push({
        userId: user._id,
        date: trailDate,
        startTime,
        endTime,
        path: {
          type: 'LineString',
          coordinates
        },
        totalDistance: randomFloat(5, 50), // km
        totalDuration: duration, // minutes
        averageSpeed: randomFloat(10, 60), // km/h
        syncedAt: new Date()
      });
    }
  }

  const createdTrails = await Trail.insertMany(trails);
  console.log(`✅ Created ${createdTrails.length} trail records`);
  return createdTrails;
};

// Create communications
const createCommunications = async (users, visits) => {
  console.log('\n💬 Creating communications...');
  const communications = [];

  for (const visit of visits.slice(0, 100)) { // Limit to 100 visits to avoid too many
    const numComms = randomInt(1, 2);
    
    for (let i = 0; i < numComms; i++) {
      const type = randomElement(['group', 'personal']);
      const sender = visit.userId;
      const recipients = type === 'personal' ? [randomElement(users)._id] : [];
      
      communications.push({
        type,
        sender,
        recipients,
        subject: `Follow-up: Visit to ${visit.client.name}`,
        content: `Following up on our visit to ${visit.client.name}. Discussed ${visit.visitPurpose.replace('_', ' ')}.`,
        meta: {
          visitId: visit._id,
          facilityName: visit.client.name
        }
      });
    }
  }

  const createdCommunications = await Communication.insertMany(communications);
  console.log(`✅ Created ${createdCommunications.length} communications`);
  return createdCommunications;
};

// Create engineering services
const createEngineeringServices = async (orders, users) => {
  console.log('\n🔧 Creating engineering services...');
  const services = [];

  // Create service records for delivered orders (40% chance)
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  for (const order of deliveredOrders) {
    if (Math.random() < 0.4) {
      const orderDate = order.orderDate || order.createdAt || new Date();
      const serviceDate = new Date(orderDate.getTime() + randomInt(30, 60) * 24 * 60 * 60 * 1000);
      const serviceType = randomElement(['installation', 'maintenance', 'repair', 'inspection']);
      
      services.push({
        userId: order.userId,
        date: serviceDate,
        facility: {
          name: order.client ? order.client.name : 'Unknown Facility',
          location: order.client && order.client.location ? order.client.location.coordinates.join(', ') : 'Unknown Location'
        },
        serviceType,
        machineDetails: order.items.map(item => item.productName).join(', '),
        conditionBefore: 'Equipment requires routine service',
        conditionAfter: 'Equipment functioning optimally',
        engineerInCharge: {
          name: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
          phone: `+254${randomInt(700000000, 799999999)}`
        },
        status: randomElement(['recorded', 'scheduled', 'completed']),
        nextServiceDate: new Date(serviceDate.getTime() + randomInt(90, 180) * 24 * 60 * 60 * 1000),
        syncedAt: new Date()
      });
    }
  }

  const createdServices = await EngineeringService.insertMany(services);
  console.log(`✅ Created ${createdServices.length} engineering services`);
  return createdServices;
};

// Create sales records
const createSales = async (orders, users) => {
  console.log('\n💰 Creating sales records...');
  const sales = [];

  for (const order of orders) {
    if (['delivered', 'shipped'].includes(order.status)) {
      // Create a sale for each item in the order
      for (const item of order.items) {
        sales.push({
          userId: order.userId,
          equipment: item.productName,
          price: item.totalPrice,
          target: item.totalPrice * 1.1 // Set target as 110% of price
        });
      }
    }
  }

  const createdSales = await Sale.insertMany(sales);
  console.log(`✅ Created ${createdSales.length} sales records`);
  return createdSales;
};

// Create follow-ups
const createFollowUps = async (visits, users) => {
  console.log('\n📅 Creating follow-ups...');
  const followUps = [];

  const visitsNeedingFollowUp = visits.filter(v => v.nextVisitDate);

  for (const visit of visitsNeedingFollowUp) {
    const contact = visit.contacts && visit.contacts.length > 0 ? visit.contacts[0] : null;
    followUps.push({
      visitId: visit._id,
      action: `Follow up on ${visit.visitPurpose.replace('_', ' ')} at ${visit.client.name}`,
      assignedTo: contact ? contact.name : `${randomElement(firstNames)} ${randomElement(lastNames)}`,
      dueDate: visit.nextVisitDate,
      priority: randomElement(['low', 'medium', 'high']),
      status: Math.random() < 0.3 ? 'completed' : 'pending',
      createdBy: visit.userId
    });
  }

  const createdFollowUps = await FollowUp.insertMany(followUps);
  console.log(`✅ Created ${createdFollowUps.length} follow-ups`);
  return createdFollowUps;
};

// Create reports
const createReports = async (users, visits) => {
  console.log('\n📊 Creating reports...');
  const reports = [];
  const now = new Date();

  for (const user of users) {
    const numReports = randomInt(2, 5);
    const userVisits = visits.filter(v => v.userId.equals(user._id));
    
    for (let i = 0; i < numReports; i++) {
      const weekEnd = randomDate(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), now);
      const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      const visitCount = userVisits.filter(v => v.date >= weekStart && v.date <= weekEnd).length;
      
      reports.push({
        userId: user._id,
        weekStart,
        weekEnd,
        content: {
          metadata: {
            userName: `${user.firstName} ${user.lastName}`,
            region: user.region,
            period: `${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`
          },
          sections: [
            {
              title: 'Visit Summary',
              content: `Total visits: ${visitCount}, Successful: ${Math.floor(visitCount * 0.7)}`
            },
            {
              title: 'Performance',
              content: `Quotations: ${Math.floor(visitCount * 0.4)}, Orders: ${Math.floor(visitCount * 0.25)}`
            }
          ]
        },
        status: randomElement(['pending', 'approved']),
        isDraft: false,
        submittedAt: weekEnd
      });
    }
  }

  const createdReports = await Report.insertMany(reports);
  console.log(`✅ Created ${createdReports.length} reports`);
  return createdReports;
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    await connectDB();
    await clearData();

    const productsData = await createProducts();
    const users = await createUsers();
    const visits = await createVisits(users);
    const quotations = await createQuotations(users, visits, productsData);
    const orders = await createOrders(quotations, visits);
    const trails = await createTrails(users);
    const communications = await createCommunications(users, visits);
    const services = await createEngineeringServices(orders, users);
    const sales = await createSales(orders, users);
    const followUps = await createFollowUps(visits, users);
    const reports = await createReports(users, visits);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   • Users: ${users.length}`);
    console.log(`   • Products: ${productsData.length}`);
    console.log(`   • Visits: ${visits.length}`);
    console.log(`   • Quotations: ${quotations.length}`);
    console.log(`   • Orders: ${orders.length}`);
    console.log(`   • Trails: ${trails.length}`);
    console.log(`   • Communications: ${communications.length}`);
    console.log(`   • Engineering Services: ${services.length}`);
    console.log(`   • Sales: ${sales.length}`);
    console.log(`   • Follow-ups: ${followUps.length}`);
    console.log(`   • Reports: ${reports.length}`);
    console.log('\n✅ You can now login with any user:');
    console.log('   Email: [firstname].[lastname]@accord.com');
    console.log('   Password: password123');
    console.log('\n   Example: john.kamau@accord.com / password123\n');

  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
    process.exit(0);
  }
};

// Run the seeder
seedDatabase();
