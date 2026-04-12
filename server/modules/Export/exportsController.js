/**
 * Exports Controller
 * Handles HTTP requests for data exports
 */

import exportService from './exportService.js';
import logger from '../../utils/logger.js';

/**
 * POST /api/exports/trigger
 * Trigger a manual data export
 */
export const triggerExport = async (req, res) => {
  try {
    const { machineId, startDate, endDate } = req.body;

    if (!machineId) {
      return res.status(400).json({ error: 'machineId is required' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const result = await exportService.triggerExport(machineId, startDate, endDate);

    res.status(202).json(result);
  } catch (error) {
    logger.error('❌ Error in triggerExport:', error.message);
    res.status(500).json({ error: 'Failed to trigger export' });
  }
};

/**
 * GET /api/exports/history
 * Get export history with pagination
 */
export const getExportHistory = async (req, res) => {
  try {
    const { machineId, limit = 10, offset = 0 } = req.query;

    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const offsetNum = Math.max(parseInt(offset, 10) || 0, 0);

    const result = await exportService.getExportHistory(
      machineId || null,
      limitNum,
      offsetNum
    );

    res.json(result);
  } catch (error) {
    logger.error('❌ Error in getExportHistory:', error.message);
    res.status(500).json({ error: 'Failed to retrieve export history' });
  }
};

/**
 * GET /api/exports/:id
 * Get specific export details
 */
export const getExportById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Export ID is required' });
    }

    const exportRecord = await exportService.getExportById(id);

    if (!exportRecord) {
      return res.status(404).json({ error: 'Export not found' });
    }

    res.json(exportRecord);
  } catch (error) {
    logger.error('❌ Error in getExportById:', error.message);
    res.status(500).json({ error: 'Failed to retrieve export' });
  }
};

/**
 * GET /api/exports/status
 * Get export system status
 */
export const getExportStatus = async (req, res) => {
  try {
    const status = await exportService.getExportStatus();
    res.json(status);
  } catch (error) {
    logger.error('❌ Error in getExportStatus:', error.message);
    res.status(500).json({ error: 'Failed to retrieve export status' });
  }
};

/**
 * GET /api/exports/recent
 * Get recent exports
 */
export const getRecentExports = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);

    const exports = await exportService.getRecentExports(limitNum);
    res.json(exports);
  } catch (error) {
    logger.error('❌ Error in getRecentExports:', error.message);
    res.status(500).json({ error: 'Failed to retrieve recent exports' });
  }
};

/**
 * GET /api/exports/:id/verify
 * Verify export data integrity
 */
export const verifyExport = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Export ID is required' });
    }

    const result = await exportService.verifyExport(id);
    res.json(result);
  } catch (error) {
    logger.error('❌ Error in verifyExport:', error.message);
    res.status(500).json({ error: 'Failed to verify export' });
  }
};
