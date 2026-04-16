// Pure static dummy data — no imports
export const dummyMachines = [
  // Floor 1: 5 ON, 2 STOPPED
  { machineId: 'F1-01', status: 'ON', totalCount: 1247, rollsCompleted: 52, runtimeSeconds: 18450, downtimeSeconds: 600, ROLL_TARGET: 500 },
  { machineId: 'F1-02', status: 'ON', totalCount: 1156, rollsCompleted: 48, runtimeSeconds: 17280, downtimeSeconds: 420, ROLL_TARGET: 500 },
  { machineId: 'F1-03', status: 'ON', totalCount: 1389, rollsCompleted: 58, runtimeSeconds: 19800, downtimeSeconds: 900, ROLL_TARGET: 500 },
  { machineId: 'F1-04', status: 'ON', totalCount: 1045, rollsCompleted: 44, runtimeSeconds: 16200, downtimeSeconds: 300, ROLL_TARGET: 500 },
  { machineId: 'F1-05', status: 'ON', totalCount: 1298, rollsCompleted: 54, runtimeSeconds: 18900, downtimeSeconds: 750, ROLL_TARGET: 500 },
  { machineId: 'F1-06', status: 'STOPPED', totalCount: 0, rollsCompleted: 0, runtimeSeconds: 0, downtimeSeconds: 3600, ROLL_TARGET: 500 },
  { machineId: 'F1-07', status: 'STOPPED', totalCount: 0, rollsCompleted: 0, runtimeSeconds: 0, downtimeSeconds: 3600, ROLL_TARGET: 500 },

  // Floor 2: 4 ON, 2 STOPPED, 1 OFF
  { machineId: 'F2-01', status: 'ON', totalCount: 1234, rollsCompleted: 51, runtimeSeconds: 18600, downtimeSeconds: 540, ROLL_TARGET: 500 },
  { machineId: 'F2-02', status: 'ON', totalCount: 1312, rollsCompleted: 55, runtimeSeconds: 19200, downtimeSeconds: 720, ROLL_TARGET: 500 },
  { machineId: 'F2-03', status: 'ON', totalCount: 1167, rollsCompleted: 49, runtimeSeconds: 17460, downtimeSeconds: 360, ROLL_TARGET: 500 },
  { machineId: 'F2-04', status: 'ON', totalCount: 1289, rollsCompleted: 54, runtimeSeconds: 19080, downtimeSeconds: 840, ROLL_TARGET: 500 },
  { machineId: 'F2-05', status: 'STOPPED', totalCount: 0, rollsCompleted: 0, runtimeSeconds: 0, downtimeSeconds: 3600, ROLL_TARGET: 500 },
  { machineId: 'F2-06', status: 'STOPPED', totalCount: 0, rollsCompleted: 0, runtimeSeconds: 0, downtimeSeconds: 3600, ROLL_TARGET: 500 },
  { machineId: 'F2-07', status: 'OFF', totalCount: 0, rollsCompleted: 0, runtimeSeconds: 0, downtimeSeconds: 0, ROLL_TARGET: 500 },

  // Floor 3: 4 ON, 2 STOPPED
  { machineId: 'F3-01', status: 'ON', totalCount: 1356, rollsCompleted: 57, runtimeSeconds: 19800, downtimeSeconds: 780, ROLL_TARGET: 500 },
  { machineId: 'F3-02', status: 'ON', totalCount: 1245, rollsCompleted: 52, runtimeSeconds: 18720, downtimeSeconds: 600, ROLL_TARGET: 500 },
  { machineId: 'F3-03', status: 'ON', totalCount: 890, rollsCompleted: 37, runtimeSeconds: 13200, downtimeSeconds: 300, ROLL_TARGET: 500 },
  { machineId: 'F3-04', status: 'ON', totalCount: 1123, rollsCompleted: 47, runtimeSeconds: 16860, downtimeSeconds: 480, ROLL_TARGET: 500 },
  { machineId: 'F3-05', status: 'STOPPED', totalCount: 0, rollsCompleted: 0, runtimeSeconds: 0, downtimeSeconds: 3300, ROLL_TARGET: 500 },
  { machineId: 'F3-06', status: 'STOPPED', totalCount: 0, rollsCompleted: 0, runtimeSeconds: 0, downtimeSeconds: 3300, ROLL_TARGET: 500 }
];

