import crypto from 'crypto';
import logger from './logger.js';

/**
 * Credential Encryption Utility
 * Securely encrypt and decrypt email passwords
 */

// Get encryption key from environment or generate default
const rawKey = process.env.EMAIL_ENCRYPTION_KEY;

function generateDefaultKey() {
  // Generate a default key if not in environment
  // WARNING: In production, always use EMAIL_ENCRYPTION_KEY env var
  const defaultKey = process.env.NODE_ENV === 'production' 
    ? null 
    : 'default-dev-key-32-chars-long!!';
  
  if (!defaultKey) {
    throw new Error('EMAIL_ENCRYPTION_KEY environment variable must be set in production');
  }
  
  // Ensure key is 32 bytes for AES-256
  return crypto.createHash('sha256').update(defaultKey).digest();
}

// Ensure we have a valid key either from env or generated default
const ENCRYPTION_KEY = rawKey 
  ? crypto.createHash('sha256').update(rawKey.trim()).digest()
  : generateDefaultKey();


/**
 * Encrypt a password
 * @param {string} password - Plain text password
 * @returns {string} Encrypted password (iv:encrypted format)
 */
export function encryptPassword(password) {
  try {
    // Generate random IV
    const iv = crypto.randomBytes(16);
    
    // Get cipher key
    const key = typeof ENCRYPTION_KEY === 'string' 
      ? crypto.createHash('sha256').update(ENCRYPTION_KEY).digest()
      : ENCRYPTION_KEY;
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    // Encrypt
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return iv:encrypted format
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    logger.error('Password encryption error:', error);
    throw new Error('Failed to encrypt password');
  }
}

/**
 * Decrypt a password
 * @param {string} encryptedData - Encrypted password (iv:encrypted format)
 * @returns {string} Plain text password
 */
export function decryptPassword(encryptedData) {
  try {
    // Split iv and encrypted data
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    // Get cipher key
    const key = typeof ENCRYPTION_KEY === 'string' 
      ? crypto.createHash('sha256').update(ENCRYPTION_KEY).digest()
      : ENCRYPTION_KEY;
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Password decryption error:', error);
    throw new Error('Failed to decrypt password - encryption key may be invalid');
  }
}

/**
 * Generate a secure encryption key
 * Run this once and save the output to EMAIL_ENCRYPTION_KEY env var
 */
export function generateEncryptionKey() {
  const key = crypto.randomBytes(32).toString('hex');
  console.log('Generated encryption key (save this to EMAIL_ENCRYPTION_KEY):');
  console.log(key);
  return key;
}

export default {
  encryptPassword,
  decryptPassword,
  generateEncryptionKey
};
