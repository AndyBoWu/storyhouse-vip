/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure for static export to Cloudflare Pages (SPA approach)
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  
  images: {
    unoptimized: true, // Required for static export
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // API base URL for SPA deployment
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-testnet.storyhouse.vip',
  },
}

module.exports = nextConfig
