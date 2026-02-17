"""Connection recovery and restart management module for ARQ agent.

Handles:
- Detection of connection loss
- Graceful shutdown before disconnect
- Exponential backoff retry logic
- Session state persistence
- Memory and context restoration on reconnect
- Database state recovery
"""

import asyncio
import logging
from typing import Optional, Callable, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import json

# Configure logging
logger = logging.getLogger(__name__)


class ConnectionStatus(Enum):
    """Connection status states."""
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    RECONNECTING = "reconnecting"
    ERROR = "error"
    RECOVERING = "recovering"


class ReconnectionManager:
    """Manages connection recovery and restart logic for ARQ agent."""

    def __init__(
        self,
        agent,
        max_retries: int = 5,
        base_delay: float = 1.0,
        max_delay: float = 300.0,
        on_connected: Optional[Callable] = None,
        on_disconnected: Optional[Callable] = None,
    ):
        """Initialize reconnection manager.
        
        Args:
            agent: ARQ agent instance
            max_retries: Maximum number of reconnection attempts
            base_delay: Initial delay in seconds for exponential backoff
            max_delay: Maximum delay between retries
            on_connected: Callback when connection restored
            on_disconnected: Callback when connection lost
        """
        self.agent = agent
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.on_connected = on_connected
        self.on_disconnected = on_disconnected
        
        self.status = ConnectionStatus.CONNECTED
        self.last_disconnect_time: Optional[datetime] = None
        self.reconnect_attempts = 0
        self.session_state: Dict[str, Any] = {}
        self._is_recovering = False

    async def handle_disconnect(self) -> None:
        """Handle detection of connection loss."""
        logger.warning("Connection lost detected")
        self.status = ConnectionStatus.DISCONNECTED
        self.last_disconnect_time = datetime.now()
        self.reconnect_attempts = 0
        
        if self.on_disconnected:
            await self._call_if_async(self.on_disconnected)
        
        # Save current state before attempting recovery
        await self.save_session_state()
        
        # Start reconnection process
        await self.attempt_reconnection()

    async def attempt_reconnection(self) -> bool:
        """Attempt to reconnect with exponential backoff.
        
        Returns:
            True if reconnected successfully, False otherwise
        """
        self.status = ConnectionStatus.RECONNECTING
        logger.info(f"Starting reconnection attempt (max {self.max_retries})")
        
        for attempt in range(self.max_retries):
            self.reconnect_attempts = attempt + 1
            
            try:
                # Calculate delay with exponential backoff
                delay = min(
                    self.base_delay * (2 ** attempt),
                    self.max_delay
                )
                
                logger.info(f"Reconnection attempt {self.reconnect_attempts}/{self.max_retries} "
                          f"(delay: {delay}s)")
                
                # Wait before retry
                await asyncio.sleep(delay)
                
                # Attempt to reconnect
                if await self._connect():
                    logger.info("Reconnection successful")
                    self.status = ConnectionStatus.RECOVERING
                    
                    # Restore session state
                    await self.restore_session_state()
                    
                    self.status = ConnectionStatus.CONNECTED
                    
                    if self.on_connected:
                        await self._call_if_async(self.on_connected)
                    
                    return True
            
            except Exception as e:
                logger.error(f"Reconnection attempt {self.reconnect_attempts} failed: {e}")
                continue
        
        logger.error(f"Failed to reconnect after {self.max_retries} attempts")
        self.status = ConnectionStatus.ERROR
        return False

    async def save_session_state(self) -> None:
        """Save current session state to persistent storage."""
        try:
            self.session_state = {
                "session_id": getattr(self.agent, "session_id", None),
                "user_id": getattr(self.agent, "user_id", None),
                "timestamp": datetime.now().isoformat(),
                "status": "disconnected",
                "last_active": datetime.now().isoformat(),
            }
            
            # Save to database
            if hasattr(self.agent, "db") and self.agent.db:
                await self.agent.db.save_state(self.session_state)
            
            logger.info(f"Session state saved: {self.session_state['session_id']}")
        
        except Exception as e:
            logger.error(f"Failed to save session state: {e}")

    async def restore_session_state(self) -> None:
        """Restore session state from persistent storage."""
        try:
            self.status = ConnectionStatus.RECOVERING
            logger.info("Restoring session state...")
            
            # Restore from database
            if hasattr(self.agent, "db") and self.agent.db:
                session = await self.agent.db.get_session(self.session_state.get("session_id"))
                if session:
                    self.session_state.update(session)
            
            # Restore memory and context
            if hasattr(self.agent, "memory") and self.agent.memory:
                await self.agent.memory.restore_session()
            
            # Get conversation history
            if hasattr(self.agent, "db") and self.agent.db:
                messages = await self.agent.db.get_messages(
                    self.session_state.get("session_id")
                )
                if messages:
                    logger.info(f"Restored {len(messages)} messages from history")
            
            # Handle pending messages
            await self.recover_pending_messages()
            
            logger.info("Session state restored successfully")
        
        except Exception as e:
            logger.error(f"Failed to restore session state: {e}")
            raise

    async def recover_pending_messages(self) -> None:
        """Recover messages that were pending during disconnect."""
        try:
            if not hasattr(self.agent, "db") or not self.agent.db:
                return
            
            # Get pending messages
            pending = await self.agent.db.get_messages(
                self.session_state.get("session_id"),
                status="pending"
            )
            
            if pending:
                logger.info(f"Found {len(pending)} pending messages")
                
                # Retry sending pending messages
                for msg in pending:
                    try:
                        if hasattr(self.agent, "send_message"):
                            await self.agent.send_message(
                                msg["content"],
                                msg.get("role", "user")
                            )
                    except Exception as e:
                        logger.warning(f"Failed to resend message: {e}")
        
        except Exception as e:
            logger.error(f"Failed to recover pending messages: {e}")

    async def graceful_shutdown(self) -> None:
        """Perform graceful shutdown before disconnect."""
        try:
            logger.info("Initiating graceful shutdown...")
            
            # Save state
            await self.save_session_state()
            
            # Close database connections
            if hasattr(self.agent, "db") and hasattr(self.agent.db, "close"):
                await self._call_if_async(self.agent.db.close)
            
            # Close API connections
            if hasattr(self.agent, "api_client") and hasattr(self.agent.api_client, "close"):
                await self._call_if_async(self.agent.api_client.close)
            
            # Notify subscribers
            if self.on_disconnected:
                await self._call_if_async(self.on_disconnected)
            
            self.status = ConnectionStatus.DISCONNECTED
            logger.info("Graceful shutdown completed")
        
        except Exception as e:
            logger.error(f"Error during graceful shutdown: {e}")

    async def _connect(self) -> bool:
        """Attempt to establish connection.
        
        Returns:
            True if connected successfully
        """
        try:
            # Check API health
            if hasattr(self.agent, "api_client"):
                health = await self.agent.api_client.health_check()
                if health.get("status") != "healthy":
                    return False
            
            # Verify database connection
            if hasattr(self.agent, "db"):
                if not await self.agent.db.verify_connection():
                    return False
            
            # Mark as connected
            self.agent.is_connected = True
            return True
        
        except Exception as e:
            logger.error(f"Connection attempt failed: {e}")
            return False

    @staticmethod
    async def _call_if_async(func: Callable) -> Any:
        """Call function if it's async, otherwise call normally."""
        if asyncio.iscoroutinefunction(func):
            return await func()
        else:
            return func()

    def get_status(self) -> Dict[str, Any]:
        """Get current reconnection status.
        
        Returns:
            Dictionary with status information
        """
        return {
            "status": self.status.value,
            "attempts": self.reconnect_attempts,
            "last_disconnect": self.last_disconnect_time.isoformat() if self.last_disconnect_time else None,
            "session_id": self.session_state.get("session_id"),
            "is_recovering": self._is_recovering,
        }
