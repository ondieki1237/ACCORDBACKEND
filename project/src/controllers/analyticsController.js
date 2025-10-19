import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { statSync, existsSync } from 'fs';
import logger from '../utils/logger.js';

const execAsync = promisify(exec);

// Cache for analytics data
let analyticsCache = {
  lastUpdated: null,
  data: null,
  isGenerating: false
};

/**
 * Run Python analytics script and get results
 */
const runPythonAnalytics = async (daysBack = 30) => {
  const analyticsPath = path.join(process.cwd(), '..', 'analytics');
  const pythonPath = path.join(analyticsPath, 'venv', 'bin', 'python');
  const scriptPath = path.join(analyticsPath, 'main.py');

  try {
    logger.info(`Running analytics for last ${daysBack} days...`);
    
    // Run Python script
    const { stdout, stderr } = await execAsync(
      `cd ${analyticsPath} && ${pythonPath} ${scriptPath} ${daysBack}`,
      { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
    );

    if (stderr) {
      logger.warn('Analytics stderr:', stderr);
    }

    logger.info('Analytics generation completed');
    return { success: true, output: stdout };
  } catch (error) {
    logger.error('Error running analytics:', error);
    throw error;
  }
};

/**
 * Generate analytics data from Python script
 */
export const generateAnalytics = async (req, res) => {
  try {
    const { daysBack = 30 } = req.query;

    if (analyticsCache.isGenerating) {
      return res.status(409).json({
        success: false,
        message: 'Analytics generation already in progress'
      });
    }

    analyticsCache.isGenerating = true;

    // Run analytics in background
    runPythonAnalytics(daysBack)
      .then(() => {
        analyticsCache.lastUpdated = new Date();
        analyticsCache.isGenerating = false;
      })
      .catch((error) => {
        logger.error('Background analytics error:', error);
        analyticsCache.isGenerating = false;
      });

    res.json({
      success: true,
      message: 'Analytics generation started',
      status: 'processing'
    });
  } catch (error) {
    analyticsCache.isGenerating = false;
    logger.error('Generate analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics'
    });
  }
};

/**
 * Get analytics status
 */
export const getAnalyticsStatus = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        lastUpdated: analyticsCache.lastUpdated,
        isGenerating: analyticsCache.isGenerating,
        hasData: analyticsCache.data !== null
      }
    });
  } catch (error) {
    logger.error('Get analytics status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics status'
    });
  }
};

/**
 * Get latest Excel report
 */
export const getLatestReport = async (req, res) => {
  try {
    const reportsPath = path.join(process.cwd(), '..', 'analytics', 'reports');
    
    // Check if reports directory exists
    try {
      await fs.access(reportsPath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'No reports available yet'
      });
    }

    // Get all Excel files
    const files = await fs.readdir(reportsPath);
    const excelFiles = files
      .filter(file => file.endsWith('.xlsx'))
      .map(file => ({
        name: file,
        path: path.join(reportsPath, file)
      }));

    if (excelFiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No Excel reports found'
      });
    }

    // Get the latest file by name (contains timestamp)
    excelFiles.sort((a, b) => b.name.localeCompare(a.name));
    const latestFile = excelFiles[0];

    // Send file
    res.download(latestFile.path, latestFile.name);
  } catch (error) {
    logger.error('Get latest report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get latest report'
    });
  }
};

/**
 * Get list of available visualizations
 */
export const getVisualizations = async (req, res) => {
  try {
    const reportsPath = path.join(process.cwd(), '..', 'analytics', 'reports');
    
    // Check if reports directory exists
    try {
      await fs.access(reportsPath);
    } catch {
      return res.json({
        success: true,
        data: []
      });
    }

    const files = await fs.readdir(reportsPath);
    
    // Categorize files
    const visualizations = files.map(file => {
      const filePath = path.join(reportsPath, file);
      const stats = statSync(filePath);
      
      let type = 'other';
      if (file.endsWith('.png')) type = 'image';
      else if (file.endsWith('.html')) type = 'html';
      else if (file.endsWith('.xlsx')) type = 'excel';

      return {
        name: file,
        type,
        size: stats.size,
        createdAt: stats.birthtime,
        url: `/api/analytics/files/${encodeURIComponent(file)}`
      };
    });

    // Sort by creation date (newest first)
    visualizations.sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      data: visualizations
    });
  } catch (error) {
    logger.error('Get visualizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get visualizations'
    });
  }
};

/**
 * Serve a specific file
 */
export const getFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const reportsPath = path.join(process.cwd(), '..', 'analytics', 'reports');
    const filePath = path.join(reportsPath, filename);

    // Security check - ensure file is within reports directory
    const realPath = await fs.realpath(filePath);
    const realReportsPath = await fs.realpath(reportsPath);
    
    if (!realPath.startsWith(realReportsPath)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check file exists
    await fs.access(filePath);

    // Send file with appropriate content type
    if (filename.endsWith('.png')) {
      res.contentType('image/png');
    } else if (filename.endsWith('.html')) {
      res.contentType('text/html');
    } else if (filename.endsWith('.xlsx')) {
      res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    res.sendFile(filePath);
  } catch (error) {
    logger.error('Get file error:', error);
    res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }
};

/**
 * Get dashboard data (latest HTML dashboard)
 */
export const getDashboard = async (req, res) => {
  try {
    const reportsPath = path.join(process.cwd(), '..', 'analytics', 'reports');
    
    const files = await fs.readdir(reportsPath);
    const dashboards = files
      .filter(file => file.startsWith('dashboard_') && file.endsWith('.html'))
      .sort()
      .reverse();

    if (dashboards.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No dashboard available yet. Generate analytics first.'
      });
    }

    const dashboardPath = path.join(reportsPath, dashboards[0]);
    const dashboardContent = await fs.readFile(dashboardPath, 'utf-8');

    res.send(dashboardContent);
  } catch (error) {
    logger.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard'
    });
  }
};

/**
 * Delete old reports (cleanup)
 */
export const cleanupOldReports = async (req, res) => {
  try {
    const { daysOld = 30 } = req.query;
    const reportsPath = path.join(process.cwd(), '..', 'analytics', 'reports');
    
    const files = await fs.readdir(reportsPath);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(reportsPath, file);
      const stats = statSync(filePath);

      if (stats.birthtime < cutoffDate) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    res.json({
      success: true,
      message: `Deleted ${deletedCount} old report(s)`,
      deletedCount
    });
  } catch (error) {
    logger.error('Cleanup old reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old reports'
    });
  }
};
