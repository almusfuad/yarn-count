// Machine API endpoints

const express = require('express');
const router = express.Router();
const machinesModule = require('../machines');

// GET /api/machines - all machine summaries
router.get('/', (req, res) => {
  const machines = machinesModule.getAllMachines();
  const summaries = machines.map(m => machinesModule.getMachineSummary(m));
  res.json(summaries);
});

// GET /api/machines/:id - single machine
router.get('/:id', (req, res) => {
  const machine = machinesModule.getMachine(req.params.id);
  if (!machine) {
    return res.status(404).json({ error: 'Machine not found' });
  }
  res.json(machinesModule.getMachineSummary(machine));
});

module.exports = router;
