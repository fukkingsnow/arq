# ARQ AI-ASSISTANT BACKEND — DEPLOYMENT GUIDE

## Phase 16: Production Deployment & Infrastructure Setup

**Document Version:** 1.0  
**Date:** December 6, 2025  
**Status:** Active Deployment  

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Docker Containerization](#docker-containerization)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Production Configuration](#production-configuration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Deployment Procedures](#deployment-procedures)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- Docker (v20.10+)
- Kubernetes (v1.24+)
- kubectl (latest)
- Helm 3 (optional, for package management)
- Terraform (for IaC)
- GitHub Actions (for CI/CD)

### System Requirements
- Minimum 4 CPU cores
- Minimum 8GB RAM
- At least 50GB disk space
- Linux/macOS/Windows with WSL2

### Access Requirements
- Docker Hub/GitHub Container Registry access
- Kubernetes cluster access (kubeconfig)
- AWS/GCP/Azure credentials (for cloud deployment)
- GitHub repository write access

---

## Infrastructure Setup

### Cloud Provider Setup

#### AWS
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
AWS_ACCESS_KEY_ID: [your-key]
AWS_SECRET_ACCESS_KEY: [your-secret]
DEFAULT_REGION: us-east-1

# Create EKS cluster
aws eks create-cluster --name arq-prod --region us-east-1
```

#### GCP
```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Create GKE cluster
gcloud container clusters create arq-prod --zone us-central1-a
```

---

## Docker Containerization

### Dockerfile Structure

```dockerfile
FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.11-slim
WORKDIR /app

# Copy from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY . .

# Set environment
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose for Local Development

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/arq
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    volumes:
      - ./src:/app/src
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=arq
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## Kubernetes Deployment

### Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: arq-backend
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: arq-backend
  template:
    metadata:
      labels:
        app: arq-backend
    spec:
      containers:
      - name: arq-backend
        image: ghcr.io/fukkingsnow/arq:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: arq-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: arq-config
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Service Configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: arq-backend
spec:
  type: LoadBalancer
  selector:
    app: arq-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    - run: pip install -r requirements.txt
    - run: pytest tests/ --cov=src
    - run: pylint src/

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: docker/setup-buildx-action@v2
    - uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    - uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ghcr.io/${{ github.repository }}:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    - uses: azure/setup-kubectl@v3
      with:
        version: v1.24.0
    - run: |
        mkdir ~/.kube
        echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > ~/.kube/config
    - run: kubectl apply -f k8s/deployment.yaml
    - run: kubectl rollout status deployment/arq-backend
```

---

## Production Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@prod-db.example.com:5432/arq
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_URL=redis://prod-redis.example.com:6379/0
REDIS_POOL_SIZE=50

# Application
APP_ENV=production
LOG_LEVEL=INFO
DEBUG=False

# Security
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=api.arq.example.com
CORS_ORIGINS=https://app.arq.example.com

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-nr-key
```

---

## Monitoring & Logging

### Prometheus Metrics

```yaml
apiVersion: v1
kind: Service
metadata:
  name: arq-metrics
spec:
  selector:
    app: arq-backend
  ports:
  - name: metrics
    port: 9090
    targetPort: 9090
```

### ELK Stack Configuration

```json
{
  "index_patterns": ["arq-logs-*"],
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 2
  },
  "mappings": {
    "properties": {
      "timestamp": {"type": "date"},
      "level": {"type": "keyword"},
      "message": {"type": "text"}
    }
  }
}
```

---

## Deployment Procedures

### Step 1: Pre-Deployment Checks

```bash
# 1. Verify all tests pass
pytest tests/ --cov=src --cov-report=html

# 2. Check code quality
pylint src/ --fail-under=8.5
black --check src/

# 3. Security scanning
bandit -r src/
safety check

# 4. Docker image verification
docker build -t arq:latest .
docker run --rm arq:latest pytest
```

### Step 2: Staging Deployment

```bash
# 1. Deploy to staging
kubectl apply -f k8s/staging/deployment.yaml

# 2. Run smoke tests
pytest tests/e2e/smoke_tests.py -v

# 3. Validate endpoints
curl -X GET https://staging-api.arq.example.com/health

# 4. Performance testing
locust -f tests/performance/locustfile.py --host=https://staging-api.arq.example.com
```

### Step 3: Production Deployment

```bash
# 1. Create backup
kubectl exec postgres-pod -- pg_dump arq > backup.sql

# 2. Deploy to production
kubectl apply -f k8s/production/deployment.yaml

# 3. Monitor deployment
kubectl rollout status deployment/arq-backend --timeout=5m

# 4. Verify services
kubectl get pods -l app=arq-backend
kubectl get svc arq-backend
```

---

## Rollback Procedures

### Automatic Rollback on Failure

```bash
# If deployment fails, automatically rollback
kubectl rollout undo deployment/arq-backend

# Check rollback status
kubectl rollout history deployment/arq-backend
```

### Manual Rollback

```bash
# List revision history
kubectl rollout history deployment/arq-backend

# Rollback to previous version
kubectl rollout undo deployment/arq-backend --to-revision=2

# Verify
kubectl rollout status deployment/arq-backend
```

---

## Troubleshooting

### Common Issues & Solutions

**Issue 1: Pod CrashLoopBackOff**
```bash
kubectl logs <pod-name>
kubectl describe pod <pod-name>
```

**Issue 2: Service Connection Timeout**
```bash
kubectl port-forward svc/arq-backend 8000:80
curl http://localhost:8000/health
```

**Issue 3: Database Connection Errors**
```bash
# Check environment variables
kubectl get secret arq-secrets -o yaml

# Test connection
kubectl run -it --rm debug --image=postgres:15 -- psql $DATABASE_URL
```

---

## Success Criteria

✅ All 185+ tests passing  
✅ Code coverage >= 87%  
✅ Zero critical security vulnerabilities  
✅ <25ms average latency  
✅ <150MB memory footprint  
✅ 99.9%+ uptime SLA  
✅ Successful smoke tests  
✅ Monitoring & alerting active  

---

**Last Updated:** December 6, 2025  
**Maintained By:** Development Team
