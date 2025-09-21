import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config(); // load from project root .env

const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  // eslint-disable-next-line no-console
  console.warn('Cloudinary env vars missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

// DEBUG: log whether cloudinary credentials loaded (do not print secret in logs)
console.info('Cloudinary config:', { cloud: cloudName ? true : false, apiKeyPresent: !!apiKey, apiSecretPresent: !!apiSecret });

/**
 * Upload a file as raw to Cloudinary and return public fields.
 * No signed URL required; use returned secure_url directly.
 * @param {string} filePath - local file path
 * @param {object} options - upload options (e.g. { folder: 'reports' })
 * @returns {Promise<{secure_url:string, public_id:string, original_filename:string, format:string}>}
 */
export async function uploadRaw(filePath, options = { folder: 'reports' }) {
  if (!filePath) throw new Error('filePath is required for uploadRaw');
  const res = await cloudinary.uploader.upload(filePath, {
    resource_type: 'raw',
    ...options,
  });
  return {
    secure_url: res.secure_url,
    public_id: res.public_id,
    original_filename: res.original_filename,
    format: res.format,
  };
}

/**
 * Build a public forced-download URL (fl_attachment) for a raw upload.
 * Example:
 * buildForcedDownloadUrl('w9hbgyt1t5qmlg7uuagu', { folder: 'reports', format: 'pdf' })
 * => https://res.cloudinary.com/<cloud_name>/raw/upload/fl_attachment/reports/w9hbgyt1t5qmlg7uuagu.pdf
 */
export function buildForcedDownloadUrl(publicId, { folder = '', format = '' } = {}) {
  if (!publicId) throw new Error('publicId is required for buildForcedDownloadUrl');
  const cfg = cloudinary.config();
  const name = cfg.cloud_name || cloudName;
  const folderPath = folder ? `${folder}/` : '';
  const ext = format ? `.${String(format).replace(/^\./, '')}` : '';
  return `https://res.cloudinary.com/${name}/raw/upload/fl_attachment/${folderPath}${publicId}${ext}`;
}

export default cloudinary;