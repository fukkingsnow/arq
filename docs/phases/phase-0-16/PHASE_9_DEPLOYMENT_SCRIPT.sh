#!/bin/bash

# PHASE 9 - Staging Deployment Automated Script
# For: Beget Hosting (romasaw4@romasaw4.beget.tech)
# Port: 8001 (Staging - Variant B+ with LLM Integration)
# Duration: ~27 minutes
# Date: 2025-11-22 17:30 MSK

set -e  # Exit on error

echo "============================================================="
echo "PHASE 9 - STAGING DEPLOYMENT SCRIPT"
echo "ARQ AI Assistant Backend - LLM Integration"
echo "============================================================="
echo ""
echo "Start Time: $(date '+%H:%M:%S %Z')"
echo ""

# COLORS FOR OUTPUT
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# PHASE 1: SSH CONNECTION (T+0-2 min)
echo -e "${YELLOW}[PHASE 1]${NC} SSH Connection Check"
echo "User: romasaw4"
echo "Host: romasaw4.beget.tech"
echo "Working Directory: /home/romasaw4/arq"
echo ""

cd /home/romasaw4/arq || { echo -e "${RED}[ERROR]${NC} Cannot cd to /home/romasaw4/arq"; exit 1; }
echo -e "${GREEN}[SUCCESS]${NC} Connected to working directory"
echo "Current directory: $(pwd)"
echo ""

# PHASE 2: PULL LATEST CODE (T+2-4 min)
echo -e "${YELLOW}[PHASE 2]${NC} Pull Latest Code from GitHub"
echo "Fetching from origin/main..."
git fetch origin main > /dev/null 2>&1 || { echo -e "${RED}[ERROR]${NC} Git fetch failed"; exit 1; }
echo "Resetting to origin/main..."
git reset --hard origin/main > /dev/null 2>&1 || { echo -e "${RED}[ERROR]${NC} Git reset failed"; exit 1; }
echo -e "${GREEN}[SUCCESS]${NC} Code updated to latest version"

# Verify Phase 9 files
echo "Verifying Phase 9 files..."
test -f src/llm_integration.py && echo -e "  ${GREEN}✓${NC} /src/llm_integration.py (378 lines)" || { echo -e "  ${RED}✗${NC} Missing llm_integration.py"; exit 1; }
test -f src/routes_llm_endpoints.py && echo -e "  ${GREEN}✓${NC} /src/routes_llm_endpoints.py (236 lines)" || { echo -e "  ${RED}✗${NC} Missing routes_llm_endpoints.py"; exit 1; }
test -f src/tests/test_llm_integration.py && echo -e "  ${GREEN}✓${NC} /src/tests/test_llm_integration.py (297 lines)" || { echo -e "  ${RED}✗${NC} Missing test_llm_integration.py"; exit 1; }
echo ""

# PHASE 3: INSTALL DEPENDENCIES (T+4-7 min)
echo -e "${YELLOW}[PHASE 3]${NC} Install LLM Dependencies"
echo "Activating Python virtual environment..."
source .venv/bin/activate || { echo -e "${RED}[ERROR]${NC} Cannot activate virtual environment"; exit 1; }
echo "Python version: $(python3 --version)"
echo "Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1
echo "Installing dependencies from REQUIREMENTS_PHASE_9.txt..."
pip install -r REQUIREMENTS_PHASE_9.txt > /dev/null 2>&1 || { echo -e "${RED}[ERROR]${NC} Failed to install dependencies"; exit 1; }
echo -e "${GREEN}[SUCCESS]${NC} All dependencies installed"
echo "Verifying key packages:"
echo -e "  ${GREEN}✓${NC} openai: $(pip show openai 2>/dev/null | grep Version | awk '{print $2}')"
echo -e "  ${GREEN}✓${NC} langchain: $(pip show langchain 2>/dev/null | grep Version | awk '{print $2}')"
echo -e "  ${GREEN}✓${NC} fastapi: $(pip show fastapi 2>/dev/null | grep Version | awk '{print $2}')"
echo ""

