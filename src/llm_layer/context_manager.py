"""Context Manager (Phase 9, Tier 2)

Intelligent context management with sliding window optimization.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class ContextWindow:
    """Represents a context window for LLM interactions"""
    system_prompt: str
    messages: List[Dict[str, str]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    max_tokens: int = 2048
    current_tokens: int = 0

    def add_message(self, role: str, content: str) -> None:
        """Add message to context"""
        self.messages.append({"role": role, "content": content})
        self.current_tokens += len(content.split())

    def get_available_tokens(self) -> int:
        """Get remaining tokens in context window"""
        return self.max_tokens - self.current_tokens

    def is_full(self) -> bool:
        """Check if context window is full"""
        return self.current_tokens >= self.max_tokens


class ContextManager:
    """Manages LLM conversation context and history"""

    def __init__(self, max_context_window: int = 4096):
        """Initialize context manager

        Args:
            max_context_window: Maximum context window size
        """
        self.max_context_window = max_context_window
        self.contexts: Dict[str, ContextWindow] = {}
        self.active_context: Optional[str] = None

    def create_context(
        self,
        context_id: str,
        system_prompt: str,
        max_tokens: int = 2048,
    ) -> ContextWindow:
        """Create new context window"""
        context = ContextWindow(
            system_prompt=system_prompt,
            max_tokens=max_tokens,
        )
        self.contexts[context_id] = context
        self.active_context = context_id
        logger.info(f"Created context: {context_id}")
        return context

    def get_context(self, context_id: str) -> Optional[ContextWindow]:
        """Retrieve context by ID"""
        return self.contexts.get(context_id)

    def add_message(
        self,
        context_id: str,
        role: str,
        content: str,
    ) -> bool:
        """Add message to context"""
        context = self.get_context(context_id)
        if not context:
            return False

        if context.is_full():
            self._prune_context(context_id)

        context.add_message(role, content)
        return True

    def _prune_context(self, context_id: str) -> None:
        """Remove oldest messages if context is full"""
        context = self.get_context(context_id)
        if context and context.messages:
            # Remove oldest message
            old_msg = context.messages.pop(0)
            context.current_tokens -= len(old_msg["content"].split())
            logger.warning(f"Pruned message from context: {context_id}")

    def get_context_summary(self, context_id: str) -> Dict[str, Any]:
        """Get context summary"""
        context = self.get_context(context_id)
        if not context:
            return {}

        return {
            "id": context_id,
            "messages_count": len(context.messages),
            "tokens_used": context.current_tokens,
            "available_tokens": context.get_available_tokens(),
            "created_at": context.created_at.isoformat(),
        }
