import EngineeringPricing from '../models/EngineeringPricing.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const ALLOWED_ACTIVITY_TYPES = ['installation', 'maintenance', 'service', 'previsit'];

export const createPricing = async (req, res) => {
  try {
    const { engineerId, activityType, location, facility, machine, fare, otherCharges } = req.body;

    const errors = {};
    if (!engineerId) errors.engineerId = 'engineerId is required';
    if (!activityType || !ALLOWED_ACTIVITY_TYPES.includes(activityType)) errors.activityType = 'Invalid activityType';
    if (!fare && fare !== 0) errors.fare = 'fare is required';
    if (activityType === 'installation' && !location) errors.location = 'location is required for installation';

    if (Object.keys(errors).length) {
      return res.status(400).json({ status: 'error', message: 'Validation failed', errors });
    }

    const engineer = await User.findById(engineerId);
    if (!engineer) return res.status(400).json({ status: 'error', message: 'Engineer not found' });

    const pricing = new EngineeringPricing({
      engineerId,
      activityType,
      location: location || null,
      facility: facility || null,
      machine: machine || null,
      fare,
      otherCharges: Array.isArray(otherCharges) ? otherCharges : [],
      createdBy: req.user?._id
    });

    await pricing.save();

    res.status(201).json({ status: 'success', message: 'Pricing record created successfully', data: pricing });
  } catch (err) {
    logger.error('createPricing error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create pricing', error: err.message });
  }
};

export const getPricings = async (req, res) => {
  try {
    const { engineerId, activityType, fromDate, toDate, page = 1, limit = 50 } = req.query;
    const q = {};
    if (engineerId) q.engineerId = engineerId;
    if (activityType) q.activityType = activityType;
    if (fromDate || toDate) q.createdAt = {};
    if (fromDate) q.createdAt.$gte = new Date(fromDate);
    if (toDate) q.createdAt.$lte = new Date(toDate);

    const skip = (Number(page) - 1) * Number(limit);
    const docs = await EngineeringPricing.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();
    const total = await EngineeringPricing.countDocuments(q);

    res.json({ status: 'success', data: docs, meta: { page: Number(page), limit: Number(limit), totalDocs: total } });
  } catch (err) {
    logger.error('getPricings error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch pricing records' });
  }
};

export const updatePricing = async (req, res) => {
  try {
    const { pricingId } = req.params;
    const updates = {};
    const allowed = ['fare', 'otherCharges', 'facility', 'machine', 'location'];
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }

    const pricing = await EngineeringPricing.findById(pricingId);
    if (!pricing) return res.status(404).json({ status: 'error', message: 'Pricing record not found' });

    Object.assign(pricing, updates);
    await pricing.save();

    res.json({ status: 'success', message: 'Pricing record updated successfully', data: pricing });
  } catch (err) {
    logger.error('updatePricing error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update pricing' });
  }
};

export const deletePricing = async (req, res) => {
  try {
    const { pricingId } = req.params;
    const pricing = await EngineeringPricing.findById(pricingId);
    if (!pricing) return res.status(404).json({ status: 'error', message: 'Pricing record not found' });
    await pricing.remove();
    res.json({ status: 'success', message: 'Pricing record deleted successfully' });
  } catch (err) {
    logger.error('deletePricing error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete pricing' });
  }
};

export const getPricingById = async (req, res) => {
  try {
    const { pricingId } = req.params;
    const pricing = await EngineeringPricing.findById(pricingId).lean();
    if (!pricing) return res.status(404).json({ status: 'error', message: 'Pricing record not found' });
    res.json({ status: 'success', data: pricing });
  } catch (err) {
    logger.error('getPricingById error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch pricing' });
  }
};

export default {
  createPricing,
  getPricings,
  updatePricing,
  deletePricing,
  getPricingById
};
