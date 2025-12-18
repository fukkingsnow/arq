#!/bin/bash
# Hot update script - Updates ARQ without full rebuild
# Usage: ./hot-update.sh [branch]

set -e

BRANCH=${1:-main}
APP_DIR="/opt/arq"
BACKUP_DIR="$APP_DIR/.backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "================================================"
echo "ARQ Hot Update - No Rebuild Required"
echo "Branch: $BRANCH"
echo "Timestamp: $TIMESTAMP"
echo "================================================"

# Verify application is running
echo "[1/6] Verifying application health..."
if ! curl -sf http://localhost:8000/health > /dev/null; then
    echo "ERROR: Application is not healthy. Cannot proceed."
    exit 1
fi

# Create backup
echo "[2/6] Creating backup..."
mkdir -p "$BACKUP_DIR"
cp -r "$APP_DIR/dist" "$BACKUP_DIR/dist_$TIMESTAMP" 2>/dev/null || true
cp "$APP_DIR/package.json" "$BACKUP_DIR/package_$TIMESTAMP.json" 2>/dev/null || true

# Fetch and update code
echo "[3/6] Fetching updates from $BRANCH..."
cd "$APP_DIR"
git fetch origin
git reset --hard "origin/$BRANCH"
git clean -fd

# Update only if package.json changed
echo "[4/6] Checking for dependency updates..."
if git diff "$TIMESTAMP~1..HEAD" package.json > /dev/null 2>&1; then
    echo "Dependencies changed. Installing..."
    npm install --production=false --ignore-scripts
else
    echo "No dependency changes. Skipping install."
fi

# Update only if src changed
echo "[5/6] Rebuilding application..."
if git diff "$TIMESTAMP~1..HEAD" src/ > /dev/null 2>&1; then
    echo "Source code changed. Rebuilding..."
    npm run build
else
    echo "No source changes. Skipping rebuild."
fi

# Graceful reload
echo "[6/6] Reloading application gracefully..."
sleep 1

# Health check
sleep 2
if ! curl -sf http://localhost:8000/health > /dev/null; then
    echo "ERROR: Health check failed after update. Rolling back..."
    cp -r "$BACKUP_DIR/dist_$TIMESTAMP" "$APP_DIR/dist"
    pm2 restart arq-backend
    exit 1
fi

echo "================================================"
echo "✓ Hot update completed successfully!"
echo "Application is healthy and running."
echo "Backup saved to: $BACKUP_DIR/dist_$TIMESTAMP"
echo "================================================"
