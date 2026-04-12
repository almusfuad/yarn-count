/**
 * Health Routes V1
 * API v1 endpoints for system health checks
 */

import express from 'express';
import * as healthController from './healthController.js';

const router = express.Router();

// GET /api/v1/health/db - check database health
router.get('/db', healthController.checkDatabaseHealth);

// GET /api/v1/health/exports - check export system health
router.get('/exports', healthController.checkExportHealth);

// GET /api/v1/health - overall system health
router.get('/', healthController.getOverallHealth);

export default router;
