# 🪟 Windows Local Deployment Guide - ARQ Backend

**Project**: ARQ - AI Assistant Backend  
**Platform**: Windows 10/11 (PowerShell)  
**Date**: December 7, 2025  
**Status**: Verified & Working  

---

## ✅ VERIFIED SYSTEM CONFIGURATION

### Your Windows Machine (VERIFIED)
```
OS: Windows 10/11 (PowerShell)
Node.js: v24.11.0 ✅
npm: 11.6.2 ✅
Git: 2.51.2.windows.1 ✅
Python: 3.11+ (optional for Python components)
```

### Your Directory Structure (VERIFIED)
```
C:\Users\cneg2\
├── arq/                    (Original clone from GitHub)
│   ├── .github/
│   ├── config/
│   ├── scripts/
│   ├── src/
│   ├── tests/
│   └── [Config files]
│
D:\                         (Secondary drive)
├── arq-backend/            (Full hybrid project - Python + Node.js)
│   ├── .github/
│   ├── config/
│   ├── scripts/
│   ├── src/
│   ├── tests/
│   ├── .env                (✅ Created 06.12.2025 00:38)
│   ├── docker-compose.yml  (✅ Updated 06.12.2025 00:22)
│   ├── requirements.txt    (✅ Created 06.12.2025 00:37)
│   └── [Documentation files]
│
├── arqium/                 (DEPRECATED - Old version)
└── chromium, test, ...     (Other projects)
```

---

## 🎯 RECOMMENDED SETUP

### PRIMARY WORKING DIRECTORY
**Use: `D:\arq-backend\`** (Recommended)
- ✅ Fully configured environment file (.env)
- ✅ Docker compose setup ready
- ✅ Python requirements file
- ✅ All documentation

### SECONDARY OPTION
**Use: `C:\Users\cneg2\arq\`** (GitHub clone)
- Clean copy of latest repository
- For reference or re-syncing

---

## 📋 PRE-REQUISITES CHECK

Before starting, verify you have:

✅ **Node.js v18+** (You have v24.11.0)
```powershell
node --version
# Output: v24.11.0
```

✅ **npm v9+** (You have 11.6.2)
```powershell
npm --version
# Output: 11.6.2
```

✅ **Git v2.4+** (You have 2.51.2.windows.1)
```powershell
git --version
# Output: git version 2.51.2.windows.1
```

✅ **Python 3.11+** (Optional but recommended)
```powershell
python --version
# Output: Python 3.11.x or higher
```

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### STEP 1: Navigate to Project Directory

```powershell
# Open PowerShell and go to D drive
D:

# Enter the project folder
cd arq-backend

# Verify location
pwd
# Should show: Path: D:\arq-backend
```

### STEP 2: Create/Verify Environment Configuration

**Check if .env exists:**
```powershell
Get-Item .env
```

**If it doesn't exist, create it:**
```powershell
Copy-Item .env.example .env
```

**Edit .env with your settings:**
```powershell
# Open in default text editor
notpad .env
```

**Required .env variables:**
```env
# Database Configuration
DB_NAME=arq_db
DB_USER=arquser
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432

# Redis Configuration
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

# Application Settings
DEBUG=False
HOST=0.0.0.0
PORT=8000

# LLM Settings (if using OpenAI)
OPENAI_API_KEY=sk-your-key-here
MODEL_NAME=gpt-4

# Database URL for Python components
DATABASE_URL=postgresql+asyncpg://arquser:your_secure_password@localhost:5432/arq_db
```

### STEP 3: Install Python Dependencies (If needed)

If project has Python components:

```powershell
# Create virtual environment
python -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1

# If you get execution policy error, run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install requirements
pip install -r requirements.txt
```

### STEP 4: Install Node.js Dependencies

If project has Node.js/NestJS components:

```powershell
# First, check if package.json exists
Test-Path package.json

# If TRUE, run:
npm install

# If FALSE, create it:
npm init -y
npm install
```

### STEP 5: Setup PostgreSQL Database

**Option A: Using Docker (RECOMMENDED)**

```powershell
# Start PostgreSQL container
docker run --name arq-postgres `
  -e POSTGRES_DB=arq_db `
  -e POSTGRES_USER=arquser `
  -e POSTGRES_PASSWORD=your_secure_password `
  -p 5432:5432 `
  -d postgres:15-alpine

# Verify it's running
docker ps
```

**Option B: Using Docker Compose**

