/**
 * Machine Service
 * Core business logic for machine state management, status handling, and KPI calculations
 */

import { Machine } from './Machine.model.js';
import eventRepository from '../Event/eventRepository.js';
import logger from '../../utils/logger.js';

class MachineService {
  constructor() {
    this.machines = new Map(); // In-memory machine state
    this.broadcastFn = null;
  }

  /**
   * Initialize broadcast function (for WebSocket updates)
   */
  setBroadcast(fn) {
    this.broadcastFn = fn;
  }

  /**
   * Helper: Parse MM:SS format to seconds
   */
  parseMMSS(str) {
    if (!str) return 0;
    const parts = str.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      return minutes * 60 + seconds;
    }
    return 0;
  }

  /**
   * Get or create machine state
   */
  getOrCreateMachine(machineId) {
    if (!this.machines.has(machineId)) {
      this.machines.set(machineId, new Machine(machineId));
    }
    return this.machines.get(machineId);
  }

  /**
   * Handle incoming machine status update from MQTT
   */
  handleMachineStatus(machineId, payload) {
    const machine = this.getOrCreateMachine(machineId);
    const { Status, RT, DT, Timestamp } = payload;

    logger.info(`[HANDLERS] Machine Status - Machine: ${machineId}`);
    logger.info(`  Incoming: Status=${Status}, RT=${RT}, DT=${DT}, Timestamp=${Timestamp}`);

    machine.status = Status === 'ON' ? 'ON' : Status === 'OFF' ? 'OFF' : 'STOPPED';
    machine.runtime = RT || '00:00';
    machine.downtime = DT || '00:00';
    machine.runtimeSeconds = this.parseMMSS(RT);
    machine.downtimeSeconds = this.parseMMSS(DT);
    machine.lastUpdated = Timestamp || new Date().toISOString();

    logger.info(`  Stored: runtime=${machine.runtime} (${machine.runtimeSeconds}s), downtime=${machine.downtime} (${machine.downtimeSeconds}s)`);

    if (machine.stopTimer) clearTimeout(machine.stopTimer);

    // Broadcast update to WebSocket clients
    this.broadcastFn?.('machine_update', {
      machineId,
      status: machine.status,
      runtime: machine.runtime,
      downtime: machine.downtime
    });

    // Log status change event to MongoDB (non-blocking)
    eventRepository.logEvent('status_change', machineId, {
      newStatus: machine.status,
      runtime: machine.runtime,
      downtime: machine.downtime,
      timestamp: machine.lastUpdated
    });
  }

  /**
   * Handle incoming raw pulse data from MQTT
   */
  handleRawData(machineId, payload) {
    const machine = this.getOrCreateMachine(machineId);
    const { Rotation, RT, Timestamp } = payload;

    logger.info(`[HANDLERS] Raw Data - Machine: ${machineId}`);
    logger.info(`  Incoming: Rotation=${Rotation}, RT=${RT}, Timestamp=${Timestamp}`);

    if (machine.stopTimer) clearTimeout(machine.stopTimer);

    machine.lastPulseAt = Timestamp || new Date().toISOString();
    machine.status = 'ON';
    machine.runtime = RT || '00:00';
    machine.runtimeSeconds = this.parseMMSS(RT);

    logger.info(`  Stored: runtime=${machine.runtime} (${machine.runtimeSeconds}s)`);

    if (Rotation > 0) {
      machine.totalCount = Rotation;

      // Calculate rolls completed and current progress
      machine.rollsCompleted = Math.floor(machine.totalCount / machine.ROLL_TARGET);
      machine.currentRollCount = machine.totalCount % machine.ROLL_TARGET;

      logger.info(`  Count Updated: totalCount=${machine.totalCount}, rollsCompleted=${machine.rollsCompleted}, currentRollCount=${machine.currentRollCount}`);

      // Check if we just completed a new roll
      if (machine.currentRollCount === 0 && machine.totalCount > 0) {
        logger.info(`  🎯 ROLL COMPLETE: Roll #${machine.rollsCompleted} completed!`);

        this.broadcastFn?.('event', {
          machineId,
          type: 'ROLL_COMPLETE',
          message: `Roll ${machine.rollsCompleted} completed`,
          timestamp: machine.lastPulseAt
        });
      }
    }

    // Stop detection: set timer for 4 seconds
    machine.stopTimer = setTimeout(() => {
      machine.status = 'STOPPED';
      machine.stopTimer = null;
      logger.info(`[HANDLERS] Machine ${machineId} status changed to STOPPED (no pulse for 4s)`);
      this.broadcastFn?.('machine_update', {
        machineId,
        status: 'STOPPED'
      });
    }, 4000);

    this.broadcastFn?.('machine_update', {
      machineId,
      totalCount: machine.totalCount,
      currentRollCount: machine.currentRollCount,
      status: 'ON'
    });

    // Log pulse event to MongoDB (non-blocking)
    eventRepository.logEvent('pulse', machineId, {
      rotation: Rotation,
      runtime: machine.runtime,
      runtimeSeconds: machine.runtimeSeconds,
      totalCount: machine.totalCount,
      rollsCompleted: machine.rollsCompleted,
      currentRollCount: machine.currentRollCount,
      timestamp: machine.lastPulseAt
    });
  }

  /**
   * Handle incoming problem alert from MQTT
   */
  handleProblem(machineId, payload) {
    const machine = this.getOrCreateMachine(machineId);
    const { Problem, Downtime, Timestamp } = payload;

    logger.info(`[HANDLERS] Problem Alert - Machine: ${machineId}`);
    logger.info(`  Incoming: Problem=${Problem}, Downtime=${Downtime}, Timestamp=${Timestamp}`);

    const problemId = `${machineId}-${Date.now()}`;
    const downtimeSeconds = this.parseMMSS(Downtime);
    const problem = {
      id: problemId,
      machineId,
      type: Problem,
      downtime: Downtime,
      downtimeSeconds: downtimeSeconds,
      timestamp: Timestamp || new Date().toISOString(),
      acked: false
    };

    logger.info(`  Stored: downtime=${Downtime} (${downtimeSeconds}s)`);

    machine.activeProblems.push(problem);
    machine.alerts.push(problem);

    const severity = Problem.includes('breakage') || Problem.includes('failure') ? 'critical' : 'warning';
    logger.info(`  Alert ID: ${problemId}, Severity: ${severity}`);

    this.broadcastFn?.('alert', {
      ...problem,
      severity
    });

    // Log problem event to MongoDB (non-blocking)
    eventRepository.logEvent('problem', machineId, {
      problemType: Problem,
      downtime: Downtime,
      downtimeSeconds: downtimeSeconds,
      severity,
      timestamp: problem.timestamp
    });
  }

  /**
   * Add manual roll weight log
   */
  addRollWeight(machineId, weight) {
    const machine = this.getOrCreateMachine(machineId);
    const entry = {
      weight,
      timestamp: new Date().toISOString(),
      rollNumber: machine.rollsCompleted
    };
    machine.rollWeightLog.push(entry);

    // Log to MongoDB
    eventRepository.logEvent('roll_weight', machineId, {
      weight,
      rollNumber: machine.rollsCompleted,
      timestamp: entry.timestamp
    });

    return entry;
  }

  /**
   * Add downtime log
   */
  addDowntimeLog(machineId, reason, remarks) {
    const machine = this.getOrCreateMachine(machineId);
    const log = {
      id: `dt-${machineId}-${Date.now()}`,
      reason,
      remarks,
      timestamp: new Date().toISOString()
    };
    machine.downtimeLogs.push(log);

    // Log to MongoDB
    eventRepository.logEvent('downtime', machineId, {
      reason,
      remarks,
      timestamp: log.timestamp
    });

    return log;
  }

  /**
   * Add quality log (fault/defect)
   */
  addQualityLog(machineId, faultType, severity, description) {
    const machine = this.getOrCreateMachine(machineId);
    const log = {
      id: `qc-${machineId}-${Date.now()}`,
      faultType,
      severity,
      description,
      timestamp: new Date().toISOString()
    };
    machine.qualityLogs.push(log);

    // Log to MongoDB
    eventRepository.logEvent('quality', machineId, {
      faultType,
      severity,
      description,
      timestamp: log.timestamp
    });

    return log;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(machineId, alertId) {
    const machine = this.getMachine(machineId);
    if (machine) {
      const alert = machine.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acked = true;
        const idx = machine.activeProblems.findIndex(p => p.id === alertId);
        if (idx > -1) {
          machine.activeProblems.splice(idx, 1);
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Get machine summary for API responses
   */
  getMachineSummary(machineId) {
    const machine = this.getMachine(machineId);
    return machine ? machine.getSummary() : null;
  }

  /**
   * Get specific machine
   */
  getMachine(machineId) {
    return this.machines.get(machineId);
  }

  /**
   * Get all machines
   */
  getAllMachines() {
    return Array.from(this.machines.values());
  }

  /**
   * Get all machine summaries
   */
  getAllMachineSummaries() {
    return Array.from(this.machines.values()).map(m => m.getSummary());
  }
}

export default new MachineService();
