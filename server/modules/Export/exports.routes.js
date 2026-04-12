/**
 * Exports Routes
 * Mounts exports controller methods for data export management
 */

import express from 'express';
import * as exportsController from './exportsController.js';

const router = express.Router();

// POST /api/exports/trigger - trigger manual export
router.post('/trigger', exportsController.triggerExport);

// GET /api/exports/history - get export history
router.get('/history', exportsController.getExportHistory);

// GET /api/exports/:id - get export details
router.get('/:id', exportsController.getExportById);

// GET /api/exports/status - get export system status
router.get('/status', exportsController.getExportStatus);

// GET /api/exports/recent - get recent exports
router.get('/recent', exportsController.getRecentExports);

// GET /api/exports/:id/verify - verify export integrity
router.get('/:id/verify', exportsController.verifyExport);

export default router;
