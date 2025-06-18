#!/bin/bash

# Trap Ctrl+C and kill all child processes
trap 'echo "Stopping all services..."; kill 0' INT

echo "🚀 Starting StoryHouse local development servers..."

# First, kill any existing processes on the ports
./kill-local.sh

# Start frontend in background
echo "Starting frontend on port 3001..."
cd apps/frontend && npm run dev &
FRONTEND_PID=$!

# Start backend in background
echo "Starting backend on port 3002..."
cd apps/backend && npm run dev &
BACKEND_PID=$!

echo "✅ Both servers starting..."
echo "Frontend PID: $FRONTEND_PID"
echo "Backend PID: $BACKEND_PID"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait $FRONTEND_PID $BACKEND_PID