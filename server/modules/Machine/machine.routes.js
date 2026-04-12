/**
 * Machine Routes
 * Mounts machine controller methods
 */

import express from 'express';
import * as machineController from './machineController.js';

const router = express.Router();

// GET /api/machines - all machine summaries
router.get('/', machineController.getAllMachines);

// GET /api/machines/:id - single machine summary
router.get('/:id', machineController.getMachineDetail);

// GET /api/machines/:id/details - full machine state
router.get('/:id/details', machineController.getMachineState);

export default router;
