# Phase 6: Container Deployment Guide (Python 3.9 on Beget)

## Overview

Phase 6 implements Variant B+ deployment strategy using Python 3.9 in Beget's container environment via SSH tunnel (localhost:222). This enables parallel deployment with Variant A (Python 2.7) for zero-downtime migration.

**Architecture:**
- Variant A: Python 2.7 on port 8000 (PRODUCTION - STABLE)
- Variant B+: Python 3.9 on port 8001 (TESTING - NEW)
- Nginx: Reverse proxy routing both variants
- Health checks: Automated monitoring of both instances

---

## Step 1: Container SSH Access

### Connect to Container Terminal

```bash
ssh -p 222 root@localhost
```

**Expected Output:**
```
# (container root prompt appears)
```

**Troubleshooting:**
If connection refused:
1. Verify ssh -p 222 localhost returns container prompt
2. Check Beget control panel confirms container SSH enabled
3. Support ticket #2722821 confirms feature availability

---

## Step 2: Verify Python 3.9 Installation

```bash
python3 --version
python3.9 --version
which python3.9
```

**Expected Output:**
```
Python 3.9.x (exact version may vary)
/usr/bin/python3.9
```

---

## Step 3: Clone Repository in Container

```bash
cd ~
rm -rf arq_py39
git clone https://github.com/fukkingsnow/arq.git arq_py39
cd arq_py39
```

**Verify clone successful:**
```bash
ls -la | grep -E '(src|scripts|tests|config)'
git log --oneline | head -5
```

---

## Step 4: Create Virtual Environment

```bash
cd ~/arq_py39
python3.9 -m venv venv
source venv/bin/activate
which python
python --version
```

**Expected Output:**
```
~/arq_py39/venv/bin/python
Python 3.9.x
```

---

## Step 5: Install Dependencies

```bash
pip install --upgrade pip setuptools wheel
pip install fastapi uvicorn pydantic python-dotenv
pip install pytest pytest-asyncio aiohttp
```

**Verify installations:**
```bash
pip list | grep -E '(fastapi|uvicorn|pydantic|pytest)'
```

---

## Step 6: Prepare Application Files

### Create startup script

```bash
cat > ~/arq_py39/run_py39.py << 'EOF'
#!/usr/bin/env python3.9
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'src'))

from arq_app import app
import uvicorn

if __name__ == '__main__':
    uvicorn.run(
        app,
        host='127.0.0.1',
        port=8001,
        workers=2,
        log_level='info',
        access_log=True
    )
EOF

chmod +x ~/arq_py39/run_py39.py
```

### Create logging directory

```bash
mkdir -p ~/logs_py39
touch ~/logs_py39/app_access.log
touch ~/logs_py39/app_error.log
```

---

## Step 7: Deploy on Port 8001

### Activate virtual environment and start service

```bash
source ~/arq_py39/venv/bin/activate

nohup python3.9 ~/arq_py39/run_py39.py \
  > ~/logs_py39/app_access.log \
  2> ~/logs_py39/app_error.log &
```

**Capture the PID:**
```bash
jobs -l
ps aux | grep run_py39
```

**Expected Output:**
```
[1]+ Running                 nohup python3.9 ~/arq_py39/run_py39.py ...
```

---

## Step 8: Verify Deployment

### Check process status

```bash
ps aux | grep "python3.9 ~/arq_py39/run_py39.py" | grep -v grep
```

### Check port binding

```bash
netstat -tulpn | grep 8001
# or
ss -tulpn | grep 8001
```

**Expected Output:**
```
tcp 0 0 127.0.0.1:8001 0.0.0.0:* LISTEN [PID]/python3.9
```

### Test health endpoint

```bash
curl -i http://127.0.0.1:8001/health
```

**Expected Output:**
```
HTTP/1.1 200 OK
Content-Type: application/json
{"status": "healthy", "variant": "B+", "python": "3.9"}
```

---

## Step 9: Real-time Monitoring

### Monitor application logs

```bash
tail -f ~/logs_py39/app_access.log &
tail -f ~/logs_py39/app_error.log &
```

### Monitor system resources

```bash
top -p $(pgrep -f 'python3.9 ~/arq_py39/run_py39.py' | head -1)
```

### Monitor connectivity

```bash
watch -n 5 'netstat -tulpn | grep 800[01]'
```

---

## Step 10: Parallel Deployment Validation

### Verify both variants running

```bash
echo "=== Variant A (Python 2.7) ==="
curl -i http://127.0.0.1:8000/health

echo -e "\n=== Variant B+ (Python 3.9) ==="
curl -i http://127.0.0.1:8001/health
```

### Load test on Variant B+

```bash
for i in {1..100}; do
  curl -s http://127.0.0.1:8001/api/test > /dev/null
  echo "Request $i completed"
done
```

