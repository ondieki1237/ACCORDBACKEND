import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
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
import communicationsRoutes from './routes/communications.js';
import { generalLimiter } from './middleware/rateLimiters.js';

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

// Allow all CORS
app.use(cors());

app.options("*", cors());

// Socket.IO setup
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trails', trailRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/visits', adminVisitRoutes);
app.use('/api/quotation', quotationRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api', kmhfrRoutes);
app.use('/api/follow-ups', followUpRoutes);
app.use('/api/communications', communicationsRoutes);

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