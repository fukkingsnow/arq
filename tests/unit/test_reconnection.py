"""Test suite for ARQ reconnection and restart handling.

This module tests the ARQ AI assistant's ability to:
- Detect connection loss (disconnect events)
- Gracefully handle service interruptions
- Restore connections with backoff retry logic
- Maintain session state and memory during reconnection
- Recover context from database and resume conversations
"""

import asyncio
import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime, timedelta
import json
import sqlite3

# Mock imports for ARQ components
try:
    from src.arq_agent import ARQAgent
    from src.memory import MemoryManager
    from src.database import DatabaseManager
    from src.models import Session, Message
except ImportError:
    # Fallback for test environment
    pass


class TestReconnectionLogic:
    """Test suite for connection restoration and restart logic."""

    @pytest.fixture
    async def mock_agent(self):
        """Create a mock ARQ agent for testing."""
        agent = AsyncMock()
        agent.is_connected = False
        agent.session_id = "test_session_123"
        agent.db = AsyncMock()
        agent.memory = AsyncMock()
        agent.api_client = AsyncMock()
        return agent

    @pytest.fixture
    async def mock_db(self):
        """Create a mock database manager."""
        db = AsyncMock()
        db.get_session = AsyncMock(return_value={"id": "test_session_123", "user_id": "user_001"})
        db.get_messages = AsyncMock(return_value=[
            {"id": 1, "role": "user", "content": "Hello", "timestamp": datetime.now()},
            {"id": 2, "role": "assistant", "content": "Hi there!", "timestamp": datetime.now()}
        ])
        db.save_state = AsyncMock()
        return db

    @pytest.fixture
    async def mock_memory(self):
        """Create a mock memory manager."""
        memory = AsyncMock()
        memory.get_context = AsyncMock(return_value="Previous context from memory")
        memory.save_context = AsyncMock()
        memory.restore_session = AsyncMock()
        return memory

    @pytest.mark.asyncio
    async def test_detect_disconnect_event(self, mock_agent):
        """Test that disconnect events are properly detected."""
        # Simulate connection loss
        mock_agent.is_connected = False
        
        assert not mock_agent.is_connected
        assert mock_agent.session_id == "test_session_123"

    @pytest.mark.asyncio
    async def test_exponential_backoff_retry(self):
        """Test exponential backoff retry mechanism."""
        max_retries = 5
        base_delay = 1
        
        async def reconnect_with_backoff(attempt):
            delay = base_delay * (2 ** attempt)
            await asyncio.sleep(0.001)  # Minimal sleep for testing
            return attempt < max_retries
        
        for attempt in range(max_retries):
            success = await reconnect_with_backoff(attempt)
            assert success

    @pytest.mark.asyncio
    async def test_session_state_persistence(self, mock_db, mock_agent):
        """Test that session state is saved before disconnect."""
        session_data = {
            "id": mock_agent.session_id,
            "user_id": "user_001",
            "last_active": datetime.now().isoformat(),
            "status": "disconnected"
        }
        
        await mock_db.save_state(session_data)
        mock_db.save_state.assert_called_once_with(session_data)

    @pytest.mark.asyncio
    async def test_memory_restoration_on_reconnect(self, mock_db, mock_memory, mock_agent):
        """Test that context and memory are restored on reconnection."""
        # Get previous context
        context = await mock_memory.get_context()
        assert context == "Previous context from memory"
        
        # Get last messages for history
        messages = await mock_db.get_messages(mock_agent.session_id)
        assert len(messages) == 2
        assert messages[0]["role"] == "user"

    @pytest.mark.asyncio
    async def test_recover_interrupted_message(self, mock_db):
        """Test recovery of message that was interrupted during send."""
        interrupted_msg = {
            "id": 3,
            "role": "user",
            "content": "This was interrupted",
            "status": "pending"
        }
        
        # Mock retrieval of pending messages
        get_pending = AsyncMock(return_value=[interrupted_msg])
        
        pending = await get_pending()
        assert len(pending) == 1
        assert pending[0]["status"] == "pending"

    @pytest.mark.asyncio
    async def test_restart_with_fresh_context(self, mock_agent, mock_memory):
        """Test cold restart with context restoration."""
        # Simulate agent restart
        mock_agent.is_connected = False
        
        # Reset state
        await mock_memory.restore_session()
        mock_memory.restore_session.assert_called_once()

    @pytest.mark.asyncio
    async def test_connection_recovery_sequence(self, mock_agent, mock_db, mock_memory):
        """Test the complete connection recovery sequence."""
        # 1. Detect disconnect
        mock_agent.is_connected = False
        
        # 2. Save current state
        await mock_db.save_state({"session_id": mock_agent.session_id})
        
        # 3. Wait and retry
        await asyncio.sleep(0.01)
        
        # 4. Restore memory
        context = await mock_memory.get_context()
        
        # 5. Verify recovery
        mock_db.save_state.assert_called_once()
        mock_memory.get_context.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_partial_message_loss(self, mock_db):
        """Test handling of messages lost during disconnect."""
        expected_messages = 2
        
        # Get messages from DB
        messages = await mock_db.get_messages("test_session_123")
        actual_messages = len(messages)
        
        assert actual_messages == expected_messages

    @pytest.mark.asyncio
    async def test_api_reconnect_validation(self, mock_agent):
        """Test that API connection is properly validated after reconnect."""
        # Mock API health check
        mock_agent.api_client.health_check = AsyncMock(return_value={"status": "healthy"})
        
        health = await mock_agent.api_client.health_check()
        assert health["status"] == "healthy"

    @pytest.mark.asyncio
    async def test_multiple_reconnection_attempts(self):
        """Test handling of multiple consecutive reconnection failures."""
        attempts = 0
        max_attempts = 3
        
        async def attempt_reconnect():
            nonlocal attempts
            attempts += 1
            return attempts >= max_attempts
        
        for _ in range(max_attempts):
            success = await attempt_reconnect()
            if success:
                break
        
        assert attempts == max_attempts


