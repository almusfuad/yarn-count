/**
 * API Versioning Middleware
 * Extracts API version from request path and attaches to request object
 * Enables version-specific logic in controllers and services
 */

import * as versionManager from '../versioning/versionManager.js';
import logger from '../utils/logger.js';

/**
 * Middleware to tag requests with API version information
 * Extracts version from URL path pattern /api/v{N}/...
 */
export function apiVersioningMiddleware(req, res, next) {
  // Extract version from path: /api/v1/... => version = '1'
  const versionMatch = req.path.match(/^\/api\/v(\d+)\//);
  
  if (versionMatch) {
    const version = versionMatch[1];
    req.apiVersion = version;
    req.apiVersioned = true;

    // Check if version is supported
    if (!versionManager.isVersionSupported(version)) {
      logger.warn(`Unsupported API version requested: v${version}`, {
        path: req.path,
        method: req.method
      });
    }

    // Check if version is deprecated
    if (versionManager.isVersionDeprecated(version)) {
      res.set('Deprecation', 'true');
      res.set('Sunset', `${new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split('T')[0]}`);
      logger.info(`Deprecated API version used: v${version}`, {
        path: req.path,
        method: req.method
      });
    }

    // Add version metadata to response headers
    res.set('API-Version', version);
  } else {
    // Unversioned request - treat as legacy
    req.apiVersion = 'legacy';
    req.apiVersioned = false;
  }

  next();
}

/**
 * Middleware to add version information to JSON responses
 */
export function addVersionToResponse(req, res, next) {
  // Store original json function
  const originalJson = res.json;

  // Override json function to add version metadata
  res.json = function(data) {
    // Add version info to response metadata if not already present
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      if (!data._metadata) {
        data._metadata = {};
      }
      data._metadata.apiVersion = req.apiVersion;
      data._metadata.apiVersioned = req.apiVersioned;
    }

    // Call original json function
    return originalJson.call(this, data);
  };

  next();
}

export default apiVersioningMiddleware;
