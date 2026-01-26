import 'dotenv/config';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import crypto from 'crypto';

const usage = () => {
  console.log('Usage: node src/scripts/reset-user-password.js --id USER_ID [--method temp|link]');
  process.exit(1);
};

const args = process.argv.slice(2);
let userId = null;
let method = 'temp';
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--id') userId = args[++i];
  if (a === '--method') method = args[++i];
}
if (!userId) usage();

const run = async () => {
  await connectDB();
  const user = await User.findById(userId);
  if (!user) {
    console.error('User not found');
    process.exit(1);
  }

  if (method === 'link') {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();
    console.log('Reset link token (send this to user via email):', resetToken);
    process.exit(0);
  }

  // temp
  const tmp = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0,10);
  user.password = tmp;
  user.mustChangePassword = true;
  user.lastPasswordChangeAt = new Date();
  user.refreshTokens = [];
  await user.save();
  console.log('Temporary password set for user:', user.email);
  console.log('Temporary password:', tmp);
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
