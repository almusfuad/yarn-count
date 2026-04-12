/**
 * Version Controller
 * Handles API version discovery and metadata endpoints
 */

import versionRegistry from '../../versioning/versionRegistry.js';
import * as versionManager from '../../versioning/versionManager.js';

/**
 * Get all available API versions
 * Optional query params:
 *   - module: filter by specific module name
 *   - version: get details for specific version
 */
export async function getVersions(req, res) {
  try {
    const { module: moduleName, version } = req.query;

    // If both module and version specified, get specific version details
    if (moduleName && version) {
      const details = versionRegistry.getVersionDetails(moduleName, version);
      if (!details) {
        return res.status(404).json({
          error: 'Not found',
          message: `Module '${moduleName}' not found in API version ${version}`
        });
      }
      return res.json({
        ...details,
        metadata: versionManager.getVersionMetadata()
      });
    }

    // If only module specified, get all versions for that module
    if (moduleName) {
      const moduleVersions = versionRegistry.getModuleVersions(moduleName);
      if (Object.keys(moduleVersions).length === 0) {
        return res.status(404).json({
          error: 'Not found',
          message: `Module '${moduleName}' not found in any API version`
        });
      }
      return res.json({
        module: moduleName,
        versions: moduleVersions,
        metadata: versionManager.getVersionMetadata()
      });
    }

    // If only version specified, get all endpoints for that version
    if (version) {
      const versionEndpoints = versionRegistry.getVersionEndpoints(version);
      if (!versionEndpoints) {
        return res.status(404).json({
          error: 'Not found',
          message: `API version ${version} not found`
        });
      }
      return res.json({
        ...versionEndpoints,
        metadata: versionManager.getVersionMetadata()
      });
    }

    // Return all versions and their modules
    const allVersions = versionRegistry.getVersions();
    const summary = Object.entries(allVersions).map(([version, data]) => ({
      version,
      status: data.status,
      releaseDate: data.releaseDate,
      description: data.description || '',
      moduleCount: Object.keys(data.modules).length,
      modules: Object.keys(data.modules),
      deprecated: data.status === 'deprecated',
      sunsetDate: data.sunsetDate || null
    }));

    res.json({
      versions: summary,
      metadata: versionManager.getVersionMetadata(),
      deprecatedVersions: versionRegistry.getDeprecatedVersions()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}

/**
 * Get version metadata and supported versions
 */
export async function getVersionMetadata(req, res) {
  try {
    res.json({
      metadata: versionManager.getVersionMetadata(),
      versions: versionRegistry.getVersions(),
      deprecatedVersions: versionRegistry.getDeprecatedVersions()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
