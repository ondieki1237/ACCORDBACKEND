# Product Classifier Quick Reference

## Quick Start

### Basic Usage
```javascript
import { classifyProduct } from './src/utils/productClassifier.js';

const result = classifyProduct("dental chair setup");
console.log(result.canonical);  // "Dental Chair"
```

### Available Functions

| Function | Input | Output | Use Case |
|----------|-------|--------|----------|
| `classifyProduct(name)` | Product name string | Classification object | Classify single product |
| `normalizeProductName(name)` | Product name string | Canonical name string | Get just the normalized name |
| `groupSimilarProducts(array)` | Array of product names | Grouped results array | Batch classify & group |
| `findSimilarProducts(query, list, threshold)` | Query + product list | Matching products array | Search for similar products |

## Classification Object

```javascript
{
  original: "dental chair setup",      // Input as provided
  canonical: "Dental Chair",           // Standardized form
  category: "dental-chair",            // Category ID
  confidence: 0.95                     // Similarity score (0-1)
}
```

## Product Categories

### Medical Equipment Categories

```
dental-chair → Dental Chair
theatre → Theatre  
laboratory → Laboratory
delivery → Delivery Bed
microscope → Microscope
dental-unit → Dental Unit
ultrasound → Ultrasound
xray → X-Ray
ct-scanner → CT Scanner
mri → MRI
```

## Real-World Examples

### Example 1: Dental Products

Input:
```javascript
const products = ['Dental Chair', 'dental chair', 'Full Dental setup'];
groupSimilarProducts(products);
```

Output:
```javascript
[{
  canonical: 'Dental Chair',
  category: 'dental-chair',
  variations: ['Dental Chair', 'dental chair', 'Full Dental setup'],
  averageConfidence: 0.98
}]
```

### Example 2: Laboratory Products

Input:
```javascript
const products = ['Lab analysis', 'Hematology lab', 'Laboratory'];
groupSimilarProducts(products);
```

Output:
```javascript
[{
  canonical: 'Laboratory',
  category: 'laboratory',
  variations: ['Lab analysis', 'Hematology lab', 'Laboratory'],
  averageConfidence: 0.95
}]
```

### Example 3: Search Similar Products

```javascript
const products = ['Dental Chair', 'Theatre', 'Lab', 'Microscope'];
const similar = findSimilarProducts('dental', products, 0.7);

// Returns: [{product: 'Dental Chair', similarity: 0.95}]
```

## Confidence Score Guide

| Range | Meaning | Example |
|-------|---------|---------|
| 0.9-1.0 | Excellent match | "Dental Chair" → "Dental Chair" |
| 0.8-0.89 | Very good match | "dental chair" → "Dental Chair" |
| 0.7-0.79 | Good match | "Full Dental setup" → "Dental Chair" |
| 0.6-0.69 | Acceptable match | "Dntl chir" → "Dental Chair" |
| <0.6 | No classification | "xyz" → "xyz" (kept as-is) |

## API Endpoint

### Get Market Insights (Intelligent Products)

```
GET /api/admin/market-insights/products?startDate=2024-01-01&endDate=2024-12-31
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "product": "Dental Chair",
      "category": "dental-chair",
      "count": 20,
      "confidence": 0.95,
      "uniqueFacilities": 5,
      "uniqueLocations": 8,
      "variations": ["Dental Chair", "dental chair", "Full Dental setup"]
    }
  ]
}
```

## Adding New Categories

### Step 1: Define the Category

In `src/utils/productClassifier.js`:

```javascript
'equipment-name': {
  canonical: 'Equipment Display Name',
  keywords: ['keyword1', 'keyword2', 'common alias'],
  minSimilarity: 0.7  // Lower = more permissive, Higher = more strict
}
```

### Step 2: Test

```javascript
classifyProduct("keyword1 alias");
// Should return canonical: "Equipment Display Name"
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Wrong grouping | Threshold too low | Increase `minSimilarity` |
| Products not grouped | Threshold too high | Decrease `minSimilarity` |
| Typos not recognized | No keyword match | Add as keyword or lower threshold |
| Junk products included | Not in JUNK_VALUES | Add to JUNK_VALUES array |

## Performance Tips

1. **Batch Processing**: Use `groupSimilarProducts()` for multiple items
2. **Caching**: Store classifications if processing same products repeatedly
3. **Threshold Selection**: Higher threshold = faster but less grouping
4. **Keyword Optimization**: Fewer, more specific keywords = faster matching

## Integration Checklist

- [x] Import classifier in controller
- [x] Call `classifyProduct()` for each product name
- [x] Use canonical names in responses
- [x] Include confidence scores
- [x] Show variations in analytics
- [x] Test with real data

## Support & Extension

Need to handle new product types? Ask to:
1. Add keywords to existing category, OR
2. Create new category with keywords
3. Adjust similarity thresholds as needed

Classifier will automatically adapt and handle the new naming variations!
