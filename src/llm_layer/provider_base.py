"""LLM Provider Base Abstraction (Phase 9, Tier 1)

Абстрактные базовые классы для всех LLM провайдеров.
Defines the interface that all LLM providers must implement.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, AsyncIterator
from enum import Enum
import asyncio
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ProviderStatus(Enum):
    """Provider health status enumeration"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass
class CompletionRequest:
    """Standard completion request format"""
    prompt: str
    model: str
    max_tokens: int = 1000
    temperature: float = 0.7
    top_p: float = 0.95
    system_prompt: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CompletionResponse:
    """Standard completion response format"""
    content: str
    model: str
    provider: str
    tokens_used: int
    latency_ms: float
    finish_reason: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ProviderHealth:
    """Provider health status information"""
    status: ProviderStatus
    response_time_ms: float
    error_count: int
    success_count: int
    available_models: List[str]


class LLMProviderError(Exception):
    """Base exception for LLM provider errors"""
    pass


class LLMProvider(ABC):
    """Abstract base class for all LLM providers"""

    def __init__(
        self,
        provider_name: str,
        timeout: int = 30,
        max_retries: int = 3,
    ):
        self.provider_name = provider_name
        self.timeout = timeout
        self.max_retries = max_retries
        self.request_count = 0
        self.error_count = 0
        self.total_tokens = 0

    @abstractmethod
    async def complete(
        self,
        request: CompletionRequest,
    ) -> CompletionResponse:
        """Generate a completion for the given request"""
        pass

    @abstractmethod
    async def stream(
        self,
        request: CompletionRequest,
    ) -> AsyncIterator[str]:
        """Stream a completion incrementally"""
        pass

    @abstractmethod
    async def validate_model(self, model: str) -> bool:
        """Validate if model is available"""
        pass

    @abstractmethod
    async def get_health_status(self) -> ProviderHealth:
        """Get current provider health status"""
        pass

    def get_metrics(self) -> Dict[str, Any]:
        """Get provider metrics"""
        return {
            "provider": self.provider_name,
            "requests": self.request_count,
            "errors": self.error_count,
            "total_tokens": self.total_tokens,
        }
