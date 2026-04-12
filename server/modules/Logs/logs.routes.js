/**
 * Logs Routes
 * Mounts logs controller methods for downtime and quality logging
 */

import express from 'express';
import * as logsController from './logsController.js';

const router = express.Router();

// POST /api/downtime - log downtime event
router.post('/downtime', logsController.logDowntime);

// POST /api/quality - log quality/fault event
router.post('/quality', logsController.logQuality);

// POST /api/rollweight - log roll weight
router.post('/rollweight', logsController.logRollWeight);

// POST /api/alerts/:alertId/acknowledge - acknowledge alert
router.post('/alerts/:alertId/acknowledge', logsController.acknowledgeAlert);

export default router;
