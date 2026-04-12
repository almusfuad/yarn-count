/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard KPIs
 */

import dashboardService from './dashboardService.js';
import logger from '../../utils/logger.js';

/**
 * GET /api/dashboard
 * Get comprehensive dashboard KPIs
 */
export const getDashboard = (req, res) => {
  try {
    const metrics = dashboardService.calculateDashboardMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('❌ Error in getDashboard:', error.message);
    res.status(500).json({
      error: 'Failed to calculate dashboard metrics',
      details: error.message
    });
  }
};

/**
 * GET /api/dashboard/machine-kpis
 * Get per-machine KPI summaries
 */
export const getMachineKPIs = (req, res) => {
  try {
    const kpis = dashboardService.getMachineKPIs();
    res.json(kpis);
  } catch (error) {
    logger.error('❌ Error in getMachineKPIs:', error.message);
    res.status(500).json({ error: 'Failed to retrieve machine KPIs' });
  }
};

/**
 * GET /api/dashboard/machine/:id/kpi
 * Get KPI trend for a specific machine
 */
export const getMachineKPITrend = (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Machine ID is required' });
    }

    const trend = dashboardService.getKPITrend(id);

    if (!trend) {
      return res.status(404).json({ error: `Machine ${id} not found` });
    }

    res.json(trend);
  } catch (error) {
    logger.error('❌ Error in getMachineKPITrend:', error.message);
    res.status(500).json({ error: 'Failed to retrieve machine KPI trend' });
  }
};
