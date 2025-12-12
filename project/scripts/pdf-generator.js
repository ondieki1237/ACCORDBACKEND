#!/usr/bin/env node

/**
 * PDF Generator CLI - Product Catalog
 * Standalone command system for generating product catalog PDFs
 * 
 * Usage:
 *   node scripts/pdf-generator.js --api=<url> --output=<filename>
 *   node scripts/pdf-generator.js --api=http://localhost:5000/api/machines
 * 
 * Options:
 *   --api       : API endpoint to fetch product data
 *   --output    : Output PDF filename (default: product-catalog.pdf)
 *   --logo      : Logo image path (default: other/Logo_only.png)
 *   --company   : Company name (default: ACCORD Medical)
 */

import PDFDocument from 'pdfkit';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { pipeline } from 'stream';

const streamPipeline = promisify(pipeline);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command-line arguments
const args = {};
process.argv.slice(2).forEach(arg => {
  const [key, value] = arg.split('=');
  args[key.replace('--', '')] = value;
});

// Configuration
const config = {
  api: args.api || process.env.API_URL || 'http://localhost:5000/api/machines',
  output: args.output || 'product-catalog.pdf',
  logo: args.logo || path.join(__dirname, '../../other/Logo_only.png'),
  company: args.company || 'ACCORD Medical',
  projectRoot: path.join(__dirname, '..')
};

// Ensure output path is absolute
if (!path.isAbsolute(config.output)) {
  config.output = path.join(config.projectRoot, 'uploads', 'catalogs', config.output);
}

// Create output directory if it doesn't exist
const outputDir = path.dirname(config.output);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`✓ Created directory: ${outputDir}`);
}

/**
 * Fetch product data from API
 */
async function fetchProductData() {
  try {
    console.log(`📡 Fetching data from: ${config.api}`);
    
    const response = await axios.get(config.api, {
      timeout: 10000,
      headers: {
        'User-Agent': 'PDF-Generator/1.0'
      }
    });

    // Support different response formats
    let products = response.data;
    
    if (response.data.data) {
      products = response.data.data;
    } else if (response.data.docs) {
      products = response.data.docs;
    }

    if (!Array.isArray(products)) {
      throw new Error('API response is not an array of products');
    }

    console.log(`✓ Fetched ${products.length} products`);
    return products;
  } catch (error) {
    console.error('✗ Error fetching data:', error.message);
    process.exit(1);
  }
}

/**
 * Strip HTML tags from text
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp;
    .replace(/&amp;/g, '&')  // Replace &amp;
    .replace(/&lt;/g, '<')   // Replace &lt;
    .replace(/&gt;/g, '>')   // Replace &gt;
    .replace(/&quot;/g, '"') // Replace &quot;
    .replace(/&#39;/g, "'")  // Replace &#39;
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

/**
 * Download image from URL to temporary file
 */
async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PDF-Generator/1.0)'
      }
    });
    
    // Create temp directory if doesn't exist
    const tempDir = path.join(config.projectRoot, 'uploads', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Create unique filename
    const ext = url.split('.').pop().split('?')[0].substring(0, 4) || 'jpg';
    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const filepath = path.join(tempDir, filename);
    
    // Write to file
    fs.writeFileSync(filepath, response.data);
    
    return filepath;
  } catch (error) {
    console.log(`  ✗ Download error: ${error.message}`);
    return null;
  }
}

/**
 * Group products by category/facility/department
 */
function groupProductsByCategory(products) {
  const grouped = {};

  products.forEach(product => {
    // Support multiple field names for category
    const category = 
      product.category ||           // For external API (accordmedical.co.ke)
      product.product_type ||       // Alternative field
      product.facility?.name ||     // For internal machines API
      product.department || 
      product.type ||
      'Uncategorized';

    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(product);
  });

  return grouped;
}

/**
 * Generate PDF document
 */
