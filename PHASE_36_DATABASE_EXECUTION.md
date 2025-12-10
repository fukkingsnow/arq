# Phase 36: Database Execution Commands

**Status:** READY FOR EXECUTION
**Timeline:** 30-45 minutes
**Date:** December 10, 2025

## Quick Start Commands

### Terminal 1: Start Docker Containers

```bash
# Navigate to project root
cd /path/to/arq

# Start PostgreSQL and Redis containers
docker-compose -f docker-compose.dev.yml up -d

# Verify containers are running and healthy
docker-compose -f docker-compose.dev.yml ps
```

**Expected Output:**
```
NAME            STATUS
arq-postgres-dev   Up (healthy)
arq-redis-dev      Up (healthy)
```

### Step 2: Verify Database Connection

```bash
# Test PostgreSQL connection
docker exec arq-postgres-dev psql -U arq_dev -d arq_development -c "SELECT 1;"
```

**Expected Output:** `1` (single column with value 1)

### Step 3: Run TypeORM Migrations

```bash
# Ensure migrations directory exists
mkdir -p src/migrations

# Run pending migrations
npm run typeorm migration:run

# If no migrations exist, generate initial schema
npm run typeorm migration:generate -- -n InitialSchema

# Then run the generated migration
npm run typeorm migration:run
```

### Step 4: Verify All Tables Created

```bash
# List all tables in the database
docker exec arq-postgres-dev psql -U arq_dev -d arq_development -c "\\dt;"
```

**Expected Tables:**
- users
- auth_tokens
- refresh_tokens
- browser_sessions
- browser_tabs
- migrations (created by TypeORM)

### Terminal 2: Start Backend Server

```bash
# In a new terminal window
cd /path/to/arq

# Install dependencies (if needed)
npm install

# Start development server
npm run start:dev
```

**Expected Output:**
```
[Nest] Application successfully started on http://localhost:3000
```

### Step 5: Verify API is Running

```bash
# In a new terminal (Terminal 3)
curl http://localhost:3000/api/docs
```

**Expected:** Swagger UI documentation should load (200 OK response)

## Full Execution Checklist

- [ ] Docker containers started (`docker-compose -f docker-compose.dev.yml up -d`)
- [ ] Containers are healthy (`docker-compose -f docker-compose.dev.yml ps`)
- [ ] PostgreSQL connection verified (`SELECT 1;`)
- [ ] Migrations directory exists (`src/migrations/`)
- [ ] TypeORM migrations executed (`npm run typeorm migration:run`)
- [ ] All expected tables created in database
- [ ] Backend server started on port 3000 (`npm run start:dev`)
- [ ] Swagger API docs accessible (`http://localhost:3000/api/docs`)

## Error Handling

### If Docker containers fail to start:
```bash
# Check logs
docker-compose -f docker-compose.dev.yml logs

# Restart containers
docker-compose -f docker-compose.dev.yml restart

# Force recreate if needed
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

### If migrations fail:
```bash
# Check TypeORM config
cat ormconfig.js

# Verify connection string
echo $DATABASE_URL

# Try generating migrations
npm run typeorm migration:generate -- -n InitialSchema
```

### If port 3000 is in use:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run start:dev
```

## Success Criteria

After completion, verify:

1. ✅ PostgreSQL container running and healthy
2. ✅ Redis container running and healthy
3. ✅ Database connection established
4. ✅ All 5+ TypeORM tables created
5. ✅ Backend server accessible on port 3000
6. ✅ Swagger API documentation available

## Next: API Testing

Once database setup is complete:
1. Execute API tests from PHASE_34_API_TESTING_RESULTS.md
2. Use curl commands documented in test plan
3. Verify all endpoints returning expected responses
4. Document results in test results table

**Estimated Time:** 45 minutes from start to API testing ready
