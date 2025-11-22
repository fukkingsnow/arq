# PHASE 9 - Staging Deployment: LLM Integration Testing and Verification

## Date
November 22, 2025, 5:00 PM MSK

## Status
🔄 **IN PROGRESS** - Staging Deployment Phase Initiated

---

## 1. STAGING DEPLOYMENT OBJECTIVES

This phase verifies LLM integration readiness before production deployment:

- ✅ Deploy LLM-integrated variant to **staging environment (Port 8001)**
- ✅ Verify all **health checks** pass successfully
- ✅ Monitor **memory usage** (target: 11-17 MB)
- ✅ Establish **performance baseline** (response time, throughput)
- ✅ Execute **10-minute extended observation** period
- ✅ Confirm **rollback procedures** are operational
- ✅ Document all metrics and observations

---

## 2. PRE-DEPLOYMENT CHECKLIST

### 2.1 Code Repository Verification
- [ ] All Phase 9 files committed to GitHub main branch:
  - [ ] `/src/llm_integration.py` (378 lines) - ✅ COMMITTED
  - [ ] `/src/tests/test_llm_integration.py` (297 lines) - ✅ COMMITTED
  - [ ] `/src/routes_llm_endpoints.py` (236 lines) - ✅ COMMITTED
  - [ ] `PHASE_9_MAIN_UPDATE_GUIDE.md` (206 lines) - ✅ COMMITTED
  - [ ] `REQUIREMENTS_PHASE_9.txt` (42 lines) - ✅ COMMITTED

### 2.2 Dependency Verification
- [ ] All LLM packages installed:
  - openai>=1.0.0
  - langchain>=0.1.0
  - python-dotenv>=1.0.0
  - requests>=2.31.0

### 2.3 Configuration Verification
- [ ] Environment variables set (romasaw4@romasaw4.beget.tech):
  - [ ] OPENAI_API_KEY configured
  - [ ] OLLAMA_API_URL configured (if using local Ollama)
  - [ ] LOG_LEVEL=DEBUG for staging visibility
  - [ ] VARIANT_VERSION=b+ (LLM-integrated)

### 2.4 SSH Access Verification
- [ ] SSH connection to Beget confirmed
- [ ] Docker/container service running
- [ ] Port 8001 available for deployment

---

## 3. DEPLOYMENT INSTRUCTIONS

### 3.1 SSH Connection and Directory Setup

```bash
# Connect to Beget hosting
ssh romasaw4@romasaw4.beget.tech

# Verify directory structure
cd /home/romasaw4/arq
ls -la

# Check current variants running
ps aux | grep python | grep -E '8000|8001'
```

### 3.2 Pull Latest Code from GitHub

```bash
cd /home/romasaw4/arq
git fetch origin main
git reset --hard origin/main

# Verify Phase 9 files present
ls -la src/llm_integration.py
ls -la src/routes_llm_endpoints.py
ls -la src/tests/test_llm_integration.py
```

### 3.3 Install/Update LLM Dependencies

```bash
# Activate Python 3 environment
source /home/romasaw4/.venv/bin/activate

# Install LLM packages
pip install -r REQUIREMENTS_PHASE_9.txt

# Verify installation
pip list | grep -E 'openai|langchain|requests'
```

### 3.4 Update main.py with LLM Integration (if not already done)

Based on PHASE_9_MAIN_UPDATE_GUIDE.md:

```bash
# Backup existing main.py
cp src/main.py src/main.py.backup

# Apply updates from PHASE_9_MAIN_UPDATE_GUIDE.md
# Key additions:
# 1. Import LLM modules
# 2. Initialize LLM router
# 3. Include LLM endpoints in FastAPI app
# 4. Add LLM health checks to startup event
```

### 3.5 Deploy to Port 8001 (Staging)

```bash
# Set environment variables for staging
export OPENAI_API_KEY='your-api-key'
export VARIANT_VERSION='b+'
export LOG_LEVEL='DEBUG'
export PORT=8001

# Start staging variant (in detached mode or tmux/screen)
nohup python3 src/main.py --port 8001 --variant b+ > /tmp/staging-variant.log 2>&1 &

# Or using systemd if available:
# systemctl restart arq-staging

# Verify service started
sleep 5
ps aux | grep 'python3.*8001'
cat /tmp/staging-variant.log | tail -20
```

---

## 4. HEALTH CHECK PROCEDURES

### 4.1 Service Startup Check (t=0 min)

```bash
# Check process is running
ps aux | grep 'main.py.*8001'

# Expected: Process running with PID
# Status: ✅ PASS or ❌ FAIL
```

### 4.2 Basic Connectivity Check (t=0-1 min)

```bash
curl -s http://localhost:8001/health | jq .

# Expected response:
# {
#   "status": "healthy",
#   "variant": "b+",
#   "memory_mb": 14.5,
#   "uptime_seconds": 5
# }

# Status: ✅ PASS or ❌ FAIL
```

### 4.3 LLM Module Health Check (t=1-2 min)

