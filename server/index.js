// Express + WebSocket + MQTT wiring

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');

const machinesModule = require('./machines');
const { init: initBroadcast, sendToClient, broadcast } = require('./broadcast');
const { startMqtt } = require('./mqtt');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

const path = require('path');
app.use(express.static(path.join(__dirname, '../client/dist')));

// Initialize broadcast module
initBroadcast(wss);

// Set broadcast callback in machines module
machinesModule.setBroadcast(broadcast);

// Routes
app.use('/api/machines', require('./routes/machines'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api', require('./routes/logs'));

// Serve roll-weight and alerts through direct routes
app.post('/api/roll-weight', (req, res) => {
  const { machineId, weight } = req.body;
  if (!machineId || weight === undefined) {
    return res.status(400).json({ error: 'machineId and weight are required' });
  }
  const log = machinesModule.addRollWeight(machineId, weight);
  res.json(log);
});

app.post('/api/alerts/ack', (req, res) => {
  const { machineId, alertId } = req.body;
  if (!machineId || !alertId) {
    return res.status(400).json({ error: 'machineId and alertId are required' });
  }
  machinesModule.acknowledgeAlert(machineId, alertId);
  res.json({ acked: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// SPA fallback — must be after all API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send initial state
  const machines = machinesModule.getAllMachines();
  const kpis = machinesModule.getDashboardKPIs();
  const summaries = machines.map(m => machinesModule.getMachineSummary(m));
  
  sendToClient(ws, 'init', {
    machines: summaries,
    kpis
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received message from client:', message.type);
      // Handle any client messages if needed
    } catch (err) {
      console.error('Error parsing client message:', err);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Start MQTT
startMqtt();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
