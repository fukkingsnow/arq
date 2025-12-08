# Setup Guide - ARQ Development Environment

This guide provides detailed instructions for setting up the ARQ backend for local development.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Methods](#installation-methods)
3. [Database Setup](#database-setup)
4. [Redis Setup](#redis-setup)
5. [Running the Application](#running-the-application)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements

- **OS**: Linux (Ubuntu 20.04+, Debian 11+), macOS 12+, or Windows 10/11 with WSL2
- **Python**: 3.11 or higher
- **Docker**: 20.10+ (for containerized setup)
- **Docker Compose**: 2.0+ (for containerized setup)
- **Git**: Latest version
- **RAM**: Minimum 2GB (4GB recommended)
- **Disk Space**: 2GB for dependencies and databases

### Optional Requirements

- **PostgreSQL**: 14+ (if not using Docker)
- **Redis**: 7+ (if not using Docker)
- **Make**: For running make commands
- **curl**: For testing API endpoints

## Installation Methods

### Method 1: Docker Compose (Recommended for Development)

#### Step 1: Clone Repository

```bash
git clone https://github.com/fukkingsnow/arq.git
cd arq
```

#### Step 2: Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` file and configure:

```env
# Database configuration
DATABASE_URL=postgresql://arq_user:arq_password@db:5432/arq_db
DB_POOL_SIZE=20
DB_POOL_RECYCLE=3600

# Redis configuration
REDIS_URL=redis://redis:6379/0
REDIS_DB=0
CACHE_TTL=3600

# FastAPI configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
WORKERS=4

# Memory configuration
MEMORY_MAX_SIZE=1000
MEMORY_RETENTION_DAYS=30
CONTEXT_WINDOW_SIZE=10
```

#### Step 3: Start Services

```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f arq-api
```

#### Step 4: Initialize Database

```bash
# Run migrations if applicable
docker-compose exec arq-api python -m alembic upgrade head

# Or create tables manually (if not using migrations)
docker-compose exec arq-api python -c "from src.config import DATABASE_URL; print('Database connected')"
```

#### Step 5: Verify Services

```bash
# Check API health
curl http://localhost:8000/health

# Check API is running
curl http://localhost:8000/

# Check PostgreSQL connection
docker-compose exec db psql -U arq_user -d arq_db -c "SELECT 1;"

# Check Redis connection
docker-compose exec redis redis-cli ping
```

### Method 2: Local Python Environment

#### Step 1: Clone Repository

```bash
git clone https://github.com/fukkingsnow/arq.git
cd arq
```

#### Step 2: Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Upgrade pip
pip install --upgrade pip setuptools wheel
```

#### Step 3: Install Dependencies

```bash
# Install Python packages
pip install -r requirements.txt
```

#### Step 4: Database Setup (Local)

See [Database Setup](#database-setup) section below.

#### Step 5: Redis Setup (Local)

See [Redis Setup](#redis-setup) section below.

#### Step 6: Environment Configuration

```bash
cp .env.example .env
```

Update `.env` for local development:

```env
DATABASE_URL=postgresql://localhost:5432/arq_db
REDIS_URL=redis://localhost:6379/0
DEBUG=True
```

#### Step 7: Run Application

```bash
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

## Database Setup

### Using Docker Compose

The database is automatically created by `docker-compose.yml`. Connection details:

```
Host: db
Port: 5432
Database: arq_db
Username: arq_user
Password: arq_password (from .env)
```

### Using Local PostgreSQL

#### On Linux/macOS

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib  # Ubuntu/Debian
brew install postgresql  # macOS

# Start PostgreSQL
sudo systemctl start postgresql  # Ubuntu/Debian
brew services start postgresql  # macOS

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE arq_db;"
sudo -u postgres psql -c "CREATE USER arq_user WITH PASSWORD 'arq_password';"
sudo -u postgres psql -c "ALTER ROLE arq_user SET client_encoding TO 'utf8';"
sudo -u postgres psql -c "ALTER ROLE arq_user SET default_transaction_isolation TO 'read committed';"
sudo -u postgres psql -c "ALTER ROLE arq_user SET default_transaction_deferrable TO on;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE arq_db TO arq_user;"
```

#### On Windows

1. Download PostgreSQL installer from https://www.postgresql.org/download/windows/
2. Run installer and note password for `postgres` user
3. Open pgAdmin or psql and run:

```sql
CREATE DATABASE arq_db;
CREATE USER arq_user WITH PASSWORD 'arq_password';
GRANT ALL PRIVILEGES ON DATABASE arq_db TO arq_user;
```

### Verify Database Connection

```bash
# Test connection
psql postgresql://arq_user:arq_password@localhost:5432/arq_db -c "SELECT version();"
```

## Redis Setup

### Using Docker Compose

Redis is automatically started with `docker-compose.yml`.

### Using Local Redis

#### On Linux/macOS

```bash
# Install Redis
sudo apt-get install redis-server  # Ubuntu/Debian
brew install redis  # macOS

# Start Redis
sudo systemctl start redis-server  # Ubuntu/Debian
brew services start redis  # macOS

# Verify Redis
redis-cli ping  # Should return: PONG
```

#### On Windows

1. Option A: Use WSL2 and follow Linux instructions
2. Option B: Use Docker: `docker run -d -p 6379:6379 redis:latest`
3. Option C: Use Windows native package from https://github.com/microsoftarchive/redis

### Configure Redis Connection

Update `.env`:

```env
REDIS_URL=redis://localhost:6379/0
```

### Verify Redis Connection

```bash
redis-cli ping  # Should return: PONG
```

## Running the Application

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f arq-api
```

### Using Python Virtual Environment

```bash
# Activate virtual environment
source venv/bin/activate

# Run with auto-reload (development)
python -m uvicorn src.main:app --reload

# Run production mode
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Verification

### Check Application Health

```bash
# Health endpoint
curl http://localhost:8000/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "uptime": 3600
}
```

### Check API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Run Tests

```bash
# Run all tests
pytest src/ -v

# Run specific test file
pytest src/tests/test_main.py -v

# Run with coverage
pytest src/ --cov=src --cov-report=html

# View coverage report
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

### Check Code Quality

```bash
# Lint check
flake8 src/ --max-line-length=100

# Format check
black src/ --check

# Type checking
mypy src/
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
python -m uvicorn src.main:app --port 8001
```

### Database Connection Errors

```bash
# Test database connection
psql postgresql://arq_user:arq_password@localhost:5432/arq_db -c "SELECT 1;"

# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS

# Restart PostgreSQL
sudo systemctl restart postgresql  # Linux
brew services restart postgresql  # macOS
```

### Redis Connection Errors

```bash
# Test Redis connection
redis-cli ping

# Check if Redis is running
sudo systemctl status redis-server  # Linux
brew services list | grep redis  # macOS

# Restart Redis
sudo systemctl restart redis-server  # Linux
brew services restart redis  # macOS
```

### Docker Compose Issues

```bash
# Rebuild containers
docker-compose build --no-cache

# Remove volumes and rebuild
docker-compose down -v
docker-compose up -d

# Check logs for errors
docker-compose logs -f
```

### Virtual Environment Issues

```bash
# Deactivate current environment
deactivate

# Remove virtual environment
rm -rf venv

# Recreate virtual environment
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Permission Denied Errors

```bash
# On Linux, fix Docker permission
sudo usermod -aG docker $USER
newgrp docker

# For PostgreSQL
sudo chown postgres:postgres /var/lib/postgresql
```

## Development Workflow

### Making Changes

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests: `pytest src/ -v`
4. Commit changes: `git commit -m "Add feature"`
5. Push to GitHub: `git push origin feature/your-feature`

### Code Style

- Follow PEP 8
- Use type hints
- Include docstrings
- Format with Black: `black src/`
- Lint with flake8: `flake8 src/`

## Next Steps

1. Read [README.md](README.md) for project overview
2. Review [.env.example](.env.example) for configuration options
3. Check [API Documentation](http://localhost:8000/docs) for available endpoints
4. Review [GitHub Actions](.github/workflows/deploy.yml) for CI/CD pipeline

## Support

For issues or questions:
- Check [Troubleshooting](#troubleshooting) section
- Open an issue on GitHub
- Review logs: `docker-compose logs` or check console output
