/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standard Next.js configuration for Vercel deployment
  
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // API routes will be served from same domain in Vercel
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  },
}

module.exports = nextConfig
