/**
 * Machine Routes
 * Mounts machine controller methods
 */

const express = require('express');
const router = express.Router();
const machineController = require('./machineController');

// GET /api/machines - all machine summaries
router.get('/', machineController.getAllMachines);

// GET /api/machines/:id - single machine summary
router.get('/:id', machineController.getMachineDetail);

// GET /api/machines/:id/details - full machine state
router.get('/:id/details', machineController.getMachineState);

module.exports = router;
