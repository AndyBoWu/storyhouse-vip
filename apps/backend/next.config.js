/** @type {import('next').NextConfig} */

// Capture git information at build time
const { execSync } = require('child_process');

function getGitInfo() {
  try {
    return {
      commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
      branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(),
      message: execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim(),
    };
  } catch (error) {
    console.warn('Warning: Unable to capture git information:', error.message);
    return {
      commit: 'unknown',
      branch: 'unknown',
      message: 'No commit message',
    };
  }
}

const gitInfo = getGitInfo();
console.log('Backend build - Git info:', gitInfo);

const nextConfig = {
  // Disable static optimization for API routes
  trailingSlash: false,
  // Skip TypeScript errors during production build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimize for API-only backend
  experimental: {
    optimizeCss: false,
    // Enable build cache
    turbotrace: {
      logLevel: 'info',
    },
  },
  compiler: {
    // Disable styled-jsx for API backend
    styledComponents: false,
    emotion: false,
  },
  // Disable styled-jsx compilation
  webpack: (config, { isServer }) => {
    // Remove styled-jsx loader
    config.module.rules = config.module.rules.filter(rule => {
      if (rule.use && Array.isArray(rule.use)) {
        return !rule.use.some(use => 
          use && use.loader && use.loader.includes('styled-jsx')
        );
      }
      return true;
    });
    return config;
  },
  // Build-time environment variables for version tracking
  env: {
    BUILD_TIME: new Date().toISOString(),
    // Use Vercel env vars if available, otherwise use git info
    GIT_COMMIT: process.env.VERCEL_GIT_COMMIT_SHA || gitInfo.commit,
    GIT_BRANCH: process.env.VERCEL_GIT_COMMIT_REF || gitInfo.branch,
    GIT_COMMIT_MESSAGE: process.env.VERCEL_GIT_COMMIT_MESSAGE || gitInfo.message,
  },
  // Body parser configuration moved to individual API route files
  // CORS configuration for cross-origin requests from frontend
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

module.exports = nextConfig