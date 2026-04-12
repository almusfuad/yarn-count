/**
 * Dashboard Service
 * Aggregates KPI metrics across all machines
 */

const machineService = require('../Machine/machineService');
const logger = require('../../utils/logger');

class DashboardService {
  /**
   * Calculate comprehensive dashboard KPIs
   */
  calculateDashboardMetrics() {
    try {
      const machines_array = machineService.getAllMachines();

      const totalCount = machines_array.reduce((sum, m) => sum + m.totalCount, 0);
      const totalRolls = machines_array.reduce((sum, m) => sum + m.rollsCompleted, 0);
      const totalDowntimeSeconds = machines_array.reduce((sum, m) => sum + m.downtimeSeconds, 0);
      const totalRuntimeSeconds = machines_array.reduce((sum, m) => sum + m.runtimeSeconds, 0);
      const totalMachines = machines_array.length;
      const activeMachines = machines_array.filter(m => m.status === 'ON').length;
      const totalFaults = machines_array.reduce((sum, m) => sum + m.qualityLogs.length, 0);
      const criticalFaults = machines_array.reduce(
        (sum, m) => sum + m.qualityLogs.filter(q => q.severity === 'critical').length,
        0
      );

      // Calculate total kg from all roll weight logs
      const totalKg = machines_array.reduce((sum, m) => {
        return sum + m.rollWeightLog.reduce((s, r) => s + (r.weight || 0), 0);
      }, 0);

      // Build roll history: combine rollWeightLog across machines
      const rollHistory = [];
      machines_array.forEach((m) => {
        for (let i = 1; i <= m.rollsCompleted; i++) {
          const weightEntry = m.rollWeightLog.find((r) => r.rollNumber === i);
          rollHistory.push({
            rollNumber: i,
            machineId: m.machineId,
            count: m.ROLL_TARGET,
            weight: weightEntry ? weightEntry.weight : null,
            completedAt: weightEntry ? weightEntry.timestamp : null,
            weighed: !!weightEntry
          });
        }
      });
      rollHistory.sort((a, b) => b.rollNumber - a.rollNumber); // newest first

      // Aggregate quality logs from all machines
      const qualityLogs = machines_array
        .flatMap((m) => m.qualityLogs.map((q) => ({ ...q, machineId: m.machineId })))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 50);

      const utilization =
        totalRuntimeSeconds + totalDowntimeSeconds > 0
          ? (totalRuntimeSeconds / (totalRuntimeSeconds + totalDowntimeSeconds)) * 100
          : 0;
      const estimatedOutput = Math.round(totalCount * 0.95);
      const faultRate = totalCount > 0 ? (totalFaults / totalCount) * 1000 : 0;

      return {
        totalMachines,
        activeMachines,
        totalCount,
        totalRolls,
        totalDowntimeSeconds,
        totalRuntimeSeconds,
        totalKg: Math.round(totalKg * 100) / 100,
        totalFaults,
        criticalFaults,
        rollHistory,
        qualityLogs,
        utilization: Math.round(utilization * 100) / 100,
        estimatedOutput,
        faultRate: Math.round(faultRate * 100) / 100,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ Error calculating dashboard metrics:', error.message);
      return {
        totalMachines: 0,
        activeMachines: 0,
        totalCount: 0,
        totalRolls: 0,
        totalDowntimeSeconds: 0,
        totalRuntimeSeconds: 0,
        totalKg: 0,
        totalFaults: 0,
        criticalFaults: 0,
        rollHistory: [],
        qualityLogs: [],
        utilization: 0,
        estimatedOutput: 0,
        faultRate: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get KPI trend data for a machine
   */
  getKPITrend(machineId) {
    try {
      const machine = machineService.getMachine(machineId);
      if (!machine) {
        return null;
      }

      const totalTime = machine.runtimeSeconds + machine.downtimeSeconds;
      const utilization = totalTime > 0
        ? (machine.runtimeSeconds / totalTime) * 100
        : 0;

      return {
        machineId,
        runtime: machine.runtime,
        downtime: machine.downtime,
        runtimeSeconds: machine.runtimeSeconds,
        downtimeSeconds: machine.downtimeSeconds,
        utilization: Math.round(utilization * 100) / 100,
        totalCount: machine.totalCount,
        rollsCompleted: machine.rollsCompleted,
        currentRollCount: machine.currentRollCount,
        faultCount: machine.qualityLogs.length,
        faultRate: machine.totalCount > 0 ? (machine.qualityLogs.length / machine.totalCount) * 1000 : 0,
        timestamp: machine.lastUpdated
      };
    } catch (error) {
      logger.error(`❌ Error getting KPI trend for machine ${machineId}:`, error.message);
      return null;
    }
  }

  /**
   * Get per-machine KPI summaries
   */
  getMachineKPIs() {
    try {
      const machines_array = machineService.getAllMachines();
      return machines_array.map(machine => {
        const totalTime = machine.runtimeSeconds + machine.downtimeSeconds;
        const utilization = totalTime > 0
          ? (machine.runtimeSeconds / totalTime) * 100
          : 0;

        return {
          machineId: machine.machineId,
          status: machine.status,
          runtime: machine.runtime,
          downtime: machine.downtime,
          utilization: Math.round(utilization * 100) / 100,
          totalCount: machine.totalCount,
          rollsCompleted: machine.rollsCompleted,
          faultCount: machine.qualityLogs.length,
          activeProblems: machine.activeProblems.length
        };
      });
    } catch (error) {
      logger.error('❌ Error getting machine KPIs:', error.message);
      return [];
    }
  }
}

module.exports = new DashboardService();
