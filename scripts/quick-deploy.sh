#!/bin/bash

# ARQ Quick Deploy Script
# Автоматизирует: git pull + pm2 restart
# Usage: bash scripts/quick-deploy.sh

echo "================================"
echo "🚀 ARQ Quick Deploy"
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Pull latest changes
echo -e "${YELLOW}[1/3] Pulling latest changes from GitHub...${NC}"
cd /opt/arq || exit 1
git pull origin main
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Git pull successful${NC}"
else
    echo -e "${RED}❌ Git pull failed${NC}"
    exit 1
fi

# Step 2: Restart PM2 process
echo -e "${YELLOW}[2/3] Restarting arq-backend service...${NC}"
pm2 restart arq-backend
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PM2 restart successful${NC}"
else
    echo -e "${RED}❌ PM2 restart failed${NC}"
    exit 1
fi

# Step 3: Check status
echo -e "${YELLOW}[3/3] Checking process status...${NC}"
pm2 status

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Verify deployment:"
echo "  curl https://arq-ai.ru/api/v1/arq/health"
echo ""
