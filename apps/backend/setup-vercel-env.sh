#!/bin/bash

echo "🔧 Setting up Vercel environment variables for storyhouse-backend..."

# R2 Environment Variables
echo "Setting R2 configuration..."
echo "0da36f4eefbf1078c5a04b966e8cd90d" | vercel env add R2_ACCOUNT_ID production
echo "d94190e672c32c8e653a139998374b09" | vercel env add R2_ACCESS_KEY_ID production
echo "09e7a04caaed4c04b3a990bfd04eaac35b4003e3a553ac199afd477fd0cceecc" | vercel env add R2_SECRET_ACCESS_KEY production
echo "storyhouse-content" | vercel env add R2_BUCKET_NAME production
echo "0da36f4eefbf1078c5a04b966e8cd90d.r2.cloudflarestorage.com" | vercel env add R2_ENDPOINT production
echo "https://0da36f4eefbf1078c5a04b966e8cd90d.r2.cloudflarestorage.com/storyhouse-content" | vercel env add R2_PUBLIC_URL production

# Story Protocol Environment Variables
echo "Setting Story Protocol configuration..."
echo "https://aeneid.storyrpc.io" | vercel env add STORY_RPC_URL production
echo "https://aeneid.storyscan.io" | vercel env add STORY_EXPLORER_URL production
echo "0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d" | vercel env add STORY_SPG_NFT_CONTRACT production
echo "0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d" | vercel env add NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT production

# API Configuration
echo "Setting API configuration..."
echo "https://api-testnet.storyhouse.vip" | vercel env add NEXT_PUBLIC_API_BASE_URL production
echo "true" | vercel env add NEXT_PUBLIC_ENABLE_TESTNET production

echo "✅ All environment variables set successfully!"
echo "🚀 Now run: vercel --prod"