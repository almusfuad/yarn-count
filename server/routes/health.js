const express = require('express');
const router = express.Router();
const { isMongoDBConnected, getConnectionStatus } = require('../db/mongodb');
const { Export } = require('../db/schemas');
const logger = require('../utils/logger');

/**
 * GET /api/health/db
 * Check MongoDB connection status
 */
router.get('/db', (req, res) => {
  try {
    const dbStatus = getConnectionStatus();
    const statusCode = dbStatus.isConnected ? 200 : 503;

    res.status(statusCode).json({
      service: 'mongodb',
      connected: dbStatus.isConnected,
      readyState: dbStatus.readyState,
      host: dbStatus.host,
      database: dbStatus.name,
      timestamp: dbStatus.timestamp,
    });
  } catch (error) {
    logger.error(`Error checking DB health: ${error.message}`);
    res.status(503).json({
      service: 'mongodb',
      connected: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/health/exports
 * Check export system status
 */
router.get('/exports', async (req, res) => {
  try {
    const now = new Date();
    const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get recent export statistics
    const completedToday = await Export.countDocuments({
      status: 'completed',
      exportedAt: { $gte: lastDay },
    });

    const failedToday = await Export.countDocuments({
      status: 'failed',
      exportedAt: { $gte: lastDay },
    });

    const pendingExports = await Export.countDocuments({
      status: 'pending',
    });

    const lastSuccessfulExport = await Export.findOne({
      status: 'completed',
    })
      .sort({ exportedAt: -1 })
      .lean();

    // Calculate total storage used
    const storageStats = await Export.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalSize: { $sum: '$fileSize' } } },
    ]);

    const isHealthy = failedToday === 0 && lastSuccessfulExport !== null;

    res.status(isHealthy ? 200 : 503).json({
      service: 'exports',
      healthy: isHealthy,
      completedToday,
      failedToday,
      pendingExports,
      lastExportAt: lastSuccessfulExport?.exportedAt,
      lastExportMachine: lastSuccessfulExport?.machineId,
      totalStorageUsedBytes: storageStats[0]?.totalSize || 0,
      totalStorageUsedGB: (storageStats[0]?.totalSize || 0) / (1024 * 1024 * 1024),
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error(`Error checking exports health: ${error.message}`);
    res.status(503).json({
      service: 'exports',
      healthy: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/health/system
 * Overall system health check
 */
router.get('/system', async (req, res) => {
  try {
    const dbStatus = getConnectionStatus();
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const exportStats = await Export.countDocuments({
      status: 'completed',
      exportedAt: { $gte: lastWeek },
    });

    const failedExports = await Export.countDocuments({
      status: 'failed',
      exportedAt: { $gte: lastWeek },
    });

    // System is healthy if:
    // 1. MongoDB is connected
    // 2. No failed exports in the last week
    const isHealthy = dbStatus.isConnected && failedExports === 0;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: now.toISOString(),
      components: {
        mongodb: {
          status: dbStatus.isConnected ? 'up' : 'down',
          database: dbStatus.name,
          host: dbStatus.host,
        },
        exports: {
          status: failedExports === 0 ? 'up' : 'degraded',
          completedThisWeek: exportStats,
          failedThisWeek: failedExports,
        },
      },
    });
  } catch (error) {
    logger.error(`Error checking system health: ${error.message}`);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
