#!/bin/bash

# Set Vercel environment variables for backend deployment
# This ensures R2 authentication works in production

echo "🔧 Setting Vercel environment variables for backend..."

# Change to backend directory
cd apps/backend

# Set R2 environment variables (clean values without quotes)
vercel env add R2_ACCOUNT_ID 0da36f4eefbf1078c5a04b966e8cd90d production
vercel env add R2_ACCESS_KEY_ID d94190e672c32c8e653a139998374b09 production  
vercel env add R2_SECRET_ACCESS_KEY 09e7a04caaed4c04b3a990bfd04eaac35b4003e3a553ac199afd477fd0cceecc production
vercel env add R2_BUCKET_NAME storyhouse-content production
vercel env add R2_ENDPOINT 0da36f4eefbf1078c5a04b966e8cd90d.r2.cloudflarestorage.com production
vercel env add R2_PUBLIC_URL https://0da36f4eefbf1078c5a04b966e8cd90d.r2.cloudflarestorage.com/storyhouse-content production

# Set Story Protocol environment variables
vercel env add STORY_RPC_URL https://aeneid.storyrpc.io production
vercel env add STORY_EXPLORER_URL https://aeneid.storyscan.io production
vercel env add STORY_SPG_NFT_CONTRACT 0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d production
vercel env add NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT 0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d production

# Set API Base URL
vercel env add NEXT_PUBLIC_API_BASE_URL https://api-testnet.storyhouse.vip production

# Enable testnet mode
vercel env add NEXT_PUBLIC_ENABLE_TESTNET true production

echo "✅ Environment variables set for backend deployment"
echo "🚀 Now deploy the backend with: vercel --prod"