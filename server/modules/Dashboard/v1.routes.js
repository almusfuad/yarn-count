/**
 * Dashboard Routes V1
 * API v1 endpoints for dashboard operations
 */

import express from 'express';
import * as dashboardController from './dashboardController.js';

const router = express.Router();

// GET /api/v1/dashboard - comprehensive dashboard KPIs
router.get('/', dashboardController.getDashboard);

// GET /api/v1/dashboard/machine-kpis - per-machine KPI summaries
router.get('/machine-kpis', dashboardController.getMachineKPIs);

// GET /api/v1/dashboard/machine/:id/kpi - KPI trend for specific machine
router.get('/machine/:id/kpi', dashboardController.getMachineKPITrend);

export default router;
