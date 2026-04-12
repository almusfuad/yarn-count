/**
 * Logs Routes V1
 * API v1 endpoints for logging downtime, quality, roll weight, and alerts
 * NOTE: /roll-weight endpoint uses kebab-case (standardized naming)
 */

import express from 'express';
import * as logsController from './logsController.js';

const router = express.Router();

// POST /api/v1/downtime - log downtime event
router.post('/downtime', logsController.logDowntime);

// POST /api/v1/quality - log quality/fault event
router.post('/quality', logsController.logQuality);

// POST /api/v1/roll-weight - log roll weight (standardized endpoint name with hyphen)
router.post('/roll-weight', logsController.logRollWeight);

// POST /api/v1/alerts/:alertId/acknowledge - acknowledge alert
router.post('/alerts/:alertId/acknowledge', logsController.acknowledgeAlert);

export default router;
