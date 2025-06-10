#!/bin/bash

# Script to check contents of Cloudflare R2 bucket
# This script will list ALL objects in the storyhouse-content bucket

echo "🔍 Cloudflare R2 Bucket Contents Check"
echo "====================================="

# Load environment variables from frontend .env.testnet
if [ -f "../../apps/frontend/.env.testnet" ]; then
    export $(grep -v '^#' ../../apps/frontend/.env.testnet | xargs)
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
echo "📦 Bucket: $R2_BUCKET_NAME"
echo "🔗 Endpoint: $AWS_ENDPOINT_URL"
echo ""

echo "🔍 Checking for books/ prefix:"
echo "=============================="
aws s3 ls s3://$R2_BUCKET_NAME/books/ --endpoint-url=$AWS_ENDPOINT_URL --recursive

echo ""
echo "🔍 Checking for stories/ prefix (legacy):"
echo "=========================================="
aws s3 ls s3://$R2_BUCKET_NAME/stories/ --endpoint-url=$AWS_ENDPOINT_URL --recursive

echo ""
echo "🔍 All bucket contents:"
echo "======================"
aws s3 ls s3://$R2_BUCKET_NAME --endpoint-url=$AWS_ENDPOINT_URL --recursive

echo ""
echo "📊 Total object count:"
total_count=$(aws s3 ls s3://$R2_BUCKET_NAME --endpoint-url=$AWS_ENDPOINT_URL --recursive | wc -l)
echo "   $total_count objects total"

books_count=$(aws s3 ls s3://$R2_BUCKET_NAME/books/ --endpoint-url=$AWS_ENDPOINT_URL --recursive 2>/dev/null | wc -l)
echo "   $books_count objects in books/ prefix"

stories_count=$(aws s3 ls s3://$R2_BUCKET_NAME/stories/ --endpoint-url=$AWS_ENDPOINT_URL --recursive 2>/dev/null | wc -l)
echo "   $stories_count objects in stories/ prefix"

echo ""
echo "🎉 R2 bucket check completed!"