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

# Kill any existing Next.js processes on our ports
echo -e "${YELLOW}Cleaning up existing processes...${NC}"
pkill -f "next dev -p 3001" 2>/dev/null || true
pkill -f "next dev -p 3002" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true  # Kill any other next dev processes
sleep 2

# Clear Next.js build caches to ensure fresh builds
echo -e "${YELLOW}Clearing build caches...${NC}"
if [ -d "apps/frontend/.next" ]; then
    rm -rf apps/frontend/.next
    echo -e "${GREEN}✓ Frontend cache cleared${NC}"
fi
if [ -d "apps/backend/.next" ]; then
    rm -rf apps/backend/.next
    echo -e "${GREEN}✓ Backend cache cleared${NC}"
fi

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

# Wait for backend to start with initialization logs
echo -e "${YELLOW}Waiting for backend to start...${NC}"
echo -e "${YELLOW}Looking for SDK initialization...${NC}"
sleep 8  # Give more time for SDK initialization

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