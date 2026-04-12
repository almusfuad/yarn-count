/**
 * Health Routes
 * Mounts health controller methods for system health checks
 */

import express from 'express';
import * as healthController from './healthController.js';

const router = express.Router();

// GET /api/health/db - check database health
router.get('/db', healthController.checkDatabaseHealth);

// GET /api/health/exports - check export system health
router.get('/exports', healthController.checkExportHealth);

// GET /api/health - overall system health
router.get('/', healthController.getOverallHealth);

export default router;
