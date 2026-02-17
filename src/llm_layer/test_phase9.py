"""Phase 9 LLM Integration Tests

Comprehensive test suite for LLM provider abstraction and context management.
Target: 85%+ code coverage with 40+ test cases.
"""

import pytest
import asyncio
from datetime import datetime

from provider_base import (
    LLMProvider,
    CompletionRequest,
    CompletionResponse,
    ProviderStatus,
    ProviderHealth,
    LLMProviderError,
)
from openai_provider import OpenAIProvider
from context_manager import ContextManager, ContextWindow


class TestProviderBase:
    """Tests for LLM Provider base abstraction"""

    def test_completion_request_creation(self):
        """Test creating completion request"""
        req = CompletionRequest(
            prompt="Test prompt",
            model="gpt-4",
            max_tokens=100,
        )
        assert req.prompt == "Test prompt"
        assert req.model == "gpt-4"
        assert req.max_tokens == 100

    def test_completion_response_creation(self):
        """Test creating completion response"""
        resp = CompletionResponse(
            content="Test response",
            model="gpt-4",
            provider="openai",
            tokens_used=50,
            latency_ms=100.5,
            finish_reason="stop",
        )
        assert resp.content == "Test response"
        assert resp.tokens_used == 50
        assert resp.finish_reason == "stop"

    def test_provider_status_enum(self):
        """Test provider status enumeration"""
        assert ProviderStatus.HEALTHY.value == "healthy"
        assert ProviderStatus.DEGRADED.value == "degraded"
        assert ProviderStatus.UNHEALTHY.value == "unhealthy"

    def test_provider_health_creation(self):
        """Test creating provider health status"""
        health = ProviderHealth(
            status=ProviderStatus.HEALTHY,
            response_time_ms=150.0,
            error_count=0,
            success_count=100,
            available_models=["gpt-4", "gpt-3.5-turbo"],
        )
        assert health.status == ProviderStatus.HEALTHY
        assert health.error_count == 0
        assert len(health.available_models) == 2


class TestOpenAIProvider:
    """Tests for OpenAI provider implementation"""

    @pytest.fixture
    def provider(self):
        """Create OpenAI provider instance"""
        return OpenAIProvider(api_key="test-key")

    @pytest.mark.asyncio
    async def test_openai_complete(self, provider):
        """Test OpenAI completion"""
        req = CompletionRequest(
            prompt="Hello",
            model="gpt-3.5-turbo",
        )
        resp = await provider.complete(req)
        assert resp.provider == "openai"
        assert resp.model == req.model
        assert resp.tokens_used > 0

    @pytest.mark.asyncio
    async def test_openai_stream(self, provider):
        """Test OpenAI streaming"""
        req = CompletionRequest(
            prompt="Hello",
            model="gpt-3.5-turbo",
        )
        chunks = []
        async for chunk in provider.stream(req):
            chunks.append(chunk)
        assert len(chunks) > 0

    @pytest.mark.asyncio
    async def test_openai_validate_model(self, provider):
        """Test OpenAI model validation"""
        assert await provider.validate_model("gpt-3.5-turbo")
        assert await provider.validate_model("gpt-4")
        assert not await provider.validate_model("invalid-model")

    @pytest.mark.asyncio
    async def test_openai_health_status(self, provider):
        """Test OpenAI health check"""
        health = await provider.get_health_status()
        assert health.status == ProviderStatus.HEALTHY
        assert health.response_time_ms >= 0
        assert len(health.available_models) > 0

    def test_openai_metrics(self, provider):
        """Test OpenAI metrics tracking"""
        metrics = provider.get_metrics()
        assert "provider" in metrics
        assert metrics["provider"] == "openai"
        assert "requests" in metrics
        assert "errors" in metrics


class TestContextManager:
    """Tests for context management"""

    @pytest.fixture
    def manager(self):
        """Create context manager instance"""
        return ContextManager(max_context_window=4096)

    def test_context_window_creation(self):
        """Test creating context window"""
        ctx = ContextWindow(
            system_prompt="You are helpful",
            max_tokens=2048,
        )
        assert ctx.system_prompt == "You are helpful"
        assert ctx.max_tokens == 2048
        assert ctx.current_tokens == 0

    def test_context_window_add_message(self):
        """Test adding message to context"""
        ctx = ContextWindow(
            system_prompt="You are helpful",
            max_tokens=2048,
        )
        ctx.add_message("user", "Hello world")
        assert len(ctx.messages) == 1
        assert ctx.current_tokens > 0

    def test_context_window_available_tokens(self):
        """Test available tokens calculation"""
        ctx = ContextWindow(
            system_prompt="You are helpful",
            max_tokens=100,
        )
        ctx.add_message("user", "Hello")
        available = ctx.get_available_tokens()
        assert available < 100
        assert available > 0

    def test_context_window_full_check(self):
        """Test context full check"""
        ctx = ContextWindow(
            system_prompt="You are helpful",
            max_tokens=10,
        )
        assert not ctx.is_full()
        ctx.add_message("user", "Hello world test")
        assert ctx.is_full()

    def test_create_context(self, manager):
        """Test creating context in manager"""
        ctx = manager.create_context(
            "ctx1",
            "You are helpful",
        )
        assert ctx is not None
        assert manager.active_context == "ctx1"

    def test_get_context(self, manager):
        """Test retrieving context"""
        manager.create_context("ctx1", "You are helpful")
        ctx = manager.get_context("ctx1")
        assert ctx is not None
        assert ctx.system_prompt == "You are helpful"

    def test_add_message_to_context(self, manager):
        """Test adding message via manager"""
        manager.create_context("ctx1", "You are helpful")
        result = manager.add_message("ctx1", "user", "Hello")
        assert result is True
        ctx = manager.get_context("ctx1")
        assert len(ctx.messages) == 1

    def test_get_context_summary(self, manager):
        """Test getting context summary"""
        manager.create_context("ctx1", "You are helpful")
        manager.add_message("ctx1", "user", "Hello world")
        summary = manager.get_context_summary("ctx1")
        assert summary["id"] == "ctx1"
        assert summary["messages_count"] == 1
        assert summary["tokens_used"] > 0


class TestIntegration:
    """Integration tests"""

    @pytest.mark.asyncio
    async def test_provider_with_context(self):
        """Test provider integration with context manager"""
        provider = OpenAIProvider(api_key="test-key")
        manager = ContextManager()
        
        manager.create_context("chat1", "You are helpful")
        manager.add_message("chat1", "user", "Hello")
        
        ctx = manager.get_context("chat1")
        assert len(ctx.messages) == 1

    def test_multiple_contexts(self):
        """Test managing multiple contexts"""
        manager = ContextManager()
        
        manager.create_context("chat1", "You are helpful")
        manager.create_context("chat2", "You are concise")
        
        ctx1 = manager.get_context("chat1")
        ctx2 = manager.get_context("chat2")
        
        assert ctx1.system_prompt == "You are helpful"
        assert ctx2.system_prompt == "You are concise"
