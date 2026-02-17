#!/usr/bin/env python3
"""Unit tests package for ARQ backend modules.

Contains comprehensive unit tests for:
- Database models (ORM)
- Database connection and session management
- Configuration management
- Memory management system
- Session lifecycle management
- Utility helpers
- Middleware components
- API routes and endpoints

Test Structure:
- test_models.py: SQLAlchemy ORM model tests
- test_database.py: Database connection and async session tests
- test_config.py: Configuration management tests
- test_memory.py: Memory management system tests
- test_sessions.py: Session lifecycle and security tests
- test_utils.py: Utility helper function tests
- test_middleware.py: Middleware component tests
- test_routes.py: API endpoint tests

Test Coverage: 80%+ target across all modules
Test Execution: pytest tests/unit/ -v --cov=src --cov-report=html
"""
