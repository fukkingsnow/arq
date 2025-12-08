# Variant A Deployment Guide

## Overview

Variant A is a Python 2.7 compatible deployment stack for ARQ on Beget hosting when Python 3 and Docker access are not available. This variant uses:

- **Language**: Python 2.7
- **Web Server**: Gunicorn (WSGI application server)
- **Reverse Proxy**: Nginx
- **Database**: MySQL (pre-configured on Beget)
- **Cache**: Redis (optional, pre-configured on Beget)
- **Deployment Environment**: Beget hosting (romasaw4.beget.tech)

## Prerequisites

1. SSH access to romasaw4@romasaw4.beget.tech
2. Python 2.7 available on the server
3. Git access
4. Nginx installed and running
5. MySQL access
6. 200+ MB free disk space for application and logs

## Installation Steps

### 1. Prepare the Environment

```bash
# Connect to the server
ssh romasaw4@romasaw4.beget.tech

# Create necessary directories
mkdir -p ~/arq ~/logs ~/run

# Verify Python 2.7 is available
python2.7 --version
```

### 2. Clone the Repository

```bash
cd ~/arq
git clone https://github.com/fukkingsnow/arq.git .
git checkout main
```

### 3. Create Virtual Environment

```bash
# Install virtualenv if not present
pip install virtualenv

# Create Python 2.7 virtual environment
virtualenv -p /usr/bin/python2.7 venv

# Activate virtual environment
source venv/bin/activate
```

### 4. Install Dependencies

```bash
# Upgrade pip
pip install --upgrade pip setuptools

# Install Gunicorn and requirements
pip install gunicorn==19.9.0
pip install gevent

# Install project dependencies
if [ -f requirements.txt ]; then
    pip install -r requirements.txt
fi

# Deactivate virtual environment
deactivate
```

### 5. Configure Gunicorn

Copy the pre-configured Gunicorn configuration:

```bash
# Configuration is in config/gunicorn_config.py
# No additional setup required
# Gunicorn will bind to localhost:8000
```

### 6. Configure Nginx

```bash
# Copy Nginx configuration to sites-available
sudo cp ~/arq/config/nginx.conf /etc/nginx/sites-available/arq

# Create symbolic link to enable the site
sudo ln -sf /etc/nginx/sites-available/arq /etc/nginx/sites-enabled/arq

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 7. Start the Application

```bash
# Option A: Manual startup
cd ~/arq
source venv/bin/activate
gunicorn --config config/gunicorn_config.py src.main:app

# Option B: Background startup
cd ~/arq
source venv/bin/activate
gunicorn --config config/gunicorn_config.py src.main:app &
echo $! > ~/run/gunicorn.pid
deactivate

# Verify application is running
curl http://localhost:8000/health
```

## Automated Deployment

For automated deployment, use the provided script:

```bash
cd ~/arq
bash scripts/deploy_variant_a.sh
```

This script will:
1. Create necessary directories
2. Clone/update repository
3. Set up virtual environment
4. Install dependencies
5. Configure Nginx
6. Start Gunicorn
7. Perform health checks

## Systemd Service (Optional)

To run Gunicorn as a systemd service:

```bash
# Create service file
sudo tee /etc/systemd/system/arq.service > /dev/null <<EOF
[Unit]
Description=ARQ Application (Gunicorn)
After=network.target

[Service]
User=romasaw4
WorkingDirectory=/home/romasaw4/arq
ExecStart=/home/romasaw4/arq/venv/bin/gunicorn --config config/gunicorn_config.py src.main:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable arq
sudo systemctl start arq
sudo systemctl status arq
```

## Monitoring and Logs

```bash
# View Gunicorn logs
tail -f ~/logs/gunicorn_error.log

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check application status
curl https://arqio.ru/health
```

## Troubleshooting

### Gunicorn won't start
- Check Python 2.7 virtual environment
- Verify dependencies are installed
- Check log files: `~/logs/gunicorn_error.log`

### Nginx returns 502 Bad Gateway
- Verify Gunicorn is running: `ps aux | grep gunicorn`
- Check Nginx logs: `/var/log/nginx/error.log`
- Verify Gunicorn is listening on 127.0.0.1:8000

### Database connection errors
- Verify MySQL credentials in application config
- Test MySQL connection: `mysql -h localhost -u user -p`

## Performance Tuning

- Adjust `workers` in `config/gunicorn_config.py` based on CPU count
- Enable gzip compression in Nginx (already configured)
- Use Redis for session caching (optional)
- Monitor memory usage and adjust worker count if needed

## Upgrading to Variant B

If support provides Python 3 access or Docker permissions:

1. Follow the Variant B deployment guide
2. Pull latest code: `git pull origin main`
3. Switch to Python 3 and FastAPI
4. Use Docker containers for better isolation

See `DEPLOYMENT_PLAN.md` for full deployment strategy.

## Support

For issues or questions:
1. Check application logs
2. Review this deployment guide
3. 
## Deployment Status - PHASE 4.4 COMPLETE

### SUCCESS: Live Deployment Active

**Date**: November 22, 2025, 15:16 MSK
**Application Status**: RUNNING
**Process ID**: 10538
**Port**: http://127.0.0.1:8000

#### Implementation Details
- Python 2.7 + wsgiref (no pip/virtualenv required)
- ASCII-only deployment script
- nohup with log redirection
- Clean error logs
4. Submit ticket to Beget support
5. Check GitHub issues: https://github.com/fukkingsnow/arq/issues
