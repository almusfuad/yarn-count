/**
 * History Routes
 * Mounts history controller methods for querying historical data
 */

const express = require('express');
const router = express.Router();
const historyController = require('./historyController');

// GET /api/history/events - query events for a machine
router.get('/events', historyController.getEvents);

// GET /api/history/events/count - get event count
router.get('/events/count', historyController.getEventCount);

// GET /api/history/kpi-snapshot - get single KPI snapshot
router.get('/kpi-snapshot', historyController.getKPISnapshot);

// GET /api/history/kpi-snapshots - get multiple KPI snapshots
router.get('/kpi-snapshots', historyController.getKPISnapshots);

// GET /api/history/machine/:id/stats - get event statistics
router.get('/machine/:id/stats', historyController.getMachineEventStats);

module.exports = router;
