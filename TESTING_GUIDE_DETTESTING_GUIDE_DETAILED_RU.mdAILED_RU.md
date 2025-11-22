# ARQ BACKEND - DETAILED TESTING GUIDE

## Complete Testing Procedure

This document provides a detailed step-by-step procedure for testing ARQ Backend on Beget hosting.

---

## TEST 1: HEALTH CHECK - PRODUCTION VARIANT B+ (PORT 8001)

### WHERE TO EXECUTE:
- Location: SSH terminal, main host (romasaw4@romasaw4.beget.tech)
- Duration: 1-2 minutes

### HOW TO EXECUTE:

Step 1: Execute health check for Production Variant B+
```bash
curl -i http://127.0.0.1:8001/health
```

Step 2: Record output

### WHAT TO EXPECT:

Status code: 200 OK
Response body: "ARQ Backend B OK"
Response time: <100ms

### RESULT RECORDING:

```
Test 1 - Port 8001 Health Check:
Status: [PASS/FAIL]
Status Code: [200]
Response: [text]
Time: [ms]
Timestamp: [HH:MM:SS]
```

---

## TEST 2: HEALTH CHECK - STANDBY VARIANT A (PORT 8000)

### WHERE TO EXECUTE:
- Location: Same SSH terminal

### HOW TO EXECUTE:

Step 1: Execute health check for Standby Variant A
```bash
curl -i http://127.0.0.1:8000/health
```

### WHAT TO EXPECT:

Status code: 200 OK
Response body: "ARQ Backend OK"
Response time: <100ms
Note: Standby variant, NOT production

### RESULT RECORDING:

```
Test 2 - Port 8000 Health Check:
Status: [PASS/FAIL]
Status Code: [200]
Response: [text]
Note: STANDBY variant
```

---

## TEST 3: MEMORY ENDPOINT (PORT 8001)

### HOW TO EXECUTE:
```bash
curl -i http://127.0.0.1:8001/memory
```

### WHAT TO EXPECT:

JSON response with:
- pid: process ID
- rss: ~18-20 MB for Variant B+
- memory_percent: <0.5%

### RESULT RECORDING:

```
Test 3 - Memory:
PID: [value]
RSS: [MB]
Memory %: [value]
Status: [NORMAL/WARNING]
```

---

## TEST 4: CONTEXT ENDPOINT (PORT 8001)

### HOW TO EXECUTE:
```bash
curl -i http://127.0.0.1:8001/context
```

### WHAT TO EXPECT:

JSON with context tracking:
- context_id present
- active_contexts count
- timestamp

### RESULT RECORDING:

```
Test 4 - Context:
Status: [PASS/FAIL]
Active contexts: [number]
Response valid: [YES/NO]
```

---

## TEST 5: PROCESS STATUS

### HOW TO EXECUTE:
```bash
ps aux | grep -E 'run_app|runpy39|python'
```

### WHAT TO EXPECT:

Both processes running:
- Variant A: python2.7 run_app.py port 8000
- Variant B+: python3 runpy39.py port 8001

### RESULT RECORDING:

```
Test 5 - Processes:
Variant A: [RUNNING/STOPPED]
Variant B+: [RUNNING/STOPPED]
Overall: [OK/FAILED]
```

---

## TEST 6: PORT CONNECTIVITY

### HOW TO EXECUTE:
```bash
netstat -tlnp | grep 8001
netstat -tlnp | grep 8000
```

### WHAT TO EXPECT:

Both ports in LISTEN state
Both accepting connections

### RESULT RECORDING:

```
Test 6 - Ports:
Port 8000: [LISTEN/NOT]
Port 8001: [LISTEN/NOT]
Status: [OK/FAILED]
```

---

## TROUBLESHOOTING

### Port 8001 not responding:
```bash
ssh localhost -p222
cd ~/arq
nohup python3 runpy39.py > ~/logs/app_b_error.log 2>&1 &
```

### Port 8000 not responding:
```bash
cd ~/arq
nohup python2.7 run_app.py > ~/logs/app_error.log 2>&1 &
```

---

## EXECUTION SEQUENCE

1. Execute Test 1 (Port 8001 health)
2. Execute Test 2 (Port 8000 health)
3. Execute Test 3 (Memory)
4. Execute Test 4 (Context)
5. Execute Test 5 (Processes)
6. Execute Test 6 (Ports)
7. Verify all PASS
8. Document in PHASE_8_EXECUTION_LOG.md
9. System confirmed PRODUCTION-READY
