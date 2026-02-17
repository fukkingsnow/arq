#!/usr/bin/env python3
"""
ARQ - AI Assistant with Memory & Context Management
Database models for SQLAlchemy ORM
"""

from datetime import datetime
from typing import Optional, Dict, List

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Float, Boolean,
    ForeignKey, Table, Index, JSON, LargeBinary, UniqueConstraint
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

# SQLAlchemy base class
Base = declarative_base()


class User(Base):
    """User model for storing user information and sessions"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, index=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="user", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")
    api_logs = relationship("APILog", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_user_email", "email"),
        Index("idx_user_created_at", "created_at"),
    )


class Session(Base):
    """Session model for tracking user interaction sessions"""
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    session_token = Column(String(255), unique=True, index=True, nullable=False)
    context_window_size = Column(Integer, default=4096)
    context_id = Column(String(255), unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True, index=True)

    # Relationships
    user = relationship("User", back_populates="sessions")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
    memory_contexts = relationship("Memory", back_populates="session", cascade="all, delete-orphan")
    context_snapshots = relationship("ContextSnapshot", back_populates="session", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_session_user_active", "user_id", "is_active"),
        Index("idx_session_expires", "expires_at"),
    )


class Message(Base):
    """Message model for storing dialogue messages"""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # 'user', 'assistant', 'system'
    content = Column(Text, nullable=False)
    tokens_used = Column(Integer, nullable=True)
    processing_time = Column(Float, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    session = relationship("Session", back_populates="messages")
    user = relationship("User", back_populates="messages")
    embeddings = relationship("MessageEmbedding", back_populates="message", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_message_session_role", "session_id", "role"),
        Index("idx_message_created", "created_at"),
    )


class MessageEmbedding(Base):
    """Message embedding model for semantic search"""
    __tablename__ = "message_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=False, index=True)
    embedding = Column(LargeBinary, nullable=False)
    embedding_model = Column(String(255), default="text-embedding-3-small")
    embedding_dimension = Column(Integer, default=1536)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    message = relationship("Message", back_populates="embeddings")

    __table_args__ = (
        Index("idx_embedding_message", "message_id"),
    )


class Memory(Base):
    """Memory model for storing contextual memory and facts"""
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True, index=True)
    memory_type = Column(String(50), nullable=False)  # 'short_term', 'long_term', 'episodic'
    key = Column(String(255), nullable=False)
    value = Column(Text, nullable=False)
    importance = Column(Float, default=0.5)  # 0.0 to 1.0
    access_count = Column(Integer, default=0)
    last_accessed = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="memories")
    session = relationship("Session", back_populates="memory_contexts")

    __table_args__ = (
        UniqueConstraint("user_id", "session_id", "key", name="uq_memory_user_session_key"),
        Index("idx_memory_user_type", "user_id", "memory_type"),
        Index("idx_memory_importance", "importance"),
        Index("idx_memory_expires", "expires_at"),
    )


class ContextSnapshot(Base):
    """Context snapshot model for storing historical context states"""
    __tablename__ = "context_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False, index=True)
    snapshot_data = Column(JSON, nullable=False)
    context_hash = Column(String(255), nullable=False, index=True)
    token_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    session = relationship("Session", back_populates="context_snapshots")

    __table_args__ = (
        Index("idx_snapshot_session_created", "session_id", "created_at"),
    )


class APILog(Base):
    """API log model for tracking API requests and responses"""
    __tablename__ = "api_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    endpoint = Column(String(255), nullable=False, index=True)
    method = Column(String(10), nullable=False)  # GET, POST, PUT, DELETE, etc.
    status_code = Column(Integer, nullable=False, index=True)
    request_size = Column(Integer, nullable=True)
    response_size = Column(Integer, nullable=True)
    processing_time = Column(Float, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="api_logs")

    __table_args__ = (
        Index("idx_apilog_endpoint_created", "endpoint", "created_at"),
        Index("idx_apilog_status", "status_code"),
    )


class Configuration(Base):
    """Configuration model for storing application settings"""
    __tablename__ = "configurations"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    data_type = Column(String(50), default="string")  # string, integer, float, boolean, json
    description = Column(Text, nullable=True)
    is_mutable = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_config_key", "key"),
    )


class SystemEvent(Base):
    """System event model for tracking system-level events"""
    __tablename__ = "system_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    severity = Column(String(20), default="info")  # debug, info, warning, error, critical
    message = Column(Text, nullable=False)
    source = Column(String(255), nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index("idx_sysevent_type_severity", "event_type", "severity"),
        Index("idx_sysevent_created", "created_at"),
    )