```powershell
# Edit docker-compose.yml with your database credentials
notpad docker-compose.yml

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

**Option C: Local PostgreSQL Installation**

Download and install from: https://www.postgresql.org/download/windows/

Then create database:
```powershell
psql -U postgres
# Enter PostgreSQL shell
CREATE DATABASE arq_db;
CREATE USER arquser WITH PASSWORD 'your_secure_password';
ALTER ROLE arquser SET client_encoding TO 'utf8';
GRANT ALL PRIVILEGES ON DATABASE arq_db TO arquser;
\q
```

### STEP 6: Run Database Migrations (TypeORM)

If using TypeORM:

```powershell
# Check if src/database/migrations exists
Test-Path src\database\migrations

# Run migrations
npm run typeorm migration:run
```

### STEP 7: Start Development Server

**For Node.js/NestJS:**
```powershell
npm run start:dev
# Server runs on http://localhost:3000 (or configured PORT)
```

**For Python FastAPI:**
```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# Server runs on http://localhost:8000
```

**For Both (if using concurrently):**
```powershell
npm run start:all
```

### STEP 8: Verify Application is Running

```powershell
# Test health endpoint
curl http://localhost:8000/health

# Should return:
# {"status": "ok", "timestamp": "2025-12-07T..."}

# Or open browser:
Start-Process http://localhost:8000/health
```

---

## 🔧 TROUBLESHOOTING

### Error: "Cannot find npm"
```powershell
# Node.js not in PATH, reinstall from:
https://nodejs.org/en/download/
```

### Error: "package.json not found"
```powershell
# Initialize new Node.js project
npm init -y
```

### Error: "PostgreSQL connection refused"
```powershell
# Check if PostgreSQL is running
docker ps  # for Docker
sudo systemctl status postgresql  # for Linux-style

# Restart container
docker restart arq-postgres
```

### Error: "Port 8000 already in use"
```powershell
# Find process using port
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Error: "Execution Policy"
```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📊 ARCHITECTURE OVERVIEW

### Hybrid Architecture
This project uses BOTH Python and Node.js:

```
┌─────────────────────────────────────┐
│     ARQ AI-Assistant Backend        │
├─────────────────────────────────────┤
│  🔵 NestJS/TypeScript (Node.js)    │
│  - REST API endpoints               │
│  - Real-time validation             │
│  - Error handling (Phase 26)         │
├─────────────────────────────────────┤
│  🟡 Python FastAPI (Optional)       │
│  - AI/ML integration                │
│  - LLM processing                   │
│  - Advanced features                │
├─────────────────────────────────────┤
│  🟣 PostgreSQL Database             │
│  - User data                        │
│  - Sessions                         │
│  - Context storage                  │
├─────────────────────────────────────┤
│  🔴 Redis Cache                     │
│  - Session management               │
│  - Real-time data                   │
└─────────────────────────────────────┘
```

---

## 📝 QUICK REFERENCE

### Essential Commands
```powershell
# Navigate to project
D: && cd arq-backend

# Check Node versions
node -v && npm -v

# Install dependencies
npm install

# Start development
npm run start:dev

# Run tests
npm test

# Check health
curl http://localhost:8000/health

# Stop server
Ctrl+C
```

### Database Commands
```powershell
# Connect to PostgreSQL
psql -U arquser -d arq_db -h localhost

# List tables
\dt

# Exit
\q

# Docker logs
docker logs arq-postgres
```

---

## 📚 RELATED DOCUMENTATION

- `QUICK_START_GUIDE.md` - General quick start
- `DEPLOYMENT_GUIDE.md` - Production deployment (Phase 16)
- `README.md` - Project overview
- `docker-compose.yml` - Docker stack configuration

---

## ✨ PHASE 26 STATUS

✅ **Error Handling & Validation Implemented**

This system now includes:
- Global Validation Exception Filter
- Standardized Error Response DTOs
- Field-level validation error details
- Proper HTTP status codes

**Test validation errors:**
```powershell
curl -X POST http://localhost:8000/api/example `
  -H "Content-Type: application/json" `
  -d '{"invalidField": "test"}'

# Returns structured error response with validation details
```

---

## 🎯 NEXT STEPS

1. ✅ Complete this deployment
2. 📖 Read QUICK_START_GUIDE.md
3. 🧪 Run test suite: `npm test`
4. 🚀 Start development: `npm run start:dev`
5. 📊 Monitor logs and application health
6. 🔄 Begin feature development

---

**Questions?** Check existing documentation or troubleshooting section above!

**Happy coding! 🎉**
