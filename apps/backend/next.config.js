/** @type {import('next').NextConfig} */
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