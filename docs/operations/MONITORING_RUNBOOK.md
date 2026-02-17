# ARQ Production Monitoring & Operational Runbook

## Overview
This runbook provides step-by-step procedures for monitoring and operating ARQ in production.

## Monitoring Stack
- **Prometheus**: Metrics collection from apps, databases, infrastructure
- **CloudWatch**: AWS native monitoring
- **AlertManager**: Alert routing and management
- **PagerDuty**: On-call scheduling and escalation
- **Slack**: Real-time notifications
- **Grafana**: Dashboards and visualization
- **ELK Stack**: Log aggregation

## Core Metrics

### Application Metrics
- Request Rate: 1000+ req/sec target
- Error Rate: <0.1% target
- Latency: p50 <200ms, p95 <1s, p99 <2s
- Active Connections: Current WebSocket/HTTP
- Queue Depth: Messages waiting
- Cache Hit Ratio: >85% target

### Database Metrics
- Connection Count: Active connections
- Query Execution Time: p99 <500ms
- Transaction Throughput: TPS
- Replication Lag: <100ms target
- Database Size: Storage used
- Checkpoint Duration: Checkpoint time
- Slow Query Count: Threshold exceedances

### Infrastructure Metrics
- CPU Utilization: <70% target
- Memory Usage: <80% target
- Disk Usage: Alert at >80%
- Network I/O: In/out bytes
- Pod Restart Rate: Target 0
- Node Health: Status and readiness

### Cache Metrics
- Hit Ratio: >85% target
- Eviction Rate: Keys/second
- Memory Usage: Cache memory
- Key Count: Total cached keys
- Command Latency: <5ms target

## Alert Thresholds

### Critical (Page On-Call)
- Error rate > 1%
- API availability < 99%
- p99 latency > 5s
- Replication lag > 1s
- DB CPU > 90%
- Memory exhaustion (< 10%)
- Volume full (> 95%)

### Major (Notify Team)
- Error rate > 0.5%
- API availability < 99.5%
- p99 latency > 2s
- Connection pool > 80%
- Cache hit ratio < 70%
- Pod restart loop
- Slow queries +50% vs baseline

### Minor (Log)
- Error rate > 0.1%
- p99 latency > 1s
- Disk > 80%
- Pod evictions

## Troubleshooting

### High Error Rate (>0.5%)
Check: Recent deployments, error logs, DB connectivity, cache, external APIs

### High Latency (p99 > 2s)
Check: DB queries, cache hit ratio, network latency, pod resources

### DB Connection Pool Exhausted
Check: Active connections, long transactions, connection leaks
Actions: Kill idle transactions, restart pods

### Cache Miss Spike (hit ratio < 70%)
Check: Node health, memory, eviction rate, connectivity
Actions: Restart eviction policy, restart nodes if needed

## Escalation Procedures

### Level 1 - Automated
- Alert triggered
- Slack notification
- Dashboard displayed
- Historical analysis

### Level 2 - On-Call Engineer
- Paged via PagerDuty
- Joins incident channel
- Checks dashboard
- Executes troubleshooting

### Level 3 - Engineering Lead
- Escalated if not resolved in 15 min
- Approves rollback
- Stakeholder communication

### Level 4 - Executive
- Escalated if not resolved in 30 min
- War room activation
- Stakeholder updates every 5 min

## Daily Checklist
- [ ] Review overnight alerts
- [ ] Check backup completion
- [ ] Verify replication lag < 100ms
- [ ] Review error rate < 0.1%
- [ ] Check cache hit ratio > 85%
- [ ] SSL cert expiration > 30 days
- [ ] Stable disk usage
- [ ] Review slow queries
- [ ] All monitoring agents reporting
- [ ] On-call coverage verified

## Weekly Tasks
- Error trend analysis
- Capacity planning review
- Baseline comparison
- Security audit logs
- DR testing
- Documentation updates
- Team sharing

## Incident Postmortem
**ID:** ___________
**Duration:** From _____ to _____ (_____ min)
**Impact:** _____ users, _____ requests
**Root Cause:** _____
**Detection:** _____ min
**Resolution:** _____ min
**Action Items:** [List]
**Lessons:** [List]

## Contact Info
- On-Call: [PagerDuty]
- War Room: [Zoom]
- Channel: #arq-incidents
- Escalation: [Contact]
