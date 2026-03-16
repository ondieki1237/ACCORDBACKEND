import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { getPool } from '../config/mysqlPool.js';
import { sendEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });

  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE
  });

  return { accessToken, refreshToken };
};

// Try to find user in MySQL first, fallback to MongoDB
const findUserByEmail = async (email) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (rows.length > 0) {
      return rows[0];
    }
  } catch (error) {
    logger.debug('MySQL user lookup failed, falling back to MongoDB:', error.message);
  }
  
  // Fallback to MongoDB
  return await User.findOne({ email: email.toLowerCase(), isActive: true });
};

const findUserById = async (id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length > 0) {
      return rows[0];
    }
  } catch (error) {
    logger.debug('MySQL user lookup failed, falling back to MongoDB:', error.message);
  }
  
  // Fallback to MongoDB
  return await User.findById(id).select('-password -refreshTokens');
};

// Register new user
export const register = async (req, res) => {
  try {
    const { employeeId, firstName, lastName, email, password, role, region, territory, department } = req.body;

    const allowedPublicRoles = ['sales', 'engineer'];
    const userRole = role && allowedPublicRoles.includes(role.toLowerCase()) ? role.toLowerCase() : 'sales';

    if (role && !allowedPublicRoles.includes(role.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: 'Public registration only allows Sales and Engineer roles. Contact admin for other roles.'
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { employeeId }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or employee ID already exists'
      });
    }

    const user = new User({
      employeeId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: userRole,
      region,
      territory,
      department: department || undefined
    });

    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

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
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        tokens: { accessToken, refreshToken }
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Failed to register user' });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info(`Login attempt for email: ${email}`);

    const user = await findUserByEmail(email);

    if (!user || !user.isActive) {
      logger.warn(`Login failed: User not found for email ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);
    logger.info(`Password comparison for ${email}: ${passwordMatch ? 'MATCH' : 'NO MATCH'}`);

    if (!passwordMatch) {
      logger.warn(`Login failed: Password mismatch for user ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const userId = user.id || user._id;
    const { accessToken, refreshToken } = generateTokens(userId);

    // Update last login in MongoDB and MySQL
    try {
      await User.findByIdAndUpdate(user._id || user.id, { lastLogin: new Date() });
    } catch (e) {
      logger.debug('Could not update lastLogin in MongoDB');
    }

    try {
      const pool = getPool();
      await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    } catch (e) {
      logger.debug('Could not update lastLogin in MySQL');
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          employeeId: user.employeeId
        },
        tokens: { accessToken, refreshToken }
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Failed to login' });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id || user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        employeeId: user.employeeId,
        region: user.region,
        territory: user.territory,
        isActive: user.isActive
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await findUserById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.id);

    res.status(200).json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken }
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, territory } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (territory) user.territory = territory;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const passwordMatch = await user.comparePassword(currentPassword);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    user.lastPasswordChangeAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};
