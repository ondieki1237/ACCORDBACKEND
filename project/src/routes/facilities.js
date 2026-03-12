import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { searchFacilities, getFacilityById, createFacility } from '../controllers/facilitiesController.js';
import Visit from '../models/Visit.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Public search (optional auth) - allow optionalAuth pattern but here keep authenticate optional
router.get('/', authenticate, searchFacilities);

// Get facilities visited by the authenticated user
router.get('/visited', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;

        // Aggregate unique facilities from user's visits
        const visitedFacilities = await Visit.aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: {
                        name: '$client.name',
                        type: '$client.type',
                        level: '$client.level',
                        location: '$client.location'
                    },
                    visitCount: { $sum: 1 },
                    lastVisitDate: { $max: '$date' },
                    firstVisitDate: { $min: '$date' }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: '$_id.name',
                    type: '$_id.type',
                    level: '$_id.level',
                    location: '$_id.location',
                    visitCount: 1,
                    lastVisitDate: 1,
                    firstVisitDate: 1
                }
            },
            { $sort: { lastVisitDate: -1 } }
        ]);

        res.json({
            success: true,
            data: visitedFacilities,
            count: visitedFacilities.length
        });
    } catch (error) {
        logger.error('Get visited facilities error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve visited facilities'
        });
    }
});

// Admin: Get all facilities visited by all sales team with contact person details
router.get('/admin/all-visited', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        // Aggregate all unique facilities with contact person details
        const allVisitedFacilities = await Visit.aggregate([
            {
                $group: {
                    _id: {
                        name: '$client.name',
                        type: '$client.type',
                        level: '$client.level',
                        location: '$client.location'
                    },
                    visitCount: { $sum: 1 },
                    lastVisitDate: { $max: '$date' },
                    firstVisitDate: { $min: '$date' },
                    contacts: { $push: '$contact' },
                    lastContactNames: { $push: '$contact.name' },
                    lastContactRoles: { $push: '$contact.role' },
                    lastContactPhones: { $push: '$contact.phone' }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: '$_id.name',
                    type: '$_id.type',
                    level: '$_id.level',
                    location: '$_id.location',
                    visitCount: 1,
                    lastVisitDate: 1,
                    firstVisitDate: 1,
                    // Get the most recent contact person (from latest visit)
                    contactPerson: {
                        $arrayElemAt: ['$contacts', -1]
                    },
                    allContacts: '$contacts'
                }
            },
            { $sort: { lastVisitDate: -1 } }
        ]);

        res.json({
            success: true,
            data: allVisitedFacilities,
            count: allVisitedFacilities.length
        });
    } catch (error) {
        logger.error('Get all visited facilities error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve all visited facilities'
        });
    }
});

router.get('/:id', authenticate, getFacilityById);

// Admin create facility (or import)
router.post('/', authenticate, authorize('admin', 'manager'), createFacility);

export default router;
