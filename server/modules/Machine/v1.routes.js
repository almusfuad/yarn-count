/**
 * Machine Routes V1
 * API v1 endpoints for machine management
 */

import express from 'express';
import * as machineController from './machineController.js';

const router = express.Router();

// GET /api/v1/machines - all machine summaries
router.get('/', machineController.getAllMachines);

// GET /api/v1/machines/:id - single machine summary
router.get('/:id', machineController.getMachineDetail);

// GET /api/v1/machines/:id/details - full machine state
router.get('/:id/details', machineController.getMachineState);

export default router;
