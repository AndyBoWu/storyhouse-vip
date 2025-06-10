#!/bin/bash

# Script to set clean R2 environment variables in Vercel
# These are the exact values that work locally

echo "Setting clean R2 environment variables in Vercel..."

# R2 Storage Configuration
npx vercel env add R2_ACCOUNT_ID production <<< "0da36f4eefbf1078c5a04b966e8cd90d"
npx vercel env add R2_ACCESS_KEY_ID production <<< "d94190e672c32c8e653a139998374b09"
npx vercel env add R2_SECRET_ACCESS_KEY production <<< "09e7a04caaed4c04b3a990bfd04eaac35b4003e3a553ac199afd477fd0cceecc"
npx vercel env add R2_BUCKET_NAME production <<< "storyhouse-content"
npx vercel env add R2_ENDPOINT production <<< "0da36f4eefbf1078c5a04b966e8cd90d.r2.cloudflarestorage.com"
npx vercel env add R2_PUBLIC_URL production <<< "https://0da36f4eefbf1078c5a04b966e8cd90d.r2.cloudflarestorage.com/storyhouse-content"

echo "Environment variables set successfully!"