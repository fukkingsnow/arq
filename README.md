# ARQ - AI Assistant Backend

An intelligent AI assistant with advanced memory, context management, and real-time dialogue processing capabilities. Built with FastAPI, supporting multiple deployment platforms (local, Docker, Beget hosting).

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

- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 14+ (or use Docker)
- Redis 7+ (or use Docker)
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/fukkingsnow/arq.git
   cd arq
   ```

2. **Create environment configuration**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/arq_db
   
   # Redis
   REDIS_URL=redis://localhost:6379/0
   
   # API Configuration
   API_HOST=0.0.0.0
   API_PORT=8000
   DEBUG=False
   
   # AI/ML (Optional)
   OPENAI_API_KEY=your_key_here
   ```

3. **Using Docker Compose (Recommended)**
   ```bash
   docker-compose up -d
   ```
   This starts:
   - PostgreSQL database
   - Redis cache
   - ARQ FastAPI server (accessible at http://localhost:8000)

4. **Using Virtual Environment (Development)**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python -m uvicorn src.main:app --reload
   ```

## Project Structure

```
arq/
├── .github/
│   └── workflows/
│       └── deploy.yml           # CI/CD pipeline configuration
├── src/
│   ├── main.py                  # FastAPI application entry point
│   └── config.py                # Environment configuration management
├── .env.example                 # Configuration template
├── Dockerfile                   # Production container image
├── docker-compose.yml           # Local development environment
├── requirements.txt             # Python dependencies
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

## API Documentation

### Available Endpoints

#### Health Checks
- `GET /health` - Service health status
- `GET /ready` - Readiness probe for Kubernetes/orchestrators

#### API Root
- `GET /` - API information and version

Full API documentation with Swagger UI:
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Example Usage

```bash
# Health check
curl http://localhost:8000/health

# API info
curl http://localhost:8000/
```

## Configuration

All configuration is managed through environment variables. See `.env.example` for all available options.

### Key Configuration Sections

**Database Configuration**
- `DATABASE_URL`: PostgreSQL connection string
- `DB_POOL_SIZE`: Connection pool size (default: 20)
- `DB_POOL_RECYCLE`: Connection recycle time in seconds

**Redis Configuration**
- `REDIS_URL`: Redis connection string
- `REDIS_DB`: Redis database number
- `CACHE_TTL`: Cache expiration time (seconds)

**FastAPI Configuration**
- `API_HOST`: Bind host (default: 0.0.0.0)
- `API_PORT`: Bind port (default: 8000)
- `DEBUG`: Debug mode (default: False)
- `WORKERS`: Number of worker processes

**Memory Management**
- `MEMORY_MAX_SIZE`: Maximum memory items
- `MEMORY_RETENTION_DAYS`: How long to keep memory
- `CONTEXT_WINDOW_SIZE`: Active context size

**AI/ML Integrations (Optional)**
- `OPENAI_API_KEY`: OpenAI API key
- `OPENAI_MODEL`: Model selection

**Beget Hosting (Optional)**
- `BEGET_API_KEY`: Beget API credentials
- `BEGET_DOMAIN`: Hosted domain name

**Telegram Bot (Optional)**
- `TELEGRAM_TOKEN`: Bot API token
- `TELEGRAM_WEBHOOK_URL`: Webhook endpoint

## Deployment

### Docker Deployment

```bash
# Build production image
docker build -t arq:latest .

# Run container
docker run -d \
  -e DATABASE_URL=postgresql://user:pass@db:5432/arq \
  -e REDIS_URL=redis://redis:6379/0 \
  -p 8000:8000 \
  --name arq-api \
  arq:latest
```

### Beget Hosting Deployment

The repository includes GitHub Actions CI/CD pipeline that automatically:
1. Runs tests and linting
2. Builds Docker image
3. Deploys to Beget hosting via FTP

**Setup Instructions**:

1. Add GitHub Secrets to your repository:
   - `BEGET_FTP_SERVER`: Your Beget FTP server
   - `BEGET_FTP_USER`: FTP username
   - `BEGET_FTP_PASSWORD`: FTP password

2. Configure `.env` on your Beget hosting with required variables

3. Push to main branch to trigger automatic deployment

## Testing

```bash
# Run tests
pytest src/ -v

# Run with coverage
pytest src/ --cov=src --cov-report=html

# Lint check
flake8 src/ --max-line-length=100
```

## Health Checks

The service includes comprehensive health checks:

```bash
# Application health
curl http://localhost:8000/health

# Response format
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "uptime": 3600
}
```

## Performance Tuning

### Production Optimization

1. **Database Connection Pool**
   - Adjust `DB_POOL_SIZE` based on expected concurrent connections
   - Typical: 5-20 for small deployments, 20-100 for large scale

2. **Worker Processes**
   - Use `WORKERS=4` (or CPU cores) for production
   - Adjust based on CPU utilization

3. **Memory Management**
   - Configure `MEMORY_MAX_SIZE` based on available RAM
   - Set appropriate `MEMORY_RETENTION_DAYS`

4. **Caching**
   - Use Redis for frequently accessed data
   - Adjust `CACHE_TTL` based on data freshness requirements

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL connection
psql postgresql://user:password@localhost:5432/arq_db -c "SELECT 1;"

# Check from container
docker-compose exec arq-api python -c "from src.config import settings; print(settings.database_url)"
```

### Redis Connection Issues

```bash
# Check Redis connection
redis-cli ping

# Check from container
docker-compose exec arq-api redis-cli -u redis://redis:6379/0 ping
```

### API Not Starting

Check logs:
```bash
# Docker Compose logs
docker-compose logs arq-api

# Check environment variables
docker-compose exec arq-api env | grep DATABASE
```

## Monitoring

### Logging

Logs are output to stdout and can be collected by container orchestration systems.

### Metrics

Enable metrics collection by setting:
```env
ENABLE_METRICS=True
METRICS_PORT=9090
```

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
- Check existing documentation in SETUP.md
- Review configuration examples in .env.example

## Changelog

### Version 0.1.0 (Initial Release)
- FastAPI application foundation
- PostgreSQL database integration
- Redis caching support
- Docker containerization
- CI/CD pipeline with GitHub Actions
- Environment-based configuration
