import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAllUsers,
  getUserProfile,
  deleteUser
} from '../controllers/userController.js';
import User from '../models/User.js';
import { sendEmail } from '../services/emailService.js';
import AdminAction from '../models/AdminAction.js';
import logger from '../utils/logger.js';

const router = express.Router();

// List all users (admin only)
router.get('/', authenticate, authorize('admin'), getAllUsers);

// Get user profile by ID (admin or self)
router.get('/:id', authenticate, getUserProfile);

// Delete user by ID (admin only)
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

// Allow admin or sales to trigger password recovery for a user
// POST /api/users/:id/recover-password
router.post('/:id/recover-password', authenticate, authorize('admin', 'sales'), async (req, res) => {
  try {
    const { id } = req.params;
    const { method } = req.body; // 'link' or 'temp'

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!['link', 'temp', undefined].includes(method)) {
      return res.status(400).json({ success: false, message: 'Invalid method. Use "link" or "temp".' });
    }

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

        try { await AdminAction.create({ adminId: req.user._id, targetUserId: user._id, action: 'password_reset', method: 'link' }); } catch(e){ logger.error('AdminAction log failed', e); }

        return res.json({ success: true, message: 'Password reset link sent to user' });
      } catch (emailError) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        logger.error('Failed to send reset link:', emailError);
        return res.status(500).json({ success: false, message: 'Failed to send reset link' });
      }
    }

    if (method === 'temp') {
      const crypto = await import('crypto');
      const tmp = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0,10);
      user.password = tmp;
      user.mustChangePassword = true;
      user.lastPasswordChangeAt = new Date();
      user.refreshTokens = [];
      await user.save();

      const rawHtml = `
        <h2>Password Recovery</h2>
        <p>Hello ${user.firstName},</p>
        <p>A colleague has requested a temporary password for your account. Your temporary password is:</p>
        <p><strong>${tmp}</strong></p>
        <p>Please login and change your password immediately.</p>
        <p>Login: <a href="${process.env.CLIENT_URL}">${process.env.CLIENT_URL}</a></p>
      `;

      try {
        await sendEmail({ to: user.email, subject: 'Temporary Password', template: 'default', data: { rawHtml } });
        try { await AdminAction.create({ adminId: req.user._id, targetUserId: user._id, action: 'password_reset', method: 'temp', details: { initiatedByRole: req.user.role } }); } catch(e){ logger.error('AdminAction log failed', e); }
        return res.json({ success: true, message: 'Temporary password emailed to user' });
      } catch (emailError) {
        logger.error('Failed to send temporary password email:', emailError);
        return res.status(500).json({ success: false, message: 'Failed to send temporary password email' });
      }
    }
  } catch (error) {
    logger.error('Recover password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process password recovery' });
  }
});

export default router;