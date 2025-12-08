# ARQ Production User Acceptance Testing

## Executive Summary

This document outlines the complete production UAT procedures for the ARQ platform.
Priority: Critical - production deployment authorization depends on UAT completion.

## Pre-Production Approval Checklist

- [ ] All staging deployment procedures completed successfully
- [ ] Performance baselines established and documented
- [ ] Security audit completed with no critical findings
- [ ] Disaster recovery procedures tested
- [ ] Incident response team trained
- [ ] Deployment rollback procedures validated
- [ ] Data migration strategy approved
- [ ] Support team documentation completed
- [ ] Executive stakeholder sign-off obtained
- [ ] Monitoring and alerting fully configured

## Production Deployment Prerequisites

### Infrastructure Requirements
- Multi-AZ RDS PostgreSQL 14 (db.r6i.4xlarge, 512GB)
- ElastiCache Redis 7 with 5-node cluster (cache.r6g.xlarge)
- Application Load Balancer with 3+ AZ distribution
- Auto Scaling Group (3-20 instances)
- VPC with isolated subnets per AZ
- NAT Gateways in each AZ for HA
- VPN access for administrative operations
- DynamoDB for distributed locking
- S3 for backup storage with versioning

### Access and Authorization
- Production AWS IAM roles configured
- MFA enabled for all admin access
- VPN certificates deployed
- SSH key pairs secured in AWS Secrets Manager
- Database credentials stored in AWS RDS Secrets
- API keys secured and rotated monthly

## Phase 1: Production Connectivity Validation

### 1.1 Infrastructure Connectivity

```bash
# Test RDS master connectivity
psql -h <production-rds-endpoint> -U arqadmin -d arqdb -c "SELECT version();"

# Test RDS read replica
psql -h <production-rds-read-replica> -U arqadmin -d arqdb -c "SELECT COUNT(*) FROM information_schema.tables;"

# Test Redis primary
redis-cli -h <redis-primary> ping

# Test Redis replicas
for replica in <redis-replica-1> <redis-replica-2> <redis-replica-3>; do
  redis-cli -h $replica ping
done

# Verify ALB
aws elbv2 describe-load-balancers --names arq-alb-production
aws elbv2 describe-target-health --target-group-arn <tg-arn>
```

### 1.2 Network and Security

```bash
# Verify security group rules
aws ec2 describe-security-groups --group-ids <alb-sg> <ecs-sg> <rds-sg>

# Test VPN connectivity
ssh -i <vpn-key> ubuntu@<bastion-ip> "echo 'VPN connectivity OK'"

# Verify DNS resolution
nslookup prod.arq.example.com
nslookup prod-rds.arq.example.com
```

## Phase 2: Application Deployment

### 2.1 Deployment Process

1. **Pre-flight checks** (5 minutes)
   - Verify all infrastructure components healthy
   - Confirm database backups completed
   - Check backup storage available
   - Verify S3 bucket access

2. **Application rollout** (30 minutes)
   - Deploy new ECS tasks (rolling 1 per minute)
   - Monitor error rates during deployment
   - Verify service health checks passing
   - Scale to production capacity

3. **Database migration** (1-4 hours depending on data size)
   - Execute schema migrations
   - Verify migration completion
   - Check data integrity
   - Create final baseline backup

4. **Traffic migration** (15 minutes)
   - Shift 10% traffic to new deployment
   - Monitor metrics for 10 minutes
   - Shift remaining traffic
   - Keep previous deployment running 2 hours for rollback

### 2.2 Deployment Monitoring

Monitor during deployment:
- Error rate (should remain < 0.1%)
- p99 latency (should remain < 2s)
- Database connection pool utilization
- Cache hit ratio (target > 85%)
- CPU utilization (target < 70%)
- Memory utilization (target < 80%)
- Disk I/O operations

## Phase 3: Production Validation (First 24 Hours)

### 3.1 Smoke Tests (Every 1 hour)

```bash
# Health endpoint
curl -i https://api.arq.com/health

# Readiness probe
curl -i https://api.arq.com/readiness

# Liveness probe
curl -i https://api.arq.com/live
```

### 3.2 Critical API Tests (Every 4 hours)

```bash
# Authentication
curl -X POST https://api.arq.com/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username": "prod-test", "password": "<secure-password>"}'

# Dialogue creation
curl -X POST https://api.arq.com/api/dialogues \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"initial_message": "Production UAT test"}'

# Message processing
curl -X POST https://api.arq.com/api/dialogues/<id>/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message"}'
```

### 3.3 Database Validation (Every 2 hours)

```sql
-- Connection pool status
SELECT count(*) FROM pg_stat_activity WHERE state != 'idle';

-- Transaction throughput
SELECT count(*) FROM pg_stat_statements WHERE calls > 0;

-- Slow queries
SELECT query, calls, mean_time 
FROM pg_stat_statements 
WHERE mean_time > 1000 
ORDER BY mean_time DESC 
LIMIT 10;

-- Table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3.4 Cache Validation

```bash
# Cache stats
redis-cli INFO stats

# Memory usage
redis-cli INFO memory

# Key space
redis-cli INFO keyspace

# Client connections
redis-cli CLIENT LIST | wc -l
```

### 3.5 Performance Metrics

Target baselines for production:
- Request throughput: 1,000+ req/sec
- p50 latency: < 200ms
- p95 latency: < 1.0s
- p99 latency: < 2.0s
- Error rate: < 0.05%
- Cache hit ratio: > 85%
- Database query time: < 500ms (p99)
- API availability: > 99.95%

## Phase 4: Extended Monitoring (First 7 Days)

### 4.1 Daily Checklist

- [ ] Verify zero data loss events
- [ ] Check for memory leaks (trend analysis)
- [ ] Review error logs for new patterns
- [ ] Verify backup jobs completing
- [ ] Check replication lag < 100ms
- [ ] Confirm SSL certificate valid (> 30 days)
- [ ] Review security audit logs
- [ ] Check disk usage trend
- [ ] Verify disaster recovery capability
- [ ] Review user engagement metrics

### 4.2 Weekly Deep Dive Analysis

- Database query performance trends
- Cache efficiency analysis
- Infrastructure cost optimization
- Security compliance verification
- User experience metrics
- Incident trending
- Capacity planning review

## Phase 5: Rollback Procedures

### 5.1 Immediate Rollback (< 5 minutes)

If critical issues detected:

```bash
# Drain connections from new deployment
aws ecs update-service --cluster arq-production \
  --service arq --desired-count 0

# Re-enable previous deployment
aws ecs update-service --cluster arq-production \
  --service arq-previous --desired-count 10

# Route traffic back to previous deployment
aws elbv2 modify-rule --rule-arn <rule-arn> \
  --target-group-arn <previous-tg-arn>
```

### 5.2 Database Rollback

```bash
# If schema migrations failed
alembic downgrade -1

# If data corruption suspected
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier arq-production-restored \
  --db-snapshot-identifier arq-production-pre-deployment
```

### 5.3 Full Infrastructure Rollback

```bash
# This is emergency only - brings down production
terraform destroy -auto-approve -var-file=production.tfvars
```

## Sign-Off Requirements

Production deployment approved only when:

- [x] All connectivity tests passing
- [x] All API endpoints responding
- [x] Database queries executing within SLA
- [x] Cache operating efficiently
- [x] Error rate < 0.1%
- [x] Performance metrics within targets
- [x] Security compliance verified
- [x] Backup and recovery tested
- [x] On-call team briefed
- [x] Executive stakeholder approval obtained

**Production Deployment Authorized:** ___________
**By:** ___________
**Date:** ___________
**Time:** ___________
