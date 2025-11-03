#!/bin/bash

# Fresh Development Start Script
# Starts database, clears cache, and runs dev server fresh

set -e

echo "🚀 Starting fresh development environment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Start Docker containers (if not already running)
echo -e "\n${BLUE}📦 Starting Docker containers...${NC}"
if docker compose -f config/docker-compose.local.yml ps | grep -q "Up"; then
  echo -e "${GREEN}✓ Docker containers already running${NC}"
else
  docker compose -f config/docker-compose.local.yml up -d postgres redis
  echo -e "${GREEN}✓ Docker containers started${NC}"

  # Wait for PostgreSQL to be ready
  echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
  sleep 3

  # Check if database is ready
  until docker exec config-postgres-1 pg_isready -U json_viewer_user -d json_viewer > /dev/null 2>&1; do
    echo -e "${YELLOW}⏳ Waiting for database...${NC}"
    sleep 1
  done
  echo -e "${GREEN}✓ Database is ready${NC}"
fi

# Step 2: Kill any existing dev server on port 3456
echo -e "\n${BLUE}🔪 Killing existing dev server...${NC}"
lsof -ti:3456 | xargs kill -9 2>/dev/null || echo -e "${GREEN}✓ No existing server to kill${NC}"

# Step 3: Clear Next.js cache
echo -e "\n${BLUE}🧹 Clearing Next.js cache...${NC}"
rm -rf .next node_modules/.cache
echo -e "${GREEN}✓ Cache cleared${NC}"

# Step 4: Start dev server and precompile pages
echo -e "\n${BLUE}🎯 Starting development server...${NC}"
echo -e "${GREEN}✓ Server will start at http://localhost:3456${NC}\n"

# Start dev server in background
npm run dev:next &
DEV_SERVER_PID=$!

# Wait for server and precompile main pages
node scripts/precompile-pages.js

# Bring dev server back to foreground
wait $DEV_SERVER_PID

