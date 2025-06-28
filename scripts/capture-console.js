#!/usr/bin/env node

/**
 * Simple Console Capture Script
 * Run this alongside your dev server to capture console output to a file
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, `console-${new Date().toISOString().split('T')[0]}.log`);

console.log(`📝 Console output will be saved to: ${logFile}`);
console.log(`🔧 To use with Claude Code:`);
console.log(`   1. Run your dev server: npm run dev`);
console.log(`   2. In another terminal: node scripts/capture-console.js`);
console.log(`   3. Claude Code can read the log file at: ${logFile}\n`);

// This would normally connect to your app's console
// For now, it demonstrates the pattern
const mockConsoleCapture = () => {
  const log = (type, ...args) => {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] [${type}] ${args.join(' ')}\n`;
    
    // Write to file
    fs.appendFileSync(logFile, message);
    
    // Also display in terminal
    console.log(message.trim());
  };
  
  // Simulate some console activity
  log('INFO', 'Console capture started');
  log('LOG', 'Example console.log message');
  log('ERROR', 'Example error message');
  log('WARN', 'Example warning');
};

// In a real implementation, this would connect to your browser
mockConsoleCapture();

console.log('\n✅ Log file created. Claude Code can now read it using:');
console.log(`   Read("${logFile}")`);