import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';

import connectDB from './config/database.js';
import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import trailRoutes from './routes/trails.js';
import visitRoutes from './routes/visits.js';
import dashboardRoutes from './routes/dashboard.js';
import equipmentRoutes from './routes/equipment.js';
import orderRoutes from './routes/orders.js';
import reportsRoutes from './routes/reports.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import adminVisitRoutes from './routes/admin/visits.js';
import quotationRoutes from './routes/quotation.js';
import salesRoutes from './routes/sales.js';
import { initializeScheduledJobs } from './services/scheduledJobs.js';
import kmhfrRoutes from './routes/kmhfr.js';
import followUpRoutes from './routes/follow-ups.js';
import followUpVisitRoutes from './routes/follow-up-visits.js';
import communicationsRoutes from './routes/communications.js';
import { generalLimiter } from './middleware/rateLimiters.js';
import adminUsersRoutes from './routes/admin/users.js';
import adminAnalyticsRoutes from './routes/admin/analytics.js';
import adminReportsRoutes from './routes/admin/reports.js';
import adminQuotationsRoutes from './routes/admin/quotations.js';
import engineeringServicesRoutes from './routes/engineeringServices.js';
import engineeringPricingRoutes from './routes/engineeringPricing.js';
import plannerRoutes from './routes/planner.js';
import adminPlannersRoutes from './routes/admin/planners.js';
import locationRoutes from './routes/location.js';
import adminLocationRoutes from './routes/admin/location.js';
import appRoutes from './routes/app.js';
import leadsRoutes from './routes/leads.js';
import adminLeadsRoutes from './routes/admin/leads.js';
import machinesRoutes from './routes/machines.js';
import adminMachinesRoutes from './routes/admin/machines.js';
import adminMapRoutes from './routes/admin/map.js';
import facilitiesRoutes from './routes/facilities.js';
import consumablesRoutes from './routes/consumables.js';
import adminConsumablesRoutes from './routes/admin/consumables.js';
import analyticsRoutes from './routes/analytics.js';
import ordersCheckoutRoutes from './routes/ordersCheckout.js';
import callLogsRoutes from './routes/callLogs.js';
import adminCallLogsRoutes from './routes/admin/callLogs.js';
import machineDocumentsRoutes from './routes/machineDocuments.js';
import engineeringRequestsRoutes from './routes/engineeringRequests.js';
import adminEngineeringRequestsRoutes from './routes/admin/engineeringRequests.js';
import salesDocumentsRoutes from './routes/salesDocuments.js';
import documentCategoriesRoutes from './routes/documentCategories.js';
import manufacturersRoutes from './routes/manufacturers.js';
import appUpdatesRoutes from './routes/appUpdates.js';
import debugRoutes from './routes/debug.js';
import User from './models/User.js';
import Visit from './models/Visit.js';
import XLSX from 'xlsx';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/', generalLimiter);

// CORS configuration: whitelist important client origins but allow non-browser requests
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ALLOWED_CLIENT_ORIGINS, // optional comma-separated list
  'https://v0-client-service-portal.vercel.app'
]
  .filter(Boolean)
  .reduce((acc, item) => acc.concat(item.split(',').map(s => s.trim())), [])
  .filter(Boolean);

// Allow all origins and reflect the request origin (prevents CORS rejections)
app.use(cors({
  origin: true,
  credentials: true
}));

app.options('*', cors());

// Socket.IO setup
app.set('io', io);

// Serve static files for app downloads (absolute path)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const downloadPath = path.join(__dirname, '../../downloads');

// APK download endpoint with proper headers for Android Download Manager
app.get('/downloads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(downloadPath, filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }
  
  // Set headers for APK files (required for Android)
  if (filename.endsWith('.apk')) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Accept-Ranges', 'bytes');
  }
  
  res.sendFile(filePath);
});

// Fallback static serve for other files
app.use('/downloads', express.static(downloadPath));

