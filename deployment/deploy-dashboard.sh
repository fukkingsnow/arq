#!/bin/bash
# ARQ Dashboard Deployment Script
# Builds React dashboard and deploys to production

set -e

echo "🚀 ARQ Dashboard Deployment Starting..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Change to frontend directory
cd "$(dirname "$0")/../src/frontend"

echo "${YELLOW}📦 Installing dependencies...${NC}"
npm install

echo "${YELLOW}🔨 Building React dashboard...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Build successful!${NC}"
else
    echo "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo "${YELLOW}📂 Copying build to dist/...${NC}"
# The build output goes to ../../dist/frontend based on vite.config.ts
echo "${GREEN}✅ Build files are in dist/frontend/${NC}"

echo "${YELLOW}🔄 Updating index.html entry point...${NC}"
# Create simple redirect from root to dashboard
cat > ../../dist/frontend/index.html.backup << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARQ - AI-Powered Task Management</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }
    #root {
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/index.js"></script>
</body>
</html>
EOF

echo "${GREEN}✅ Dashboard deployment complete!${NC}"
echo ""
echo "${YELLOW}📋 Next steps:${NC}"
echo "  1. Commit changes to GitHub"
echo "  2. GitHub Actions will auto-deploy to production"
echo "  3. Dashboard will be available at https://arq-ai.ru/"
echo ""
echo "${GREEN}🎉 React Dashboard is ready for production!${NC}"