```bash
curl -X POST http://localhost:8001/health \n  -H 'Content-Type: application/json' \n  -d '{"check_llm": true}'

# Expected response:
# {
#   "status": "healthy",
#   "llm_module": "loaded",
#   "openai_client": "connected",
#   "context_manager": "initialized"
# }

# Status: ✅ PASS or ❌ FAIL
```

### 4.4 API Endpoints Verification (t=2-3 min)

```bash
# Test /generate endpoint
curl -X POST http://localhost:8001/generate \n  -H 'Content-Type: application/json' \n  -d '{
    "prompt": "What is the capital of France?",
    "model": "gpt-3.5-turbo"
  }'

# Expected: Valid JSON response with generated text
# Status: ✅ PASS or ❌ FAIL

# Test /context endpoint
curl -X GET http://localhost:8001/context \n  -H 'Content-Type: application/json'

# Expected: Returns current context manager state
# Status: ✅ PASS or ❌ FAIL
```

### 4.5 Memory Monitoring (t=3-5 min)

```bash
# Monitor memory usage - target 11-17 MB
ps aux | grep 'main.py.*8001' | awk '{print $6}'

# Or continuous monitoring:
watch -n 1 'ps aux | grep main.py | grep 8001'

# Expected: Memory between 11-17 MB
# Status: ✅ PASS or ❌ FAIL

# If memory > 20 MB:
# ⚠️ WARNING - Memory leak detected
# If memory > 30 MB:
# ❌ FAIL - Unacceptable memory consumption
```

### 4.6 Response Time Baseline (t=5-7 min)

```bash
# Measure response time for 10 requests
for i in {1..10}; do
  time curl -X POST http://localhost:8001/generate \n    -H 'Content-Type: application/json' \n    -d '{"prompt": "Test", "model": "gpt-3.5-turbo"}' | jq -r '.response_time'
done

# Expected: Average < 200ms (p95), Max < 500ms (p99)
# Status: ✅ PASS or ❌ FAIL
```

### 4.7 Extended Observation Period (t=7-17 min)

```bash
# Continuous monitoring for 10 minutes
# Check every 30 seconds:
# - Process still running
# - Memory not growing
# - No error logs
# - Response times consistent

for i in {1..20}; do
  echo "Check $i at $(date +%T)"
  ps aux | grep 'main.py.*8001' | awk '{print "Memory:", $6, "KB"}'
  tail -5 /tmp/staging-variant.log | grep -E 'ERROR|WARN'
  curl -s http://localhost:8001/health | jq '.status'
  sleep 30
done

# Expected: All checks pass consistently
# Status: ✅ PASS or ❌ FAIL
```

---

## 5. SUCCESS AND FAILURE CRITERIA

### 5.1 SUCCESS CRITERIA (All must pass)
- [ ] Service starts without errors
- [ ] All health checks return 200 OK
- [ ] Memory usage: 11-17 MB (stable, no growth)
- [ ] Response time: < 200ms (p95)
- [ ] Error rate: 0%
- [ ] No FATAL or ERROR logs in 10-minute window
- [ ] LLM module loaded and responding
- [ ] Context management operational

### 5.2 FAILURE CRITERIA (Any one triggers rollback)
- ❌ Service crashes or fails to start
- ❌ Health check fails (500 or timeout)
- ❌ Memory usage > 20 MB
- ❌ Memory continuously growing (leak detected)
- ❌ Response time > 500ms (p99)
- ❌ Error rate > 0.5%
- ❌ LLM module fails to load
- ❌ Connection timeout to OpenAI API
- ❌ Any FATAL logs during observation period

---

## 6. OBSERVATION METRICS

### Record at t=0, 5, 10 min:

```
TIMESTAMP: [                  ]
MEMORY (MB): [                ]
RESPONSE TIME (ms): [         ]
ERROR COUNT: [                ]
REQUESTS PROCESSED: [         ]
LLM_STATUS: [                 ]
NOTES: [
  
]
```

---

## 7. ROLLBACK PROCEDURE

If staging deployment FAILS:

```bash
# 1. Kill staging variant
kill $(ps aux | grep 'main.py.*8001' | grep -v grep | awk '{print $2}')

# 2. Verify it's stopped
ps aux | grep '8001' | grep -v grep

# 3. Revert to previous commit (if needed)
git reset --hard HEAD~1

# 4. Restart production variant (Variant A on 8000) if affected
ps aux | grep 'main.py.*8000'

# 5. Verify Variant A still healthy
curl http://localhost:8000/health

# 6. Document rollback in execution log
echo "Staging rollback at $(date)" >> /tmp/staging-rollback.log
```

---

## 8. NEXT STEPS

If ALL criteria pass:

1. ✅ Document final metrics
2. ✅ Update PHASE_9_EXECUTION_LOG.md
3. ✅ Commit observation results to GitHub
4. ✅ Prepare for **Etap 5: Production Deployment with Canary Strategy**
5. ✅ Await user instruction: "да" to proceed to production

---

**Deployment Lead:** ARQ AI Assistant Backend Team  
**Environment:** Beget Hosting (romasaw4.beget.tech)  
**Variant:** B+ (Python 3 + LLM Integration)  
**Port:** 8001 (Staging)  
**Duration:** ~20 minutes (including observation period)  
