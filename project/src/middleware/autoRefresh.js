import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

/**
 * Auto-refresh middleware
 * Checks if access token is close to expiring (< 20% of lifetime remaining)
 * If so, generates a new access token and sends it in response header
 */
export const autoRefresh = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next();
    }

    // Decode without verifying (we already verified in authenticate middleware)
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.exp) {
      return next();
    }

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    
    // Get token lifetime from env (convert to seconds)
    const jwtExpire = process.env.JWT_EXPIRE || '7d';
    const lifetimeSeconds = parseExpireTime(jwtExpire);
    
    // If less than 20% of lifetime remaining, issue new token
    const refreshThreshold = lifetimeSeconds * 0.2;
    
    if (timeUntilExpiry < refreshThreshold && timeUntilExpiry > 0) {
      const newAccessToken = jwt.sign(
        { id: decoded.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );
      
      // Send new token in response header
      res.setHeader('X-New-Access-Token', newAccessToken);
      
      logger.info('Auto-refreshed access token', { 
        userId: decoded.id, 
        timeUntilExpiry 
      });
    }
    
    next();
  } catch (error) {
    logger.error('Auto-refresh error:', error);
    next(); // Continue even if refresh fails
  }
};

/**
 * Parse JWT expire time string to seconds
 * Supports: 60, "2h", "7d", "30d", etc.
 */
function parseExpireTime(timeStr) {
  if (typeof timeStr === 'number') return timeStr;
  
  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (!match) return 604800; // Default 7 days
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400
  };
  
  return value * (multipliers[unit] || 1);
}
