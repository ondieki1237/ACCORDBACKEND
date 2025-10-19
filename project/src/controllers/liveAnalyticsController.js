/**
 * Live Analytics Proxy Controller
 * Forwards requests to Python Flask API server
 */

import axios from 'axios';
import logger from '../utils/logger.js';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5001';

/**
 * Get live summary statistics
 */
export const getLiveSummary = async (req, res) => {
  try {
    const { daysBack = 30 } = req.query;
    
    const response = await axios.get(`${PYTHON_API_URL}/api/analytics/live/summary`, {
      params: { daysBack },
      timeout: 30000 // 30 second timeout
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching live summary:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to fetch live analytics summary',
      error: error.message
    });
  }
};

/**
 * Get live conversion funnel
 */
export const getLiveConversion = async (req, res) => {
  try {
    const { daysBack = 30 } = req.query;
    
    const response = await axios.get(`${PYTHON_API_URL}/api/analytics/live/conversion`, {
      params: { daysBack },
      timeout: 30000
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching live conversion:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to fetch conversion data',
      error: error.message
    });
  }
};

/**
 * Get live regional performance
 */
export const getLiveRegional = async (req, res) => {
  try {
    const { daysBack = 30 } = req.query;
    
    const response = await axios.get(`${PYTHON_API_URL}/api/analytics/live/regional`, {
      params: { daysBack },
      timeout: 30000
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching regional data:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to fetch regional performance',
      error: error.message
    });
  }
};

/**
 * Get live top performers
 */
export const getLiveTopPerformers = async (req, res) => {
  try {
    const { daysBack = 30, topN = 10 } = req.query;
    
    const response = await axios.get(`${PYTHON_API_URL}/api/analytics/live/top-performers`, {
      params: { daysBack, topN },
      timeout: 30000
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching top performers:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to fetch top performers',
      error: error.message
    });
  }
};

/**
 * Get live predictions
 */
export const getLivePredictions = async (req, res) => {
  try {
    const { daysBack = 90 } = req.query;
    
    const response = await axios.get(`${PYTHON_API_URL}/api/analytics/live/predictions`, {
      params: { daysBack },
      timeout: 60000 // 60 seconds for ML predictions
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching predictions:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to fetch predictions',
      error: error.message
    });
  }
};

/**
 * Get complete live dashboard
 */
export const getLiveDashboard = async (req, res) => {
  try {
    const { daysBack = 30 } = req.query;
    
    const response = await axios.get(`${PYTHON_API_URL}/api/analytics/live/dashboard`, {
      params: { daysBack },
      timeout: 60000
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching live dashboard:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to fetch live dashboard',
      error: error.message
    });
  }
};

/**
 * Get real-time statistics (today's data)
 */
export const getRealtimeStats = async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_API_URL}/api/analytics/live/realtime-stats`, {
      timeout: 10000 // Quick query
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching realtime stats:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to fetch real-time statistics',
      error: error.message
    });
  }
};

/**
 * Get live chart
 */
export const getLiveChart = async (req, res) => {
  try {
    const { chartType } = req.params;
    const { daysBack = 30 } = req.query;
    
    const response = await axios.get(
      `${PYTHON_API_URL}/api/analytics/live/chart/${chartType}`,
      {
        params: { daysBack },
        timeout: 60000,
        responseType: 'arraybuffer'
      }
    );
    
    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    logger.error('Error fetching live chart:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to fetch chart',
      error: error.message
    });
  }
};

/**
 * Get user activity
 */
export const getUsersActivity = async (req, res) => {
  try {
    const { daysBack = 7 } = req.query;
    
    const response = await axios.get(`${PYTHON_API_URL}/api/analytics/live/users-activity`, {
      params: { daysBack },
      timeout: 30000
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching user activity:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to fetch user activity',
      error: error.message
    });
  }
};

/**
 * Check Python API health
 */
export const checkPythonHealth = async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_API_URL}/health`, {
      timeout: 5000
    });
    
    res.json({
      success: true,
      pythonApi: response.data,
      nodeApi: {
        status: 'healthy',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Python API health check failed:', error.message);
    res.status(503).json({
      success: false,
      message: 'Python analytics service is unavailable',
      error: error.message,
      nodeApi: {
        status: 'healthy',
        timestamp: new Date().toISOString()
      }
    });
  }
};
