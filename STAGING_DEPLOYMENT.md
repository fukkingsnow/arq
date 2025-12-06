# ARQ Staging Deployment Guide

## Overview

This guide describes the complete process for deploying ARQ to the staging environment,
including infrastructure provisioning, application deployment, and validation procedures.

## Pre-Deployment Checklist

- [ ] Terraform infrastructure code reviewed and validated
- [ ] All variables configured for staging environment
- [ ] AWS credentials configured and tested
- [ ] Docker images built and pushed to ECR
- [ ] Database migrations prepared and tested
- [ ] Environment-specific configuration files ready
- [ ] SSL certificates provisioned for staging domain
- [ ] Monitoring and logging configured
- [ ] Backup and disaster recovery procedures tested
- [ ] Security groups and network ACLs configured

## Phase 1: Infrastructure Provisioning

### 1.1 Terraform Initialization

```bash
cd terraform/
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### 1.2 Infrastructure Components Created

- VPC with multi-AZ public/private subnets
- RDS PostgreSQL 14 instance (db.r6i.2xlarge, 256GB)
- ElastiCache Redis 7 cluster (3 nodes, cache.r6g.xlarge)
- Application Load Balancer with health checks
- CloudWatch log groups with retention policies
- VPC Endpoints for AWS service access
- NAT Gateways for outbound internet connectivity

### 1.3 Post-Infrastructure Validation

```bash
# Verify RDS connectivity
psql -h <rds-endpoint> -U arqadmin -d arqdb -c "SELECT version();"

# Verify Redis connectivity
redis-cli -h <redis-endpoint> ping

# Verify ALB
aws elbv2 describe-load-balancers --names arq-alb-staging
```

## Phase 2: Database Setup

### 2.1 Schema Migration

```bash
alembic upgrade head
```

### 2.2 Initial Data Loading

```bash
python scripts/seed_staging_data.py
```

### 2.3 Database Backup

```bash
aws rds create-db-snapshot \
  --db-instance-identifier arq-postgres-staging \
  --db-snapshot-identifier arq-staging-baseline
```

## Phase 3: Application Deployment

### 3.1 Container Image Preparation

```bash
docker build -t arq:staging .
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag arq:staging <account-id>.dkr.ecr.us-east-1.amazonaws.com/arq:staging
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/arq:staging
```

### 3.2 ECS Task Definition

Create task definition with:
- Memory: 2048 MB (2 GB)
- CPU: 1024 CPU units
- Container port: 8000
- Environment variables: Database credentials, Redis URL, API keys
- Log driver: CloudWatch Logs
- Mount volumes: Configuration files

### 3.3 ECS Service Deployment

```bash
aws ecs create-service \
  --cluster arq-staging \
  --service-name arq-service \
  --task-definition arq:latest \
  --desired-count 3 \
  --launch-type FARGATE
```

### 3.4 Blue-Green Deployment Strategy

1. Deploy new version to separate target group
2. Run smoke tests on new version
3. Shift 10% traffic to new version
4. Monitor for 15 minutes
5. Shift remaining traffic
6. Keep old version running for 1 hour rollback window

## Phase 4: Validation

### 4.1 Health Checks

```bash
curl -i http://<alb-dns>/health
curl -i http://<alb-dns>/readiness
```

### 4.2 API Endpoint Testing

```bash
# Test authentication
curl -X POST http://<alb-dns>/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass"}'

# Test dialogue creation
curl -X POST http://<alb-dns>/api/dialogues \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"initial_message": "Hello"}'
```

### 4.3 Database Connectivity

```bash
# Check connection pooling
SELECT count(*) FROM pg_stat_activity;

# Check cache connectivity
REDIS COMMAND
```

### 4.4 Performance Baseline

```bash
# Run load test
locust -f locustfile.py --host=http://<alb-dns> -u 100 -r 10 -t 5m

# Collect metrics
- Response time (p50, p95, p99)
- Error rate
- Throughput (requests/sec)
- CPU utilization
- Memory utilization
```

## Phase 5: Monitoring Configuration

### 5.1 CloudWatch Dashboards

- Application metrics (latency, error rate, throughput)
- Infrastructure metrics (CPU, memory, disk, network)
- Database metrics (connections, queries, replication lag)
- Cache metrics (hit ratio, evictions, memory usage)

### 5.2 Alarms Configuration

- ALB target unhealthy: Alert if > 1 unhealthy target
- High error rate: Alert if error rate > 1%
- High latency: Alert if p99 latency > 2s
- Database CPU: Alert if > 80%
- Cache evictions: Alert if eviction rate increasing

### 5.3 Log Aggregation

```bash
# View application logs
aws logs tail /ecs/arq-staging --follow

# Query for errors
aws logs filter-log-events \
  --log-group-name /ecs/arq-staging \
  --filter-pattern "ERROR"
```

## Phase 6: Rollback Procedures

### 6.1 Quick Rollback (Last 1 Hour)

```bash
aws ecs update-service \
  --cluster arq-staging \
  --service arq-service \
  --task-definition arq:previous
```

### 6.2 Full Rollback (Infrastructure)

```bash
terraform destroy -auto-approve
```

### 6.3 Database Rollback

```bash
alembic downgrade -1
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier arq-postgres-staging-restore \
  --db-snapshot-identifier arq-staging-baseline
```

## Phase 7: Handoff to QA

- [ ] Staging environment URL: __________
- [ ] Test user credentials: __________
- [ ] Known issues and limitations documented
- [ ] Performance baseline established
- [ ] Monitoring dashboards accessible
- [ ] Incident escalation procedures documented
- [ ] On-call team briefed on deployment

## Post-Deployment Monitoring (First 24 Hours)

- Monitor error rates and latency trends
- Check for database connection pool exhaustion
- Monitor cache hit ratio and memory usage
- Review application logs for warnings
- Verify backup jobs completing successfully
- Test disaster recovery procedures

## Success Criteria

- Application responding to health checks
- All API endpoints functional
- Database queries executing within SLA
- Cache hit ratio > 80%
- Error rate < 0.1%
- p99 latency < 2 seconds
- Zero data loss or corruption
- Backups completing successfully
