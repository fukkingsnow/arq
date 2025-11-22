# Nginx Domain Configuration - Phase 5

## Overview

This guide covers setting up domain routing and Nginx reverse proxy for the ARQ application on Beget hosting. The application is currently running on http://127.0.0.1:8000 and needs to be accessible via domains:

- arqio.ru
- app.arqio.ru  
- api.arqio.ru

## Current Status

✅ Application deployed and running on port 8000
⏳ Nginx reverse proxy configuration (PHASE 5 - IN PROGRESS)
⏳ SSL certificates setup (PHASE 6)
⏳ Health checks implementation (PHASE 7)
⏳ Production hardening (PHASE 8)

## Beget Hosting Nginx Setup

### Option 1: Using Beget Control Panel (Recommended)

Beget provides a managed Nginx interface through the control panel. To configure domains:

1. Login to Beget control panel (cp.beget.com)
2. Navigate to Domains & Subdomains section
3. For each domain (arqio.ru, app.arqio.ru, api.arqio.ru):
   - Add the domain to your account
   - Configure public_html folder
   - Set up reverse proxy to 127.0.0.1:8000

### Option 2: Manual SSH Configuration

If you have shell access and Nginx management permissions:

```bash
# Connect via SSH
ssh romasaw4@romasaw4.beget.tech

# Navigate to application directory
cd ~/arq

# View the Nginx config from GitHub
cat config/nginx.conf
```

## Application Health Check

Before setting up domain routing, verify the application responds correctly:

```bash
# SSH into server
ssh romasaw4@romasaw4.beget.tech

# Check process status
ps aux | grep run_app

# Test local connectivity (if curl available)
curl http://127.0.0.1:8000/

# Expected response:
# ARQ AI Assistant Backend - Variant A
# Status: OK
```

## Load Balancer Configuration

If Beget provides load balancer option, configure:

- **Upstream**: 127.0.0.1:8000
- **Port**: 80 (HTTP), 443 (HTTPS)
- **Timeout**: 300s
- **Buffer Size**: 128MB

## Monitoring Commands

```bash
# Check Nginx is running
sudo service nginx status

# Test Nginx configuration
sudo nginx -t

# View Nginx error logs
tail -f ~/logs/nginx_error.log

# View Nginx access logs
tail -f ~/logs/nginx_access.log

# Monitor application logs
tail -f ~/logs/app_error.log
```

## Next Steps

1. Set up domains in Beget control panel
2. Configure reverse proxy rules
3. Verify domain accessibility
4. Proceed to Phase 6 (SSL certificates)

## Troubleshooting

**502 Bad Gateway Error**
- Check if application is running: `ps aux | grep run_app`
- Verify port 8000 is accessible
- Check application error logs

**Connection Timeout**
- Verify Nginx can reach 127.0.0.1:8000
- Check firewall rules
- Verify application is responding

**Domain Not Resolving**
- Check DNS settings in Beget control panel
- Verify domain is pointing to correct server IP
- Wait for DNS propagation (up to 48 hours)

## Support

Beget Ticket #2722821 is still open for advanced support if needed.
