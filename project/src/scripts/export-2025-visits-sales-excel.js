import 'dotenv/config';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Visit from '../models/Visit.js';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const year = 2025;
const start = new Date(`${year}-01-01T00:00:00.000Z`);
const end = new Date(`${year}-12-31T23:59:59.999Z`);

const run = async () => {
  await connectDB();
  const salesUsers = await User.find({ role: 'sales', isActive: true });
  const userIds = salesUsers.map(u => u._id);
  const visits = await Visit.find({ userId: { $in: userIds }, date: { $gte: start, $lte: end } }).lean();

  // Group visits by user
  const visitsByUser = {};
  for (const user of salesUsers) {
    visitsByUser[user._id.toString()] = { user, visits: [] };
  }
  for (const v of visits) {
    const uid = v.userId.toString();
    if (visitsByUser[uid]) visitsByUser[uid].visits.push(v);
  }

  // Build workbook: one sheet per user
  const workbook = XLSX.utils.book_new();
  for (const { user, visits } of Object.values(visitsByUser)) {
    const headers = [
      'Visit ID', 'Date', 'Start Time', 'End Time', 'Duration (min)',
      'Client Name', 'Client Type', 'Client Level', 'Location',
      'Visit Purpose', 'Visit Outcome', 'Contacts Count', 'Products of Interest',
      'Competitor Activity', 'Market Insights', 'Notes', 'Follow-up Required'
    ];
    const rows = visits.map(visit => [
      visit.visitId || visit._id?.toString() || 'N/A',
      visit.date ? new Date(visit.date).toLocaleDateString() : 'N/A',
      visit.startTime ? new Date(visit.startTime).toLocaleTimeString() : 'N/A',
      visit.endTime ? new Date(visit.endTime).toLocaleTimeString() : 'N/A',
      visit.duration || 'N/A',
      visit.client?.name || 'N/A',
      visit.client?.type || 'N/A',
      visit.client?.level || 'N/A',
      visit.client?.location || 'N/A',
      visit.visitPurpose || 'N/A',
      visit.visitOutcome || 'N/A',
      visit.contacts?.length || 0,
      visit.productsOfInterest?.map(p => p.name).join(', ') || 'N/A',
      visit.competitorActivity || 'N/A',
      visit.marketInsights || 'N/A',
      visit.notes || 'N/A',
      visit.isFollowUpRequired ? 'Yes' : 'No'
    ]);
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    // Sheet name: FirstName LastName or email
    let sheetName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (!sheetName) sheetName = user.email.split('@')[0];
    // Excel sheet names max 31 chars
    sheetName = sheetName.slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  }

  // Save file
  const outDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `visits-sales-${year}.xlsx`);
  XLSX.writeFile(workbook, outPath);
  console.log('Exported:', outPath);
  process.exit(0);
};

run().catch(e => { console.error(e); process.exit(1); });
