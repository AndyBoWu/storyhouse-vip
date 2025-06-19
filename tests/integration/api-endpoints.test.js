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

// Health check endpoint removed - /api/test was a debug endpoint

// Stories endpoint deprecated - use /api/books instead

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

// Debug environment endpoint removed - was exposing sensitive data

// R2 test endpoint removed - was a debug endpoint

// Collections endpoint removed - feature not implemented

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
    { name: 'Books', fn: testBooksEndpoint },
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