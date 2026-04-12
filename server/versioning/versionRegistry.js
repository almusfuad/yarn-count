/**
 * Version Registry
 * Centralized store for all API versions and their metadata
 * Enables version discovery and future version management
 */

class VersionRegistry {
  constructor() {
    this.versions = {
      '1': {
        status: 'active',
        releaseDate: '2026-01-01',
        description: 'Initial API version with machine, dashboard, events, exports, and core features',
        modules: {}
      }
    };
  }

  /**
   * Register a module's endpoints for a specific API version
   * @param {string} version - API version (e.g., '1', '2')
   * @param {string} moduleName - Module name (e.g., 'machines', 'dashboard')
   * @param {Array} endpoints - Array of endpoint objects with method, path, description
   */
  registerModule(version, moduleName, endpoints) {
    if (!this.versions[version]) {
      this.versions[version] = {
        status: 'active',
        releaseDate: new Date().toISOString().split('T')[0],
        modules: {}
      };
    }

    this.versions[version].modules[moduleName] = {
      endpoints,
      registeredAt: new Date().toISOString()
    };
  }

  /**
   * Get all versions with metadata
   * @returns {Object} All versions
   */
  getVersions() {
    return this.versions;
  }

  /**
   * Get versions for a specific module
   * @param {string} moduleName - Module name (e.g., 'machines')
   * @returns {Object} Versions containing this module
   */
  getModuleVersions(moduleName) {
    const result = {};
    Object.entries(this.versions).forEach(([version, versionData]) => {
      if (versionData.modules[moduleName]) {
        result[version] = {
          ...versionData,
          module: versionData.modules[moduleName]
        };
      }
    });
    return result;
  }

  /**
   * Get detailed info for a specific version of a module
   * @param {string} moduleName - Module name
   * @param {string} version - API version
   * @returns {Object|null} Module version details or null if not found
   */
  getVersionDetails(moduleName, version) {
    if (!this.versions[version] || !this.versions[version].modules[moduleName]) {
      return null;
    }
    return {
      version,
      moduleName,
      ...this.versions[version].modules[moduleName],
      versionStatus: this.versions[version].status,
      releaseDate: this.versions[version].releaseDate
    };
  }

  /**
   * Get all endpoints for a specific version
   * @param {string} version - API version
   * @returns {Object} All modules and endpoints for this version
   */
  getVersionEndpoints(version) {
    if (!this.versions[version]) {
      return null;
    }
    return {
      version,
      status: this.versions[version].status,
      releaseDate: this.versions[version].releaseDate,
      modules: this.versions[version].modules
    };
  }

  /**
   * Deprecate a version (mark as deprecated with sunset date)
   * @param {string} version - API version to deprecate
   * @param {string} sunsetDate - Date when version will be removed (YYYY-MM-DD)
   */
  deprecateVersion(version, sunsetDate) {
    if (this.versions[version]) {
      this.versions[version].status = 'deprecated';
      this.versions[version].sunsetDate = sunsetDate;
    }
  }

  /**
   * Get deprecation info for current versions
   * @returns {Array} Array of deprecated versions with sunset dates
   */
  getDeprecatedVersions() {
    return Object.entries(this.versions)
      .filter(([_, data]) => data.status === 'deprecated')
      .map(([version, data]) => ({
        version,
        sunsetDate: data.sunsetDate,
        releaseDate: data.releaseDate
      }));
  }
}

// Singleton instance
const registry = new VersionRegistry();

export default registry;
