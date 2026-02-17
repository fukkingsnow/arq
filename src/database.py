#!/usr/bin/env python3
"""
ARQ - AI Assistant with Memory & Context Management
Database connection and session management module
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker
)
from sqlalchemy.pool import NullPool, QueuePool
from sqlalchemy.exc import SQLAlchemyError

from models import Base

logger = logging.getLogger(__name__)


class DatabaseConfig:
    """Database configuration holder"""
    def __init__(
        self,
        url: str,
        echo: bool = False,
        pool_size: int = 20,
        max_overflow: int = 0,
        pool_timeout: int = 30,
        pool_recycle: int = 3600,
        connect_args: Optional[dict] = None
    ):
        self.url = url
        self.echo = echo
        self.pool_size = pool_size
        self.max_overflow = max_overflow
        self.pool_timeout = pool_timeout
        self.pool_recycle = pool_recycle
        self.connect_args = connect_args or {}


class DatabaseManager:
    """Database connection manager with connection pooling and lifecycle management"""

    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.engine = None
        self.session_factory = None

    async def initialize(self) -> None:
        """Initialize database engine and connection pool"""
        try:
            logger.info(f"Initializing database connection pool to {self.config.url}")

            # Determine pool class based on configuration
            pool_class = QueuePool if self.config.pool_size > 0 else NullPool

            # Create async engine
            self.engine = create_async_engine(
                self.config.url,
                echo=self.config.echo,
                pool_class=pool_class,
                pool_size=self.config.pool_size,
                max_overflow=self.config.max_overflow,
                pool_timeout=self.config.pool_timeout,
                pool_recycle=self.config.pool_recycle,
                connect_args=self.config.connect_args,
                pool_pre_ping=True,  # Verify connections before use
            )

            # Create session factory
            self.session_factory = async_sessionmaker(
                self.engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autoflush=False,
                autocommit=False
            )

            logger.info("Database engine initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize database: {str(e)}", exc_info=True)
            raise

    async def create_tables(self) -> None:
        """Create all tables from SQLAlchemy models"""
        try:
            logger.info("Creating database tables...")
            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created successfully")
        except SQLAlchemyError as e:
            logger.error(f"Error creating database tables: {str(e)}", exc_info=True)
            raise

    async def drop_tables(self) -> None:
        """Drop all tables (for testing/cleanup purposes)"""
        try:
            logger.warning("Dropping all database tables...")
            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.drop_all)
            logger.info("Database tables dropped successfully")
        except SQLAlchemyError as e:
            logger.error(f"Error dropping database tables: {str(e)}", exc_info=True)
            raise

    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get database session with proper error handling and cleanup"""
        if not self.session_factory:
            raise RuntimeError("Database not initialized. Call initialize() first.")

        async with self.session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception as e:
                await session.rollback()
                logger.error(f"Database session error: {str(e)}", exc_info=True)
                raise
            finally:
                await session.close()

    @asynccontextmanager
    async def transaction(self):
        """Context manager for database transactions"""
        async with self.session_factory() as session:
            async with session.begin():
                try:
                    yield session
                except Exception:
                    await session.rollback()
                    logger.error("Transaction rolled back", exc_info=True)
                    raise

    async def health_check(self) -> bool:
        """Check database connection health"""
        try:
            async with self.session_factory() as session:
                await session.execute("SELECT 1")
                logger.debug("Database health check passed")
                return True
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return False

    async def close(self) -> None:
        """Close database engine and cleanup resources"""
        if self.engine:
            try:
                logger.info("Closing database connections...")
                await self.engine.dispose()
                logger.info("Database engine closed successfully")
            except Exception as e:
                logger.error(f"Error closing database engine: {str(e)}", exc_info=True)


# Global database manager instance
_db_manager: Optional[DatabaseManager] = None


async def get_db_manager() -> DatabaseManager:
    """Get global database manager instance"""
    global _db_manager
    if not _db_manager:
        raise RuntimeError("Database manager not initialized")
    return _db_manager


async def init_db(config: DatabaseConfig) -> DatabaseManager:
    """Initialize global database manager"""
    global _db_manager
    _db_manager = DatabaseManager(config)
    await _db_manager.initialize()
    await _db_manager.create_tables()
    return _db_manager


async def shutdown_db() -> None:
    """Shutdown global database manager"""
    global _db_manager
    if _db_manager:
        await _db_manager.close()
        _db_manager = None
