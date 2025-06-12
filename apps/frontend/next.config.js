/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standard Next.js configuration for Vercel deployment
  
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
  },
}

module.exports = nextConfig
