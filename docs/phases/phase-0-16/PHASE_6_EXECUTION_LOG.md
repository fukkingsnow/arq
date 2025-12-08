# PHASE 6: Container Deployment Execution Log

**Start Date:** Saturday, November 22, 2025, 3:00 PM MSK  
**Status:** IN PROGRESS 🔄  
**Objective:** Deploy Python 3.9 application on Beget container (port 8001) parallel to existing Variant A (Python 2.7 on port 8000)

---

## Summary

This document tracks the real-time execution of Phase 6 container deployment. All 13 steps from PHASE_6_CONTAINER_DEPLOYMENT.md will be executed and logged here with actual command outputs and results.

**Target Architecture:**
- Variant A (Production): Python 2.7 on port 8000 ✅ RUNNING
- Variant B+ (New): Python 3.9 on port 8001 🔄 DEPLOYING
- Nginx: Dual-variant routing
- Health: Continuous monitoring
- Downtime: ZERO

---

## Step 1: Container SSH Access

**Command:**
```bash
ssh localhost -p222
```

**Expected Output:** Container root prompt

**Status:** ⏳ READY TO EXECUTE

---

## Step 2: Verify Python 3.9 Installation

**Commands:**
```bash
python3 --version
python3.9 --version
which python3.9
```

**Expected Output:**
```
Python 3.9.x (specific version varies by container)
/usr/bin/python3.9
```

**Status:** ⏳ READY TO EXECUTE

---

## Step 3: Clone Repository in Container

**Commands:**
```bash
cd ~
rm -rf arq_py39
git clone https://github.com/fukkingsnow/arq.git arq_py39
cd arq_py39
```

**Verify:**
```bash
ls -la | grep -E '(src|scripts|tests|config)'
git log --oneline | head -5
```

**Status:** ⏳ READY TO EXECUTE

---

## Step 4: Create Virtual Environment

**Commands:**
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

**Status:** ⏳ READY TO EXECUTE

---

## Step 5: Install Dependencies

**Commands:**
```bash
pip install --upgrade pip setuptools wheel
pip install fastapi uvicorn pydantic python-dotenv
pip install pytest pytest-asyncio aiohttp
```

**Verify:**
```bash
pip list | grep -E '(fastapi|uvicorn|pydantic|pytest)'
```

**Status:** ⏳ READY TO EXECUTE

---

## Step 6: Prepare Application Files

**Create startup script:**
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

**Create logging directories:**
```bash
mkdir -p ~/logs_py39
touch ~/logs_py39/app_access.log
touch ~/logs_py39/app_error.log
```

**Status:** ⏳ READY TO EXECUTE

---

## Step 7: Deploy on Port 8001

**Start service:**
```bash
source ~/arq_py39/venv/bin/activate
nohup python3.9 ~/arq_py39/run_py39.py > ~/logs_py39/app_access.log 2> ~/logs_py39/app_error.log &
```

**Capture PID:**
```bash
jobs -l
ps aux | grep run_py39
```

**Status:** ⏳ READY TO EXECUTE

---

## Step 8: Verify Deployment

**Check process:**
```bash
ps aux | grep "python3.9 ~/arq_py39/run_py39.py" | grep -v grep
```

**Check port binding:**
```bash
netstat -tulpn | grep 8001
# or
ss -tulpn | grep 8001
```

**Test health endpoint:**
```bash
curl -i http://127.0.0.1:8001/health
```

**Expected:** HTTP 200 OK

**Status:** ⏳ READY TO EXECUTE

---

## Step 9: Real-time Monitoring

**Monitor logs:**
```bash
tail -f ~/logs_py39/app_access.log &
tail -f ~/logs_py39/app_error.log &
```

**Monitor resources:**
```bash
top -p $(pgrep -f 'python3.9 ~/arq_py39/run_py39.py' | head -1)
```

**Monitor connectivity:**
```bash
watch -n 5 'netstat -tulpn | grep 800[01]'
```

**Status:** ⏳ READY TO EXECUTE

---

## Step 10: Parallel Deployment Validation

