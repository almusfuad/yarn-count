/**
 * Version Manager
 * Utilities for managing API version lifecycle, deprecation, and multi-version support
 */

export const CURRENT_VERSION = '1';
export const SUPPORTED_VERSIONS = ['1'];
export const DEPRECATED_VERSIONS = [];

/**
 * Check if a version is supported
 * @param {string} version - API version
 * @returns {boolean}
 */
export function isVersionSupported(version) {
  return SUPPORTED_VERSIONS.includes(version);
}

/**
 * Check if a version is current/stable
 * @param {string} version - API version
 * @returns {boolean}
 */
export function isCurrentVersion(version) {
  return version === CURRENT_VERSION;
}

/**
 * Check if a version is deprecated
 * @param {string} version - API version
 * @returns {boolean}
 */
export function isVersionDeprecated(version) {
  return DEPRECATED_VERSIONS.includes(version);
}

/**
 * Get version warnings for client responses (deprecation notices, etc.)
 * @param {string} version - API version being used
 * @returns {Object|null} Warning object or null if no warnings
 */
export function getVersionWarnings(version) {
  if (isVersionDeprecated(version)) {
    return {
      type: 'deprecation_warning',
      message: `API version ${version} is deprecated. Please upgrade to version ${CURRENT_VERSION}.`,
      version,
      currentVersion: CURRENT_VERSION
    };
  }
  if (!isVersionSupported(version)) {
    return {
      type: 'unsupported_version',
      message: `API version ${version} is not supported. Current version is ${CURRENT_VERSION}.`,
      version,
      currentVersion: CURRENT_VERSION,
      supportedVersions: SUPPORTED_VERSIONS
    };
  }
  return null;
}

/**
 * Add a new version to supported versions (for v2+ rollout)
 * @param {string} version - Version string
 */
export function addSupportedVersion(version) {
  if (!SUPPORTED_VERSIONS.includes(version)) {
    SUPPORTED_VERSIONS.push(version);
  }
}

/**
 * Deprecate a version (for migration planning)
 * @param {string} version - Version to deprecate
 */
export function deprecateVersion(version) {
  if (!DEPRECATED_VERSIONS.includes(version) && version !== CURRENT_VERSION) {
    DEPRECATED_VERSIONS.push(version);
  }
}

/**
 * Get version metadata for responses
 * @returns {Object}
 */
export function getVersionMetadata() {
  return {
    currentVersion: CURRENT_VERSION,
    supportedVersions: SUPPORTED_VERSIONS,
    deprecatedVersions: DEPRECATED_VERSIONS
  };
}

export default {
  CURRENT_VERSION,
  SUPPORTED_VERSIONS,
  DEPRECATED_VERSIONS,
  isVersionSupported,
  isCurrentVersion,
  isVersionDeprecated,
  getVersionWarnings,
  addSupportedVersion,
  deprecateVersion,
  getVersionMetadata
};
