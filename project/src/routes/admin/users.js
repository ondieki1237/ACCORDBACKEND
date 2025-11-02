import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { listAdminUsers } from '../../controllers/adminUsersController.js';
import User from '../../models/User.js';
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

export default router;