/**
 * Event Model
 * Represents an event in the system
 */

export class Event {
  constructor(type, machineId, data, timestamp = null) {
    this.type = type; // pulse, status_change, problem, roll_weight, downtime, quality
    this.machineId = machineId;
    this.data = data;
    this.timestamp = timestamp || new Date().toISOString();
    this.createdAt = new Date();
  }

  /**
   * Static factory methods for specific event types
   */
  static createPulseEvent(machineId, data) {
    return new Event('pulse', machineId, {
      rotation: data.rotation,
      runtime: data.runtime,
      runtimeSeconds: data.runtimeSeconds,
      totalCount: data.totalCount,
      rollsCompleted: data.rollsCompleted,
      currentRollCount: data.currentRollCount,
      timestamp: data.timestamp
    });
  }

  static createStatusChangeEvent(machineId, data) {
    return new Event('status_change', machineId, {
      newStatus: data.newStatus,
      oldStatus: data.oldStatus,
      runtime: data.runtime,
      downtime: data.downtime,
      timestamp: data.timestamp
    });
  }

  static createProblemEvent(machineId, data) {
    return new Event('problem', machineId, {
      problemType: data.problemType,
      downtime: data.downtime,
      downtimeSeconds: data.downtimeSeconds,
      severity: data.severity,
      timestamp: data.timestamp
    });
  }

  static createRollWeightEvent(machineId, data) {
    return new Event('roll_weight', machineId, {
      weight: data.weight,
      rollNumber: data.rollNumber,
      timestamp: data.timestamp
    });
  }

  static createDowntimeLogEvent(machineId, data) {
    return new Event('downtime', machineId, {
      reason: data.reason,
      remarks: data.remarks,
      timestamp: data.timestamp
    });
  }

  static createQualityLogEvent(machineId, data) {
    return new Event('quality', machineId, {
      faultType: data.faultType,
      severity: data.severity,
      description: data.description,
      timestamp: data.timestamp
    });
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON() {
    return {
      type: this.type,
      machineId: this.machineId,
      data: this.data,
      timestamp: this.timestamp,
      createdAt: this.createdAt
    };
  }
}
