import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, '../../uploads/planners');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

export const generatePlannerPDF = async (planner, user) => {
  return new Promise((resolve, reject) => {
    try {
      const filename = `planner-${planner._id}.pdf`;
      const filepath = path.join(OUTPUT_DIR, filename);

      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(16).font('Helvetica-Bold').text('Weekly Planner', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Submitted by: ${user.firstName} ${user.lastName} (${user.email})`);
      doc.text(`Week starting: ${new Date(planner.weekCreatedAt).toDateString()}`);
      doc.moveDown();

      // Notes
      if (planner.notes) {
        doc.fontSize(11).font('Helvetica-Bold').text('Notes:');
        doc.fontSize(10).font('Helvetica').text(planner.notes);
        doc.moveDown();
      }

      // Table header
      doc.fontSize(11).font('Helvetica-Bold').text('Days', { underline: true });
      doc.moveDown(0.5);

      // Days
      const days = planner.days || [];
      days.forEach(d => {
        doc.fontSize(10).font('Helvetica-Bold').text(`${d.day} - ${d.date ? new Date(d.date).toDateString() : ''}`);
        if (d.place) doc.fontSize(10).font('Helvetica').text(`Location: ${d.place}`);
        if (d.means) doc.fontSize(10).font('Helvetica').text(`Means: ${d.means}`);
        if (d.allowance) doc.fontSize(10).font('Helvetica').text(`Allowance: ${d.allowance}`);
        if (d.prospects) doc.fontSize(10).font('Helvetica').text(`Prospects: ${d.prospects}`);
        doc.moveDown(0.5);
      });

      doc.end();

      stream.on('finish', () => {
        logger.info(`Planner PDF generated: ${filepath}`);
        resolve({ filepath, filename });
      });

      stream.on('error', err => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};
