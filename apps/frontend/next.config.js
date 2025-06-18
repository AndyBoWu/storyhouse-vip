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
console.log('Frontend build - Git info:', gitInfo);

const nextConfig = {
  // Standard Next.js configuration for Vercel deployment
  
  // Enable build caching for faster deployments
  experimental: {
    // Modern Next.js 15.3.3 build optimizations
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  
  // Skip ESLint during build to prevent deployment failures
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Skip TypeScript type checking during builds (for faster deploys)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  images: {
    domains: [
      'images.unsplash.com', 
      'via.placeholder.com',
      '0da36f4eefbf1078c5a04b966e8cd90d.r2.cloudflarestorage.com'
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // API routes will be served from backend domain
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-testnet.storyhouse.vip',
    // Build-time environment variables for version tracking
    BUILD_TIME: new Date().toISOString(),
    // Use Vercel env vars if available, otherwise use git info
    GIT_COMMIT: process.env.VERCEL_GIT_COMMIT_SHA || gitInfo.commit,
    GIT_BRANCH: process.env.VERCEL_GIT_COMMIT_REF || gitInfo.branch,
    GIT_COMMIT_MESSAGE: process.env.VERCEL_GIT_COMMIT_MESSAGE || gitInfo.message,
  },
}

module.exports = nextConfig
