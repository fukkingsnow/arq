# ARQ - AI Assistant Backend

An intelligent AI assistant with advanced memory, context management, and real-time dialogue processing capabilities. Built with NestJS and TypeScript, supporting multiple deployment platforms (local, Docker, Beget hosting).

## Overview

ARQ is a production-ready backend service designed for building AI-powered dialogue systems with:

- **Intelligent Memory Management**: Persistent context storage with Redis caching
- **Real-time Processing**: Async/await architecture for high-performance operations
- **Multi-platform Deployment**: Support for local development, Docker containers, and Beget hosting
- **CI/CD Integration**: Automated testing, building, and deployment pipelines
- **Scalable Architecture**: PostgreSQL for persistent storage, async patterns for concurrency
- **Security-First Design**: Environment-based configuration, non-root containers, health checks

## Quick Start

### Prerequisites

- Node.js 20.x+
- npm or yarn
- Docker & Docker Compose (optional)
- PostgreSQL 14+ (or use Docker)
- Redis 7+ (or use Docker)
- Git

### Local Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/fukkingsnow/arq.git
cd arq
```

2. **Install dependencies**

```bash
npm install
```

3. **Create environment configuration**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/arq_db
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=user
DB_PASSWORD=password
DB_DATABASE=arq_db

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# API Configuration
API_HOST=0.0.0.0
API_PORT=3000
NODE_ENV=development
DEBUG=true

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=3600
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRATION=604800

# AI/ML (Optional)
OPENAI_API_KEY=your_key_here
```

