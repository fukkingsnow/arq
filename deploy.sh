#!/bin/bash

# ARQ Deployment Script
# This script safely deploys ARQ application
# Usage: /home/sh -c 'deploy.sh'

set -e # Exit on any error

echo "=== ARQ Deployment Started"
echo "============================"

cd /opt/arq

# 1. Stop old pm2 processes
echo "=== Cleaning up old processes..."
pm2 delete all 2>/dev/null || true
sleep 2
# Kill any lingering node processes
pkill -f "node" || true
pkill -f "npm" || true
sleep 2

# 2. Clean up old deployment
echo "=== Pulling latest code..."
git fetch origin main
git reset --hard origin/main

# 3. Clean old files with proper cleanup
echo "=== Cleaning old dependencies..."
# Use find + xargs to properly remove with retries
if [ -d "node_modules" ]; then
  echo "Removing node_modules directory..."
  rm -rf node_modules || {
    # Retry with force on nested directories
    find node_modules -type d -exec chmod 755 {} \;
    rm -rf node_modules || true
  }
fi

if [ -d "dist" ]; then
  echo "Removing dist directory..."
  rm -rf dist || true
fi

# 4. Clean up logs
echo "Cleaning disk space..."
rm -rf /root/.pm2/pm2.log || true
rm -rf /root/.pm2/logs/* || true
rm -rf /tmp/**/*.log || true
find /opt/arq -name "*.log" -delete || true

echo "Total reclaimed space: "
df -h | head -2

# 5. Install dependencies
echo "=== Installing dependencies..."
npm install --legacy-peer-deps

# 6. Build application
echo "=== Building backend..."
npm run build

# 7. Build frontend
echo "=== Building frontend..."
cd src/frontend && npm run build && cd /opt/arq || true

# 8. Start pm2 process
echo "=== Starting PM2 process..."
pm2 start dist/main.js --name "arq-backend" --cwd /opt/arq

sleep 2

# 9. Save pm2 configuration
echo "=== Saving PM2 configuration..."
pm2 save

# 10. Setup PM2 startup
echo "=== Setting up PM2 startup..."
pm2 startup systemd -u root -hp /root --update

# 10.5. Setup nginx (if not installed)
echo "=== Setting up nginx..."
if ! command -v nginx &> /dev/null; then
  echo "Installing nginx..."
  apt-get update -qq
  apt-get install -y nginx > /dev/null 2>&1
fi

# Copy nginx configuration from repo
if [ -f "config/nginx.conf" ]; then
  echo "Copying nginx configuration..."
  cp config/nginx.conf /etc/nginx/sites-available/arq-ai.ru || true
  ln -sf /etc/nginx/sites-available/arq-ai.ru /etc/nginx/sites-enabled/arq-ai.ru || true
  nginx -t || true
fi


# 11. Reload nginx (if available)
echo "=== Reloading nginx..."
systemctl start nginx || true
systemctl enable nginx || true

if command -v nginx &> /dev/null; then
  if systemctl is-active --quiet nginx; then
    systemctl restart nginx || true
  else
    echo "nginx is installed but not running. Skipping reload."
  fi
else
  echo "nginx is not installed. Skipping reload."
fi

echo "=== Deployment successful! ==="
echo "Application is running and accessible at http://arq-ai.ru"
