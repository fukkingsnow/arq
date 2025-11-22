"""Integration of ReconnectionManager with ARQ agent.

Provides utilities to integrate the reconnection recovery system
with the main ARQ agent and its components.
"""

import asyncio
import logging
from typing import Optional
from reconnection import ReconnectionManager

logger = logging.getLogger(__name__)


class ARQReconnectionIntegration:
    """Integrates ReconnectionManager with ARQ agent components."""

    def __init__(self, agent):
        """Initialize integration with ARQ agent."""
        self.agent = agent
        self.reconnection_manager: Optional[ReconnectionManager] = None

    def setup(self) -> None:
        """Setup reconnection handling for the agent."""
        logger.info("Setting up reconnection handling for ARQ agent")
        
        self.reconnection_manager = ReconnectionManager(
            agent=self.agent,
            max_retries=5,
            base_delay=1.0,
            max_delay=300.0,
            on_connected=self._on_connected,
            on_disconnected=self._on_disconnected,
        )

    async def _on_connected(self) -> None:
        """Handle reconnection event."""
        logger.info("ARQ agent reconnected successfully")
        # Notify frontend/UI about reconnection
        if hasattr(self.agent, "notify_frontend"):
            await self.agent.notify_frontend({
                "event": "reconnected",
                "timestamp": asyncio.get_event_loop().time(),
            })

    async def _on_disconnected(self) -> None:
        """Handle disconnection event."""
        logger.warning("ARQ agent disconnected")
        # Notify frontend/UI about disconnection
        if hasattr(self.agent, "notify_frontend"):
            await self.agent.notify_frontend({
                "event": "disconnected",
                "timestamp": asyncio.get_event_loop().time(),
            })

    async def handle_disconnect(self) -> None:
        """Handle connection loss and trigger recovery."""
        if not self.reconnection_manager:
            return
        await self.reconnection_manager.handle_disconnect()

    async def graceful_shutdown(self) -> None:
        """Gracefully shutdown agent before disconnect."""
        if not self.reconnection_manager:
            return
        await self.reconnection_manager.graceful_shutdown()

    def get_status(self) -> dict:
        """Get current reconnection status."""
        if not self.reconnection_manager:
            return {"status": "not_initialized"}
        return self.reconnection_manager.get_status()


def setup_reconnection(agent) -> ARQReconnectionIntegration:
    """Setup reconnection handling for an ARQ agent instance.
    
    Usage:
        from reconnection_integration import setup_reconnection
        
        # In your ARQ agent initialization:
        reconnection = setup_reconnection(agent)
        reconnection.setup()
        
        # On disconnect:
        await reconnection.handle_disconnect()
    """
    integration = ARQReconnectionIntegration(agent)
    integration.setup()
    return integration
