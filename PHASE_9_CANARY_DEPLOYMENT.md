# PHASE 9 - Etap 5: Production Deployment с Canary Strategy
## Production Zero-Downtime Migration

**Date:** November 22, 2025, 18:00 MSK  
**Phase:** 9 - LLM Integration  
**Sub-Phase:** 5 - Production Deployment (Canary Strategy)  
**Status:** 🟡 PLANNING & PREPARATION

---

## 1. CANARY DEPLOYMENT OVERVIEW

### Strategy
Zero-downtime migration using canary deployment pattern:
- **Stage 1:** 10% traffic to Variant B+ (5 min observation)
- **Stage 2:** 50% traffic to Variant B+ (10 min observation)
- **Stage 3:** 100% traffic to Variant B+ (5 min verification)
- **Rollback:** Instant revert to 100% Variant A if issues detected

### Architecture
```
BEFORE DEPLOYMENT:
Nginx Reverse Proxy
├── 100% → Variant A (Port 8000, Python 2.7)
└── Variant B+ (Port 8001, Python 3.9 + LLM) - STANDBY

DURING CANARY:
Nginx Reverse Proxy (Dynamic Weight Adjustment)
├── 90/10% → Variant A / Variant B+ (Stage 1)
├── 50/50% → Variant A / Variant B+ (Stage 2)
└── 0/100% → Variant A / Variant B+ (Stage 3)

AFTER SUCCESSFUL DEPLOYMENT:
Nginx Reverse Proxy
├── 100% → Variant B+ (Port 8001, Python 3.9 + LLM)
└── Variant A (Port 8000, Python 2.7) - FALLBACK
```

### Nginx Configuration (Weighted Load Balancing)
```nginx
upstream variant_a {
    server localhost:8000 weight=100;  # Dynamic adjustment
}

upstream variant_b_plus {
    server localhost:8001 weight=0;    # Dynamic adjustment
}

server {
    listen 80;
    server_name api.arqio.ru;

    location / {
        proxy_pass http://variant_a$request_uri;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 2. STAGE 1: CANARY 10% TRAFFIC (T+0-5 min)

### 2.1 Pre-Stage Verification
- Verify Variant B+ still running on port 8001
- Verify Variant A running on port 8000 with 100% traffic
- Verify health checks passing on both variants

### 2.2 Update Nginx Configuration
```bash
# SSH to Beget
ssh romasaw4@romasaw4.beget.tech

# Backup current Nginx config
cp /etc/nginx/sites-available/arqio.conf /etc/nginx/sites-available/arqio.conf.backup

# Edit and update weights:
# variant_a weight=90
# variant_b_plus weight=10

nano /etc/nginx/sites-available/arqio.conf

# Test configuration
sudo nginx -t

# Reload Nginx (zero-downtime)
sudo systemctl reload nginx
```

### 2.3 10% Stage Monitoring
**Duration:** 5 minutes, check every 30 seconds

```bash
# Monitor metrics
for i in {1..10}; do
  echo "[$(date '+%H:%M:%S')] Check $i"
  
  # Check both variants running
  ps aux | grep '[p]ython3.*8001' | awk '{print "Variant B+: PID="$2" Memory="$6"KB"}'
  ps aux | grep '[p]ython2.*8000' | awk '{print "Variant A: PID="$2" Memory="$6"KB"}'
  
  # Check error logs
  tail -5 /var/log/nginx/error.log | grep -i "error\|warn"
  
  # Test requests
  curl -s http://localhost/health -H "X-Forwarded-For: test-canary"
  
  sleep 30
done
```

### 2.4 Success Criteria (Stage 1)
- ✅ Variant B+ receiving ~10% of traffic
- ✅ Response time < 200ms
- ✅ Error rate = 0%
- ✅ No memory leaks detected
- ✅ No connection errors
- ✅ Variant A still healthy with 90% traffic

### 2.5 Decision Point 1
- **PASS:** Continue to Stage 2
- **FAIL:** Immediate rollback to 100% Variant A

---

## 3. STAGE 2: CANARY 50% TRAFFIC (T+5-15 min)

### 3.1 Update Nginx Weights
```bash
# Edit Nginx configuration
# variant_a weight=50
# variant_b_plus weight=50

sudo nano /etc/nginx/sites-available/arqio.conf

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 3.2 50% Stage Monitoring (10 minutes)
Detailed monitoring with enhanced metrics:

```bash
for i in {1..20}; do
  TIMESTAMP=$(date '+%H:%M:%S')
  
  # Memory checks
  MEM_B=$(ps aux | grep '[p]ython3.*8001' | awk '{print $6}')
  MEM_A=$(ps aux | grep '[p]ython2.*8000' | awk '{print $6}')
  
  # Response time
  START=$(date +%s%N)
  RESPONSE=$(curl -s http://localhost/health)
  END=$(date +%s%N)
  LATENCY=$((($END - $START) / 1000000))
  
  # Error counting
  ERRORS=$(tail -20 /var/log/nginx/error.log 2>/dev/null | wc -l)
  
  echo "[$TIMESTAMP] B+:${MEM_B}KB | A:${MEM_A}KB | Latency:${LATENCY}ms | Errors:$ERRORS"
  
  sleep 30
done
```

### 3.3 Success Criteria (Stage 2)
- ✅ Variant B+ handling 50% of traffic smoothly
- ✅ Response time < 200ms (p95)
- ✅ Error rate < 0.1%
- ✅ Memory stable on both variants
- ✅ LLM module responding to 50% of requests
- ✅ No connection drops
- ✅ No session loss

