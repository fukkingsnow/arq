# 🚀 ARQ AI-Assistant Backend - Quick Start Guide

**Project**: ARQ - AI Assistant with intelligent memory and context management  
**Version**: Phase 26 - Error Handling & Validation  
**Last Updated**: December 7, 2025  

---

## 📋 Prerequisites

Before starting, ensure you have:

### Required Software:
- **Python 3.11+** (for Python backend components)
- **Node.js 18+** (for NestJS/TypeScript components)
- **PostgreSQL 14+** (database)
- **Redis 7+** (caching)
- **Git**

### Recommended Tools:
- **Docker** & **Docker Compose** (for containerized setup)
- **VS Code** or **JetBrains PyCharm/WebStorm**
- **Postman** or **Insomnia** (API testing)
- **DBeaver** or **pgAdmin** (database management)

---

## 🛠️ Environment Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/fukkingsnow/arq.git
cd arq
```

### Step 2: Create Environment Configuration

```bash
# Copy example env file
cp .env.example .env
```

### Step 3: Configure .env File

Edit `.env` with your settings:

```env
# Database Configuration
DB_NAME=arq_db
DB_USER=arquser
DB_PASSWORD=arqpass123  # Change this!
DB_HOST=localhost
DB_PORT=5432

# Redis Configuration
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

# FastAPI / NestJS Settings
DEBUG=False
HOST=0.0.0.0
PORT=8000
APP_PORT=8000

# OpenAI / LLM Settings
OPENAI_API_KEY=sk-xxx  # Your OpenAI API key
MODEL_NAME=gpt-4
TEMPERATURE=0.7
MAX_TOKENS=2000

# Memory Settings
MEMORY_BATCH_SIZE=10
MEMORY_TTL_SECONDS=86400
MAX_CONTEXT_MESSAGES=20

# Database URL (PostgreSQL async driver)
DATABASE_URL=postgresql+asyncpg://arquser:arqpass123@localhost:5432/arq_db
```

---

## 🐘 Database Setup (PostgreSQL)

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker run --name arq-postgres \
  -e POSTGRES_DB=arq_db \
  -e POSTGRES_USER=arquser \
  -e POSTGRES_PASSWORD=arqpass123 \
  -p 5432:5432 \
  -d postgres:15-alpine

# Verify connection
docker exec arq-postgres psql -U arquser -d arq_db -c "SELECT version();"
```

### Option B: Manual PostgreSQL Installation

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE arq_db;
CREATE USER arquser WITH PASSWORD 'arqpass123';
ALTER ROLE arquser SET client_encoding TO 'utf8';
ALTER ROLE arquser SET default_transaction_isolation TO 'read committed';
ALTER ROLE arquser SET default_transaction_deferrable TO on;
ALTER ROLE arquser SET default_transaction_read_ahead TO on;
GRANT ALL PRIVILEGES ON DATABASE arq_db TO arquser;
\q
```

**On macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql

# Create database and user
createpg arq_db
psql arq_db
CREATE USER arquser WITH PASSWORD 'arqpass123';
GRANT ALL PRIVILEGES ON DATABASE arq_db TO arquser;
\q
```

### Option C: Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: arq_db
      POSTGRES_USER: arquser
      POSTGRES_PASSWORD: arqpass123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U arquser"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

Start services:
```bash
docker-compose up -d
```

---

## 📦 Install Dependencies

### Python Backend (if applicable)

```bash
# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### NestJS Backend (TypeScript)

```bash
# Install Node dependencies
npm install
# or
yarn install
```

---

## 🗄️ Database Migrations

### Option A: TypeORM Migrations

```bash
# Run pending migrations
npm run typeorm migration:run

# Create new migration
npm run typeorm migration:create src/database/migrations/AddNewTable
```

### Option B: Alembic Migrations (Python)

```bash
# Apply migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Add new table"
```

---

## ▶️ Start Development Server

### Option A: NestJS Development Server

```bash
# Start with watch mode
npm run start:dev

# Or compile and run
npm run build
npm run start:prod
```

### Option B: Python FastAPI Server

```bash
# Development
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Option C: Both Servers (Concurrent)

```bash
# Install concurrently
npm install --save-dev concurrently

# Add to package.json:
# "start:all": "concurrently \"npm run start:dev\" \"python -m uvicorn src.main:app --reload\""

npm run start:all
```

