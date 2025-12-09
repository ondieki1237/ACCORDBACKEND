import Consumable from '../models/Consumable.js';
import logger from '../utils/logger.js';

// @desc    Create a new consumable
// @route   POST /api/admin/consumables
// @access  Private (Admin)
export const createConsumable = async (req, res) => {
    try {
        const { category, name, price, unit, description } = req.body;

        // Basic validation
        if (!category || !name || price === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Please provide category, name, and price'
            });
        }

        const consumable = await Consumable.create({
            category,
            name,
            price,
            unit,
            description,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            data: consumable
        });
    } catch (error) {
        logger.error('Create consumable error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create consumable'
        });
    }
};

// @desc    Get all consumables (grouped by category optional via frontend)
// @route   GET /api/consumables
// @access  Public
export const getConsumables = async (req, res) => {
    try {
        const { category, search } = req.query;
        const query = { isActive: true };

        if (category) {
            query.category = category;
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const consumables = await Consumable.find(query).sort({ category: 1, name: 1 });

        res.json({
            success: true,
            count: consumables.length,
            data: consumables
        });
    } catch (error) {
        logger.error('Get consumables error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch consumables'
        });
    }
};

// @desc    Get single consumable
// @route   GET /api/consumables/:id
// @access  Public
export const getConsumableById = async (req, res) => {
    try {
        const consumable = await Consumable.findById(req.params.id);

        if (!consumable || !consumable.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Consumable not found'
            });
        }

        res.json({
            success: true,
            data: consumable
        });
    } catch (error) {
        logger.error('Get consumable by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch consumable'
        });
    }
};

// @desc    Update consumable
// @route   PUT /api/admin/consumables/:id
// @access  Private (Admin)
export const updateConsumable = async (req, res) => {
    try {
        let consumable = await Consumable.findById(req.params.id);

        if (!consumable) {
            return res.status(404).json({
                success: false,
                message: 'Consumable not found'
            });
        }

        consumable = await Consumable.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.json({
            success: true,
            data: consumable
        });
    } catch (error) {
        logger.error('Update consumable error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update consumable'
        });
    }
};

// @desc    Delete consumable (soft delete)
// @route   DELETE /api/admin/consumables/:id
// @access  Private (Admin)
export const deleteConsumable = async (req, res) => {
    try {
        const consumable = await Consumable.findById(req.params.id);

        if (!consumable) {
            return res.status(404).json({
                success: false,
                message: 'Consumable not found'
            });
        }

        // Soft delete
        consumable.isActive = false;
        await consumable.save();

        res.json({
            success: true,
            message: 'Consumable deleted successfully'
        });
    } catch (error) {
        logger.error('Delete consumable error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete consumable'
        });
    }
};
