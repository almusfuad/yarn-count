/**
 * Health Controller
 * Handles HTTP requests for health checks
 */

import mongoose from 'mongoose';
import exportService from '../Export/exportService.js';
import logger from '../../utils/logger.js';

/**
 * GET /api/health/db
 * Check database connectivity and health
 */
export const checkDatabaseHealth = (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    const stateNames = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const isHealthy = state === 1;
    const status = isHealthy ? 200 : 503;

    res.status(status).json({
      service: 'database',
      healthy: isHealthy,
      state: stateNames[state],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error in checkDatabaseHealth:', error.message);
    res.status(503).json({
      service: 'database',
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/health/exports
 * Check export system health
 */
export const checkExportHealth = async (req, res) => {
  try {
    const status = await exportService.getExportStatus();

    res.status(200).json({
      service: 'exports',
      healthy: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error in checkExportHealth:', error.message);
    res.status(503).json({
      service: 'exports',
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/health
 * Overall system health check
 */
export const getOverallHealth = async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbHealthy = dbState === 1;

    const exportStatus = await exportService.getExportStatus();

    const allHealthy = dbHealthy;

    res.status(allHealthy ? 200 : 503).json({
      service: 'system',
      healthy: allHealthy,
      components: {
        database: {
          healthy: dbHealthy,
          state: dbState === 1 ? 'connected' : 'disconnected'
        },
        exports: {
          healthy: true,
          pending: exportStatus.pending,
          completed: exportStatus.completed,
          failed: exportStatus.failed
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error in getOverallHealth:', error.message);
    res.status(503).json({
      service: 'system',
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
