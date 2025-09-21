import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import Report from '../models/Report.js';
import cloudinary from '../utils/cloudinary.js';

const router = express.Router();

// temp upload dir (will be removed after upload to Cloudinary)
const UPLOAD_DIR = path.join(process.cwd(), 'tmp', 'reports');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `report-${unique}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF allowed'), false);
    cb(null, true);
  },
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024) }
});

// helper to remove temp file
const safeUnlink = (p) => {
  fs.unlink(p, (err) => {
    if (err) logger?.error?.('Failed to remove temp file', err);
  });
};

// @route   POST /api/reports
// @desc    Upload a weekly report (PDF)
// @access  Private
router.post('/', authenticate, upload.single('report'), async (req, res) => {
  try {
    const { weekStart, weekEnd } = req.body;
    if (!req.file || !weekStart || !weekEnd) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(400).json({ success: false, message: 'File, weekStart and weekEnd are required.' });
    }

    const localPath = req.file.path;

    // Upload with resource_type: 'auto' so Cloudinary can choose best delivery type
    const uploadResult = await cloudinary.uploader.upload(localPath, {
      resource_type: 'auto',
      folder: 'reports',
      type: 'upload' // ensure public upload
    });

    safeUnlink(localPath);

    const report = new Report({
      userId: req.user._id,
      fileName: req.file.originalname,
      fileUrl: uploadResult.secure_url,
      filePublicId: uploadResult.public_id,
      weekStart: new Date(weekStart),
      weekEnd: new Date(weekEnd)
    });

    await report.save();

    res.status(201).json({ success: true, message: 'Report uploaded successfully.', data: report });
  } catch (error) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) safeUnlink(req.file.path);
    logger.error('Upload report error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload report.' });
  }
});

// @route   GET /api/reports/my
// @desc    Get reports for current user
// @access  Private
router.get('/my', authenticate, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id }).sort({ submittedAt: -1 });
    res.json({ success: true, data: reports });
  } catch (error) {
    logger.error('Get my reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch your reports.' });
  }
});

// @route   GET /api/reports
// @desc    Get all reports (admin)
// @access  Private (admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, userId } = req.query;
    const q = {};
    if (status) q.status = status;
    if (userId) q.userId = userId;

    const reports = await Report.find(q).populate('userId', 'firstName lastName email').sort({ submittedAt: -1 });
    res.json({ success: true, data: reports });
  } catch (error) {
    logger.error('Get all reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reports.' });
  }
});

// @route   PUT /api/reports/:id/status
// @desc    Update report status (admin)
// @access  Private (admin)
router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const allowed = ['pending', 'approved', 'rejected'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });

    const report = await Report.findByIdAndUpdate(req.params.id, { status, adminNotes }, { new: true });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    res.json({ success: true, message: 'Report status updated.', data: report });
  } catch (error) {
    logger.error('Update report status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update report status.' });
  }
});

// @route   GET /api/reports/:id/download
// @desc    Download report (public or signed)
// @access  Private (owner or admin)
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    const isOwner = report.userId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // If we stored a direct public URL, use it
    if (report.fileUrl) {
      return res.redirect(report.fileUrl);
    }

    // Otherwise build a signed URL fallback
    if (report.filePublicId) {
      const signedUrl = cloudinary.utils.private_download_url(report.filePublicId, {
        resource_type: 'raw',
        type: 'authenticated',
        filename: report.fileName || 'report.pdf',
        expire_at: Math.floor(Date.now() / 1000) + 60
      });
      return res.redirect(signedUrl);
    }

    return res.status(404).json({ success: false, message: 'No file available.' });
  } catch (error) {
    logger.error('Download report error:', error);
    return res.status(500).json({ success: false, message: 'Failed to download report.' });
  }
});

export default router;