export const dummyKpis = {
  totalMachines: 20,
  activeMachines: 16,
  totalCount: 24126,
  totalRolls: 1043,
  totalDowntime: 18390,
  totalRuntime: 336930,
  totalRuntimeSeconds: 336930,
  totalKg: 18108,
  utilization: 82.4,
  estimatedOutput: 31205,
  faultRate: 3.2,
  totalFaults: 5,
  criticalFaults: 1,
  rollHistory: [
    { timestamp: '2026-04-09T14:35:00.000Z', rollsCompleted: 1043, totalKg: 18108, avgKg: 17.36 },
    { timestamp: '2026-04-09T14:30:00.000Z', rollsCompleted: 1038, totalKg: 18000, avgKg: 17.34 },
    { timestamp: '2026-04-09T14:25:00.000Z', rollsCompleted: 1033, totalKg: 17900, avgKg: 17.34 }
  ],
  qualityLogs: [],
  timestamp: new Date().toISOString()
};

export const dummyAlerts = [
  {
    id: 'alert-1',
    severity: 'critical',
    title: 'High Fault Rate Detected',
    message: 'Machine F2-05 showing elevated fault count (5 faults in 30 minutes)',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    acked: false,
    machineId: 'F2-05'
  },
  {
    id: 'alert-2',
    severity: 'warning',
    title: 'Machine Stopped',
    message: 'Machine F3-06 has been stopped for 55 minutes',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    acked: false,
    machineId: 'F3-06'
  },
  {
    id: 'alert-3',
    severity: 'warning',
    title: 'Low Utilization',
    message: 'Floor 3 utilization at 65% (below target 80%)',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    acked: false,
    floor: 'F3'
  }
];

export const dummyEvents = [
  {
    id: 'event-1',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    machineId: 'F1-03',
    source: 'Sensor',
    type: 'roll_completed',
    message: 'Roll completed (1389 count, 850kg)'
  },
  {
    id: 'event-2',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    machineId: 'F2-04',
    source: 'Sensor',
    type: 'fault_detected',
    message: 'Sensor fault detected on roll count'
  },
  {
    id: 'event-3',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    machineId: 'F3-02',
    source: 'Sensor',
    type: 'machine_status',
    message: 'Machine resumed from downtime'
  },
  {
    id: 'event-4',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    machineId: 'F1-06',
    source: 'Sensor',
    type: 'setup_complete',
    message: 'Setup completed on machine'
  },
  {
    id: 'event-5',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    machineId: 'F2-02',
    source: 'Sensor',
    type: 'roll_completed',
    message: 'Roll completed (1312 count, 920kg)'
  }
];

export const dummyTelegramStatus = {
  botName: '@KnittingAlertsBot',
  channelName: 'Amantex Factory Alerts',
  connected: true,
  notifyOn: {
    machineStop: true,
    floorStop: true,
    qualityFault: true,
    shiftStart: false
  },
  recentMessages: [
    {
      text: '🔴 CRITICAL: F3-05 on Floor 3 stopped',
      timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      sent: true
    },
    {
      text: '⚠️ WARNING: CNC-KNIT-01 stopped – no pulse',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      sent: true
    },
    {
      text: '⚠️ WARNING: F2-07 on Floor 2 stopped',
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      sent: true
    }
  ]
};

export const dummyDowntimeRecords = [
  {
    id: 'dt-1',
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    duration: '30m',
    status: 'Pending Assignment',
    reason: 'Unscheduled maintenance'
  },
  {
    id: 'dt-2',
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
    duration: '30m',
    status: 'Pending Assignment',
    reason: 'Material shortage'
  },
  {
    id: 'dt-3',
    startTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 5.75 * 60 * 60 * 1000).toISOString(),
    duration: '15m',
    status: 'Pending Assignment',
    reason: 'Operator break'
  }
];

export const dummyQualityFaults = [
  {
    id: 'fault-1',
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    floor: 'F1',
    machine: 'F1-03',
    faultType: 'tension_error',
    severity: 'critical',
    notes: 'Yarn tension exceeded threshold'
  },
  {
    id: 'fault-2',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    floor: 'F2',
    machine: 'F2-05',
    faultType: 'gauge_error',
    severity: 'warning',
    notes: 'Stitch gauge deviation detected'
  },
  {
    id: 'fault-3',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    floor: 'F3',
    machine: 'F3-05',
    faultType: 'color_mismatch',
    severity: 'warning',
    notes: 'Yarn color inconsistency on roll'
  }
];
