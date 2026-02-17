# Variant B+ - Python 3.9 Deployment (Beget Container)

## Overview

**Variant B+** is an enhanced deployment strategy that uses Beget's container environment (accessible via `ssh localhost -p222`) to run Python 3.9 with full application containerization support.

## Architecture

```
Beget Shared Hosting (romasaw4.beget.tech)
├─ Main Host: Python 2.7.3 (Current Deployment)
│  └─ ARQ running on port 8000
└─ Container: ssh localhost -p222
   ├─ Python 3.9+
   ├─ Docker support
   ├─ make, gcc, ld (compilation tools)
   └─ FastAPI application
```

## Key Advantages Over Variant A

✅ Python 3.9+ with full ecosystem
✅ Docker and containerization ready
✅ FastAPI framework (not Python 2.7 WSGI)
✅ Modern async/await support
✅ Zero-downtime deployment with docker-compose
✅ Better performance and scalability

## Setup Instructions

### 1. Access Container Environment

```bash
# From main host, connect to container
ssh localhost -p222

# Check Python version
python3 --version
```

### 2. Clone Repository (in Container)

```bash
cd ~
git clone https://github.com/fukkingsnow/arq.git
cd arq
```

### 3. Create Python 3.9 Virtual Environment

```bash
python3 -m venv venv_py39
source venv_py39/bin/activate
pip install --upgrade pip setuptools wheel
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt

# Includes:
# - fastapi
# - uvicorn
# - gunicorn
# - gevent
# - psycopg2 (PostgreSQL)
# - redis
```

### 5. Run FastAPI Application

```bash
# Development
uvicorn src.main:app --host 127.0.0.1 --port 8001 --reload

# Production
gunicorn src.main:app -w 4 -b 127.0.0.1:8001
```

### 6. Docker Deployment (Alternative)

```bash
# Build image
docker build -t arq-api:latest .

# Run container
docker run -p 8001:8000 arq-api:latest

# Using docker-compose
docker-compose up -d
```

## Parallel Deployment Strategy

**Current State**:
- Variant A (Python 2.7): Active on port 8000
- Variant B+ (Python 3.9): Setup in container on port 8001

**Migration Path**:
1. Test B+ in container environment
2. Verify functionality matches Variant A
3. Configure reverse proxy to port 8001
4. Gradually migrate traffic
5. Decommission Variant A

## Monitoring

```bash
# Container health check
ssh localhost -p222 'ps aux | grep gunicorn'

# View application logs
ssh localhost -p222 'tail -f logs/app.log'

# Compare ports
ps aux | grep python  # Main: port 8000 (Python 2.7)
ssh localhost -p222 'ps aux | grep python'  # Container: port 8001 (Python 3.9)
```

## Rollback Plan

If issues occur:
1. Variant A remains active on port 8000
2. Revert Nginx to port 8000
3. Debug Variant B+ in container
4. No production downtime

## Next Steps

1. Access container via `ssh localhost -p222`
2. Follow setup instructions above
3. Test on port 8001
4. Configure Nginx for port 8001
5. Monitor for 24 hours
6. Decommission Variant A if stable
