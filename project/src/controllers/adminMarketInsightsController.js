import Visit from '../models/Visit.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import XLSX from 'xlsx';
import { classifyProduct, groupSimilarProducts } from '../utils/productClassifier.js';

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
          // Use intelligent classifier
          const classified = classifyProduct(name);
          return classified.canonical; // Use canonical name instead of raw name
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

    // Get all product data from visits
    const pipeline = [
      { $match: matchStage },
      { $unwind: '$productsOfInterest' },
      { $addFields: { normalizedProduct: { $toLower: { $trim: { input: '$productsOfInterest.name' } } } } },
      { $match: { normalizedProduct: { $nin: JUNK_VALUES } } },
      { $group: {
        _id: '$normalizedProduct',
        originalNames: { $addToSet: '$productsOfInterest.name' },
        count: { $sum: 1 },
        facilities: { $addToSet: '$client.name' },
        locations: { $addToSet: '$client.location' }
      } },
      { $sort: { count: -1 } }
    ];

    const rawProducts = await Visit.aggregate(pipeline);

    // Use intelligent classifier to group similar products
    const classifiedProducts = {};
    const classifications = {};

    for (const product of rawProducts) {
      const originalName = product.originalNames[0] || product._id;
      const classification = classifyProduct(originalName);
      const canonical = classification.canonical;
      const key = canonical.toLowerCase();

      classifications[key] = classification;

      if (!classifiedProducts[key]) {
        classifiedProducts[key] = {
          canonical,
          category: classification.category,
          confidence: classification.confidence,
          count: 0,
          uniqueFacilities: new Set(),
          uniqueLocations: new Set(),
          variations: new Set(),
          originalVariations: []
        };
      }

      classifiedProducts[key].count += product.count;
      product.facilities.forEach(f => classifiedProducts[key].uniqueFacilities.add(f));
      product.locations.forEach(l => classifiedProducts[key].uniqueLocations.add(l));
      product.originalNames.forEach(n => {
        classifiedProducts[key].variations.add(n);
        if (!classifiedProducts[key].originalVariations.includes(n)) {
          classifiedProducts[key].originalVariations.push(n);
        }
      });
    }

    // Convert sets to arrays and format response
    const products = Object.values(classifiedProducts)
      .map(p => ({
        product: p.canonical,
        category: p.category,
        count: p.count,
        confidence: p.confidence,
        uniqueFacilities: p.uniqueFacilities.size,
        uniqueLocations: p.uniqueLocations.size,
        variations: p.originalVariations.slice(0, 5) // Show top 5 variations
      }))
      .sort((a, b) => b.count - a.count);

    logger.info('Product insights generated', {
      totalProducts: products.length,
      totalRequests: products.reduce((sum, p) => sum + p.count, 0)
    });

    res.json({
      success: true,
      data: products,
      meta: {
        intelligentGrouping: true,
        classifierInfo: 'Products are intelligently grouped using NLP (Natural Language Processing)'
      }
    });
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

// Export market insights to Excel (no pagination - ALL data, summary + sheets per top product)
export const exportMarketInsights = async (req, res, next) => {
  try {
    const { startDate, endDate, product, salesPerson, location, outcome } = req.query;
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

    // Fetch ALL visits (no limit, no pagination)
    const visits = await Visit.find(query)
      .populate('userId', 'firstName lastName email employeeId')
      .sort({ date: -1 })
      .lean();

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();

    // ===== SHEET 1: SUMMARY WITH TOP 10 PRODUCTS =====
    const topProductsMap = {};
    for (const visit of visits) {
      for (const product of visit.productsOfInterest || []) {
        const productName = product.name;
        if (!isJunk(productName)) {
          const classified = classifyProduct(productName);
          const canonical = classified.canonical;
          
          if (!topProductsMap[canonical]) {
            topProductsMap[canonical] = {
              product: canonical,
              category: classified.category,
              demand: 0,
              facilities: new Set(),
              variations: new Set(),
              visits: []
            };
          }
          topProductsMap[canonical].demand++;
          if (visit.client?.name) {
            topProductsMap[canonical].facilities.add(visit.client.name);
          }
          topProductsMap[canonical].variations.add(productName);
          topProductsMap[canonical].visits.push(visit);
        }
      }
    }

    const topProducts = Object.values(topProductsMap)
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 10);

    const summaryData = topProducts.map(p => ({
      'Product Name': p.product,
      'Category': p.category || 'unclassified',
      'Demand (Count)': p.demand,
      'Unique Facilities': p.facilities.size,
      'Product Variations': Array.from(p.variations).slice(0, 5).join(', ')
    }));

    // Create summary sheet
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    const summaryColWidths = [
      { wch: 25 }, // Product Name
      { wch: 20 }, // Category
      { wch: 18 }, // Demand
      { wch: 20 }, // Unique Facilities
      { wch: 35 }  // Product Variations
    ];
    summaryWorksheet['!cols'] = summaryColWidths;
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

    // ===== SHEETS 2+: PER TOP PRODUCT =====
    for (const productData of topProducts) {
      // Get all unique visits for this product (remove duplicates)
      const visitsForProduct = [];
      const visitIds = new Set();
      
      for (const visit of productData.visits) {
        if (!visitIds.has(visit._id.toString())) {
          visitIds.add(visit._id.toString());
          visitsForProduct.push(visit);
        }
      }

      // Transform visits to insights format
      const insights = visitsForProduct.map(v => ({
        'Facility Name': v.client?.name || '',
        'Facility Type': v.client?.type || '',
        'Sales Person': v.userId ? `${v.userId.firstName} ${v.userId.lastName}` : '',
        'Contact Person': v.contacts && v.contacts.length > 0 ? v.contacts[0].name : '',
        'Contact Role': v.contacts && v.contacts.length > 0 ? v.contacts[0].role : '',
        'Contact Phone': v.contacts && v.contacts.length > 0 ? v.contacts[0].phone : '',
        'Visit Date': v.date ? new Date(v.date).toLocaleDateString() : '',
        'Visit Purpose': v.visitPurpose || '',
        'Products of Interest': (v.productsOfInterest || [])
          .map(p => p.name)
          .filter(name => !isJunk(name))
          .map(name => classifyProduct(name).canonical)
          .join(', '),
        'Competitor Activity': v.competitorActivity || '',
        'Market Insights': v.marketInsights || '',
        'Notes': v.notes || ''
      }));

      // Create sheet if there are insights
      if (insights.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(insights);
        
        // Auto-size columns
        const colWidths = [];
        const headers = Object.keys(insights[0]);
        for (const header of headers) {
          colWidths.push({ wch: Math.min(25, Math.max(header.length + 2, 12)) });
        }
        worksheet['!cols'] = colWidths;

        // Create sheet name from product
        let sheetName = productData.product.slice(0, 31);

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    }

    // Generate file
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const startDateStr = startDate ? new Date(startDate).toISOString().split('T')[0] : 'all';
    const endDateStr = endDate ? new Date(endDate).toISOString().split('T')[0] : 'all';
    const filename = `market-insights-${startDateStr}-to-${endDateStr}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  } catch (err) {
    logger.error('exportMarketInsights error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export market insights', error: err.message });
  }
};
