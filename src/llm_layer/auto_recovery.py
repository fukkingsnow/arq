"""Auto Recovery System (Phase 9, Tier 3)

Automatic failover and recovery mechanisms.
"""

import asyncio
from typing import Optional, Dict, Callable, Any
from enum import Enum
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class RecoveryStrategy(Enum):
    """Recovery strategies"""
    EXPONENTIAL_BACKOFF = "exponential_backoff"
    LINEAR_BACKOFF = "linear_backoff"
    FIXED_BACKOFF = "fixed_backoff"


class AutoRecovery:
    """Handles automatic recovery and failover"""

    def __init__(
        self,
        max_retries: int = 3,
        initial_backoff: float = 1.0,
        max_backoff: float = 60.0,
        strategy: RecoveryStrategy = RecoveryStrategy.EXPONENTIAL_BACKOFF,
    ):
        self.max_retries = max_retries
        self.initial_backoff = initial_backoff
        self.max_backoff = max_backoff
        self.strategy = strategy
        self.failed_providers: Dict[str, datetime] = {}
        self.recovery_attempts: Dict[str, int] = {}

    def is_provider_available(self, provider_id: str) -> bool:
        """Check if provider is currently available"""
        if provider_id not in self.failed_providers:
            return True

        # Check if provider has recovered
        failed_time = self.failed_providers[provider_id]
        backoff = self._calculate_backoff(provider_id)
        return datetime.utcnow() >= failed_time + timedelta(seconds=backoff)

    def _calculate_backoff(self, provider_id: str) -> float:
        """Calculate backoff time based on strategy"""
        attempts = self.recovery_attempts.get(provider_id, 0)

        if self.strategy == RecoveryStrategy.EXPONENTIAL_BACKOFF:
            backoff = self.initial_backoff * (2 ** attempts)
        elif self.strategy == RecoveryStrategy.LINEAR_BACKOFF:
            backoff = self.initial_backoff * (attempts + 1)
        else:
            backoff = self.initial_backoff

        return min(backoff, self.max_backoff)

    async def execute_with_recovery(
        self,
        provider_id: str,
        func: Callable,
        *args,
        **kwargs,
    ) -> Any:
        """Execute function with automatic recovery"""
        if not self.is_provider_available(provider_id):
            raise RuntimeError(f"Provider {provider_id} is temporarily unavailable")

        last_error = None
        for attempt in range(self.max_retries):
            try:
                result = await func(*args, **kwargs)
                # Success - reset recovery state
                self.failed_providers.pop(provider_id, None)
                self.recovery_attempts[provider_id] = 0
                return result
            except Exception as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    backoff = self._calculate_backoff(provider_id)
                    logger.warning(
                        f"Attempt {attempt + 1}/{self.max_retries} failed for "
                        f"{provider_id}, retrying in {backoff}s: {e}"
                    )
                    await asyncio.sleep(backoff)
                    self.recovery_attempts[provider_id] = attempt + 1

        # All retries failed
        self.failed_providers[provider_id] = datetime.utcnow()
        logger.error(f"Provider {provider_id} failed after {self.max_retries} retries: {last_error}")
        raise last_error

    def get_recovery_status(self) -> Dict[str, Any]:
        """Get recovery status for all providers"""
        status = {}
        for provider_id in self.recovery_attempts.keys():
            attempts = self.recovery_attempts[provider_id]
            available = self.is_provider_available(provider_id)
            status[provider_id] = {
                "attempts": attempts,
                "available": available,
                "backoff_seconds": self._calculate_backoff(provider_id),
            }
        return status
