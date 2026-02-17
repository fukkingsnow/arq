#!/usr/bin/env python3
"""
ARQ - AI Assistant with Memory & Context Management
Session management module for handling user sessions and context
"""

import logging
import secrets
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from models import Session as SessionModel, User
from config import settings

logger = logging.getLogger(__name__)


class SessionManager:
    """Manages user sessions and context windows"""

    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
        self.logger = logger

    async def create_session(
        self,
        user_id: int,
        context_window_size: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> SessionModel:
        """Create a new user session"""
        try:
            session_token = secrets.token_urlsafe(32)
            context_id = secrets.token_urlsafe(16)

            expires_at = datetime.utcnow() + timedelta(
                minutes=settings.SESSION_TIMEOUT_MINUTES
            )

            session = SessionModel(
                user_id=user_id,
                session_token=session_token,
                context_window_size=context_window_size or settings.CONTEXT_WINDOW_SIZE,
                context_id=context_id,
                is_active=True,
                expires_at=expires_at,
            )

            self.db_session.add(session)
            await self.db_session.flush()

            self.logger.info(f"Session created for user {user_id}")
            return session

        except Exception as e:
            self.logger.error(f"Error creating session: {str(e)}", exc_info=True)
            raise

    async def get_session(
        self, session_token: str
    ) -> Optional[SessionModel]:
        """Retrieve a session by token"""
        try:
            query = select(SessionModel).where(
                and_(
                    SessionModel.session_token == session_token,
                    SessionModel.is_active == True,
                    or_(SessionModel.expires_at.is_(None), SessionModel.expires_at > datetime.utcnow()),
                )
            )

            result = await self.db_session.execute(query)
            session = result.scalars().first()

            if session:
                session.last_activity = datetime.utcnow()
                await self.db_session.flush()
                self.logger.debug(f"Session retrieved: {session_token}")

            return session

        except Exception as e:
            self.logger.error(f"Error retrieving session: {str(e)}", exc_info=True)
            raise

    async def get_user_sessions(
        self, user_id: int, active_only: bool = True
    ) -> List[SessionModel]:
        """Get all sessions for a user"""
        try:
            query = select(SessionModel).where(
                SessionModel.user_id == user_id
            )

            if active_only:
                query = query.where(
                    and_(
                        SessionModel.is_active == True,
                        or_(SessionModel.expires_at.is_(None), SessionModel.expires_at > datetime.utcnow()),
                    )
                )

            query = query.order_by(desc(SessionModel.created_at))

            result = await self.db_session.execute(query)
            sessions = result.scalars().all()

            self.logger.debug(f"Retrieved {len(sessions)} sessions for user {user_id}")
            return sessions

        except Exception as e:
            self.logger.error(f"Error retrieving user sessions: {str(e)}", exc_info=True)
            raise

    async def update_session_activity(
        self, session_id: int
    ) -> Optional[SessionModel]:
        """Update session last activity timestamp"""
        try:
            query = select(SessionModel).where(SessionModel.id == session_id)
            result = await self.db_session.execute(query)
            session = result.scalars().first()

            if not session:
                return None

            session.last_activity = datetime.utcnow()
            await self.db_session.flush()

            self.logger.debug(f"Session {session_id} activity updated")
            return session

        except Exception as e:
            self.logger.error(f"Error updating session activity: {str(e)}", exc_info=True)
            raise

    async def extend_session(
        self, session_id: int, minutes: int = None
    ) -> Optional[SessionModel]:
        """Extend session expiration time"""
        try:
            query = select(SessionModel).where(SessionModel.id == session_id)
            result = await self.db_session.execute(query)
            session = result.scalars().first()

            if not session:
                return None

            extend_minutes = minutes or settings.SESSION_TIMEOUT_MINUTES
            new_expiration = datetime.utcnow() + timedelta(minutes=extend_minutes)
            session.expires_at = new_expiration
            await self.db_session.flush()

            self.logger.info(f"Session {session_id} extended until {new_expiration}")
            return session

        except Exception as e:
            self.logger.error(f"Error extending session: {str(e)}", exc_info=True)
            raise

    async def end_session(
        self, session_id: int, reason: Optional[str] = None
    ) -> bool:
        """Terminate a session"""
        try:
            query = select(SessionModel).where(SessionModel.id == session_id)
            result = await self.db_session.execute(query)
            session = result.scalars().first()

            if not session:
                return False

            session.is_active = False
            await self.db_session.flush()

            self.logger.info(f"Session {session_id} ended. Reason: {reason or 'user_logout'}")
            return True

        except Exception as e:
            self.logger.error(f"Error ending session: {str(e)}", exc_info=True)
            raise

    async def cleanup_expired_sessions(self) -> int:
        """Remove expired sessions"""
        try:
            query = select(SessionModel).where(
                and_(
                    SessionModel.expires_at.isnot(None),
                    SessionModel.expires_at <= datetime.utcnow(),
                )
            )

            result = await self.db_session.execute(query)
            expired_sessions = result.scalars().all()

            for session in expired_sessions:
                await self.db_session.delete(session)

            deleted_count = len(expired_sessions)
            await self.db_session.flush()

            self.logger.info(f"Cleaned up {deleted_count} expired sessions")
            return deleted_count

        except Exception as e:
            self.logger.error(f"Error cleaning up expired sessions: {str(e)}", exc_info=True)
            raise

    async def get_session_stats(self, user_id: int) -> Dict[str, Any]:
        """Get session statistics for a user"""
        try:
            query = select(SessionModel).where(SessionModel.user_id == user_id)
            result = await self.db_session.execute(query)
            all_sessions = result.scalars().all()

            active_sessions = [
                s for s in all_sessions
                if s.is_active and (s.expires_at is None or s.expires_at > datetime.utcnow())
            ]

            stats = {
                "total_sessions": len(all_sessions),
                "active_sessions": len(active_sessions),
                "inactive_sessions": len(all_sessions) - len(active_sessions),
                "oldest_session": min((s.created_at for s in all_sessions), default=None),
                "newest_session": max((s.created_at for s in all_sessions), default=None),
                "avg_context_window": (
                    sum(s.context_window_size for s in all_sessions) // len(all_sessions)
                    if all_sessions else 0
                ),
            }

            self.logger.debug(f"Session stats for user {user_id}: {stats}")
            return stats

        except Exception as e:
            self.logger.error(f"Error getting session stats: {str(e)}", exc_info=True)
            raise


from sqlalchemy import or_  # Add missing import
