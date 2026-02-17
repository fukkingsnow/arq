# Phase 22 Step 2: REST API Specification (350 lines)

## Overview
Comprehensive REST API specification defining all endpoints, request/response schemas, authentication, error handling, and versioning strategy. OpenAPI 3.0 compliant with complete endpoint documentation.

## 1. API Versioning & Base URL

### 1.1 Versioning Strategy
```
Base URL: https://api.arq.dev/api/v1
Header Versioning: X-API-Version: 2024-01
URL Path: /api/v1/ (major versions in path)

Endpoint Pattern: /api/{version}/{resource}/{id}/{action}
Example: /api/v1/workspaces/123/projects/456/tasks
```

## 2. Authentication Endpoints

### 2.1 POST /auth/register
```typescript
Request: {
  email: string; // RFC 5322
  password: string; // Min 12 chars, upper+lower+digit+special
  firstName: string;
  lastName: string;
}
Response (201): {
  userId: UUID;
  email: string;
  accessToken: JWT;
  refreshToken: JWT;
  expiresIn: 3600; // seconds
}
Errors: 400 (invalid), 409 (exists)
```

### 2.2 POST /auth/login
```
Request: { email, password }
Response: { accessToken, refreshToken, expiresIn }
Errors: 401 (unauthorized), 429 (rate limited)
```

### 2.3 POST /auth/refresh
```
Request: { refreshToken }
Response: { accessToken, expiresIn }
Errors: 401 (invalid token)
```

## 3. User Management Endpoints

### 3.1 GET /users/{userId}
```
Response (200): {
  userId: UUID;
  email: string;
  firstName: string;
  lastName: string;
  avatar: URL;
  createdAt: ISO8601;
  lastLogin: ISO8601;
}
Errors: 404 (not found), 403 (forbidden)
```

### 3.2 PUT /users/{userId}
```
Request: { firstName?, lastName?, avatar? }
Response: Updated user object
Errors: 400 (validation), 409 (conflict)
```

### 3.3 GET /users/{userId}/preferences
```
Response: {
  theme: 'light' | 'dark';
  language: string; // RFC 5646
  timezone: string; // IANA timezone
  emailNotifications: boolean;
  notifications: { email: boolean; push: boolean };
}
```

## 4. Workspace Endpoints

### 4.1 POST /workspaces
```
Request: {
  name: string; // 1-100 chars
  description?: string;
  icon?: string; // emoji
}
Response (201): {
  workspaceId: UUID;
  name: string;
  ownerId: UUID;
  createdAt: ISO8601;
  members: []
}
```

### 4.2 GET /workspaces
```
Query: {
  limit: number; // 1-100, default 20
  offset: number; // pagination
  sort: 'name' | '-createdAt';
}
Response (200): {
  data: Workspace[];
  pagination: { total, limit, offset, hasMore };
}
```

### 4.3 GET /workspaces/{workspaceId}
```
Response: {
  workspaceId: UUID;
  name: string;
  members: Member[];
  projects: Project[];
  createdAt: ISO8601;
}
```

### 4.4 PUT /workspaces/{workspaceId}
```
Request: { name?, description?, icon? }
Response: Updated workspace
Errors: 403 (not owner), 404
```

### 4.5 DELETE /workspaces/{workspaceId}
```
Response: 204 (no content)
Errors: 403 (not owner)
```

## 5. Project Endpoints

### 5.1 POST /workspaces/{workspaceId}/projects
```
Request: {
  name: string;
  description?: string;
  type: 'kanban' | 'scrum' | 'list';
}
Response (201): Project object
```

### 5.2 GET /workspaces/{workspaceId}/projects
```
Query: { limit, offset, sort, filter? }
Response: Paginated project list
```

### 5.3 GET /projects/{projectId}
```
Response: {
  projectId: UUID;
  workspaceId: UUID;
  name: string;
  type: string;
  settings: { archived: boolean };
  stats: { taskCount, completedCount };
}
```

