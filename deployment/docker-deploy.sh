#!/bin/bash

# Docker Deployment Script for ARQ
# Stage 3: Production Deployment
# Usage: ./docker-deploy.sh

set -e

echo "========================================"
echo "ARQ Docker Deployment - Stage 3"
echo "========================================"

# Configuration
DEPLOY_DIR="/app/arq"
GIT_REPO="https://github.com/fukkingsnow/arq.git"
BRANCH="main"
IMAGE_NAME="ghcr.io/fukkingsnow/arq"
CONTAINER_NAME="arq-api"
LOGS_DIR="$DEPLOY_DIR/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Preparing environment...${NC}"
mkdir -p "$LOGS_DIR"

echo -e "${YELLOW}Step 2: Pulling latest code...${NC}"
cd "$DEPLOY_DIR"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo -e "${YELLOW}Step 3: Creating .env file if missing...${NC}"
if [ ! -f "$DEPLOY_DIR/.env" ]; then
    echo -e "${RED}Error: .env file not found at $DEPLOY_DIR/.env${NC}"
    echo "Create .env file with required variables:"
    echo "  - DATABASE_URL"
    echo "  - REDIS_URL"
    echo "  - JWT_SECRET"
    echo "  - NODE_ENV=production"
    exit 1
fi

echo -e "${YELLOW}Step 4: Running server cleanup...${NC}"
if [ -f "$DEPLOY_DIR/deployment/clean-server.sh" ]; then
    bash "$DEPLOY_DIR/deployment/clean-server.sh"
fi

echo -e "${YELLOW}Step 5: Building Docker image...${NC}"
docker build \
    -f "$DEPLOY_DIR/deployment/Dockerfile.prod" \
    -t "$IMAGE_NAME:latest" \
    -t "$IMAGE_NAME:$(git rev-parse --short HEAD)" \
    "$DEPLOY_DIR"

echo -e "${YELLOW}Step 6: Starting Docker Compose services...${NC}"
cd "$DEPLOY_DIR"
docker-compose -f deployment/docker-compose.prod.yml down || true
docker-compose -f deployment/docker-compose.prod.yml up -d

echo -e "${YELLOW}Step 7: Waiting for services to start...${NC}"
sleep 10

echo -e "${YELLOW}Step 8: Verifying health checks...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ ARQ API is healthy${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ ARQ API health check failed after 30 attempts${NC}"
        docker-compose -f deployment/docker-compose.prod.yml logs
        exit 1
    fi
    echo "Waiting for ARQ API... ($i/30)"
    sleep 1
done

echo -e "${YELLOW}Step 9: Checking database connectivity...${NC}"
docker-compose -f deployment/docker-compose.prod.yml exec -T postgres pg_isready -U arq -d arq || echo "${YELLOW}Warning: Database not ready yet${NC}"

echo -e "${YELLOW}Step 10: Displaying service logs...${NC}"
docker-compose -f deployment/docker-compose.prod.yml logs -f arq --tail=50 &
LOG_PID=$!

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Services running:"
docker-compose -f deployment/docker-compose.prod.yml ps
echo ""
echo "Access points:"
echo "  - API: http://localhost:3000"
echo "  - Health: http://localhost:3000/api/health"
echo "  - Nginx: http://localhost:80"
echo ""
echo "To view logs: docker-compose -f deployment/docker-compose.prod.yml logs -f"
echo "To stop: docker-compose -f deployment/docker-compose.prod.yml down"
echo ""
echo -e "${YELLOW}Note: Logs are being streamed above (PID: $LOG_PID)${NC}"
