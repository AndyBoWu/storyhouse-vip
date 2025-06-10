#!/usr/bin/env node

/**
 * API Endpoints Integration Tests
 * Tests all StoryHouse API endpoints for basic functionality
 */

const { testApiEndpoint, logResult } = require('../utils/test-helpers');
const { mockApiResponses } = require('../utils/mock-data');

// Test configuration
const BASE_URLS = {
  local: 'http://localhost:3002/api',
  testnet: 'https://api-testnet.storyhouse.vip/api',
  production: 'https://api.storyhouse.vip/api'
};

const TEST_ENV = process.env.TEST_ENV || 'local';
const BASE_URL = BASE_URLS[TEST_ENV];

console.log(`🧪 Testing API Endpoints (${TEST_ENV.toUpperCase()})`);
console.log(`Base URL: ${BASE_URL}`);
console.log('='.repeat(50));

/**
 * Test health check endpoint
 */
async function testHealthCheck() {
  const result = await testApiEndpoint(`${BASE_URL}/test`);
  
  const success = result.ok && result.status === 200;
  logResult('Health Check', success, 
    success ? `Status: ${result.status}` : `Error: ${result.error || result.status}`);
  
  return success;
}

/**
 * Test stories endpoint
 */
async function testStoriesEndpoint() {
  const result = await testApiEndpoint(`${BASE_URL}/stories`);
  
  const success = result.ok && result.data && Array.isArray(result.data.stories);
  logResult('Stories Endpoint', success,
    success ? `Found ${result.data.stories.length} stories` : `Error: ${result.error || result.status}`);
  
  return success;
}

/**
 * Test books endpoint
 */
async function testBooksEndpoint() {
  const result = await testApiEndpoint(`${BASE_URL}/books`);
  
  const success = result.ok && result.data && Array.isArray(result.data.books);
  logResult('Books Endpoint', success,
    success ? `Found ${result.data.books.length} books` : `Error: ${result.error || result.status}`);
  
  return success;
}

/**
 * Test debug environment endpoint
 */
async function testDebugEnv() {
  const result = await testApiEndpoint(`${BASE_URL}/debug-env`);
  
  const success = result.ok && result.data;
  logResult('Debug Environment', success,
    success ? 'Environment info retrieved' : `Error: ${result.error || result.status}`);
  
  return success;
}

/**
 * Test R2 storage endpoint
 */
async function testR2Storage() {
  const result = await testApiEndpoint(`${BASE_URL}/test-r2`);
  
  const success = result.ok;
  logResult('R2 Storage', success,
    success ? 'R2 connection verified' : `Error: ${result.error || result.status}`);
  
  return success;
}

/**
 * Test collections endpoint
 */
async function testCollections() {
  const result = await testApiEndpoint(`${BASE_URL}/collections`);
  
  const success = result.ok && result.data;
  logResult('Collections Endpoint', success,
    success ? 'Collections retrieved' : `Error: ${result.error || result.status}`);
  
  return success;
}

/**
 * Test discovery endpoint
 */
async function testDiscovery() {
  const result = await testApiEndpoint(`${BASE_URL}/discovery`);
  
  const success = result.ok && result.data;
  logResult('Discovery Endpoint', success,
    success ? 'Discovery feed retrieved' : `Error: ${result.error || result.status}`);
  
  return success;
}

/**
 * Run all API tests
 */
async function runApiTests() {
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Stories', fn: testStoriesEndpoint },
    { name: 'Books', fn: testBooksEndpoint },
    { name: 'Debug Env', fn: testDebugEnv },
    { name: 'R2 Storage', fn: testR2Storage },
    { name: 'Collections', fn: testCollections },
    { name: 'Discovery', fn: testDiscovery },
  ];

  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, success: result });
    } catch (error) {
      logResult(test.name, false, `Exception: ${error.message}`);
      results.push({ name: test.name, success: false, error: error.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`📊 API Tests Summary: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('🎉 All API tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check logs above.');
    const failed = results.filter(r => !r.success);
    failed.forEach(test => {
      console.log(`   ❌ ${test.name}: ${test.error || 'Unknown error'}`);
    });
  }
  
  return passed === total;
}

// Run tests if called directly
if (require.main === module) {
  runApiTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runApiTests };