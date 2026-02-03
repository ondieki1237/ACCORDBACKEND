import 'dotenv/config';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import { sendEmail } from '../services/emailService.js';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node src/scripts/send-temp-password-to-email.js user@example.com');
  process.exit(1);
}

const email = args[0];

const run = async () => {
  await connectDB();
  const user = await User.findOne({ email });
  if (!user) {
    console.error('User not found for email:', email);
    process.exit(1);
  }

  const crypto = await import('crypto');
  const tmp = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0,10);
  user.password = tmp;
  user.mustChangePassword = true;
  user.lastPasswordChangeAt = new Date();
  user.refreshTokens = [];
  await user.save();

  const rawHtml = `
    <h2>Password Recovery</h2>
    <p>Hello ${user.firstName || user.email},</p>
    <p>An administrator has reset your password. Your temporary password is:</p>
    <p><strong>${tmp}</strong></p>
    <p>Please login and change your password immediately.</p>
    <p>Login: <a href="${process.env.CLIENT_URL || 'https://app.accordmedical.co.ke'}">${process.env.CLIENT_URL || 'https://app.accordmedical.co.ke'}</a></p>
  `;

  try {
    await sendEmail({ to: user.email, subject: 'Temporary Password', template: 'default', data: { rawHtml } });
    console.log('Temporary password emailed to:', user.email);
    process.exit(0);
  } catch (err) {
    console.error('Failed to send email:', err.message || err);
    process.exit(1);
  }
};

run().catch(err => { console.error(err); process.exit(1); });
