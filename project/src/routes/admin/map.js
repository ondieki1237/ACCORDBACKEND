import express from 'express';
import Machine from '../../models/Machine.js';
import Facility from '../../models/Facility.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import logger from '../../utils/logger.js';
import { geocodeLocation, getColorForModel } from '../../utils/kenyaLocations.js';

const router = express.Router();

/**
 * GET /api/admin/map/machines
 * Returns all machines with geocoded locations for map visualization
 * Query params: model, manufacturer, status (for filtering)
 */
router.get('/machines', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { model, manufacturer, status } = req.query;

        // Build query filter
        const query = {};
        if (model) query.model = new RegExp(model, 'i');
        if (manufacturer) query.manufacturer = new RegExp(manufacturer, 'i');
        if (status) query.status = status;

        // Fetch all machines (no pagination for map view)
        const machines = await Machine.find(query)
            .select('serialNumber model manufacturer version facility contactPerson installedDate status')
            .lean();

        logger.info('Map machines fetched', {
            userId: req.user._id,
            count: machines.length,
            filters: { model, manufacturer, status }
        });

        // Geocode machines and group by location
        const locationMap = new Map();
        const machinesWithCoords = [];

        for (const machine of machines) {
            let coords = null;

            // Try to geocode from facility name
            if (machine.facility?.name) {
                // First, try to find exact facility in Facility collection
                try {
                    const facility = await Facility.findOne({
                        'properties.name': new RegExp(machine.facility.name, 'i')
                    }).limit(1).lean();

                    if (facility?.geometry?.coordinates) {
                        // GeoJSON format is [lng, lat]
                        coords = {
                            lat: facility.geometry.coordinates[1],
                            lng: facility.geometry.coordinates[0],
                            source: 'facility_db'
                        };
                    }
                } catch (err) {
                    logger.warn('Facility lookup failed', { facilityName: machine.facility.name, error: err.message });
                }
            }

            // Fallback to location string geocoding
            if (!coords && machine.facility?.location) {
                const geocoded = geocodeLocation(machine.facility.location);
                if (geocoded) {
                    coords = {
                        lat: geocoded.lat,
                        lng: geocoded.lng,
                        source: 'location_string'
                    };
                }
            }

            // Fallback to facility name geocoding
            if (!coords && machine.facility?.name) {
                const geocoded = geocodeLocation(machine.facility.name);
                if (geocoded) {
                    coords = {
                        lat: geocoded.lat,
                        lng: geocoded.lng,
                        source: 'facility_name'
                    };
                }
            }

            if (coords) {
                const machineData = {
                    id: machine._id,
                    serialNumber: machine.serialNumber,
                    model: machine.model,
                    manufacturer: machine.manufacturer,
                    version: machine.version,
                    facility: machine.facility,
                    contactPerson: machine.contactPerson,
                    installedDate: machine.installedDate,
                    status: machine.status,
                    coordinates: { lat: coords.lat, lng: coords.lng },
                    color: getColorForModel(machine.model)
                };

                machinesWithCoords.push(machineData);

                // Group by location for clustering info
                const locationKey = `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`;
                if (!locationMap.has(locationKey)) {
                    locationMap.set(locationKey, {
                        coordinates: { lat: coords.lat, lng: coords.lng },
                        machines: [],
                        facilityName: machine.facility?.name || 'Unknown',
                        location: machine.facility?.location || 'Unknown'
                    });
                }
                locationMap.get(locationKey).machines.push(machineData);
            } else {
                logger.warn('Could not geocode machine', {
                    machineId: machine._id,
                    facilityName: machine.facility?.name,
                    location: machine.facility?.location
                });
            }
        }

        // Convert location map to array
        const locations = Array.from(locationMap.values()).map(loc => ({
            ...loc,
            count: loc.machines.length
        }));

        // Generate color legend
        const modelColors = new Map();
        machinesWithCoords.forEach(m => {
            if (m.model && !modelColors.has(m.model)) {
                modelColors.set(m.model, getColorForModel(m.model));
            }
        });

        const legend = Array.from(modelColors.entries()).map(([model, color]) => ({
            model,
            color,
            count: machinesWithCoords.filter(m => m.model === model).length
        })).sort((a, b) => b.count - a.count);

        res.json({
            success: true,
            data: {
                machines: machinesWithCoords,
                locations,
                legend,
                stats: {
                    total: machines.length,
                    geocoded: machinesWithCoords.length,
                    failed: machines.length - machinesWithCoords.length,
                    uniqueLocations: locations.length
                }
            }
        });

    } catch (err) {
        logger.error('Map machines error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/admin/map/stats
 * Returns summary statistics for the map
 */
router.get('/stats', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const totalMachines = await Machine.countDocuments();
        const activeCount = await Machine.countDocuments({ status: 'active' });
        const maintenanceCount = await Machine.countDocuments({ status: 'maintenance' });
        const inactiveCount = await Machine.countDocuments({ status: 'inactive' });

        // Get unique models and manufacturers
        const models = await Machine.distinct('model');
        const manufacturers = await Machine.distinct('manufacturer');

        res.json({
            success: true,
            data: {
                total: totalMachines,
                byStatus: {
                    active: activeCount,
                    maintenance: maintenanceCount,
                    inactive: inactiveCount,
                    decommissioned: totalMachines - activeCount - maintenanceCount - inactiveCount
                },
                uniqueModels: models.length,
                uniqueManufacturers: manufacturers.length,
                models: models.filter(Boolean).sort(),
                manufacturers: manufacturers.filter(Boolean).sort()
            }
        });

    } catch (err) {
        logger.error('Map stats error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
