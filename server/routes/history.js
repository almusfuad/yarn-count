const express = require('express');
const router = express.Router();
const { KPISnapshot, Event } = require('../db/schemas');
const { queryEvents } = require('../db/eventLogger');
const logger = require('../utils/logger');

/**
 * GET /api/history/events
 * Query raw events for a machine within a date range
 *
 * Query params:
 *   - machineId (required): Machine ID
 *   - startDate (required): ISO 8601 date string
 *   - endDate (required): ISO 8601 date string
 *   - type (optional): Event type filter
 */
router.get('/events', async (req, res) => {
  try {
    const { machineId, startDate, endDate, type } = req.query;

    if (!machineId || !startDate || !endDate) {
      return res.status(400).json({
        error: 'machineId, startDate, and endDate are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'startDate and endDate must be valid ISO 8601 dates',
      });
    }

    const events = await queryEvents(machineId, start, end, type);
    res.json({
      machineId,
      dateRange: { start: startDate, end: endDate },
      eventCount: events.length,
      events,
    });
  } catch (error) {
    logger.error(`Error querying events: ${error.message}`);
    res.status(500).json({ error: 'Failed to query events' });
  }
});

/**
 * GET /api/history/kpi-snapshot
 * Get a pre-computed KPI snapshot for a specific date
 *
 * Query params:
 *   - machineId (required): Machine ID
 *   - period (required): 'daily' or 'weekly'
 *   - date (required): ISO 8601 date string (if daily, any time; if weekly, should be Sunday)
 */
router.get('/kpi-snapshot', async (req, res) => {
  try {
    const { machineId, period, date } = req.query;

    if (!machineId || !period || !date) {
      return res.status(400).json({
        error: 'machineId, period, and date are required',
      });
    }

    if (!['daily', 'weekly'].includes(period)) {
      return res.status(400).json({
        error: 'period must be "daily" or "weekly"',
      });
    }

    const snapshotDate = new Date(date);
    if (isNaN(snapshotDate.getTime())) {
      return res.status(400).json({
        error: 'date must be a valid ISO 8601 date',
      });
    }

    // For daily snapshots, normalize to 00:00
    if (period === 'daily') {
      snapshotDate.setHours(0, 0, 0, 0);
    }
    // For weekly snapshots, normalize to the Sunday of that week
    else if (period === 'weekly') {
      const dayOfWeek = snapshotDate.getUTCDay();
      const diff = snapshotDate.getUTCDate() - dayOfWeek;
      snapshotDate.setUTCDate(diff);
      snapshotDate.setHours(0, 0, 0, 0);
    }

    const snapshot = await KPISnapshot.findOne({
      machineId,
      period,
      snapshotDate,
    }).lean();

    if (!snapshot) {
      return res.status(404).json({
        error: `No ${period} snapshot found for ${machineId} on ${date}`,
      });
    }

    res.json(snapshot);
  } catch (error) {
    logger.error(`Error fetching KPI snapshot: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch KPI snapshot' });
  }
});

/**
 * GET /api/history/kpi-range
 * Get an array of pre-computed KPI snapshots within a date range
 *
 * Query params:
 *   - machineId (required): Machine ID
 *   - period (required): 'daily' or 'weekly'
 *   - startDate (required): ISO 8601 date string
 *   - endDate (required): ISO 8601 date string
 */
router.get('/kpi-range', async (req, res) => {
  try {
    const { machineId, period, startDate, endDate } = req.query;

    if (!machineId || !period || !startDate || !endDate) {
      return res.status(400).json({
        error: 'machineId, period, startDate, and endDate are required',
      });
    }

    if (!['daily', 'weekly'].includes(period)) {
      return res.status(400).json({
        error: 'period must be "daily" or "weekly"',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'startDate and endDate must be valid ISO 8601 dates',
      });
    }

    const snapshots = await KPISnapshot.find({
      machineId,
      period,
      snapshotDate: { $gte: start, $lte: end },
    })
      .sort({ snapshotDate: -1 })
      .lean();

    res.json({
      machineId,
      period,
      dateRange: { start: startDate, end: endDate },
      snapshotCount: snapshots.length,
      snapshots,
    });
  } catch (error) {
    logger.error(`Error fetching KPI range: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch KPI range' });
  }
});

module.exports = router;
