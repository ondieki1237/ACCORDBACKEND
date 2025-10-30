import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import PDFDocument from 'pdfkit'; // npm install pdfkit
import { authenticate, authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import Report from '../models/Report.js';
import Visit from '../models/Visit.js';
import Request from '../models/Request.js';
import cloudinary from '../utils/cloudinary.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

// Helper to generate PDF from report content
const generatePDF = (report) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);

    // Determine which structure to use
    let sections = [];
    let metadata = {};
    
    // Priority 1: Root-level sections (new structure)
    if (report.sections && Array.isArray(report.sections) && report.sections.length > 0) {
      sections = report.sections;
      metadata = {
        weekRange: report.weekRange || '',
        author: report.userId?.firstName ? `${report.userId.firstName} ${report.userId.lastName}` : 'Unknown',
        submittedAt: report.createdAt || new Date()
      };
    }
    // Priority 2: Nested content structure (current structure)
    else if (report.content) {
      metadata = report.content.metadata || {};
      sections = report.content.sections || [];
    }
    // Priority 3: Legacy structure
    else {
      sections = [];
      metadata = {};
    }

    doc.fontSize(20).text('Weekly Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Author: ${metadata.author || 'Unknown'}`);
    doc.text(`Week: ${metadata.weekRange || report.weekRange || ''}`);
    
    try {
      const submitted = metadata.submittedAt ? new Date(metadata.submittedAt) : new Date();
      doc.text(`Submitted: ${submitted.toLocaleString()}`);
    } catch (e) {
      doc.text(`Submitted: ${String(metadata.submittedAt)}`);
    }
    doc.moveDown();

    // Add sections
    sections.forEach(section => {
      try {
        doc.fontSize(14).text(section.title || 'Section', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).text(section.content || '');
        doc.moveDown();
      } catch (e) {
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
    const { weekStart, weekEnd, weekRange, sections, content, isDraft = false } = req.body;

    if (!weekStart || !weekEnd) {
      return res.status(400).json({ success: false, message: 'weekStart and weekEnd are required.' });
    }

    // Parse sections if it's a JSON string (from FormData)
    let parsedSections = null;
    if (sections) {
      parsedSections = typeof sections === 'string' ? JSON.parse(sections) : sections;
    }

    // Determine which structure is being used
    const usingSectionsAtRoot = parsedSections && Array.isArray(parsedSections);
    const usingNestedContent = content && (content.sections || content.metadata);

    if (!usingSectionsAtRoot && !usingNestedContent && !isDraft) {
      return res.status(400).json({ 
        success: false, 
        message: 'Either sections or content is required for non-draft reports.' 
      });
    }

    // Validate required sections for non-draft submissions
    if (!isDraft) {
      const sectionsToValidate = usingSectionsAtRoot ? parsedSections : (content?.sections || []);
      const requiredSectionIds = ['summary', 'visits', 'quotations', 'nextWeek'];
      
      const missingSections = requiredSectionIds.filter(id => {
        const section = sectionsToValidate.find(s => s.id === id);
        return !section || !section.content || !section.content.trim();
      });

      if (missingSections.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Required sections missing',
          errors: missingSections.map(id => `Section '${id}' is required`)
        });
      }
    }

    // Build report data supporting both structures
    const reportData = {
      userId: req.user._id,
      weekStart: new Date(weekStart),
      weekEnd: new Date(weekEnd),
      isDraft,
      lastEdited: new Date()
    };

    // Add root-level sections and weekRange (new structure from report.md)
    if (usingSectionsAtRoot) {
      reportData.sections = parsedSections;
      reportData.weekRange = weekRange || null;
    }

    // Add nested content structure (current structure for backward compatibility)
    if (usingNestedContent) {
      reportData.content = content;
    }

    if (!isDraft) {
      // Generate PDF - pass the entire report data
      const pdfBuffer = await generatePDF({ 
        ...reportData, 
        userId: req.user,
        createdAt: new Date()
      });
      
      const tempDir = path.join(process.cwd(), 'tmp');
      try {
        fs.mkdirSync(tempDir, { recursive: true });
      } catch (e) {
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
      reportData.pdfUrl = uploadResult.secure_url;
      reportData.filePublicId = uploadResult.public_id;
      reportData.fileName = `report-${weekStart}-${weekEnd}.pdf`;
      reportData.filePath = tempPath;
    }

    const report = new Report(reportData);
    await report.save();

    // Populate user info
    await report.populate('userId', 'firstName lastName email');

    // Send email notification to admin and notification emails for non-draft reports
    if (!isDraft) {
      const notificationEmails = [];
      if (process.env.ADMIN_EMAIL) {
        notificationEmails.push(process.env.ADMIN_EMAIL);
      }
      if (process.env.HR_EMAIL) {
        notificationEmails.push(process.env.HR_EMAIL);
      }
      if (process.env.NOTIFICATION_EMAILS) {
        const additionalEmails = process.env.NOTIFICATION_EMAILS.split(',').map(e => e.trim());
        notificationEmails.push(...additionalEmails);
      }

      if (notificationEmails.length > 0) {
        try {
          const uniqueEmails = [...new Set(notificationEmails)];
          const author = usingSectionsAtRoot 
            ? `${req.user.firstName} ${req.user.lastName}`
            : (content?.metadata?.author || `${req.user.firstName} ${req.user.lastName}`);
          const range = weekRange || content?.metadata?.weekRange || `${weekStart} to ${weekEnd}`;
          
          await sendEmail({
            to: uniqueEmails.join(','),
            subject: `New Weekly Report Submitted - ${author}`,
            template: 'newReport',
            data: {
              author,
              weekRange: range,
              submittedAt: new Date(),
              reportUrl: `${process.env.APP_URL || 'http://localhost:5000'}/admin/reports/${report._id}`,
              pdfUrl: reportData.pdfUrl
            }
          });
        } catch (emailError) {
          logger.error('Failed to send report notification email:', emailError);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: isDraft ? 'Draft saved successfully.' : 'Report submitted successfully.',
      data: report
    });
  } catch (error) {
    logger.error('Create report error:', error);
    res.status(500).json({ success: false, message: 'Failed to create report.', error: error.message });
  }
});

// @route   POST /api/reports/draft
// @desc    Save a draft report
// @access  Private
router.post('/draft', authenticate, async (req, res) => {
  try {
    const { weekStart, weekEnd, weekRange, sections, content } = req.body;

    if (!weekStart || !weekEnd) {
      return res.status(400).json({ success: false, message: 'weekStart and weekEnd are required.' });
    }

    // Parse sections if it's a JSON string
    let parsedSections = null;
    if (sections) {
      parsedSections = typeof sections === 'string' ? JSON.parse(sections) : sections;
    }

    // Find existing draft or create new
    let report = await Report.findOne({
      userId: req.user._id,
      weekStart: new Date(weekStart),
      weekEnd: new Date(weekEnd),
      isDraft: true
    });

    const updateData = {
      lastEdited: new Date()
    };

    // Support both structures
    if (parsedSections) {
      updateData.sections = parsedSections;
      updateData.weekRange = weekRange || null;
    }
    if (content) {
      updateData.content = content;
    }

    if (report) {
      Object.assign(report, updateData);
      await report.save();
    } else {
      report = new Report({
        userId: req.user._id,
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd),
        weekRange,
        sections: parsedSections,
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
    const reports = await Report.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (error) {
    logger.error('Get my reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch your reports.' });
  }
});

// @route   GET /api/reports
// @desc    Get all reports (admin)
// @access  Private (admin)
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { status, userId, isDraft } = req.query;
    const q = {};
    if (status) q.status = status;
    if (userId) q.userId = userId;
    if (isDraft !== undefined) q.isDraft = isDraft === 'true';

    const reports = await Report.find(q)
      .populate('userId', 'firstName lastName email employeeId')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (error) {
    logger.error('Get all reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reports.' });
  }
});

