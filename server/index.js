// Express + WebSocket + MQTT wiring

import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { getDirname } from './utils/fileHelpers.js';

// Load environment variables
const __dirname = getDirname(import.meta.url);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Services from modules
import machineService from './modules/Machine/machineService.js';
import dashboardService from './modules/Dashboard/dashboardService.js';
import telegramService from './modules/Telegram/telegramService.js';
import mqttService from './modules/MQTT/mqttService.js';

// Infrastructure
import { init as initBroadcast, sendToClient, broadcast } from './broadcast.js';
import { startMqtt } from './mqtt.js';
import * as telegram from './telegram.js';
import { connectToPostgres, disconnectFromPostgres } from './db/prisma.js';
import { startSnapshotGenerator, stopSnapshotGenerator } from './jobs/snapshotGenerator.js';
import { startDataExporter, stopDataExporter } from './jobs/dataExporter.js';
import logger from './utils/logger.js';

// Middleware
import { errorHandler, notFoundHandler } from './modules/Shared/middleware/errorHandler.js';
import { apiVersioningMiddleware, addVersionToResponse } from './middleware/apiVersioning.js';

// API Router and versioning
import initializeApiRouter from './routes/apiRouter.js';

// V1 Routes from modules
import machineRoutesV1 from './modules/Machine/v1.routes.js';
import dashboardRoutesV1 from './modules/Dashboard/v1.routes.js';
import logsRoutesV1 from './modules/Logs/v1.routes.js';
import eventRoutesV1 from './modules/Event/v1.routes.js';
import exportsRoutesV1 from './modules/Export/v1.routes.js';
import healthRoutesV1 from './modules/Health/v1.routes.js';
import telegramRoutesV1 from './modules/Telegram/v1.routes.js';
import versionRoutes from './modules/Version/version.routes.js';

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
globalThis.services = {
  machineService,
  dashboardService,
  telegramService,
  mqttService
};

// Initialize versioned API router
const apiRouter = await initializeApiRouter({
  machineRoutesV1,
  dashboardRoutesV1,
  logsRoutesV1,
  eventRoutesV1,
  exportsRoutesV1,
  healthRoutesV1,
  telegramRoutesV1,
  versionRoutes
});

// Mount API with versioning middleware
app.use('/api', apiVersioningMiddleware, addVersionToResponse, apiRouter);

// Health check route (legacy support)
app.get('/health', async (req, res) => {
  try {
    import('./db/prisma.js').then(async ({ getConnectionStatus }) => {
      const status = await getConnectionStatus();
      res.json({
        status: 'ok',
        database: {
          connected: status.isConnected,
          state: status.status
        }
      });
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
    // 1. Connect to PostgreSQL
    logger.info('🔌 Connecting to PostgreSQL...');
    await connectToPostgres();
    
    // 2. Start snapshot generator job
    logger.info('📊 Starting snapshot generator...');
    startSnapshotGenerator();
    
    // 3. Start data exporter job
    logger.info('📦 Starting data exporter...');
    startDataExporter();
    
    // 4. Start HTTP server
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
    
    // Disconnect from PostgreSQL
    await disconnectFromPostgres();
    logger.info('✅ Graceful shutdown complete');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Shutdown timeout, forcing exit');
    process.exit(1);
  }, 10000);
});
