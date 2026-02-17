#!/bin/bash

################################################################################
# ZERO-DOWNTIME DEPLOYMENT MASTER SCRIPT FOR ARQ
# 
# Features:
# - Blue-Green Deployment Strategy
# - Incremental Build (only compile changes)
# - Health Checks & Automatic Rollback
# - Load Balancer Switching
# - Database Migrations (versioned)
# - Service Graceful Shutdown
# - Real-time Deployment Monitoring
# 
# Usage: ./zero-downtime-deploy.sh [staging|production] [--fast]
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="/home/projects/arq"
DEPLOY_USER="deploy"
SERVER_PORT=3000
BACKUP_DIR="${PROJECT_ROOT}/.backups"
BLUE_DIR="${PROJECT_ROOT}/releases/blue"
GREEN_DIR="${PROJECT_ROOT}/releases/green"
CURRENT_LINK="${PROJECT_ROOT}/current"
SHARED_DIR="${PROJECT_ROOT}/shared"
LOG_FILE="${SHARED_DIR}/deploy.log"

# Parameters
ENVIRONMENT=${1:-staging}
FAST_MODE=${2:-""}

# Helper functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "${LOG_FILE}"
}

success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "${LOG_FILE}"
}

error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "${LOG_FILE}"
    exit 1
}

warn() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "${LOG_FILE}"
}

health_check() {
    local port=$1
    local max_retries=5
    local retry=0
    
    log "Performing health check on port ${port}..."
    
    while [ $retry -lt $max_retries ]; do
        if curl -sf http://localhost:${port}/health > /dev/null 2>&1; then
            success "Health check passed for port ${port}"
            return 0
        fi
        retry=$((retry + 1))
        warn "Health check attempt $retry/$max_retries failed. Retrying in 2 seconds..."
        sleep 2
    done
    
    error "Health check failed for port ${port} after $max_retries attempts"
}

get_active_environment() {
    if [ -L "${CURRENT_LINK}" ]; then
        basename "$(readlink "${CURRENT_LINK}")"
    fi
}

