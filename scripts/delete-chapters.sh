#!/bin/bash

# Script to delete chapters using the REST API
# Usage: ./delete-chapters.sh

BOOK_ID="0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7"
ENCODED_BOOK_ID=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$BOOK_ID'))")
API_BASE="http://localhost:3002/api/chapters"

# Chapters to delete (11-15)
CHAPTERS=(11 12 13 14 15)

echo "🗑️ Deleting chapters from book: $BOOK_ID"
echo "📝 Chapters to delete: ${CHAPTERS[@]}"
echo ""

for CHAPTER in "${CHAPTERS[@]}"; do
    echo "Deleting chapter $CHAPTER..."
    URL="$API_BASE/$ENCODED_BOOK_ID/$CHAPTER"
    
    # Send DELETE request
    RESPONSE=$(curl -X DELETE "$URL" -H "Content-Type: application/json" -s -w "\nHTTP_STATUS:%{http_code}")
    
    # Extract HTTP status code
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Chapter $CHAPTER deleted successfully"
        echo "   Response: $BODY"
    else
        echo "❌ Failed to delete chapter $CHAPTER"
        echo "   Status: $HTTP_STATUS"
        echo "   Error: $BODY"
    fi
    echo ""
done

echo "✅ Deletion process complete"