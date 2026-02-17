#!/usr/bin/env python3
"""ARQ Package Initialization - Exports all core modules.

This package provides the core infrastructure for the ARQ AI Assistant system,
including database models, configuration management, memory systems, session handling,
and API utilities.

Modules:
    models: SQLAlchemy ORM database models
    database: Database connection and session management
    config: Configuration management using environment variables
    memory: Memory management system for different memory types
    sessions: Session management with secure token generation
    utils: API utilities and helper functions
    middleware: Middleware for logging, error handling, and monitoring
"""

from typing import Any

# Import all core modules
from .models import (
    User,
    Session,
    Message,
    MessageEmbedding,
    Memory,
    ContextSnapshot,
    APILog,
    Configuration,
    SystemEvent,
)
from .database import DatabaseConfig, DatabaseManager
from .config import Environment, Settings
from .memory import MemoryType, MemoryManager
from .sessions import SessionManager
from .utils import (
    ErrorResponse,
    SuccessResponse,
    PaginationHelper,
    CacheHelper,
    ValidationHelper,
    TokenHelper,
    PerformanceHelper,
    LoggingHelper,
)
from .middleware import (
    RequestIDMiddleware,
    LoggingMiddleware,
    ErrorHandlingMiddleware,
    CORSMiddleware,
    PerformanceMonitoringMiddleware,
)

__version__ = "1.0.0"
__author__ = "ARQ Development Team"
__license__ = "MIT"

# Public API exports
__all__ = [
    # Models
    "User",
    "Session",
    "Message",
    "MessageEmbedding",
    "Memory",
    "ContextSnapshot",
    "APILog",
    "Configuration",
    "SystemEvent",
    # Database
    "DatabaseConfig",
    "DatabaseManager",
    # Configuration
    "Environment",
    "Settings",
    # Memory Management
    "MemoryType",
    "MemoryManager",
    # Session Management
    "SessionManager",
    # Utilities
    "ErrorResponse",
    "SuccessResponse",
    "PaginationHelper",
    "CacheHelper",
    "ValidationHelper",
    "TokenHelper",
    "PerformanceHelper",
    "LoggingHelper",
    # Middleware
    "RequestIDMiddleware",
    "LoggingMiddleware",
    "ErrorHandlingMiddleware",
    "CORSMiddleware",
    "PerformanceMonitoringMiddleware",
]

# Lazy loading of heavy modules if needed
def get_database_manager(config: Settings) -> DatabaseManager:
    """Initialize database manager with configuration.
    
    Args:
        config: Settings instance with database configuration
        
    Returns:
        DatabaseManager instance
    """
    return DatabaseManager(config)


def get_memory_manager() -> MemoryManager:
    """Initialize memory manager.
    
    Returns:
        MemoryManager instance
    """
    return MemoryManager()


def get_session_manager(db_manager: DatabaseManager) -> SessionManager:
    """Initialize session manager with database manager.
    
    Args:
        db_manager: DatabaseManager instance
        
    Returns:
        SessionManager instance
    """
    return SessionManager(db_manager)
