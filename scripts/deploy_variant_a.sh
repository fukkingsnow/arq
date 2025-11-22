#!/bin/bash
# Variant A Deployment Script for ARQ Application
# Python 2.7 + Gunicorn + Nginx deployment on Beget hosting
# Usage: bash deploy_variant_a.sh

set -e

# Configuration
APP_HOME="/home/romasaw4/arq"
APP_USER="romasaw4"
VENV_PATH="$APP_HOME/venv"
LOG_DIR="/home/romasaw4/logs"
RUN_DIR="/home/romasaw4/run"
GUNICORN_PID="$RUN_DIR/gunicorn.pid"
GIT_REPO="https://github.com/fukkingsnow/arq.git"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting ARQ Variant A Deployment...${NC}"

# 1. Create necessary directories
echo -e "${YELLOW}Step 1: Creating directories...${NC}"
mkdir -p $APP_HOME $LOG_DIR $RUN_DIR
echo -e "${GREEN}✓ Directories created${NC}"

# 2. Clone or update repository
echo -e "${YELLOW}Step 2: Cloning/updating repository...${NC}"
if [ -d "$APP_HOME/.git" ]; then
    cd $APP_HOME
    git pull origin main
else
    git clone $GIT_REPO $APP_HOME
fi
echo -e "${GREEN}✓ Repository ready${NC}"

# 3. Create Python 2.7 virtual environment
echo -e "${YELLOW}Step 3: Creating Python 2.7 virtual environment...${NC}"
if [ ! -d "$VENV_PATH" ]; then
    virtualenv -p /usr/bin/python2.7 $VENV_PATH
fi
echo -e "${GREEN}✓ Virtual environment ready${NC}"

# 4. Install Python dependencies
echo -e "${YELLOW}Step 4: Installing Python dependencies...${NC}"
source $VENV_PATH/bin/activate
pip install --upgrade pip
pip install gunicorn==19.9.0
pip install gevent
# Add other dependencies from requirements.txt if exists
if [ -f "$APP_HOME/requirements.txt" ]; then
    pip install -r $APP_HOME/requirements.txt
fi
deactivate
echo -e "${GREEN}✓ Dependencies installed${NC}"

# 5. Configure Nginx
echo -e "${YELLOW}Step 5: Configuring Nginx...${NC}"
sudo cp $APP_HOME/config/nginx.conf /etc/nginx/sites-available/arq
sudo ln -sf /etc/nginx/sites-available/arq /etc/nginx/sites-enabled/arq
sudo nginx -t
sudo systemctl restart nginx
echo -e "${GREEN}✓ Nginx configured and restarted${NC}"

# 6. Setup log rotation
echo -e "${YELLOW}Step 6: Setting up log rotation...${NC}"
echo "$LOG_DIR/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 $APP_USER $APP_USER
    sharedscripts
}" | sudo tee /etc/logrotate.d/arq > /dev/null
echo -e "${GREEN}✓ Log rotation configured${NC}"

# 7. Start Gunicorn
echo -e "${YELLOW}Step 7: Starting Gunicorn application server...${NC}"
cd $APP_HOME
source $VENV_PATH/bin/activate
gunicorn --config config/gunicorn_config.py src.main:app &
echo $! > $GUNICORN_PID
deactivate
echo -e "${GREEN}✓ Gunicorn started (PID: $(cat $GUNICORN_PID))${NC}"

# 8. Health check
echo -e "${YELLOW}Step 8: Performing health checks...${NC}"
sleep 2
if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Application health check passed${NC}"
else
    echo -e "${RED}✗ Application health check failed${NC}"
    exit 1
fi

echo -e "${GREEN}ARQ Variant A Deployment completed successfully!${NC}"
echo -e "${GREEN}Application is running at https://arqio.ru${NC}"
