/**
 * Event/History Routes V1
 * API v1 endpoints for historical data queries
 */

import express from 'express';
import * as historyController from './historyController.js';

const router = express.Router();

// GET /api/v1/history/events - query events for a machine
router.get('/events', historyController.getEvents);

// GET /api/v1/history/events/count - get event count
router.get('/events/count', historyController.getEventCount);

// GET /api/v1/history/kpi-snapshot - get single KPI snapshot
router.get('/kpi-snapshot', historyController.getKPISnapshot);

// GET /api/v1/history/kpi-snapshots - get multiple KPI snapshots
router.get('/kpi-snapshots', historyController.getKPISnapshots);

// GET /api/v1/history/machine/:id/stats - get event statistics
router.get('/machine/:id/stats', historyController.getMachineEventStats);

export default router;
