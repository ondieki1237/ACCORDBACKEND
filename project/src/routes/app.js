import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

// Current app version configuration
const APP_VERSION_CONFIG = {
  android: {
    version: '1.0.0',
    buildNumber: 1,
    downloadUrl: 'https://app.codewithseth.co.ke/downloads/accord-medical-v1.0.0.apk',
    changelog: 'Initial release',
    forceUpdate: false,
    minSupportedVersion: '1.0.0'
  },
  ios: {
    version: '1.0.0',
    buildNumber: 1,
    downloadUrl: 'https://apps.apple.com/app/accord-medical/id123456789',
    changelog: 'Initial release',
    forceUpdate: false,
    minSupportedVersion: '1.0.0'
  }
};

// @route   GET /api/app/version
// @desc    Check for app updates (public endpoint for mobile apps)
// @access  Public
router.get('/version', async (req, res) => {
  try {
    const { platform, currentVersion } = req.query;

    // Validate platform
    if (!platform || !['android', 'ios'].includes(platform.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing platform. Must be "android" or "ios"'
      });
    }

    const platformLower = platform.toLowerCase();
    const versionInfo = APP_VERSION_CONFIG[platformLower];

    // Check if current version is provided for comparison
    let updateAvailable = false;
    let forceUpdate = false;

    if (currentVersion) {
      updateAvailable = isNewerVersion(versionInfo.version, currentVersion);
      forceUpdate = versionInfo.forceUpdate && 
                    isNewerVersion(currentVersion, versionInfo.minSupportedVersion);
    }

    // Log the version check
    logger.info(`App version check: ${platform} v${currentVersion || 'unknown'} - Update available: ${updateAvailable}`);

    res.json({
      success: true,
      data: {
        version: versionInfo.version,
        buildNumber: versionInfo.buildNumber,
        downloadUrl: versionInfo.downloadUrl,
        changelog: versionInfo.changelog,
        forceUpdate: forceUpdate,
        updateAvailable: updateAvailable,
        minSupportedVersion: versionInfo.minSupportedVersion
      }
    });

  } catch (error) {
    logger.error('App version check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check app version'
    });
  }
});

// @route   GET /api/app/changelog
// @desc    Get full changelog history
// @access  Public
router.get('/changelog', async (req, res) => {
  try {
    const changelog = {
      android: [
        {
          version: '1.0.0',
          buildNumber: 1,
          releaseDate: '2025-10-30',
          changes: [
            'Initial release',
            'Visit tracking with location',
            'Report submission',
            'Quotation requests',
            'Real-time notifications',
            'Dashboard analytics'
          ]
        }
      ],
      ios: [
        {
          version: '1.0.0',
          buildNumber: 1,
          releaseDate: '2025-10-30',
          changes: [
            'Initial release',
            'Visit tracking with location',
            'Report submission',
            'Quotation requests',
            'Real-time notifications',
            'Dashboard analytics'
          ]
        }
      ]
    };

    res.json({
      success: true,
      data: changelog
    });

  } catch (error) {
    logger.error('Changelog fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch changelog'
    });
  }
});

// Helper function to compare versions
function isNewerVersion(latest, current) {
  if (!current) return true;
  
  const latestParts = latest.split('.').map(Number);
  const currentParts = current.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const latestPart = latestParts[i] || 0;
    const currentPart = currentParts[i] || 0;
    
    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }
  
  return false;
}

export default router;
