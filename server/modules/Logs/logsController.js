/**
 * Logs Controller
 * Handles HTTP requests for downtime and quality logging
 */

const machineService = require('../Machine/machineService');
const logger = require('../../utils/logger');

/**
 * POST /api/downtime
 * Log downtime event
 */
exports.logDowntime = (req, res) => {
  try {
    const { machineId, reason, remarks } = req.body;

    if (!machineId) {
      return res.status(400).json({ error: 'machineId is required' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'reason is required' });
    }

    const log = machineService.addDowntimeLog(machineId, reason, remarks || '');

    res.status(201).json({
      message: 'Downtime logged successfully',
      log
    });
  } catch (error) {
    logger.error('❌ Error in logDowntime:', error.message);
    res.status(500).json({ error: 'Failed to log downtime' });
  }
};

/**
 * POST /api/quality
 * Log quality/fault event
 */
exports.logQuality = (req, res) => {
  try {
    const { machineId, faultType, severity, description } = req.body;

    if (!machineId) {
      return res.status(400).json({ error: 'machineId is required' });
    }

    if (!faultType) {
      return res.status(400).json({ error: 'faultType is required' });
    }

    if (!severity || !['low', 'medium', 'high', 'critical'].includes(severity)) {
      return res.status(400).json({ error: 'severity must be: low, medium, high, or critical' });
    }

    const log = machineService.addQualityLog(machineId, faultType, severity, description || '');

    res.status(201).json({
      message: 'Quality log recorded successfully',
      log
    });
  } catch (error) {
    logger.error('❌ Error in logQuality:', error.message);
    res.status(500).json({ error: 'Failed to log quality event' });
  }
};

/**
 * POST /api/rollweight
 * Log roll weight measurement
 */
exports.logRollWeight = (req, res) => {
  try {
    const { machineId, weight } = req.body;

    if (!machineId) {
      return res.status(400).json({ error: 'machineId is required' });
    }

    if (typeof weight !== 'number' || weight <= 0) {
      return res.status(400).json({ error: 'weight must be a positive number' });
    }

    const log = machineService.addRollWeight(machineId, weight);

    res.status(201).json({
      message: 'Roll weight logged successfully',
      log
    });
  } catch (error) {
    logger.error('❌ Error in logRollWeight:', error.message);
    res.status(500).json({ error: 'Failed to log roll weight' });
  }
};

/**
 * POST /api/alerts/:alertId/acknowledge
 * Acknowledge an alert
 */
exports.acknowledgeAlert = (req, res) => {
  try {
    const { alertId } = req.params;
    const { machineId } = req.body;

    if (!machineId) {
      return res.status(400).json({ error: 'machineId is required' });
    }

    if (!alertId) {
      return res.status(400).json({ error: 'alertId is required' });
    }

    const acknowledged = machineService.acknowledgeAlert(machineId, alertId);

    if (!acknowledged) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ message: 'Alert acknowledged successfully' });
  } catch (error) {
    logger.error('❌ Error in acknowledgeAlert:', error.message);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
};

module.exports = exports;
