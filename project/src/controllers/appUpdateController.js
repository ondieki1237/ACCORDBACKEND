import AppUpdate from '../models/AppUpdate.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const semverGreater = (a, b) => {
  if (!a || !b) return false;
  const pa = a.split('.').map(n => Number(n));
  const pb = b.split('.').map(n => Number(n));
  for (let i=0;i<Math.max(pa.length,pb.length);i++){
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na>nb) return true;
    if (na<nb) return false;
  }
  return false;
};

export const createUpdate = async (req, res) => {
  try {
    const payload = req.body;
    const update = await AppUpdate.create({ ...payload, createdBy: req.user?._id });
    return res.status(201).json({ success: true, data: update });
  } catch (err) {
    logger.error('createUpdate error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const listUpdates = async (req, res) => {
  try {
    const updates = await AppUpdate.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: updates });
  } catch (err) {
    logger.error('listUpdates error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getUpdate = async (req, res) => {
  try {
    const upd = await AppUpdate.findById(req.params.id).lean();
    if (!upd) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: upd });
  } catch (err) {
    logger.error('getUpdate error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateUpdate = async (req, res) => {
  try {
    const upd = await AppUpdate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.json({ success: true, data: upd });
  } catch (err) {
    logger.error('updateUpdate error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteUpdate = async (req, res) => {
  try {
    await AppUpdate.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    logger.error('deleteUpdate error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Public check endpoint: client sends role, platform, currentVersion
export const checkForUpdate = async (req, res) => {
  try {
    const { role, platform, currentVersion } = req.body || req.query;
    if (!role || !platform) return res.status(400).json({ success: false, message: 'role and platform are required' });

    // Find latest active update that targets the role (or 'all') and matches platform
    const update = await AppUpdate.findOne({ isActive: true, platform, targetRoles: { $in: [role, 'all'] } }).sort({ createdAt: -1 }).lean();
    if (!update) return res.json({ hasUpdate: false, updateAvailable: false });

    if (currentVersion && !semverGreater(update.version, currentVersion)) {
      return res.json({ hasUpdate: false, updateAvailable: false });
    }

    // Construct download URL - use APP_HOST for production domain
    const host = process.env.APP_HOST || 'https://app.codewithseth.co.ke';
    const downloadUrl = `${host}/downloads/app-debug.apk`;

    logger.info(`Update check: ${role}/${platform} - Update available: v${update.version}`);
    
    // Return format expected by frontend (VERSIONUPDATE.md)
    return res.json({ 
      hasUpdate: true,
      updateAvailable: true,  // Legacy support
      latestVersion: update.version,
      mandatory: update.forced || false,
      downloadUrl: downloadUrl,
      releaseNotes: update.releaseNotes || '',
      // Additional metadata
      update: {
        version: update.version,
        releaseNotes: update.releaseNotes,
        forced: update.forced,
        downloadUrl: downloadUrl
      }
    });
  } catch (err) {
    logger.error('checkForUpdate error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin endpoint: Sync package.json version to create AppUpdate
export const syncVersionUpdate = async (req, res) => {
  try {
    const { platform = 'android', role = 'sales', force = false } = req.body;

    // Read package.json
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const packagePath = path.join(__dirname, '../../package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const newVersion = packageData.version;

    logger.info(`Syncing version: ${newVersion} for ${platform}/${role}`);

    // Check if update already exists
    let existingUpdate = await AppUpdate.findOne({
      version: newVersion,
      platform: platform,
      targetRoles: { $in: [role] }
    });

    if (existingUpdate && !force) {
      // Just activate if not already
      if (!existingUpdate.isActive) {
        existingUpdate.isActive = true;
        await existingUpdate.save();
      }
      logger.info(`Version ${newVersion} already exists, activated`);
      return res.json({
        success: true,
        message: 'Update already exists',
        data: existingUpdate,
        isNew: false
      });
    }

    // Create new AppUpdate record
    const releaseNotes = `
Automatic deployment update

Version: ${newVersion}
Platform: ${platform}
Timestamp: ${new Date().toISOString()}
`.trim();

    const newUpdate = new AppUpdate({
      version: newVersion,
      platform: platform,
      targetRoles: [role],
      releaseNotes: releaseNotes,
      updateMethod: 'internal',
      updateInstructions: `Please restart the app to apply version ${newVersion} updates`,
      forced: false,
      isActive: true,
      requiresRestart: true,
      changeLog: `Backend updated to ${newVersion}`,
      compatibleVersions: [],
      createdBy: req.user?._id
    });

    const savedUpdate = await newUpdate.save();
    logger.info(`AppUpdate created: v${newVersion} for ${platform}/${role}`);

    return res.status(201).json({
      success: true,
      message: `AppUpdate created for version ${newVersion}`,
      data: savedUpdate,
      isNew: true
    });
  } catch (error) {
    logger.error('syncVersionUpdate error', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
