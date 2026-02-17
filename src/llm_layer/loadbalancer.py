"""Load Balancer (Phase 9, Tier 3)

Intelligent provider selection and load distribution.
"""

from typing import Dict, List, Optional
from enum import Enum
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class LoadBalancingStrategy(Enum):
    """Load balancing strategies"""
    ROUND_ROBIN = "round_robin"
    LEAST_LOADED = "least_loaded"
    HEALTH_BASED = "health_based"
    RANDOM = "random"


class ProviderMetrics:
    """Tracks provider performance metrics"""

    def __init__(self, provider_id: str):
        self.provider_id = provider_id
        self.request_count = 0
        self.error_count = 0
        self.total_latency_ms = 0.0
        self.last_error_time: Optional[datetime] = None
        self.last_success_time: Optional[datetime] = None

    def get_average_latency(self) -> float:
        """Calculate average latency"""
        if self.request_count == 0:
            return 0.0
        return self.total_latency_ms / self.request_count

    def get_error_rate(self) -> float:
        """Calculate error rate"""
        if self.request_count == 0:
            return 0.0
        return self.error_count / self.request_count


class LoadBalancer:
    """Distributes requests across LLM providers"""

    def __init__(
        self,
        strategy: LoadBalancingStrategy = LoadBalancingStrategy.HEALTH_BASED,
    ):
        self.strategy = strategy
        self.providers: Dict[str, any] = {}
        self.metrics: Dict[str, ProviderMetrics] = {}
        self.current_index = 0

    def add_provider(self, provider_id: str, provider: any) -> None:
        """Add provider to load balancer"""
        self.providers[provider_id] = provider
        self.metrics[provider_id] = ProviderMetrics(provider_id)
        logger.info(f"Added provider: {provider_id}")

    def select_provider(self) -> Optional[str]:
        """Select next provider based on strategy"""
        if not self.providers:
            return None

        if self.strategy == LoadBalancingStrategy.ROUND_ROBIN:
            return self._select_round_robin()
        elif self.strategy == LoadBalancingStrategy.HEALTH_BASED:
            return self._select_health_based()
        else:
            return list(self.providers.keys())[0]

    def _select_round_robin(self) -> str:
        """Select provider using round-robin"""
        provider_ids = list(self.providers.keys())
        provider_id = provider_ids[self.current_index % len(provider_ids)]
        self.current_index += 1
        return provider_id

    def _select_health_based(self) -> str:
        """Select provider based on health"""
        provider_ids = list(self.providers.keys())
        best_provider = provider_ids[0]
        best_score = float("-inf")

        for provider_id in provider_ids:
            metrics = self.metrics[provider_id]
            # Lower error rate and latency = better score
            score = -(metrics.get_error_rate() * 100 + metrics.get_average_latency())
            if score > best_score:
                best_score = score
                best_provider = provider_id

        return best_provider

    def record_success(self, provider_id: str, latency_ms: float) -> None:
        """Record successful request"""
        if provider_id in self.metrics:
            metrics = self.metrics[provider_id]
            metrics.request_count += 1
            metrics.total_latency_ms += latency_ms
            metrics.last_success_time = datetime.utcnow()

    def record_error(self, provider_id: str) -> None:
        """Record failed request"""
        if provider_id in self.metrics:
            metrics = self.metrics[provider_id]
            metrics.error_count += 1
            metrics.last_error_time = datetime.utcnow()

    def get_statistics(self) -> Dict[str, any]:
        """Get provider statistics"""
        stats = {}
        for provider_id, metrics in self.metrics.items():
            stats[provider_id] = {
                "requests": metrics.request_count,
                "errors": metrics.error_count,
                "error_rate": metrics.get_error_rate(),
                "avg_latency_ms": metrics.get_average_latency(),
            }
        return stats
