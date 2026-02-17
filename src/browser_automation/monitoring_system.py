"""Monitoring System - Tier 3: Real-time Monitoring & Alert Management

Provides real-time metrics monitoring, alert generation, and dashboard updates.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from threading import RLock, Thread
import time
from collections import defaultdict


class AlertSeverity(Enum):
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    RESOLVED = "resolved"


@dataclass
class Alert:
    """Alert notification."""
    id: str
    metric_name: str
    severity: AlertSeverity
    message: str
    timestamp: datetime
    value: float
    threshold: float


@dataclass
class MonitoringConfig:
    """Monitoring configuration."""
    check_interval: int = 10  # seconds
    alert_retention: int = 3600  # seconds
    buffer_size: int = 1000
    enable_aggregation: bool = True


class MonitoringSystem:
    """Real-time monitoring system with alerting."""

    def __init__(self, config: Optional[MonitoringConfig] = None):
        """Initialize monitoring system.
        
        Args:
            config: Monitoring configuration
        """
        self.config = config or MonitoringConfig()
        self.alerts: List[Alert] = []
        self.metrics_buffer: Dict[str, List[float]] = defaultdict(list)
        self.metric_thresholds: Dict[str, float] = {}
        self._lock = RLock()
        self._running = False
        self._monitor_thread: Optional[Thread] = None

    def set_metric_threshold(self, metric_name: str, threshold: float) -> None:
        """Set threshold for a metric.
        
        Args:
            metric_name: Name of metric
            threshold: Threshold value
        """
        with self._lock:
            self.metric_thresholds[metric_name] = threshold

    def record_metric(self, metric_name: str, value: float) -> None:
        """Record metric value.
        
        Args:
            metric_name: Name of metric
            value: Metric value
        """
        with self._lock:
            self.metrics_buffer[metric_name].append(value)
            
            # Trim buffer if too large
            if len(self.metrics_buffer[metric_name]) > self.config.buffer_size:
                self.metrics_buffer[metric_name] = self.metrics_buffer[metric_name][-self.config.buffer_size:]
            
            # Check threshold
            if metric_name in self.metric_thresholds:
                threshold = self.metric_thresholds[metric_name]
                if value > threshold:
                    self._create_alert(metric_name, value, threshold)

    def _create_alert(self, metric_name: str, value: float, threshold: float) -> None:
        """Create alert for threshold violation.
        
        Args:
            metric_name: Name of metric
            value: Metric value
            threshold: Threshold value
        """
        alert = Alert(
            id=f"{metric_name}_{datetime.now().timestamp()}",
            metric_name=metric_name,
            severity=AlertSeverity.WARNING,
            message=f"{metric_name} exceeded threshold: {value:.2f} > {threshold:.2f}",
            timestamp=datetime.now(),
            value=value,
            threshold=threshold
        )
        self.alerts.append(alert)

    def get_active_alerts(self) -> List[Alert]:
        """Get active alerts within retention period.
        
        Returns:
            List of active alerts
        """
        with self._lock:
            cutoff_time = datetime.now() - timedelta(seconds=self.config.alert_retention)
            return [a for a in self.alerts if a.timestamp > cutoff_time and a.severity != AlertSeverity.RESOLVED]

    def get_metric_stats(self, metric_name: str) -> Dict:
        """Get statistics for a metric.
        
        Args:
            metric_name: Name of metric
            
        Returns:
            Dictionary with metric statistics
        """
        with self._lock:
            values = self.metrics_buffer.get(metric_name, [])
            if not values:
                return {}
            
            import statistics
            return {
                "count": len(values),
                "mean": statistics.mean(values),
                "median": statistics.median(values),
                "min": min(values),
                "max": max(values),
                "stdev": statistics.stdev(values) if len(values) > 1 else 0.0
            }

    def start_monitoring(self) -> None:
        """Start monitoring system."""
        if not self._running:
            self._running = True

    def stop_monitoring(self) -> None:
        """Stop monitoring system."""
        self._running = False

    def resolve_alert(self, alert_id: str) -> None:
        """Mark alert as resolved.
        
        Args:
            alert_id: Alert ID
        """
        with self._lock:
            for alert in self.alerts:
                if alert.id == alert_id:
                    alert.severity = AlertSeverity.RESOLVED
                    break
