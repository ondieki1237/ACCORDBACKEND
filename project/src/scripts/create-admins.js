import connectDB from '../config/database.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Each entry: string (email only, default password 12345678) or object with email, firstName?, lastName?, password?, employeeId?, region?
const admins = [
  'g.nato@accordmedical.co.ke',
  'b.maingi@accordmedical.co.ke',
  {
    email: 'supervisor@accordmedical.co.ke',
    firstName: 'Ronald',
    lastName: 'Supervisor',
    password: 'ronald2026!',
    employeeId: 'SUP001',
    region: 'Head Office'
  }
];

const createAdmins = async () => {
  await connectDB();

  for (const entry of admins) {
    const isObject = typeof entry === 'object';
    const email = isObject ? entry.email : entry;
    const firstName = isObject ? entry.firstName : null;
    const lastName = isObject ? entry.lastName : null;
    const password = isObject ? entry.password : '12345678';
    const employeeId = isObject ? entry.employeeId : null;
    const region = isObject ? entry.region : 'Nairobi';

    try {
      const existing = await User.findOne({ email });
      if (existing) {
        if (isObject && password !== '12345678') {
          existing.password = password;
          await existing.save();
          logger.info(`Updated admin password for: ${email}`);
        } else {
          logger.info(`Admin already exists: ${email}`);
        }
        continue;
      }

      // Derive names from email local part if not provided
      const local = email.split('@')[0];
      const parts = local.split('.');
      const first = firstName || (parts[0] || 'Admin').replace(/[^a-zA-Z0-9]/g, '') || 'Admin';
      const last = lastName || (parts[1] || 'User').replace(/[^a-zA-Z0-9]/g, '') || 'User';

      const user = new User({
        employeeId: employeeId || `ADM${Date.now().toString().slice(-6)}`,
        firstName: first.charAt(0).toUpperCase() + first.slice(1),
        lastName: last.charAt(0).toUpperCase() + last.slice(1),
        email,
        password,
        role: 'admin',
        region,
        isActive: true
      });

      await user.save();
      logger.info(`Created admin user: ${email} (${isObject && password !== '12345678' ? 'custom password' : 'password: 12345678'})`);
    } catch (err) {
      logger.error(`Failed to create admin ${email}:`, err);
    }
  }

  process.exit(0);
};

createAdmins().catch(err => {
  logger.error('create-admins script error:', err);
  process.exit(1);
});
