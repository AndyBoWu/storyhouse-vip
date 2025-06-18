#!/bin/bash

echo "🛑 Stopping StoryHouse local services..."

# Kill processes by port
echo "Killing processes on port 3001 (frontend)..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "No process found on port 3001"

echo "Killing processes on port 3002 (backend)..."
lsof -ti:3002 | xargs kill -9 2>/dev/null || echo "No process found on port 3002"

# Also kill by process name pattern
echo "Killing any remaining next/node processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "node.*apps/frontend" 2>/dev/null || true
pkill -f "node.*apps/backend" 2>/dev/null || true

echo "✅ All services stopped!"