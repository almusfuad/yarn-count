// Dashboard KPI endpoint

const express = require('express');
const router = express.Router();
const machinesModule = require('../machines');

// GET /api/dashboard - get dashboard KPIs
router.get('/', (req, res) => {
  const kpis = machinesModule.getDashboardKPIs();
  res.json(kpis);
});

module.exports = router;
