import TeraBoxApp from 'terabox-api';
import logger from '../utils/logger.js';

let teraboxApp = null;

/**
 * Initialize TeraBox authentication
 * Logs in with email and password from environment variables
 */
export const initializeTeraBox = async () => {
  try {
    if (teraboxApp) {
      logger.info('TeraBox already initialized');
      return teraboxApp;
    }

    const email = process.env.TERABOX_EMAIL;
    const password = process.env.TERABOX_PASSWORD;

    if (!email || !password) {
      logger.warn('TeraBox credentials not configured in .env - file uploads will fall back to Google Drive');
      return null;
    }

    // Create a new TeraBoxApp instance
    teraboxApp = new TeraBoxApp();

    // Attempt login
    logger.info('Attempting TeraBox login...');
    const loginResult = await teraboxApp.passportLogin(email, password);
    
    if (loginResult) {
      logger.info('TeraBox authentication successful');
      
      // Get user info to verify login
      const userInfo = await teraboxApp.getCurrentUserInfo();
      logger.info(`Logged in as TeraBox user: ${userInfo.baidu_name}`);
      
      return teraboxApp;
    } else {
      logger.error('TeraBox login failed');
      return null;
    }
  } catch (error) {
    logger.error('TeraBox initialization error:', error);
    if (error.message) logger.error('Error details:', error.message);
    if (error.stack) logger.error('Stack:', error.stack);
    logger.warn('TeraBox upload will be disabled. Falling back to Google Drive.');
    teraboxApp = null;
    return null;
  }
};

/**
 * Get the initialized TeraBox app instance
 * @returns {TeraBoxApp|null} The TeraBox app instance or null if not initialized
 */
export const getTeraBoxApp = () => {
  if (!teraboxApp) {
    logger.warn('TeraBox not initialized');
    return null;
  }
  return teraboxApp;
};

/**
 * Check if TeraBox is available
 * @returns {boolean}
 */
export const isTeraBoxAvailable = () => {
  return teraboxApp !== null;
};

/**
 * Set TeraBox app instance (useful for testing)
 * @param {TeraBoxApp} app - The TeraBox app instance
 */
export const setTeraBoxApp = (app) => {
  teraboxApp = app;
};

export default {
  initializeTeraBox,
  getTeraBoxApp,
  isTeraBoxAvailable,
  setTeraBoxApp
};