### Monitor response times

```bash
time curl http://127.0.0.1:8001/api/test
```

---

## Step 11: Rollback Procedure

### If issues occur, stop Variant B+ immediately

```bash
pkill -f 'python3.9 ~/arq_py39/run_py39.py'
```

### Verify Variant A still running

```bash
curl -i http://127.0.0.1:8000/health
ps aux | grep "python2.7 ~/arq/run_app.py" | grep -v grep
```

### Review error logs

```bash
tail -100 ~/logs_py39/app_error.log
```

---

## Step 12: Nginx Configuration for Dual Deployment

### Update Nginx to route both variants

```nginx
upstream arq_variant_a {
    server 127.0.0.1:8000 max_fails=3 fail_timeout=10s;
}

upstream arq_variant_b_plus {
    server 127.0.0.1:8001 max_fails=3 fail_timeout=10s;
}

server {
    listen 80;
    server_name api.arqio.ru;

    # 90% to Variant A, 10% to Variant B+ (canary deployment)
    location / {
        if ($random = 0) {
            proxy_pass http://arq_variant_b_plus;
        }
        proxy_pass http://arq_variant_a;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Variant $upstream_addr;
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
    }
}
```

---

## Step 13: Health Check System

### Continuous monitoring script

```bash
cat > ~/monitor_variants.sh << 'EOF'
#!/bin/bash

VARIANT_A_PORT=8000
VARIANT_B_PORT=8001
HEALTH_URL_A="http://127.0.0.1:$VARIANT_A_PORT/health"
HEALTH_URL_B="http://127.0.0.1:$VARIANT_B_PORT/health"
LOG_FILE="$HOME/health_check.log"

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Check Variant A
    STATUS_A=$(curl -s -o /dev/null -w '%{http_code}' $HEALTH_URL_A || echo "000")
    
    # Check Variant B+
    STATUS_B=$(curl -s -o /dev/null -w '%{http_code}' $HEALTH_URL_B || echo "000")
    
    echo "[$TIMESTAMP] Variant A: $STATUS_A | Variant B+: $STATUS_B" >> $LOG_FILE
    
    # Alert if either is down
    if [ $STATUS_A != "200" ]; then
        echo "WARNING: Variant A health check failed!" >> $LOG_FILE
    fi
    
    if [ $STATUS_B != "200" ] && [ $STATUS_B != "000" ]; then
        echo "WARNING: Variant B+ health check failed!" >> $LOG_FILE
    fi
    
    sleep 30
done
EOF

chmod +x ~/monitor_variants.sh
nohup ~/monitor_variants.sh > /dev/null 2>&1 &
```

---

## Quick Reference Commands

### Container Access
```bash
ssh -p 222 root@localhost
```

### Check Both Variants
```bash
echo "Variant A (8000):" && curl -s http://127.0.0.1:8000/health | jq .
echo "Variant B+ (8001):" && curl -s http://127.0.0.1:8001/health | jq .
```

### View Logs
```bash
tail -50 ~/logs_py39/app_error.log
tail -50 ~/logs/app_error.log
```

### Process Information
```bash
ps aux | grep -E '(python2.7|python3.9)' | grep -v grep
```

### Stop Variant B+
```bash
pkill -f 'python3.9 ~/arq_py39/run_py39.py'
```

### Start Variant B+
```bash
source ~/arq_py39/venv/bin/activate
nohup python3.9 ~/arq_py39/run_py39.py > ~/logs_py39/app_access.log 2> ~/logs_py39/app_error.log &
```

---

## Success Criteria - Phase 6 Complete When:

- ✅ Container SSH access working (ssh -p 222 root@localhost)
- ✅ Python 3.9 verified in container
- ✅ Virtual environment created and activated
- ✅ Dependencies installed successfully
- ✅ Variant B+ running on port 8001
- ✅ Health endpoint responding with 200 OK
- ✅ Both variants running simultaneously
- ✅ Nginx configured for dual routing
- ✅ Monitoring script tracking both variants
- ✅ Rollback procedure tested and working
- ✅ Zero downtime maintained during deployment

---

## Next Phase: Phase 7 - Production Migration

Once Phase 6 validation complete and Variant B+ proven stable:
1. Increase traffic to Variant B+ gradually (10% → 50% → 100%)
2. Monitor performance metrics continuously
3. Execute full migration when confidence reached
4. Keep Variant A as immediate rollback option
5. Document all metrics for post-deployment analysis

---

**Status:** Phase 6 ready for implementation  
**Variant A:** Stable on port 8000 (PID 10538)  
**Variant B+:** Ready for deployment on port 8001  
**Zero-downtime:** Strategy confirmed and documented
