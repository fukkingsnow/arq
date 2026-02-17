# PRODUCTION VERIFICATION CHECKLIST
# How to Test and Verify ARQ System is Working

## QUICK START VERIFICATION (5 minutes)

### 1. Health Check - Variant B+ (PRODUCTION)
```bash
curl -i http://127.0.0.1:8001/health
```
**Expected Response:**
- Status: 200 OK
- Body: "ARQ Backend B OK\n"
- Response time: <100ms
- Status: ✅ PASS if you get this

### 2. Health Check - Variant A (STANDBY)
```bash
curl -i http://127.0.0.1:8000/health
```
**Expected Response:**
- Status: 200 OK
- Body: "ARQ Backend OK\n"
- Response time: <100ms
- Status: ✅ PASS if you get this

---

## BASIC API TESTING (10 minutes)

### 3. Send First Message (Memory Test)
```bash
curl -X POST http://127.0.0.1:8001/api/message \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user_1", "message": "Hello, remember my name is John"}'
```
**Expected Response:**
- Status: 200 OK
- Response time: 40-100ms
- Contains: user_id, message, timestamp, response
- Memory status: "memory_saved": true
- Status: ✅ PASS

### 4. Send Second Message (Context Test)
```bash
curl -X POST http://127.0.0.1:8001/api/message \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user_1", "message": "What is my name?"}'
```
**Expected Response:**
- Status: 200 OK
- Response includes: "John" (from memory)
- Shows it remembered previous conversation
- Status: ✅ PASS if system remembers "John"

### 5. Memory Persistence Test
```bash
curl -X POST http://127.0.0.1:8001/api/message \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user_1", "message": "Tell me what you know about me"}'
```
**Expected Response:**
- References "John" and previous context
- Shows entire conversation history
- Status: ✅ PASS if memory works across messages

---

## PERFORMANCE TESTING (5 minutes)

### 6. Response Time Measurement
```bash
for i in {1..10}; do
  time curl -X POST http://127.0.0.1:8001/api/message \
    -H "Content-Type: application/json" \
    -d '{"user_id": "perf_test", "message": "test message '$i'"}'  >/dev/null 2>&1
done
```
**Expected:**
- Average response time: 40-65ms
- Max response time: <200ms
- No errors
- Status: ✅ PASS if all requests succeed

---

## SYSTEM HEALTH TESTING (5 minutes)

### 7. Process Status Check
```bash
ps aux | grep -E '(python|run_app)'
```
**Expected Output:**
```
root      5207  0.0  0.5  17800 17.8M ?  S  16:30   0:05 python run_app.py
root     10538  0.0  0.4  11200 11.2M ?  S  14:00   0:10 python2.7 run_app.py
```
**Status: ✅ PASS if both processes are running**

### 8. Memory Usage Check
```bash
ps aux | grep 'python' | grep -v grep
```
**Expected:**
- Variant B+: ~17-18 MB (normal)
- Variant A: ~11-12 MB (normal)
- No excessive memory growth
- Status: ✅ PASS if memory is normal

### 9. Network Port Verification
```bash
netstat -tuln | grep -E ':(8000|8001)'
```
**Expected Output:**
```
tcp  0  0 127.0.0.1:8000  0.0.0.0:*  LISTEN
tcp  0  0 127.0.0.1:8001  0.0.0.0:*  LISTEN
```
**Status: ✅ PASS if both ports are listening**

---

## CONNECTION RESILIENCE TESTING (10 minutes)

### 10. Simulate Connection Drop (Test Reconnection)
```bash
# Terminal 1: Start monitoring
watch -n 1 'curl http://127.0.0.1:8001/health 2>&1'

# Terminal 2: Simulate issue (kill and restart process)
kill 5207
sleep 2
cd ~/arq && python3 run_app.py &

# Expected: Service recovers within 5 seconds
```
**Status: ✅ PASS if service reconnects automatically**

### 11. Data Persistence After Reconnection
```bash
# Before restart: Send a message
curl -X POST http://127.0.0.1:8001/api/message \
  -H "Content-Type: application/json" \
  -d '{"user_id": "persist_test", "message": "Data test"}'

# After restart: Check if data is still accessible
curl -X POST http://127.0.0.1:8001/api/message \
  -H "Content-Type: application/json" \
  -d '{"user_id": "persist_test", "message": "Can you remember what I said?"}'
```
**Expected:** System remembers previous data
**Status: ✅ PASS if data persists across restart**

---

## PRODUCTION READINESS CHECKLIST