// @route   GET /api/reports/:id
// @desc    Get single report with full details including visits and quotations data
// @access  Private (owner or admin/manager)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone employeeId')
      .populate('reviewedBy', 'firstName lastName email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check access: owner or admin/manager
    const isOwner = report.userId._id.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'manager'].includes(req.user.role);
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Fetch all visits for this user within the report's week range
    const visits = await Visit.find({
      userId: report.userId._id,
      date: {
        $gte: report.weekStart,
        $lte: report.weekEnd
      }
    })
    .populate('userId', 'firstName lastName email employeeId')
    .populate('followUpActions.assignedTo', 'firstName lastName email')
    .sort({ date: 1 })
    .lean();

    // Fetch all quotation requests for this user within the report's week range
    const quotations = await Request.find({
      userId: report.userId._id,
      createdAt: {
        $gte: report.weekStart,
        $lte: report.weekEnd
      }
    })
    .populate('userId', 'firstName lastName email employeeId')
    .populate('response.respondedBy', 'firstName lastName email')
    .sort({ createdAt: 1 })
    .lean();

    // Calculate summary statistics
    const visitStats = {
      total: visits.length,
      byOutcome: {
        successful: visits.filter(v => v.visitOutcome === 'successful').length,
        pending: visits.filter(v => v.visitOutcome === 'pending').length,
        followup_required: visits.filter(v => v.visitOutcome === 'followup_required').length,
        no_interest: visits.filter(v => v.visitOutcome === 'no_interest').length
      },
      byPurpose: {
        demo: visits.filter(v => v.visitPurpose === 'demo').length,
        followup: visits.filter(v => v.visitPurpose === 'followup').length,
        installation: visits.filter(v => v.visitPurpose === 'installation').length,
        maintenance: visits.filter(v => v.visitPurpose === 'maintenance').length,
        consultation: visits.filter(v => v.visitPurpose === 'consultation').length,
        sales: visits.filter(v => v.visitPurpose === 'sales').length,
        other: visits.filter(v => v.visitPurpose === 'other').length
      },
      totalPotentialValue: visits.reduce((sum, v) => sum + (v.totalPotentialValue || 0), 0)
    };

    const quotationStats = {
      total: quotations.length,
      byStatus: {
        pending: quotations.filter(q => q.status === 'pending').length,
        in_progress: quotations.filter(q => q.status === 'in_progress').length,
        responded: quotations.filter(q => q.status === 'responded').length,
        completed: quotations.filter(q => q.status === 'completed').length,
        rejected: quotations.filter(q => q.status === 'rejected').length
      },
      byUrgency: {
        low: quotations.filter(q => q.urgency === 'low').length,
        medium: quotations.filter(q => q.urgency === 'medium').length,
        high: quotations.filter(q => q.urgency === 'high').length
      }
    };

    // Combine all data for frontend PDF generation
    const responseData = {
      report: report.toObject(),
      visits,
      quotations,
      statistics: {
        visits: visitStats,
        quotations: quotationStats
      },
      meta: {
        totalVisits: visits.length,
        totalQuotations: quotations.length,
        weekRange: report.weekRange,
        submittedAt: report.createdAt,
        salesRep: {
          name: `${report.userId.firstName} ${report.userId.lastName}`,
          email: report.userId.email,
          employeeId: report.userId.employeeId,
          phone: report.userId.phone
        }
      }
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    logger.error('Fetch report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report'
    });
  }
});

// @route   PUT /api/reports/:id/status
// @desc    Update report status (admin)
// @access  Private (admin)
router.put('/:id/status', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const allowed = ['pending', 'reviewed', 'approved', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be: pending, reviewed, approved, or rejected' 
      });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id, 
      { 
        status, 
        adminNotes,
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      }, 
      { new: true }
    ).populate('userId', 'firstName lastName email employeeId');
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

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
