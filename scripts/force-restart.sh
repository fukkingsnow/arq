#!/bin/bash

# ARQ Force Restart Script
# Убивает процесс на порту 8000 и перезапускает приложение
# Usage: bash scripts/force-restart.sh

echo "================================"
echo "🔄 ARQ Force Restart"
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Kill process on port 8000
echo -e "${YELLOW}[1/3] Killing process on port 8000...${NC}"
PID=$(lsof -ti:8000)

if [ -n "$PID" ]; then
  echo -e "Found process: $PID"
  kill -9 $PID 2>/dev/null
  sleep 2
  echo -e "${GREEN}✅ Process killed${NC}"
else
  echo -e "${YELLOW}⚠️  No process found on port 8000${NC}"
fi

# Step 2: Delete all PM2 processes
echo -e "${YELLOW}[2/3] Cleaning PM2 processes...${NC}"
pm2 delete all 2>/dev/null || echo "No PM2 processes to delete"
sleep 1

# Step 3: Start fresh PM2 process
echo -e "${YELLOW}[3/3] Starting fresh application...${NC}"
cd /opt/arq || exit 1

# Start with PM2
pm2 start dist/main.js --name arq-backend

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Application started successfully${NC}"
  sleep 2
  pm2 list
else
  echo -e "${RED}❌ Failed to start application${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Force restart complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Check application health:"
echo "  curl https://arq-ai.ru/api/v1/arq/health"
echo ""
