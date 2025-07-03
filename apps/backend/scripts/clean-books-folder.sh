#!/bin/bash

# Clean Books Folder Bash Script
# This script removes all contents from the books/ folder in the R2 bucket
# Usage: ./scripts/clean-books-folder.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: .env.local file not found${NC}"
    exit 1
fi

# Check required environment variables
if [ -z "$R2_ACCOUNT_ID" ] || [ -z "$R2_ACCESS_KEY_ID" ] || [ -z "$R2_SECRET_ACCESS_KEY" ] || [ -z "$R2_BUCKET_NAME" ]; then
    echo -e "${RED}Error: Missing required R2 environment variables${NC}"
    echo "Please ensure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME are set"
    exit 1
fi

# Set AWS credentials for R2
export AWS_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY
export AWS_DEFAULT_REGION=auto

# R2 endpoint
R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
BUCKET_NAME=$R2_BUCKET_NAME
TARGET_PATH="books/"

echo "📚 R2 Books Folder Cleanup Script"
echo "================================="
echo "Bucket: $BUCKET_NAME"
echo "Target: $TARGET_PATH"
echo ""

# Function to count objects
count_objects() {
    aws s3 ls "s3://${BUCKET_NAME}/${TARGET_PATH}" \
        --endpoint-url="$R2_ENDPOINT" \
        --recursive \
        2>/dev/null | wc -l | tr -d ' '
}

# Count objects first
echo "🔍 Scanning books folder..."
OBJECT_COUNT=$(count_objects)

if [ "$OBJECT_COUNT" -eq "0" ]; then
    echo -e "${GREEN}✨ Books folder is already empty!${NC}"
    exit 0
fi

echo -e "${YELLOW}Found $OBJECT_COUNT objects in books folder${NC}"
echo ""

# Show sample of files
echo "📋 Sample of files to be deleted:"
aws s3 ls "s3://${BUCKET_NAME}/${TARGET_PATH}" \
    --endpoint-url="$R2_ENDPOINT" \
    --recursive \
    2>/dev/null | head -10 | awk '{print "  - " $4}'

if [ "$OBJECT_COUNT" -gt "10" ]; then
    echo "  ... and $((OBJECT_COUNT - 10)) more files"
fi

# Interactive confirmation (skip if --force flag is provided)
if [ "$1" != "--force" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  WARNING: This will permanently delete ALL books and chapters!${NC}"
    echo "This action cannot be undone."
    echo ""
    read -p "Are you sure you want to continue? Type 'yes' to confirm: " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        echo -e "${RED}❌ Operation cancelled${NC}"
        exit 0
    fi
    
    read -p "Type 'DELETE BOOKS' to confirm this destructive action: " CONFIRM2
    
    if [ "$CONFIRM2" != "DELETE BOOKS" ]; then
        echo -e "${RED}❌ Confirmation text does not match. Operation cancelled${NC}"
        exit 0
    fi
fi

# Perform deletion
echo ""
echo "🔄 Starting deletion process..."
START_TIME=$(date +%s)

# Delete all objects in books folder
aws s3 rm "s3://${BUCKET_NAME}/${TARGET_PATH}" \
    --endpoint-url="$R2_ENDPOINT" \
    --recursive \
    2>&1 | {
        COUNT=0
        while IFS= read -r line; do
            if [[ $line == *"delete:"* ]]; then
                COUNT=$((COUNT + 1))
                if [ $((COUNT % 100)) -eq 0 ]; then
                    echo "  Deleted $COUNT objects..."
                fi
            fi
        done
        echo -e "${GREEN}✅ Deleted $COUNT objects${NC}"
    }

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Verify deletion
REMAINING=$(count_objects)
if [ "$REMAINING" -eq "0" ]; then
    echo ""
    echo -e "${GREEN}✅ Successfully cleaned books folder!${NC}"
    echo "Duration: ${DURATION} seconds"
    echo "🎉 Books folder is now empty and ready for testing!"
else
    echo ""
    echo -e "${YELLOW}⚠️  Warning: $REMAINING objects still remain${NC}"
    echo "You may need to run the script again"
fi