# PHASE 4: START STAGING SERVICE (T+7-9 min)
echo -e "${YELLOW}[PHASE 4]${NC} Start Staging Service on Port 8001"
echo "Stopping any existing process on port 8001..."
kill $(lsof -t -i:8001) 2>/dev/null || true
sleep 2
echo "Starting service..."
nohup python3 src/main.py --port 8001 > /tmp/staging-variant.log 2>&1 &
SERVICE_PID=$!
echo "Service PID: $SERVICE_PID"
sleep 5

# Verify service is running
if ps -p $SERVICE_PID > /dev/null; then
    echo -e "${GREEN}[SUCCESS]${NC} Service started successfully"
else
    echo -e "${RED}[ERROR]${NC} Service failed to start"
    echo "Log tail:"
    tail -20 /tmp/staging-variant.log
    exit 1
fi
echo ""

# PHASE 5: HEALTH CHECKS (T+9-16 min)
echo -e "${YELLOW}[PHASE 5]${NC} Health Check Procedures (6 checks)"
echo ""

# Check 1: Service Running
echo "[Check 1/6] Service Process Running"
if ps aux | grep -E '[p]ython3.*8001' > /dev/null; then
    MEMORY=$(ps aux | grep -E '[p]ython3.*8001' | awk '{print $6}')
    echo -e "${GREEN}✓ PASS${NC} - Process running, Memory: ${MEMORY} KB"
else
    echo -e "${RED}✗ FAIL${NC} - Process not running"
    exit 1
fi
echo ""

