# ACCORD Medical Products - PDF Catalog Generation

**Date:** December 11, 2025  
**API:** https://accordmedical.co.ke/api/get_spdk_items.php  
**Status:** ✅ WORKING - Successfully tested with 145 products

---

## 🚀 Quick Start

### Generate PDF from ACCORD Medical API

```bash
cd /home/seth/Documents/deployed/ACCORDBACKEND/project

node scripts/pdf-generator.js \
  --api=https://accordmedical.co.ke/api/get_spdk_items.php \
  --output=accord-products-catalog.pdf \
  --company="ACCORD Medical"
```

**Output:** `uploads/catalogs/accord-products-catalog.pdf`

---

## 📊 Test Results

✅ **Successfully tested on December 11, 2025**

- **Products Fetched:** 145
- **PDF Pages:** 43
- **File Size:** 113 KB
- **Logo:** Included
- **Categories:** Laboratory Equipment, Biochemistry Analyzer, Hematology Analyzer, etc.
- **HTML Cleaning:** Working (product_description HTML stripped)

---

## 🎯 What the System Does

### 1. Fetches Data from External API
```json
{
  "status": "success",
  "total": 145,
  "data": [
    {
      "id": 2,
      "product_name": "3 Part Hematology Analyzer (Z3)",
      "product_type": "Hematology Analyzer",
      "product_description": "<p><strong>Features</strong></p>...",
      "category": "Laboratory Equipment",
      "images": [
        {
          "product_image": "https://accordmedical.co.ke/...",
          "product_image_md": "https://accordmedical.co.ke/..."
        }
      ]
    }
  ]
}
```

### 2. Extracts Product Information
- **Product Name:** `product_name` field
- **Description:** `product_description` field (HTML stripped)
- **Category:** `category` or `product_type` field
- **Images:** Checks `images` array

### 3. Groups by Category
Products are automatically grouped by the `category` field:
- Laboratory Equipment
- Biochemistry Analyzer
- Hematology Analyzer
- Surgical Equipment
- Medical Devices
- etc.

### 4. Generates Professional PDF
- Company logo at top
- Title: "ACCORD Medical - Product Catalog"
- Products grouped by category
- Table format: Product | Description | Image Status
- Footer with metadata (date, product count, categories)

---

## 📋 Example Commands

### Basic Generation (Default)
```bash
node scripts/pdf-generator.js \
  --api=https://accordmedical.co.ke/api/get_spdk_items.php
```

### Custom Output Filename
```bash
node scripts/pdf-generator.js \
  --api=https://accordmedical.co.ke/api/get_spdk_items.php \
  --output=products-december-2025.pdf
```

### Custom Company Name
```bash
node scripts/pdf-generator.js \
  --api=https://accordmedical.co.ke/api/get_spdk_items.php \
  --company="ACCORD Healthcare Systems"
```

### All Options
```bash
node scripts/pdf-generator.js \
  --api=https://accordmedical.co.ke/api/get_spdk_items.php \
  --output=full-catalog.pdf \
  --company="ACCORD Medical" \
  --logo=/custom/path/logo.png
```

---

## 🔄 Scheduled Generation

### Daily at 8 AM (Cron Job)

```bash
# Edit crontab
crontab -e

# Add this line
0 8 * * * cd /home/seth/Documents/deployed/ACCORDBACKEND/project && node scripts/pdf-generator.js --api=https://accordmedical.co.ke/api/get_spdk_items.php --output=daily-catalog.pdf >> /var/log/pdf-generation.log 2>&1
```

### Weekly on Mondays at 9 AM
```bash
0 9 * * 1 cd /home/seth/Documents/deployed/ACCORDBACKEND/project && node scripts/pdf-generator.js --api=https://accordmedical.co.ke/api/get_spdk_items.php --output=weekly-catalog-$(date +\%Y-\%m-\%d).pdf
```

---

## 💻 Using in Code

### Generate from Node.js Code

```javascript
import pdfCatalogService from './src/services/pdfCatalogService.js';

// Generate PDF from external API
const result = await pdfCatalogService.generateFromAPI(
  'https://accordmedical.co.ke/api/get_spdk_items.php',
  {
    company: 'ACCORD Medical',
    filename: 'accord-products.pdf'
  }
);

console.log(`PDF generated: ${result.filename}`);
console.log(`File size: ${result.size} bytes`);
console.log(`Download URL: /api/catalogs/${result.filename}`);
```

### In a Route Handler

