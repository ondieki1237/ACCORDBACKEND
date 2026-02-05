import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const email = process.argv[2];

if (!email) {
  console.log('Usage: node reset-password-direct.js <email>');
  process.exit(1);
}

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const userSchema = new mongoose.Schema({
      email: String,
      password: String,
      name: String
    }, { collection: 'users', strict: false });
    
    const User = mongoose.model('User', userSchema);
    
    const user = await User.findOne({ email: email });
    if (!user) {
      console.log('❌ User not found:', email);
      process.exit(1);
    }
    
    console.log('✅ Found user:', user.name || user.email);
    
    // Generate random password
    const newPassword = 'Accord' + Math.random().toString(36).slice(-6) + '2026';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    await User.updateOne({ email: email }, { password: hashedPassword });
    console.log('✅ Password updated in database');
    
    // Send email with new password
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your New Password - Accord Medical',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Password Reset</h2>
          <p>Hello ${user.name || 'User'},</p>
          <p>Your password has been reset. Here is your new password:</p>
          <p style="font-size: 20px; font-weight: bold; background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; letter-spacing: 2px;">${newPassword}</p>
          <p>Please login to the Accord Medical app with this password.</p>
          <p style="color: #666;">We recommend changing your password after logging in.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Best regards,<br>Accord Medical Team</p>
        </div>
      `
    });
    
    console.log('✅ Email sent successfully!');
    console.log('');
    console.log('📧 Email:', email);
    console.log('🔐 New Password:', newPassword);
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetPassword();
