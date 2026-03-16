import crypto from 'crypto';
import logger from '../utils/logger.js';
import { getTeraBoxApp } from '../config/terabox.js';

const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB chunks
const ACCORD_DOCUMENTS_FOLDER = '/ACCORD_DOCUMENTS';

/**
 * Calculate MD5 hash of a buffer
 * @param {Buffer} buffer - The data to hash
 * @returns {string} - Hex string of MD5 hash
 */
export const calculateMD5 = (buffer) => {
  return crypto.createHash('md5').update(buffer).digest('hex');
};

/**
 * Create or get the ACCORD_DOCUMENTS folder on TeraBox
 * @param {TeraBoxApp} app - The TeraBox app instance
 * @returns {Promise<string>} - The folder path
 */
export const ensureTeraBoxFolder = async (app) => {
  try {
    // Check if folder exists
    const remoteDir = await app.getRemoteDir('/');
    
    for (const item of remoteDir.list) {
      if (item.server_filename === 'ACCORD_DOCUMENTS' && item.isdir) {
        logger.info('ACCORD_DOCUMENTS folder already exists');
        return ACCORD_DOCUMENTS_FOLDER;
      }
    }

    // Create the folder if it doesn't exist
    logger.info('Creating ACCORD_DOCUMENTS folder on TeraBox');
    await app.createDir(ACCORD_DOCUMENTS_FOLDER);
    logger.info('ACCORD_DOCUMENTS folder created successfully');
    
    return ACCORD_DOCUMENTS_FOLDER;
  } catch (error) {
    logger.error('Error ensuring TeraBox folder:', error.message);
    throw error;
  }
};

/**
 * Upload file to TeraBox with chunked upload
 * Implements the TeraBox workflow: precreateFile → uploadChunk → createFile
 * 
 * @param {Buffer} fileBuffer - The file data to upload
 * @param {string} fileName - The name of the file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<Object>} - Upload result with fileId, fileName, fileSize, path, etc.
 */
export const uploadToTeraBox = async (fileBuffer, fileName, mimeType) => {
  if (!fileBuffer || !fileName) {
    throw new Error('fileBuffer and fileName are required');
  }

  const app = getTeraBoxApp();
  if (!app) {
    throw new Error('TeraBox not initialized');
  }

  try {
    // Ensure folder exists
    await ensureTeraBoxFolder(app);

    const fileSize = fileBuffer.length;
    const fileMD5 = calculateMD5(fileBuffer);
    const filePath = `${ACCORD_DOCUMENTS_FOLDER}/${fileName}`;

    logger.info(`Uploading file to TeraBox: ${fileName} (${fileSize} bytes)`);

    // Step 1: Try rapid upload first (for small/duplicate files)
    try {
      logger.info(`Attempting rapid upload for ${fileName}`);
      
      const contentMd5 = fileMD5;
      const sliceMd5 = calculateMD5(fileBuffer.slice(0, Math.min(256 * 1024, fileSize))); // First 256KB
      
      const rapidResult = await app.rapidUpload({
        path: filePath,
        content_length: fileSize,
        content_md5: contentMd5,
        slice_md5: sliceMd5
      });

      if (rapidResult) {
        logger.info(`File uploaded successfully via rapid upload: ${fileName}`);
        return {
          fileId: rapidResult.fs_id || filePath,
          fileName,
          fileSize,
          uploadPath: filePath,
          uploadType: 'rapid',
          contentMd5: fileMD5,
          timestamp: new Date()
        };
      }
    } catch (rapidError) {
      logger.info(`Rapid upload failed, using chunked upload: ${rapidError.message}`);
      // Continue to chunked upload
    }

    // Step 2: Chunked upload workflow
    const uploadHost = await app.getUploadHost();
    const uploadToken = uploadHost.token;

    // Precreate the file
    logger.info(`Precreating file on TeraBox: ${fileName}`);
    const precreateResult = await app.precreateFile({
      path: filePath,
      size: fileSize,
      content_md5: fileMD5,
      content_type: mimeType
    });

    const blockList = [];
    const uploadId = precreateResult.uploadid || crypto.randomBytes(8).toString('hex');
    let uploadedBytes = 0;

    // Upload file in chunks
    const numChunks = Math.ceil(fileSize / CHUNK_SIZE);
    logger.info(`Uploading ${fileName} in ${numChunks} chunks (${CHUNK_SIZE} bytes per chunk)`);

    for (let i = 0; i < numChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunkBuffer = fileBuffer.slice(start, end);
      const chunkMd5 = calculateMD5(chunkBuffer);

      logger.info(`Uploading chunk ${i + 1}/${numChunks} for ${fileName} (${chunkBuffer.length} bytes)`);

      try {
        await app.uploadChunk({
          uploadhost: uploadHost.host,
          path: filePath,
          partseq: i,
          uploadid: uploadId,
          file: chunkBuffer,
          content_md5: chunkMd5
        });

        blockList.push({
          block_md5: chunkMd5,
          content_crc32: 0
        });

        uploadedBytes += chunkBuffer.length;
        const progress = Math.round((uploadedBytes / fileSize) * 100);
        logger.info(`Upload progress: ${progress}% (${uploadedBytes}/${fileSize} bytes)`);
      } catch (chunkError) {
        logger.error(`Chunk ${i + 1} upload failed:`, chunkError.message);
        throw chunkError;
      }
    }

    // Step 3: Create the file (finalize upload)
    logger.info(`Finalizing upload for ${fileName}`);
    const createResult = await app.createFile({
      path: filePath,
      uploadid: uploadId,
      block_list: blockList,
      size: fileSize,
      content_md5: fileMD5
    });

    logger.info(`File uploaded successfully: ${fileName}`);
    
    return {
      fileId: createResult.fs_id || filePath,
      fileName,
      fileSize,
      uploadPath: filePath,
      uploadType: 'chunked',
      contentMd5: fileMD5,
      timestamp: new Date(),
      chunks: numChunks
    };
  } catch (error) {
    logger.error('TeraBox upload error:', error.message);
    throw new Error(`TeraBox upload failed: ${error.message}`);
  }
};

