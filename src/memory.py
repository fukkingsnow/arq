#!/usr/bin/env python3
"""
ARQ - AI Assistant with Memory & Context Management
Memory management system for storing and retrieving contextual information
"""

import logging
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
from enum import Enum
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from models import Memory, Session as SessionModel, User
from config import settings

logger = logging.getLogger(__name__)


class MemoryType(str, Enum):
    """Memory type classification"""
    SHORT_TERM = "short_term"
    LONG_TERM = "long_term"
    EPISODIC = "episodic"


class MemoryManager:
    """Manages contextual memory storage and retrieval"""

    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
        self.logger = logger

    async def store_memory(
        self,
        user_id: int,
        session_id: Optional[int],
        key: str,
        value: str,
        memory_type: MemoryType = MemoryType.SHORT_TERM,
        importance: float = 0.5,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Memory:
        """Store a memory entry"""
        try:
            # Calculate expiration based on memory type
            expires_at = self._calculate_expiration(memory_type)

            # Create memory record
            memory = Memory(
                user_id=user_id,
                session_id=session_id,
                memory_type=memory_type.value,
                key=key,
                value=value,
                importance=max(0.0, min(1.0, importance)),  # Clamp between 0-1
                expires_at=expires_at,
                metadata=metadata or {},
            )

            self.db_session.add(memory)
            await self.db_session.flush()
            self.logger.debug(f"Memory stored: {memory_type.value}:{key}")
            return memory

        except Exception as e:
            self.logger.error(f"Error storing memory: {str(e)}", exc_info=True)
            raise

    async def retrieve_memory(
        self,
        user_id: int,
        key: str,
        session_id: Optional[int] = None,
    ) -> Optional[Memory]:
        """Retrieve a specific memory entry"""
        try:
            query = select(Memory).where(
                and_(
                    Memory.user_id == user_id,
                    Memory.key == key,
                    or_(Memory.expires_at.is_(None), Memory.expires_at > datetime.utcnow()),
                )
            )

            if session_id:
                query = query.where(Memory.session_id == session_id)

            result = await self.db_session.execute(query)
            memory = result.scalars().first()

            if memory:
                # Update access metadata
                memory.access_count += 1
                memory.last_accessed = datetime.utcnow()
                await self.db_session.flush()
                self.logger.debug(f"Memory retrieved: {key}")

            return memory

        except Exception as e:
            self.logger.error(f"Error retrieving memory: {str(e)}", exc_info=True)
            raise

    async def retrieve_memories(
        self,
        user_id: int,
        memory_type: Optional[MemoryType] = None,
        session_id: Optional[int] = None,
        limit: int = 100,
    ) -> List[Memory]:
        """Retrieve multiple memory entries"""
        try:
            query = select(Memory).where(
                and_(
                    Memory.user_id == user_id,
                    or_(Memory.expires_at.is_(None), Memory.expires_at > datetime.utcnow()),
                )
            )

            if memory_type:
                query = query.where(Memory.memory_type == memory_type.value)

            if session_id:
                query = query.where(Memory.session_id == session_id)

            # Order by importance and recency
            query = query.order_by(desc(Memory.importance), desc(Memory.updated_at)).limit(limit)

            result = await self.db_session.execute(query)
            memories = result.scalars().all()

            self.logger.debug(f"Retrieved {len(memories)} memories for user {user_id}")
            return memories

        except Exception as e:
            self.logger.error(f"Error retrieving memories: {str(e)}", exc_info=True)
            raise

    async def search_memories(
        self,
        user_id: int,
        query_text: str,
        memory_type: Optional[MemoryType] = None,
        limit: int = 50,
    ) -> List[Memory]:
        """Search memories by text content"""
        try:
            # Full text search (basic implementation)
            search_pattern = f"%{query_text}%"

            query = select(Memory).where(
                and_(
                    Memory.user_id == user_id,
                    or_(
                        Memory.key.ilike(search_pattern),
                        Memory.value.ilike(search_pattern),
                    ),
                    or_(Memory.expires_at.is_(None), Memory.expires_at > datetime.utcnow()),
                )
            )

            if memory_type:
                query = query.where(Memory.memory_type == memory_type.value)

            query = query.order_by(desc(Memory.importance)).limit(limit)

            result = await self.db_session.execute(query)
            memories = result.scalars().all()

            self.logger.debug(f"Found {len(memories)} memories matching '{query_text}'")
            return memories

        except Exception as e:
            self.logger.error(f"Error searching memories: {str(e)}", exc_info=True)
            raise

    async def update_memory(
        self,
        memory_id: int,
        value: Optional[str] = None,
        importance: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[Memory]:
        """Update an existing memory entry"""
        try:
            query = select(Memory).where(Memory.id == memory_id)
            result = await self.db_session.execute(query)
            memory = result.scalars().first()

            if not memory:
                self.logger.warning(f"Memory {memory_id} not found for update")
                return None

            if value is not None:
                memory.value = value

            if importance is not None:
                memory.importance = max(0.0, min(1.0, importance))

            if metadata is not None:
                memory.metadata = {**memory.metadata, **metadata}

            memory.updated_at = datetime.utcnow()
            await self.db_session.flush()

            self.logger.debug(f"Memory {memory_id} updated")
            return memory

        except Exception as e:
            self.logger.error(f"Error updating memory: {str(e)}", exc_info=True)
            raise

    async def delete_memory(self, memory_id: int) -> bool:
        """Delete a memory entry"""
        try:
            query = select(Memory).where(Memory.id == memory_id)
            result = await self.db_session.execute(query)
            memory = result.scalars().first()

            if not memory:
                return False

            await self.db_session.delete(memory)
            await self.db_session.flush()

            self.logger.debug(f"Memory {memory_id} deleted")
            return True

        except Exception as e:
            self.logger.error(f"Error deleting memory: {str(e)}", exc_info=True)
            raise

    async def cleanup_expired_memories(self, user_id: Optional[int] = None) -> int:
        """Remove expired memory entries"""
        try:
            query = select(Memory).where(
                and_(
                    Memory.expires_at.isnot(None),
                    Memory.expires_at <= datetime.utcnow(),
                )
            )

            if user_id:
                query = query.where(Memory.user_id == user_id)

            result = await self.db_session.execute(query)
            expired_memories = result.scalars().all()

            for memory in expired_memories:
                await self.db_session.delete(memory)

            deleted_count = len(expired_memories)
            await self.db_session.flush()

            self.logger.info(f"Cleaned up {deleted_count} expired memories")
            return deleted_count

        except Exception as e:
            self.logger.error(f"Error cleaning up expired memories: {str(e)}", exc_info=True)
            raise

    async def get_memory_stats(self, user_id: int) -> Dict[str, Any]:
        """Get memory statistics for a user"""
        try:
            query = select(Memory).where(Memory.user_id == user_id)
            result = await self.db_session.execute(query)
            memories = result.scalars().all()

            stats = {
                "total_memories": len(memories),
                "by_type": {},
                "total_importance": 0.0,
                "avg_importance": 0.0,
                "most_accessed": None,
                "least_accessed": None,
            }

            if memories:
                for mem_type in MemoryType:
                    count = sum(1 for m in memories if m.memory_type == mem_type.value)
                    stats["by_type"][mem_type.value] = count

                stats["total_importance"] = sum(m.importance for m in memories)
                stats["avg_importance"] = stats["total_importance"] / len(memories)

                sorted_by_access = sorted(memories, key=lambda m: m.access_count)
                if sorted_by_access:
                    stats["most_accessed"] = {
                        "key": sorted_by_access[-1].key,
                        "count": sorted_by_access[-1].access_count,
                    }
                    stats["least_accessed"] = {
                        "key": sorted_by_access[0].key,
                        "count": sorted_by_access[0].access_count,
                    }

            self.logger.debug(f"Memory stats for user {user_id}: {stats}")
            return stats

        except Exception as e:
            self.logger.error(f"Error getting memory stats: {str(e)}", exc_info=True)
            raise

    def _calculate_expiration(self, memory_type: MemoryType) -> Optional[datetime]:
        """Calculate expiration time based on memory type"""
        now = datetime.utcnow()

        if memory_type == MemoryType.SHORT_TERM:
            ttl_seconds = settings.SHORT_TERM_MEMORY_TTL
            return now + timedelta(seconds=ttl_seconds)

        elif memory_type == MemoryType.LONG_TERM:
            ttl_seconds = settings.LONG_TERM_MEMORY_TTL
            return now + timedelta(seconds=ttl_seconds)

        elif memory_type == MemoryType.EPISODIC:
            # Episodic memories can expire but are typically longer
            ttl_seconds = settings.LONG_TERM_MEMORY_TTL
            return now + timedelta(seconds=ttl_seconds)

        return None
