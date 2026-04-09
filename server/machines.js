// Core machine state and business logic

const machines = new Map();
let broadcastFn = null;

function parseMMSS(str) {
  if (!str) return 0;
  const parts = str.split(':');
  if (parts.length === 2) {
    // MM:SS format
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    return minutes * 60 + seconds;
  }
  return 0;
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
    runtime: '00:00',        // MM:SS format
    downtime: '00:00',       // MM:SS format
    runtimeSeconds: 0,       // internal calculations
    downtimeSeconds: 0,      // internal calculations
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

  console.log(`[HANDLERS] Machine Status - Machine: ${machineId}`);
  console.log(`  Incoming: Status=${Status}, RT=${RT}, DT=${DT}, Timestamp=${Timestamp}`);

  machine.status = Status === 'ON' ? 'ON' : Status === 'OFF' ? 'OFF' : 'STOPPED';
  machine.runtime = RT || '00:00';
  machine.downtime = DT || '00:00';
  machine.runtimeSeconds = parseMMSS(RT);
  machine.downtimeSeconds = parseMMSS(DT);
  machine.lastUpdated = Timestamp || new Date().toISOString();

  console.log(`  Stored: runtime=${machine.runtime} (${machine.runtimeSeconds}s), downtime=${machine.downtime} (${machine.downtimeSeconds}s)`);

  if (machine.stopTimer) clearTimeout(machine.stopTimer);

  broadcastFn?.('machine_update', {
    machineId,
    status: machine.status,
    runtime: machine.runtime,
    downtime: machine.downtime
  });
}

function handleRawData(machineId, payload) {
  const machine = getOrCreateMachine(machineId);
  const { Rotation, RT, Timestamp } = payload;

  console.log(`[HANDLERS] Raw Data - Machine: ${machineId}`);
  console.log(`  Incoming: Rotation=${Rotation}, RT=${RT}, Timestamp=${Timestamp}`);

  if (machine.stopTimer) clearTimeout(machine.stopTimer);

  machine.lastPulseAt = Timestamp || new Date().toISOString();
  machine.status = 'ON';
  machine.runtime = RT || '00:00';
  machine.runtimeSeconds = parseMMSS(RT);

  console.log(`  Stored: runtime=${machine.runtime} (${machine.runtimeSeconds}s)`);

  if (Rotation > 0) {
    machine.totalCount = Rotation;
    
    // Calculate rolls completed and current progress
    machine.rollsCompleted = Math.floor(machine.totalCount / machine.ROLL_TARGET);
    machine.currentRollCount = machine.totalCount % machine.ROLL_TARGET;
    
    console.log(`  Count Updated: totalCount=${machine.totalCount}, rollsCompleted=${machine.rollsCompleted}, currentRollCount=${machine.currentRollCount}`);

    // Check if we just completed a new roll
    if (machine.currentRollCount === 0 && machine.totalCount > 0) {
      console.log(`  🎯 ROLL COMPLETE: Roll #${machine.rollsCompleted} completed!`);

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
    console.log(`[HANDLERS] Machine ${machineId} status changed to STOPPED (no pulse for 4s)`);
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

  console.log(`[HANDLERS] Problem Alert - Machine: ${machineId}`);
  console.log(`  Incoming: Problem=${Problem}, Downtime=${Downtime}, Timestamp=${Timestamp}`);

  const problemId = `${machineId}-${Date.now()}`;
  const downtimeSeconds = parseMMSS(Downtime);
  const problem = {
    id: problemId,
    machineId,
    type: Problem,
    downtime: Downtime,        // Keep as MM:SS
    downtimeSeconds: downtimeSeconds,
    timestamp: Timestamp || new Date().toISOString(),
    acked: false
  };

  console.log(`  Stored: downtime=${Downtime} (${downtimeSeconds}s)`);

  machine.activeProblems.push(problem);
  machine.alerts.push(problem);

  const severity = Problem.includes('breakage') || Problem.includes('failure') ? 'critical' : 'warning';
  console.log(`  Alert ID: ${problemId}, Severity: ${severity}`);

  broadcastFn?.('alert', {
    ...problem,
    severity
  });
}

function getMachineSummary(machine) {
  const totalTime = machine.runtimeSeconds + machine.downtimeSeconds;
  const utilizationPercent =
    totalTime > 0
      ? (machine.runtimeSeconds / totalTime) * 100
      : 0;

  return {
    machineId: machine.machineId,
    status: machine.status,
    totalCount: machine.totalCount,
    currentRollCount: machine.currentRollCount,
    rollsCompleted: machine.rollsCompleted,
    runtime: machine.runtime,
    downtime: machine.downtime,
    runtimeSeconds: machine.runtimeSeconds,
    downtimeSeconds: machine.downtimeSeconds,
    utilization: Math.round(utilizationPercent * 100) / 100 || 0,
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
  const totalDowntimeSeconds = machines_array.reduce((sum, m) => sum + m.downtimeSeconds, 0);
  const totalRuntimeSeconds = machines_array.reduce((sum, m) => sum + m.runtimeSeconds, 0);
  const totalMachines = machines_array.length;
  const activeMachines = machines_array.filter(m => m.status === 'ON').length;
  const totalFaults = machines_array.reduce((sum, m) => sum + m.qualityLogs.length, 0);

  const utilization = totalRuntimeSeconds + totalDowntimeSeconds > 0 ? (totalRuntimeSeconds / (totalRuntimeSeconds + totalDowntimeSeconds)) * 100 : 0;
  const estimatedOutput = Math.round(totalCount * 0.95);
  const faultRate = totalCount > 0 ? (totalFaults / totalCount) * 1000 : 0;

  return {
    totalMachines,
    activeMachines,
    totalCount,
    totalRolls,
    totalDowntimeSeconds,
    totalRuntimeSeconds,
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
  parseMMSS,
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
