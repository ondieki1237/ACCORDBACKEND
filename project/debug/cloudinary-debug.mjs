import dotenv from 'dotenv';
dotenv.config();

import cloudinary from '../src/utils/cloudinary.js';

const arg = process.argv[2] || 'reports/yvv55tzbhjrpzvsgktuc';
function stripExt(id){ return id.replace(/\.[^/.]+$/, ''); }

async function run(){
  const raw = String(arg);
  const publicId = stripExt(raw);
  console.log('using publicId raw -> base:', raw, '->', publicId);
  console.log('cloud name set:', !!cloudinary.config().cloud_name);
  try{
    const resource = await cloudinary.api.resource(publicId, { resource_type: 'raw' });
    console.log('resource.type:', resource.type, 'access_mode:', resource.access_mode);
    const signed = cloudinary.utils.private_download_url(publicId, {
      resource_type: 'raw',
      type: 'authenticated',
      filename: 'report.pdf',
      expire_at: Math.floor(Date.now()/1000) + 60
    });
    console.log('signedUrl:', signed);
  }catch(err){
    console.error('cloudinary error:', err && err.message ? err.message : err);
  }
  process.exit();
}
run();