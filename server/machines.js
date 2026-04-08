// Core machine state and business logic

const machines = new Map();
let broadcastFn = null;

function parseHHMM(str) {
  if (!str) return 0;
  const [h, m] = str.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function createMachineState(machineId) {
  return {
    machineId,
    status: 'OFF',
    lastPulseAt: null,
    stopTimer: null,
    totalCount: 0,
    currentRollCount: 0,
    rollsCompleted: 0,
    ROLL_TARGET: 500,
    runtimeMinutes: 0,
    downtimeMinutes: 0,
    activeProblems: [],
    alerts: [],
    events: [],
    rollWeightLog: [],
    downtimeLogs: [],
    qualityLogs: [],
    lastUpdated: new Date().toISOString()
  };
}

function getOrCreateMachine(machineId) {
  if (!machines.has(machineId)) {
    machines.set(machineId, createMachineState(machineId));
  }
  return machines.get(machineId);
}

function handleMachineStatus(machineId, payload) {
  const machine = getOrCreateMachine(machineId);
  const { Status, RT, DT, Timestamp } = payload;

  machine.status = Status === 'ON' ? 'ON' : Status === 'OFF' ? 'OFF' : 'STOPPED';
  machine.runtimeMinutes = parseHHMM(RT);
  machine.downtimeMinutes = parseHHMM(DT);
  machine.lastUpdated = Timestamp || new Date().toISOString();

  if (machine.stopTimer) clearTimeout(machine.stopTimer);

  broadcastFn?.('machine_update', {
    machineId,
    status: machine.status,
    runtimeMinutes: machine.runtimeMinutes,
    downtimeMinutes: machine.downtimeMinutes
  });
}

function handleRawData(machineId, payload) {
  const machine = getOrCreateMachine(machineId);
  const { Rotation, RT, Timestamp } = payload;

  if (machine.stopTimer) clearTimeout(machine.stopTimer);

  machine.lastPulseAt = Timestamp || new Date().toISOString();
  machine.status = 'ON';
  machine.runtimeMinutes = parseHHMM(RT);

  if (Rotation > 0) {
    machine.totalCount += Rotation;
    machine.currentRollCount += Rotation;

    // Roll completion logic
    if (machine.currentRollCount >= machine.ROLL_TARGET) {
      machine.rollsCompleted++;
      machine.currentRollCount = 0;

      broadcastFn?.('event', {
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
    broadcastFn?.('machine_update', {
      machineId,
      status: 'STOPPED'
    });
  }, 4000);

  broadcastFn?.('machine_update', {
    machineId,
    totalCount: machine.totalCount,
    currentRollCount: machine.currentRollCount,
    status: 'ON'
  });
}

function handleProblem(machineId, payload) {
  const machine = getOrCreateMachine(machineId);
  const { Problem, Downtime, Timestamp } = payload;

  const problemId = `${machineId}-${Date.now()}`;
  const problem = {
    id: problemId,
    machineId,
    type: Problem,
    downtime: parseHHMM(Downtime),
    timestamp: Timestamp || new Date().toISOString(),
    acked: false
  };

  machine.activeProblems.push(problem);
  machine.alerts.push(problem);

  broadcastFn?.('alert', {
    ...problem,
    severity: Problem.includes('breakage') || Problem.includes('failure') ? 'critical' : 'warning'
  });
}

function getMachineSummary(machine) {
  const utilizationPercent =
    machine.runtimeMinutes + machine.downtimeMinutes > 0
      ? (machine.runtimeMinutes / (machine.runtimeMinutes + machine.downtimeMinutes)) * 100
      : 0;

  return {
    machineId: machine.machineId,
    status: machine.status,
    totalCount: machine.totalCount,
    currentRollCount: machine.currentRollCount,
    rollsCompleted: machine.rollsCompleted,
    runtimeMinutes: machine.runtimeMinutes,
    downtimeMinutes: machine.downtimeMinutes,
    utilization: utilizationPercent,
    activeProblems: machine.activeProblems.length,
    unackedAlerts: machine.alerts.filter(a => !a.acked).length,
    estimatedOutput: Math.round(machine.totalCount * 0.95),
    faultRate: machine.totalCount > 0 ? (machine.qualityLogs.length / machine.totalCount) * 1000 : 0,
    lastUpdated: machine.lastUpdated
  };
}

function getDashboardKPIs() {
  const machines_array = Array.from(machines.values());

  const totalCount = machines_array.reduce((sum, m) => sum + m.totalCount, 0);
  const totalRolls = machines_array.reduce((sum, m) => sum + m.rollsCompleted, 0);
  const totalDowntime = machines_array.reduce((sum, m) => sum + m.downtimeMinutes, 0);
  const totalRuntime = machines_array.reduce((sum, m) => sum + m.runtimeMinutes, 0);
  const totalMachines = machines_array.length;
  const activeMachines = machines_array.filter(m => m.status === 'ON').length;
  const totalFaults = machines_array.reduce((sum, m) => sum + m.qualityLogs.length, 0);

  const utilization = totalRuntime + totalDowntime > 0 ? (totalRuntime / (totalRuntime + totalDowntime)) * 100 : 0;
  const estimatedOutput = Math.round(totalCount * 0.95);
  const faultRate = totalCount > 0 ? (totalFaults / totalCount) * 1000 : 0;

  return {
    totalMachines,
    activeMachines,
    totalCount,
    totalRolls,
    totalDowntime,
    totalRuntime,
    utilization: Math.round(utilization * 100) / 100,
    estimatedOutput,
    faultRate: Math.round(faultRate * 100) / 100,
    timestamp: new Date().toISOString()
  };
}

function getAllMachines() {
  return Array.from(machines.values());
}

function getMachine(machineId) {
  return machines.get(machineId);
}

function addRollWeight(machineId, weight) {
  const machine = getOrCreateMachine(machineId);
  machine.rollWeightLog.push({
    weight,
    timestamp: new Date().toISOString(),
    rollNumber: machine.rollsCompleted
  });
  return machine.rollWeightLog[machine.rollWeightLog.length - 1];
}

function addDowntimeLog(machineId, reason, remarks) {
  const machine = getOrCreateMachine(machineId);
  const log = {
    id: `dt-${machineId}-${Date.now()}`,
    reason,
    remarks,
    timestamp: new Date().toISOString()
  };
  machine.downtimeLogs.push(log);
  return log;
}

function addQualityLog(machineId, faultType, severity, description) {
  const machine = getOrCreateMachine(machineId);
  const log = {
    id: `qc-${machineId}-${Date.now()}`,
    faultType,
    severity,
    description,
    timestamp: new Date().toISOString()
  };
  machine.qualityLogs.push(log);
  return log;
}

function acknowledgeAlert(machineId, alertId) {
  const machine = getMachine(machineId);
  if (machine) {
    const alert = machine.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acked = true;
      const idx = machine.activeProblems.findIndex(p => p.id === alertId);
      if (idx > -1) {
        machine.activeProblems.splice(idx, 1);
      }
    }
  }
}

function setBroadcast(fn) {
  broadcastFn = fn;
}

module.exports = {
  parseHHMM,
  createMachineState,
  handleMachineStatus,
  handleRawData,
  handleProblem,
  getMachineSummary,
  getDashboardKPIs,
  getAllMachines,
  getMachine,
  addRollWeight,
  addDowntimeLog,
  addQualityLog,
  acknowledgeAlert,
  setBroadcast,
  getOrCreateMachine
};
