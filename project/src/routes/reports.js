import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import PDFDocument from 'pdfkit'; // npm install pdfkit
import { authenticate, authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import Report from '../models/Report.js';
import cloudinary from '../utils/cloudinary.js';

const router = express.Router();

// Helper to generate PDF from report content
const generatePDF = (content) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);

    // Add metadata (defensive)
    const metadata = (content && content.metadata) ? content.metadata : {};
    const sections = (content && Array.isArray(content.sections)) ? content.sections : [];

    doc.fontSize(20).text('Weekly Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Author: ${metadata.author || 'Unknown'}`);
    doc.text(`Week: ${metadata.weekRange || ''}`);
    // submittedAt may be missing
    try {
      const submitted = metadata.submittedAt ? new Date(metadata.submittedAt) : new Date();
      doc.text(`Submitted: ${submitted.toLocaleString()}`);
    } catch (e) {
      doc.text(`Submitted: ${String(metadata.submittedAt)}`);
    }
    doc.moveDown();

    // Add sections (defensive)
    sections.forEach(section => {
      try {
        doc.fontSize(14).text(section.title || 'Section', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).text(section.content || '');
        doc.moveDown();
      } catch (e) {
        // ignore problematic section content but continue
        logger && logger.warn && logger.warn('PDF section render error', e);
      }
    });

    doc.end();
  });
};

// @route   POST /api/reports
// @desc    Create a new report (draft or final submission)
// @access  Private
router.post('/', authenticate, async (req, res) => {
  try {
    const { weekStart, weekEnd, content, isDraft = false } = req.body;

    if (!weekStart || !weekEnd || !content) {
      return res.status(400).json({ success: false, message: 'weekStart, weekEnd, and content are required.' });
    }

    const reportData = {
      userId: req.user._id,
      weekStart: new Date(weekStart),
      weekEnd: new Date(weekEnd),
      content,
      isDraft,
      lastEdited: new Date()
    };

    if (!isDraft) {
      // Generate PDF and upload to Cloudinary
      const pdfBuffer = await generatePDF(content);
      const tempDir = path.join(process.cwd(), 'tmp');
      try {
        fs.mkdirSync(tempDir, { recursive: true });
      } catch (e) {
        // if mkdir fails, fallback to OS tmpdir
        logger && logger.warn && logger.warn('Failed to create tmp dir, falling back to OS tmpdir', e);
      }
      const tempPath = path.join(fs.existsSync(tempDir) ? tempDir : os.tmpdir(), `report-${Date.now()}.pdf`);
      fs.writeFileSync(tempPath, pdfBuffer);

      const uploadResult = await cloudinary.uploader.upload(tempPath, {
        resource_type: 'auto',
        folder: 'reports',
        type: 'upload'
      });

      fs.unlinkSync(tempPath); // Clean up temp file

      reportData.fileUrl = uploadResult.secure_url;
      reportData.filePublicId = uploadResult.public_id;
      reportData.fileName = `report-${weekStart}-${weekEnd}.pdf`;
    }

    const report = new Report(reportData);
    await report.save();

    res.status(201).json({
      success: true,
      message: isDraft ? 'Draft saved successfully.' : 'Report submitted successfully.',
      data: report
    });
  } catch (error) {
    logger.error('Create report error:', error);
    res.status(500).json({ success: false, message: 'Failed to create report.' });
  }
});

// @route   POST /api/reports/draft
// @desc    Save a draft report
// @access  Private
router.post('/draft', authenticate, async (req, res) => {
  try {
    const { weekStart, weekEnd, content } = req.body;

    if (!weekStart || !weekEnd || !content) {
      return res.status(400).json({ success: false, message: 'weekStart, weekEnd, and content are required.' });
    }

    // Find existing draft or create new
    let report = await Report.findOne({
      userId: req.user._id,
      weekStart: new Date(weekStart),
      weekEnd: new Date(weekEnd),
      isDraft: true
    });

    if (report) {
      report.content = content;
      report.lastEdited = new Date();
      await report.save();
    } else {
      report = new Report({
        userId: req.user._id,
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd),
        content,
        isDraft: true,
        lastEdited: new Date()
      });
      await report.save();
    }

    res.status(200).json({ success: true, message: 'Draft saved successfully.', data: report });
  } catch (error) {
    logger.error('Save draft error:', error);
    res.status(500).json({ success: false, message: 'Failed to save draft.' });
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
    const { status, userId, isDraft } = req.query;
    const q = {};
    if (status) q.status = status;
    if (userId) q.userId = userId;
    if (isDraft !== undefined) q.isDraft = isDraft === 'true';

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
