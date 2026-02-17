"""Phase 9: LLM Integration Layer

Пакет для интеграции с различными провайдерами LLM и управления контекстом.
Provides intelligent context management, memory systems, and multi-provider
LLM integration with automatic failover and recovery.

Module structure:
- provider_base: Abstract interface for LLM providers
- openai_provider: OpenAI integration with streaming
- anthropic_provider: Anthropic/Claude integration
- azure_provider: Azure OpenAI with regional failover
- ollama_provider: Local LLM support (Ollama)
- context_manager: Intelligent context tracking
- memory_system: Multi-tier memory with semantic search
- context_optimizer: Token counting and optimization
- query_processor: Query parsing and augmentation
- prompt_generator: Dynamic prompt creation
- auto_recovery: Automatic failover and retry logic
- loadbalancer: Provider selection and distribution
- analytics: Performance metrics and monitoring
- response_handler: Response parsing and formatting
"""

__version__ = "1.0.0"
__author__ = "ARQ Development Team"

from typing import Dict, Any, Optional, List
import logging

# Configure logging
logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

# Version info
VERSION = __version__

# Export main classes when available
__all__ = [
    "LLMProvider",
    "ContextManager",
    "MemorySystem",
    "ContextOptimizer",
    "QueryProcessor",
    "PromptGenerator",
    "AutoRecovery",
    "LoadBalancer",
    "Analytics",
    "ResponseHandler",
]
