import PlannerApproval from '../models/PlannerApproval.js';
import Planner from '../models/Planner.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Middleware to restrict access to specific emails
export function restrictToEmails(emails) {
  return (req, res, next) => {
    if (!req.user || !emails.includes(req.user.email)) {
      return res.status(403).json({ success: false, message: 'Access denied: not authorized for this page.' });
    }
    next();
  };
}

// Supervisor approves/disapproves planner
export const supervisorReviewPlanner = async (req, res, next) => {
  try {
    // Debug log incoming body and headers
    console.log('SUPERVISOR REVIEW DEBUG: req.body =', req.body);
    console.log('SUPERVISOR REVIEW DEBUG: req.headers =', req.headers);
    const { plannerId } = req.params;
    if (!req.body) {
      return res.status(400).json({ success: false, message: 'Missing request body. Please send JSON with status and comment.' });
    }
    const { status, comment } = req.body;
    if (!['approved', 'disapproved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const planner = await Planner.findById(plannerId);
    if (!planner) return res.status(404).json({ success: false, message: 'Planner not found' });

    let approval = await PlannerApproval.findOne({ plannerId });
    if (!approval) {
      approval = new PlannerApproval({ plannerId });
    }
    approval.status = status;
    approval.supervisor = {
      userId: req.user._id,
      name: req.user.fullName || req.user.firstName + ' ' + req.user.lastName,
      email: req.user.email,
      comment,
      date: new Date()
    };
    approval.updatedAt = new Date();
    await approval.save();
    res.json({ success: true, data: approval });
  } catch (err) {
    logger.error('supervisorReviewPlanner error:', err);
    next(err);
  }
};

// Accountant reviews planner (only if approved by supervisor)
export const accountantReviewPlanner = async (req, res, next) => {
  try {
    const { plannerId } = req.params;
    const { comment } = req.body;
    const approval = await PlannerApproval.findOne({ plannerId });
    if (!approval || approval.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Planner must be approved by supervisor first' });
    }
    approval.accountant = {
      userId: req.user._id,
      name: req.user.fullName || req.user.firstName + ' ' + req.user.lastName,
      email: req.user.email,
      comment,
      date: new Date()
    };
    approval.updatedAt = new Date();
    await approval.save();
    res.json({ success: true, data: approval });
  } catch (err) {
    logger.error('accountantReviewPlanner error:', err);
    next(err);
  }
};

// Get approval status for a planner
export const getPlannerApproval = async (req, res, next) => {
  try {
    const { plannerId } = req.params;
    const approval = await PlannerApproval.findOne({ plannerId });
    if (!approval) {
      // Return a default status section if no approval record exists
      return res.json({
        success: true,
        data: {
          plannerId,
          status: 'pending',
          supervisor: null,
          accountant: null
        }
      });
    }
    res.json({ success: true, data: approval });
  } catch (err) {
    logger.error('getPlannerApproval error:', err);
    next(err);
  }
};
