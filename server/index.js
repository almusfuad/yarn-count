// Express + WebSocket + MQTT wiring

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Services from modules
const machineService = require('./modules/Machine/machineService');
const dashboardService = require('./modules/Dashboard/dashboardService');
const telegramService = require('./modules/Telegram/telegramService');
const mqttService = require('./modules/MQTT/mqttService');

// Infrastructure
const { init: initBroadcast, sendToClient, broadcast } = require('./broadcast');
const { startMqtt } = require('./mqtt');
const telegram = require('./telegram');
const { connectToMongoDB, disconnectFromMongoDB } = require('./db/mongodb');
const { initializeIndexes } = require('./db/schemas');
const { startSnapshotGenerator, stopSnapshotGenerator } = require('./jobs/snapshotGenerator');
const { startDataExporter, stopDataExporter } = require('./jobs/dataExporter');
const logger = require('./utils/logger');

// Middleware
const { errorHandler, notFoundHandler } = require('./modules/Shared/middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Request middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// Initialize broadcast module
initBroadcast(wss);

// Initialize services with broadcast function
machineService.setBroadcast(broadcast);
telegramService.setTelegramClient(telegram.client);

// Attach services to global context for jobs and other modules (optional)
global.services = {
  machineService,
  dashboardService,
  telegramService,
  mqttService
};

// Routes from modules
app.use('/api/machines', require('./modules/Machine/machine.routes'));
app.use('/api/dashboard', require('./modules/Dashboard/dashboard.routes'));
app.use('/api', require('./modules/Logs/logs.routes'));
app.use('/api/history', require('./modules/Event/event.routes'));
app.use('/api/exports', require('./modules/Export/exports.routes'));
app.use('/api/health', require('./modules/Health/health.routes'));

// Telegram notification routes
app.get('/api/telegram/status', (req, res) => {
  res.json(telegram.getStatus());
});

app.post('/api/telegram/config', (req, res) => {
  telegram.updateConfig(req.body);
  res.json({ ok: true });
});

// Health check route (legacy support)
app.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const state = mongoose.connection.readyState;
    res.json({
      status: 'ok',
      mongodb: {
        connected: state === 1,
        state: state === 1 ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    res.status(503).json({ status: 'error', message: error.message });
  }
});

// SPA fallback — must be after all API routes but before error handler
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// 404 handler (before error handler)
app.use(notFoundHandler);

// Error handler middleware (last)
app.use(errorHandler);

// WebSocket connection handler
wss.on('connection', (ws) => {
  logger.info('✅ Client connected');

  // Send initial state
  const summaries = machineService.getAllMachineSummaries();
  const kpis = dashboardService.calculateDashboardMetrics();

  sendToClient(ws, 'init', {
    machines: summaries,
    kpis
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      logger.info(`📨 Received message from client: ${message.type}`);
      // Handle any client messages if needed
    } catch (err) {
      logger.error('❌ Error parsing client message:', err.message);
    }
  });

  ws.on('close', () => {
    logger.info('👋 Client disconnected');
  });

  ws.on('error', (err) => {
    logger.error('❌ WebSocket error:', err.message);
  });
});

// Start MQTT (with service integration)
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
