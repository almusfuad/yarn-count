/**
 * History Controller
 * Handles HTTP requests for historical data queries
 */

import eventService from './eventService.js';
import kpiRepository from './kpiRepository.js';
import logger from '../../utils/logger.js';

/**
 * GET /api/history/events
 * Query events for a machine within date range
 */
export const getEvents = async (req, res) => {
  try {
    const { machineId, startDate, endDate, type } = req.query;

    if (!machineId) {
      return res.status(400).json({ error: 'machineId is required' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    try {
      new Date(startDate);
      new Date(endDate);
    } catch {
      return res.status(400).json({ error: 'Invalid date format (use ISO 8601)' });
    }

    const events = await eventService.queryEvents(
      machineId,
      new Date(startDate),
      new Date(endDate),
      type || null
    );

    res.json({
      machineId,
      count: events.length,
      dateRange: { start: startDate, end: endDate },
      type: type || 'all',
      events
    });
  } catch (error) {
    logger.error('❌ Error in getEvents:', error.message);
    res.status(500).json({ error: 'Failed to retrieve events' });
  }
};

/**
 * GET /api/history/events/count
 * Get event count for a machine within date range
 */
export const getEventCount = async (req, res) => {
  try {
    const { machineId, startDate, endDate } = req.query;

    if (!machineId) {
      return res.status(400).json({ error: 'machineId is required' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const count = await eventService.getEventCount(
      machineId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      machineId,
      count,
      startDate,
      endDate
    });
  } catch (error) {
    logger.error('❌ Error in getEventCount:', error.message);
    res.status(500).json({ error: 'Failed to retrieve event count' });
  }
};

/**
 * GET /api/history/kpi-snapshot
 * Get KPI snapshot for a machine on a specific date
 */
export const getKPISnapshot = async (req, res) => {
  try {
    const { machineId, snapshotDate, period } = req.query;

    if (!machineId) {
      return res.status(400).json({ error: 'machineId is required' });
    }

    if (!snapshotDate) {
      return res.status(400).json({ error: 'snapshotDate is required' });
    }

    const snapshot = await kpiRepository.getSnapshot(
      machineId,
      new Date(snapshotDate),
      period || 'daily'
    );

    if (!snapshot) {
      return res.status(404).json({ error: 'KPI snapshot not found' });
    }

    res.json(snapshot);
  } catch (error) {
    logger.error('❌ Error in getKPISnapshot:', error.message);
    res.status(500).json({ error: 'Failed to retrieve KPI snapshot' });
  }
};

/**
 * GET /api/history/kpi-snapshots
 * Get KPI snapshots for a machine within date range
 */
export const getKPISnapshots = async (req, res) => {
  try {
    const { machineId, startDate, endDate, period } = req.query;

    if (!machineId) {
      return res.status(400).json({ error: 'machineId is required' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const snapshots = await kpiRepository.getSnapshotsForMachine(
      machineId,
      startDate,
      endDate,
      period || 'daily'
    );

    res.json({
      machineId,
      count: snapshots.length,
      dateRange: { start: startDate, end: endDate },
      period: period || 'daily',
      snapshots
    });
  } catch (error) {
    logger.error('❌ Error in getKPISnapshots:', error.message);
    res.status(500).json({ error: 'Failed to retrieve KPI snapshots' });
  }
};

/**
 * GET /api/history/machine/:id/stats
 * Get event statistics for a machine
 */
export const getMachineEventStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'machineId is required' });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await eventService.getMachineEventStats(id, start, end);

    if (!stats) {
      return res.status(404).json({ error: 'No statistics found' });
    }

    res.json(stats);
  } catch (error) {
    logger.error('❌ Error in getMachineEventStats:', error.message);
    res.status(500).json({ error: 'Failed to retrieve machine event stats' });
  }
};
