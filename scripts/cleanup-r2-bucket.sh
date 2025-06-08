#!/bin/bash

# Script to safely clean up all contents from Cloudflare R2 bucket
# This script will delete ALL objects in the storyhouse-content bucket

echo "🧹 Cloudflare R2 Bucket Cleanup Script"
echo "======================================"

# Load environment variables
if [ -f "apps/frontend/.env.testnet" ]; then
    export $(grep -v '^#' apps/frontend/.env.testnet | xargs)
    echo "✅ Loaded environment variables from .env.testnet"
else
    echo "❌ Error: .env.testnet file not found"
    exit 1
fi

# Set AWS credentials for R2
export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export AWS_ENDPOINT_URL="https://$R2_ENDPOINT"

echo ""
echo "🔍 Current bucket contents:"
echo "=========================="
aws s3 ls s3://$R2_BUCKET_NAME --endpoint-url=$AWS_ENDPOINT_URL --recursive

echo ""
echo "⚠️  WARNING: This will DELETE ALL contents in the bucket: $R2_BUCKET_NAME"
echo "📊 Objects found:"
aws s3 ls s3://$R2_BUCKET_NAME --endpoint-url=$AWS_ENDPOINT_URL --recursive | wc -l

echo ""
read -p "Are you sure you want to proceed? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Operation cancelled"
    exit 1
fi

echo ""
echo "🗑️  Deleting all objects in bucket: $R2_BUCKET_NAME"
echo "=================================================="

# Delete all objects in the bucket
aws s3 rm s3://$R2_BUCKET_NAME --endpoint-url=$AWS_ENDPOINT_URL --recursive

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully deleted all objects from R2 bucket"
    echo ""
    echo "🔍 Verifying bucket is empty:"
    aws s3 ls s3://$R2_BUCKET_NAME --endpoint-url=$AWS_ENDPOINT_URL --recursive
    
    object_count=$(aws s3 ls s3://$R2_BUCKET_NAME --endpoint-url=$AWS_ENDPOINT_URL --recursive | wc -l)
    if [ $object_count -eq 0 ]; then
        echo "✅ Bucket is now empty!"
    else
        echo "⚠️  Warning: $object_count objects still remain"
    fi
else
    echo "❌ Error occurred during deletion"
    exit 1
fi

echo ""
echo "🎉 R2 bucket cleanup completed successfully!"