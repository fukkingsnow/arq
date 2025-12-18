#!/bin/bash

# ARQ Deployment Script
# This script safely deploys ARQ application
# USAGE: chmod +x deploy.sh && ./deploy.sh

set -e  # Exit on any error

echo "🚀 ARQ Deployment Started"
echo "========================="

cd /opt/arq

# 1. Stop old PM2 processes
echo "📝 Cleaning up old PM2 processes..."
pm2 delete all 2>/dev/null || true
sleep 1

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# 3. Build backend
echo "🏗️  Building backend..."
npm run build

# 4. Build frontend
echo "🏗️  Building frontend..."
cd src/frontend && npm run build && cd ../..

# 5. Start PM2 process
echo "▶️  Starting PM2 process..."
pm2 start dist/main.js --name "arq-backend" --cwd /opt/arq

# 6. Wait for process to stabilize
sleep 2

# 7. Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# 8. Setup PM2 startup
echo "⚙️  Setting up PM2 startup..."
pm2 startup systemd -u root --hp /root --update

# 9. Reload nginx
echo "🔄 Reloading nginx..."
sudo nginx -t
sudo systemctl reload nginx

# 10. Verification
echo "✅ Verifying deployment..."
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo "Checking API health..."
curl -s http://localhost:8000/api/v1/arq/health | jq . || echo "API not responding yet, wait a moment"

echo ""
echo "========================="
echo "✅ Deployment complete!"
echo "🌐 Visit: https://arq-ai.ru/"
echo "📊 API: https://arq-ai.ru/api/v1/arq/health"
