# ARQ Deployment Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Nginx
- PM2 global installation: `npm install -g pm2`

## Installation Steps

### 1. Clone and Install Dependencies
```bash
cd /opt/arq
npm install --legacy-peer-deps
```

### 2. Environment Setup
Ensure `.env` has these critical settings:
```env
PORT=8000
APP_PORT=8000
DATABASE_URL=postgresql+asyncpg://arq_dev:arq_dev_password@localhost:5433/arq_development
NODE_ENV=production
```

### 3. Build
```bash
npm run build
# Frontend build
cd src/frontend && npm run build && cd ../..
```

### 4. PM2 Setup (NOT systemd)
```bash
# Remove conflicting systemd service if exists
sudo rm -f /etc/systemd/system/arq.service
sudo systemctl daemon-reload

# Start with PM2
pm2 start dist/main.js --name "arq-backend"
pm2 save
pm2 startup
```

### 5. Nginx Configuration
Use config at `/etc/nginx/sites-enabled/arq-ai.ru`:
```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name arq-ai.ru www.arq-ai.ru;

    ssl_certificate /etc/letsencrypt/live/arq-ai.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/arq-ai.ru/privkey.pem;

    if ($scheme = http) {
        return 301 https://$server_name$request_uri;
    }

    root /opt/arq/dist/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ @backend;
    }

    location @backend {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Then reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## CRITICAL NOTES
- **Use PM2, NOT systemd** - Prevents port conflicts and simplifies management
- **Always use `--legacy-peer-deps`** - Required for dependency resolution
- **PORT must be 8000** - API expects this port, nginx proxies HTTPS to it
- **SSL Certificates** - Use Let's Encrypt with Certbot
- **Database** - PostgreSQL must be running on port 5433

## Verification
```bash
# Check PM2 status
pm2 status

# Check API health
curl https://arq-ai.ru/api/v1/arq/health

# Check ports
sudo netstat -tlnp | grep -E '8000|443'
```

## Troubleshooting

### Port Already in Use
```bash
sudo lsof -i :8000
sudo kill -9 <PID>
```

### Dependencies Conflict
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Nginx Not Proxying
- Check: `sudo nginx -t`
- Reload: `sudo systemctl reload nginx`
- Logs: `sudo tail -f /var/log/nginx/error.log`

### PM2 Restart Issues
```bash
pm2 stop all
pm2 delete all
pm2 start dist/main.js --name "arq-backend"
```