**Verify both variants:**
```bash
echo "=== Variant A (Python 2.7) ==="
curl -i http://127.0.0.1:8000/health

echo -e "\n=== Variant B+ (Python 3.9) ==="
curl -i http://127.0.0.1:8001/health
```

**Load test:**
```bash
for i in {1..100}; do
  curl -s http://127.0.0.1:8001/api/test > /dev/null
  echo "Request $i completed"
done
```

**Response time test:**
```bash
time curl http://127.0.0.1:8001/api/test
```

**Status:** ⏳ READY TO EXECUTE

---

## Step 11: Rollback Procedure (if needed)

**Stop Variant B+:**
```bash
pkill -f 'python3.9 ~/arq_py39/run_py39.py'
```

**Verify Variant A still running:**
```bash
curl -i http://127.0.0.1:8000/health
ps aux | grep "python2.7 ~/arq/run_app.py" | grep -v grep
```

**Review error logs:**
```bash
tail -100 ~/logs_py39/app_error.log
```

**Status:** ⏳ ON STANDBY (Emergency-only)

---

## Step 12: Nginx Configuration for Dual Deployment

**Update upstream servers in Nginx config:**

Modify `/etc/nginx/conf.d/arq.conf` or control panel Nginx configuration:

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

    # Route distribution: 90% Variant A, 10% Variant B+ (canary)
    location / {
        # Canary deployment ratio
        set $upstream "arq_variant_a";
        if ($random_index = 0) {
            set $upstream "arq_variant_b_plus";
        }
        
        proxy_pass http://$upstream;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Variant $upstream;
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
    }
}
```

**Reload Nginx:**
```bash
nginx -t
sudo systemctl reload nginx
```

**Status:** ⏳ READY TO EXECUTE

---

## Step 13: Health Check System

**Create monitoring script:**
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
    
    STATUS_A=$(curl -s -o /dev/null -w '%{http_code}' $HEALTH_URL_A || echo "000")
    STATUS_B=$(curl -s -o /dev/null -w '%{http_code}' $HEALTH_URL_B || echo "000")
    
    echo "[$TIMESTAMP] Variant A: $STATUS_A | Variant B+: $STATUS_B" >> $LOG_FILE
    
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

**Check monitoring:**
```bash
tail -20 ~/health_check.log
```

**Status:** ⏳ READY TO EXECUTE

---

## Execution Timeline

| Step | Start | End | Duration | Status |
|------|-------|-----|----------|--------|
| 1 | - | - | - | ⏳ |
| 2 | - | - | - | ⏳ |
| 3 | - | - | - | ⏳ |
| 4 | - | - | - | ⏳ |
| 5 | - | - | - | ⏳ |
| 6 | - | - | - | ⏳ |
| 7 | - | - | - | ⏳ |
| 8 | - | - | - | ⏳ |
| 9 | - | - | - | ⏳ |
| 10 | - | - | - | ⏳ |
| 11 | - | - | - | ⏳ |
| 12 | - | - | - | ⏳ |
| 13 | - | - | - | ⏳ |
| **Total** | - | - | ~20 min | ⏳ |

---

## Final Validation Checklist

- [ ] Container SSH access working
- [ ] Python 3.9 verified
- [ ] Repository cloned
- [ ] Virtual environment created
- [ ] Dependencies installed
- [ ] Application files prepared
- [ ] Variant B+ deployed on port 8001
- [ ] Health endpoints responding (both 8000 and 8001)
- [ ] Parallel deployment validated
- [ ] Nginx dual-routing configured
- [ ] Monitoring script running
- [ ] Zero-downtime confirmed
- [ ] Rollback procedure tested

---

## Next Steps After Completion

1. Monitor both variants for 10-15 minutes
2. Gradually shift traffic: 90% A, 10% B+ → 50% each → 10% A, 90% B+
3. Execute Phase 7: Production migration
4. Document final metrics for post-deployment analysis

---

**Deployment Ready:** YES ✅  
**Estimated Completion:** Saturday, November 22, 2025, ~3:20 PM MSK  
**Current Status:** Awaiting execution command
