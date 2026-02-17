# ARQ API Testing Guide

## Phase 34: Backend API Testing & Validation

### Objective
Complete comprehensive testing of all ARQ API endpoints to ensure proper functionality of authentication, user management, and browser automation features.

### Prerequisites
- NestJS application running on `http://localhost:3000`
- PostgreSQL database configured and connected
- Node.js 20.x and npm installed
- curl or Postman for API testing

### Testing Environment Setup

#### 1. Start Backend Development Server
```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Expected output:
# [Nest] 12345  - 12/10/2025, 6:00:00 PM   LOG [NestFactory] Nest application successfully started
# [Nest] 12345  - 12/10/2025, 6:00:00 PM   LOG [InstanceLoader] ARQModule dependencies initialized
# ... (modules loading)
# Listening on port 3000
```

#### 2. Start PostgreSQL (Docker Compose)
```bash
docker-compose up -d
# Starts PostgreSQL and Redis
```

#### 3. Access API Documentation
- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs-json

### API Endpoint Tests

#### Health Check
**Endpoint**: `GET /health`
```bash
curl http://localhost:3000/health

# Expected Response:
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "uptime": 123
}
```

#### Authentication Endpoints

##### 1. User Registration
**Endpoint**: `POST /auth/register`
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'

# Expected Response (201):
{
  "id": "uuid",
  "email": "test@example.com",
  "createdAt": "2025-12-10T18:00:00.000Z"
}
```

##### 2. User Login
**Endpoint**: `POST /auth/login`
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'

# Expected Response (200):
{
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "uuid",
    "email": "test@example.com"
  }
}
```

##### 3. Refresh Token
**Endpoint**: `POST /auth/refresh`
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "refresh_token_from_login"
  }'

# Expected Response (200):
{
  "accessToken": "new_jwt_token"
}
```

#### User Management Endpoints

##### Get User Profile
**Endpoint**: `GET /users/profile`
**Headers**: `Authorization: Bearer <accessToken>`
```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer <accessToken>"
```

##### Get All Users (Admin Only)
**Endpoint**: `GET /users`
**Headers**: `Authorization: Bearer <accessToken>` (Admin required)
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer <accessToken>"
```

### Testing Checklist

- [ ] Health endpoint responds correctly
- [ ] User registration creates account
- [ ] User login returns valid JWT tokens
- [ ] Refresh token generates new access token
- [ ] Protected endpoints require valid token
- [ ] Invalid credentials rejected
- [ ] Token expiration handled correctly
- [ ] Database persists user data
- [ ] Redis caching operational
- [ ] CORS properly configured

### Running Unit Tests
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test:cov
```

### Running E2E Tests
```bash
npm run test:e2e
```

### Common Issues & Solutions

#### Issue: "Database connection refused"
**Solution**: Ensure PostgreSQL is running via `docker-compose up -d`

#### Issue: "Port 3000 already in use"
**Solution**: Kill existing process or change `API_PORT` in .env

#### Issue: "TypeScript compilation errors"
**Solution**: Run `npm run build` to identify issues

### Next Steps
1. Complete API endpoint validation
2. Setup database with migrations
3. Seed test data
4. Write comprehensive unit tests
5. Configure CI/CD pipeline
6. Prepare deployment documentation

### Updated: December 10, 2025
**Status**: Phase 34 - API Testing Phase (90% Complete)
