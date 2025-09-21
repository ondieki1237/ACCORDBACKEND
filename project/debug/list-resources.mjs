import dotenv from 'dotenv';
dotenv.config();

import cloudinary from '../src/utils/cloudinary.js';

const folder = process.argv[2] || 'reports';
const typesToCheck = ['upload', 'authenticated', 'private'];

async function listForType(type) {
  try {
    const res = await cloudinary.api.resources({
      resource_type: 'raw',
      type,
      prefix: `${folder}/`,
      max_results: 500
    });
    return res.resources || [];
  } catch (err) {
    console.error(`cloudinary list error for type=${type}:`, err && err.message ? err.message : err);
    return [];
  }
}

async function run() {
  try {
    console.log('Using cloud:', cloudinary.config().cloud_name || '(none)');
    let total = 0;
    for (const type of typesToCheck) {
      const resources = await listForType(type);
      if (resources.length) {
        console.log(`\nType: ${type} — found ${resources.length}`);
        resources.forEach(r => {
          console.log('-', r.public_id, '| type:', r.type || r.access_mode || 'n/a', '| format:', r.format);
        });
        total += resources.length;
      } else {
        console.log(`\nType: ${type} — none`);
      }
    }
    console.log(`\nTotal resources across types: ${total}`);
  } catch (err) {
    console.error('unexpected error:', err && err.message ? err.message : err);
  } finally {
    process.exit();
  }
}
run();