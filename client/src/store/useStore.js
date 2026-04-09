import { create } from 'zustand';
import { dummyMachines, dummyKpis, dummyAlerts, dummyEvents } from '../services/dummyData';

// Helper function to calculate utilization
function calculateUtilization(machine) {
  if (!machine.runtimeSeconds || (!machine.runtimeSeconds && !machine.downtimeSeconds)) {
    return 0;
  }
  const totalSeconds = (machine.runtimeSeconds || 0) + (machine.downtimeSeconds || 0);
  if (totalSeconds === 0) return 0;
  return ((machine.runtimeSeconds || 0) / totalSeconds) * 100;
}

// Helper function to format seconds to HH:MM format
function formatTime(seconds) {
  if (!seconds || seconds < 0) return '00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export const useStore = create((set, get) => ({
  connectionStatus: 'disconnected',
  machines: {},
  alerts: [],
  events: [],
  kpis: {
    totalMachines: 0,
    activeMachines: 0,
    totalCount: 0,
    totalRolls: 0,
    totalDowntime: 0,
    totalRuntime: 0,
    totalRuntimeSeconds: 0,
    totalKg: 0,
    utilization: 0,
    estimatedOutput: 0,
    faultRate: 0,
    totalFaults: 0,
    criticalFaults: 0,
    rollHistory: [],
    qualityLogs: [],
    timestamp: null
  },
  filter: 'ALL',
  isDummyMode: false,
  notificationBadge: {
    critical: 0,
    warning: 0,
    success: 0
  },
  notificationMessages: [],
  machinesTurnedOn: [],
  session: {
    company: 'Amantex Ltd',
    asset: 'CNC-KNIT-01',
    job: 'ARTICLE-SW-2026',
    rollTarget: 5000,
    floorTarget: 10000,
    operator: 'Ahmed Khan',
    shift: 'Morning (06:00–14:00)'
  },

  // Actions
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setSession: (session) => set({ session }),

  initMachines: (machineList) =>
    set(() => {
      const machines = {};
      machineList.forEach((m) => {
        machines[m.machineId] = {
          ...m,
          lastUpdated: m.lastUpdated || new Date().toISOString(),
          utilization: m.utilization !== undefined ? m.utilization : calculateUtilization(m),
          runtime: m.runtime || formatTime(m.runtimeSeconds || 0),
          downtime: m.downtime || formatTime(m.downtimeSeconds || 0),
          currentRollCount: m.currentRollCount !== undefined ? m.currentRollCount : (m.totalCount % (m.ROLL_TARGET || 500)),
          ROLL_TARGET: m.ROLL_TARGET || 500,
          unackedAlerts: m.unackedAlerts || 0
        };
      });
      return { machines };
    }),

  // Calculate KPIs from current machines and alerts
  calculateKpis: () =>
    set((state) => {
      const machines = Object.values(state.machines);
      const totalCount = machines.reduce((sum, m) => sum + (m.totalCount || 0), 0);
      const activeMachines = machines.filter((m) => m.status === 'ON').length;
      const totalMachines = machines.length;
      const totalRuntime = machines.reduce((sum, m) => sum + (m.runtimeSeconds || 0), 0);
      const totalDowntime = machines.reduce((sum, m) => sum + (m.downtimeSeconds || 0), 0);
      const totalRolls = machines.reduce((sum, m) => sum + (m.rollsCompleted || 0), 0);
      const totalKg = totalRolls * 0.7; // Approximate: ~0.7kg per roll
      const utilization = totalRuntime + totalDowntime > 0 ? (totalRuntime / (totalRuntime + totalDowntime)) * 100 : 0;
      const capacityPercentage = totalMachines > 0 ? (activeMachines / totalMachines) * 100 : 0;
      
      return {
        kpis: {
          ...state.kpis,
          totalMachines,
          activeMachines,
          totalCount,
          totalRolls,
          totalDowntime,
          totalRuntime,
          totalRuntimeSeconds: totalRuntime,
          totalKg,
          utilization,
          capacityPercentage,
          timestamp: new Date().toISOString()
        }
      };
    }),


  updateMachine: (machineId, updates) =>
    set((state) => {
      // Add calculated fields to updates
      const enhanced = {
        ...updates,
        lastUpdated: new Date().toISOString(),
        utilization: updates.utilization !== undefined ? updates.utilization : calculateUtilization({
          ...state.machines[machineId],
          ...updates
        }),
        runtime: updates.runtime !== undefined ? updates.runtime : formatTime(updates.runtimeSeconds || state.machines[machineId]?.runtimeSeconds || 0),
        downtime: updates.downtime !== undefined ? updates.downtime : formatTime(updates.downtimeSeconds || state.machines[machineId]?.downtimeSeconds || 0),
        currentRollCount: updates.currentRollCount !== undefined ? updates.currentRollCount : ((updates.totalCount || state.machines[machineId]?.totalCount || 0) % (updates.ROLL_TARGET || state.machines[machineId]?.ROLL_TARGET || 500))
      };
      
      return {
        machines: {
          ...state.machines,
          [machineId]: {
            ...state.machines[machineId],
            ...enhanced
          }
        }
      };
    }),


  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 100)
    })),

  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, 200)
    })),

  setKpis: (kpis) => set({ kpis }),

  ackAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, acked: true } : a))
    })),

  setFilter: (filter) => set({ filter }),

  incrementNotificationBadge: (severity) =>
    set((state) => ({
      notificationBadge: {
        ...state.notificationBadge,
        [severity]: (state.notificationBadge[severity] || 0) + 1
      }
    })),

  clearNotificationBadges: () => set({ notificationBadge: { critical: 0, warning: 0, success: 0 } }),

  addNotificationMessage: (message, severity) =>
    set((state) => ({
      notificationMessages: [
        {
          id: Date.now(),
          text: message,
          severity,
          timestamp: new Date().toISOString(),
          sent: false
        },
        ...state.notificationMessages
      ].slice(0, 20) // Keep last 20 messages
    })),

  markMachineTurnedOn: (machineId) =>
    set((state) => ({
      machinesTurnedOn: [...new Set([...state.machinesTurnedOn, machineId])]
    })),

  clearOldAlerts: () =>
    set((state) => ({
      alerts: state.alerts.filter((a) => !a.acked)
    })),

  setDummyMode: (val) => set({ isDummyMode: val }),

  loadDummyData: () =>
    set((state) => {
      const machines = {};
      dummyMachines.forEach((m) => {
        machines[m.machineId] = {
          ...m,
          lastUpdated: new Date().toISOString(),
          utilization: calculateUtilization(m),
          runtime: formatTime(m.runtimeSeconds || 0),
          downtime: formatTime(m.downtimeSeconds || 0),
          currentRollCount: m.totalCount % (m.ROLL_TARGET || 500),
          ROLL_TARGET: m.ROLL_TARGET || 500,
          unackedAlerts: 0
        };
      });
      
      // Calculate KPIs from machines
      const totalCount = Object.values(machines).reduce((sum, m) => sum + (m.totalCount || 0), 0);
      const activeMachines = Object.values(machines).filter((m) => m.status === 'ON').length;
      const totalMachines = Object.keys(machines).length;
      const totalRuntime = Object.values(machines).reduce((sum, m) => sum + (m.runtimeSeconds || 0), 0);
      const totalDowntime = Object.values(machines).reduce((sum, m) => sum + (m.downtimeSeconds || 0), 0);
      const totalRolls = Object.values(machines).reduce((sum, m) => sum + (m.rollsCompleted || 0), 0);
      const totalKg = totalRolls * 0.7;
      const utilization = totalRuntime + totalDowntime > 0 ? (totalRuntime / (totalRuntime + totalDowntime)) * 100 : 0;
      const capacityPercentage = totalMachines > 0 ? (activeMachines / totalMachines) * 100 : 0;
      
      return {
        machines,
        kpis: {
          totalMachines,
          activeMachines,
          totalCount,
          totalRolls,
          totalDowntime,
          totalRuntime,
          totalRuntimeSeconds: totalRuntime,
          totalKg,
          utilization,
          capacityPercentage,
          estimatedOutput: 0,
          faultRate: 0,
          totalFaults: 0,
          criticalFaults: 0,
          rollHistory: [],
          qualityLogs: [],
          timestamp: new Date().toISOString()
        },
        alerts: [...dummyAlerts],
        events: [...dummyEvents],
        connectionStatus: 'demo'
      };
    }),

  clearLiveData: () =>
    set(() => ({
      machines: {},
      alerts: [],
      events: [],
      kpis: {
        totalMachines: 0,
        activeMachines: 0,
        totalCount: 0,
        totalRolls: 0,
        totalDowntime: 0,
        totalRuntime: 0,
        totalRuntimeSeconds: 0,
        totalKg: 0,
        utilization: 0,
        estimatedOutput: 0,
        faultRate: 0,
        totalFaults: 0,
        criticalFaults: 0,
        rollHistory: [],
        qualityLogs: [],
        timestamp: null
      },
      connectionStatus: 'disconnected',
      isDummyMode: false
    }))
}));
