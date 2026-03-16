import logger from './logger.js';

/**
 * Intelligent Product Name Classifier
 * Uses string similarity to normalize and group similar product names
 * Does NOT rely on external NLP packages to avoid dependency issues
 */

// Core product categories and their variations
const PRODUCT_CATEGORIES = {
  'dental-chair': {
    canonical: 'Dental Chair',
    keywords: ['dental', 'chair', 'dentistry', 'dental chair', 'dental setup', 'dental unit', 'unit', 'dental unit setup'],
    minSimilarity: 0.7
  },
  'theatre': {
    canonical: 'Theatre',
    keywords: ['theatre', 'theater', 'theatre setup', 'theater setup', 'operation theatre', 'surgical theatre'],
    minSimilarity: 0.75
  },
  'laboratory': {
    canonical: 'Laboratory',
    keywords: ['lab', 'laboratory', 'hematology', 'hemato', 'lab consumables', 'lab analysis'],
    minSimilarity: 0.7
  },
  'delivery': {
    canonical: 'Delivery Bed',
    keywords: ['delivery', 'delivery bed', 'obstetric', 'maternal', 'labour', 'labor'],
    minSimilarity: 0.7
  },
  'microscope': {
    canonical: 'Microscope',
    keywords: ['microscope', 'scope', 'micro'],
    minSimilarity: 0.75
  },
  'ultrasound': {
    canonical: 'Ultrasound',
    keywords: ['ultrasound', 'usg', 'sonography', 'imaging'],
    minSimilarity: 0.75
  },
  'xray': {
    canonical: 'X-Ray',
    keywords: ['xray', 'x-ray', 'x ray', 'radiography'],
    minSimilarity: 0.75
  },
  'ct-scanner': {
    canonical: 'CT Scanner',
    keywords: ['ct', 'ct scanner', 'ctscan', 'scan', 'computed tomography'],
    minSimilarity: 0.7
  },
  'mri': {
    canonical: 'MRI',
    keywords: ['mri', 'magnetic', 'resonance', 'nuclear magnetic'],
    minSimilarity: 0.75
  }
};

// Junk values to filter out
const JUNK_VALUES = [
  '', 'none', 'nil', 'n/a', 'na', 'null', '-', '.', 'no', 'no item for now',
  'nothing', 'not applicable', 'not available', 'unknown', 'undefined', 'n',
  'nill', 'non', 'assorted items', 'assorted', 'assorted item', 'various',
  'misc', 'miscellaneous', 'other', 'others'
];

/**
 * Calculate Levenshtein distance (string similarity metric)
 * Returns similarity score from 0 to 1 (higher = more similar)
 */
const levenshteinSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  const s1 = String(str1).trim().toLowerCase();
  const s2 = String(str2).trim().toLowerCase();
  
  if (s1 === s2) return 1.0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

/**
 * Calculate edit distance between two strings based on Levenshtein algorithm
 */
const getEditDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Calculate similarity between two product names using string metrics
 */
const calculateSimilarity = (name1, name2) => {
  if (!name1 || !name2) return 0;

  const norm1 = String(name1).trim().toLowerCase();
  const norm2 = String(name2).trim().toLowerCase();

  // Exact match
  if (norm1 === norm2) return 1.0;

  // Substring match (especially for keywords)
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return 0.95;
  }

  // Levenshtein distance
  return levenshteinSimilarity(norm1, norm2);
};

/**
 * Find best matching category for a product name
 */
export const classifyProduct = (productName) => {
  if (!productName || typeof productName !== 'string') {
    return { original: productName, canonical: 'Unknown', category: 'unknown', confidence: 0 };
  }

  const normalized = productName.trim().toLowerCase();

  // Check for junk values
  if (JUNK_VALUES.includes(normalized)) {
    return { original: productName, canonical: 'N/A', category: 'junk', confidence: 1.0 };
  }

  let bestMatch = null;
  let bestScore = 0;

  // Check each category
  for (const [categoryId, categoryData] of Object.entries(PRODUCT_CATEGORIES)) {
    // Check keywords
    for (const keyword of categoryData.keywords) {
      const similarity = calculateSimilarity(normalized, keyword);

      if (similarity > bestScore && similarity >= (categoryData.minSimilarity - 0.1)) {
        bestScore = similarity;
        bestMatch = {
          category: categoryId,
          canonical: categoryData.canonical,
          confidence: similarity
        };
      }
    }
  }

  if (bestMatch && bestMatch.confidence >= 0.6) {
    return {
      original: productName,
      canonical: bestMatch.canonical,
      category: bestMatch.category,
      confidence: parseFloat(bestMatch.confidence.toFixed(2))
    };
  }

  // No good match found, return as-is
  return {
    original: productName,
    canonical: productName,
    category: 'unclassified',
    confidence: 0
  };
};

/**
 * Normalize a single product name
 */
export const normalizeProductName = (productName) => {
  const classified = classifyProduct(productName);
  return classified.canonical;
};

/**
 * Batch classify products and group them
 */
export const groupSimilarProducts = (productNames = []) => {
  const classified = productNames
    .filter(name => name && typeof name === 'string')
    .map(name => classifyProduct(name));

  // Group by canonical name
  const grouped = {};
  for (const item of classified) {
    const key = item.canonical.toLowerCase();
    if (!grouped[key]) {
      grouped[key] = {
        canonical: item.canonical,
        category: item.category,
        variations: new Set(),
        confidence: []
      };
    }
    grouped[key].variations.add(item.original);
    grouped[key].confidence.push(item.confidence);
  }

  // Convert to array and calculate average confidence
  const result = Object.values(grouped).map(group => ({
    canonical: group.canonical,
    category: group.category,
    variations: Array.from(group.variations),
    averageConfidence: parseFloat((group.confidence.reduce((a, b) => a + b, 0) / group.confidence.length).toFixed(2))
  }));

  return result;
};

/**
 * Find products that are similar to a query
 */
export const findSimilarProducts = (query, productList = [], threshold = 0.7) => {
  const normalized = query.trim().toLowerCase();
  const results = [];

  for (const product of productList) {
    const similarity = calculateSimilarity(normalized, product);
    if (similarity >= threshold) {
      results.push({
        product,
        similarity: parseFloat(similarity.toFixed(2))
      });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity);
};

export default {
  classifyProduct,
  normalizeProductName,
  groupSimilarProducts,
  findSimilarProducts,
  PRODUCT_CATEGORIES,
  JUNK_VALUES
};
