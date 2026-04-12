/**
 * Machine Model
 * Represents the state and structure of a machine
 */

class Machine {
  constructor(machineId) {
    this.machineId = machineId;
    this.status = 'OFF'; // OFF, ON, STOPPED
    this.lastPulseAt = null;
    this.stopTimer = null;
    this.totalCount = 0;
    this.currentRollCount = 0;
    this.rollsCompleted = 0;
    this.ROLL_TARGET = 500;
    this.runtime = '00:00'; // MM:SS format
    this.downtime = '00:00'; // MM:SS format
    this.runtimeSeconds = 0; // internal calculations
    this.downtimeSeconds = 0; // internal calculations
    this.activeProblems = [];
    this.alerts = [];
    this.events = [];
    this.rollWeightLog = [];
    this.downtimeLogs = [];
    this.qualityLogs = [];
    this.lastUpdated = new Date().toISOString();
  }

  /**
   * Get machine summary for API responses
   */
  getSummary() {
    const totalTime = this.runtimeSeconds + this.downtimeSeconds;
    const utilizationPercent = totalTime > 0 
      ? (this.runtimeSeconds / totalTime) * 100 
      : 0;

    return {
      machineId: this.machineId,
      status: this.status,
      totalCount: this.totalCount,
      currentRollCount: this.currentRollCount,
      rollsCompleted: this.rollsCompleted,
      runtime: this.runtime,
      downtime: this.downtime,
      runtimeSeconds: this.runtimeSeconds,
      downtimeSeconds: this.downtimeSeconds,
      utilization: Math.round(utilizationPercent * 100) / 100 || 0,
      activeProblems: this.activeProblems.length,
      unackedAlerts: this.alerts.filter(a => !a.acked).length,
      estimatedOutput: Math.round(this.totalCount * 0.95),
      faultRate: this.totalCount > 0 ? (this.qualityLogs.length / this.totalCount) * 1000 : 0,
      lastUpdated: this.lastUpdated
    };
  }

  /**
   * Convert machine state to plain object for serialization
   */
  toObject() {
    return {
      machineId: this.machineId,
      status: this.status,
      lastPulseAt: this.lastPulseAt,
      totalCount: this.totalCount,
      currentRollCount: this.currentRollCount,
      rollsCompleted: this.rollsCompleted,
      ROLL_TARGET: this.ROLL_TARGET,
      runtime: this.runtime,
      downtime: this.downtime,
      runtimeSeconds: this.runtimeSeconds,
      downtimeSeconds: this.downtimeSeconds,
      activeProblems: this.activeProblems,
      alerts: this.alerts,
      events: this.events,
      rollWeightLog: this.rollWeightLog,
      downtimeLogs: this.downtimeLogs,
      qualityLogs: this.qualityLogs,
      lastUpdated: this.lastUpdated
    };
  }

  /**
   * Create a Machine from plain object (for hydration)
   */
  static fromObject(obj) {
    const machine = new Machine(obj.machineId);
    Object.assign(machine, obj);
    return machine;
  }
}

module.exports = Machine;