```javascript
import pdfCatalogService from '../services/pdfCatalogService.js';

router.post('/generate-catalog', authenticate, async (req, res) => {
  try {
    const result = await pdfCatalogService.generateFromAPI(
      'https://accordmedical.co.ke/api/get_spdk_items.php'
    );
    
    res.download(result.filepath, 'accord-products-catalog.pdf');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🎨 PDF Structure

```
┌─────────────────────────────────────────────┐
│  [ACCORD LOGO]                              │
│  ACCORD Medical                             │
│  Product Catalog – Department Listing       │
├─────────────────────────────────────────────┤
│                                             │
│  [DEPARTMENT: Laboratory Equipment]        │
│  ───────────────────────────────────────── │
│  Product             | Description | Image  │
│  ───────────────────────────────────────── │
│  3 Part Hematology  | Features: 21  | [IMG]│
│  Analyzer (Z3)      | parameters +  |      │
│                      | 3 histograms  |      │
│  ───────────────────────────────────────── │
│  5 Part Hematology  | Technical     | [IMG]│
│  Analyser (Z50)     | Specification:|      │
│                      | 29 parameters |      │
│  ───────────────────────────────────────── │
│       End of Laboratory Equipment          │
│                                             │
│  [DEPARTMENT: Biochemistry Analyzer]       │
│  ───────────────────────────────────────── │
│  ...                                        │
│                                             │
├─────────────────────────────────────────────┤
│  Generated: December 11, 2025 1:44 PM      │
│  Total Products: 145 | Categories: 8       │
└─────────────────────────────────────────────┘
```

---

## 🔍 Data Mapping

The system automatically maps your API fields:

| Your API Field | Used As | Notes |
|----------------|---------|-------|
| `product_name` | Product Name | Main product title |
| `product_description` | Description | HTML tags stripped |
| `category` | Category | For grouping |
| `product_type` | Fallback Category | If category is empty |
| `images[0].product_image` | Image Status | Shows [IMG] if present |
| `item_brand_manufacturer` | Brand | (Not currently displayed) |

---

## ✨ Features

✅ **HTML Stripping** - Removes HTML tags from product_description  
✅ **Smart Grouping** - Groups by category or product_type  
✅ **Image Detection** - Checks images array  
✅ **Professional Layout** - Table format with proper spacing  
✅ **Logo Integration** - ACCORD logo at top  
✅ **Pagination** - Auto page breaks  
✅ **Metadata** - Footer with generation info  

---

## 🐛 Troubleshooting

### Issue: "API connection timeout"

**Cause:** External API is slow or unavailable  
**Solution:** The script has a 10-second timeout. Check API is accessible:
```bash
curl https://accordmedical.co.ke/api/get_spdk_items.php
```

### Issue: "Empty PDF or no products"

**Cause:** API response format changed  
**Solution:** Check API response structure:
```bash
curl -s https://accordmedical.co.ke/api/get_spdk_items.php | jq '.data | length'
```

### Issue: "Logo not found"

**Cause:** Logo path incorrect  
**Solution:** Verify logo exists:
```bash
ls -la /home/seth/Documents/deployed/ACCORDBACKEND/other/Logo_only.png
```

---

## 📊 Performance

- **API Fetch Time:** ~2 seconds (145 products)
- **PDF Generation Time:** ~1 second
- **Total Time:** ~3 seconds
- **Output Size:** ~113 KB for 145 products (43 pages)

---

## 🚀 Production Deployment

### 1. Add to Server Scripts

In your `package.json`:
```json
{
  "scripts": {
    "generate-catalog": "node scripts/pdf-generator.js --api=https://accordmedical.co.ke/api/get_spdk_items.php"
  }
}
```

Then run:
```bash
npm run generate-catalog
```

### 2. Create Bash Alias

Add to `~/.bashrc` or `~/.zshrc`:
```bash
alias generate-catalog='cd /home/seth/Documents/deployed/ACCORDBACKEND/project && node scripts/pdf-generator.js --api=https://accordmedical.co.ke/api/get_spdk_items.php'
```

Then run:
```bash
generate-catalog
```

### 3. Systemd Timer (Linux)

Create `/etc/systemd/system/pdf-catalog.service`:
```ini
[Unit]
Description=Generate ACCORD Products Catalog PDF

[Service]
Type=oneshot
User=seth
WorkingDirectory=/home/seth/Documents/deployed/ACCORDBACKEND/project
ExecStart=/usr/bin/node scripts/pdf-generator.js --api=https://accordmedical.co.ke/api/get_spdk_items.php
```

Create `/etc/systemd/system/pdf-catalog.timer`:
```ini
[Unit]
Description=Daily PDF Catalog Generation

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start:
```bash
sudo systemctl enable pdf-catalog.timer
sudo systemctl start pdf-catalog.timer
```

---

## 📚 Related Documentation

- **Complete Guide:** `PDF_GENERATOR_GUIDE.md`
- **Quick Reference:** `PDF_QUICK_REFERENCE.md`
- **Code Examples:** `PDF_SERVICE_EXAMPLES.js`
- **Integration Guide:** `PDF_INTEGRATION_GUIDE.md`

---

## ✅ Success Checklist

- [x] CLI script works with external API
- [x] HTML descriptions are cleaned
- [x] Products grouped by category
- [x] Logo is included
- [x] PDF is valid and readable
- [x] 145 products successfully processed
- [x] 43 pages generated
- [ ] Set up scheduled generation (optional)
- [ ] Integrate with admin panel (optional)

---

## 🎉 Summary

**Your ACCORD Medical API is fully working with the PDF generator!**

**One-liner to remember:**
```bash
node scripts/pdf-generator.js --api=https://accordmedical.co.ke/api/get_spdk_items.php
```

**Output location:**
```
/home/seth/Documents/deployed/ACCORDBACKEND/project/uploads/catalogs/
```

---

*ACCORD Medical Products - PDF Catalog System*  
*Tested and Working: December 11, 2025*  
*145 Products | 43 Pages | 113 KB*
