# API_CONTRACTS_SPECIFICATION: ARQIUM Backend API Design

## Unified API Standards

### Global Standards
- **Base URL**: `/api/v1` (versioned for backward compatibility)
- **Format**: JSON (application/json)
- **Authentication**: Bearer tokens (JWT) + API keys
- **Rate Limiting**: 1000 req/min per user, 10000 req/min per API key
- **Timeout**: 30 seconds global timeout

### Response Format
```json
{
  "status": "success|error|partial",
  "code": 200,
  "data": {},
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-12-06T20:00:00Z",
    "request_id": "uuid",
    "trace_id": "for distributed tracing"
  }
}
```

## Core API Endpoints

### Authentication Service
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - Logout
- `POST /auth/validate` - Token validation

### User Management
- `GET /users/profile` - Get current user
- `PUT /users/profile` - Update profile
- `GET /users/{id}` - Get user by ID
- `DELETE /users/{id}` - Delete user (admin only)

### Context Management
- `POST /contexts` - Create context
- `GET /contexts` - List contexts (paginated)
- `GET /contexts/{id}` - Get context
- `PUT /contexts/{id}` - Update context
- `DELETE /contexts/{id}` - Delete context
- `POST /contexts/{id}/sync` - Sync context state

### Memory Management
- `POST /memory/store` - Store memory item
- `GET /memory/search` - Search memory (semantic + keyword)
- `GET /memory/recent` - Get recent memories
- `DELETE /memory/{id}` - Delete memory
- `POST /memory/clear` - Clear old memories

### Session Management
- `POST /sessions` - Create session
- `GET /sessions` - List sessions
- `GET /sessions/{id}` - Get session
- `POST /sessions/{id}/resume` - Resume session
- `POST /sessions/{id}/checkpoint` - Create checkpoint

### Plugin System
- `GET /plugins` - List available plugins
- `POST /plugins/install` - Install plugin
- `DELETE /plugins/{id}` - Uninstall plugin
- `POST /plugins/{id}/enable` - Enable plugin
- `POST /plugins/{id}/config` - Update plugin config

### Analytics & Telemetry
- `POST /analytics/event` - Track event
- `GET /analytics/dashboard` - Get analytics
- `GET /analytics/usage` - Get usage stats

## Error Codes

| Code | HTTP | Meaning |
|------|------|----------|
| AUTH_FAILED | 401 | Authentication failed |
| FORBIDDEN | 403 | Access denied |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal error |
| SERVICE_UNAVAILABLE | 503 | Service down |

## WebSocket Endpoints

### Real-time Sync
- `wss://api.arqium.io/ws/sync/{session_id}` - Real-time context sync
  - Event: `context_updated`
  - Event: `memory_added`
  - Event: `plugin_event`
  - Event: `error`

## GraphQL Schema (Optional Alt)

Support for GraphQL clients via `/graphql` endpoint for complex queries:
- Query: `user`, `contexts`, `memory`, `sessions`
- Mutation: `updateContext`, `storeMemory`, `createSession`
- Subscription: `onContextUpdate`, `onMemoryAdded`

## API Client Libraries

- **Python**: `arqium-python` (PyPI)
- **JavaScript**: `arqium-js` (npm)
- **Go**: `arqium-go` (GitHub)

## Changelog

**v1.0.0** - Initial API release
- Core endpoints for auth, users, contexts, memory, sessions, plugins
- JWT authentication
- Rate limiting
- Error standardization
