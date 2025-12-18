#!/bin/bash
# Safe update script for ARQ - with rollback and health checks
# Usage: ./update-safe.sh [branch] [iterations]

set -e

ARQ_DIR="/opt/arq"
BRANCH="${1:-main}"
MAX_ITERATIONS="${2:-1}"
LOG_FILE="${ARQ_DIR}/logs/update-$(date +%Y%m%d_%H%M%S).log"
BACKUP_DIR="${ARQ_DIR}/.backup/$(date +%Y%m%d_%H%M%S)"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Health check function
health_check() {
    log "Performing health check..."
    if curl -sf http://localhost:8888/health > /dev/null 2>&1; then
        log "✓ Health check passed"
        return 0
    else
        log "✗ Health check failed"
        return 1
    fi
}

# Rollback function
rollback() {
    log "Performing rollback..."
    if [ -d "$BACKUP_DIR" ]; then
        cp -r "$BACKUP_DIR"/* "$ARQ_DIR/src" 2>/dev/null || true
        cp -r "$BACKUP_DIR"/../package.json "$ARQ_DIR/" 2>/dev/null || true
        log "✓ Rollback completed"
        pnpm restart arq-backend 2>/dev/null || true
    fi
}

# Start
log "=== ARQ Safe Update Started ==="
log "Branch: $BRANCH"
log "Working directory: $ARQ_DIR"

# Create backup
log "Creating backup..."
mkdir -p "$BACKUP_DIR"
cp -r "$ARQ_DIR/src" "$BACKUP_DIR/" 2>/dev/null || true
cp "$ARQ_DIR/package.json" "$BACKUP_DIR/" 2>/dev/null || true
log "✓ Backup created at $BACKUP_DIR"

# Check current health
if ! health_check; then
    log "Warning: Service already unhealthy before update"
fi

# Update code only
log "Fetching latest code..."
cd "$ARQ_DIR"
git fetch origin $BRANCH --quiet
LOCAL_REV=$(git rev-parse HEAD)
REMOTE_REV=$(git rev-parse origin/$BRANCH)

if [ "$LOCAL_REV" = "$REMOTE_REV" ]; then
    log "✓ Already on latest commit"
else
    log "Updating from $LOCAL_REV to $REMOTE_REV"
    git reset --hard origin/$BRANCH --quiet
    log "✓ Code updated"
fi

# Restart service gracefully
log "Restarting service..."
pnpm restart arq-backend 2>/dev/null || {
    log "✗ Failed to restart service, performing rollback"
    rollback
    exit 1
}

# Wait for service to start
sleep 3

# Health check after update
if health_check; then
    log "=== ✓ Update completed successfully ==="
    exit 0
else
    log "✗ Health check failed after update, performing rollback"
    rollback
    log "=== Update failed - rolled back ==="
    exit 1
fi
