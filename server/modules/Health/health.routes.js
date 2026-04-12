/**
 * Health Routes
 * Mounts health controller methods for system health checks
 */

const express = require('express');
const router = express.Router();
const healthController = require('./healthController');

// GET /api/health/db - check database health
router.get('/db', healthController.checkDatabaseHealth);

// GET /api/health/exports - check export system health
router.get('/exports', healthController.checkExportHealth);

// GET /api/health - overall system health
router.get('/', healthController.getOverallHealth);

module.exports = router;
