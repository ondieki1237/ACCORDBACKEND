import connectDB from '../config/database.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const admins = [
  'g.nato@accordmedical.co.ke',
  'b.maingi@accordmedical.co.ke'
];

const createAdmins = async () => {
  await connectDB();

  for (const email of admins) {
    try {
      const existing = await User.findOne({ email });
      if (existing) {
        logger.info(`Admin already exists: ${email}`);
        continue;
      }

      // Derive names from email local part
      const local = email.split('@')[0];
      const parts = local.split('.');
      const firstName = (parts[0] || 'Admin').replace(/[^a-zA-Z0-9]/g, '') || 'Admin';
      const lastName = (parts[1] || 'User').replace(/[^a-zA-Z0-9]/g, '') || 'User';

      const user = new User({
        employeeId: `ADM${Date.now().toString().slice(-6)}`,
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
        email,
        password: '12345678',
        role: 'admin',
        region: 'Nairobi',
        isActive: true
      });

      await user.save();
      logger.info(`Created admin user: ${email} (password: 12345678)`);
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
