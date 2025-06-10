#!/bin/bash

# Script to verify chapter 1 upload and determine which storage system was used

echo "🔍 Chapter 1 Upload Verification"
echo "==============================="

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
echo "🕐 Checking uploads from the last 4 hours..."
echo ""

# Get timestamp for 4 hours ago
four_hours_ago=$(date -v-4H '+%Y-%m-%d %H:%M')
echo "🕐 Looking for content uploaded since: $four_hours_ago"
echo ""

echo "🔍 Recent legacy chapter uploads (stories/ prefix):"
echo "=================================================="
aws s3 ls s3://$R2_BUCKET_NAME/stories/ --endpoint-url=$AWS_ENDPOINT_URL --recursive | \
    awk -v threshold="$four_hours_ago" '$1 " " $2 >= threshold' | \
    grep -E "(chapters|chapter)" || echo "   No recent legacy chapters found"

echo ""
echo "🔍 Recent book system chapter uploads (books/ prefix):"
echo "====================================================="
aws s3 ls s3://$R2_BUCKET_NAME/books/ --endpoint-url=$AWS_ENDPOINT_URL --recursive | \
    awk -v threshold="$four_hours_ago" '$1 " " $2 >= threshold' | \
    grep -E "(chapters|chapter)" || echo "   No recent book chapters found"

echo ""
echo "🔍 All recent uploads in last 4 hours:"
echo "======================================"
recent_uploads=$(aws s3 ls s3://$R2_BUCKET_NAME --endpoint-url=$AWS_ENDPOINT_URL --recursive | \
    awk -v threshold="$four_hours_ago" '$1 " " $2 >= threshold')

if [ -n "$recent_uploads" ]; then
    echo "$recent_uploads"
    echo ""
    echo "📊 Summary of recent uploads:"
    total_recent=$(echo "$recent_uploads" | wc -l)
    chapter_recent=$(echo "$recent_uploads" | grep -c -E "(chapters|chapter)")
    echo "   $total_recent total uploads in last 4 hours"
    echo "   $chapter_recent chapter-related uploads"
else
    echo "   No uploads found in the last 4 hours"
fi

echo ""
echo "🔍 Latest chapter content analysis:"
echo "==================================="

# Find the most recent chapter file
latest_chapter=$(aws s3 ls s3://$R2_BUCKET_NAME --endpoint-url=$AWS_ENDPOINT_URL --recursive | \
    grep -E "(chapters|chapter)" | \
    sort -k1,2 | tail -1)

if [ -n "$latest_chapter" ]; then
    chapter_path=$(echo "$latest_chapter" | awk '{print $4}')
    chapter_date=$(echo "$latest_chapter" | awk '{print $1 " " $2}')
    chapter_size=$(echo "$latest_chapter" | awk '{print $3}')
    
    echo "📄 Latest chapter found:"
    echo "   Path: $chapter_path"
    echo "   Date: $chapter_date"
    echo "   Size: $chapter_size bytes"
    echo ""
    
    # Determine storage system
    if [[ "$chapter_path" == stories/* ]]; then
        echo "🏷️  Storage System: LEGACY (stories/ prefix)"
        echo "   This chapter was saved using the legacy story system"
        story_id=$(echo "$chapter_path" | sed 's|stories/\([^/]*\)/.*|\1|')
        echo "   Story ID: $story_id"
    elif [[ "$chapter_path" == books/* ]]; then
        echo "🏷️  Storage System: NEW BOOK SYSTEM (books/ prefix)"
        echo "   This chapter was saved using the new book system"
        book_path=$(echo "$chapter_path" | sed 's|books/\([^/]*/[^/]*\)/.*|\1|')
        echo "   Book Path: $book_path"
    else
        echo "🏷️  Storage System: UNKNOWN"
        echo "   Path doesn't match expected patterns"
    fi
    
    echo ""
    echo "📖 Downloading and analyzing chapter content..."
    
    # Download and show content preview
    temp_file="/tmp/chapter_content.json"
    aws s3 cp s3://$R2_BUCKET_NAME/$chapter_path "$temp_file" --endpoint-url=$AWS_ENDPOINT_URL --quiet
    
    if [ -f "$temp_file" ]; then
        echo "✅ Chapter content downloaded successfully"
        echo ""
        echo "📝 Chapter metadata:"
        if command -v jq >/dev/null 2>&1; then
            echo "   Title: $(jq -r '.title // "N/A"' "$temp_file")"
            echo "   Chapter Number: $(jq -r '.chapterNumber // "N/A"' "$temp_file")"
            echo "   Word Count: $(jq -r '.wordCount // "N/A"' "$temp_file")"
            echo "   Story ID: $(jq -r '.storyId // "N/A"' "$temp_file")"
            echo "   Author: $(jq -r '.blockchain.walletAddress // .metadata.authorAddress // "N/A"' "$temp_file")"
            echo "   IP Asset ID: $(jq -r '.blockchain.ipAssetId // "N/A"' "$temp_file")"
            echo "   Transaction Hash: $(jq -r '.blockchain.transactionHash // "N/A"' "$temp_file")"
            echo "   Published At: $(jq -r '.blockchain.registeredAt // .metadata.publishedAt // "N/A"' "$temp_file")"
            
            # Show content preview
            content_preview=$(jq -r '.content // "N/A"' "$temp_file" | head -c 200)
            echo "   Content Preview: ${content_preview}..."
        else
            echo "   (jq not available - showing raw file size and path only)"
        fi
        
        rm "$temp_file"
    else
        echo "❌ Failed to download chapter content"
    fi
else
    echo "❌ No chapter content found in the bucket"
fi

echo ""
echo "🎯 VERIFICATION RESULT:"
echo "======================="

if [ -n "$latest_chapter" ]; then
    echo "✅ Chapter 1 upload VERIFIED"
    echo "📅 Most recent chapter upload: $chapter_date"
    echo "📁 Storage location: $chapter_path"
    
    # Check if it's recent (within 4 hours)
    if echo "$recent_uploads" | grep -q "$chapter_path"; then
        echo "🕐 Status: RECENTLY UPLOADED (within last 4 hours)"
    else
        echo "🕐 Status: Older upload (more than 4 hours ago)"
    fi
else
    echo "❌ Chapter 1 upload NOT FOUND"
    echo "   No chapter content detected in R2 storage"
fi

echo ""
echo "🔧 Next Steps:"
echo "=============="
if [ -n "$latest_chapter" ] && [[ "$chapter_path" == stories/* ]]; then
    echo "1. ✅ Content is stored in LEGACY system (stories/ prefix)"
    echo "2. 🔄 Consider migrating to new book system if needed"
    echo "3. 📖 Content is accessible via existing story reading system"
elif [ -n "$latest_chapter" ] && [[ "$chapter_path" == books/* ]]; then
    echo "1. ✅ Content is stored in NEW book system (books/ prefix)"
    echo "2. 📖 Content is accessible via book reading system"
else
    echo "1. ❌ No recent chapter uploads found"
    echo "2. 🔍 Check if publishing workflow completed successfully"
    echo "3. 🔧 Verify R2 storage integration is working"
fi