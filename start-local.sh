#!/bin/bash

# StoryHouse Local Development Launcher
# Starts both frontend and backend services on separate ports

echo "🚀 Starting StoryHouse Local Development Environment..."
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit
}

# Set trap to cleanup on Ctrl+C
trap cleanup INT

# Check if node_modules exist
if [ ! -d "apps/frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    (cd apps/frontend && npm install)
fi

if [ ! -d "apps/backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    (cd apps/backend && npm install)
fi

# Start Backend API on port 3002
echo -e "\n${BLUE}Starting Backend API on port 3002...${NC}"
(cd apps/backend && npm run dev) &
BACKEND_PID=$!

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend to start...${NC}"
sleep 5

# Start Frontend on port 3001
echo -e "\n${GREEN}Starting Frontend on port 3001...${NC}"
(cd apps/frontend && npm run dev) &
FRONTEND_PID=$!

# Display status
echo -e "\n${GREEN}=================================================="
echo -e "✅ Local Development Environment Started!"
echo -e "=================================================="
echo -e "${BLUE}Backend API:${NC} http://localhost:3002"
echo -e "${BLUE}API Test:${NC} http://localhost:3002/api/test"
echo -e "${GREEN}Frontend:${NC} http://localhost:3001"
echo -e "=================================================="
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Wait for all background processes
wait