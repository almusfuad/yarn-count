const express = require('express');
const router = express.Router();
const { Export } = require('../db/schemas');
const { triggerManualExport } = require('../jobs/dataExporter');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * POST /api/exports/trigger
 * Manually trigger a data export for a specific date range
 *
 * Body:
 *   - startDate (required): ISO 8601 date string
 *   - endDate (required): ISO 8601 date string
 *   - machineId (optional): Specific machine ID to export
 */
router.post('/trigger', async (req, res) => {
  try {
    const { startDate, endDate, machineId } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'startDate and endDate must be valid ISO 8601 dates',
      });
    }

    logger.info(
      `Manual export triggered for range ${startDate} to ${endDate}` +
        (machineId ? ` (machine: ${machineId})` : '')
    );

    const result = await triggerManualExport(start, end, machineId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Export triggered successfully',
        filesCreated: result.files,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    logger.error(`Error triggering manual export: ${error.message}`);
    res.status(500).json({ error: 'Failed to trigger export' });
  }
});

/**
 * GET /api/exports/history
 * View past exports with metadata and status
 *
 * Query params:
 *   - machineId (optional): Filter by specific machine
 *   - status (optional): Filter by status ('pending', 'completed', 'failed')
 *   - limit (optional): Max results (default: 50)
 *   - offset (optional): Pagination offset (default: 0)
 */
router.get('/history', async (req, res) => {
  try {
    const { machineId, status, limit = 50, offset = 0 } = req.query;

    const query = {};
    if (machineId) {
      query.machineId = machineId;
    }
    if (status && ['pending', 'completed', 'failed'].includes(status)) {
      query.status = status;
    }

    const exports = await Export.find(query)
      .sort({ exportedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    const total = await Export.countDocuments(query);

    res.json({
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      exportCount: exports.length,
      exports: exports.map((exp) => ({
        ...exp,
        downloadUrl: exp.status === 'completed' ? `/api/exports/download/${exp._id}` : null,
      })),
    });
  } catch (error) {
    logger.error(`Error fetching export history: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch export history' });
  }
});

/**
 * GET /api/exports/download/:exportId
 * Download an export file
 */
router.get('/download/:exportId', async (req, res) => {
  try {
    const { exportId } = req.params;

    const exportRecord = await Export.findById(exportId).lean();

    if (!exportRecord) {
      return res.status(404).json({ error: 'Export not found' });
    }

    if (exportRecord.status !== 'completed') {
      return res.status(400).json({
        error: `Cannot download export with status: ${exportRecord.status}`,
      });
    }

    if (!fs.existsSync(exportRecord.exportPath)) {
      return res.status(404).json({ error: 'Export file not found on disk' });
    }

    // Verify checksum before sending
    const fileContent = fs.readFileSync(exportRecord.exportPath, 'utf8');
    const crypto = require('crypto');
    const checksum = crypto
      .createHash('sha256')
      .update(fileContent)
      .digest('hex');

    if (checksum !== exportRecord.checksum) {
      logger.error(`Checksum mismatch for export ${exportId}`);
      return res.status(500).json({ error: 'Export file integrity check failed' });
    }

    const filename = path.basename(exportRecord.exportPath);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    res.send(fileContent);
  } catch (error) {
    logger.error(`Error downloading export: ${error.message}`);
    res.status(500).json({ error: 'Failed to download export' });
  }
});

/**
 * GET /api/exports/status
 * Get overall export system status and statistics
 */
router.get('/status', async (req, res) => {
  try {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const completed = await Export.countDocuments({
      status: 'completed',
      exportedAt: { $gte: lastWeek },
    });

    const failed = await Export.countDocuments({
      status: 'failed',
      exportedAt: { $gte: lastWeek },
    });

    const totalSize = await Export.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalSize: { $sum: '$fileSize' } } },
    ]);

    const lastExport = await Export.findOne({
      status: 'completed',
    })
      .sort({ exportedAt: -1 })
      .lean();

    res.json({
      status: 'ok',
      lastExportedAt: lastExport?.exportedAt,
      lastExportMachine: lastExport?.machineId,
      completedThisWeek: completed,
      failedThisWeek: failed,
      totalStorageUsedBytes: totalSize[0]?.totalSize || 0,
      totalStorageUsedGB: (totalSize[0]?.totalSize || 0) / (1024 * 1024 * 1024),
    });
  } catch (error) {
    logger.error(`Error fetching export status: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch export status' });
  }
});

module.exports = router;
