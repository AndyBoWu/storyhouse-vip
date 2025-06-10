#!/bin/bash

# Script to check for specific chapter content in R2 bucket
# Focused on finding chapter 1 content

echo "📖 Checking for Chapter Content in R2"
echo "===================================="

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
echo ""

echo "🔍 Looking for chapters in book structure:"
echo "=========================================="
echo "Expected structure: books/{author}/{slug}/chapters/ch{number}/"
echo ""

# Check for any chapter-related content
aws s3 ls s3://$R2_BUCKET_NAME --endpoint-url=$AWS_ENDPOINT_URL --recursive | grep -i chapter

echo ""
echo "🔍 Looking for specific chapter patterns:"
echo "========================================"
echo "Checking for 'ch1' or 'chapters/1' patterns:"
aws s3 ls s3://$R2_BUCKET_NAME --endpoint-url=$AWS_ENDPOINT_URL --recursive | grep -E "(ch1|chapters/1)"

echo ""
echo "🔍 Recently uploaded content (last 2 hours):"
echo "============================================="
echo "Looking for content uploaded since $(date -v-2H '+%Y-%m-%d %H:%M')"
aws s3 ls s3://$R2_BUCKET_NAME --endpoint-url=$AWS_ENDPOINT_URL --recursive | awk '$1 >= "2025-06-08" && $2 >= "17:30:00"'

echo ""
echo "🔍 Specific book directories:"
echo "============================="
for book_path in $(aws s3 ls s3://$R2_BUCKET_NAME/books/ --endpoint-url=$AWS_ENDPOINT_URL | grep "PRE" | awk '{print $2}'); do
    echo "📁 $book_path"
    # Check for chapters folder in each book
    aws s3 ls s3://$R2_BUCKET_NAME/books/$book_path --endpoint-url=$AWS_ENDPOINT_URL --recursive | grep chapters
done

echo ""
echo "🔍 Legacy stories with chapters:"
echo "==============================="
aws s3 ls s3://$R2_BUCKET_NAME/stories/ --endpoint-url=$AWS_ENDPOINT_URL --recursive

echo ""
echo "🎯 Summary:"
echo "==========="
chapter_count=$(aws s3 ls s3://$R2_BUCKET_NAME --endpoint-url=$AWS_ENDPOINT_URL --recursive | grep -c -i chapter)
echo "   $chapter_count chapter-related objects found"

recent_count=$(aws s3 ls s3://$R2_BUCKET_NAME --endpoint-url=$AWS_ENDPOINT_URL --recursive | awk '$1 >= "2025-06-08" && $2 >= "17:30:00"' | wc -l)
echo "   $recent_count recently uploaded objects (since 17:30)"