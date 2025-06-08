#!/bin/bash

# Cloudflare Pages Environment Variables Setup Script
# This script sets all required environment variables for the hybrid deployment

echo "Setting Cloudflare Pages environment variables..."

# API Proxy Configuration (Critical for hybrid architecture)
echo "https://testnet.storyhouse.vip" | npx wrangler pages secret put VERCEL_API_URL --project-name storyhouse-vip
echo "https://testnet.storyhouse.vip" | npx wrangler pages secret put NEXT_PUBLIC_API_BASE_URL --project-name storyhouse-vip

# R2 Storage Configuration (from .env.testnet)
echo "d94190e672c32c8e653a139998374b09" | npx wrangler pages secret put R2_ACCESS_KEY_ID --project-name storyhouse-vip
echo "09e7a04caaed4c04b3a990bfd04eaac35b4003e3a553ac199afd477fd0cceecc" | npx wrangler pages secret put R2_SECRET_ACCESS_KEY --project-name storyhouse-vip
echo "storyhouse-content" | npx wrangler pages secret put R2_BUCKET_NAME --project-name storyhouse-vip
echo "0da36f4eefbf1078c5a04b966e8cd90d.r2.cloudflarestorage.com" | npx wrangler pages secret put R2_ENDPOINT --project-name storyhouse-vip
echo "https://0da36f4eefbf1078c5a04b966e8cd90d.r2.cloudflarestorage.com/storyhouse-content" | npx wrangler pages secret put R2_PUBLIC_URL --project-name storyhouse-vip

# Story Protocol Configuration
echo "https://aeneid.storyrpc.io" | npx wrangler pages secret put STORY_PROTOCOL_RPC_URL --project-name storyhouse-vip
echo "1315" | npx wrangler pages secret put STORY_PROTOCOL_CHAIN_ID --project-name storyhouse-vip

# Contract Addresses (from CLAUDE.md)
echo "0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E" | npx wrangler pages secret put NEXT_PUBLIC_TIP_TOKEN_ADDRESS --project-name storyhouse-vip
echo "0xf5ae031ba92295c2ae86a99e88f09989339707e5" | npx wrangler pages secret put NEXT_PUBLIC_REWARDS_MANAGER_ADDRESS --project-name storyhouse-vip
echo "0xBe60c8Fc35003A063BB04d7d9FC7829eDD3Fe1f5" | npx wrangler pages secret put NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS --project-name storyhouse-vip
echo "0xF76c479C11051599e2Bd0a3ee08e91b16F0EB2d0" | npx wrangler pages secret put NEXT_PUBLIC_TIP_DISTRIBUTION_ADDRESS --project-name storyhouse-vip
echo "0x80f37ABAE1F973C2D31e0B14C14Da02E67AB9bE5" | npx wrangler pages secret put NEXT_PUBLIC_ENGAGEMENT_TRACKER_ADDRESS --project-name storyhouse-vip
echo "0xc1d96F2993B99d5a6FcBF80F14c1FcdD84F0E973" | npx wrangler pages secret put NEXT_PUBLIC_REFERRAL_SYSTEM_ADDRESS --project-name storyhouse-vip
echo "0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d" | npx wrangler pages secret put NEXT_PUBLIC_SPG_NFT_CONTRACT_ADDRESS --project-name storyhouse-vip

# App Configuration
echo "true" | npx wrangler pages secret put NEXT_PUBLIC_ENABLE_TESTNET --project-name storyhouse-vip
echo "production" | npx wrangler pages secret put NODE_ENV --project-name storyhouse-vip

echo ""
echo "✅ Environment variables set!"
echo ""
echo "⚠️  You still need to manually set this sensitive variable:"
echo "  - OPENAI_API_KEY"
echo ""
echo "Set it with:"
echo "  npx wrangler pages secret put OPENAI_API_KEY --project-name storyhouse-vip"
echo ""
echo "After setting the variable, redeploy with:"
echo "  npx wrangler pages deploy apps/frontend/out --project-name storyhouse-vip"