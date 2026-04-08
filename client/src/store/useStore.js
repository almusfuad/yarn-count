import { create } from 'zustand';

export const useStore = create((set) => ({
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
    utilization: 0,
    estimatedOutput: 0,
    faultRate: 0,
    timestamp: null
  },
  filter: 'ALL',

  // Actions
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  initMachines: (machineList) =>
    set(() => {
      const machines = {};
      machineList.forEach((m) => {
        machines[m.machineId] = m;
      });
      return { machines };
    }),

  updateMachine: (machineId, updates) =>
    set((state) => ({
      machines: {
        ...state.machines,
        [machineId]: {
          ...state.machines[machineId],
          ...updates
        }
      }
    })),

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

  clearOldAlerts: () =>
    set((state) => ({
      alerts: state.alerts.filter((a) => !a.acked)
    }))
}));
