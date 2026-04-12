/**
 * Dashboard Routes
 * Mounts dashboard controller methods
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboardController');

// GET /api/dashboard - comprehensive dashboard KPIs
router.get('/', dashboardController.getDashboard);

// GET /api/dashboard/machine-kpis - per-machine KPI summaries
router.get('/machine-kpis', dashboardController.getMachineKPIs);

// GET /api/dashboard/machine/:id/kpi - KPI trend for specific machine
router.get('/machine/:id/kpi', dashboardController.getMachineKPITrend);

module.exports = router;
