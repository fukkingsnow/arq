# PHASE 7: Production Migration - Gradual Traffic Shift Strategy

## Status: IN PROGRESS
- Date: November 22, 2025
- Duration: ~60 minutes expected
- Target: 100% traffic migration from Variant A to Variant B+

## Overview

Phase 7 implements a **canary deployment strategy** for zero-downtime migration:
- **Variant A (Python 2.7)**: Port 8000 - Current Production (PID 10538)
- **Variant B+ (Python 3)**: Port 8001 - New Production Target (PID 5207)
- **Strategy**: Gradual traffic shift with continuous monitoring
- **Rollback**: Immediate if issues detected

## Current Status (Pre-Migration)

```
=== HEALTH CHECK ===
Variant A (Port 8000): RUNNING (PID 10538, Memory 11.2 MB)
Variant B+ (Port 8001): RUNNING (PID 5207, Memory 17.8 MB)
Both variants responding to curl requests
```

## Phase 7 Strategy: Three-Stage Migration

### Stage 1: 10% Traffic to Variant B+ (Baseline Canary)
Duration: 15 minutes
- Configuration: 90% Variant A | 10% Variant B+
- Monitoring: Response times, error rates, connection stability
- Success criteria: Error rate < 0.1%, Response time < 200ms
- Decision point: Proceed to Stage 2 if healthy

### Stage 2: 50% Traffic Split (Balanced Testing)
Duration: 15 minutes
- Configuration: 50% Variant A | 50% Variant B+
- Monitoring: Performance parity verification
- Success criteria: Both variants handle 50% load equally
- Decision point: Proceed to Stage 3 if parity confirmed

### Stage 3: 100% Traffic to Variant B+ (Full Migration)
Duration: 5-10 minutes
- Configuration: 0% Variant A | 100% Variant B+
- Monitoring: Full production load on Variant B+
- Success criteria: Stable operation, no errors
- Fallback: Ready to revert to Variant A if needed

## Nginx Configuration for Canary Deployment

### Stage 1 Configuration (10/90 split)
```nginx
upstream arq_backend {
    server 127.0.0.1:8000 weight=9;  # 90% traffic
    server 127.0.0.1:8001 weight=1;  # 10% traffic
}

server {
    listen 80;
    server_name arqio.ru api.arqio.ru app.arqio.ru;

    location / {
        proxy_pass http://arq_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /health {
        access_log off;
        return 200 "ARQ Backend OK\n";
        add_header Content-Type text/plain;
    }
}
```

### Stage 2 Configuration (50/50 split)
```nginx
upstream arq_backend {
    server 127.0.0.1:8000 weight=5;  # 50% traffic
    server 127.0.0.1:8001 weight=5;  # 50% traffic
}
# [Rest of configuration identical to Stage 1]
```

### Stage 3 Configuration (100% Variant B+)
```nginx
upstream arq_backend {
    server 127.0.0.1:8001;  # 100% traffic
}
# [Rest of configuration identical to Stage 1]
```

## Monitoring Metrics to Track

### Response Time Metrics
- Target: < 200ms (p95)
- Alert threshold: > 500ms
- Track per variant using response headers

### Error Rate Metrics
- Target: < 0.01%
- Alert threshold: > 0.1%
- Log all errors to ~/logs/migration.log

### Connection Stability
- Tracking: Dropped connections
- Target: Zero dropped connections
- Alert on: Any connection reset

### Memory Usage
- Variant A baseline: 11.2 MB
- Variant B+ baseline: 17.8 MB
- Alert if: > 100 MB for either variant

## Health Check Procedure

### Pre-Migration Verification
```bash
# Check both variants respond
curl -i http://127.0.0.1:8000
curl -i http://127.0.0.1:8001

# Check process status
ps aux | grep run_app
ps aux | grep runpy39

# Check network connectivity
netstat -tuln | grep 800
```

### Stage-Specific Checks
```bash
# During each stage, run health checks every 2 minutes
# Monitor: Response time, error count, connection state

# Stage 1-specific: Focus on 10% traffic impact
# If issues: Revert to 100% Variant A immediately

# Stage 2-specific: Monitor parity
# If load imbalance: Adjust weights or investigate

# Stage 3-specific: Full production verification
# If issues: Instant rollback to Variant A
```

## Rollback Procedure (Emergency)

### Immediate Rollback to Variant A
```nginx
upstream arq_backend {
    server 127.0.0.1:8000;  # 100% traffic
}
# Restart Nginx
```

**Time to execute**: < 30 seconds

### Full Variant B+ Rollback
If Variant B+ requires restart:
```bash
# Kill Variant B+ process
kill <PID_5207>

# Keep Variant A running (no disruption)
# System continues with 100% Variant A traffic
```

## Success Criteria

✓ Phase 7 is successful when:
1. Stage 1: 10% traffic for 15 minutes with < 0.01% error rate
2. Stage 2: 50% traffic for 15 minutes with performance parity
3. Stage 3: 100% Variant B+ traffic stable for > 10 minutes
4. All health checks passing
5. No connection drops or timeouts
6. Response times consistent with baseline

## Timeline

- **T+0:00**: Documentation created (current)
- **T+0:05**: Nginx configuration deployed (Stage 1)
- **T+0:20**: Monitor Stage 1 results
- **T+0:25**: Deploy Stage 2 configuration
- **T+0:40**: Monitor Stage 2 results
- **T+0:45**: Deploy Stage 3 configuration (100% B+)
- **T+0:55**: Monitor full production stability
- **T+1:00**: Phase 7 complete - Full migration achieved

## Notes

- Variant A remains active on port 8000 as fallback throughout migration
- Variant B+ (Python 3.9) proven stable in Phase 6 testing
- No manual intervention required if metrics stay within thresholds
- All decisions logged to migration.log for post-migration analysis
- GitHub commits track each configuration change

## Next Phase

Phase 8: Monitoring Optimization & Connection Recovery Testing
- Extended monitoring (4-24 hours)
- Forced disconnection testing
- Reconnection system validation
- Performance optimization based on metrics
