import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

// Current app version configuration - reads from environment
const currentVersion = process.env.VERSION_NAME || '1.2.6';
const versionCode = Number(process.env.VERSION_CODE) || 126;
const appHost = process.env.APP_HOST || 'https://app.codewithseth.co.ke';
const apkPath = process.env.APK_PATH || '/downloads/accord-medical.apk';
const changelog = process.env.CHANGELOG || 'Bug fixes and improvements';
const forceUpdate = process.env.FORCE_UPDATE === 'true';
const minSupported = process.env.MIN_SUPPORTED_VERSION || '1.0.0';

const APP_VERSION_CONFIG = {
  android: {
    version: currentVersion,
    buildNumber: versionCode,
    downloadUrl: `${appHost}${apkPath}`,
    changelog: changelog,
    forceUpdate: forceUpdate,
    minSupportedVersion: minSupported
  },
  ios: {
    version: currentVersion,
    buildNumber: versionCode,
    downloadUrl: 'https://apps.apple.com/app/accord-medical/id123456789',
    changelog: changelog,
    forceUpdate: forceUpdate,
    minSupportedVersion: minSupported
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
