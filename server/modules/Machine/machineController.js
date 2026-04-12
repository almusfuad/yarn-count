/**
 * Machine Controller
 * Handles HTTP requests related to machines
 */

const machineService = require('./machineService');
const logger = require('../../utils/logger');

/**
 * GET /api/machines
 * Get all machines with their current status
 */
exports.getAllMachines = (req, res) => {
  try {
    const machines = machineService.getAllMachineSummaries();
    res.json(machines);
  } catch (error) {
    logger.error('❌ Error in getAllMachines:', error.message);
    res.status(500).json({ error: 'Failed to retrieve machines' });
  }
};

/**
 * GET /api/machines/:id
 * Get specific machine details
 */
exports.getMachineDetail = (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Machine ID is required' });
    }

    const machine = machineService.getMachineSummary(id);

    if (!machine) {
      return res.status(404).json({ error: `Machine ${id} not found` });
    }

    res.json(machine);
  } catch (error) {
    logger.error('❌ Error in getMachineDetail:', error.message);
    res.status(500).json({ error: 'Failed to retrieve machine' });
  }
};

/**
 * GET /api/machines/:id/details
 * Get full machine state (more detailed than summary)
 */
exports.getMachineState = (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Machine ID is required' });
    }

    const machine = machineService.getMachine(id);

    if (!machine) {
      return res.status(404).json({ error: `Machine ${id} not found` });
    }

    res.json(machine.toObject());
  } catch (error) {
    logger.error('❌ Error in getMachineState:', error.message);
    res.status(500).json({ error: 'Failed to retrieve machine state' });
  }
};

module.exports = exports;