// Public app update endpoint (convenience root path)
app.get('/app/update', (req, res) => {
  const versionCode = process.env.VERSION_CODE ? Number(process.env.VERSION_CODE) : Number(process.env.VERSION_CODE || 0);
  const versionName = process.env.VERSION_NAME || process.env.VERSION || '1.0.0';
  const apkPath = process.env.APK_PATH || '/downloads/app-debug.apk';
  const forceUpdate = process.env.FORCE_UPDATE === 'true' || false;
  const changelog = process.env.CHANGELOG || '';
  // Construct absolute URL based on host when possible
  const host = process.env.APP_HOST || `${req.protocol}://${req.get('host')}`;
  const apkUrl = apkPath.startsWith('http') ? apkPath : `${host}${apkPath}`;

  res.set('Cache-Control', 'no-cache');
  return res.json({
    version: versionName,
    downloadUrl: apkUrl,
    releaseNotes: changelog,
    // Legacy fields for backward compatibility
    versionCode,
    forceUpdate
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trails', trailRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/equipment', equipmentRoutes);

// Orders & Checkout endpoints (M-Pesa integration - PUBLIC, must come before protected /api/orders)
app.use('/api/orders', ordersCheckoutRoutes);

// Protected orders endpoints
app.use('/api/orders/admin', orderRoutes);

app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/visits', adminVisitRoutes);
app.use('/api/quotation', quotationRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api', kmhfrRoutes);
app.use('/api/follow-ups', followUpRoutes);
app.use('/api/communications', communicationsRoutes);
app.use('/api/follow-up-visits', followUpVisitRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/reports', adminReportsRoutes);
app.use('/api/admin/quotations', adminQuotationsRoutes);
app.use('/api/engineering-services', engineeringServicesRoutes);
app.use('/api/engineering-pricing', engineeringPricingRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/admin/planners', adminPlannersRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/admin/location', adminLocationRoutes);
app.use('/api/app', appRoutes);
// Leads feature
app.use('/api/leads', leadsRoutes);
app.use('/api/admin/leads', adminLeadsRoutes);
// Machines endpoints (engineers & admin)
app.use('/api/machines', machinesRoutes);
app.use('/api/admin/machines', adminMachinesRoutes);
// Map visualization endpoints (admin)
app.use('/api/admin/map', adminMapRoutes);
// Facilities (search + admin create)
app.use('/api/facilities', facilitiesRoutes);
// Consumables endpoints
app.use('/api/consumables', consumablesRoutes);
app.use('/api/admin/consumables', adminConsumablesRoutes);

// Also expose root-level routes (frontend may call without /api prefix)
app.use('/visits', visitRoutes);
app.use('/sales', salesRoutes);
app.use('/reports', reportsRoutes);
app.use('/consumables', consumablesRoutes);

// Also expose sales documents at root-level for frontend convenience
app.use('/sales/documents', salesDocumentsRoutes);

// Call logs endpoints
app.use('/api/call-logs', callLogsRoutes);
app.use('/api/admin/call-logs', adminCallLogsRoutes);

// Machine documents (Google Drive uploads)
app.use('/api/machine-documents', machineDocumentsRoutes);

// App updates API (public check + admin CRUD)
app.use('/api/app-updates', appUpdatesRoutes);

// Public sales documents (link records)
app.use('/api/sales/documents', salesDocumentsRoutes);
app.use('/api/document-categories', documentCategoriesRoutes);
app.use('/api/manufacturers', manufacturersRoutes);

// Engineering requests (public + admin)
app.use('/api/engineering-requests', engineeringRequestsRoutes);
app.use('/api/admin/engineering-requests', adminEngineeringRequestsRoutes);

// Debug helpers (ping + route list)
app.use('/api/debug', debugRoutes);

// Analytics endpoints
app.use('/api/analytics', analyticsRoutes);
// Export endpoint: GET /sales/export?format=xlsx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
app.get('/sales/export', async (req, res) => {
  try {
    const { format = 'xlsx', startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);

    const salesUsers = await User.find({ role: 'sales', isActive: true }).lean();
    const userIds = salesUsers.map(u => u._id);
    const visits = await Visit.find({ userId: { $in: userIds }, date: { $gte: start, $lte: end } }).lean();

    // Group visits by user
    const visitsByUser = {};
    for (const user of salesUsers) visitsByUser[user._id.toString()] = { user, visits: [] };
    for (const v of visits) {
      const uid = v.userId.toString();
      if (visitsByUser[uid]) visitsByUser[uid].visits.push(v);
    }

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
      let sheetName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (!sheetName) sheetName = (user.email || '').split('@')[0];
      sheetName = sheetName.slice(0, 31);
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName || 'Unknown');
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const filename = `sales-export-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    logger.error('Sales export error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate export' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize scheduled jobs
initializeScheduledJobs();

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  httpServer.close(() => {
    process.exit(1);
  });
});

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

export default app;