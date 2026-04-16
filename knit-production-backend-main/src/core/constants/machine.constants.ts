export enum MachineStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERROR = 'error',
  IDLE = 'idle',
  RUNNING = 'running',
  STOPPED = 'stopped',
}

export enum AlertStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  ACKNOWLEDGED = 'acknowledged',
}

export const STOP_TIMER_MS = 4000;
export const MACHINE_STATUS_TIMEOUT_MS = 30000;
