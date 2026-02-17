#!/usr/bin/env python3
"""
ARQ - AI Assistant with Memory & Context Management
Middleware for request/response logging and error handling
"""

import logging
import time
import uuid
from typing import Callable, Optional
from datetime import datetime

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware to add request ID to all requests"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Add request ID header and forward request"""
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        request.state.start_time = time.time()

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id

        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all requests and responses"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Log request and response details"""
        request_id = getattr(request.state, "request_id", "unknown")
        start_time = getattr(request.state, "start_time", time.time())

        # Log request
        logger.info(
            f"Request: {request.method} {request.url.path}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "client_ip": request.client.host if request.client else "unknown",
            },
        )

        # Process request
        response = await call_next(request)

        # Calculate response time
        response_time_ms = (time.time() - start_time) * 1000

        # Log response
        logger.info(
            f"Response: {response.status_code} ({response_time_ms:.2f}ms)",
            extra={
                "request_id": request_id,
                "status_code": response.status_code,
                "response_time_ms": response_time_ms,
            },
        )

        # Add timing header
        response.headers["X-Response-Time"] = str(response_time_ms)

        return response


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware to handle exceptions and provide standardized error responses"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Catch and handle exceptions"""
        request_id = getattr(request.state, "request_id", "unknown")

        try:
            response = await call_next(request)
            return response

        except ValueError as e:
            logger.warning(
                f"Validation error: {str(e)}",
                extra={"request_id": request_id, "error_type": "ValueError"},
            )
            return JSONResponse(
                status_code=400,
                content={
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": str(e),
                        "request_id": request_id,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                },
            )

        except KeyError as e:
            logger.warning(
                f"Missing parameter: {str(e)}",
                extra={"request_id": request_id, "error_type": "KeyError"},
            )
            return JSONResponse(
                status_code=400,
                content={
                    "error": {
                        "code": "MISSING_PARAMETER",
                        "message": f"Missing required parameter: {str(e)}",
                        "request_id": request_id,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                },
            )

        except Exception as e:
            logger.error(
                f"Internal server error: {str(e)}",
                exc_info=True,
                extra={"request_id": request_id, "error_type": type(e).__name__},
            )
            return JSONResponse(
                status_code=500,
                content={
                    "error": {
                        "code": "INTERNAL_SERVER_ERROR",
                        "message": "An internal error occurred",
                        "request_id": request_id,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                },
            )


class CORSMiddleware(BaseHTTPMiddleware):
    """Middleware to handle CORS headers"""

    def __init__(self, app, allowed_origins: list = None, allow_credentials: bool = True):
        super().__init__(app)
        self.allowed_origins = allowed_origins or ["*"]
        self.allow_credentials = allow_credentials

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Add CORS headers to response"""
        if request.method == "OPTIONS":
            return self._create_cors_response()

        response = await call_next(request)
        self._add_cors_headers(response, request)

        return response

    def _create_cors_response(self) -> Response:
        """Create OPTIONS response with CORS headers"""
        response = Response()
        self._add_cors_headers(response)
        return response

    def _add_cors_headers(self, response: Response, request: Request = None) -> None:
        """Add CORS headers to response"""
        origin = request.headers.get("origin") if request else "*"
        if "*" in self.allowed_origins or origin in self.allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin or "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        if self.allow_credentials:
            response.headers["Access-Control-Allow-Credentials"] = "true"


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware to monitor and warn about slow requests"""

    def __init__(self, app, slow_request_threshold_ms: float = 1000):
        super().__init__(app)
        self.slow_request_threshold_ms = slow_request_threshold_ms

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Monitor request performance"""
        request_id = getattr(request.state, "request_id", "unknown")
        start_time = time.time()

        response = await call_next(request)

        response_time_ms = (time.time() - start_time) * 1000

        if response_time_ms > self.slow_request_threshold_ms:
            logger.warning(
                f"Slow request detected: {request.method} {request.url.path} took {response_time_ms:.2f}ms",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "response_time_ms": response_time_ms,
                    "threshold_ms": self.slow_request_threshold_ms,
                },
            )

        return response
