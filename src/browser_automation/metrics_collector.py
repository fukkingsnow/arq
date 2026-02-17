# Phase 13: Tier 1 - Metrics Collector
# Advanced metrics collection from Phase 12 multi-agent orchestration
# Thread-safe event capture, performance metrics, and time-series data management

import threading
import time
from collections import defaultdict, deque
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
import json


class MetricType(Enum):
    """Types of metrics that can be collected."""
    AGENT_PERFORMANCE = "agent_performance"
    MESSAGE_THROUGHPUT = "message_throughput"
    LATENCY = "latency"
    RESOURCE_UTILIZATION = "resource_utilization"
    ERROR_RATE = "error_rate"
    QUEUE_DEPTH = "queue_depth"
    EXECUTION_TIME = "execution_time"
    MEMORY_USAGE = "memory_usage"
    CPU_USAGE = "cpu_usage"
    NETWORK_IO = "network_io"


class MetricLevel(Enum):
    """Granularity levels for metrics."""
    RAW = "raw"  # Individual events
    AGENT = "agent"  # Per-agent aggregation
    SYSTEM = "system"  # System-wide aggregation
    HISTORICAL = "historical"  # Long-term trends


@dataclass
class Metric:
    """Single metric data point."""
    metric_type: MetricType
    value: float
    timestamp: float
    agent_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    level: MetricLevel = MetricLevel.RAW

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
        return {
            'type': self.metric_type.value,
            'value': self.value,
            'timestamp': self.timestamp,
            'agent_id': self.agent_id,
            'metadata': self.metadata,
            'level': self.level.value
        }


@dataclass
class PerformanceMetrics:
    """Aggregated performance metrics for an agent."""
    agent_id: str
    total_tasks: int = 0
    successful_tasks: int = 0
    failed_tasks: int = 0
    average_execution_time: float = 0.0
    max_execution_time: float = 0.0
    min_execution_time: float = float('inf')
    total_messages_processed: int = 0
    average_message_latency: float = 0.0
    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    error_count: int = 0
    last_update: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'agent_id': self.agent_id,
            'total_tasks': self.total_tasks,
            'successful_tasks': self.successful_tasks,
            'failed_tasks': self.failed_tasks,
            'average_execution_time': self.average_execution_time,
            'max_execution_time': self.max_execution_time,
            'min_execution_time': self.min_execution_time,
            'total_messages_processed': self.total_messages_processed,
            'average_message_latency': self.average_message_latency,
            'cpu_usage': self.cpu_usage,
            'memory_usage': self.memory_usage,
            'error_count': self.error_count,
            'last_update': self.last_update
        }


class EventBuffer:
    """Thread-safe circular buffer for metric events."""

    def __init__(self, max_size: int = 10000):
        """Initialize event buffer.
        
        Args:
            max_size: Maximum number of events to store
        """
        self.buffer = deque(maxlen=max_size)
        self.lock = threading.RLock()
        self.max_size = max_size

    def append(self, metric: Metric) -> None:
        """Add metric to buffer (thread-safe).
        
        Args:
            metric: Metric to add
        """
        with self.lock:
            self.buffer.append(metric)

    def get_all(self) -> List[Metric]:
        """Get all metrics from buffer.
        
        Returns:
            List of all metrics
        """
        with self.lock:
            return list(self.buffer)

    def get_recent(self, count: int) -> List[Metric]:
        """Get most recent metrics.
        
        Args:
            count: Number of recent metrics to retrieve
            
        Returns:
            List of recent metrics
        """
        with self.lock:
            return list(self.buffer)[-count:] if count > 0 else []

    def get_by_type(self, metric_type: MetricType) -> List[Metric]:
        """Get metrics by type.
        
        Args:
            metric_type: Type of metric to filter
            
        Returns:
            List of metrics matching type
        """
        with self.lock:
            return [m for m in self.buffer if m.metric_type == metric_type]

    def get_by_agent(self, agent_id: str) -> List[Metric]:
        """Get metrics for specific agent.
        
        Args:
            agent_id: Agent identifier
            
        Returns:
            List of metrics for agent
        """
        with self.lock:
            return [m for m in self.buffer if m.agent_id == agent_id]

    def clear(self) -> None:
        """Clear all metrics from buffer."""
        with self.lock:
            self.buffer.clear()

    def size(self) -> int:
        """Get current buffer size.
        
        Returns:
            Current number of metrics
        """
        with self.lock:
            return len(self.buffer)


