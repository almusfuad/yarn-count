/**
 * Centralized API Client
 * Single point of contact for all API calls from the frontend
 * Simplifies version management and provides consistent error handling
 */

// API version - change this constant to migrate all clients to new version
const API_VERSION = 'v1';
const API_BASE_URL = `${window.location.origin}/api/${API_VERSION}`;
const LEGACY_BASE_URL = `${window.location.origin}/api`;

/**
 * Handle API response and throw errors if not OK
 */
async function handleResponse(response) {
  const data = await response.json();
  
  if (!response.ok) {
    const error = new Error(data.message || data.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  
  return data;
}

/**
 * Make HTTP request with consistent error handling
 */
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  const mergedOptions = { ...defaultOptions, ...options, headers: defaultOptions.headers };
  
  try {
    const response = await fetch(url, mergedOptions);
    return await handleResponse(response);
  } catch (error) {
    console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error);
    throw error;
  }
}

// ============= MACHINE ENDPOINTS =============

export async function getMachines() {
  return makeRequest('/machines', { method: 'GET' });
}

export async function getMachineDetail(machineId) {
  return makeRequest(`/machines/${machineId}`, { method: 'GET' });
}

export async function getMachineState(machineId) {
  return makeRequest(`/machines/${machineId}/details`, { method: 'GET' });
}

// ============= DASHBOARD ENDPOINTS =============

export async function getDashboard() {
  return makeRequest('/dashboard', { method: 'GET' });
}

export async function getMachineKPIs() {
  return makeRequest('/dashboard/machine-kpis', { method: 'GET' });
}

export async function getMachineKPITrend(machineId) {
  return makeRequest(`/dashboard/machine/${machineId}/kpi`, { method: 'GET' });
}

// ============= LOGGING ENDPOINTS =============

export async function logDowntime(data) {
  return makeRequest('/downtime', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function logQuality(data) {
  return makeRequest('/quality', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function logRollWeight(data) {
  return makeRequest('/roll-weight', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function acknowledgeAlert(alertId) {
  return makeRequest(`/alerts/${alertId}/acknowledge`, {
    method: 'POST'
  });
}

// ============= EVENT/HISTORY ENDPOINTS =============

export async function getEvents(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/history/events${queryString ? '?' + queryString : ''}`;
  return makeRequest(endpoint, { method: 'GET' });
}

export async function getEventCount(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/history/events/count${queryString ? '?' + queryString : ''}`;
  return makeRequest(endpoint, { method: 'GET' });
}

export async function getKPISnapshot(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/history/kpi-snapshot${queryString ? '?' + queryString : ''}`;
  return makeRequest(endpoint, { method: 'GET' });
}

export async function getKPISnapshots(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/history/kpi-snapshots${queryString ? '?' + queryString : ''}`;
  return makeRequest(endpoint, { method: 'GET' });
}

export async function getMachineEventStats(machineId, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/history/machine/${machineId}/stats${queryString ? '?' + queryString : ''}`;
  return makeRequest(endpoint, { method: 'GET' });
}

// ============= EXPORT ENDPOINTS =============

export async function triggerExport(data) {
  return makeRequest('/exports/trigger', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getExportHistory(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/exports/history${queryString ? '?' + queryString : ''}`;
  return makeRequest(endpoint, { method: 'GET' });
}

export async function getExportById(exportId) {
  return makeRequest(`/exports/${exportId}`, { method: 'GET' });
}

export async function getExportStatus() {
  return makeRequest('/exports/status', { method: 'GET' });
}

export async function getRecentExports(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/exports/recent${queryString ? '?' + queryString : ''}`;
  return makeRequest(endpoint, { method: 'GET' });
}

export async function verifyExport(exportId) {
  return makeRequest(`/exports/${exportId}/verify`, {
    method: 'POST'
  });
}

// ============= HEALTH ENDPOINTS =============

export async function getHealth() {
  return makeRequest('/health', { method: 'GET' });
}

export async function checkDatabaseHealth() {
  return makeRequest('/health/db', { method: 'GET' });
}

export async function checkExportHealth() {
  return makeRequest('/health/exports', { method: 'GET' });
}

// ============= TELEGRAM ENDPOINTS =============

export async function getTelegramStatus() {
  return makeRequest('/telegram/status', { method: 'GET' });
}

export async function updateTelegramConfig(config) {
  return makeRequest('/telegram/config', {
    method: 'POST',
    body: JSON.stringify(config)
  });
}

// ============= VERSION ENDPOINTS =============

export async function getVersions(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/versions${queryString ? '?' + queryString : ''}`;
  return makeRequest(endpoint, { method: 'GET' });
}

export async function getVersionMetadata() {
  return makeRequest('/versions/metadata', { method: 'GET' });
}

// ============= UTILITY =============

export function getApiVersion() {
  return API_VERSION;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export default {
  // Version info
  API_VERSION,
  API_BASE_URL,
  getApiVersion,
  getApiBaseUrl,
  
  // Machines
  getMachines,
  getMachineDetail,
  getMachineState,
  
  // Dashboard
  getDashboard,
  getMachineKPIs,
  getMachineKPITrend,
  
  // Logging
  logDowntime,
  logQuality,
  logRollWeight,
  acknowledgeAlert,
  
  // Events/History
  getEvents,
  getEventCount,
  getKPISnapshot,
  getKPISnapshots,
  getMachineEventStats,
  
  // Exports
  triggerExport,
  getExportHistory,
  getExportById,
  getExportStatus,
  getRecentExports,
  verifyExport,
  
  // Health
  getHealth,
  checkDatabaseHealth,
  checkExportHealth,
  
  // Telegram
  getTelegramStatus,
  updateTelegramConfig,
  
  // Version
  getVersions,
  getVersionMetadata
};