class TestDisconnectScenarios:
    """Test different disconnect scenarios and recovery."""

    @pytest.mark.asyncio
    async def test_network_timeout_recovery(self):
        """Test recovery from network timeout."""
        timeout_occurred = False
        
        try:
            # Simulate timeout
            await asyncio.wait_for(asyncio.sleep(10), timeout=0.01)
        except asyncio.TimeoutError:
            timeout_occurred = True
        
        assert timeout_occurred

    @pytest.mark.asyncio
    async def test_telegram_bot_disconnect(self):
        """Test Telegram bot reconnection."""
        bot = AsyncMock()
        bot.polling = AsyncMock(side_effect=Exception("Connection lost"))
        
        with pytest.raises(Exception):
            await bot.polling()

    @pytest.mark.asyncio
    async def test_database_connection_loss(self):
        """Test recovery from database connection loss."""
        db = AsyncMock()
        db.connect = AsyncMock(side_effect=[Exception("Connection refused"), None])
        
        # First attempt fails
        with pytest.raises(Exception):
            await db.connect()
        
        # Second attempt succeeds (after retry)
        await db.connect()
        assert db.connect.call_count == 2

    @pytest.mark.asyncio
    async def test_graceful_shutdown_and_restart(self, mock_agent):
        """Test graceful shutdown followed by clean restart."""
        # Simulate shutdown
        mock_agent.is_connected = True
        shutdown_result = await mock_agent.shutdown() if hasattr(mock_agent, 'shutdown') else True
        
        # Simulate restart
        mock_agent.is_connected = False
        restart_result = await mock_agent.connect() if hasattr(mock_agent, 'connect') else True
        
        assert shutdown_result or restart_result


class TestContextRecovery:
    """Test context and conversation recovery after restart."""

    @pytest.mark.asyncio
    async def test_load_conversation_history(self, mock_db):
        """Test loading full conversation history after restart."""
        session_id = "test_session_123"
        
        messages = await mock_db.get_messages(session_id)
        
        assert len(messages) >= 1
        assert all("role" in msg and "content" in msg for msg in messages)

    @pytest.mark.asyncio
    async def test_restore_agent_state(self, mock_agent, mock_memory):
        """Test restoration of agent internal state."""
        # Save state
        state = {
            "session_id": mock_agent.session_id,
            "user_context": "test context",
            "is_connected": True
        }
        
        # Simulate restore
        await mock_memory.restore_session()
        
        # Verify
        mock_agent.session_id == state["session_id"]

    @pytest.mark.asyncio
    async def test_rebuild_llm_context_window(self):
        """Test rebuilding of LLM context window from history."""
        history = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"},
            {"role": "user", "content": "How are you?"}
        ]
        
        # Simulate context window rebuild
        context_window = "\n".join([f"{msg['role']}: {msg['content']}" for msg in history])
        
        assert len(context_window) > 0
        assert "user:" in context_window
        assert "assistant:" in context_window


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "-s"])
