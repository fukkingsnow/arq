# ARQ Priority Execution Plan
## Phase 37: API Testing, Database Setup & Browser Development

**Date**: December 10, 2025, 10:00 PM MSK
**Status**: IN PROGRESS
**Target Completion**: December 11, 2025

---

## Priority Task 1: Complete API Testing with Postman (30-45 minutes)

### Objective
Comprehensively test all ARQ API endpoints to validate authentication flow, JWT token generation, and protected endpoint access.

### Documentation References
- [TESTING_GUIDE.md](https://github.com/fukkingsnow/arq/blob/main/docs/TESTING_GUIDE.md) - Phase 34 API Testing
- [README.md](https://github.com/fukkingsnow/arq/blob/main/README.md) - API Examples

### Endpoints to Test

#### 1. Health Check (EXISTING)
```bash
curl http://localhost:3000/health
```

#### 2. User Registration (PRIORITY)
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@arq.example.com", "password": "TestPassword123!"}'
```

#### 3. User Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@arq.example.com", "password": "TestPassword123!"}'
```

#### 4. Refresh Token
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "refresh_token_from_login"}'
```

#### 5. Protected Endpoint (GET /users/profile)
```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### Testing Checklist
- [ ] Health endpoint responds correctly
- [ ] User registration creates new account
- [ ] User login returns valid JWT tokens
- [ ] Refresh token generates new access token
- [ ] Protected endpoints require valid token
- [ ] Invalid credentials rejected (401)
- [ ] Token expiration handled correctly
- [ ] Database persists user data

---

## Priority Task 2: Database Setup (Phase 36, 1-2 hours)

### Objective
Setup PostgreSQL + Redis and execute TypeORM migrations.

### Step-by-Step Instructions

#### Step 1: Start Docker Containers
```bash
docker-compose -f docker-compose.dev.yml up -d
```

#### Step 2: Verify Connection
```bash
docker exec arq-postgres-dev psql -U arq_dev -d arq_development -c "SELECT 1;"
```

#### Step 3: Run TypeORM Migrations
```bash
npm run typeorm migration:run
```

#### Step 4: Verify Tables
```bash
docker exec arq-postgres-dev psql -U arq_dev -d arq_development -c "\\\\dt;"
```

Expected tables:
- users
- auth_tokens
- refresh_tokens
- browser_sessions
- browser_tabs

#### Step 5: Start Development Server
```bash
npm run start:dev
```

### Checklist
- [ ] Docker containers running
- [ ] PostgreSQL connection established
- [ ] All migrations executed
- [ ] All tables created
- [ ] Backend server running
- [ ] Swagger docs accessible

---

## Priority Task 3: Browser Development - Phase 10 Planning

### Objective
Plan browser automation implementation on OS Integration Layer foundation.

### Phase 10 Scope

1. **Selenium + WebDriver Integration**
2. **Headless Browser Control**
3. **Page Interaction Automation**
4. **Browser Session Management**

### API Endpoints (Phase 10)

```
POST   /browser/sessions              # Create new session
GET    /browser/sessions              # List user sessions
GET    /browser/sessions/:id          # Get session details
DELETE /browser/sessions/:id          # Close session
POST   /browser/sessions/:id/tabs     # Create tab
GET    /browser/sessions/:id/tabs     # List tabs
POST   /browser/sessions/:id/tabs/:tabId/navigate      # Navigate
POST   /browser/sessions/:id/tabs/:tabId/click         # Click element
POST   /browser/sessions/:id/tabs/:tabId/input         # Enter text
POST   /browser/sessions/:id/tabs/:tabId/screenshot    # Screenshot
POST   /browser/sessions/:id/tabs/:tabId/execute       # Execute JS
```

### Technology Stack
- Selenium 4+
- ChromeDriver / GeckoDriver
- WebDriver Protocol
- NestJS HTTP endpoints
- TypeORM database

### Implementation Timeline
- Week 1-2: Core WebDriver integration
- Week 2-3: Session & tab management
- Week 3: API endpoints
- Week 4: Testing & docs

### Success Criteria
- Browsers launch/terminate correctly
- Sessions persist in database
- All API endpoints functional
- Error handling comprehensive
- Performance < 5s per action
- Security: Users access only own sessions

---

## Summary & Next Actions

### Completed
1. Documentation review
2. Architecture understanding
3. STATUS.md update
4. Detailed execution plans

### In Progress
1. Task 1: API endpoint testing
2. Task 2: Database configuration
3. Task 3: Browser automation planning

### Next Steps
1. Complete all Priority Tasks 1-3
2. Verify API endpoints with live data
3. Begin Phase 10 implementation
4. Setup CI/CD pipeline
5. Prepare production deployment

---

**Version**: 1.0
**Updated**: December 10, 2025, 22:00 MSK
**Status**: Active Development
