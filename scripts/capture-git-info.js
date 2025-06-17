#!/usr/bin/env node

/**
 * Captures git information during build time
 * This script generates environment variables for git commit and branch info
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getGitInfo() {
  try {
    // Get git commit hash
    const gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    
    // Get git branch name
    const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    
    // Get last commit message
    const gitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    
    // Get commit timestamp
    const gitTimestamp = execSync('git log -1 --pretty=%cI', { encoding: 'utf8' }).trim();
    
    return {
      GIT_COMMIT: gitCommit,
      GIT_BRANCH: gitBranch,
      GIT_COMMIT_MESSAGE: gitMessage,
      GIT_COMMIT_TIMESTAMP: gitTimestamp,
      BUILD_TIME: new Date().toISOString()
    };
  } catch (error) {
    console.warn('Warning: Unable to capture git information:', error.message);
    return {
      GIT_COMMIT: 'unknown',
      GIT_BRANCH: 'unknown',
      GIT_COMMIT_MESSAGE: 'No commit message',
      GIT_COMMIT_TIMESTAMP: new Date().toISOString(),
      BUILD_TIME: new Date().toISOString()
    };
  }
}

// Get git info
const gitInfo = getGitInfo();

// Output as environment variables for build process
console.log('# Git information captured:');
Object.entries(gitInfo).forEach(([key, value]) => {
  console.log(`${key}="${value}"`);
});

// Export for use in build scripts
module.exports = gitInfo;