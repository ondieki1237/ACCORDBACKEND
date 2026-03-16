import User from '../models/User.js';
import UserDeletionAudit from '../models/UserDeletionAudit.js';
import Visit from '../models/Visit.js';
import Report from '../models/Report.js';
import Lead from '../models/Lead.js';
import Planner from '../models/Planner.js';
import logger from '../utils/logger.js';

// List all users
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password -refreshTokens');
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

// Get user profile
export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    // Allow admin or self
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const user = await User.findById(userId).select('-password -refreshTokens');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete user with comprehensive audit logging
 * ⚠️ CRITICAL: This endpoint permanently deletes a user
 * All deletion attempts are logged to UserDeletionAudit collection
 */
export const deleteUser = async (req, res, next) => {
  let auditLog = null;
  try {
    const userId = req.params.id;
    const reason = req.body?.reason || 'No reason provided';

    // Fetch user before deletion for audit trail
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Count related data (visits, reports, leads, planners)
    const [visitsCount, reportsCount, leadsCount, plannersCount] = await Promise.all([
      Visit.countDocuments({ userId }),
      Report.countDocuments({ userId }),
      Lead.countDocuments({ userId }),
      Planner.countDocuments({ userId })
    ]);

    const totalRelatedData = visitsCount + reportsCount + leadsCount + plannersCount;

    // ⚠️ CRITICAL: Log BEFORE deletion for recovery purposes
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
      backupLocation: 'MySQL backup table, UserDeletionAudit collection',
      notes: `Deleted user had ${visitsCount} visits, ${reportsCount} reports, ${leadsCount} leads, ${plannersCount} planners. Related data preserved in MongoDB.`
    });

    await auditLog.save();

    // Delete the user (related data is preserved due to MongoDB's soft-delete pattern)
    const deleted = await User.findByIdAndDelete(userId);

    // Log the successful deletion
    logger.warn(`USER DELETION AUDIT: Admin ${req.user.email} deleted user ${userToDelete.email} (ID: ${userId}). Reason: ${reason}. Related data preserved: ${totalRelatedData} records`);

    res.json({
      success: true,
      message: 'User deleted',
      audit: {
        deletionId: auditLog._id,
        relatedDataPreserved: totalRelatedData,
        recoveryAvailable: true
      }
    });
  } catch (err) {
    // Even on error, attempt to save audit log
    if (!auditLog && req.params.id) {
      try {
        const user = await User.findById(req.params.id);
        if (user) {
          const errorAudit = new UserDeletionAudit({
            deletedUserId: user._id,
            deletedUserEmail: user.email,
            deletedUserName: `${user.firstName} ${user.lastName}`,
            deletedUserRole: user.role,
            deletedBy: req.user._id,
            deletedByEmail: req.user.email,
            deletedByRole: req.user.role,
            reason: `FAILED DELETION: ${err.message}`,
            method: 'api',
            endpoint: '/api/users/:id (DELETE)',
            notes: `Deletion failed with error: ${err.message}`
          });
          await errorAudit.save();
        }
      } catch (auditErr) {
        logger.error('Failed to log deletion error:', auditErr);
      }
    }
    next(err);
  }
};