4. **Using Docker Compose (Recommended)**

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Redis cache
- ARQ NestJS server (accessible at http://localhost:3000)

5. **Using Local Environment (Development)**

```bash
npm run start:dev
```

The API will be available at http://localhost:3000

## Project Structure

```
arq/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline configuration
├── src/
│   ├── main.ts                 # NestJS application entry point
│   ├── app.module.ts           # Root application module
│   ├── entities/               # TypeORM database entities
│   ├── repositories/           # Data access layer
│   ├── services/               # Business logic layer
│   ├── controllers/            # API endpoint handlers
│   ├── dtos/                   # Data transfer objects
│   ├── guards/                 # Route protection guards
│   ├── decorators/             # Custom NestJS decorators
│   ├── modules/                # Feature modules
│   ├── common/                 # Shared utilities and filters
│   ├── filters/                # Exception filters
│   └── config/                 # Configuration management
├── .env.example                # Configuration template
├── Dockerfile                  # Production container image
├── docker-compose.yml          # Local development environment
├── package.json                # Node.js dependencies
├── tsconfig.json               # TypeScript configuration
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## API Documentation

### Available Endpoints

#### Health Checks

- `GET /health` - Service health status
- `GET /ready` - Readiness probe for Kubernetes/orchestrators

#### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get current user profile

#### Users

- `GET /users` - List all users (admin only)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (admin only)

#### Browser Automation

- `POST /browser/sessions` - Create new browser session
- `GET /browser/sessions` - List user sessions
- `GET /browser/sessions/:id` - Get session details
- `DELETE /browser/sessions/:id` - Close session
- `POST /browser/sessions/:id/tabs` - Create tab in session
- `GET /browser/sessions/:id/tabs` - List session tabs

Full API documentation with Swagger UI:

- **Interactive Docs**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs-json

### Example Usage

```bash
# Health check
curl http://localhost:3000/health

# Register new user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

## Configuration

All configuration is managed through environment variables. See `.env.example` for all available options.

### Key Configuration Sections

**Database Configuration**

- `DATABASE_URL`: PostgreSQL connection string
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_USERNAME`: Database user
- `DB_PASSWORD`: Database password
- `DB_DATABASE`: Database name

**Redis Configuration**

- `REDIS_URL`: Redis connection string
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port
- `REDIS_DB`: Redis database number

**NestJS Configuration**

- `API_HOST`: Bind host (default: 0.0.0.0)
- `API_PORT`: Bind port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `DEBUG`: Debug mode

**JWT Configuration**

- `JWT_SECRET`: JWT secret key
- `JWT_EXPIRATION`: Token expiration in seconds
- `JWT_REFRESH_SECRET`: Refresh token secret
- `JWT_REFRESH_EXPIRATION`: Refresh token expiration in seconds

**AI/ML Integrations (Optional)**

- `OPENAI_API_KEY`: OpenAI API key
- `OPENAI_MODEL`: Model selection

**Beget Hosting (Optional)**

- `BEGET_API_KEY`: Beget API credentials
- `BEGET_DOMAIN`: Hosted domain name

## Deployment

### Docker Deployment

```bash
# Build production image
docker build -t arq:latest .

# Run container
docker run -d \
  -e DATABASE_URL=postgresql://user:pass@db:5432/arq \
  -e REDIS_URL=redis://redis:6379/0 \
  -e JWT_SECRET=your_secret \
  -p 3000:3000 \
  --name arq-api \
  arq:latest
```

### Docker Compose Deployment

```bash
docker-compose up -d
```

### Beget Hosting Deployment

The repository includes GitHub Actions CI/CD pipeline that automatically:

1. Builds NestJS application
2. Builds Docker image
3. Deploys to Beget hosting

**Setup Instructions**:

1. Add GitHub Secrets to your repository:
   - `BEGET_FTP_SERVER`: Your Beget FTP server
   - `BEGET_FTP_USER`: FTP username
   - `BEGET_FTP_PASSWORD`: FTP password

2. Configure `.env` on your Beget hosting with required variables

3. Push to main branch to trigger automatic deployment
4. 
### Production deployment with PM2

For production deployments on servers with PM2, the backend is managed through a single process:

**Process Management**
```bash
# First deployment - create process from config
pm2 start ecosystem.config.js

# Subsequent deployments - restart by name (recommended)
pm2 restart arq-backend || pm2 start ecosystem.config.js

# View logs
pm2 logs arq-backend

# Check status
pm2 status arq-backend
```

**Configuration Requirements**
- Backend port: 8000 (fixed in ecosystem.config.js)
- Process name: `arq-backend` (single instance, single name)
- Health check: GET /health on port 8000
- wait_ready: false (external curl health check in CI)

**Deployment Flow**
1. GitHub Actions CI/CD runs `pm2 delete arq-backend || true` to clean old processes
2. Runs `fuser -k 8000/tcp || true` to ensure port is free
3. Executes `pm2 restart arq-backend || pm2 start ecosystem.config.js` to start/restart
4. Performs health check via curl to verify service is ready
5. Reloads nginx if configured

**Important Notes**
- ✅ Ручные запуски `node dist/main.js` на продовом сервере **запрещены**
- ✅ All production launches must use PM2 process manager
- ✅ Idempotent deployment: multiple deploys won't create duplicate processes
- ✅ Health check is external to PM2 (no wait_ready conflicts)

See `ecosystem.config.js` and `.github/workflows/deploy.yml` for implementation details.

## Development

### Available Scripts

```bash
# Install dependencies
npm install

# Development mode with auto-reload
npm run start:dev

# Production build
npm run build

# Production mode
npm run start:prod

# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Linting
npm run lint

# Format code
npm run format
```

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage report
npm run test:cov

# Run E2E tests
npm run test:e2e
```

## Health Checks

The service includes comprehensive health checks:

```bash
# Application health
curl http://localhost:3000/health

# Response format
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "uptime": 3600
}
```

## Performance Tuning

### Production Optimization

1. **Database Connection Pool**
   - Adjust connection pool size based on expected concurrent connections
   - Typical: 5-20 for small deployments, 20-100 for large scale

2. **Node.js Worker Threads**
   - Use clustering module for multi-core utilization
   - Set `NODE_ENV=production` for optimizations

3. **Memory Management**
   - Monitor Node.js heap usage
   - Configure appropriate garbage collection settings

4. **Caching**
   - Use Redis for frequently accessed data
   - Configure appropriate TTL values

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql postgresql://user:password@localhost:5432/arq_db -c "SELECT 1;"

# Check from application logs
npm run start:dev
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping

# Check Redis status
redis-cli info
```

### Application Issues

Check logs:

```bash
# Development mode logs
npm run start:dev

# Docker Compose logs
docker-compose logs arq
```

## Monitoring

### Logging

Logs are output to stdout and can be collected by container orchestration systems.

### Metrics

Enable metrics collection by setting:

```env
ENABLE_METRICS=true
METRICS_PORT=9090
```

## Architecture

The backend follows NestJS best practices with:

- **Modular Architecture**: Feature-based modules with clear separation of concerns
- **Dependency Injection**: Full DI container for loose coupling
- **Database Layer**: TypeORM with repositories for data access
- **Service Layer**: Business logic isolated from HTTP concerns
- **Guards & Decorators**: Fine-grained access control
- **Error Handling**: Centralized exception filters

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Support

For issues and questions:

- Open an issue on GitHub
- Check existing documentation
- Review configuration examples in .env.example

## Changelog

### Version 0.1.0 (Current)

- NestJS application foundation
- PostgreSQL database integration via TypeORM
- Redis caching support
- JWT authentication
- Docker containerization
- Modular architecture with services, repositories, and controllers
- CI/CD pipeline with GitHub Actions
- Environment-based configuration
- Type-safe NestJS implementation with full TypeScript support


---

## 🚀 Phase 4 - Advanced PR Management & Strategy Analysis (NEW)

### Overview

Phase 4 introduces automated GitHub PR management and intelligent development strategy analysis to ARQ.

### Phase 4 Features

#### 1. **Automated PR Management** (Issue #4)
- Automatic branch creation and file updates
- AI-powered PR description generation
- Real-time PR status monitoring
- Automatic merge when conditions are met
- Self-review comment functionality
- Comprehensive error handling

#### 2. **Autonomous Strategy Analyzer** (Issue #7)
- Repository health assessment
- Multi-dimensional metrics analysis
- Priority-based focus areas
- AI-powered recommendations
- Risk and opportunity identification
- Strategy caching for performance

#### 3. **Enhanced Endpoints** (Issue #6)
- `POST /arq/start-development` - Start development with strategy awareness
- `GET /arq/strategy/analyze` - Analyze current development strategy
- `POST /arq/strategy/execute` - Execute recommended strategy
- `GET /arq/pr-status` - Monitor all active PRs
- `GET /arq/pr-status/:prNumber` - Get specific PR status

### Phase 4 API Usage

```bash
# Analyze development strategy
curl -X GET http://localhost:3000/arq/strategy/analyze

# Execute strategy
curl -X POST http://localhost:3000/arq/strategy/execute

# Check PR status
curl -X GET http://localhost:3000/arq/pr-status/123

# Get all PR statuses
curl -X GET http://localhost:3000/arq/pr-status
```

### Documentation

- **Phase 4 Summary**: See `PHASE4_COMPLETION_SUMMARY.md`
- **Integration Tests**: See `INTEGRATION_TESTS_PHASE4.md`
- **Unit Tests**: See `src/pull-request.manager.spec.ts`

### Testing

```bash
# Run unit tests
npm test -- pull-request.manager.spec.ts

# Run integration tests
npm test -- --testPathPattern=integration

# Run all tests with coverage
npm test -- --coverage
```

### Version

**Current Version**: v1.0.4 Phase 4 (Partial)
**Completion**: 3/4 Issues (75%)
**Status**: Production Ready ✅
