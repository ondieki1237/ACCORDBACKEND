import 'dotenv/config';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Visit from '../models/Visit.js';
import Lead from '../models/Lead.js';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { generateMonthlySalesExcel, writeExcelFile } from '../utils/excelGenerator.js';

const usage = () => {
  console.log('Usage: DOTENV_CONFIG_PATH=project/src/.env node src/scripts/send-user-summary.js <targetUserEmail> <recipientEmail>');
  process.exit(1);
};

const args = process.argv.slice(2);
if (args.length < 2) usage();
const [targetEmail, recipientEmail] = args;

const run = async () => {
  await connectDB();

  const user = await User.findOne({ email: targetEmail });
  if (!user) {
    console.error('Target user not found:', targetEmail);
    process.exit(1);
  }

  // Determine previous month range
  const now = new Date();
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(firstOfThisMonth.getTime() - 1);
  monthEnd.setHours(23,59,59,999);
  const monthStart = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), 1);
  monthStart.setHours(0,0,0,0);

  const visits = await Visit.find({ userId: user._id, date: { $gte: monthStart, $lte: monthEnd } }).lean();
  const leads = await Lead.find({ createdBy: user._id, createdAt: { $gte: monthStart, $lte: monthEnd } }).lean();

  const userData = { user: user.toObject(), visits, leads };

  const workbook = generateMonthlySalesExcel({ monthStart, monthEnd, userData });

  const uploadsDir = path.join(process.cwd(), 'uploads', 'monthly-sales');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const monthLabel = `${monthStart.getFullYear()}-${String(monthStart.getMonth()+1).padStart(2,'0')}`;
  const filename = `${(user.email || user.employeeId || user._id).toString().replace(/[@<>:\"/\\|?*\s]/g, '_')}-${monthLabel}-test.xlsx`;
  const filepath = path.join(uploadsDir, filename);
  writeExcelFile(workbook, filepath);

  // send mail with attachment
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Monthly Activity Summary (Test)</h2>
      <p>Summary for <strong>${user.firstName || ''} ${user.lastName || ''} (${user.email})</strong> for period <strong>${monthLabel}</strong>.</p>
      <p>Attached is the generated Excel summary (test).</p>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: recipientEmail,
    subject: `Test: Monthly Activity Summary for ${user.email} - ${monthLabel}`,
    html,
    attachments: [{ filename, path: filepath }]
  };

  try {
    const res = await transporter.sendMail(mailOptions);
    console.log('Email sent:', res && res.accepted ? res.accepted.join(',') : res.response || 'ok');
    process.exit(0);
  } catch (err) {
    console.error('Failed to send email:', err && err.message ? err.message : err);
    process.exit(1);
  }
};

run().catch(err => { console.error(err); process.exit(1); });
