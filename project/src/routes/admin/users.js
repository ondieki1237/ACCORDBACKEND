import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { listAdminUsers } from '../../controllers/adminUsersController.js';
import User from '../../models/User.js';
import AdminAction from '../../models/AdminAction.js';
import { sendEmail } from '../../services/emailService.js';
import logger from '../../utils/logger.js';

const router = express.Router();

router.use(authenticate, authorize('admin'));

// GET /api/admin/users
router.get('/', listAdminUsers);

// POST /api/admin/users - Admin registration endpoint (all roles allowed)
router.post('/', async (req, res) => {
  try {
    const { employeeId, firstName, lastName, email, password, role, region, territory, department, phone } = req.body;

    // Validate required fields
    if (!employeeId || !firstName || !lastName || !email || !password || !role || !region) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: employeeId, firstName, lastName, email, password, role, region'
      });
    }

    // ADMIN REGISTRATION: Allow all roles
    const allowedRoles = ['admin', 'manager', 'sales', 'engineer'];
    if (!allowedRoles.includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}`
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { employeeId }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or employee ID already exists'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const user = new User({
      employeeId,
      firstName,
      lastName,
      email,
      password,
      role: role.toLowerCase(),
      region,
      ...(territory && { territory }),
      ...(department && { department }),
      ...(phone && { phone })
    });

    await user.save();

    // Send welcome email
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to Accord Medical',
        template: 'welcome',
        data: {
          firstName,
          employeeId,
          loginUrl: process.env.CLIENT_URL || 'https://app.accordmedical.co.ke'
        }
      });
    } catch (emailError) {
      logger.error('Failed to send welcome email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    logger.error('Admin user creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

// POST /api/admin/users/:id/recover-password
// Admin-triggered password recovery: sends a reset link by default, or a temporary password when `method=temp`.
router.post('/:id/recover-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { method } = req.body; // 'link' (default) or 'temp'

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!['link', 'temp', undefined].includes(method)) {
      return res.status(400).json({ success: false, message: 'Invalid method. Use "link" or "temp".' });
    }

    // Default: send reset link using existing flow
    if (!method || method === 'link') {
      const crypto = await import('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();

      try {
        await sendEmail({
          to: user.email,
          subject: 'Password Reset Request',
          template: 'resetPassword',
          data: {
            firstName: user.firstName,
            resetUrl: `${process.env.CLIENT_URL}/reset-password/${resetToken}`
          }
        });

        // record admin action
        try {
          await AdminAction.create({ adminId: req.user._id, targetUserId: user._id, action: 'password_reset', method: 'link' });
        } catch (logErr) {
          logger.error('Failed to record admin action:', logErr);
        }

        return res.json({ success: true, message: 'Password reset link sent to user' });
      } catch (emailError) {
        // rollback tokens
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        logger.error('Failed to send reset link:', emailError);
        return res.status(500).json({ success: false, message: 'Failed to send reset link' });
      }
    }

    // method === 'temp' : generate a temporary password and email it
    if (method === 'temp') {
      // generate temp password
      const crypto = await import('crypto');
      const tmp = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0,10);
      user.password = tmp;
      user.mustChangePassword = true;
      user.lastPasswordChangeAt = new Date();
      // clear refresh tokens so existing sessions are invalidated
      user.refreshTokens = [];
      await user.save();

      // send email with temporary password (rawHtml)
      const rawHtml = `
        <h2>Password Recovery</h2>
        <p>Hello ${user.firstName},</p>
        <p>An administrator has reset your password. Your temporary password is:</p>
        <p><strong>${tmp}</strong></p>
        <p>Please login and change your password immediately.</p>
        <p>Login: <a href="${process.env.CLIENT_URL}">${process.env.CLIENT_URL}</a></p>
      `;

      try {
        await sendEmail({ to: user.email, subject: 'Temporary Password', template: 'default', data: { rawHtml } });

        // Record admin action
        try {
          await AdminAction.create({
            adminId: req.user._id,
            targetUserId: user._id,
            action: 'password_reset',
            method: 'temp',
            details: { note: 'Admin-generated temporary password' }
          });
        } catch (logErr) {
          logger.error('Failed to record admin action:', logErr);
        }

        return res.json({ success: true, message: 'Temporary password emailed to user' });
      } catch (emailError) {
        logger.error('Failed to send temporary password email:', emailError);
        return res.status(500).json({ success: false, message: 'Failed to send temporary password email' });
      }
    }
  } catch (error) {
    logger.error('Admin recover password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process password recovery' });
  }
});

export default router;