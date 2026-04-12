import { useStore } from '../store/useStore';

// Reconnection backoff configuration
const INITIAL_BACKOFF = 3000; // 3 seconds
const MAX_BACKOFF = 30000; // 30 seconds
const BACKOFF_INCREMENT = 2000; // Increment by 2 seconds per attempt

const WS_URL = `ws://${window.location.hostname}:5000`;

const calculateBackoffDelay = (attemptCount) => {
  const delayMs = INITIAL_BACKOFF + attemptCount * BACKOFF_INCREMENT;
  return Math.min(delayMs, MAX_BACKOFF);
};

const connectWebSocket = () => {
  const store = useStore.getState();
  
  // Check if already connected
  if (store.socket.instance?.readyState === WebSocket.OPEN) {
    return;
  }

  console.log('Connecting to WebSocket:', WS_URL);
  
  const ws = new WebSocket(WS_URL);
  store.setSocketInstance(ws);
  store.setSocketStatus('connecting');

  ws.onopen = () => {
    console.log('WebSocket connected');
    store.setSocketStatus('connected');
    store.resetSocket(); // Reset attempt counter on successful connection
  };

  ws.onmessage = (event) => {
    try {
      const { type, payload } = JSON.parse(event.data);
      handleMessage(type, payload);
      store.recordSocketMessage('received');
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
      store.setSocketError(`Failed to parse message: ${err.message}`);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    store.setSocketStatus('error');
    store.setSocketError('WebSocket connection error. Reconnecting...');
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    store.setSocketStatus('disconnected');
    store.setSocketInstance(null);
    
    // Schedule reconnection with exponential backoff (unless explicitly closed)
    if (!store.socket.preventReconnect) {
      const attemptCount = store.socket.reconnectAttempts;
      const delayMs = calculateBackoffDelay(attemptCount);
      
      store.incrementReconnectAttempts();
      store.setNextReconnectIn(Math.ceil(delayMs / 1000)); // Convert to seconds for UI display
      
      console.log(`Reconnecting in ${delayMs}ms (attempt ${attemptCount + 1})`);
      
      setTimeout(() => {
        if (!store.socket.preventReconnect) {
          connectWebSocket();
        }
      }, delayMs);
    }
  };
};

const handleMessage = (type, payload) => {
  const store = useStore.getState();

  switch (type) {
    case 'init':
      store.initMachines(payload.machines);
      store.setKpis(payload.kpis);
      break;

    case 'machine_update':
      store.updateMachine(payload.machineId, payload);
      // Recalculate KPIs after each machine update to keep them in sync
      store.calculateKpis();
      break;

    case 'alert':
      store.addAlert(payload);
      break;

    case 'event':
      store.addEvent(payload);
      break;

    case 'summary':
      store.setKpis(payload);
      break;

    default:
      console.log('Unknown message type:', type);
  }
};

export const initSocket = () => {
  const store = useStore.getState();
  store.setPreventReconnect(false);
  
  if (!store.socket.instance || store.socket.instance.readyState !== WebSocket.OPEN) {
    connectWebSocket();
  }
};

export const closeSocket = () => {
  const store = useStore.getState();
  store.setPreventReconnect(true);
  
  if (store.socket.instance) {
    store.socket.instance.close();
    store.setSocketInstance(null);
  }
};

export const getSocket = () => {
  return useStore.getState().socket.instance;
};
