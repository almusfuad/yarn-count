/**
 * Dashboard Routes
 * Mounts dashboard controller methods
 */

import express from 'express';
import * as dashboardController from './dashboardController.js';

const router = express.Router();

// GET /api/dashboard - comprehensive dashboard KPIs
router.get('/', dashboardController.getDashboard);

// GET /api/dashboard/machine-kpis - per-machine KPI summaries
router.get('/machine-kpis', dashboardController.getMachineKPIs);

// GET /api/dashboard/machine/:id/kpi - KPI trend for specific machine
router.get('/machine/:id/kpi', dashboardController.getMachineKPITrend);

export default router;
