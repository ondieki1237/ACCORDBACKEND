import Visit from '../models/Visit.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Junk values to filter out from aggregations
const JUNK_VALUES = ['', 'none', 'nil', 'n/a', 'na', 'null', '-', '.', 'no','no item for now', 'nothing', 'not applicable', 'not available', 'unknown', 'undefined', 'n', 'nill', 'non', 'assorted items', 'assorted', 'assorted item', 'various', 'misc', 'miscellaneous', 'other', 'others'];

// Synonyms: map variations to a canonical name (all lowercase)
const SYNONYMS = {
  'theatre setup': 'theatre',
  'theater setup': 'theatre',
  'theater': 'theatre',
  'theatre set up': 'theatre',
  'theater set up': 'theatre'
};

// Helper to check if a value is junk
const isJunk = (val) => {
  if (!val) return true;
  const normalized = String(val).trim().toLowerCase();
  return JUNK_VALUES.includes(normalized);
};

// Helper to normalize a product name (apply synonyms)
const normalizeName = (val) => {
  if (!val) return '';
  const normalized = String(val).trim().toLowerCase();
  return SYNONYMS[normalized] || normalized;
};

// GET /api/admin/market-insights/visits
export const getMarketInsights = async (req, res, next) => {
  try {
    const { startDate, endDate, product, salesPerson, location, outcome, page = 1, limit = 100 } = req.query;
    const query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (product) {
      query['productsOfInterest.name'] = { $regex: product, $options: 'i' };
    }
    if (salesPerson) {
      query.userId = salesPerson;
    }
    if (location) {
      query['client.location'] = { $regex: location, $options: 'i' };
    }
    if (outcome) {
      query.visitOutcome = outcome;
    }
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(500, Math.max(1, parseInt(limit)));
    const total = await Visit.countDocuments(query);
    const visits = await Visit.find(query)
      .populate('userId', 'firstName lastName email employeeId')
      .sort({ date: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();
    const insights = visits.map(v => ({
      visitId: v._id,
      facility: v.client?.name || '',
      facilityType: v.client?.type || '',
      contactPerson: v.contacts && v.contacts.length > 0 ? v.contacts[0].name : '',
      contactRole: v.contacts && v.contacts.length > 0 ? v.contacts[0].role : '',
      contactPhone: v.contacts && v.contacts.length > 0 ? v.contacts[0].phone : '',
      contactEmail: v.contacts && v.contacts.length > 0 ? v.contacts[0].email : '',
      location: v.client?.location || '',
      salesPerson: v.userId ? `${v.userId.firstName} ${v.userId.lastName}` : '',
      salesPersonEmail: v.userId?.email || '',
      salesPersonId: v.userId?._id || '',
      date: v.date,
      visitOutcome: v.visitOutcome || '',
      visitPurpose: v.visitPurpose || '',
      productsOfInterest: (v.productsOfInterest || [])
        .map(p => p.name)
        .filter(name => !isJunk(name))
        .map(name => {
          const normalized = normalizeName(name);
          // Title case
          return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
        }),
      notes: v.notes || ''
    }));
    res.json({
      success: true,
      data: insights,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    logger.error('getMarketInsights error:', err);
    next(err);
  }
};

// GET /api/admin/market-insights/products
export const getProductInsights = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }
    // Normalize product names: lowercase, trim, filter out junk
    const pipeline = [
      { $match: matchStage },
      { $unwind: '$productsOfInterest' },
      // Add normalized name field
      { $addFields: { normalizedProduct: { $toLower: { $trim: { input: '$productsOfInterest.name' } } } } },
      // Filter out empty, nil, none, n/a, etc.
      { $match: { normalizedProduct: { $nin: JUNK_VALUES } } },
      // Group by normalized name, keep one canonical display name
      { $group: {
        _id: '$normalizedProduct',
        count: { $sum: 1 },
        displayName: { $first: '$productsOfInterest.name' },
        facilities: { $addToSet: '$client.name' },
        locations: { $addToSet: '$client.location' }
      } },
      { $sort: { count: -1 } },
      // Title-case the display name for cleaner output
      { $project: {
        _id: 0,
        product: { $concat: [
          { $toUpper: { $substrCP: ['$displayName', 0, 1] } },
          { $toLower: { $substrCP: ['$displayName', 1, { $subtract: [{ $strLenCP: '$displayName' }, 1] }] } }
        ] },
        count: 1,
        uniqueFacilities: { $size: '$facilities' },
        uniqueLocations: { $size: '$locations' }
      } }
    ];
    const rawProducts = await Visit.aggregate(pipeline);
    
    // Post-process to merge synonyms
    const mergedMap = {};
    for (const p of rawProducts) {
      const canonical = normalizeName(p.product.toLowerCase());
      const displayName = canonical.charAt(0).toUpperCase() + canonical.slice(1).toLowerCase();
      if (!mergedMap[canonical]) {
        mergedMap[canonical] = { product: displayName, count: 0, uniqueFacilities: 0, uniqueLocations: 0 };
      }
      mergedMap[canonical].count += p.count;
      mergedMap[canonical].uniqueFacilities += p.uniqueFacilities;
      mergedMap[canonical].uniqueLocations += p.uniqueLocations;
    }
    const products = Object.values(mergedMap).sort((a, b) => b.count - a.count);
    
    res.json({ success: true, data: products });
  } catch (err) {
    logger.error('getProductInsights error:', err);
    next(err);
  }
};

// GET /api/admin/market-insights/summary
export const getMarketSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }
    const totalVisits = await Visit.countDocuments(matchStage);
    const outcomePipeline = [
      { $match: matchStage },
      { $group: { _id: '$visitOutcome', count: { $sum: 1 } } }
    ];
    const outcomes = await Visit.aggregate(outcomePipeline);
    const topProductsPipeline = [
      { $match: matchStage },
      { $unwind: '$productsOfInterest' },
      { $addFields: { normalizedProduct: { $toLower: { $trim: { input: '$productsOfInterest.name' } } } } },
      { $match: { normalizedProduct: { $nin: JUNK_VALUES } } },
      { $group: { _id: '$normalizedProduct', count: { $sum: 1 }, displayName: { $first: '$productsOfInterest.name' } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, product: { $concat: [
        { $toUpper: { $substrCP: ['$displayName', 0, 1] } },
        { $toLower: { $substrCP: ['$displayName', 1, { $subtract: [{ $strLenCP: '$displayName' }, 1] }] } }
      ] }, count: 1 } }
    ];
    const rawTopProducts = await Visit.aggregate(topProductsPipeline);
    
    // Post-process to merge synonyms
    const mergedProductsMap = {};
    for (const p of rawTopProducts) {
      const canonical = normalizeName(p.product.toLowerCase());
      const displayName = canonical.charAt(0).toUpperCase() + canonical.slice(1).toLowerCase();
      if (!mergedProductsMap[canonical]) {
        mergedProductsMap[canonical] = { product: displayName, count: 0 };
      }
      mergedProductsMap[canonical].count += p.count;
    }
    const topProducts = Object.values(mergedProductsMap).sort((a, b) => b.count - a.count).slice(0, 10);
    const topLocationsPipeline = [
      { $match: matchStage },
      { $addFields: { normalizedLocation: { $toLower: { $trim: { input: '$client.location' } } } } },
      { $match: { normalizedLocation: { $nin: JUNK_VALUES } } },
      { $group: { _id: '$normalizedLocation', count: { $sum: 1 }, displayLocation: { $first: '$client.location' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, location: { $concat: [
        { $toUpper: { $substrCP: ['$displayLocation', 0, 1] } },
        { $toLower: { $substrCP: ['$displayLocation', 1, { $subtract: [{ $strLenCP: '$displayLocation' }, 1] }] } }
      ] }, count: 1 } }
    ];
    const topLocations = await Visit.aggregate(topLocationsPipeline);
    res.json({
      success: true,
      data: {
        totalVisits,
        outcomes: outcomes.map(o => ({ outcome: o._id || 'unknown', count: o.count })),
        topProducts,
        topLocations
      }
    });
  } catch (err) {
    logger.error('getMarketSummary error:', err);
    next(err);
  }
};
