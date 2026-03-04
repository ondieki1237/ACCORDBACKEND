import EmailClientService from '../services/emailClientService.js';
import EmailSession from '../models/EmailSession.js';
import EmailActivity from '../models/EmailActivity.js';
import { encryptPassword, decryptPassword } from '../utils/credentialEncrypt.js';
import logger from '../utils/logger.js';

/**
 * Setup email session - Store encrypted credentials
 * POST /api/mail/setup
 */
export async function setupEmailSession(req, res) {
  try {
    const { email, password } = req.body;
    const userId = req.user._id;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    // Test IMAP connection before storing
    try {
      const emailService = new EmailClientService(email, password);
      await emailService.connect();
      emailService.disconnect();
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email credentials or IMAP not available',
        error: error.message 
      });
    }

    // Encrypt password
    const encryptedPassword = encryptPassword(password);

    // Update or create session
    const session = await EmailSession.findOneAndUpdate(
      { userId },
      {
        userId,
        email,
        encryptedPassword,
        isActive: true,
        lastSync: new Date()
      },
      { upsert: true, new: true }
    );

    // Log activity
    await EmailActivity.create({
      userId,
      action: 'settings_updated',
      details: { email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'Email configured successfully', data: { email: session.email } });
  } catch (error) {
    logger.error('setupEmailSession error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get inbox emails
 * GET /api/mail/inbox?page=1&limit=20
 */
export async function getInbox(req, res) {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get email session
    const session = await EmailSession.findOne({ userId, isActive: true });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Email not configured. Please setup your email first.' });
    }

    // Decrypt password
    const password = decryptPassword(session.encryptedPassword);

    // Fetch emails
    const emailService = new EmailClientService(session.email, password);
    const result = await emailService.fetchInbox(limit, offset);
    emailService.disconnect();

    // Log activity
    await EmailActivity.create({
      userId,
      action: 'inbox_viewed',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('getInbox error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get single email
 * GET /api/mail/email/:uid
 */
export async function getEmail(req, res) {
  try {
    const userId = req.user._id;
    const { uid } = req.params;

    // Get email session
    const session = await EmailSession.findOne({ userId, isActive: true });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Email not configured' });
    }

    // Decrypt password
    const password = decryptPassword(session.encryptedPassword);

    // Fetch email
    const emailService = new EmailClientService(session.email, password);
    const email = await emailService.fetchEmail(uid);
    
    // Mark as read
    try {
      await emailService.markAsRead(uid);
    } catch (e) {
      logger.warn('Could not mark as read:', e.message);
    }
    
    emailService.disconnect();

    // Log activity
    await EmailActivity.create({
      userId,
      action: 'email_read',
      emailSubject: email.subject,
      emailFrom: email.from,
      ipAddress: req.ip
    });

    res.json({ success: true, data: email });
  } catch (error) {
    logger.error('getEmail error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Send email
 * POST /api/mail/send
 */
export async function sendEmail(req, res) {
  try {
    const userId = req.user._id;
    const { to, subject, body, html } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ success: false, message: 'Missing required fields: to, subject, body' });
    }

    // Get email session
    const session = await EmailSession.findOne({ userId, isActive: true });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Email not configured' });
    }

    // Decrypt password
    const password = decryptPassword(session.encryptedPassword);

    // Send email
    const emailService = new EmailClientService(session.email, password);
    const result = await emailService.sendEmail(to, subject, html || body, body);
    emailService.disconnect();

    // Log activity
    await EmailActivity.create({
      userId,
      action: 'email_sent',
      recipient: to,
      emailSubject: subject,
      details: { to, subject },
      ipAddress: req.ip,
      status: 'success'
    });

    res.json({ success: true, message: 'Email sent successfully', data: result });
  } catch (error) {
    logger.error('sendEmail error:', error);
    
    // Log failed attempt
    await EmailActivity.create({
      userId: req.user._id,
      action: 'email_sent',
      status: 'failed',
      errorMessage: error.message,
      ipAddress: req.ip
    });

    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Reply to email
 * POST /api/mail/reply/:uid
 */
export async function replyEmail(req, res) {
  try {
    const userId = req.user._id;
    const { uid } = req.params;
    const { body, html } = req.body;

    if (!body) {
      return res.status(400).json({ success: false, message: 'Reply body required' });
    }

    // Get email session
    const session = await EmailSession.findOne({ userId, isActive: true });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Email not configured' });
    }

    // Decrypt password
    const password = decryptPassword(session.encryptedPassword);

    // Fetch original email
    const emailService = new EmailClientService(session.email, password);
    const originalEmail = await emailService.fetchEmail(uid);
    
    // Send reply
    await emailService.sendEmail(
      originalEmail.from,
      `Re: ${originalEmail.subject}`,
      html || body,
      body
    );
    
    emailService.disconnect();

    // Log activity
    await EmailActivity.create({
      userId,
      action: 'email_replied',
      recipient: originalEmail.from,
      emailSubject: originalEmail.subject,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Reply sent successfully' });
  } catch (error) {
    logger.error('replyEmail error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Mark email as read/unread
 * PUT /api/mail/email/:uid/read
 */
export async function markEmailRead(req, res) {
  try {
    const userId = req.user._id;
    const { uid } = req.params;
    const { isRead } = req.body;

    // Get email session
    const session = await EmailSession.findOne({ userId, isActive: true });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Email not configured' });
    }

    // Decrypt password
    const password = decryptPassword(session.encryptedPassword);

    // Mark as read/unread
    const emailService = new EmailClientService(session.email, password);
    if (isRead) {
      await emailService.markAsRead(uid);
    } else {
      await emailService.markAsUnread(uid);
    }
    emailService.disconnect();

    res.json({ success: true, message: `Email marked as ${isRead ? 'read' : 'unread'}` });
  } catch (error) {
    logger.error('markEmailRead error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Delete email
 * DELETE /api/mail/email/:uid
 */
export async function deleteEmail(req, res) {
  try {
    const userId = req.user._id;
    const { uid } = req.params;

    // Get email session
    const session = await EmailSession.findOne({ userId, isActive: true });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Email not configured' });
    }

    // Decrypt password
    const password = decryptPassword(session.encryptedPassword);

    // Delete email
    const emailService = new EmailClientService(session.email, password);
    await emailService.deleteEmail(uid);
    emailService.disconnect();

    // Log activity
    await EmailActivity.create({
      userId,
      action: 'email_deleted',
      details: { uid },
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Email deleted successfully' });
  } catch (error) {
    logger.error('deleteEmail error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Search emails
 * GET /api/mail/search?from=...&subject=...
 */
export async function searchEmails(req, res) {
  try {
    const userId = req.user._id;
    const { from, subject, body, since, unseen } = req.query;

    // Get email session
    const session = await EmailSession.findOne({ userId, isActive: true });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Email not configured' });
    }

    // Decrypt password
    const password = decryptPassword(session.encryptedPassword);

    // Search emails
    const emailService = new EmailClientService(session.email, password);
    const uids = await emailService.searchEmails({
      from,
      subject,
      body,
      since,
      unseen: unseen === 'true'
    });
    emailService.disconnect();

    // Log activity
    await EmailActivity.create({
      userId,
      action: 'search_performed',
      details: { from, subject, body, since },
      ipAddress: req.ip
    });

    res.json({ success: true, data: { uids, count: uids.length } });
  } catch (error) {
    logger.error('searchEmails error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get folders
 * GET /api/mail/folders
 */
export async function getFolders(req, res) {
  try {
    const userId = req.user._id;

    // Get email session
    const session = await EmailSession.findOne({ userId, isActive: true });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Email not configured' });
    }

    // Decrypt password
    const password = decryptPassword(session.encryptedPassword);

    // Get folders
    const emailService = new EmailClientService(session.email, password);
    const folders = await emailService.getFolders();
    emailService.disconnect();

    res.json({ success: true, data: folders });
  } catch (error) {
    logger.error('getFolders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get email statistics
 * GET /api/mail/stats
 */
export async function getEmailStats(req, res) {
  try {
    const userId = req.user._id;

    // Get email session
    const session = await EmailSession.findOne({ userId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Email not configured' });
    }

    // Get unread count
    const password = decryptPassword(session.encryptedPassword);
    const emailService = new EmailClientService(session.email, password);
    const unreadCount = await emailService.getUnreadCount();
    emailService.disconnect();

    // Get activity stats
    const activityStats = await EmailActivity.aggregate([
      { $match: { userId } },
      { $group: {
        _id: '$action',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 }}
    ]);

    res.json({ 
      success: true, 
      data: {
        unreadCount,
        lastSync: session.lastSync,
        activityStats
      }
    });
  } catch (error) {
    logger.error('getEmailStats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export default {
  setupEmailSession,
  getInbox,
  getEmail,
  sendEmail,
  replyEmail,
  markEmailRead,
  deleteEmail,
  searchEmails,
  getFolders,
  getEmailStats
};
