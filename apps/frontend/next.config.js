/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standard Next.js configuration for Vercel deployment
  
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
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  },
}

module.exports = nextConfig
