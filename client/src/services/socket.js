import { useStore } from '../store/useStore';

let ws = null;
let reconnectTimeout = null;
let preventReconnect = false;

const WS_URL = `ws://${window.location.hostname}:3000`;

function connectWebSocket() {
  if (ws?.readyState === WebSocket.OPEN) {
    return;
  }

  console.log('Connecting to WebSocket:', WS_URL);
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('WebSocket connected');
    useStore.getState().setConnectionStatus('connected');
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  };

  ws.onmessage = (event) => {
    try {
      const { type, payload } = JSON.parse(event.data);
      handleMessage(type, payload);
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    useStore.getState().setConnectionStatus('error');
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    useStore.getState().setConnectionStatus('disconnected');
    // Attempt to reconnect after 3 seconds (unless explicitly closed)
    if (!reconnectTimeout && !preventReconnect) {
      reconnectTimeout = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    }
  };
}

function handleMessage(type, payload) {
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
}

export function initSocket() {
  preventReconnect = false;
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    connectWebSocket();
  }
}

export function closeSocket() {
  preventReconnect = true;
  if (ws) {
    ws.close();
    ws = null;
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
}

export function getSocket() {
  return ws;
}