## 6. Task Endpoints

### 6.1 POST /projects/{projectId}/tasks
```
Request: {
  title: string; // 1-200 chars
  description?: string;
  assignee?: UUID;
  dueDate?: ISO8601;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  labels?: UUID[];
}
Response (201): Task object
```

### 6.2 GET /projects/{projectId}/tasks
```
Query: {
  limit: number;
  status?: 'todo' | 'in_progress' | 'done';
  assignee?: UUID;
  priority?: string;
  search?: string; // full-text search
}
Response: Paginated task list
```

### 6.3 GET /tasks/{taskId}
```
Response: {
  taskId: UUID;
  projectId: UUID;
  title: string;
  status: string;
  assignee: User?;
  comments: Comment[];
  attachments: Attachment[];
  createdAt: ISO8601;
  updatedAt: ISO8601;
}
```

### 6.4 PATCH /tasks/{taskId}
```
Request: { title?, status?, assignee?, priority?, dueDate? }
Response: Updated task
Errors: 400 (invalid status), 409 (conflict)
```

### 6.5 DELETE /tasks/{taskId}
```
Response: 204
```

## 7. Comment Endpoints

### 7.1 POST /tasks/{taskId}/comments
```
Request: {
  content: string; // 1-5000 chars
  mentions?: UUID[]; // @mentions
}
Response (201): Comment object
```

### 7.2 GET /tasks/{taskId}/comments
```
Query: { limit, offset }
Response: Paginated comments
```

### 7.3 PATCH /comments/{commentId}
```
Request: { content }
Response: Updated comment
Errors: 403 (not author)
```

## 8. Notification Endpoints

### 8.1 GET /notifications
```
Query: { limit: 20, unread?: true }
Response: {
  data: Notification[];
  unreadCount: number;
}
```

### 8.2 PATCH /notifications/{notificationId}/read
```
Response: 200 (OK)
```

### 8.3 POST /webhooks
```
Request: {
  url: string; // HTTPS only
  events: ['task.created', 'task.updated'];
  active: boolean;
}
Response (201): Webhook object
```

## 9. Error Response Format

### 9.1 Error Schema
```typescript
interface ErrorResponse {
  error: {
    code: string; // e.g., "VALIDATION_ERROR"
    message: string; // Human-readable
    details?: Record<string, string>; // Field-level errors
    requestId: UUID; // For support tracking
    timestamp: ISO8601;
  };
}
```

### 9.2 HTTP Status Codes
- 200: OK
- 201: Created
- 204: No Content
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Unprocessable Entity
- 429: Rate Limited
- 500: Internal Server Error
- 502: Bad Gateway
- 503: Service Unavailable

## 10. Request/Response Format

### 10.1 HTTP Headers
```
Content-Type: application/json
Authorization: Bearer {accessToken}
X-API-Version: 2024-01
X-Tenant-ID: {tenantId} (for multi-tenancy)
X-Request-ID: {uuid} (for tracing)
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 599
X-RateLimit-Reset: 1234567890
```

### 10.2 Pagination
```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

## 11. Filtering & Sorting

### 11.1 Query Parameters
```
?filter[status]=done
?filter[assignee]=userId1,userId2
?sort=-createdAt,name
?search=keyword
```

## 12. Rate Limiting

### 12.1 Limits
- **Authenticated**: 600 requests/minute
- **Unauthenticated**: 60 requests/minute
- **Burst**: 100 requests (sliding window)

## 13. OpenAPI Specification

### 13.1 Location
```
GET /api/v1/openapi.json
GET /docs (Swagger UI)
GET /redoc (ReDoc)
```

## Integration with Phase 22.1
- All endpoints secured via JWT authentication (Phase 22.1)
- Database schema supports all entities (Phase 22.3)
- Service layer implements business logic (Phase 22.4)

## Next: Phase 22.3-4
- Database schema implementation
- Service layer patterns
