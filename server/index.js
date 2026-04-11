// Express + WebSocket + MQTT wiring

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const machinesModule = require('./machines');
const { init: initBroadcast, sendToClient, broadcast } = require('./broadcast');
const { startMqtt } = require('./mqtt');
const telegram = require('./telegram');
const { logEvent } = require('./db/eventLogger');
const { connectToMongoDB, disconnectFromMongoDB } = require('./db/mongodb');
const { initializeIndexes } = require('./db/schemas');
const { startSnapshotGenerator, stopSnapshotGenerator } = require('./jobs/snapshotGenerator');
const { startDataExporter, stopDataExporter } = require('./jobs/dataExporter');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// Initialize broadcast module
initBroadcast(wss);

// Set broadcast callback in machines module
machinesModule.setBroadcast(broadcast);

// Routes
app.use('/api/machines', require('./routes/machines'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api', require('./routes/logs'));
app.use('/api/history', require('./routes/history'));
app.use('/api/exports', require('./routes/exports'));
app.use('/api/health', require('./routes/health'));

// Serve roll-weight and alerts through direct routes
app.post('/api/roll-weight', (req, res) => {
  const { machineId, weight } = req.body;
  if (!machineId || weight === undefined) {
    return res.status(400).json({ error: 'machineId and weight are required' });
  }
  const log = machinesModule.addRollWeight(machineId, weight);
  
  // Log roll weight event to MongoDB (non-blocking)
  logEvent('roll_weight', machineId, {
    weight,
    rollNumber: log.rollNumber,
    timestamp: log.timestamp
  });
  
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

// Telegram notification routes
app.get('/api/telegram/status', (req, res) => {
  res.json(telegram.getStatus());
});

app.post('/api/telegram/config', (req, res) => {
  telegram.updateConfig(req.body);
  res.json({ ok: true });
});

// Legacy health check (redirected to /api/health/system)
app.get('/health', (req, res) => {
  const { getConnectionStatus } = require('./db/mongodb');
  const dbStatus = getConnectionStatus();
  res.json({ status: 'ok', mongodb: dbStatus });
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

// Server Startup Sequence
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Connect to MongoDB
    logger.info('🔌 Connecting to MongoDB...');
    await connectToMongoDB();
    
    // 2. Initialize database indexes
    logger.info('📑 Initializing MongoDB indexes...');
    await initializeIndexes();
    
    // 3. Start snapshot generator job
    logger.info('📊 Starting snapshot generator...');
    startSnapshotGenerator();
    
    // 4. Start data exporter job
    logger.info('📦 Starting data exporter...');
    startDataExporter();
    
    // 5. Start HTTP server
    server.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
      console.log(`🚀 Server ready at http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error(`❌ Failed to start server: ${error.message}`);
    console.error('Fatal error during startup:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  // Stop jobs
  stopSnapshotGenerator();
  stopDataExporter();
  
  // Close server
  server.close(async () => {
    logger.info('HTTP server closed');
    
    // Disconnect from MongoDB
    await disconnectFromMongoDB();
    logger.info('✅ Graceful shutdown complete');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Shutdown timeout, forcing exit');
    process.exit(1);
  }, 10000);
});
