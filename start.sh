#!/bin/bash

# AI Coworking Space Manager - Start Script
# This script sets up and starts the entire application

set -e

echo "============================================="
echo "  AI Coworking Space Manager"
echo "  Starting Application..."
echo "============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}[OK]${NC} Environment variables loaded"
else
  echo -e "${RED}[ERROR]${NC} .env file not found! Please create one."
  exit 1
fi

# Function to kill processes on ports
kill_port() {
  local port=$1
  local pid=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo -e "${YELLOW}[CLEANUP]${NC} Killing process on port $port (PID: $pid)"
    kill -9 $pid 2>/dev/null || true
    sleep 1
  fi
}

# Clean up used ports
echo ""
echo -e "${BLUE}[STEP 1]${NC} Cleaning up ports..."
kill_port 4000
kill_port 3000
echo -e "${GREEN}[OK]${NC} Ports cleaned"

# Check PostgreSQL
echo ""
echo -e "${BLUE}[STEP 2]${NC} Checking PostgreSQL..."
if command -v psql &> /dev/null; then
  echo -e "${GREEN}[OK]${NC} PostgreSQL found"
else
  echo -e "${RED}[ERROR]${NC} PostgreSQL not found. Please install it."
  exit 1
fi

# Create database if it doesn't exist
echo ""
echo -e "${BLUE}[STEP 3]${NC} Setting up database..."
DB_NAME=${DB_NAME:-coworking_space}
DB_USER=${DB_USER:-erolakarsu}

# Check if database exists
if psql -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo -e "${YELLOW}[INFO]${NC} Database '$DB_NAME' already exists"
else
  echo -e "${YELLOW}[INFO]${NC} Creating database '$DB_NAME'..."
  createdb -U "$DB_USER" "$DB_NAME"
  echo -e "${GREEN}[OK]${NC} Database created"
fi

# Run schema
echo -e "${YELLOW}[INFO]${NC} Running schema..."
psql -U "$DB_USER" -d "$DB_NAME" -f backend/db/schema.sql -q 2>/dev/null
echo -e "${GREEN}[OK]${NC} Schema applied"

# Seed data
echo -e "${YELLOW}[INFO]${NC} Seeding data..."
psql -U "$DB_USER" -d "$DB_NAME" -f backend/db/seed.sql -q 2>/dev/null
echo -e "${GREEN}[OK]${NC} Data seeded"

# Install backend dependencies
echo ""
echo -e "${BLUE}[STEP 4]${NC} Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
  npm install --silent
else
  echo -e "${YELLOW}[INFO]${NC} Backend dependencies already installed"
fi
cd ..

# Install frontend dependencies
echo ""
echo -e "${BLUE}[STEP 5]${NC} Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
  npm install --silent
else
  echo -e "${YELLOW}[INFO]${NC} Frontend dependencies already installed"
fi
cd ..

# Copy .env to backend for dotenv
cp .env backend/.env 2>/dev/null || true

# Start backend with nodemon (auto-reload on code changes)
echo ""
echo -e "${BLUE}[STEP 6]${NC} Starting backend server (port 4000) with auto-reload..."
cd backend
npx nodemon server.js &
BACKEND_PID=$!
cd ..
sleep 2

# Start frontend with Vite (HMR - auto-reload on code changes)
echo ""
echo -e "${BLUE}[STEP 7]${NC} Starting frontend (port 3000) with hot reload..."
cd frontend
npx vite --port 3000 --host &
FRONTEND_PID=$!
cd ..

echo ""
echo "============================================="
echo -e "${GREEN}  Application Started Successfully!${NC}"
echo "============================================="
echo ""
echo -e "  Backend API:  ${BLUE}http://localhost:4000${NC}"
echo -e "  Frontend:     ${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "  Login Credentials:"
echo -e "    Email:    ${GREEN}admin@coworkspace.com${NC}"
echo -e "    Password: ${GREEN}password123${NC}"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Trap to clean up on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}[CLEANUP]${NC} Stopping services..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  kill_port 4000
  kill_port 3000
  echo -e "${GREEN}[OK]${NC} All services stopped"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for any process to exit
wait
