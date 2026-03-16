import mysql from 'mysql2/promise';
import logger from '../utils/logger.js';

let pool = null;

export const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'accordm_app_user',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'accordm_application',
      port: parseInt(process.env.MYSQL_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
};

export const connectMySQL = async () => {
  try {
    const pool = getPool();
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    logger.info('✅ MySQL Connected via mysql2');
  } catch (error) {
    logger.error('❌ MySQL connection error:', error.message);
    logger.warn('⚠️  Running without MySQL - using MongoDB for authentication');
  }
};