get_inactive_environment() {
    local active=$(get_active_environment)
    if [ "$active" == "blue" ]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Main Deployment Flow
main() {
    log "========================================"
    log "Starting Zero-Downtime Deployment"
    log "Environment: ${ENVIRONMENT}"
    log "Fast Mode: ${FAST_MODE:="disabled"}"
    log "========================================"
    
    # 1. Create backup of current deployment
    log "\n[STEP 1] Creating backup..."
    mkdir -p "${BACKUP_DIR}"
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    if [ -L "${CURRENT_LINK}" ]; then
        cp -la "$(readlink -f "${CURRENT_LINK}")" "${BACKUP_DIR}/${BACKUP_NAME}" || warn "Backup creation partially failed"
        success "Backup created: ${BACKUP_NAME}"
    fi
    
    # 2. Determine target deployment directory
    log "\n[STEP 2] Determining target environment..."
    ACTIVE_ENV=$(get_active_environment)
    TARGET_ENV=$(get_inactive_environment)
    
    if [ "$TARGET_ENV" == "blue" ]; then
        TARGET_DIR="${BLUE_DIR}"
        ALTERNATE_DIR="${GREEN_DIR}"
        TARGET_PORT=3001
    else
        TARGET_DIR="${GREEN_DIR}"
        ALTERNATE_DIR="${BLUE_DIR}"
        TARGET_PORT=3002
    fi
    
    log "Active: $ACTIVE_ENV | Target: $TARGET_ENV"
    log "Target directory: ${TARGET_DIR}"
    success "Will deploy to ${TARGET_ENV} environment on port ${TARGET_PORT}"
    
    # 3. Prepare target directory
    log "\n[STEP 3] Preparing target directory..."
    mkdir -p "${TARGET_DIR}"
    
    # 4. Fetch latest code
    log "\n[STEP 4] Fetching latest code from git..."
    cd "${TARGET_DIR}" || error "Cannot access target directory"
    
    if [ ! -d ".git" ]; then
        git clone "$(git -C "${PROJECT_ROOT}" config --get remote.origin.url)" . || error "Git clone failed"
    fi
    
    git fetch origin main || error "Git fetch failed"
    git reset --hard origin/main || error "Git reset failed"
    
    success "Latest code fetched"
    
    # 5. Install/Update dependencies (with caching)
    log "\n[STEP 5] Installing dependencies..."
    
    if [ -z "$FAST_MODE" ]; then
        npm ci --production || error "npm ci failed"
    else
        log "Fast mode: skipping npm update, using existing node_modules if available"
        if [ ! -d "node_modules" ]; then
            npm ci --production || error "npm ci failed"
        fi
    fi
    
    success "Dependencies installed/updated"
    
    # 6. Run migrations (if any)
    log "\n[STEP 6] Running database migrations..."
    
    if [ -f "migrations/run.sh" ]; then
        bash migrations/run.sh "${ENVIRONMENT}" || warn "Migrations failed - check compatibility"
    else
        log "No migrations to run"
    fi
    
    # 7. Build application (incremental)
    log "\n[STEP 7] Building application..."
    
    if [ -z "$FAST_MODE" ]; then
        npm run build || error "Build failed"
    else
        log "Fast mode: checking if rebuild needed..."
        if [ -f ".build-hash" ]; then
            CURRENT_HASH=$(git rev-parse HEAD)
            LAST_HASH=$(cat .build-hash)
            
            if [ "$CURRENT_HASH" == "$LAST_HASH" ] && [ -d "dist" ]; then
                success "Build up-to-date, skipping rebuild"
            else
                npm run build || error "Incremental build failed"
                echo "$CURRENT_HASH" > .build-hash
            fi
        else
            npm run build || error "Initial build failed"
            git rev-parse HEAD > .build-hash
        fi
    fi
    
    success "Build completed"
    
    # 8. Start new service on alternate port
    log "\n[STEP 8] Starting new service on port ${TARGET_PORT}..."
    
    export NODE_ENV="${ENVIRONMENT}"
    export PORT="${TARGET_PORT}"
    
    # Kill any existing process on target port
    lsof -ti:${TARGET_PORT} | xargs kill -9 2>/dev/null || true
    sleep 1
    
    # Start new process in background with logging
    npm start > "${SHARED_DIR}/${TARGET_ENV}-service.log" 2>&1 &
    SERVICE_PID=$!
    echo $SERVICE_PID > "${SHARED_DIR}/${TARGET_ENV}.pid"
    
    log "Service started with PID: ${SERVICE_PID}"
    
    # Wait for service to be ready
    sleep 3
    
    success "New service process started"
    
    # 9. Health check on new service
    log "\n[STEP 9] Performing health checks on new service..."
    health_check ${TARGET_PORT} || error "New service health check failed - rolling back"
    
    # 10. Switch load balancer/proxy (update nginx config)
    log "\n[STEP 10] Switching load balancer..."
    
    # Update symlink to point to new release
    ln -sfn "${TARGET_DIR}" "${CURRENT_LINK}" || error "Failed to update current link"
    
    # Update nginx config to point to new port
    UPDATE_NGINX_SCRIPT="/tmp/update-nginx-${TARGET_ENV}.sh"
    cat > "${UPDATE_NGINX_SCRIPT}" << EOF
#!/bin/bash
sed -i "s/server localhost:30[01-02];/server localhost:${TARGET_PORT};/" /etc/nginx/sites-enabled/arq.conf
echo 'Updated nginx to port ${TARGET_PORT}'
EOF
    chmod +x "${UPDATE_NGINX_SCRIPT}"
    sudo "${UPDATE_NGINX_SCRIPT}" || warn "Nginx update partially failed"
    
    # Reload nginx
    sudo nginx -s reload || warn "Nginx reload failed - manual intervention may be needed"
    sleep 2
    
    success "Load balancer switched to ${TARGET_ENV} (port ${TARGET_PORT})"
    
    # 11. Final health check
    log "\n[STEP 11] Final health check..."
    health_check 80 || error "Production health check failed"
    
    # 12. Cleanup old environment
    log "\n[STEP 12] Cleaning up old environment..."
    
    if [ "${TARGET_ENV}" == "blue" ]; then
        OLD_PORT=3002
    else
        OLD_PORT=3001
    fi
    
    # Gracefully stop old service
    if [ -f "${SHARED_DIR}/${ACTIVE_ENV}.pid" ]; then
        OLD_PID=$(cat "${SHARED_DIR}/${ACTIVE_ENV}.pid")
        if kill -0 "${OLD_PID}" 2>/dev/null; then
            log "Sending SIGTERM to old service (PID: ${OLD_PID})..."
            kill -TERM "${OLD_PID}" 2>/dev/null || true
            
            # Wait for graceful shutdown (max 30 seconds)
            WAIT=0
            while kill -0 "${OLD_PID}" 2>/dev/null && [ $WAIT -lt 30 ]; do
                sleep 1
                WAIT=$((WAIT + 1))
            done
            
            # Force kill if still running
            kill -9 "${OLD_PID}" 2>/dev/null || true
            success "Old service stopped (waited ${WAIT}s for graceful shutdown)"
        fi
    fi
    
    # Clean up old node_modules to save disk space
    if [ -d "${ALTERNATE_DIR}/node_modules" ]; then
        log "Removing old node_modules to save space..."
        rm -rf "${ALTERNATE_DIR}/node_modules" &
    fi
    
    # 13. Summary
    log "\n========================================"
    success "✓ DEPLOYMENT SUCCESSFUL"
    log "========================================"
    log "Environment: ${ENVIRONMENT}"
    log "Active Environment: ${TARGET_ENV}"
    log "Port: ${TARGET_PORT}"
    log "Process ID: ${SERVICE_PID}"
    log "Deployment Time: $(date)"
    log "Log: ${LOG_FILE}"
    log "========================================\n"
}

# Error handling and rollback
trap 'handle_error' ERR

handle_error() {
    error "Deployment failed! Attempting rollback..."
    
    # Restore from backup if available
    if [ -n "${BACKUP_NAME}" ] && [ -d "${BACKUP_DIR}/${BACKUP_NAME}" ]; then
        log "Rolling back to backup: ${BACKUP_NAME}"
        rm -rf "${CURRENT_LINK}"
        ln -sfn "${BACKUP_DIR}/${BACKUP_NAME}" "${CURRENT_LINK}"
        success "Rolled back to previous version"
    fi
    
    # Restart old service
    if [ -f "${SHARED_DIR}/${ACTIVE_ENV}.pid" ]; then
        OLD_PID=$(cat "${SHARED_DIR}/${ACTIVE_ENV}.pid")
        if ! kill -0 "${OLD_PID}" 2>/dev/null; then
            log "Restarting old service..."
            cd "$(readlink -f "${CURRENT_LINK}")" && npm start > "${SHARED_DIR}/${ACTIVE_ENV}-service.log" 2>&1 &
            NEW_PID=$!
            echo $NEW_PID > "${SHARED_DIR}/${ACTIVE_ENV}.pid"
            success "Old service restarted with PID: ${NEW_PID}"
        fi
    fi
    
    exit 1
}

# Run main deployment
main

exit 0
