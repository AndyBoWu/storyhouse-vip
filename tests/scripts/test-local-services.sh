#!/bin/bash

# Test script for local services

echo "🧪 Testing StoryHouse Local Services..."
echo "======================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test backend
echo -e "\n${YELLOW}Testing Backend API (port 3002)...${NC}"
backend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/test 2>/dev/null)
if [ "$backend_response" = "200" ]; then
    echo -e "${GREEN}✅ Backend API is running${NC}"
    echo "   Response: $(curl -s http://localhost:3002/api/test)"
else
    echo -e "${RED}❌ Backend API is not responding (HTTP $backend_response)${NC}"
fi

# Test frontend
echo -e "\n${YELLOW}Testing Frontend (port 3001)...${NC}"
frontend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ 2>/dev/null)
if [ "$frontend_response" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend is not responding (HTTP $frontend_response)${NC}"
fi

# Test API endpoints
echo -e "\n${YELLOW}Testing API Endpoints...${NC}"
endpoints=(
    "/api/stories"
    "/api/collections"
    "/api/discovery"
    "/api/security"
)

for endpoint in "${endpoints[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002$endpoint 2>/dev/null)
    if [ "$response" = "200" ] || [ "$response" = "405" ]; then
        echo -e "${GREEN}✅ $endpoint (HTTP $response)${NC}"
    else
        echo -e "${RED}❌ $endpoint (HTTP $response)${NC}"
    fi
done

echo -e "\n======================================"
echo "Test complete!"