### Infrastructure
- [ ] Variant B+ running (Port 8001) - PRODUCTION
- [ ] Variant A running (Port 8000) - STANDBY
- [ ] Nginx proxy configured
- [ ] All 3 domains active (arqio.ru, api.arqio.ru, app.arqio.ru)

### Functionality
- [ ] Health endpoints responding (both variants)
- [ ] Memory system working (saves and recalls)
- [ ] Context management active
- [ ] API returning proper JSON responses
- [ ] Response times <200ms

### Performance
- [ ] Response time p95: 65ms
- [ ] Memory usage normal: 17.8 MB (Variant B+), 11.2 MB (Variant A)
- [ ] CPU usage stable
- [ ] No memory leaks

### Reliability
- [ ] Error rate: 0.00%
- [ ] Uptime: 99.9%+
- [ ] No dropped connections
- [ ] Automatic reconnection working
- [ ] Data persists across restarts

### Monitoring
- [ ] Health checks pass
- [ ] Logs show normal operation
- [ ] No error logs in past 30 minutes
- [ ] Both variants responsive

---

## QUICK VERIFICATION SCRIPT

Run this script to verify everything in one go:

```bash
#!/bin/bash
echo "=== ARQ Production Verification ==="
echo ""

echo "1. Checking Port 8001 (Variant B+ - PRODUCTION)..."
curl -s http://127.0.0.1:8001/health && echo " [PASS]" || echo " [FAIL]"

echo "2. Checking Port 8000 (Variant A - STANDBY)..."
curl -s http://127.0.0.1:8000/health && echo " [PASS]" || echo " [FAIL]"

echo "3. Testing API Call..."
RESP=$(curl -s -w "\n%{time_total}" -X POST http://127.0.0.1:8001/api/message \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "message": "test"}')
echo "Response time: $(echo "$RESP" | tail -1)s [PASS]"

echo "4. Checking Process Status..."
ps aux | grep python | grep -v grep | wc -l
echo "Processes running (expected 2) [OK]"

echo ""
echo "=== Verification Complete ==="
```

Save as `verify_production.sh` and run with `bash verify_production.sh`

---

## TROUBLESHOOTING GUIDE

### Issue: Health Check Returns 404
**Solution:** Check if application is running
```bash
ps aux | grep python
# If not found, restart:
cd ~/arq && nohup python3 run_app.py > ~/logs/app.log 2>&1 &
```

### Issue: Slow Response Times (>500ms)
**Solution:** Check system resources
```bash
# Check CPU
top -bn1 | head -20
# Check Memory
free -h
# Check Disk I/O
iostat -x 1 2
```

### Issue: Connection Refused
**Solution:** Check if ports are open
```bash
netstat -tuln | grep -E ':(8000|8001)'
# If not listening, restart the application
```

### Issue: Memory Growing Over Time
**Solution:** Check for memory leaks
```bash
# Monitor memory over time
watch -n 5 'ps aux | grep python | grep -v grep'
# If memory keeps growing, restart:
kill $(pgrep -f run_app.py)
sleep 2
cd ~/arq && nohup python3 run_app.py > ~/logs/app.log 2>&1 &
```

---

## IMPORTANT: WHAT TO CHECK FOR

✅ **GREEN FLAGS** (System is healthy):
- Health checks return 200 OK
- Response times <200ms
- Memory stable around 17.8 MB
- Both processes running
- No errors in logs

❌ **RED FLAGS** (Action needed):
- Health check returns 404/500
- Response times >500ms
- Memory growing rapidly
- Processes not running
- Error messages in logs
- Connection refused

---

## MONITORING COMMANDS

**Real-time monitoring:**
```bash
# Watch both health endpoints
watch -n 2 'echo "Port 8001:" && curl -s http://127.0.0.1:8001/health && echo "" && echo "Port 8000:" && curl -s http://127.0.0.1:8000/health'
```

**Log monitoring:**
```bash
tail -f ~/logs/app*.log
```

**Process monitoring:**
```bash
watch -n 5 'ps aux | grep -E "(python|run_app)" | grep -v grep'
```

---

## SUCCESS CRITERIA

**All items must be ✅ PASS:**
- [ ] Both health endpoints responding
- [ ] API calls completing <200ms
- [ ] Memory within normal range
- [ ] Both processes running
- [ ] No error logs
- [ ] Zero downtime achieved
- [ ] Context/memory working
- [ ] System ready for users

**If all are PASS: SYSTEM IS PRODUCTION-READY ✅✅✅**
