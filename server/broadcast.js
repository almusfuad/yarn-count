// WebSocket broadcast utilities

import WebSocket from 'ws';

const OPEN = WebSocket.OPEN;

let wss = null;

export function init(wssInstance) {
  wss = wssInstance;
}

export function broadcast(type, payload) {
  if (!wss) return;
  
  wss.clients.forEach(client => {
    if (client.readyState === OPEN) {
      client.send(JSON.stringify({ type, payload }));
    }
  });
}

export function sendToClient(ws, type, payload) {
  if (ws.readyState === OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}
