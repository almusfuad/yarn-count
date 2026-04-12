/**
 * Export Routes V1
 * API v1 endpoints for data export management
 */

import express from 'express';
import * as exportsController from './exportsController.js';

const router = express.Router();

// POST /api/v1/exports/trigger - trigger manual export
router.post('/trigger', exportsController.triggerExport);

// GET /api/v1/exports/history - get export history
router.get('/history', exportsController.getExportHistory);

// GET /api/v1/exports/:id - get export details
router.get('/:id', exportsController.getExportById);

// GET /api/v1/exports/status - get export system status
router.get('/status', exportsController.getExportStatus);

// GET /api/v1/exports/recent - get recent exports
router.get('/recent', exportsController.getRecentExports);

// POST /api/v1/exports/:id/verify - verify export integrity
router.post('/:id/verify', exportsController.verifyExport);

export default router;
