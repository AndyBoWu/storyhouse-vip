#!/usr/bin/env node

/**
 * Browser Console Monitor for Claude Code
 * This script launches a browser, navigates to your app, and captures all console output
 */

const puppeteer = require('puppeteer');

async function monitorConsole(url = 'http://localhost:3001') {
  console.log(`🚀 Starting browser console monitor for ${url}`);
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true if you don't need to see the browser
    devtools: true,  // Opens DevTools automatically
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();
    
    const timestamp = new Date().toISOString();
    const prefix = {
      log: '📝',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      debug: '🐛'
    }[type] || '📌';
    
    console.log(`${prefix} [${timestamp}] [${type.toUpperCase()}] ${text}`);
    
    if (location.url) {
      console.log(`   📍 ${location.url}:${location.lineNumber}:${location.columnNumber}`);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.error('❌ [PAGE ERROR]', error.message);
  });

  // Capture request failures
  page.on('requestfailed', request => {
    console.error('❌ [REQUEST FAILED]', request.url(), request.failure().errorText);
  });

  // Navigate to the page
  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log('✅ Page loaded successfully');
    
    // Keep the script running
    console.log('📊 Monitoring console output... Press Ctrl+C to stop');
    
    // Optionally inject a helper to capture more details
    await page.evaluate(() => {
      window.__consoleLogs = [];
      const originalConsole = { ...console };
      
      ['log', 'error', 'warn', 'info', 'debug'].forEach(method => {
        console[method] = function(...args) {
          window.__consoleLogs.push({
            method,
            args: args.map(arg => {
              try {
                return JSON.stringify(arg);
              } catch {
                return String(arg);
              }
            }),
            timestamp: new Date().toISOString(),
            stack: new Error().stack
          });
          originalConsole[method].apply(console, args);
        };
      });
    });
    
    // Periodically check for new logs
    setInterval(async () => {
      const logs = await page.evaluate(() => {
        const logs = window.__consoleLogs || [];
        window.__consoleLogs = [];
        return logs;
      });
      
      logs.forEach(log => {
        console.log(`📋 [CAPTURED] ${log.method}: ${log.args.join(', ')}`);
      });
    }, 1000);
    
  } catch (error) {
    console.error('❌ Failed to load page:', error);
  }
}

// Handle command line arguments
const url = process.argv[2] || 'http://localhost:3001';
monitorConsole(url);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down console monitor...');
  process.exit(0);
});