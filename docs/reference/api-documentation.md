# ARQ Backend API Documentation

## Overview

This document provides comprehensive API documentation for the ARQ Backend REST API. The API is built with NestJS and follows RESTful principles with proper authentication, validation, and error handling.

**API Version**: 1.0.0  
**Base URL**: `http://localhost:3000/api`  
**Authentication**: JWT Bearer Token

## Table of Contents

- [Authentication API](#authentication-api)
- [Dialogue API](#dialogue-api)
- [User Profile API](#user-profile-api)
- [Common Responses](#common-responses)
- [Error Handling](#error-handling)

---

## Authentication API

### Register User

**Endpoint**: `POST /auth/register`  
**Authentication**: None

Registers a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "username": "username"
}
```

**Response (201 Created)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "username",
    "createdAt": "2025-12-08T15:00:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid email format or weak password
- `409 Conflict`: Email already registered

---

### Login User

**Endpoint**: `POST /auth/login`  
**Authentication**: None

Authenticates user and returns JWT tokens.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "username"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid credentials
- `404 Not Found`: User not found

---

### Refresh Token

**Endpoint**: `POST /auth/refresh`  
**Authentication**: None

Refreshes access token using valid refresh token.

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or expired refresh token

---

### Logout

**Endpoint**: `POST /auth/logout`  
**Authentication**: Required

Logs out user and invalidates tokens.

**Response (200 OK)**:
```json
{
  "message": "Successfully logged out"
}
```

---

## Dialogue API

### Create Dialogue

**Endpoint**: `POST /api/dialogues`  
**Authentication**: Required

Creates a new dialogue session.

**Request Body**:
```json
{
  "title": "My Dialogue",
  "description": "A dialogue about AI",
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 2048
}
```

**Response (201 Created)**:
```json
{
  "id": "dialogue-uuid",
  "userId": "user-uuid",
  "title": "My Dialogue",
  "description": "A dialogue about AI",
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 2048,
  "createdAt": "2025-12-08T15:00:00Z",
  "updatedAt": "2025-12-08T15:00:00Z"
}
```

---

### Get All Dialogues

**Endpoint**: `GET /api/dialogues`  
**Authentication**: Required

Retrieves all dialogues for the authenticated user.

**Query Parameters**:
- `search` (optional): Search by title
- `limit` (optional, default: 10): Number of results
- `offset` (optional, default: 0): Pagination offset

**Response (200 OK)**:
```json
[
  {
    "id": "dialogue-uuid",
    "title": "My Dialogue",
    "description": "A dialogue about AI",
    "model": "gpt-4",
    "createdAt": "2025-12-08T15:00:00Z"
  }
]
```

---

### Get Dialogue by ID

**Endpoint**: `GET /api/dialogues/:id`  
**Authentication**: Required

Retrieves a specific dialogue.

**Response (200 OK)**:
```json
{
  "id": "dialogue-uuid",
  "userId": "user-uuid",
  "title": "My Dialogue",
  "description": "A dialogue about AI",
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 2048,
  "createdAt": "2025-12-08T15:00:00Z",
  "updatedAt": "2025-12-08T15:00:00Z"
}
```

**Error Responses**:
- `404 Not Found`: Dialogue not found
- `403 Forbidden`: User does not have access

---

### Update Dialogue

**Endpoint**: `PATCH /api/dialogues/:id`  
**Authentication**: Required

Updates dialogue properties.

**Request Body**:
```json
{
  "title": "Updated Title",
  "temperature": 0.5
}
```

**Response (200 OK)**:
```json
{
  "id": "dialogue-uuid",
  "title": "Updated Title",
  "temperature": 0.5,
  "updatedAt": "2025-12-08T15:30:00Z"
}
```

---

### Delete Dialogue

**Endpoint**: `DELETE /api/dialogues/:id`  
**Authentication**: Required

Deletes a dialogue.

**Response (204 No Content)**

---

### Send Message

**Endpoint**: `POST /api/dialogues/:id/messages`  
**Authentication**: Required

Sends a message to a dialogue.

**Request Body**:
```json
{
  "content": "Hello, how are you?",
  "role": "user"
}
```

**Response (201 Created)**:
```json
{
  "id": "message-uuid",
  "dialogueId": "dialogue-uuid",
  "content": "Hello, how are you?",
  "role": "user",
  "timestamp": "2025-12-08T15:00:00Z"
}
```

---

### Get Messages

**Endpoint**: `GET /api/dialogues/:id/messages`  
**Authentication**: Required

Retrieves all messages for a dialogue.

**Query Parameters**:
- `limit` (optional, default: 50): Number of results
- `offset` (optional, default: 0): Pagination offset

**Response (200 OK)**:
```json
[
  {
    "id": "message-uuid",
    "dialogueId": "dialogue-uuid",
    "content": "Hello, how are you?",
    "role": "user",
    "timestamp": "2025-12-08T15:00:00Z"
  }
]
```

---

## User Profile API

### Get Profile

**Endpoint**: `GET /api/profile`  
**Authentication**: Required

Retrieves current user profile.

**Response (200 OK)**:
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "username": "username",
  "createdAt": "2025-12-08T15:00:00Z",
  "updatedAt": "2025-12-08T15:00:00Z"
}
```

---

### Update Profile

**Endpoint**: `PATCH /api/profile`  
**Authentication**: Required

Updates user profile.

**Request Body**:
```json
{
  "username": "new_username"
}
```

**Response (200 OK)**:
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "username": "new_username",
  "updatedAt": "2025-12-08T15:30:00Z"
}
```

---

## Common Responses

### Pagination

List endpoints support pagination:

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### Error Response

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Description of the error",
  "error": "BadRequest",
  "timestamp": "2025-12-08T15:00:00Z"
}
```

---

## Error Handling

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource successfully created
- `204 No Content`: Successful request with no content
- `400 Bad Request`: Invalid request format or validation error
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Authenticated but lacking permission
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `500 Internal Server Error`: Server error

### Authentication Errors

**Missing Token**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Invalid Token**:
```json
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "Unauthorized"
}
```

### Validation Errors

```json
{
  "statusCode": 400,
  "message": [
    "email must be a valid email",
    "password must be at least 8 characters"
  ],
  "error": "Bad Request"
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Requests per minute**: 60 (authenticated), 20 (unauthenticated)
- **Rate limit headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Timestamp when limit resets

---

## Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** - never expose in logs or URLs
3. **Refresh tokens** before expiration (typically 24 hours)
4. **Implement retry logic** for failed requests
5. **Use meaningful error messages** for user feedback
6. **Validate input** on the client side before sending

---

## Support

For API issues or questions:
- Check this documentation first
- Review error messages carefully
- Contact the development team for issues
