import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger.js';

// Resolve key file from env or a set of likely candidate locations
const candidatePaths = [
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
  path.resolve(process.cwd(), 'service-account.json'),                // ./project/service-account.json
  path.resolve(process.cwd(), 'config', 'service-account.json'),     // ./project/config/service-account.json
  path.resolve(process.cwd(), '..', 'service-account.json'),         // ../service-account.json (repo root)
  path.resolve(process.cwd(), '..', 'config', 'service-account.json'),
  path.resolve(process.cwd(), 'kazihub-468305-1a197c2229be.json'),
  path.resolve(process.cwd(), 'project', 'kazihub-468305-1a197c2229be.json')
];

const keyFile = candidatePaths.find(p => p && fs.existsSync(p));
if (keyFile) {
  logger.info(`Using Google service account JSON: ${keyFile}`);
} else {
  logger.warn('No Google service account JSON found; set GOOGLE_APPLICATION_CREDENTIALS or place service-account.json in project or repo root');
}

const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

// Ensure folder exists for machine documents and return its ID
export const ensureMachinesFolder = async () => {
  try {
    const targetName = process.env.GOOGLE_DRIVE_FOLDER_NAME || 'ACCORD_MACHINES';

    // If folder id explicitly provided, validate and return it
    if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
      return process.env.GOOGLE_DRIVE_FOLDER_ID;
    }

    // Search for existing folder with the target name
    const res = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${targetName}' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (res.data.files && res.data.files.length > 0) {
      const folder = res.data.files[0];
      logger.info(`Found Drive folder ${folder.name} (${folder.id})`);
      return folder.id;
    }

    // Create the folder
    const createRes = await drive.files.create({
      resource: { name: targetName, mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id'
    });

    const folderId = createRes.data.id;
    logger.info(`Created Drive folder ${targetName} (${folderId})`);
    return folderId;
  } catch (error) {
    logger.error('Failed to ensure machines folder on Drive:', error && error.message ? error.message : error);
    return null;
  }
};

export default drive;