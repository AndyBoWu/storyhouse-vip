#!/bin/bash

# Script to remove ALL chapters from ALL books in R2 storage
# This will keep book metadata and covers but remove all chapter content

echo "🧹 Removing All Chapters from Books"
echo "=================================="

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

echo "🔍 Finding all chapter files..."
chapter_files=$(aws s3 ls s3://$R2_BUCKET_NAME/books/ --endpoint-url=$AWS_ENDPOINT_URL --recursive | grep "chapters/ch.*\.json" | awk '{print $4}')

if [ -z "$chapter_files" ]; then
    echo "✅ No chapter files found to remove"
    exit 0
fi

echo "📋 Found the following chapter files:"
echo "$chapter_files"
echo ""

read -p "⚠️  Are you sure you want to remove ALL chapter files? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ Operation cancelled"
    exit 0
fi

echo ""
echo "🗑️  Removing chapter files..."

count=0
for file in $chapter_files; do
    echo "   Removing: $file"
    aws s3 rm "s3://$R2_BUCKET_NAME/$file" --endpoint-url=$AWS_ENDPOINT_URL
    if [ $? -eq 0 ]; then
        ((count++))
    else
        echo "❌ Failed to remove: $file"
    fi
done

echo ""
echo "✅ Successfully removed $count chapter files"
echo ""

echo "📊 Remaining files in books/ prefix:"
aws s3 ls s3://$R2_BUCKET_NAME/books/ --endpoint-url=$AWS_ENDPOINT_URL --recursive

echo ""
echo "🎉 Chapter cleanup completed!"