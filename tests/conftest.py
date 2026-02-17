#!/usr/bin/env python3
"""Pytest configuration and fixtures for ARQ test suite.

This module provides shared test fixtures and configuration for all test modules,
including database fixtures, mock objects, and utility functions.
"""

import pytest
import asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import Mock, AsyncMock, patch
import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


# ==================== SESSION-SCOPED FIXTURES ====================

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ==================== FUNCTION-SCOPED FIXTURES ====================

@pytest.fixture
def mock_settings() -> Mock:
    """Mock settings configuration."""
    settings = Mock()
    settings.API_VERSION = "1.0.0"
    settings.DATABASE_URL = "postgresql+asyncpg://test:test@localhost/test_arq"
    settings.REDIS_URL = "redis://localhost:6379"
    settings.SECRET_KEY = "test-secret-key-12345"
    settings.DEBUG = True
    settings.LOG_LEVEL = "DEBUG"
    settings.SESSION_TIMEOUT_MINUTES = 30
    settings.MAX_MESSAGE_LENGTH = 5000
    return settings


@pytest.fixture
async def mock_database_manager() -> AsyncMock:
    """Mock database manager."""
    manager = AsyncMock()
    manager.connect = AsyncMock()
    manager.disconnect = AsyncMock()
    manager.health_check = AsyncMock(return_value=True)
    manager.get_session = AsyncMock()
    return manager


@pytest.fixture
async def mock_memory_manager() -> AsyncMock:
    """Mock memory manager."""
    manager = AsyncMock()
    manager.store = AsyncMock()
    manager.retrieve = AsyncMock(return_value=[])
    manager.search = AsyncMock(return_value=[])
    manager.delete = AsyncMock()
    manager.cleanup = AsyncMock()
    return manager


@pytest.fixture
async def mock_session_manager() -> AsyncMock:
    """Mock session manager."""
    manager = AsyncMock()
    manager.create_session = AsyncMock(return_value="session_123")
    manager.get_session = AsyncMock(return_value={"id": "session_123", "user_id": "user_1"})
    manager.validate_token = AsyncMock(return_value=True)
    manager.extend_session = AsyncMock()
    manager.close_session = AsyncMock()
    return manager


@pytest.fixture
def mock_pydantic_model() -> Mock:
    """Mock Pydantic model for testing."""
    model = Mock()
    model.dict = Mock(return_value={"id": "1", "name": "test"})
    model.json = Mock(return_value='{"id": "1", "name": "test"}')
    return model


# ==================== SAMPLE DATA FIXTURES ====================

@pytest.fixture
def sample_user_data() -> dict:
    """Sample user data for testing."""
    return {
        "id": "user_123",
        "username": "testuser",
        "email": "test@example.com",
        "full_name": "Test User",
        "created_at": "2025-11-22T00:00:00Z",
    }


@pytest.fixture
def sample_message_data() -> dict:
    """Sample message data for testing."""
    return {
        "id": "msg_456",
        "session_id": "session_789",
        "content": "This is a test message",
        "message_type": "user",
        "created_at": "2025-11-22T00:00:00Z",
    }


@pytest.fixture
def sample_memory_data() -> dict:
    """Sample memory data for testing."""
    return {
        "memory_id": "mem_101",
        "session_id": "session_789",
        "memory_type": "short_term",
        "content": {"key": "value", "context": "test context"},
        "created_at": "2025-11-22T00:00:00Z",
    }


@pytest.fixture
def sample_session_data() -> dict:
    """Sample session data for testing."""
    return {
        "id": "session_789",
        "user_id": "user_123",
        "session_name": "Test Session",
        "token": "token_abc123xyz",
        "status": "active",
        "created_at": "2025-11-22T00:00:00Z",
        "expires_at": "2025-11-23T00:00:00Z",
    }


# ==================== MARKERS ====================

def pytest_configure(config):
    """Configure custom markers."""
    config.addinivalue_line("markers", "unit: mark test as a unit test")
    config.addinivalue_line("markers", "integration: mark test as an integration test")
    config.addinivalue_line("markers", "async: mark test as async")
    config.addinivalue_line("markers", "slow: mark test as slow")
    config.addinivalue_line("markers", "db: mark test as requiring database")
    config.addinivalue_line("markers", "api: mark test as API endpoint test")


# ==================== HOOKS ====================

@pytest.fixture(autouse=True)
async def reset_mocks() -> None:
    """Reset all mocks before each test."""
    yield
    # Cleanup after test if needed


# ==================== UTILITY FUNCTIONS ====================

def get_test_fixture(name: str):
    """Get a test fixture by name.
    
    Args:
        name: Name of the fixture
        
    Returns:
        The requested fixture data
    """
    fixtures = {
        "user": sample_user_data,
        "message": sample_message_data,
        "memory": sample_memory_data,
        "session": sample_session_data,
    }
    return fixtures.get(name, {})
