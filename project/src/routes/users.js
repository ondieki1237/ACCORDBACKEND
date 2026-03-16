import express from 'express';
import User from '../models/User.js';
import UserDeletionAudit from '../models/UserDeletionAudit.js';
import { authenticate, authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import Visit from '../models/Visit.js';
import Report from '../models/Report.js';
import Lead from '../models/Lead.js';
import Planner from '../models/Planner.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin/manager)
// @access  Private
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json({ success: true, data: users });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to get users' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (admin/manager or self)
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true, select: '-password' });
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (admin only) 
 * ⚠️  CRITICAL: All deletions are audited and logged
 * @access  Private (admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  let auditLog = null;
  try {
    const userId = req.params.id;
    const reason = req.body?.reason || 'No reason provided';

    // Fetch user before deletion
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Count related data
    const [visitsCount, reportsCount, leadsCount, plannersCount] = await Promise.all([
      Visit.countDocuments({ userId }),
      Report.countDocuments({ userId }),
      Lead.countDocuments({ userId }),
      Planner.countDocuments({ userId })
    ]);

    const totalRelatedData = visitsCount + reportsCount + leadsCount + plannersCount;

    // Create audit log BEFORE deletion
    auditLog = new UserDeletionAudit({
      deletedUserId: userToDelete._id,
      deletedUserEmail: userToDelete.email,
      deletedUserName: `${userToDelete.firstName} ${userToDelete.lastName}`,
      deletedUserRole: userToDelete.role,
      deletedBy: req.user._id,
      deletedByEmail: req.user.email,
      deletedByRole: req.user.role,
      reason: reason,
      method: 'api',
      endpoint: '/api/users/:id (DELETE)',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || 'Unknown',
      lastLogin: userToDelete.lastLogin,
      userDataPreserved: totalRelatedData > 0,
      recoveryAvailable: true,
      backupLocation: 'MySQL backup, UserDeletionAudit collection',
      notes: `Deleted ${visitsCount} visits, ${reportsCount} reports, ${leadsCount} leads, ${plannersCount} planners`
    });

    await auditLog.save();

    // Delete the user
    await User.findByIdAndDelete(userId);

    logger.warn(`⚠️  USER DELETION - Admin ${req.user.email} deleted user ${userToDelete.email}. Reason: ${reason}. Data preserved: ${totalRelatedData} records. Audit ID: ${auditLog._id}`);

    res.json({
      success: true,
      message: 'User deleted successfully',
      audit: {
        id: auditLog._id,
        relatedDataPreserved: totalRelatedData
      }
    });
  } catch (error) {
    // Log deletion error
    try {
      const user = await User.findById(req.params.id);
      if (user && !auditLog) {
        const errorLog = new UserDeletionAudit({
          deletedUserId: user._id,
          deletedUserEmail: user.email,
          deletedUserName: `${user.firstName} ${user.lastName}`,
          deletedUserRole: user.role,
          deletedBy: req.user._id,
          deletedByEmail: req.user.email,
          deletedByRole: req.user.role,
          reason: `FAILED: ${error.message}`,
          method: 'api',
          endpoint: '/api/users/:id (DELETE)',
          notes: error.message
        });
        await errorLog.save();
      }
    } catch (auditErr) {
      logger.error('Failed to log deletion error:', auditErr);
    }

    logger.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

export default router;
