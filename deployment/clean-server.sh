#!/bin/bash

# Clean Server Script for ARQ Deployment
# Removes docker images, containers, and logs to free up disk space
# Usage: ./clean-server.sh

set -e

echo "========================================"
echo "Starting server cleanup..."
echo "========================================"

# Stop all running docker containers
echo "Stopping all docker containers..."
docker stop $(docker ps -aq) 2>/dev/null || true

# Remove all stopped containers
echo "Removing stopped containers..."
docker rm $(docker ps -aq) 2>/dev/null || true

# Remove all dangling images
echo "Removing dangling docker images..."
docker image prune -f 2>/dev/null || true

# Remove all dangling volumes
echo "Removing dangling docker volumes..."
docker volume prune -f 2>/dev/null || true

# Clean up docker build cache
echo "Cleaning docker build cache..."
docker builder prune -f 2>/dev/null || true

# Remove log files older than 30 days
echo "Cleaning up old log files..."
find /var/log -type f -name "*.log" -mtime +30 -delete 2>/dev/null || true

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

# Clear system package manager cache
echo "Clearing system package cache..."
if command -v apt-get &> /dev/null; then
  apt-get clean
  apt-get autoclean
fi

# Check disk usage before and after
echo ""
echo "========================================"
echo "Cleanup completed!"
echo "========================================"
echo "Disk usage:"
df -h / | grep -v "^Filesystem"
echo ""
echo "Docker disk usage:"
docker system df || true
echo ""
echo "Cleanup Summary:"
echo "- Stopped all containers"
echo "- Removed all dangling images and volumes"
echo "- Cleaned build cache"
echo "- Removed old log files (>30 days)"
echo "- Cleared npm and package caches"
echo "========================================