### 3.4 Decision Point 2
- **PASS:** Continue to Stage 3 (100%)
- **FAIL:** Rollback to 90/10 or 100/0

---

## 4. STAGE 3: FULL TRAFFIC (100%) (T+15-20 min)

### 4.1 Final Nginx Update
```bash
# Edit Nginx configuration
# variant_a weight=0
# variant_b_plus weight=100

sudo nano /etc/nginx/sites-available/arqio.conf

# Test and reload
sudo nginx -t
sudo systemctl reload nginx

# Verify 100% traffic going to port 8001
tail -20 /var/log/nginx/access.log | grep "8001"
```

### 4.2 Final Verification (5 minutes)

```bash
# Extensive health checks
echo "=== FINAL PRODUCTION VERIFICATION ==="

# 1. Service health
echo "[1] Service Health:"
curl -s http://localhost:8001/health | jq .

# 2. LLM module status
echo "[2] LLM Module Status:"
curl -s -X POST http://localhost:8001/health -d '{"check_llm": true}'

# 3. Performance under 100% load
echo "[3] Performance (100 requests):"
for i in {1..100}; do
  curl -s http://localhost/api/v1/status > /dev/null
done

# 4. Database connectivity
echo "[4] Database Status:"
curl -s http://localhost/db/health | jq .

# 5. Cache status
echo "[5] Cache Status:"
curl -s http://localhost/cache/status | jq .
```

### 4.3 Success Criteria (Stage 3)
- ✅ 100% traffic routed to Variant B+
- ✅ All health checks passing
- ✅ Response time stable < 200ms
- ✅ Zero errors in 5-minute window
- ✅ Memory usage stable 11-17MB
- ✅ LLM module handling all requests
- ✅ No connection timeouts

---

## 5. ROLLBACK PROCEDURE

If ANY stage fails, execute immediate rollback:

### 5.1 Instant Rollback
```bash
# Edit Nginx - revert to 100% Variant A
# variant_a weight=100
# variant_b_plus weight=0

sudo nano /etc/nginx/sites-available/arqio.conf

# Test and reload
sudo nginx -t
sudo systemctl reload nginx

# Verify rollback
tail -10 /var/log/nginx/access.log | grep "8000"

# Stop Variant B+ if errors persist
kill $(lsof -t -i:8001)

# Verify
ps aux | grep '8001'
```

### 5.2 Investigation
```bash
# Collect logs
tar -czf /tmp/production-incident-$(date +%s).tar.gz \
  /tmp/staging-variant.log \
  /var/log/nginx/error.log \
  /var/log/nginx/access.log

# Review errors
grep -i "ERROR\|FATAL\|exception" /tmp/staging-variant.log

# Check memory dump if crash
if [ -f /var/crash/* ]; then
  ls -lah /var/crash/
fi
```

---

## 6. MONITORING DASHBOARD

### Metrics to Track (Realtime)
| Metric | Target | Alert Threshold |
|--------|--------|------------------|
| Response Time (p95) | < 200ms | > 300ms |
| Response Time (p99) | < 500ms | > 750ms |
| Error Rate | 0% | > 0.5% |
| Memory (Variant B+) | 11-17MB | > 25MB |
| Memory (Variant A) | 11-15MB | > 20MB |
| CPU Usage | < 30% | > 50% |
| Connection Count | < 1000 | > 2000 |
| Throughput | > 100 req/s | < 50 req/s |

### Log Locations
```
Nginx Access Log: /var/log/nginx/access.log
Nginx Error Log: /var/log/nginx/error.log
Variant A (Port 8000): /tmp/variant-a.log
Variant B+ (Port 8001): /tmp/staging-variant.log
System Log: /var/log/syslog
```

---

## 7. POST-DEPLOYMENT (T+20+ min)

### 7.1 Cleanup
```bash
# Backup old config
tar -czf /etc/nginx/archive/arqio.conf.$(date +%Y%m%d_%H%M%S).tar.gz \
  /etc/nginx/sites-available/arqio.conf.backup

# Optional: Stop Variant A if not needed as fallback
# ps aux | grep 'python2.*8000'
# kill <PID>

# Keep running for fallback option
```

### 7.2 Update Documentation
```bash
# Update GitHub with deployment results
git add PHASE_9_CANARY_EXECUTION_LOG.md
git commit -m "docs: Phase 9 canary deployment completed successfully"
git push origin main
```

### 7.3 Update Production Status
```bash
# Mark services
echo "Variant B+ (LLM-Integrated): PRODUCTION" > /etc/arq/status.txt
echo "Variant A: STANDBY" >> /etc/arq/status.txt
echo "Deployment Time: $(date)" >> /etc/arq/status.txt
```

---

## 8. MONITORING CONTINUATION

### 8.1 24-Hour Post-Deployment Monitoring
- Monitor error logs every 1 hour
- Check memory trends
- Verify LLM response quality
- Monitor user feedback channels

### 8.2 One-Week Review
- Analyze performance metrics
- Review error patterns
- Assess resource utilization
- Plan optimizations

---

## 9. NEXT PHASES (After Phase 9 Complete)

**Phase 10:** Browser Automation (2-3 weeks)
- Selenium integration
- Automated testing framework
- WebDriver protocol implementation

**Phase 11:** System Control (2-3 weeks)
- File system operations
- Process management
- System monitoring

**Phase 12:** Multi-Agent Orchestration (2-4 weeks)
- Agent coordination
- Task distribution
- State management

---

**Deployment Timeline:** 20-25 minutes total  
**Risk Level:** LOW (with canary strategy + instant rollback)  
**Status:** 🟡 READY FOR EXECUTION