async function generatePDF(products) {
  // Create temp directory for images
  const tempDir = path.join(config.projectRoot, 'uploads', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Track downloaded images for cleanup
  const downloadedImages = [];
  
  return new Promise(async (resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40
      });

      // Pipe to file
      const stream = fs.createWriteStream(config.output);
      doc.pipe(stream);

      // Add logo if exists
      if (fs.existsSync(config.logo)) {
        try {
          doc.image(config.logo, 40, 40, { width: 100 });
          console.log(`✓ Logo added: ${config.logo}`);
        } catch (logoError) {
          console.warn(`⚠ Could not add logo: ${logoError.message}`);
        }
      } else {
        console.warn(`⚠ Logo not found: ${config.logo}`);
      }

      // Title
      doc.fontSize(18).font('Helvetica-Bold');
      doc.text(config.company, { align: 'center' });
      doc.fontSize(14);
      doc.text('Product Catalog – Department Listing', { align: 'center' });
      doc.moveDown();

      // Separator line
      doc.moveTo(40, doc.y)
        .lineTo(555, doc.y)
        .stroke();
      doc.moveDown();

      // Group products
      const grouped = groupProductsByCategory(products);
      
      let totalProducts = 0;
      const categories = Object.keys(grouped).sort();

      // Generate section for each category
      for (const category of categories) {
        const categoryProducts = grouped[category];
        totalProducts += categoryProducts.length;

        // Category header
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(`[DEPARTMENT: ${category}]`);
        
        // Separator
        doc.moveTo(40, doc.y)
          .lineTo(555, doc.y)
          .stroke();
        doc.moveDown(5);

        // Table header
        doc.fontSize(10).font('Helvetica-Bold');
        const columnWidths = { product: 150, description: 270, image: 100 };
        const startX = 40;
        const tableWidth = columnWidths.product + columnWidths.description + columnWidths.image;
        const headerY = doc.y;

        // Header text
        doc.text('Product', startX + 5, headerY, { width: columnWidths.product - 10 });
        doc.text('Description', startX + columnWidths.product + 5, headerY, { width: columnWidths.description - 10 });
        doc.text('Image', startX + columnWidths.product + columnWidths.description + 5, headerY, { width: columnWidths.image - 10 });

        doc.moveDown();
        
        // Table header separator (horizontal line)
        const headerBottomY = doc.y;
        doc.moveTo(startX, headerBottomY)
          .lineTo(startX + tableWidth, headerBottomY)
          .stroke();
        doc.moveDown(0.5);

        // Table rows - Process asynchronously to handle image downloads
        doc.fontSize(9).font('Helvetica');
        
        // Process each product
        for (const product of categoryProducts) {
          // Support both internal and external API field names
          const productName = 
            product.product_name ||     // External API (accordmedical.co.ke)
            product.name || 
            product.productName || 
            'N/A';
          
          // Get description and strip HTML
          let description = 
            product.product_description ||  // External API
            product.description || 
            product.specifications || 
            'No description available';
          
          description = stripHtml(description);
          
          // Truncate to 120 characters for better layout
          if (description.length > 120) {
            description = description.substring(0, 120) + '...';
          }
          
          // Get image URL - prefer product_image (full path) over product_image_md
          let imageUrl = null;
          if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            imageUrl = product.images[0].product_image || product.images[0].product_image_md;
          } else if (product.imageUrl) {
            imageUrl = product.imageUrl;
          } else if (product.image) {
            imageUrl = product.image;
          } else if (product.product_image) {
            imageUrl = product.product_image;
          }

          // Check if we need a new page (with more space for images)
          if (doc.y > 670) {
            doc.addPage();
            doc.moveDown(2);
          }

          const rowStartY = doc.y;
          const rowHeight = 70; // Fixed row height to accommodate images
          
          // Draw vertical column separators for this row
          const col1X = startX;
          const col2X = startX + columnWidths.product;
          const col3X = startX + columnWidths.product + columnWidths.description;
          const col4X = startX + tableWidth;
          
          // Left border
          doc.moveTo(col1X, rowStartY)
            .lineTo(col1X, rowStartY + rowHeight)
            .stroke();
          
          // Column separator 1
          doc.moveTo(col2X, rowStartY)
            .lineTo(col2X, rowStartY + rowHeight)
            .stroke();
          
          // Column separator 2
          doc.moveTo(col3X, rowStartY)
            .lineTo(col3X, rowStartY + rowHeight)
            .stroke();
          
          // Right border
          doc.moveTo(col4X, rowStartY)
            .lineTo(col4X, rowStartY + rowHeight)
            .stroke();

          // Product name (Column 1)
          doc.text(productName, startX + 5, rowStartY + 5, { 
            width: columnWidths.product - 10, 
            height: rowHeight - 10,
            lineBreak: true,
            ellipsis: true
          });

          // Description (Column 2)
          doc.text(description, col2X + 5, rowStartY + 5, { 
            width: columnWidths.description - 10,
            height: rowHeight - 10,
            lineBreak: true,
            ellipsis: true
          });

          // Image (Column 3)
          if (imageUrl) {
            try {
              // Download image
              console.log(`📥 Downloading: ${imageUrl.substring(0, 60)}...`);
              const imagePath = await downloadImage(imageUrl);
              
              if (imagePath && fs.existsSync(imagePath)) {
                downloadedImages.push(imagePath);
                console.log(`✓ Image downloaded: ${path.basename(imagePath)}`);
                
                // Add image to PDF
                const imageX = col3X + 10;
                const imageY = rowStartY + 5;
                const imageWidth = 80;
                const imageHeight = 60;
                
                doc.image(imagePath, imageX, imageY, { 
                  fit: [imageWidth, imageHeight],
                  align: 'center',
                  valign: 'center'
                });
              } else {
                console.log(`⚠ Failed to download image`);
                // If download failed, show placeholder
                doc.fontSize(8).text('[IMG]', col3X + 5, rowStartY + 30, { 
                  width: columnWidths.image - 10,
                  align: 'center'
                });
                doc.fontSize(9);
              }
            } catch (imgError) {
              console.log(`✗ Image error: ${imgError.message}`);
              // If image fails, show placeholder
              doc.fontSize(8).text('[IMG]', col3X + 5, rowStartY + 30, { 
                width: columnWidths.image - 10,
                align: 'center'
              });
              doc.fontSize(9);
            }
          } else {
            // No image available
            doc.fontSize(8).text('–', col3X + 5, rowStartY + 30, { 
              width: columnWidths.image - 10,
              align: 'center'
            });
            doc.fontSize(9);
          }

          // Move to next row
          doc.y = rowStartY + rowHeight;

          // Bottom horizontal separator
          doc.moveTo(startX, doc.y)
            .lineTo(startX + tableWidth, doc.y)
            .stroke();
        } // End for loop

        // End of department marker
        doc.fontSize(10);
        doc.text(`End of ${category}`, { align: 'center' });
        doc.moveDown();

        // Department separator
        doc.moveTo(40, doc.y)
          .lineTo(555, doc.y)
          .stroke();
        doc.moveDown(10);
      } // End for categories

      // Footer with metadata
      doc.fontSize(8);
      doc.text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
      doc.text(`Total Products: ${totalProducts} | Categories: ${categories.length}`, { align: 'center' });

      // Finalize PDF
      doc.end();

      // Wait for file to be written
      stream.on('finish', () => {
        // Cleanup downloaded images
        downloadedImages.forEach(imgPath => {
          try {
            if (fs.existsSync(imgPath)) {
              fs.unlinkSync(imgPath);
            }
          } catch (e) {
            // Ignore cleanup errors
          }
        });
        
        console.log(`✓ PDF generated: ${config.output}`);
        console.log(`✓ File size: ${(fs.statSync(config.output).size / 1024).toFixed(2)} KB`);
        console.log(`✓ Downloaded images: ${downloadedImages.length}`);
        resolve(config.output);
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('\n🚀 PDF Generator - Product Catalog\n');
    console.log(`Config:`);
    console.log(`  API Endpoint: ${config.api}`);
    console.log(`  Output File: ${config.output}`);
    console.log(`  Company: ${config.company}`);
    console.log(`  Logo: ${config.logo}`);
    console.log();

    // Fetch data
    const products = await fetchProductData();

    // Generate PDF
    await generatePDF(products);

    console.log('\n✅ PDF generation complete!\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
main();