/**
 * Delete a file from TeraBox
 * @param {string} filePath - The path of the file to delete
 * @returns {Promise<boolean>} - True if deleted successfully
 */
export const deleteFromTeraBox = async (filePath) => {
  const app = getTeraBoxApp();
  if (!app) {
    throw new Error('TeraBox not initialized');
  }

  try {
    logger.info(`Deleting file from TeraBox: ${filePath}`);
    
    await app.filemanager({
      operation: 'delete',
      filelist: [filePath]
    });

    logger.info(`File deleted successfully: ${filePath}`);
    return true;
  } catch (error) {
    logger.error('TeraBox delete error:', error.message);
    throw new Error(`Failed to delete file from TeraBox: ${error.message}`);
  }
};

/**
 * Get download link for a file on TeraBox
 * @param {string} filePath - The path of the file
 * @returns {Promise<string>} - The download URL
 */
export const getTeraBoxDownloadLink = async (filePath) => {
  const app = getTeraBoxApp();
  if (!app) {
    throw new Error('TeraBox not initialized');
  }

  try {
    logger.info(`Getting download link for: ${filePath}`);
    
    const metadata = await app.getFileMeta({
      path: filePath
    });

    if (metadata && metadata.dlink) {
      return metadata.dlink;
    }

    // Fallback: generate a shareLink and get pan token
    const shareResult = await app.shareSet({
      fsids: [metadata.fs_id],
      public: 1
    });

    if (shareResult && shareResult.shareid) {
      const panToken = await app.genPanToken(shareResult.shareid);
      return `https://pan.terabox.com/s/${shareResult.shareid}?pwd=${panToken}`;
    }

    throw new Error('Could not generate download link');
  } catch (error) {
    logger.error('TeraBox download link error:', error.message);
    throw new Error(`Failed to get download link: ${error.message}`);
  }
};

export default {
  calculateMD5,
  ensureTeraBoxFolder,
  uploadToTeraBox,
  deleteFromTeraBox,
  getTeraBoxDownloadLink,
  CHUNK_SIZE,
  ACCORD_DOCUMENTS_FOLDER
};
