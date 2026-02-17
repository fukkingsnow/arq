#!/bin/bash

# ARQ System Health Check Script
# Monitors system health, disk space, and PM2 processes

set -e

echo "=== ARQ System Health Check ==="
echo "Time: $(date)"
echo ""

# Check disk space
echo "📊 Disk Usage:"
df -h / | tail -1 | awk '{print "  Used: "$3" / "$2" ("$5")"}'
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')

if [ $DISK_USAGE -gt 85 ]; then
    echo "  ⚠️  WARNING: Disk usage above 85%"
elif [ $DISK_USAGE -gt 70 ]; then
    echo "  ⚡ NOTICE: Disk usage above 70%"
else
    echo "  ✅ Disk space OK"
fi
echo ""

# Check PM2 processes
echo "🔄 PM2 Process Status:"
pm2 list 2>/dev/null || echo "  ⚠️  PM2 not running or not installed"
echo ""

# Check API Server
echo "🌐 API Server Check:"
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://arq-ai.ru/api/health 2>/dev/null || echo "000")

if [ "$API_RESPONSE" = "200" ] || [ "$API_RESPONSE" = "404" ]; then
    echo "  ✅ API Server is responding"
else
    echo "  ❌ API Server not responding (HTTP: $API_RESPONSE)"
fi
echo ""

# Check Database Connection
echo "💾 Database Status:"
pm2 logs --nostream --lines 10 2>/dev/null | grep -i "database\|postgres" | tail -3 || echo "  No recent database logs"
echo ""

# Memory usage
echo "💻 Memory Usage:"
free -h | grep Mem | awk '{print "  Used: "$3" / "$2" ("int($3/$2*100)"%)"}'
echo ""

# Recent PM2 errors
echo "🔍 Recent PM2 Errors (last 5):"
pm2 logs --err --nostream --lines 5 2>/dev/null || echo "  No PM2 errors found"
echo ""

echo "=== Health Check Complete ==="