class MetricsCollector:
    """Central metrics collection engine for Phase 13 analytics."""

    def __init__(self, buffer_size: int = 10000):
        """Initialize metrics collector.
        
        Args:
            buffer_size: Maximum metrics to retain in memory
        """
        self.buffer = EventBuffer(buffer_size)
        self.agent_metrics: Dict[str, PerformanceMetrics] = {}
        self.lock = threading.RLock()
        self.callbacks: List[Callable[[Metric], None]] = []
        self.is_active = True
        self.collection_start_time = time.time()
        self.metrics_count = 0

    def record_metric(self, metric: Metric) -> None:
        """Record a metric event (thread-safe).
        
        Args:
            metric: Metric to record
        """
        if not self.is_active:
            return

        with self.lock:
            self.buffer.append(metric)
            self.metrics_count += 1
            self._trigger_callbacks(metric)

    def record_agent_task(self, agent_id: str, execution_time: float,
                         success: bool, error_msg: Optional[str] = None) -> None:
        """Record task execution for an agent.
        
        Args:
            agent_id: Agent identifier
            execution_time: Time taken to execute
            success: Whether task succeeded
            error_msg: Error message if failed
        """
        metric = Metric(
            metric_type=MetricType.EXECUTION_TIME,
            value=execution_time,
            timestamp=time.time(),
            agent_id=agent_id,
            metadata={'success': success, 'error': error_msg}
        )
        self.record_metric(metric)
        self._update_agent_metrics(agent_id, execution_time, success)

    def record_message_throughput(self, agent_id: str, message_count: int,
                                 latency: float) -> None:
        """Record message throughput for an agent.
        
        Args:
            agent_id: Agent identifier
            message_count: Number of messages processed
            latency: Message latency in milliseconds
        """
        metric = Metric(
            metric_type=MetricType.MESSAGE_THROUGHPUT,
            value=message_count,
            timestamp=time.time(),
            agent_id=agent_id,
            metadata={'latency_ms': latency}
        )
        self.record_metric(metric)

    def record_resource_usage(self, agent_id: str, cpu_percent: float,
                             memory_mb: float) -> None:
        """Record resource usage for an agent.
        
        Args:
            agent_id: Agent identifier
            cpu_percent: CPU usage percentage
            memory_mb: Memory usage in MB
        """
        cpu_metric = Metric(
            metric_type=MetricType.CPU_USAGE,
            value=cpu_percent,
            timestamp=time.time(),
            agent_id=agent_id
        )
        memory_metric = Metric(
            metric_type=MetricType.MEMORY_USAGE,
            value=memory_mb,
            timestamp=time.time(),
            agent_id=agent_id
        )
        self.record_metric(cpu_metric)
        self.record_metric(memory_metric)

    def get_agent_metrics(self, agent_id: str) -> Optional[PerformanceMetrics]:
        """Get aggregated metrics for an agent.
        
        Args:
            agent_id: Agent identifier
            
        Returns:
            Performance metrics or None if agent not found
        """
        with self.lock:
            return self.agent_metrics.get(agent_id)

    def get_all_agent_metrics(self) -> Dict[str, PerformanceMetrics]:
        """Get metrics for all agents.
        
        Returns:
            Dictionary of agent_id -> PerformanceMetrics
        """
        with self.lock:
            return dict(self.agent_metrics)

    def get_recent_metrics(self, count: int) -> List[Metric]:
        """Get most recent metrics.
        
        Args:
            count: Number of recent metrics
            
        Returns:
            List of recent metrics
        """
        return self.buffer.get_recent(count)

    def get_metrics_by_type(self, metric_type: MetricType) -> List[Metric]:
        """Get metrics by type.
        
        Args:
            metric_type: Type to filter
            
        Returns:
            List of matching metrics
        """
        return self.buffer.get_by_type(metric_type)

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get collection statistics.
        
        Returns:
            Dictionary with collection stats
        """
        with self.lock:
            uptime = time.time() - self.collection_start_time
            return {
                'total_metrics': self.metrics_count,
                'buffer_size': self.buffer.size(),
                'total_agents': len(self.agent_metrics),
                'uptime_seconds': uptime,
                'collection_rate': self.metrics_count / uptime if uptime > 0 else 0
            }

    def register_callback(self, callback: Callable[[Metric], None]) -> None:
        """Register callback for metric events.
        
        Args:
            callback: Function to call on new metrics
        """
        with self.lock:
            self.callbacks.append(callback)

    def shutdown(self) -> None:
        """Shutdown metrics collection."""
        with self.lock:
            self.is_active = False

    def _update_agent_metrics(self, agent_id: str, execution_time: float,
                             success: bool) -> None:
        """Update agent metrics internally.
        
        Args:
            agent_id: Agent identifier
            execution_time: Execution time
            success: Whether successful
        """
        with self.lock:
            if agent_id not in self.agent_metrics:
                self.agent_metrics[agent_id] = PerformanceMetrics(agent_id=agent_id)
            
            metrics = self.agent_metrics[agent_id]
            metrics.total_tasks += 1
            if success:
                metrics.successful_tasks += 1
            else:
                metrics.failed_tasks += 1
            
            # Update execution time metrics
            if metrics.total_tasks == 1:
                metrics.average_execution_time = execution_time
                metrics.max_execution_time = execution_time
                metrics.min_execution_time = execution_time
            else:
                metrics.average_execution_time = (
                    (metrics.average_execution_time * (metrics.total_tasks - 1) + execution_time) /
                    metrics.total_tasks
                )
                metrics.max_execution_time = max(metrics.max_execution_time, execution_time)
                metrics.min_execution_time = min(metrics.min_execution_time, execution_time)
            
            metrics.last_update = time.time()

    def _trigger_callbacks(self, metric: Metric) -> None:
        """Trigger registered callbacks.
        
        Args:
            metric: Metric to pass to callbacks
        """
        for callback in self.callbacks:
            try:
                callback(metric)
            except Exception:
                pass  # Silently ignore callback errors
