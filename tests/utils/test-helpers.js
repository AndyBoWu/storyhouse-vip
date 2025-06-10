/**
 * Test Utilities for StoryHouse.vip
 * Common helpers for all test suites
 */

const { createPublicClient, http } = require('viem');

// Story Protocol Aeneid Testnet configuration
const storyTestnet = {
  id: 1315,
  name: 'Story Protocol Aeneid Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'IP Token',
    symbol: 'IP',
  },
  rpcUrls: {
    default: {
      http: ['https://aeneid.storyrpc.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Story Scan',
      url: 'https://aeneid.storyscan.io',
    },
  },
};

/**
 * Create a test client for Story Protocol
 */
function createTestClient() {
  return createPublicClient({
    chain: storyTestnet,
    transport: http(),
  });
}

/**
 * Test API endpoint with timeout
 */
async function testApiEndpoint(url, options = {}) {
  const { timeout = 5000, method = 'GET', body = null } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : null,
    });
    
    clearTimeout(timeoutId);
    return {
      status: response.status,
      ok: response.ok,
      data: await response.json().catch(() => null),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

/**
 * Wait for a condition to be true
 */
async function waitFor(condition, timeout = 10000, interval = 100) {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Generate test wallet address
 */
function generateTestAddress() {
  return '0x' + Math.random().toString(16).slice(2, 42).padStart(40, '0');
}

/**
 * Log test result with colors
 */
function logResult(name, success, details = '') {
  const colors = {
    green: '\033[0;32m',
    red: '\033[0;31m',
    yellow: '\033[1;33m',
    reset: '\033[0m',
  };
  
  const icon = success ? '✅' : '❌';
  const color = success ? colors.green : colors.red;
  
  console.log(`${color}${icon} ${name}${colors.reset}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

module.exports = {
  storyTestnet,
  createTestClient,
  testApiEndpoint,
  waitFor,
  generateTestAddress,
  logResult,
};