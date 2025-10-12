#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   JSON Viewer - Database Reset Tool   ${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Kill any running dev server
echo -e "${YELLOW}🔍 Checking for running dev server...${NC}"
PID=$(lsof -ti:3456)
if [ ! -z "$PID" ]; then
    echo -e "${YELLOW}⏹️  Stopping dev server (PID: $PID)...${NC}"
    kill -9 $PID 2>/dev/null
    sleep 2
    echo -e "${GREEN}✅ Dev server stopped${NC}\n"
else
    echo -e "${GREEN}✅ No dev server running${NC}\n"
fi

# Reset database
echo -e "${YELLOW}🗑️  Resetting database...${NC}"
echo -e "${YELLOW}   This will delete all data!${NC}\n"

# Drop and recreate database schema
echo -e "${BLUE}📦 Running Prisma migrations...${NC}"
npx prisma migrate reset --force --skip-seed

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database reset failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database reset complete${NC}\n"

# Generate Prisma client
echo -e "${BLUE}🔧 Generating Prisma client...${NC}"
npx prisma generate

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Prisma client generation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prisma client generated${NC}\n"

# Seed database
echo -e "${BLUE}🌱 Seeding database...${NC}"
npx tsx prisma/seed.ts

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database seeding failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database seeded successfully${NC}\n"

# Clear Next.js cache
echo -e "${YELLOW}🧹 Clearing Next.js cache...${NC}"
rm -rf .next
rm -rf node_modules/.cache
echo -e "${GREEN}✅ Cache cleared${NC}\n"

# Start dev server
echo -e "${BLUE}🚀 Starting development server...${NC}"
echo -e "${YELLOW}   Server will start on http://localhost:3456${NC}\n"

# Run dev server
npm run dev