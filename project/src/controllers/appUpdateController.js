import AppUpdate from '../models/AppUpdate.js';
import logger from '../utils/logger.js';

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
    if (!update) return res.json({ success: true, updateAvailable: false });

    if (currentVersion && !semverGreater(update.version, currentVersion)) {
      return res.json({ success: true, updateAvailable: false });
    }

    // Return update with internal update mechanism (app applies changes without download)
    const updateData = {
      ...update,
      internalUpdate: true, // Tells app to update internally
      updateMethod: 'internal', // Options: 'internal' or 'external'
      bundledCode: update.bundledCode || null, // Optional: JavaScript patches to apply
      updateInstructions: update.updateInstructions || 'Please restart the app to apply updates',
      downloadUrl: update.downloadUrl || null, // Fallback for external download if needed
      // Add metadata for app decision-making
      requiresRestart: true,
      timestamp: new Date()
    };

    logger.info(`Update check: ${role}/${platform} - Update available: v${update.version}`);
    return res.json({ success: true, updateAvailable: true, update: updateData });
  } catch (err) {
    logger.error('checkForUpdate error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
