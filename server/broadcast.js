// WebSocket broadcast utilities

const WebSocket = require('ws');

let wss = null;

function init(wssInstance) {
  wss = wssInstance;
}

function broadcast(type, payload) {
  if (!wss) return;
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, payload }));
    }
  });
}

function sendToClient(ws, type, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

module.exports = {
  init,
  broadcast,
  sendToClient
};
