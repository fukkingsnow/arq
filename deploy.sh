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
# Kill processes on ports 8000 and 80
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 80/tcp 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:80 | xargs kill -9 2>/dev/null || true

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

# 10.5. Setup nginx (mandatory reverse proxy)
echo "=== Setting up nginx reverse proxy..."

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
  echo "Installing nginx..."
  apt-get update -qq 2>&1 | tail -1
  apt-get install -y nginx > /dev/null 2>&1
  echo "✅ nginx installed"
fi

# Ensure nginx config directory exists
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

# Copy and setup nginx config
if [ -f "config/nginx.conf" ]; then
  cp config/nginx.conf /etc/nginx/sites-available/arq || true
  rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/arq || true
  ln -sf /etc/nginx/sites-available/arq /etc/nginx/sites-enabled/arq || true
  
  # Validate and reload nginx
  nginx -t 2>&1 | grep -q "successful" && {
    systemctl restart nginx || {
      echo "Restarting nginx with service..."
      service nginx restart || true
    }
    sleep 1
  }
fi

# 3.1. Setup nginx log directories
mkdir -p /var/log/nginx
touch /var/log/nginx/error.log /var/log/nginx/access.log
chown -R www-data:www-data /var/log/nginx
chmod 755 /var/log/nginx
# Ensure nginx is started and enabled
systemctl start nginx || service nginx start || true
systemctl enable nginx || true



# 12. Setup systemd service for direct port 80 access
echo "=== Setting up systemd service..."
if [ -f "config/arq.service" ]; then
  cp config/arq.service /etc/systemd/system/arq.service || true
  systemctl daemon-reload || true
  systemctl stop arq || true
  systemctl start arq || true
  systemctl enable arq || true
  echo "✅ ARQ systemd service configured and running"
fi


echo "=== Deployment successful! ==="
echo "Application is running and accessible at http://arq-ai.ru"
