#!/usr/bin/env python3
"""
ARQ - AI Assistant with Memory & Context Management
Utility functions and helpers for API operations
"""

import logging
import json
import time
from typing import Any, Dict, Optional, List
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class ErrorResponse:
    """Standard error response object"""
    def __init__(self, code: str, message: str, details: Optional[Dict[str, Any]] = None):
        self.code = code
        self.message = message
        self.details = details or {}
        self.timestamp = datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error": {
                "code": self.code,
                "message": self.message,
                "timestamp": self.timestamp,
                "details": self.details,
            }
        }


class SuccessResponse:
    """Standard success response object"""
    def __init__(self, data: Any, message: str = "Success", metadata: Optional[Dict[str, Any]] = None):
        self.data = data
        self.message = message
        self.metadata = metadata or {}
        self.timestamp = datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": True,
            "message": self.message,
            "data": self.data,
            "timestamp": self.timestamp,
            "metadata": self.metadata,
        }


class PaginationHelper:
    """Helper for pagination operations"""
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100

    @staticmethod
    def validate_pagination(page: int = 1, page_size: int = 20) -> tuple:
        """Validate and normalize pagination parameters"""
        page = max(1, page)
        page_size = max(1, min(page_size, PaginationHelper.MAX_PAGE_SIZE))
        return page, page_size

    @staticmethod
    def calculate_offset(page: int, page_size: int) -> int:
        """Calculate database offset from page and page_size"""
        return (page - 1) * page_size

    @staticmethod
    def create_pagination_metadata(
        page: int, page_size: int, total_count: int
    ) -> Dict[str, Any]:
        """Create pagination metadata for response"""
        total_pages = (total_count + page_size - 1) // page_size
        return {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1,
        }


class CacheHelper:
    """Helper for cache operations"""

    @staticmethod
    def generate_cache_key(*parts: str) -> str:
        """Generate cache key from parts"""
        return ":".join(str(p) for p in parts)

    @staticmethod
    def calculate_cache_ttl(memory_type: str, default_ttl: int = 3600) -> int:
        """Calculate cache TTL based on memory type"""
        ttl_map = {
            "short_term": 3600,  # 1 hour
            "long_term": 86400,  # 1 day
            "ephemeral": 300,    # 5 minutes
        }
        return ttl_map.get(memory_type, default_ttl)


class ValidationHelper:
    """Helper for request validation"""

    @staticmethod
    def validate_email(email: str) -> bool:
        """Simple email validation"""
        return "@" in email and "." in email.split("@")[1]

    @staticmethod
    def validate_length(
        value: str, min_length: int = 0, max_length: int = None
    ) -> bool:
        """Validate string length"""
        if len(value) < min_length:
            return False
        if max_length and len(value) > max_length:
            return False
        return True

    @staticmethod
    def sanitize_string(value: str, max_length: int = 1000) -> str:
        """Sanitize string input"""
        return value.strip()[:max_length]


class TokenHelper:
    """Helper for token operations"""

    @staticmethod
    def is_token_expired(expiration_time: datetime) -> bool:
        """Check if token is expired"""
        return datetime.utcnow() >= expiration_time

    @staticmethod
    def get_token_remaining_ttl(expiration_time: datetime) -> int:
        """Get remaining TTL in seconds"""
        remaining = expiration_time - datetime.utcnow()
        return max(0, int(remaining.total_seconds()))

    @staticmethod
    def should_refresh_token(expiration_time: datetime, refresh_threshold: float = 0.2) -> bool:
        """Check if token should be refreshed based on threshold"""
        remaining_ttl = TokenHelper.get_token_remaining_ttl(expiration_time)
        original_ttl = int((expiration_time - datetime.utcnow()).total_seconds() / (1 - refresh_threshold))
        threshold_seconds = original_ttl * refresh_threshold
        return remaining_ttl <= threshold_seconds


class PerformanceHelper:
    """Helper for performance monitoring"""

    @staticmethod
    def measure_execution_time(func_name: str, start_time: float, threshold_ms: float = 100) -> Dict[str, Any]:
        """Measure and log function execution time"""
        elapsed_ms = (time.time() - start_time) * 1000
        is_slow = elapsed_ms > threshold_ms

        metric = {
            "function": func_name,
            "elapsed_ms": round(elapsed_ms, 2),
            "is_slow": is_slow,
        }

        if is_slow:
            logger.warning(f"Slow operation detected: {func_name} took {elapsed_ms:.2f}ms")

        return metric


class LoggingHelper:
    """Helper for structured logging"""

    @staticmethod
    def log_request(
        method: str, path: str, user_id: Optional[int] = None, request_id: Optional[str] = None
    ):
        """Log incoming request"""
        logger.info(
            f"Request: {method} {path}",
            extra={
                "user_id": user_id,
                "request_id": request_id,
                "method": method,
                "path": path,
            },
        )

    @staticmethod
    def log_response(
        status_code: int, response_time_ms: float, request_id: Optional[str] = None
    ):
        """Log outgoing response"""
        logger.info(
            f"Response: {status_code} ({response_time_ms:.2f}ms)",
            extra={
                "status_code": status_code,
                "response_time_ms": response_time_ms,
                "request_id": request_id,
            },
        )

    @staticmethod
    def log_error(
        error_message: str, error_code: str, exception: Optional[Exception] = None, request_id: Optional[str] = None
    ):
        """Log error with context"""
        logger.error(
            error_message,
            exc_info=exception,
            extra={
                "error_code": error_code,
                "request_id": request_id,
            },
        )
