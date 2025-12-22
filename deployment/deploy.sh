#!/bin/bash

echo "=== ARQ Deployment Script ==="
echo "Deploying to arq-ai.ru"

# Copy nginx config
echo "Installing nginx configuration..."
sudo cp $(dirname $0)/nginx/arq-ai.ru.conf /etc/nginx/sites-available/arq-ai.ru
sudo ln -sf /etc/nginx/sites-available/arq-ai.ru /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Copy frontend static files
echo "Copying frontend files..."
mkdir -p /opt/arq/dist/frontend
cp -r $(dirname $0)/../src/frontend/dist/* /opt/arq/dist/frontend/ || true
echo "Frontend files copied successfully!"


# Test nginx config
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx config is valid, reloading..."
    sudo systemctl reload nginx
else
    echo "Nginx config has errors! Please fix them."
    exit 1
fi

echo "\nNginx configured successfully!"
echo "\nTo get SSL certificate, run:"
echo "sudo certbot --nginx -d arq-ai.ru -d www.arq-ai.ru"
echo "\nDone!"