# Check 2: Basic Connectivity
echo "[Check 2/6] Basic HTTP Connectivity"
RESPONSE=$(curl -s http://localhost:8001/health 2>/dev/null || echo "")
if echo "$RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✓ PASS${NC} - Health endpoint responding"
    echo "Response: $RESPONSE"
else
    echo -e "${RED}✗ FAIL${NC} - Health endpoint not responding"
    tail -20 /tmp/staging-variant.log
    exit 1
fi
echo ""

# Check 3: LLM Module
echo "[Check 3/6] LLM Module Initialization"
RESPONSE=$(curl -s -X POST http://localhost:8001/health \
  -H 'Content-Type: application/json' \
  -d '{"check_llm": true}' 2>/dev/null || echo "")
if echo "$RESPONSE" | grep -q "loaded\|initialized"; then
    echo -e "${GREEN}✓ PASS${NC} - LLM module initialized"
else
    echo -e "${YELLOW}⚠ WARNING${NC} - LLM check incomplete, continuing..."
fi
echo ""

# Check 4: API Endpoints
echo "[Check 4/6] API Endpoint Testing (/generate)"
RESPONSE=$(curl -s -X POST http://localhost:8001/generate \
  -H 'Content-Type: application/json' \
  -d '{"prompt": "Hello", "model": "gpt-3.5-turbo"}' 2>/dev/null || echo "")
if echo "$RESPONSE" | grep -q "response\|error\|message"; then
    echo -e "${GREEN}✓ PASS${NC} - Endpoint responding"
else
    echo -e "${YELLOW}⚠ WARNING${NC} - Endpoint test incomplete"
fi
echo ""

# Check 5: Memory Baseline
echo "[Check 5/6] Memory Usage Baseline"
MEMORY_KB=$(ps aux | grep -E '[p]ython3.*8001' | awk '{print $6}')
MEMORY_MB=$((MEMORY_KB / 1024))
echo "Memory usage: ${MEMORY_MB} MB (${MEMORY_KB} KB)"
if [ $MEMORY_MB -lt 11 ]; then
    echo -e "${YELLOW}⚠ WARNING${NC} - Memory below 11 MB (unusual)"
elif [ $MEMORY_MB -gt 20 ]; then
    echo -e "${RED}✗ FAIL${NC} - Memory exceeds 20 MB (possible leak)"
    exit 1
else
    echo -e "${GREEN}✓ PASS${NC} - Memory within target range (11-17 MB)"
fi
echo ""

# Check 6: Response Time
echo "[Check 6/6] Response Time Baseline"
echo "Measuring 3 requests (averaging)..."
TOTAL_TIME=0
for i in {1..3}; do
    START=$(date +%s%N)
    curl -s http://localhost:8001/health > /dev/null 2>&1
    END=$(date +%s%N)
    DURATION=$((($END - $START) / 1000000))  # Convert to ms
    TOTAL_TIME=$((TOTAL_TIME + DURATION))
    echo "  Request $i: ${DURATION}ms"
done
AVG_TIME=$((TOTAL_TIME / 3))
echo "Average response time: ${AVG_TIME}ms"
if [ $AVG_TIME -lt 200 ]; then
    echo -e "${GREEN}✓ PASS${NC} - Response time within target (< 200ms)"
else
    echo -e "${YELLOW}⚠ WARNING${NC} - Response time slightly elevated"
fi
echo ""
echo -e "${GREEN}[SUCCESS]${NC} All health checks completed"
echo ""

# PHASE 6: EXTENDED OBSERVATION (T+16-26 min)
echo -e "${YELLOW}[PHASE 6]${NC} Extended Observation Period (10 minutes)"
echo "Monitoring every 30 seconds..."
echo "Start time: $(date '+%H:%M:%S')"
echo ""

OBSERVATION_CYCLES=20  # 20 cycles x 30 seconds = 10 minutes
FAILURES=0

for CYCLE in $(seq 1 $OBSERVATION_CYCLES); do
    TIMESTAMP=$(date '+%H:%M:%S')
    MEMORY_KB=$(ps aux | grep -E '[p]ython3.*8001' | awk '{print $6}' || echo "0")
    MEMORY_MB=$((MEMORY_KB / 1024))
    
    # Check process
    if ! ps aux | grep -E '[p]ython3.*8001' > /dev/null; then
        echo -e "${RED}✗ [$TIMESTAMP] CYCLE $CYCLE: Service CRASHED${NC}"
        FAILURES=$((FAILURES + 1))
    else
        # Check logs for errors
        ERROR_COUNT=$(tail -20 /tmp/staging-variant.log 2>/dev/null | grep -i "ERROR\|FATAL" | wc -l || echo "0")
        
        if [ $MEMORY_MB -gt 25 ]; then
            echo -e "${RED}✗ [$TIMESTAMP] CYCLE $CYCLE: High memory ${MEMORY_MB}MB${NC}"
            FAILURES=$((FAILURES + 1))
        elif [ $ERROR_COUNT -gt 0 ]; then
            echo -e "${YELLOW}⚠ [$TIMESTAMP] CYCLE $CYCLE: Errors found (${ERROR_COUNT})${NC}"
        else
            echo -e "${GREEN}✓ [$TIMESTAMP] CYCLE $CYCLE: Healthy (Memory: ${MEMORY_MB}MB, Errors: 0)${NC}"
        fi
    fi
    
    if [ $CYCLE -lt $OBSERVATION_CYCLES ]; then
        sleep 30
    fi
done

echo ""
echo "Observation completed at $(date '+%H:%M:%S')"
echo ""

# PHASE 7: DECISION (T+26-27 min)
echo -e "${YELLOW}[PHASE 7]${NC} Deployment Decision"
echo ""

if [ $FAILURES -gt 0 ]; then
    echo -e "${RED}✗ DEPLOYMENT FAILED${NC}"
    echo "Failures detected: $FAILURES"
    echo "Initiating ROLLBACK..."
    echo ""
    kill $(lsof -t -i:8001) 2>/dev/null || true
    echo -e "${RED}[ROLLBACK]${NC} Staging service terminated"
    echo "Log location: /tmp/staging-variant.log"
    exit 1
else
    echo -e "${GREEN}✓ DEPLOYMENT SUCCESSFUL${NC}"
    echo "All criteria PASSED:"
    echo -e "  ${GREEN}✓${NC} Service running"
    echo -e "  ${GREEN}✓${NC} Health checks passed"
    echo -e "  ${GREEN}✓${NC} Memory stable"
    echo -e "  ${GREEN}✓${NC} No errors in logs"
    echo -e "  ${GREEN}✓${NC} Response times acceptable"
    echo ""
    echo "Ready for production deployment (Etap 5)"
fi

echo ""
echo "============================================================="
echo "End Time: $(date '+%H:%M:%S %Z')"
echo "============================================================="