---

## ✅ Verify Application Health

### Check Server Status

```bash
# Health check endpoint
curl http://localhost:8000/health

# Expected response:
# {"status": "ok", "timestamp": "2025-12-07T11:00:00Z"}
```

### Check Database Connection

```bash
# Test database connectivity
npm run typeorm query:run "SELECT NOW()"
```

### API Testing

```bash
# Test validation error handling (Phase 26)
curl -X POST http://localhost:8000/api/test \
  -H "Content-Type: application/json" \
  -d '{"invalidField": "test"}'

# Expected error response:
# {
#   "statusCode": 400,
#   "timestamp": "2025-12-07T11:00:00.000Z",
#   "path": "/api/test",
#   "method": "POST",
#   "message": "Validation failed",
#   "errors": {
#     "requiredField": ["requiredField should not be empty"]
#   }
# }
```

---

## 🧪 Testing

### Unit Tests

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

### Integration Tests

```bash
# Run integration tests
npm run test:e2e
```

### Python Tests

```bash
pytest tests/
pytest tests/ -v  # Verbose
pytest tests/ --cov  # Coverage
```

---

## 📊 Database Management

### Access PostgreSQL

```bash
# Using psql directly
psql -U arquser -d arq_db -h localhost

# Common commands:
# \dt              - List tables
# \d tablename     - Describe table
# SELECT * FROM tablename LIMIT 10;  - Query data
# \q               - Quit
```

### Using pgAdmin (GUI)

```bash
# Run pgAdmin Docker container
docker run -p 5050:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@example.com \
  -e PGADMIN_DEFAULT_PASSWORD=admin \
  -d dpage/pgadmin4

# Access at http://localhost:5050
# Default credentials: admin@example.com / admin
```

---

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS

# Test connection
psql -U arquser -d arq_db -h localhost -c "SELECT 1"
```

### Redis Connection Issues

```bash
# Test Redis
redis-cli ping
# Should return: PONG

# If using Docker:
docker exec <redis-container> redis-cli ping
```

### Module Import Errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Or for Python:
rm -rf venv
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 📚 Phase 26: Error Handling & Validation

### What's Implemented

✅ **Validation Exception Filter** (`src/common/filters/validation-exception.filter.ts`)
- Global error handler for BadRequestException
- Standardized error response format
- Field-level validation error details

✅ **Error Response DTOs** (`src/common/dtos/error-response.dto.ts`)
- ErrorResponseDto - Standard error format
- ErrorMetadataDto - Error metadata with severity
- ValidationErrorDetailDto - Field validation details

✅ **Global Integration** (`src/app.module.ts`)
- Registered as APP_FILTER provider
- Applied to entire application

### Test Validation Error Handling

```bash
# Create test endpoint
cat > test-validation.js << 'EOF'
const http = require('http');
const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/example',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};

const req = http.request(options, (res) => {
  res.on('data', (d) => process.stdout.write(d));
});

req.write(JSON.stringify({ invalid: 'data' }));
req.end();
EOF

node test-validation.js
```

---

## 🚀 Docker Deployment

### Build Docker Image

```bash
docker build -t arq:latest .
```

### Run Container

```bash
docker run -p 8000:8000 \
  --env-file .env \
  --link arq-postgres:postgres \
  --link arq-redis:redis \
  arq:latest
```

### Using Docker Compose (Full Stack)

```bash
docker-compose up

# Access application at http://localhost:8000
```

---

## 📖 Next Steps

1. ✅ **Review Documentation**
   - Read `README.md` for project overview
   - Check `DEPLOYMENT_GUIDE.md` for production setup

2. 🔄 **Set Up Development Workflow**
   - Install Git hooks for pre-commit checks
   - Configure IDE with linting rules

3. 🧪 **Write Tests**
   - Unit tests for business logic
   - Integration tests for API endpoints

4. 📊 **Monitor Application**
   - Set up logging
   - Configure error tracking (Sentry)
   - Monitor performance metrics

---

## 📞 Support

For issues or questions:
1. Check `DEPLOYMENT_GUIDE.md` Troubleshooting section
2. Review project documentation in root directory
3. Open GitHub issue with details

---

**Happy coding! 🎉**
