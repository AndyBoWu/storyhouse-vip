/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure for Cloudflare deployment
  experimental: {
    runtime: 'edge',
  },
  
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // API base URL for hybrid deployment
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  },
}

module.exports = nextConfig
