import axios from 'axios';
import logger from '../utils/logger.js';
import * as dotenv from 'dotenv';

dotenv.config();

// Trim all env values to avoid whitespace issues that can cause "Wrong credentials"
const MPESA_CONSUMER_KEY = (process.env.MPESA_CONSUMER_KEY || '').trim();
const MPESA_CONSUMER_SECRET = (process.env.MPESA_CONSUMER_SECRET || '').trim();
const MPESA_BUSINESS_SHORT_CODE = (process.env.MPESA_BUSINESS_SHORT_CODE || '').trim();
const MPESA_PASSKEY = (process.env.MPESA_PASSKEY || '').trim();
const MPESA_ENVIRONMENT = (process.env.MPESA_ENVIRONMENT || process.env.MPESA_ENV || 'sandbox').trim();
const MPESA_CALLBACK_URL = (process.env.MPESA_CALLBACK_URL || '').trim();

const baseUrl = MPESA_ENVIRONMENT === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

/**
 * Generate M-Pesa Access Token
 */
export const generateAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const url = `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.access_token) {
      logger.info('M-Pesa access token generated successfully');
      return response.data.access_token;
    }

    throw new Error('Failed to generate access token');
  } catch (error) {
    logger.error('Generate access token error:', error.response?.data || error.message);
    throw new Error('Failed to generate M-Pesa access token: ' + error.message);
  }
};

/**
 * Generate M-Pesa Password
 */
function generatePassword() {
  const timestamp = new Date().toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14);

  const passwordString = `${MPESA_BUSINESS_SHORT_CODE}${MPESA_PASSKEY}${timestamp}`;
  const password = Buffer.from(passwordString).toString('base64');

  logger.info(`Password generation - ShortCode: ${MPESA_BUSINESS_SHORT_CODE}, Timestamp: ${timestamp}, Passkey length: ${MPESA_PASSKEY.length}`);
  logger.info(`Password generation - Base64 (first 12 chars): ${password.slice(0, 12)}...`);

  return { password, timestamp };
}

/**
 * Initiate STK Push (Lipa Na M-Pesa Online)
 */
export const initiateSTKPush = async (phoneNumber, amount, orderId, accountReference) => {
  try {
    const accessToken = await generateAccessToken();
    const { password, timestamp } = generatePassword();

    const url = `${baseUrl}/mpesa/stkpush/v1/processrequest`;

    const payload = {
      BusinessShortCode: MPESA_BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phoneNumber,
      PartyB: MPESA_BUSINESS_SHORT_CODE,
      PhoneNumber: phoneNumber,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: (accountReference || orderId).substring(0, 12),
      TransactionDesc: `Payment for Order ${orderId}`.substring(0, 13)
    };

    logger.info(`Initiating STK Push - URL: ${url}`);
    logger.info(`STK Push Payload: ${JSON.stringify(payload, null, 2)}`);
    logger.info(`STK Push - Phone: ${phoneNumber}, Amount: ${amount}, Order: ${orderId}, Env: ${MPESA_ENVIRONMENT}`);

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    logger.info(`STK Push Response:`, JSON.stringify(response.data, null, 2));

    if (response.data && response.data.ResponseCode === '0') {
      logger.info(`STK Push initiated successfully: ${response.data.CheckoutRequestID}`);
      return {
        success: true,
        CheckoutRequestID: response.data.CheckoutRequestID,
        MerchantRequestID: response.data.MerchantRequestID,
        ResponseDescription: response.data.ResponseDescription
      };
    } else {
      const errorMessage = response.data?.errorMessage || response.data?.ResponseDescription || 'Unknown error';
      logger.error(`STK Push failed: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  } catch (error) {
    logger.error('Initiate STK Push error response:', error.response?.data);
    logger.error('Initiate STK Push error message:', error.message);
    throw new Error('Failed to initiate M-Pesa payment: ' + error.message);
  }
};

/**
 * Query STK Push Status
 */
export const querySTKPushStatus = async (checkoutRequestID) => {
  try {
    const accessToken = await generateAccessToken();
    const { password, timestamp } = generatePassword();

    const url = `${baseUrl}/mpesa/stkpushquery/v1/query`;

    const payload = {
      BusinessShortCode: MPESA_BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID
    };

    logger.info(`Querying STK status: ${checkoutRequestID}`);

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    logger.info(`STK Query response: ${response.data.ResponseCode}`);
    return response.data;
  } catch (error) {
    logger.error('Query STK Push status error:', error.response?.data || error.message);
    throw new Error('Failed to query STK Push status: ' + error.message);
  }
};

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (phoneNumber) => {
  // Should be 254XXXXXXXXX format
  const phoneRegex = /^254\d{9}$/;
  return phoneRegex.test(phoneNumber);
};

/**
 * Format phone number to M-Pesa format
 */
export const formatPhoneNumber = (phoneNumber) => {
  // Remove spaces and special characters
  let clean = phoneNumber.replace(/\D/g, '');

  // If starts with 0, replace with 254
  if (clean.startsWith('0')) {
    clean = '254' + clean.substring(1);
  }

  // If doesn't start with 254, add it
  if (!clean.startsWith('254')) {
    clean = '254' + clean;
  }

  return clean;
};
