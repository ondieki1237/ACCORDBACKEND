import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import { authenticate } from '../middleware/auth.js';
import {
  validateLogin,
  validateRegistration,
  validatePasswordResetRequest,
  validatePasswordResetVerify,
  validatePasswordResetReset
} from '../middleware/validation.js';
import { sendEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Password reset constants (per PASSWORD_RESET.md)
const PASSWORD_RESET_RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_RESET_REQUESTS_PER_EMAIL = 3;
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;

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

// @route   POST /api/auth/register
// @desc    Register new user (PUBLIC - Sales/Engineer only)
// @access  Public
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { employeeId, firstName, lastName, email, password, role, region, territory, department } = req.body;

    // PUBLIC REGISTRATION: Only allow 'sales' and 'engineer' roles
    const allowedPublicRoles = ['sales', 'engineer'];
    const userRole = role && allowedPublicRoles.includes(role.toLowerCase()) ? role.toLowerCase() : 'sales';

    if (role && !allowedPublicRoles.includes(role.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: 'Public registration only allows Sales and Engineer roles. Contact admin for other roles.'
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

    const user = new User({
      employeeId,
      firstName,
      lastName,
      email,
      password,
      role: userRole,
      region,
      territory,
      ...(department && { department }) // Only include department if it's not empty
    });

    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
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
      message: 'User registered successfully',
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isActive: true });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.refreshTokens.some(token => token.token === refreshToken)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter(token => token.token !== refreshToken);
    user.refreshTokens.push({ token: newRefreshToken });
    await user.save();

    // Also include new access token in header for convenient client rotation
    res.set('X-New-Access-Token', accessToken);
    res.json({
      success: true,
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken
        }
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { refreshTokens: { token: refreshToken } }
      });
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, isActive: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send reset email
    try {
      await sendEmail({
        to: email,
        subject: 'Password Reset Request',
        template: 'resetPassword',
        data: {
          firstName: user.firstName,
          resetUrl: `${process.env.CLIENT_URL}/reset-password/${resetToken}`
        }
      });

      res.json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      logger.error('Failed to send password reset email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
});

// --- Password reset (6-digit code flow per PASSWORD_RESET.md) ---

// @route   POST /api/auth/password-reset/request
// @desc    Request password reset — sends 6-digit code to email
// @access  Public
router.post('/password-reset/request', validatePasswordResetRequest, async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Invalid email format', error: 'INVALID_EMAIL' });
    }

    // Rate limit: max 3 requests per email per 15 minutes
    const since = new Date(Date.now() - PASSWORD_RESET_RATE_WINDOW_MS);
    const recentCount = await PasswordResetToken.countDocuments({ email, createdAt: { $gte: since } });
    if (recentCount >= MAX_RESET_REQUESTS_PER_EMAIL) {
      return res.status(429).json({
        success: false,
        message: 'Too many reset requests. Please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 900
      });
    }

    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address',
        error: 'EMAIL_NOT_FOUND'
      });
    }

    // Invalidate any existing unexpired tokens for this email
    await PasswordResetToken.updateMany(
      { email, usedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } }
    );

    const code = String(crypto.randomInt(100000, 1000000)); // 6 digits
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS);

    const tokenDoc = await PasswordResetToken.create({
      userId: user._id,
      email,
      codeHash,
      expiresAt,
      verified: false,
      attempts: 0
    });

    const isDevOrLogCode = process.env.NODE_ENV === 'development' || process.env.PASSWORD_RESET_DEV_LOG_CODE === 'true';
    let emailActuallySent = true;

    try {
      await sendEmail({
        to: email,
        subject: 'ACCORD Password Reset Code',
        template: 'passwordResetCode',
        data: { firstName: user.firstName, code }
      });
    } catch (emailErr) {
      logger.error('Password reset email error:', emailErr);
      if (isDevOrLogCode) {
        emailActuallySent = false;
        logger.info(`[DEV] Password reset code for ${email}: ${code} (email not sent — configure EMAIL_* in .env for real delivery)`);
      } else {
        await PasswordResetToken.findByIdAndDelete(tokenDoc._id);
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification code. Please try again.'
        });
      }
    }

    logger.info(`Password reset requested for ${email}`);
    const payload = {
      success: true,
      message: emailActuallySent ? 'Verification code sent to your email' : 'Verification code generated; in development the code was logged to the server console (email not sent).',
      data: { email, codeExpiresAt: expiresAt.toISOString() }
    };
    if (!emailActuallySent) payload.data.devCodeLogged = true; // frontend can show "check server logs" in dev
    return res.status(200).json(payload);
  } catch (err) {
    logger.error('Password reset request error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});

// @route   POST /api/auth/password-reset/verify
// @desc    Verify 6-digit code
// @access  Public
router.post('/password-reset/verify', validatePasswordResetVerify, async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const code = String(req.body.code).trim();

    const token = await PasswordResetToken.findOne({
      email,
      usedAt: null,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'No password reset request found for this email',
        error: 'NO_RESET_REQUEST'
      });
    }

    if (token.expiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
        error: 'CODE_EXPIRED'
      });
    }

    token.attempts += 1;
    await token.save();

    if (token.attempts > MAX_VERIFY_ATTEMPTS) {
      token.usedAt = new Date();
      await token.save();
      return res.status(401).json({
        success: false,
        message: 'Too many failed attempts. Please request a new code.',
        error: 'INVALID_CODE'
      });
    }

    const match = await bcrypt.compare(code, token.codeHash);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification code',
        error: 'INVALID_CODE'
      });
    }

    token.verified = true;
    await token.save();

    logger.info(`Password reset code verified for ${email}`);
    return res.status(200).json({
      success: true,
      message: 'Code verified successfully',
      data: { email, verified: true }
    });
  } catch (err) {
    logger.error('Password reset verify error:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify code' });
  }
});

// @route   POST /api/auth/password-reset/reset
// @desc    Set new password after code verification
// @access  Public
router.post('/password-reset/reset', validatePasswordResetReset, async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const code = String(req.body.code).trim();
    const newPassword = req.body.newPassword;

    const token = await PasswordResetToken.findOne({
      email,
      verified: true,
      usedAt: null,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'No password reset request found for this email',
        error: 'NO_RESET_REQUEST'
      });
    }

    if (token.expiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'Verification code has expired. Please start over.',
        error: 'CODE_EXPIRED'
      });
    }

    const codeMatch = await bcrypt.compare(code, token.codeHash);
    if (!codeMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or unverified code',
        error: 'INVALID_CODE'
      });
    }

    const user = await User.findById(token.userId);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'No password reset request found for this email',
        error: 'NO_RESET_REQUEST'
      });
    }

    user.password = newPassword;
    user.refreshTokens = [];
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.lastPasswordChangeAt = new Date();
    await user.save();

    token.usedAt = new Date();
    await token.save();

    try {
      await sendEmail({
        to: email,
        subject: 'ACCORD Password Changed',
        template: 'passwordResetConfirm',
        data: { firstName: user.firstName }
      });
    } catch (emailErr) {
      logger.error('Password reset confirmation email error:', emailErr);
    }

    logger.info(`Password reset completed for ${email}`);
    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: { email, passwordUpdated: true }
    });
  } catch (err) {
    logger.error('Password reset (reset) error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

// @route   PUT /api/auth/reset-password/:token
// @desc    Reset password (legacy link-based flow)
// @access  Public
router.put('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const resetToken = req.params.token;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
      isActive: true
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.refreshTokens = []; // Clear all refresh tokens
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current authenticated user
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    // Optionally, fetch fresh user data from DB:
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user info' });
  }
});

export default router;