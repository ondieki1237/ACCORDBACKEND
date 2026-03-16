import mongoose from 'mongoose';
import Machine from '../models/Machine.js';
import MachineUpdateAudit from '../models/MachineUpdateAudit.js';
import logger from '../utils/logger.js';

/**
 * Update machine details with audit trail
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} options - Optional configuration
 */
export const updateMachine = async (req, res, options = {}) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Validate machine ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid machine ID format'
      });
    }

    // Prevent updating metadata directly from API
    if (updates.metadata) {
      delete updates.metadata;
    }

    // Prevent updating timestamps
    if (updates.createdAt) delete updates.createdAt;
    if (updates.updatedAt) delete updates.updatedAt;

    // Validate required fields if they're being updated
    if (updates.model === '') {
      return res.status(400).json({
        success: false,
        message: 'Model name cannot be empty'
      });
    }

    if (updates.manufacturer === '') {
      return res.status(400).json({
        success: false,
        message: 'Manufacturer cannot be empty'
      });
    }

    // Fetch the existing machine to capture previous values
    const existingMachine = await Machine.findById(id);
    if (!existingMachine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    // Capture changes for audit trail
    const previousValues = {};
    const changedFields = [];

    Object.keys(updates).forEach(field => {
      const oldValue = JSON.stringify(existingMachine[field]);
      const newValue = JSON.stringify(updates[field]);
      
      if (oldValue !== newValue) {
        previousValues[field] = existingMachine[field];
        changedFields.push(field);
      }
    });

    // If no changes, return the machine as is
    if (changedFields.length === 0) {
      return res.json({
        success: true,
        message: 'No changes detected',
        data: existingMachine
      });
    }

    // Update the machine
    const updatedMachine = await Machine.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('metadata.createdBy', 'firstName lastName email');

    // Create audit trail
    const auditLog = new MachineUpdateAudit({
      machineId: id,
      updatedBy: req.user._id,
      previousValues,
      newValues: changedFields.reduce((obj, field) => {
        obj[field] = updates[field];
        return obj;
      }, {}),
      changedFields,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await auditLog.save();

    logger.info('Machine updated successfully', {
      machineId: id,
      userId: req.user._id,
      userEmail: req.user.email,
      changedFields: changedFields.length,
      fields: changedFields
    });

    res.json({
      success: true,
      message: `Machine updated successfully. ${changedFields.length} field(s) changed.`,
      data: {
        machine: updatedMachine,
        audit: {
          changedFields,
          changedCount: changedFields.length,
          timestamp: new Date()
        }
      }
    });
  } catch (error) {
    logger.error('Update machine error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update machine',
      error: error.message
    });
  }
};

/**
 * Get machine update history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getMachineUpdateHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate machine ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid machine ID format'
      });
    }

    // Verify machine exists
    const machine = await Machine.findById(id);
    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    // Get update history with pagination
    const audit = await MachineUpdateAudit.find({ machineId: id })
      .populate('updatedBy', 'firstName lastName email role')
      .sort({ timestamp: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    // Get total count
    const total = await MachineUpdateAudit.countDocuments({ machineId: id });

    res.json({
      success: true,
      data: {
        machineId: id,
        machineModel: machine.model,
        totalUpdates: total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
        history: audit
      }
    });
  } catch (error) {
    logger.error('Get machine update history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch update history',
      error: error.message
    });
  }
};

/**
 * Bulk update machines
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const bulkUpdateMachines = async (req, res) => {
  try {
    const { machines } = req.body;

    // Validate input
    if (!Array.isArray(machines) || machines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of machines to update'
      });
    }

    const results = [];
    const errors = [];

    for (const machineUpdate of machines) {
      try {
        const { id, ...updates } = machineUpdate;

        if (!mongoose.isValidObjectId(id)) {
          errors.push({ id, error: 'Invalid machine ID format' });
          continue;
        }

        const existingMachine = await Machine.findById(id);
        if (!existingMachine) {
          errors.push({ id, error: 'Machine not found' });
          continue;
        }

        // Capture changed fields
        const previousValues = {};
        const changedFields = [];

        Object.keys(updates).forEach(field => {
          if (field !== 'metadata' && field !== 'createdAt' && field !== 'updatedAt') {
            const oldValue = JSON.stringify(existingMachine[field]);
            const newValue = JSON.stringify(updates[field]);
            
            if (oldValue !== newValue) {
              previousValues[field] = existingMachine[field];
              changedFields.push(field);
            }
          }
        });

        if (changedFields.length > 0) {
          // Update machine
          const updated = await Machine.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
          );

          // Create audit trail
          await MachineUpdateAudit.create({
            machineId: id,
            updatedBy: req.user._id,
            previousValues,
            newValues: changedFields.reduce((obj, field) => {
              obj[field] = updates[field];
              return obj;
            }, {}),
            changedFields,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          });

          results.push({
            id,
            success: true,
            changedFields
          });
        } else {
          results.push({
            id,
            success: true,
            changedFields: [],
            message: 'No changes detected'
          });
        }
      } catch (error) {
        errors.push({ id: machineUpdate.id, error: error.message });
      }
    }

    logger.info('Bulk machine update completed', {
      userId: req.user._id,
      totalRequested: machines.length,
      successful: results.length,
      failed: errors.length
    });

    res.json({
      success: true,
      message: `${results.length} machine(s) updated successfully`,
      data: {
        updated: results.length,
        failed: errors.length,
        results,
        errors
      }
    });
  } catch (error) {
    logger.error('Bulk update machines error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk update failed',
      error: error.message
    });
  }
};
