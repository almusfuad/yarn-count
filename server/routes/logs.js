// Downtime and Quality logs endpoints

const express = require('express');
const router = express.Router();
const machinesModule = require('../machines');
const { logEvent } = require('../db/eventLogger');

// POST /api/downtime - log downtime
router.post('/downtime', (req, res) => {
  const { machineId, reason, remarks } = req.body;
  
  if (!machineId || !reason) {
    return res.status(400).json({ error: 'machineId and reason are required' });
  }
  
  const log = machinesModule.addDowntimeLog(machineId, reason, remarks || '');
  
  // Log downtime event to MongoDB (non-blocking)
  logEvent('downtime', machineId, {
    reason,
    remarks: remarks || '',
    timestamp: log.timestamp
  });
  
  res.json(log);
});

// POST /api/quality - log quality issue
router.post('/quality', (req, res) => {
  const { machineId, faultType, severity, description } = req.body;
  
  if (!machineId || !faultType) {
    return res.status(400).json({ error: 'machineId and faultType are required' });
  }
  
  const log = machinesModule.addQualityLog(
    machineId,
    faultType,
    severity || 'warning',
    description || ''
  );
  
  // Log quality event to MongoDB (non-blocking)
  logEvent('quality', machineId, {
    faultType,
    severity: severity || 'warning',
    description: description || '',
    timestamp: log.timestamp
  });
  
  res.json(log);
});

module.exports = router;
