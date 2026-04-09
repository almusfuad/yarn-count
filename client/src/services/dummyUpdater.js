import { useStore } from '../store/useStore';
import { playNotificationSound } from './audioUtils';

let updateInterval = null;
let notificationCounter = 0;
let lastNotificationTime = 0;
const NOTIFICATION_INTERVAL = 100000; // ~100 seconds (3 notifications in 5 minutes)

// Machines to turn on during testing (4 of the 6 stopped machines)
const MACHINES_TO_TURN_ON = ['F1-06', 'F2-05', 'F2-06', 'F3-05'];
const TURN_ON_INTERVAL = 75000; // Turn on one machine every 75 seconds (4 machines * 75 = 300 seconds = 5 minutes)
let lastTurnOnTime = 0;
let nextTurnOnIndex = 0;

// Machines to stop during testing (2 of the running machines)
const MACHINES_TO_STOP = ['F1-02', 'F3-04'];
const STOP_INTERVAL = 110000; // Stop one machine every 110 seconds
let lastStopTime = 0;
let nextStopIndex = 0;

// Simulate machine updates in dummy mode
export function startDummyUpdates() {
  stopDummyUpdates();
  
  updateInterval = setInterval(() => {
    const store = useStore.getState();
    let currentMachines = store.machines;
    
    // Randomly update 2-4 machines per interval
    const machineIds = Object.keys(currentMachines);
    const numUpdates = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < numUpdates; i++) {
      const randomMachineId = machineIds[Math.floor(Math.random() * machineIds.length)];
      const machine = currentMachines[randomMachineId];
      
      if (machine && machine.status === 'ON') {
        // Simulate incremental production
        const increment = Math.floor(Math.random() * 5) + 1; // 1-5 count increase
        const newTotalCount = (machine.totalCount || 0) + increment;
        
        // Simulate occasional roll completion
        let newRollsCompleted = machine.rollsCompleted || 0;
        const currentRollCount = newTotalCount % (machine.ROLL_TARGET || 5000);
        if (currentRollCount < (machine.currentRollCount || 0)) {
          newRollsCompleted += 1;
        }
        
        // Simulate runtime accumulation
        const newRuntimeSeconds = (machine.runtimeSeconds || 0) + 5; // 5 seconds per update
        const newDowntimeSeconds = (machine.downtimeSeconds || 0) + (Math.random() < 0.1 ? 5 : 0); // Occasional downtime
        
        store.updateMachine(randomMachineId, {
          totalCount: newTotalCount,
          rollsCompleted: newRollsCompleted,
          runtimeSeconds: newRuntimeSeconds,
          downtimeSeconds: newDowntimeSeconds,
          currentRollCount
        });
        
        // Get fresh state after this update
        currentMachines = useStore.getState().machines;
      } else if (machine && machine.status === 'STOPPED') {
        // Occasionally restart a stopped machine (5% chance)
        if (Math.random() < 0.05) {
          store.updateMachine(randomMachineId, {
            status: 'ON',
            downtimeSeconds: (machine.downtimeSeconds || 0) + 5, // Record final downtime
            runtimeSeconds: (machine.runtimeSeconds || 0) // Start fresh runtime accumulation
          });
        } else {
          // Simulate downtime accumulation
          store.updateMachine(randomMachineId, {
            downtimeSeconds: (machine.downtimeSeconds || 0) + 5
          });
        }
        
        // Get fresh state after this update
        currentMachines = useStore.getState().machines;
      }
    }
    
    // Recalculate KPIs from updated machines
    useStore.getState().calculateKpis();
    
    // Automatically turn on 4 machines over time (one every 75 seconds)
    const now = Date.now();
    if (nextTurnOnIndex < MACHINES_TO_TURN_ON.length && now - lastTurnOnTime > TURN_ON_INTERVAL) {
      const machineIdToTurnOn = MACHINES_TO_TURN_ON[nextTurnOnIndex];
      const freshMachines = useStore.getState().machines;
      const machine = freshMachines[machineIdToTurnOn];
      
      if (machine && machine.status === 'STOPPED') {
        useStore.getState().updateMachine(machineIdToTurnOn, {
          status: 'ON',
          totalCount: 100,
          rollsCompleted: 0,
          runtimeSeconds: 300,
          downtimeSeconds: 3600
        });
        
        // Track that this machine has been turned on
        useStore.getState().markMachineTurnedOn(machineIdToTurnOn);
        useStore.getState().calculateKpis();
        
        // Add notification for machine coming online
        const successMessage = `✅ SUCCESS: ${machineIdToTurnOn} is live now`;
        useStore.getState().addNotificationMessage(successMessage, 'success');
        useStore.getState().incrementNotificationBadge('success');
        
        // Add event log
        useStore.getState().addEvent({
          id: `event-${Date.now()}`,
          timestamp: new Date().toISOString(),
          machineId: machineIdToTurnOn,
          source: 'System',
          type: 'machine_online',
          message: `Machine ${machineIdToTurnOn} resumed operations`
        });
        
        nextTurnOnIndex++;
        lastTurnOnTime = now;
      }
    }
    
    // Automatically stop 2 machines over time
    if (nextStopIndex < MACHINES_TO_STOP.length && now - lastStopTime > STOP_INTERVAL) {
      const machineIdToStop = MACHINES_TO_STOP[nextStopIndex];
      const freshMachines = useStore.getState().machines;
      const machine = freshMachines[machineIdToStop];
      
      if (machine && machine.status === 'ON') {
        useStore.getState().updateMachine(machineIdToStop, {
          status: 'STOPPED',
          downtimeSeconds: (machine.downtimeSeconds || 0) + 5
        });
        
        useStore.getState().calculateKpis();
        
        // Add notification for machine stopping
        const stopMessage = `🔴 ALERT: ${machineIdToStop} has stopped`;
        useStore.getState().addNotificationMessage(stopMessage, 'critical');
        useStore.getState().incrementNotificationBadge('critical');
        playNotificationSound('critical');
        
        // Add event log
        useStore.getState().addEvent({
          id: `event-${Date.now()}`,
          timestamp: new Date().toISOString(),
          machineId: machineIdToStop,
          source: 'System',
          type: 'machine_stopped',
          message: `Machine ${machineIdToStop} has stopped unexpectedly`
        });
        
        nextStopIndex++;
        lastStopTime = now;
      }
    }
    
    // Trigger notifications every ~100 seconds (3 notifications in 5 minutes)
    if (now - lastNotificationTime > NOTIFICATION_INTERVAL) {
      const freshMachines = useStore.getState().machines;
      const allMachineIds = Object.keys(freshMachines);
      const randomMachine = freshMachines[allMachineIds[Math.floor(Math.random() * allMachineIds.length)]];
      
      const severity = Math.random() < 0.3 ? 'critical' : 'warning';
      
      let notificationMessage = '';
      if (severity === 'critical') {
        notificationMessage = `🔴 CRITICAL: ${randomMachine?.machineId || 'CNC-KNIT-01'} on Floor ${randomMachine?.machineId?.split('-')[1] || '1'} stopped`;
      } else {
        notificationMessage = `⚠️ WARNING: ${randomMachine?.machineId || 'CNC-KNIT-01'} stopped – no pulse`;
      }
      
      useStore.getState().incrementNotificationBadge(severity);
      useStore.getState().addNotificationMessage(notificationMessage, severity);
      playNotificationSound(severity);
      lastNotificationTime = now;
    }
    
    // Occasionally trigger an alert (20% chance)
    if (Math.random() < 0.2) {
      const freshMachines = useStore.getState().machines;
      const stoppedMachines = Object.keys(freshMachines).filter(id => freshMachines[id].status !== 'ON');
      if (stoppedMachines.length > 0) {
        // Alert will be added separately if needed
      }
    }
  }, 1000); // Update every 1 second
}

export function stopDummyUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

export function isUpdating() {
  return updateInterval !== null;
}
