#!/bin/bash

# Script to set NEXT_PUBLIC_API_BASE_URL environment variable in Cloudflare Pages

echo "🔧 Setting NEXT_PUBLIC_API_BASE_URL for Cloudflare Pages..."

# Set the API base URL
npx wrangler pages secret put NEXT_PUBLIC_API_BASE_URL \
  --project-name storyhouse-vip \
  --env production <<< "https://api-testnet.storyhouse.vip"

echo "✅ Environment variable set successfully!"
echo ""
echo "Note: The deployment will need to be re-triggered for the changes to take effect."
echo "You can do this by:"
echo "1. Making a commit and pushing to trigger auto-deploy"
echo "2. Or manually re-deploying from the Cloudflare dashboard"