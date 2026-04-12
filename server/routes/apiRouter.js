/**
 * Centralized API Router
 * Manages all API routes with versioning support
 * Mounts v1 endpoints at /api/v1/
 * Mounts unversioned endpoints at /api/ as v1 aliases (for immediate migration)
 */

import express from 'express';
import versionRegistry from '../versioning/versionRegistry.js';
import logger from '../utils/logger.js';

// Import v1 routes (will be created in Phase 2)
let machineRoutesV1, dashboardRoutesV1, logsRoutesV1, eventRoutesV1, 
    exportsRoutesV1, healthRoutesV1, telegramRoutesV1, versionRoutes;

/**
 * Initialize the API router with all versioned routes
 * This function should be called after all route modules are imported
 * 
 * @param {Object} routeModules - Object containing all route modules
 * @returns {express.Router} Configured API router
 */
export async function initializeApiRouter(routeModules) {
  const router = express.Router();

  // Store route modules
  machineRoutesV1 = routeModules.machineRoutesV1;
  dashboardRoutesV1 = routeModules.dashboardRoutesV1;
  logsRoutesV1 = routeModules.logsRoutesV1;
  eventRoutesV1 = routeModules.eventRoutesV1;
  exportsRoutesV1 = routeModules.exportsRoutesV1;
  healthRoutesV1 = routeModules.healthRoutesV1;
  telegramRoutesV1 = routeModules.telegramRoutesV1;
  versionRoutes = routeModules.versionRoutes;

  // Register v1 module endpoints in the version registry
  registerV1Modules();

  // Mount versioned v1 routes at /api/v1/
  router.use('/v1/machines', machineRoutesV1);
  router.use('/v1/dashboard', dashboardRoutesV1);
  router.use('/v1', logsRoutesV1);
  router.use('/v1/history', eventRoutesV1);
  router.use('/v1/exports', exportsRoutesV1);
  router.use('/v1/health', healthRoutesV1);
  router.use('/v1/versions', versionRoutes);

  // Telegram v1 endpoints (inline, minimal)
  router.get('/v1/telegram/status', (req, res) => {
    // This will be replaced with actual telegram routes in Phase 2
    res.json({ status: 'ok', platform: 'v1' });
  });

  router.post('/v1/telegram/config', (req, res) => {
    // This will be replaced with actual telegram routes in Phase 2
    res.json({ ok: true });
  });

  // Mount unversioned routes at /api/ as v1 aliases (for immediate migration/backward compat)
  // These redirect or pass through to /api/v1/
  router.use('/machines', machineRoutesV1);
  router.use('/dashboard', dashboardRoutesV1);
  router.use('/', logsRoutesV1);
  router.use('/history', eventRoutesV1);
  router.use('/exports', exportsRoutesV1);
  router.use('/health', healthRoutesV1);
  router.use('/versions', versionRoutes);

  // Unversioned telegram endpoints (redirect to v1)
  router.get('/telegram/status', (req, res) => {
    res.redirect(301, '/api/v1/telegram/status');
  });

  router.post('/telegram/config', (req, res) => {
    res.redirect(307, '/api/v1/telegram/config');
  });

  // Pass-through for any unversioned /api calls without explicit redirect
  // This allows /api/downtime, /api/quality, etc. to work alongside /api/v1 versions
  router.use((req, res, next) => {
    if (req.path === '/') {
      return next();
    }
    // Already handled above, so this is 404
    next();
  });

  logger.info('API Router initialized with versioning support (v1 active)');
  return router;
}

/**
 * Register all v1 module endpoints in the version registry
 * This populates the version registry with endpoint metadata
 */
function registerV1Modules() {
  // Machine endpoints
  versionRegistry.registerModule('1', 'machines', [
    { method: 'GET', path: '/api/v1/machines', description: 'Get all machine summaries' },
    { method: 'GET', path: '/api/v1/machines/:id', description: 'Get single machine summary' },
    { method: 'GET', path: '/api/v1/machines/:id/details', description: 'Get full machine state' }
  ]);

  // Dashboard endpoints
  versionRegistry.registerModule('1', 'dashboard', [
    { method: 'GET', path: '/api/v1/dashboard', description: 'Get dashboard overview' },
    { method: 'GET', path: '/api/v1/dashboard/machine-kpis', description: 'Get KPI data for all machines' },
    { method: 'GET', path: '/api/v1/dashboard/machine/:id/kpi', description: 'Get KPI data for specific machine' }
  ]);

  // Logs/Events endpoints
  versionRegistry.registerModule('1', 'logs', [
    { method: 'POST', path: '/api/v1/downtime', description: 'Log downtime event' },
    { method: 'POST', path: '/api/v1/quality', description: 'Log quality issue' },
    { method: 'POST', path: '/api/v1/roll-weight', description: 'Log roll weight measurement' },
    { method: 'POST', path: '/api/v1/alerts/:alertId/acknowledge', description: 'Acknowledge alert' }
  ]);

  // Event/History endpoints
  versionRegistry.registerModule('1', 'events', [
    { method: 'GET', path: '/api/v1/history/events', description: 'Get event history' },
    { method: 'GET', path: '/api/v1/history/events/count', description: 'Get event count' },
    { method: 'GET', path: '/api/v1/history/kpi-snapshot', description: 'Get current KPI snapshot' },
    { method: 'GET', path: '/api/v1/history/kpi-snapshots', description: 'Get KPI snapshot history' },
    { method: 'GET', path: '/api/v1/history/machine/:id/stats', description: 'Get machine statistics' }
  ]);

  // Export endpoints
  versionRegistry.registerModule('1', 'exports', [
    { method: 'POST', path: '/api/v1/exports/trigger', description: 'Trigger data export' },
    { method: 'GET', path: '/api/v1/exports/history', description: 'Get export history' },
    { method: 'GET', path: '/api/v1/exports/:id', description: 'Get specific export' },
    { method: 'GET', path: '/api/v1/exports/status', description: 'Get export status' },
    { method: 'GET', path: '/api/v1/exports/recent', description: 'Get recent exports' },
    { method: 'POST', path: '/api/v1/exports/:id/verify', description: 'Verify export integrity' }
  ]);

  // Health endpoints
  versionRegistry.registerModule('1', 'health', [
    { method: 'GET', path: '/api/v1/health', description: 'Get system health status' },
    { method: 'GET', path: '/api/v1/health/db', description: 'Get database health status' },
    { method: 'GET', path: '/api/v1/health/exports', description: 'Get export service health' }
  ]);

  // Telegram endpoints
  versionRegistry.registerModule('1', 'telegram', [
    { method: 'GET', path: '/api/v1/telegram/status', description: 'Get Telegram notification status' },
    { method: 'POST', path: '/api/v1/telegram/config', description: 'Update Telegram configuration' }
  ]);

  // Version endpoints
  versionRegistry.registerModule('1', 'version', [
    { method: 'GET', path: '/api/versions', description: 'Get API version information' },
    { method: 'GET', path: '/api/versions?module=X', description: 'Get versions for specific module' },
    { method: 'GET', path: '/api/versions?module=X&version=Y', description: 'Get details for module version' },
    { method: 'GET', path: '/api/v1/version', description: 'Get API version metadata' }
  ]);

  logger.info('V1 endpoints registered in version registry');
}

export default initializeApiRouter;
