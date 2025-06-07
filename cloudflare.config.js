/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages specific optimizations
  output: 'standalone',
  
  // Image optimization - disable for Cloudflare Pages
  images: {
    unoptimized: true,
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Security headers (same as vercel config)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // Cloudflare Pages environment configuration
  env: {
    NEXT_RUNTIME: 'edge',
  },
  
  // Experimental features for better Cloudflare compatibility
  experimental: {
    // Enable server components optimization
    serverComponentsExternalPackages: ['@aws-sdk/client-s3'],
  },
}

module.exports = nextConfig