/**
 * PDF Catalog Service
 * Optional: Can be integrated into routes or called directly
 * 
 * Usage:
 *   import pdfCatalogService from './pdfCatalogService.js';
 *   
 *   // Generate from external API
 *   const pdfPath = await pdfCatalogService.generateFromAPI('http://api-url/products');
 *   
 *   // Or from local data
 *   const pdfPath = await pdfCatalogService.generateFromData(productsArray);
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATALOG_DIR = path.join(__dirname, '../../uploads/catalogs');
const LOGO_PATH = path.join(__dirname, '../../other/Logo_only.png');

// Ensure catalog directory exists
if (!fs.existsSync(CATALOG_DIR)) {
  fs.mkdirSync(CATALOG_DIR, { recursive: true });
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
 * Group products by category
 */
function groupProductsByCategory(products) {
  const grouped = {};

  products.forEach(product => {
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
 * Generate PDF from product data array
 */
function createPDFDocument(products, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const {
        company = 'ACCORD Medical',
        filename = `catalog-${Date.now()}.pdf`,
        logo = LOGO_PATH
      } = options;

      const filepath = path.join(CATALOG_DIR, filename);

      // Create PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40
      });

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Add logo
      if (fs.existsSync(logo)) {
        try {
          doc.image(logo, 40, 40, { width: 100 });
        } catch (err) {
          logger.warn('Could not add logo to PDF:', err.message);
        }
      }

      // Title
      doc.fontSize(18).font('Helvetica-Bold');
      doc.text(company, { align: 'center' });
      doc.fontSize(14);
      doc.text('Product Catalog – Department Listing', { align: 'center' });
      doc.moveDown();

      // Separator line
      doc.moveTo(40, doc.y)
        .lineTo(555, doc.y)
        .stroke();
      doc.moveDown();

      // Group and render
      const grouped = groupProductsByCategory(products);
      let totalProducts = 0;
      const categories = Object.keys(grouped).sort();

      categories.forEach(category => {
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
        const columnWidths = { product: 130, description: 300, image: 80 };
        const startX = 40;
        const y = doc.y;

        doc.text('Product', startX, y, { width: columnWidths.product });
        doc.text('Description', startX + columnWidths.product, y, { width: columnWidths.description });
        doc.text('Image', startX + columnWidths.product + columnWidths.description, y, { width: columnWidths.image });

        doc.moveDown();

        // Table separator
        doc.moveTo(startX, doc.y)
          .lineTo(startX + columnWidths.product + columnWidths.description + columnWidths.image, doc.y)
          .stroke();
        doc.moveDown(5);

        // Table rows
        doc.fontSize(9).font('Helvetica');
        categoryProducts.forEach(product => {
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
          
          // Truncate to 150 characters
          if (description.length > 150) {
            description = description.substring(0, 150) + '...';
          }
          
          // Check for images
          let imageStatus = '[–]';
          if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            imageStatus = '[IMG]';  // External API
          } else if (product.imageUrl || product.image || product.product_image) {
            imageStatus = '[IMG]';  // Internal API
          }

          // Page break if needed
          if (doc.y > 720) {
            doc.addPage();
            doc.moveDown(2);
          }

          const rowY = doc.y;
          doc.text(productName, startX, rowY, { width: columnWidths.product, lineBreak: true });
          doc.text(description, startX + columnWidths.product, rowY, { width: columnWidths.description, lineBreak: true });
          doc.text(imageStatus, startX + columnWidths.product + columnWidths.description, rowY, { width: columnWidths.image });

          doc.moveDown(15);

          // Row separator
          doc.moveTo(startX, doc.y)
            .lineTo(startX + columnWidths.product + columnWidths.description + columnWidths.image, doc.y)
            .stroke();
          doc.moveDown(5);
        });

        // End of department
        doc.fontSize(10);
        doc.text(`End of ${category}`, { align: 'center' });
        doc.moveDown();

        // Separator
        doc.moveTo(40, doc.y)
          .lineTo(555, doc.y)
          .stroke();
        doc.moveDown(10);
      });

      // Footer
      doc.fontSize(8);
      doc.text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
      doc.text(`Total Products: ${totalProducts} | Categories: ${categories.length}`, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        logger.info(`PDF catalog generated: ${filepath}`);
        resolve({ filepath, filename, size: fs.statSync(filepath).size });
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Export service methods
 */
const pdfCatalogService = {
  /**
   * Generate PDF from array of products
   */
  async generateFromData(products, options = {}) {
    try {
      if (!Array.isArray(products) || products.length === 0) {
        throw new Error('Products must be a non-empty array');
      }

      logger.info(`Generating PDF catalog from ${products.length} products`);
      return await createPDFDocument(products, options);
    } catch (error) {
      logger.error('PDF generation error:', error);
      throw error;
    }
  },

  /**
   * Generate PDF from external API
   */
  async generateFromAPI(apiUrl, options = {}) {
    try {
      logger.info(`Fetching products from API: ${apiUrl}`);

      // Dynamic import of axios to avoid top-level import
      const axios = (await import('axios')).default;

      const response = await axios.get(apiUrl, { timeout: 10000 });

      let products = response.data;
      if (response.data.data) {
        products = response.data.data;
      } else if (response.data.docs) {
        products = response.data.docs;
      }

      if (!Array.isArray(products)) {
        throw new Error('API response is not an array of products');
      }

      logger.info(`Fetched ${products.length} products from API`);
      return await createPDFDocument(products, options);
    } catch (error) {
      logger.error('Error fetching or generating PDF:', error);
      throw error;
    }
  },

  /**
   * Get catalog directory path
   */
  getCatalogDir() {
    return CATALOG_DIR;
  },

  /**
   * List all generated catalogs
   */
  listCatalogs() {
    try {
      return fs.readdirSync(CATALOG_DIR)
        .filter(file => file.endsWith('.pdf'))
        .map(file => ({
          name: file,
          path: path.join(CATALOG_DIR, file),
          size: fs.statSync(path.join(CATALOG_DIR, file)).size,
          created: fs.statSync(path.join(CATALOG_DIR, file)).birthtime
        }));
    } catch (error) {
      logger.warn('Could not list catalogs:', error.message);
      return [];
    }
  },

  /**
   * Delete a catalog file
   */
  deleteCatalog(filename) {
    try {
      const filepath = path.join(CATALOG_DIR, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        logger.info(`Deleted catalog: ${filename}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error deleting catalog:', error);
      throw error;
    }
  }
};

export default pdfCatalogService;
