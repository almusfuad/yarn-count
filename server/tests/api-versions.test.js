/**
 * API Versioning Tests
 * Comprehensive test suite for API v1 endpoints and versioning infrastructure
 */

import http from 'http';
import assert from 'assert';
import logger from '../utils/logger.js';

const BASE_URL = 'http://localhost:3000';
const API_V1_BASE = `${BASE_URL}/api/v1`;
const API_LEGACY_BASE = `${BASE_URL}/api`;

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Make HTTP request to API
 */
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

/**
 * Run a single test
 */
async function test(name, fn) {
  try {
    await fn();
    testResults.passed++;
    testResults.tests.push({ name, status: 'PASS' });
    console.log(`✓ ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAIL', error: error.message });
    console.error(`✗ ${name}: ${error.message}`);
  }
}

/**
 * Assert helper
 */
function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertExists(value, message) {
  if (!value) {
    throw new Error(`${message}: value does not exist`);
  }
}

// ============= TEST SUITE =============

export async function runTests() {
  console.log('\n🧪 API Versioning Test Suite\n');
  console.log('Testing API v1 endpoints and versioning infrastructure...\n');

  // ---- Version Discovery Tests ----
  
  await test('Version discovery: GET /api/versions', async () => {
    const res = await makeRequest(`${API_LEGACY_BASE}/versions`);
    assertEquals(res.status, 200, 'Status code');
    assertExists(res.body.versions, 'Response has versions');
    assertExists(res.body.metadata, 'Response has metadata');
  });

  await test('Version discovery: GET /api/versions?module=machines', async () => {
    const res = await makeRequest(`${API_LEGACY_BASE}/versions?module=machines`);
    assertEquals(res.status, 200, 'Status code');
    assertExists(res.body.versions, 'Response has versions');
  });

  await test('Version discovery: GET /api/versions?module=dashboard&version=1', async () => {
    const res = await makeRequest(`${API_LEGACY_BASE}/versions?module=dashboard&version=1`);
    assertEquals(res.status, 200, 'Status code');
    assertExists(res.body.moduleName, 'Response has moduleName');
  });

  // ---- Machine Endpoint Tests (Versioned) ----

  await test('Machine endpoints: GET /api/v1/machines', async () => {
    const res = await makeRequest(`${API_V1_BASE}/machines`);
    assertEquals(res.status, 200, 'Status code');
    assertExists(res.body, 'Response body exists');
  });

  await test('Machine endpoints: GET /api/v1/health', async () => {
    const res = await makeRequest(`${API_V1_BASE}/health`);
    assertEquals(res.status, 200, 'Status code');
    assertExists(res.body, 'Response body exists');
  });

  await test('Dashboard endpoints: GET /api/v1/dashboard', async () => {
    const res = await makeRequest(`${API_V1_BASE}/dashboard`);
    assertEquals(res.status, 200, 'Status code');
    assertExists(res.body, 'Response body exists');
  });

  // ---- Legacy Endpoint Tests (Backward Compatibility) ----

  await test('Legacy compatibility: GET /api/machines (redirects to v1)', async () => {
    const res = await makeRequest(`${API_LEGACY_BASE}/machines`);
    assertEquals(res.status, 200, 'Status code (200 or 301 redirect)');
  });

  await test('Legacy compatibility: GET /api/health (redirects to v1)', async () => {
    const res = await makeRequest(`${API_LEGACY_BASE}/health`);
    assertEquals(res.status, 200, 'Status code');
  });

  await test('Legacy compatibility: GET /api/dashboard (redirects to v1)', async () => {
    const res = await makeRequest(`${API_LEGACY_BASE}/dashboard`);
    assertEquals(res.status, 200, 'Status code');
  });

  // ---- Response Header Tests ----

  await test('Response headers: API-Version header present in v1 responses', async () => {
    const res = await makeRequest(`${API_V1_BASE}/health`);
    const hasVersionHeader = res.headers['api-version'] !== undefined;
    if (!hasVersionHeader) {
      throw new Error('API-Version header missing');
    }
  });

  // ---- POST Endpoint Tests ----

  await test('POST endpoints: /api/v1/downtime (returns error for invalid data, but endpoint exists)', async () => {
    const res = await makeRequest(`${API_V1_BASE}/downtime`, {
      method: 'POST',
      body: {}
    });
    // Endpoint exists (not 404), may be 400 for invalid data
    if (res.status === 404) {
      throw new Error('Endpoint does not exist');
    }
  });

  await test('POST endpoints: /api/v1/quality (endpoint exists)', async () => {
    const res = await makeRequest(`${API_V1_BASE}/quality`, {
      method: 'POST',
      body: {}
    });
    if (res.status === 404) {
      throw new Error('Endpoint does not exist');
    }
  });

  await test('POST endpoints: /api/v1/roll-weight with hyphen (not /rollweight)', async () => {
    const res = await makeRequest(`${API_V1_BASE}/roll-weight`, {
      method: 'POST',
      body: {}
    });
    if (res.status === 404) {
      throw new Error('Endpoint /roll-weight not found (bug fix failed)');
    }
  });

  // ---- 404 Tests ----

  await test('404 handling: Invalid versioned endpoint returns 404', async () => {
    const res = await makeRequest(`${API_V1_BASE}/nonexistent`);
    assertEquals(res.status, 404, 'Status code');
  });

  await test('404 handling: Old unversioned /rollweight (without hyphen) is not supported', async () => {
    const res = await makeRequest(`${API_LEGACY_BASE}/rollweight`);
    // Should either be 404 or 301 redirect, but if it works it's the old broken endpoint
    if (res.status === 200 && res.body && !res.body.error) {
      throw new Error('Old /rollweight endpoint still works (bug not fixed)');
    }
  });

  // ---- Summary ----
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Tests Passed: ${testResults.passed}`);
  console.log(`❌ Tests Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.passed + testResults.failed}\n`);

  if (testResults.failed > 0) {
    console.log('Failed Tests:');
    testResults.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
      });
  }

  console.log('='.repeat(60) + '\n');

  return testResults.failed === 0;
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const success = await runTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Test suite error:', error);
    process.exit(1);
  }
}

export default runTests;
